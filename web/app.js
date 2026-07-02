const GOALS = [
  ["all", "Alles"],
  ["comparison", "Vergelijken"],
  ["time-series", "Tijdreeks"],
  ["part-to-whole", "Samenstelling"],
  ["relationship", "Relatie"],
  ["map", "Kaart"],
  ["flow", "Flow/Proces"],
  ["kpi", "KPI"],
  ["detail", "Detail"],
];

const DATA_TYPES = [
  ["all", "Alles"],
  ["numeric", "Numeric"],
  ["categoric", "Categoric"],
  ["both", "Categoric + Numeric"],
];

const ORDER_TYPES = [
  ["all", "Alles"],
  ["ordered", "Ordered"],
  ["unordered", "Unordered"],
  ["both", "Both"],
];

const state = {
  visuals: [],
  tips: {},
  filters: {
    goal: "all",
    dataType: "all",
    orderType: "all",
  },
};

const goalOptions = document.querySelector("#goalOptions");
const dataTypeOptions = document.querySelector("#dataTypeOptions");
const orderOptions = document.querySelector("#orderOptions");
const treeCanvas = document.querySelector("#treeCanvas");
const resultCount = document.querySelector("#resultCount");

const modal = document.querySelector("#visualModal");
const closeModal = document.querySelector("#closeModal");

const modalIcon = document.querySelector("#modalIcon");
const modalCategory = document.querySelector("#modalCategory");
const modalTitle = document.querySelector("#modalTitle");
const modalComplexity = document.querySelector("#modalComplexity");
const modalWhat = document.querySelector("#modalWhat");
const modalUse = document.querySelector("#modalUse");
const modalNot = document.querySelector("#modalNot");

const tooltipTemplate = document.querySelector("#tooltipTemplate");

init();

async function init() {
  let data = window.CATALOG_DATA;
  if (!data) {
    const response = await fetch("visuals.json");
    data = await response.json();
  }

  state.visuals = data.visuals;
  state.tips = data.tooltips;

  renderChoices(goalOptions, GOALS, "goal");
  renderChoices(dataTypeOptions, DATA_TYPES, "dataType", true);
  renderChoices(orderOptions, ORDER_TYPES, "orderType", true);

  renderTree();
}

function renderChoices(container, options, key, includeTooltips = false) {
  container.innerHTML = "";

  options.forEach(([value, label]) => {
    const button = document.createElement("button");
    button.className = `choice${state.filters[key] === value ? " active" : ""}`;
    button.type = "button";
    button.textContent = label;

    if (includeTooltips && state.tips[value]) {
      button.classList.add("has-tooltip");
      button.addEventListener("mouseenter", () => showTooltip(button, state.tips[value]));
      button.addEventListener("mouseleave", () => hideTooltip(button));
      button.addEventListener("focus", () => showTooltip(button, state.tips[value]));
      button.addEventListener("blur", () => hideTooltip(button));
    }

    button.addEventListener("click", () => {
      state.filters[key] = value;
      refreshControls();
      renderTree();
    });

    container.appendChild(button);
  });
}

function showTooltip(target, data) {
  if (!tooltipTemplate || target.querySelector(".tooltip")) {
    return;
  }

  const node = tooltipTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".tooltip-title").textContent = data.title;
  node.querySelector(".tooltip-description").textContent = data.description;

  const list = node.querySelector(".tooltip-list");
  data.examples.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  target.appendChild(node);
}

function hideTooltip(target) {
  target.querySelector(".tooltip")?.remove();
}

function refreshControls() {
  renderChoices(goalOptions, GOALS, "goal");
  renderChoices(dataTypeOptions, DATA_TYPES, "dataType", true);
  renderChoices(orderOptions, ORDER_TYPES, "orderType", true);
}

function renderTree() {
  const filtered = state.visuals.filter(matchesFilters);
  resultCount.textContent = `${filtered.length} visuals`;

  if (!filtered.length) {
    treeCanvas.innerHTML = '<p class="empty">Geen match met deze selectie. Kies bijvoorbeeld DataType = Alles of Order = Both.</p>';
    return;
  }

  treeCanvas.innerHTML = "";
  filtered.forEach((visual) => {
    const node = document.createElement("button");
    node.className = "visual-node";
    node.type = "button";
    node.innerHTML = `
      <div class="visual-icon">${buildIconMarkup(visual)}</div>
      <div class="visual-name">${visual.name}</div>
      <div class="visual-meta">${visual.category} · ${visual.orderType}</div>
    `;

    node.addEventListener("click", () => openModal(visual));
    treeCanvas.appendChild(node);
  });
}

function buildIconMarkup(visual) {
  if (visual.iconPath) {
    const source = normalizeIconPath(visual.iconPath);
    const alt = escapeHtml(`${visual.name || "Visual"} icoon`);
    return `<img class="visual-icon-image" src="${source}" alt="${alt}" loading="lazy">`;
  }

  if (visual.svgIcon) {
    return visual.svgIcon;
  }

  return '<span class="icon-placeholder">Geen icoon</span>';
}

function normalizeIconPath(pathValue) {
  const rawPath = String(pathValue || "").trim().replaceAll("\\", "/");

  if (!rawPath) {
    return "";
  }

  if (
    rawPath.startsWith("./") ||
    rawPath.startsWith("../") ||
    rawPath.startsWith("/") ||
    /^https?:/i.test(rawPath) ||
    /^data:/i.test(rawPath)
  ) {
    return rawPath;
  }

  if (rawPath.startsWith("icons/")) {
    return `../${rawPath}`;
  }

  return rawPath;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function matchesFilters(visual) {
  const goalMatch = state.filters.goal === "all" || visual.goal === state.filters.goal;
  const dataTypeMatch =
    state.filters.dataType === "all" ||
    visual.dataType === state.filters.dataType ||
    visual.dataType === "both";

  const orderMatch =
    state.filters.orderType === "all" ||
    visual.orderType === state.filters.orderType ||
    visual.orderType === "both";

  return goalMatch && dataTypeMatch && orderMatch;
}

function openModal(visual) {
  modalIcon.innerHTML = buildIconMarkup(visual);
  modalCategory.textContent = visual.category || "Onbekende categorie";
  modalTitle.textContent = visual.name;
  modalComplexity.textContent = `Complexiteit: ${visual.complexity}`;
  modalWhat.textContent = visual.whatIsIt || "Nog niet ingevuld.";
  modalUse.textContent = visual.whenToUse || "Nog niet ingevuld.";
  modalNot.textContent = visual.whenNotToUse || "Nog niet ingevuld.";

  modal.showModal();
}

closeModal.addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => {
  const rect = modal.getBoundingClientRect();
  const inDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!inDialog) {
    modal.close();
  }
});
