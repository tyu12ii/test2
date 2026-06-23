/* ============================================================
   SCRIPT.JS — Main JavaScript for the Arabic RTL hub page
   ============================================================
   This file handles:
   1. Loading data from data.json
   2. Rendering item cards dynamically
   3. Live search filtering (by title)
   4. Category filtering (game / app / all)
   5. Combined search + category filtering
   6. Injecting Schema.org JSON-LD into the <head>
   ============================================================ */

// ─── State Variables ───
let allItems = [];            // Full list of items from data.json
let activeFilter = "all";     // Current category filter: "all", "game", or "app"
let searchQuery = "";         // Current search text

// ─── DOM Element References ───
const cardGrid = document.getElementById("cardGrid");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");


/* ----------------------------------------------------------
   fetchData()
   Fetches data.json, stores it, renders cards, and injects
   the Schema.org structured data into <head>.
   ---------------------------------------------------------- */
async function fetchData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Failed to load data.json");

    allItems = await response.json();

    // Sort by date_added descending (newest first)
    allItems.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

    renderCards();
    injectSchemaLD();
  } catch (error) {
    console.error("Error loading data:", error);
    cardGrid.innerHTML = '<p style="text-align:center; color:#64748b;">حدث خطأ أثناء تحميل البيانات. حاول تحديث الصفحة.</p>';
  }
}


/* ----------------------------------------------------------
   getFilteredItems()
   Returns items that match both the active category filter
   and the current search query.
   ---------------------------------------------------------- */
function getFilteredItems() {
  return allItems.filter(function (item) {
    // Category filter
    const matchesCategory = activeFilter === "all" || item.category === activeFilter;

    // Search filter — case-insensitive title search
    // Arabic has no case, but we normalize for safety
    const matchesSearch = searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });
}


/* ----------------------------------------------------------
   renderCards()
   Clears the grid and renders cards for all filtered items.
   Shows the "no results" message when the list is empty.
   ---------------------------------------------------------- */
function renderCards() {
  const filtered = getFilteredItems();

  // Toggle visibility of grid and no-results message
  if (filtered.length === 0) {
    cardGrid.innerHTML = "";
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  // Build all card HTML
  const cardsHTML = filtered.map(function (item) {
    // Category badge label and CSS modifier class
    const categoryLabel = item.category === "game" ? "لعبة" : "تطبيق";
    const categoryClass = item.category === "game" ? "category-badge--game" : "category-badge--app";

    // Reward hook badge — only render if the field is non-empty
    const rewardHTML = item.reward_hook
      ? '<span class="reward-badge">' + escapeHTML(item.reward_hook) + '</span>'
      : '';

    return (
      '<a href="' + escapeHTML(item.url) + '" class="card">' +
        '<div class="card-image-wrapper">' +
          '<img class="card-image" src="' + escapeHTML(item.image) + '" alt="' + escapeHTML(item.title) + '" loading="lazy">' +
          rewardHTML +
        '</div>' +
        '<div class="card-body">' +
          '<h2 class="card-title">' + escapeHTML(item.title) + '</h2>' +
          '<p class="card-description">' + escapeHTML(item.description) + '</p>' +
          '<span class="category-badge ' + categoryClass + '">' + categoryLabel + '</span>' +
        '</div>' +
      '</a>'
    );
  }).join("");

  cardGrid.innerHTML = cardsHTML;
}


/* ----------------------------------------------------------
   escapeHTML(str)
   Basic HTML escaping to prevent XSS when inserting
   user/data-provided strings into innerHTML.
   ---------------------------------------------------------- */
function escapeHTML(str) {
  if (!str) return "";
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}


/* ----------------------------------------------------------
   injectSchemaLD()
   Builds a Schema.org ItemList from the loaded data and
   injects it as a <script type="application/ld+json"> tag
   in the <head>.
   ---------------------------------------------------------- */
function injectSchemaLD() {
  // Build the ListItem array from all items
  var listItems = allItems.map(function (item, index) {
    return {
      "@type": "ListItem",
      "position": index + 1,
      "name": item.title,
      "url": "https://www.example.com" + item.url,
      "image": "https://www.example.com/" + item.image
    };
  });

  // Full ItemList schema
  var schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "أفضل الألعاب والتطبيقات",
    "description": "مجموعة مختارة من أفضل الألعاب والتطبيقات مع مكافآت وهدايا حصرية.",
    "numberOfItems": allItems.length,
    "itemListElement": listItems
  };

  // Create the script element and append to <head>
  var scriptTag = document.createElement("script");
  scriptTag.type = "application/ld+json";
  scriptTag.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(scriptTag);
}


/* ----------------------------------------------------------
   Event Listeners
   ---------------------------------------------------------- */

// Live search — update on every keystroke
searchInput.addEventListener("input", function () {
  searchQuery = this.value.trim();
  renderCards();
});

// Category filter buttons
filterButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    // Update active state visually
    filterButtons.forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");

    // Update the filter and re-render
    activeFilter = btn.getAttribute("data-filter");
    renderCards();
  });
});


/* ----------------------------------------------------------
   Initialization — load data when the page is ready
   ---------------------------------------------------------- */
fetchData();
