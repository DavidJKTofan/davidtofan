---
title: World of Opportunities
date: 2021-12-01
description: Free resource platform for entrepreneurs and students who are eager to discover useful links, gaining access to resources, tools and opportunities to reach their goals.
website: ""
showTableOfContents: false
aliases:
  - /projects/world-of-opportunities/
  - /world/
---

The World of Opportunities is a free resource platform for entrepreneurs and students who are eager to discover useful links, gaining access to resources, tools and opportunities to reach their goals. This is a personal pet project... Hope it is useful to someone! 🤓

<p id="Google_Charts_Here">Work in progress...</p>

<!-- STYLESHEET CSS -->
<style>
  
  /* Mobile */
  @media only screen and (max-width: 600px) {
    .article-container {
      max-width: 380px !important;
      margin: 0 auto;
    }
  }
  
  /* Desktop */
  @media only screen and (min-width: 768px) {
    .article-container {
      max-width: 80% !important;
      padding: 0 20px;
      margin: 0 auto;
    }
  }

  .filter .google-visualization-controls-categoryfilter-selected li {
    background-color: rgb(1, 0, 113);
    border: 1px solid rgb(1, 0, 113);
    color: #FFFFFF;
    padding: 1px;
    padding-right: 7px;
    padding-left: 7px;
    padding-top: 7px;
    padding-bottom: 7px;
    margin-right: 5px;
    margin-bottom:5px;
    font-size: 10px;
  }

  .filter .goog-link-button {
    cursor: pointer;
    float: right;
    margin-left: 4px;
  }

  .filter2 .google-visualization-controls-categoryfilter-selected li {
    background-color: rgb(1, 0, 113, 0.8);
    border: 1px solid rgb(1, 0, 113, 0.5);
    color: #FFFFFF;
    padding: 1px;
    padding-right: 7px;
    padding-left: 7px;
    padding-top: 7px;
    padding-bottom: 7px;
    margin-right: 5px;
    margin-bottom:5px;
    font-size: 10px;
  }

  .filter2 .goog-link-button {
    cursor: pointer;
    float: right;
    margin-left: 4px;
  }

  .goog-menu-vertical {
    max-height: 100vh;
    overflow-y: auto;
    overflow: scroll;
  }

  th {
    padding-top: 12px;
    padding-bottom: 12px;
    border-color: rgb(151, 150, 168);
    color: #FFFFFF;
  }

  .headerRow {
    background-color: rgb(15, 23, 42);
    font-family: 'Roboto', sans-serif;
    font-weight: bold;
    font-size: 18px;
    color: #FFFFFF;
  }

  .hoverTableRow {
    background-color: #2f59ad !important;
  }

  .tableCell {
    font-family: 'Roboto', sans-serif;
    font-size: 14px;
    padding-top: 10px;
    padding-right: 10px;
    padding-bottom: 10px;
    padding-left: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    margin-right: 10px;
    margin-left: 10px;
    height: 20px !important;
  }

  .google-visualization-table-table {
    background: none;
  }

  input {
    color: #000;
    font-family: inherit;
    font-size: 100%;
    line-height: inherit;
    margin: 0;
    padding: 0;
  }

  .table_style {
    border-collapse: collapse;
    table-layout: fixed;
  }

  .table_style tbody{
    overflow: auto;
    height: 20px;
  }
  
  /* COLUMN 1 */
  .table_style td:nth-child(1) {
    font-weight: bold;
    width: 35vw;
  }
  
  /* COLUMN 2 */
  .table_style td:nth-child(2) {
    font-size: 10px;
    width: 30vw;
  }
  
  /* COLUMN 3 */
  .table_style td:nth-child(3) {
    text-align: center;
    width: 35vw;
  }
  .table_style td:nth-child(3) a {
    text-decoration: none;
  }
  .table_style td:nth-child(3) a:hover {
    text-decoration: none;
    color: rgb(1, 0, 113);
    font-weight: bold;
    cursor: pointer;
  }
  .table_style td:nth-child(3) a:visited {
    color: rgb(250, 157, 27);
  }

  /* Custom Page Size */

  .prose {
    color: var(--tw-prose-body);
    max-width: 85ch;
  }
  
</style>

<!-- Chart here -->
  <div id="dashboard" style="width: 100%; margin-top:40px; margin-bottom:40px;">
    <div class="row">
      <div>
        <div id="category_div" style="font-size: 15px; float:left; height:60px; margin:15px; margin-bottom:40px;"></div>
      </div>
      <div>
        <div id="category_2_div" style="font-size: 15px; float:left; height:60px; margin:15px; margin-left:60px;"></div>
      </div>
      <div>
        <div style="position:relative; float:right; height:40px; margin:15px; margin-left:80px">
          <p style="font-size:12px; color: #808080; margin-bottom: 5px;">Try searching for "MOOCs"</p>
          <div id="string_div" style="font-size: 15px;"></div>
        </div>
      </div>
    </div>
    <div style="width:100%; margin-top:40px; overflow-x:auto;">
      <table id="chart_div"></table>
    </div>
  </div>

<!-- Google Charts JavaScript Dependencies -->
<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
<script type="text/javascript">

  //If specific content exists on page, run Google Charts
  try {
    var world_charts = document.getElementById("Google_Charts_Here").innerHTML;
  }
  catch(err) {
    var world_charts = null
  }

  if(world_charts == 'Work in progress...'){

      console.log('Loading Google Charts on this site.');

      google.charts.load('current', {
        callback: function() {
          var query = new google.visualization.Query(
            'https://docs.google.com/spreadsheets/d/1E2lE8EJoZSu0NeG76Yyq7ai6zCHb7jILXjCqKMQMD0I/gviz/tq?sheet=resources&headers=1&tq='
          );
          query.setQuery('SELECT A, B, C, D, E, F, G, H');
          // query.setRefreshInterval(10)
          query.send(drawDashboard);
        },
        packages: ['controls', 'table']
      });

      function drawDashboard(response) {
        if (response.isError()) {
          console.log('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
          return;
        }

        var data = response.getDataTable();

        var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard'));

        // DROPDOWN FILTER
        var controlCat = new google.visualization.ControlWrapper({
          controlType: 'CategoryFilter',
          containerId: 'category_div',
          options: {
            filterColumnIndex: 3, // Main Category 1
            ui: {
              labelStacking: 'vertical',
              allowTyping: false,
              allowMultiple: true,
              labelSeparator: ':',
              caption: 'Choose',
              label: 'Category',
              sortValues: true,
              allowNone: true,
              cssClass: 'filter',
              selectedValuesLayout: 'below'
            }
          }
        });

        // DROPDOWN FILTER
        var controlSubCat = new google.visualization.ControlWrapper({
          controlType: 'CategoryFilter',
          containerId: 'category_2_div',
          options: {
            filterColumnIndex: 5, // Sub Category
            ui: {
              labelStacking: 'vertical',
              allowTyping: false,
              allowMultiple: true,
              labelSeparator: ':',
              caption: 'Choose',
              label: 'Sub-Category',
              sortValues: true,
              allowNone: true,
              cssClass: 'filter2',
              selectedValuesLayout: 'below'
            }
          }
        });

        // STRING FILTER
        // create a list of columns for the dashboard
        var columns = [{
          // this column aggregates all of the data into one column
          // for use with the string filter
          type: 'string',
          calc: function(dt, row) {
            for (var i = 0, vals = [], cols = dt.getNumberOfColumns(); i < cols; i++) {
              vals.push(dt.getFormattedValue(row, i));
            }
            return vals.join('\n');
          }
        }];
        for (var i = 0, cols = data.getNumberOfColumns(); i < cols; i++) {
          columns.push(i);
        }

        // Define a slider control for the 'Donuts eaten' column
        var controlString = new google.visualization.ControlWrapper({
          controlType: 'StringFilter',
          containerId: 'string_div',
          options: {
            filterColumnIndex: 0,
            matchType: 'any',
            caseSensitive: false,
            ui: {
              label: 'Search',
              labelSeparator: ':',
            }
          },
          view: {
            columns: columns
          }
        });

        // TABLE STYLE CSS
        var cssClassNames = {
          headerRow: 'headerRow',
          tableRow: 'tableRow',
          oddTableRow: 'oddTableRow',
          selectedTableRow: 'selectedTableRow',
          hoverTableRow: 'hoverTableRow',
          headerCell: 'headerCell',
          tableCell: 'tableCell',
          rowNumberCell: 'rowNumberCell'
        };

        // TABLE CHART
        var table = new google.visualization.ChartWrapper({
          chartType: 'Table',
          containerId: 'chart_div',
          options: {
            allowHtml: true,
            cssClassNames: cssClassNames,
            width: '100%', // 100vw
            height: '100%',
            page: 'enable',
            pageSize: 20,
            pagingSymbols: {
              prev: 'prev',
              next: 'next'
            },
            pagingButtons: 7
          },
          view: {
            columns: [0, 1, 2] // View first 3 columns
          }
        });

        // TABLE COLUMN WIDTH - FIRST CELLS
        data.setProperty(0, 0, 'style', 'width:25%'); // 20vw
        data.setProperty(0, 1, 'style', 'width:50%'); // 50vw
        data.setProperty(0, 2, 'style', 'width:25%'); // 30vw

        // // FORMATTER
        // hyperlink URL column
        var format_url = new google.visualization.PatternFormat(
          '<a href="{0}" target="_blank" rel="nofollow">{0}</a>');
        // extract the third column for format_url variable
        format_url.format(data, [2]);

        // Use DataView to create read-only view for data.table
        var view = new google.visualization.DataView(data);

        // DEPENDENCIES
        dashboard.bind(controlCat, controlSubCat);
        dashboard.bind([controlCat, controlSubCat, controlString], table);
        // DRAW
        dashboard.draw(view);
      }

 } else{
    console.log('Google Charts not on this site.');
}
</script>

---

## Disclaimer

For educational purposes only. This project is independent and not affiliated with any specific company or institution. The content and illustrations presented herein are for informational purposes and do not necessarily reflect the views or opinions of any particular entity or individual.
