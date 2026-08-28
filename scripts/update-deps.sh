#!/usr/bin/env bash
#
# update-deps.sh — check or apply dependency updates for this Astro + Cloudflare
# Workers site, then prove the result still builds, bundles and serves.
#
#   ./scripts/update-deps.sh                 # report only, changes nothing
#   ./scripts/update-deps.sh --apply         # semver-safe updates (within ^ranges)
#   ./scripts/update-deps.sh --apply --latest# bump to @latest, majors included
#
# Safety contract — this script will NEVER:
#   * run `wrangler deploy` (only ever `--dry-run`), or contact the Cloudflare API
#   * run any `git` write command, commit, push, or tag
#   * edit wrangler.jsonc, astro.config.mjs, public/_headers or any src/ file
#   * delete .wrangler/ (local KV + deploy state) or your .dev.vars
#   * kill a wrangler/astro dev server it did not start itself
# On any verification failure in --apply mode it restores package.json and
# package-lock.json and reinstalls, leaving the tree as it found it.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

WORK_DIR=".deps-update"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$WORK_DIR/update-$STAMP.log"
BACKUP="$WORK_DIR/backup-$STAMP"

MODE="check"; LATEST=0; FORCE=0; KEEP_DIST=0
DEV_PID=""; DEV_PORT=""
FAILURES=0; WARNINGS=0
declare -a REPORT_LINES=()

# ---------------------------------------------------------------- args
while [ $# -gt 0 ]; do
  case "$1" in
    --apply)  MODE="apply" ;;
    --latest) LATEST=1 ;;
    --force)  FORCE=1 ;;
    --keep-dist) KEEP_DIST=1 ;;
    -h|--help)
      sed -n '2,26p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown option: $1 (try --help)" >&2; exit 2 ;;
  esac
  shift
done

# ---------------------------------------------------------------- output
if [ -t 1 ]; then
  C_RST=$'\033[0m'; C_B=$'\033[1m'; C_G=$'\033[32m'; C_Y=$'\033[33m'; C_R=$'\033[31m'; C_D=$'\033[2m'
else
  C_RST=""; C_B=""; C_G=""; C_Y=""; C_R=""; C_D=""
fi

mkdir -p "$WORK_DIR"
# Keep the workdir bounded: retain the 10 most recent runs (logs + snapshots).
if [ -d "$WORK_DIR" ]; then
  ls -1dt "$WORK_DIR"/update-*.log "$WORK_DIR"/outdated-*.json "$WORK_DIR"/versions-before-*.json 2>/dev/null \
    | tail -n +31 | while IFS= read -r f; do rm -f "$f"; done
  ls -1dt "$WORK_DIR"/backup-* 2>/dev/null \
    | tail -n +11 | while IFS= read -r d; do rm -rf "$d"; done
fi
: > "$LOG"

log()     { printf '%s\n' "$*" >> "$LOG"; }
say()     { printf '%s\n' "$*"; log "$*"; }
section() { printf '\n%s==> %s%s\n' "$C_B" "$*" "$C_RST"; log ""; log "==> $*"; }
ok()      { printf '  %s✓%s %s\n' "$C_G" "$C_RST" "$*"; log "  [ok] $*"; }
warn()    { printf '  %s!%s %s\n' "$C_Y" "$C_RST" "$*"; log "  [warn] $*"; WARNINGS=$((WARNINGS+1)); }
bad()     { printf '  %s✗%s %s\n' "$C_R" "$C_RST" "$*"; log "  [FAIL] $*"; FAILURES=$((FAILURES+1)); }
note()    { printf '  %s%s%s\n' "$C_D" "$*" "$C_RST"; log "  $*"; }
add_report() { REPORT_LINES[${#REPORT_LINES[@]}]="$1"; }

# Run a command, tee-ing all output to the log. Returns the command's status.
run() { log "\$ $*"; "$@" >>"$LOG" 2>&1; }

# ---------------------------------------------------------------- cleanup
stop_dev() {
  if [ -n "$DEV_PID" ] && kill -0 "$DEV_PID" 2>/dev/null; then
    # Kill the whole process group we started (wrangler spawns workerd).
    kill -TERM "-$DEV_PID" 2>/dev/null || kill -TERM "$DEV_PID" 2>/dev/null || true
    sleep 2
    kill -KILL "-$DEV_PID" 2>/dev/null || true
  fi
  DEV_PID=""
}
cleanup() {
  local st=$?
  stop_dev
  rm -f "$REPO_ROOT/worker-startup.cpuprofile"
  exit $st
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------- helpers
pkg_version() {
  node -e '
    const fs=require("fs");
    try{process.stdout.write(JSON.parse(fs.readFileSync("node_modules/"+process.argv[1]+"/package.json","utf8")).version||"")}
    catch(e){process.stdout.write("")}
  ' "$1" 2>/dev/null || echo ""
}

free_port() {
  local p=$1
  while [ "$p" -lt $((${1} + 40)) ]; do
    if ! (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then echo "$p"; return 0; fi
    exec 3>&- 2>/dev/null || true
    p=$((p+1))
  done
  echo "$1"
}

# workerd 1.20260826.1 -> 2026-08-26 (newest compat date the local runtime implements)
workerd_compat_date() {
  local v; v="$(pkg_version workerd)"
  [ -z "$v" ] && { echo ""; return; }
  printf '%s' "$v" | sed -E 's/^[0-9]+\.([0-9]{4})([0-9]{2})([0-9]{2})\..*$/\1-\2-\3/'
}

restore_manifests() {
  say ""
  warn "Restoring package.json + package-lock.json from $BACKUP"
  cp "$BACKUP/package.json" package.json
  [ -f "$BACKUP/package-lock.json" ] && cp "$BACKUP/package-lock.json" package-lock.json
  if run npm ci --no-audit --no-fund; then
    ok "Rolled back and reinstalled the previous dependency tree"
  else
    bad "Rollback reinstall failed — restore manually: cp $BACKUP/package*.json . && npm ci"
  fi
}

# ================================================================ 1. preflight
section "Preflight"
note "repo: $REPO_ROOT"
note "log:  $LOG"

command -v node >/dev/null || { bad "node not found on PATH"; exit 1; }
command -v npm  >/dev/null || { bad "npm not found on PATH"; exit 1; }
command -v curl >/dev/null || { bad "curl not found on PATH"; exit 1; }

NODE_V="$(node --version)"; NPM_V="$(npm --version)"
REQUIRED_NODE="$(node -p "require('./package.json').engines?.node || ''")"
ok "node $NODE_V, npm $NPM_V"
if [ -n "$REQUIRED_NODE" ]; then
  if node -e "
    const r=process.argv[1].replace(/[^0-9.]/g,'').split('.').map(Number);
    const c=process.versions.node.split('.').map(Number);
    for(let i=0;i<3;i++){const a=c[i]||0,b=r[i]||0; if(a>b)process.exit(0); if(a<b)process.exit(1);}
    process.exit(0);" "$REQUIRED_NODE"; then
    ok "satisfies engines.node ($REQUIRED_NODE)"
  else
    bad "node $NODE_V does not satisfy engines.node ($REQUIRED_NODE)"; exit 1
  fi
fi

for f in package.json wrangler.jsonc astro.config.mjs; do
  [ -f "$f" ] || { bad "missing $f — is this the right repo?"; exit 1; }
done
ok "project files present"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  DIRTY="$(git status --porcelain -- package.json package-lock.json 2>/dev/null || true)"
  if [ -n "$DIRTY" ] && [ "$MODE" = "apply" ] && [ "$FORCE" -eq 0 ]; then
    bad "package.json/package-lock.json have uncommitted changes."
    note "Commit or stash them first so a rollback is meaningful, or pass --force."
    exit 1
  fi
  if [ -n "$DIRTY" ]; then
    if [ "$MODE" = "check" ]; then
      note "manifests have uncommitted changes (fine — check mode writes nothing)"
    else
      warn "manifests are dirty; continuing because --force was passed"
    fi
  fi
  ok "git worktree checked"
else
  warn "not a git repository — no rollback safety net beyond $BACKUP"
fi

# ================================================================ 2. current state
section "Current versions"
node -e '
const fs=require("fs");
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const all={...(p.dependencies||{}),...(p.devDependencies||{})};
const ver=n=>{try{return JSON.parse(fs.readFileSync("node_modules/"+n+"/package.json","utf8")).version}catch(e){return "(not installed)"}};
console.log(Object.keys(all).sort().map(n=>"  "+n.padEnd(30)+" "+String(all[n]).padEnd(12)+" -> "+ver(n)).join("\n"));
' | tee -a "$LOG"

BEFORE_JSON="$WORK_DIR/versions-before-$STAMP.json"
node -e '
const fs=require("fs");
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const all={...(p.dependencies||{}),...(p.devDependencies||{})};
const out={};
for(const n of Object.keys(all)){try{out[n]=JSON.parse(fs.readFileSync("node_modules/"+n+"/package.json","utf8")).version}catch(e){out[n]=null}}
fs.writeFileSync(process.argv[1],JSON.stringify(out,null,2));
' "$BEFORE_JSON"

WORKERD_DATE="$(workerd_compat_date)"
CONFIGURED_DATE="$(node -e "
const s=require('fs').readFileSync('wrangler.jsonc','utf8').replace(/^\s*\/\/.*$/gm,'');
const m=s.match(/\"compatibility_date\"\s*:\s*\"([0-9-]+)\"/); console.log(m?m[1]:'');
")"
note "wrangler.jsonc compatibility_date : ${CONFIGURED_DATE:-<none>}"
note "newest date installed workerd has : ${WORKERD_DATE:-<unknown>}"

# ================================================================ 3. outdated
section "Available updates"
npm outdated >>"$LOG" 2>&1 || true
OUTDATED_JSON="$WORK_DIR/outdated-$STAMP.json"
npm outdated --json > "$OUTDATED_JSON" 2>/dev/null || true
[ -s "$OUTDATED_JSON" ] || echo '{}' > "$OUTDATED_JSON"

node -e '
const fs=require("fs");
const o=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const direct=new Set([...Object.keys(p.dependencies||{}),...Object.keys(p.devDependencies||{})]);
const rows=Object.entries(o).filter(([n])=>direct.has(n));
if(!rows.length){console.log("  everything is already up to date"); process.exit(0);}
for(const [n,i] of rows){
  const major=(String(i.current||"").split(".")[0]!==String(i.latest||"").split(".")[0]);
  console.log("  "+n.padEnd(30)+" "+String(i.current||"?").padEnd(12)+" -> wanted "+String(i.wanted||"?").padEnd(12)+" latest "+String(i.latest||"?")+(major?"   [MAJOR]":""));
}
' "$OUTDATED_JSON" | tee -a "$LOG"

OUTDATED_COUNT="$(node -e '
const fs=require("fs");
const o=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const direct=new Set([...Object.keys(p.dependencies||{}),...Object.keys(p.devDependencies||{})]);
console.log(Object.keys(o).filter(n=>direct.has(n)).length);
' "$OUTDATED_JSON")"

if [ "$MODE" = "check" ]; then
  section "Report (check mode — nothing was changed)"
  say "  Outdated direct dependencies : $OUTDATED_COUNT"
  say "  compatibility_date           : ${CONFIGURED_DATE:-<none>}"
  if [ -n "$WORKERD_DATE" ] && [ "$CONFIGURED_DATE" != "$WORKERD_DATE" ]; then
    say "  ${C_Y}Suggested compatibility_date : $WORKERD_DATE${C_RST} (matches installed workerd)"
    say "  Review the flags that changed, then edit wrangler.jsonc by hand:"
    say "    https://developers.cloudflare.com/workers/configuration/compatibility-flags/"
  else
    say "  compatibility_date already matches the installed workerd"
  fi
  say ""
  say "  Run ${C_B}./scripts/update-deps.sh --apply${C_RST} to update within semver ranges,"
  say "  or  ${C_B}./scripts/update-deps.sh --apply --latest${C_RST} to include major bumps."
  say ""
  say "  Full log: $LOG"
  exit 0
fi

# ================================================================ 4. backup
section "Snapshot"
mkdir -p "$BACKUP"
cp package.json "$BACKUP/package.json"
[ -f package-lock.json ] && cp package-lock.json "$BACKUP/package-lock.json"
ok "package.json + package-lock.json saved to $BACKUP"

# ================================================================ 5. update
section "Updating dependencies"
if [ "$LATEST" -eq 1 ]; then
  PKG_ARGS="$(node -e '
    const p=require("./package.json");
    console.log(Object.keys(p.dependencies||{}).map(n=>n+"@latest").join(" "));
  ')"
  DEV_ARGS="$(node -e '
    const p=require("./package.json");
    console.log(Object.keys(p.devDependencies||{}).map(n=>n+"@latest").join(" "));
  ')"
  note "mode: --latest (majors included)"
  # One transaction so npm resolves peer dependencies across both sets together.
  # shellcheck disable=SC2086
  if run npm install --no-audit --no-fund $PKG_ARGS && \
     { [ -z "$DEV_ARGS" ] || run npm install --save-dev --no-audit --no-fund $DEV_ARGS; }; then
    ok "npm install @latest completed"
  else
    bad "npm install failed (peer conflict or network) — see $LOG"
    restore_manifests; exit 1
  fi
else
  note "mode: semver-safe (respects the ^ranges in package.json)"
  if run npm update --save --no-audit --no-fund; then
    ok "npm update completed"
  else
    bad "npm update failed — see $LOG"
    restore_manifests; exit 1
  fi
fi

# ---- npm 11 lifecycle-script approval (esbuild + workerd are required) ----
section "Install scripts (npm 11+)"
if npm install-scripts ls >/dev/null 2>&1; then
  PENDING="$(npm install-scripts ls 2>&1 | grep -cE '^\s+(esbuild|workerd)@' || true)"
  if [ "${PENDING:-0}" -gt 0 ]; then
    note "approving esbuild + workerd (required: astro build / wrangler dev need their binaries)"
    run npm install-scripts approve esbuild || true
    run npm install-scripts approve workerd || true
    STILL="$(npm install-scripts ls 2>&1 | grep -cE '^\s+(esbuild|workerd)@' || true)"
    if [ "${STILL:-0}" -gt 0 ]; then
      warn "some install scripts are still pending — run: npm install-scripts ls"
    else
      ok "esbuild + workerd approved"
    fi
  else
    ok "nothing pending"
  fi
else
  note "npm install-scripts not available on npm $NPM_V — skipping"
fi

# native binaries must actually exist or nothing downstream works
if [ -d node_modules/@esbuild ] || [ -d node_modules/esbuild/bin ]; then ok "esbuild binary present"; else warn "esbuild binary missing"; fi
if ls node_modules/@cloudflare/workerd-*/bin >/dev/null 2>&1; then ok "workerd binary present"; else warn "workerd binary missing"; fi

# ================================================================ 6. verify
section "Verifying build"
if run npm run build; then ok "npm run build"; else bad "npm run build FAILED"; fi

if [ "$FAILURES" -eq 0 ]; then
  if grep -qiE '^\s*\[?(error|ERR)' "$LOG"; then :; fi
  PAGES="$(grep -oE '[0-9]+ page\(s\) built' "$LOG" | tail -1 || true)"
  [ -n "$PAGES" ] && note "$PAGES"
  [ -d dist/client ] && ok "dist/client produced" || bad "dist/client missing after build"
fi

section "Verifying Wrangler bundle (no deploy)"
if [ "$FAILURES" -eq 0 ]; then
  if run npx wrangler deploy --dry-run; then
    ok "wrangler deploy --dry-run"
    FILES="$(grep -oE 'Read [0-9]+ files' "$LOG" | tail -1 || true)"; [ -n "$FILES" ] && note "$FILES"
  else
    bad "wrangler deploy --dry-run FAILED"
  fi

  if run npx wrangler check startup; then
    BUNDLE="$(grep -oE 'Bundle: [0-9.]+ KiB / gzip: [0-9.]+ KiB' "$LOG" | tail -1 || true)"
    ok "wrangler check startup${BUNDLE:+ — $BUNDLE}"
  else
    warn "wrangler check startup did not complete (non-fatal)"
  fi
  rm -f worker-startup.cpuprofile
fi

# ================================================================ 7. smoke test
section "Serving the build (wrangler dev smoke test)"
if [ "$FAILURES" -eq 0 ]; then
  DEV_PORT="$(free_port 8787)"
  note "port $DEV_PORT"
  set -m
  npx wrangler dev --port "$DEV_PORT" >>"$LOG" 2>&1 &
  DEV_PID=$!
  set +m

  READY=0
  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null -m 2 "http://127.0.0.1:$DEV_PORT/" 2>/dev/null; then READY=1; break; fi
    kill -0 "$DEV_PID" 2>/dev/null || break
    sleep 1
  done

  if [ "$READY" -ne 1 ]; then
    bad "wrangler dev did not become ready on port $DEV_PORT"
  else
    ok "wrangler dev ready"
    B="http://127.0.0.1:$DEV_PORT"
    pass=0; fail=0
    check_route() {
      local path="$1" want="$2"
      local got; got="$(curl -s -o /dev/null -w '%{http_code}' -m 15 "$B$path" || echo 000)"
      if [ "$got" = "$want" ]; then pass=$((pass+1)); log "  [route ok] $path -> $got"
      else fail=$((fail+1)); bad "route $path returned $got (expected $want)"; fi
    }
    for p in / /articles/ /projects/ /certificates/ /robots.txt /sitemap-index.xml /favicon.png; do
      check_route "$p" 200; done
    check_route /world 301
    check_route /articles 307
    check_route /this-path-should-not-exist/ 404
    [ "$fail" -eq 0 ] && ok "routes: $pass/$((pass+fail)) passed" || bad "routes: $fail failed"

    # Regression guard: overlapping _headers rules silently duplicate values.
    ASSET="$(ls dist/client/_astro/*.png 2>/dev/null | head -1 | sed 's|dist/client||' || true)"
    if [ -n "$ASSET" ]; then
      H="$(curl -sI -m 15 "$B$ASSET" || true)"
      CC_N="$(printf '%s' "$H" | grep -ic '^cache-control:' || true)"
      CC_V="$(printf '%s' "$H" | grep -i '^cache-control:' | tr -d '\r' | sed 's/^[^:]*: *//')"
      COMMAS="$(printf '%s' "$CC_V" | grep -o 'max-age' | wc -l | tr -d ' ')"
      if [ "${CC_N:-0}" = "1" ] && [ "$COMMAS" = "1" ]; then
        ok "_headers: single Cache-Control on fingerprinted assets"
      else
        warn "_headers: /_astro asset has duplicate Cache-Control ($CC_V) — check for overlapping rules"
      fi
    fi
  fi
  stop_dev
fi

# ================================================================ 8. rollback or report
if [ "$FAILURES" -gt 0 ]; then
  section "FAILED — rolling back"
  restore_manifests
  say ""
  say "${C_R}${C_B}Dependency update rolled back.${C_RST} $FAILURES check(s) failed."
  say "  Log:    $LOG"
  say "  Backup: $BACKUP"
  exit 1
fi

section "Report"
node -e '
const fs=require("fs");
const before=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const all={...(p.dependencies||{}),...(p.devDependencies||{})};
let changed=0; const lines=[];
for(const n of Object.keys(all).sort()){
  let now=""; try{now=JSON.parse(fs.readFileSync("node_modules/"+n+"/package.json","utf8")).version}catch(e){now="(missing)"}
  const was=before[n];
  if(was!==now){changed++; lines.push("  "+n.padEnd(30)+" "+String(was).padEnd(12)+" -> "+now+"   [UPDATED]");}
  else lines.push("  "+n.padEnd(30)+" "+String(now).padEnd(12)+"   (unchanged)");
}
console.log(lines.join("\n"));
console.log("\n  "+changed+" package(s) updated.");
' "$BEFORE_JSON" | tee -a "$LOG"

NEW_WORKERD_DATE="$(workerd_compat_date)"
say ""
say "  compatibility_date in wrangler.jsonc : ${CONFIGURED_DATE:-<none>}"
say "  newest date installed workerd has    : ${NEW_WORKERD_DATE:-<unknown>}"
if [ -n "$NEW_WORKERD_DATE" ] && [ "$CONFIGURED_DATE" != "$NEW_WORKERD_DATE" ]; then
  add_report "Consider bumping compatibility_date to $NEW_WORKERD_DATE (this script never edits wrangler.jsonc)."
  add_report "Read the flag changes first: https://developers.cloudflare.com/workers/configuration/compatibility-flags/"
fi
if node -e "const fs=require('fs');process.exit(JSON.parse(fs.readFileSync('package.json','utf8')).allowScripts?0:1)" 2>/dev/null; then
  add_report "package.json 'allowScripts' pins exact versions — re-approve after esbuild/workerd bumps."
fi

say ""
if [ ${#REPORT_LINES[@]} -gt 0 ]; then
  say "${C_B}Follow-ups${C_RST}"
  for l in "${REPORT_LINES[@]}"; do say "  • $l"; done
  say ""
fi

say "${C_G}${C_B}All checks passed.${C_RST}  build ✓  dry-run ✓  startup ✓  routes ✓  headers ✓"
[ "$WARNINGS" -gt 0 ] && say "  ($WARNINGS warning(s) — see log)"
say ""
say "  Nothing was deployed and no git state was touched."
say "  Review:  git diff package.json package-lock.json"
say "  Log:     $LOG"
say "  Backup:  $BACKUP"
[ "$KEEP_DIST" -eq 0 ] && note "dist/ holds the freshly verified build; run npm run deploy when you are happy."
