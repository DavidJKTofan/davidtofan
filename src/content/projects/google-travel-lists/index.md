---
title: GoogleMaps Travel List
date: 2023-08-01
description: My GoogleMaps Travel Lists to explore some new places around the globe.
showTableOfContents: false
aliases:
  - /projects/google-travel-lists/
  - /travel/
status: active
tags: ["Travel", "Google Maps", "Recommendations", "Personal"]
---

During some of my journeys around the globe I try to remember the places that impacted me the most – _must-see places_ –, or simply places that I had fun seeing/visiting, or even got recommended by friends and locals. Therefore, I created a series of GoogleMaps Lists which I would like to share with you and your friends.

Hope they are useful and feel free to recommend me new places too!

I definitely recommend visiting [Kalimera Beach Hotel](https://www.kalimera.bz/) located in Placencia (South of Belize) at the Caribbean Sea.

<style>
  /* Travel Grid Styles */
  .travel-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin: 2rem 0;
  }
  
  @media (min-width: 640px) {
    .travel-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
  }
  
  @media (min-width: 1024px) {
    .travel-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
  }
  
  .travel-card {
    position: relative;
    display: block;
    aspect-ratio: 4/3;
    border-radius: 0.75rem;
    overflow: hidden;
    text-decoration: none !important;
    border: none !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .travel-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }
  
  .travel-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: none !important;
    border-radius: 0 !important;
    transition: transform 0.4s ease;
  }
  
  .travel-card:hover img {
    transform: scale(1.1);
  }
  
  .travel-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%);
    pointer-events: none;
  }
  
  .travel-card-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.75rem 1rem;
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .travel-card-label svg {
    width: 1rem;
    height: 1rem;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  .travel-card:hover .travel-card-label svg {
    opacity: 1;
    transform: translateX(0);
  }
  
  /* Remove prose styles from travel grid images */
  .prose .travel-grid img {
    margin: 0 !important;
    border: none !important;
  }
  
  .prose .travel-card {
    border-bottom: none !important;
  }
</style>

<div class="travel-grid not-prose">
  <a href="https://goo.gl/maps/xweG7kQr8jq8omd36" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/cdmx-mexico.webp" alt="Mexico City" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      CDMX
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/Rmu2vJUvN9Y8a6bV9" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/iceland-country.webp" alt="Iceland" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Iceland
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/ayVeY3vubnoMDRhK6" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/turkey.webp" alt="Turkey" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Türkiye
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/D8Fo9d9fbXcT25CM8" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/morocco.webp" alt="Morocco" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Morocco
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/HHyqSqxHs2ZR94UW8" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/belize.webp" alt="Belize" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Belize
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/86zTscXooBzyB5rt5" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/guatemala.webp" alt="Guatemala" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Guatemala
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/qA5qUYUCNLadKLTP9" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/jordan.webp" alt="Jordan" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Jordan
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/1JEc36CbsZi9HZw27" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/miami-usa.webp" alt="Miami" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Miami
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/qvcjPQ7uvk4XVBKm7" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/newyork-usa.webp" alt="New York City" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      New York
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/6yRd5DN27anUrUYA7" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/granada.webp" alt="Granada" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Granada
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/5K2mFWgBtBV84AaA7" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/florence.webp" alt="Florence" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Florence
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/UrjF3Yw5TazsLQPv9" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/milan-italy.webp" alt="Milan" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Milan
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/2tC9w1GtTQB1LPaFA" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/parma-italy.webp" alt="Parma" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Parma
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/8QbYc92sPVZwr8MLA" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/berlin.webp" alt="Berlin" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Berlin
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/n4KSVZf3ekJ84hjR7" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/cadiz-spain.webp" alt="Cadiz" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Cádiz
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/mkBBDkF7Qhfo8A5TA" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/malaga-spain.webp" alt="Malaga" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Málaga
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/uVDZCEa1vLotgps78" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/madrid-spain.webp" alt="Madrid" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Madrid
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/hgW4NTkVMnJECMa48" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/seville-spain.webp" alt="Sevilla" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Seville
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/nTyJNb5FmzRLmDya6" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/barcelona-spain.webp" alt="Barcelona" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Barcelona
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/R5pfav5PYXFutu5ZA" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/salzburg-austria.webp" alt="Salzburg" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Salzburg
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/EJLfYTQYK52T8v9i6" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/lisbon-portugal.webp" alt="Lisbon" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Lisbon
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/FP7pv556qRE5tLAU6" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/romania.webp" alt="Romania" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Romania
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/jRU7rsrGZeddLUDU6" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/rome-italy.webp" alt="Rome" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Rome
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/KmzMJEcfaZ5vkoNy6" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/munich-germany.webp" alt="Munich" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Munich
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/4FGi7FsyRsE4spNM8" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/baden-baden-germany.webp" alt="Baden-Baden" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Baden-Baden
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/CEKdSx2KLyCCzdT86" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/paris-france.webp" alt="Paris" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Paris
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/H7mSw7aMbakJ5EgW8" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/biarritz-france.webp" alt="Biarritz" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Biarritz
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/KAUGawBPehRiiXxf8" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/london-uk.webp" alt="London" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      London
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/pLRcEdderVNTi7c26" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/zurich-switzerland.webp" alt="Zurich" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Zurich
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
  <a href="https://goo.gl/maps/qWG8QBSKsyZPNLnE8" target="_blank" rel="noreferrer nofollow external" class="travel-card">
    <img src="/img/gmaps-images/galicia-spain.webp" alt="Galicia" loading="lazy">
    <div class="travel-card-overlay"></div>
    <div class="travel-card-label">
      Galicia
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
    </div>
  </a>
</div>

---

## Disclaimer

For educational purposes only. This project is independent and not affiliated with any specific company or institution. The content and illustrations presented herein are for informational purposes and do not necessarily reflect the views or opinions of any particular entity or individual.
