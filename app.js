const STORAGE_KEY = "inventario-sopas-perico-books-v1";
const AUTH_KEY = "inventario-sopas-perico-auth-v1";
const SESSION_KEY = "inventario-sopas-perico-session-v1";
const LOW_STOCK_LIMIT = 2;
const SEARCH_DEBOUNCE_MS = 120;
const DEMO_CREDENTIALS = {
  username: "admin",
  password: "perico123",
};

const initialBooks = [
  {
    id: "b1",
    title: "Cien anios de soledad",
    author: "Gabriel Garcia Marquez",
    category: "Novela",
    isbn: "9780307474728",
    shelf: "A-2",
    copies: 5,
    status: "disponible",
    updatedAt: "2026-04-10T16:32:00.000Z",
  },
  {
    id: "b2",
    title: "Pedro Paramo",
    author: "Juan Rulfo",
    category: "Novela",
    isbn: "9786073141321",
    shelf: "A-4",
    copies: 6,
    status: "disponible",
    updatedAt: "2026-04-11T10:12:00.000Z",
  },
  {
    id: "b3",
    title: "El nombre de la rosa",
    author: "Umberto Eco",
    category: "Misterio",
    isbn: "9788420412146",
    shelf: "B-1",
    copies: 2,
    status: "prestado",
    updatedAt: "2026-04-11T12:20:00.000Z",
  },
  {
    id: "b4",
    title: "La tregua",
    author: "Mario Benedetti",
    category: "Literatura",
    isbn: "9788420413099",
    shelf: "A-6",
    copies: 3,
    status: "reservado",
    updatedAt: "2026-04-08T09:41:00.000Z",
  },
  {
    id: "b5",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "Historia",
    isbn: "9786079356170",
    shelf: "D-2",
    copies: 4,
    status: "disponible",
    updatedAt: "2026-04-07T11:30:00.000Z",
  },
  {
    id: "b6",
    title: "Breves respuestas a las grandes preguntas",
    author: "Stephen Hawking",
    category: "Ciencia",
    isbn: "9786073161800",
    shelf: "C-5",
    copies: 3,
    status: "reservado",
    updatedAt: "2026-04-09T09:41:00.000Z",
  },
  {
    id: "b7",
    title: "El principito",
    author: "Antoine de Saint-Exupery",
    category: "Infantil",
    isbn: "9786070752049",
    shelf: "E-1",
    copies: 8,
    status: "disponible",
    updatedAt: "2026-04-12T18:12:00.000Z",
  },
  {
    id: "b8",
    title: "Don Quijote de la Mancha",
    author: "Miguel de Cervantes",
    category: "Clasicos",
    isbn: "9788420412115",
    shelf: "A-1",
    copies: 2,
    status: "prestado",
    updatedAt: "2026-04-10T07:11:00.000Z",
  },
];

const state = {
  books: [],
  editingId: null,
  categorySignature: "",
  searchTimer: null,
  activeUser: null,
};

const elements = {
  authView: document.getElementById("auth-view"),
  appView: document.getElementById("app-view"),
  loginForm: document.getElementById("login-form"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  rememberSession: document.getElementById("remember-session"),
  sessionUser: document.getElementById("session-user"),
  logoutBtn: document.getElementById("logout-btn"),
  booksBody: document.getElementById("books-body"),
  emptyState: document.getElementById("empty-state"),
  formPanel: document.getElementById("form-panel"),
  formTitle: document.getElementById("form-title"),
  bookForm: document.getElementById("book-form"),
  bookId: document.getElementById("book-id"),
  title: document.getElementById("title"),
  author: document.getElementById("author"),
  category: document.getElementById("category"),
  isbn: document.getElementById("isbn"),
  shelf: document.getElementById("shelf"),
  copies: document.getElementById("copies"),
  status: document.getElementById("status"),
  newBookBtn: document.getElementById("new-book-btn"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  searchInput: document.getElementById("search-input"),
  categoryFilter: document.getElementById("category-filter"),
  statusFilter: document.getElementById("status-filter"),
  sortSelect: document.getElementById("sort-select"),
  clearFiltersBtn: document.getElementById("clear-filters-btn"),
  exportBtn: document.getElementById("export-btn"),
  importInput: document.getElementById("import-input"),
  resultsCounter: document.getElementById("results-counter"),
  statTitles: document.getElementById("stat-titles"),
  statCopies: document.getElementById("stat-copies"),
  statLowStock: document.getElementById("stat-low-stock"),
  toast: document.getElementById("toast"),
};

init();

function init() {
  state.books = loadBooks();
  bindEvents();
  applyStoredSession();
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutBtn.addEventListener("click", logout);

  elements.bookForm.addEventListener("submit", handleSubmit);
  elements.cancelEditBtn.addEventListener("click", resetForm);
  elements.newBookBtn.addEventListener("click", () => {
    openForm();
    elements.title.focus();
  });

  elements.searchInput.addEventListener("input", scheduleRefresh);
  elements.categoryFilter.addEventListener("change", refreshUI);
  elements.statusFilter.addEventListener("change", refreshUI);
  elements.sortSelect.addEventListener("change", refreshUI);
  elements.clearFiltersBtn.addEventListener("click", clearFilters);

  elements.booksBody.addEventListener("click", handleTableActions);
  elements.exportBtn.addEventListener("click", exportBooks);
  elements.importInput.addEventListener("change", importBooks);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      resetForm();
    }
  });
}

function applyStoredSession() {
  const persisted = readSession();
  if (persisted?.username) {
    startSession(persisted.username, persisted.origin);
    return;
  }
  showLogin();
}

function handleLogin(event) {
  event.preventDefault();

  const username = sanitizeText(elements.username.value, 30).toLowerCase();
  const password = sanitizeText(elements.password.value, 50);

  if (
    username !== DEMO_CREDENTIALS.username ||
    password !== DEMO_CREDENTIALS.password
  ) {
    showToast("Credenciales invalidas. Usa admin / perico123.");
    return;
  }

  const origin = elements.rememberSession.checked ? "local" : "session";
  startSession(username, origin);
  elements.password.value = "";
  showToast(`Bienvenido, ${username}.`);
}

function startSession(username, origin) {
  state.activeUser = username;
  elements.sessionUser.textContent = `Sesion: ${username}`;

  const payload = JSON.stringify({ username });
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  if (origin === "local") {
    localStorage.setItem(AUTH_KEY, payload);
  } else {
    sessionStorage.setItem(SESSION_KEY, payload);
  }

  showApp();
  refreshUI();
}

function readSession() {
  const local = safeParse(localStorage.getItem(AUTH_KEY));
  if (local?.username) {
    return { username: local.username, origin: "local" };
  }
  const session = safeParse(sessionStorage.getItem(SESSION_KEY));
  if (session?.username) {
    return { username: session.username, origin: "session" };
  }
  return null;
}

function logout() {
  state.activeUser = null;
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  elements.loginForm.reset();
  resetForm();
  showLogin();
  showToast("Sesion cerrada.");
}

function showLogin() {
  elements.authView.classList.remove("hidden");
  elements.appView.classList.add("hidden");
  elements.username.focus();
}

function showApp() {
  elements.authView.classList.add("hidden");
  elements.appView.classList.remove("hidden");
}

function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = initialBooks.map(normalizeBook);
      persistBooks(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const seeded = initialBooks.map(normalizeBook);
      persistBooks(seeded);
      return seeded;
    }
    const valid = parsed
      .map(normalizeBook)
      .filter((book) => Boolean(book.title && book.author && book.category));
    if (valid.length === 0) {
      const seeded = initialBooks.map(normalizeBook);
      persistBooks(seeded);
      return seeded;
    }
    return valid;
  } catch (error) {
    console.error("No se pudo leer localStorage", error);
    return initialBooks.map(normalizeBook);
  }
}

function saveBooks() {
  persistBooks(state.books);
}

function persistBooks(list) {
  const serializable = list.map((book) => {
    const copy = { ...book };
    delete copy.searchIndex;
    return copy;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

function normalizeBook(input) {
  const normalized = {
    id: String(input.id || createId()),
    title: sanitizeText(input.title, 120),
    author: sanitizeText(input.author, 80),
    category: sanitizeText(input.category, 60),
    isbn: sanitizeText(input.isbn, 25),
    shelf: sanitizeText(input.shelf, 50),
    copies: clampNumber(input.copies, 0, 9999),
    status: sanitizeStatus(input.status),
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
  normalized.searchIndex = buildSearchIndex(normalized);
  return normalized;
}

function buildSearchIndex(book) {
  return normalizeForSearch(
    [book.title, book.author, book.category, book.isbn, book.shelf].join(" ")
  );
}

function sanitizeText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function sanitizeStatus(status) {
  return ["disponible", "prestado", "reservado"].includes(status)
    ? status
    : "disponible";
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function normalizeForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function openForm() {
  elements.formPanel.classList.remove("collapsed");
}

function closeForm() {
  elements.formPanel.classList.add("collapsed");
}

function resetForm() {
  state.editingId = null;
  elements.bookForm.reset();
  elements.bookId.value = "";
  elements.formTitle.textContent = "Agregar libro";
  closeForm();
}

function handleSubmit(event) {
  event.preventDefault();

  const bookInput = {
    id: elements.bookId.value || createId(),
    title: elements.title.value,
    author: elements.author.value,
    category: elements.category.value,
    isbn: elements.isbn.value,
    shelf: elements.shelf.value,
    copies: elements.copies.value,
    status: elements.status.value,
    updatedAt: new Date().toISOString(),
  };

  const book = normalizeBook(bookInput);
  if (!book.title || !book.author || !book.category) {
    showToast("Completa los campos obligatorios.");
    return;
  }

  if (state.editingId) {
    const index = state.books.findIndex((item) => item.id === state.editingId);
    if (index !== -1) {
      state.books[index] = book;
      showToast("Libro actualizado.");
    }
  } else {
    state.books.unshift(book);
    showToast("Libro agregado.");
  }

  saveBooks();
  resetForm();
  refreshUI();
}

function handleTableActions(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (!id) return;

  if (action === "edit") {
    editBook(id);
  }

  if (action === "delete") {
    deleteBook(id);
  }
}

function editBook(id) {
  const book = state.books.find((item) => item.id === id);
  if (!book) return;

  state.editingId = id;
  elements.bookId.value = book.id;
  elements.title.value = book.title;
  elements.author.value = book.author;
  elements.category.value = book.category;
  elements.isbn.value = book.isbn;
  elements.shelf.value = book.shelf;
  elements.copies.value = book.copies;
  elements.status.value = book.status;

  elements.formTitle.textContent = "Editar libro";
  openForm();
  elements.title.focus();
  showToast("Editando libro.");
}

function deleteBook(id) {
  const book = state.books.find((item) => item.id === id);
  if (!book) return;

  const ok = window.confirm(`Eliminar "${book.title}" del inventario?`);
  if (!ok) return;

  state.books = state.books.filter((item) => item.id !== id);
  saveBooks();
  refreshUI();
  showToast("Libro eliminado.");
}

function exportBooks() {
  const serializable = state.books.map((book) => {
    const copy = { ...book };
    delete copy.searchIndex;
    return copy;
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    count: serializable.length,
    books: serializable,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `inventario-sopas-perico-${dateStamp()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Inventario exportado.");
}

function importBooks(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result || "{}"));
      const incoming = Array.isArray(imported) ? imported : imported.books;
      if (!Array.isArray(incoming)) {
        throw new Error("Formato invalido");
      }

      state.books = incoming
        .map(normalizeBook)
        .filter((book) => Boolean(book.title && book.author && book.category));
      state.categorySignature = "";
      saveBooks();
      refreshUI();
      resetForm();
      showToast("Inventario importado.");
    } catch (error) {
      console.error("Error de importacion", error);
      showToast("No se pudo importar el archivo.");
    } finally {
      elements.importInput.value = "";
    }
  };

  reader.readAsText(file);
}

function scheduleRefresh() {
  clearTimeout(state.searchTimer);
  state.searchTimer = window.setTimeout(refreshUI, SEARCH_DEBOUNCE_MS);
}

function clearFilters() {
  elements.searchInput.value = "";
  elements.categoryFilter.value = "all";
  elements.statusFilter.value = "all";
  elements.sortSelect.value = "updated_desc";
  refreshUI();
  showToast("Filtros reiniciados.");
}

function getFilteredBooks() {
  const search = normalizeForSearch(sanitizeText(elements.searchInput.value, 120));
  const category = elements.categoryFilter.value;
  const status = elements.statusFilter.value;
  const sort = elements.sortSelect.value;

  let books = state.books;

  if (search) {
    books = books.filter((book) => book.searchIndex.includes(search));
  }

  if (category !== "all") {
    books = books.filter((book) => slug(book.category) === category);
  }

  if (status !== "all") {
    books = books.filter((book) => book.status === status);
  }

  return [...books].sort((a, b) => sortBooks(a, b, sort));
}

function sortBooks(a, b, mode) {
  switch (mode) {
    case "title_asc":
      return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
    case "copies_desc":
      return b.copies - a.copies;
    case "copies_asc":
      return a.copies - b.copies;
    case "updated_desc":
    default:
      return new Date(b.updatedAt) - new Date(a.updatedAt);
  }
}

function refreshUI() {
  renderCategoryFilter();
  const books = getFilteredBooks();
  renderRows(books);
  renderStats();
  elements.resultsCounter.textContent = `${books.length} resultado${
    books.length === 1 ? "" : "s"
  }`;
}

function renderRows(books) {
  elements.booksBody.innerHTML = "";

  if (books.length === 0) {
    elements.emptyState.classList.remove("hidden");
    return;
  }

  elements.emptyState.classList.add("hidden");
  const fragment = document.createDocumentFragment();

  books.forEach((book) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="book-title">${escapeHtml(book.title)}</div>
      </td>
      <td>${escapeHtml(book.author)}</td>
      <td>${escapeHtml(book.category)}</td>
      <td class="muted">${escapeHtml(book.isbn || "-")}</td>
      <td class="muted">${escapeHtml(book.shelf || "-")}</td>
      <td>${book.copies}</td>
      <td><span class="badge ${book.status}">${capitalize(book.status)}</span></td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" data-action="edit" data-id="${book.id}" type="button">Editar</button>
          <button class="icon-btn delete" data-action="delete" data-id="${book.id}" type="button">Eliminar</button>
        </div>
      </td>
    `;
    fragment.appendChild(row);
  });

  elements.booksBody.appendChild(fragment);
}

function renderStats() {
  const totalTitles = state.books.length;
  const totalCopies = state.books.reduce((acc, book) => acc + book.copies, 0);
  const lowStock = state.books.filter((book) => book.copies <= LOW_STOCK_LIMIT)
    .length;

  animateNumber(elements.statTitles, totalTitles);
  animateNumber(elements.statCopies, totalCopies);
  animateNumber(elements.statLowStock, lowStock);
}

function animateNumber(target, value) {
  const start = Number(target.dataset.value || 0);
  const end = Number(value);
  if (start === end) {
    target.textContent = String(end);
    target.dataset.value = String(end);
    return;
  }

  const duration = 360;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = Math.round(start + (end - start) * eased);
    target.textContent = String(current);

    if (t < 1) {
      requestAnimationFrame(update);
    } else {
      target.dataset.value = String(end);
    }
  }

  requestAnimationFrame(update);
}

function renderCategoryFilter() {
  const previous = elements.categoryFilter.value;
  const categories = Array.from(
    new Set(state.books.map((book) => book.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  const signature = categories.join("|");

  if (signature === state.categorySignature) {
    return;
  }

  state.categorySignature = signature;
  const options = ['<option value="all">Todas</option>'];
  categories.forEach((category) => {
    options.push(
      `<option value="${slug(category)}">${escapeHtml(category)}</option>`
    );
  });

  elements.categoryFilter.innerHTML = options.join("");
  const hasPrevious =
    previous === "all" || categories.some((c) => slug(c) === previous);
  elements.categoryFilter.value = hasPrevious ? previous : "all";
}

function slug(value) {
  return normalizeForSearch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateStamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function capitalize(value) {
  return (
    String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1)
  );
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2200);
}

function safeParse(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch (_error) {
    return null;
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
