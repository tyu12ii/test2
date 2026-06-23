/* ============================================================
   SCRIPT.JS — Main JavaScript for the Arabic RTL hub page
   ============================================================ */

let allItems   = [];
let activeFilter = "all";
let searchQuery  = "";

const cardGrid    = document.getElementById("cardGrid");
const noResults   = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

async function fetchData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Failed to load data.json");
    allItems = await response.json();
    allItems.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
    renderCards();
    injectSchemaLD();
  } catch (error) {
    console.error("Error loading data:", error);
    cardGrid.innerHTML = '<p style="text-align:center;color:#64748b;">حدث خطأ أثناء تحميل البيانات.</p>';
  }
}

function getFilteredItems() {
  return allItems.filter(function (item) {
    const matchesCategory = activeFilter === "all" || item.category === activeFilter;
    const matchesSearch   = searchQuery === "" || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

function renderCards() {
  const filtered = getFilteredItems();
  if (filtered.length === 0) {
    cardGrid.innerHTML = "";
    noResults.style.display = "block";
    return;
  }
  noResults.style.display = "none";
  cardGrid.innerHTML = filtered.map(function (item) {
    const categoryLabel = item.category === "game" ? "لعبة" : "تطبيق";
    const categoryClass = item.category === "game" ? "category-badge--game" : "category-badge--app";
    const rewardHTML    = item.reward_hook ? '<span class="reward-badge">' + escapeHTML(item.reward_hook) + '</span>' : '';
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
}

function escapeHTML(str) {
  if (!str) return "";
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function injectSchemaLD() {
  var listItems = allItems.map(function (item, index) {
    return { "@type": "ListItem", "position": index + 1, "name": item.title, "url": "https://www.example.com" + item.url, "image": "https://www.example.com/" + item.image };
  });
  var schema = { "@context": "https://schema.org", "@type": "ItemList", "name": "أفضل الألعاب والتطبيقات", "description": "مجموعة مختارة من أفضل الألعاب والتطبيقات مع مكافآت وهدايا حصرية.", "numberOfItems": allItems.length, "itemListElement": listItems };
  var scriptTag = document.createElement("script");
  scriptTag.type = "application/ld+json";
  scriptTag.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(scriptTag);
}

searchInput.addEventListener("input", function () { searchQuery = this.value.trim(); renderCards(); });

filterButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    filterButtons.forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    activeFilter = btn.getAttribute("data-filter");
    renderCards();
  });
});

fetchData();
