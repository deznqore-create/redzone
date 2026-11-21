/* RED ZONE — static site helpers */

const STORAGE_KEY = "redzone-projects-v1";

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (_) {}
  return (window.REDZONE_SEED || []).map((p) => ({ ...p }));
}

function saveProjects(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function publishedProjects() {
  return loadProjects().filter((p) => p.status === "published" || !p.status);
}

function getProjectBySlug(slug) {
  return loadProjects().find((p) => p.slug === slug);
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

function initNav() {
  const btn = qs("[data-menu-open]");
  const panel = qs("[data-menu-panel]");
  const closeBtn = qs("[data-menu-close]");
  if (!btn || !panel) return;

  const open = () => {
    panel.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    panel.classList.remove("open");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // active link
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const map = {
    "index.html": "home",
    "": "home",
    "projects.html": "projects",
    "project.html": "projects",
    "books.html": "books",
    
    "about.html": "about",
    "contact.html": "contact",
  };
  const key = map[path] || "";
  qsa(".nav-desktop a, [data-menu-panel] a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    const nav = a.getAttribute("data-nav") || "";
    if (nav === key || href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });
}

function projectCardHTML(p) {
  return `
    <a class="project-card group rise" href="project.html?slug=${encodeURIComponent(p.slug)}">
      <div class="frame">
        <img src="${p.cover}" alt="${escapeHtml(p.title)}" loading="lazy" />
      </div>
      <h3>${escapeHtml(p.title)}</h3>
      <p class="meta">${escapeHtml(p.location)} · ${escapeHtml(p.year)}</p>
    </a>
  `;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHome() {
  const list = publishedProjects();
  const featured = list.filter((p) => p.featured);
  const lead = featured[0] || list[0];
  const rest = (featured.length ? featured : list).filter((p) => p.slug !== lead?.slug).slice(0, 6);

  const leadEl = qs("[data-lead]");
  if (lead && leadEl) {
    leadEl.innerHTML = `
      <a class="group block" href="project.html?slug=${encodeURIComponent(lead.slug)}">
        <div class="frame">
          <img src="${lead.cover}" alt="${escapeHtml(lead.title)}" />
        </div>
      </a>
      <div class="hero-meta">
        <img src="brand/logo.png" alt="" />
        <div>
          <p class="serif" style="font-size:1.35rem;line-height:1.2">${escapeHtml(lead.title)}</p>
          <p class="muted" style="font-size:0.875rem">${escapeHtml(lead.location)} · ${escapeHtml(lead.year)}</p>
        </div>
      </div>
    `;
  }

  const grid = qs("[data-selected]");
  if (grid) {
    grid.innerHTML = rest.map(projectCardHTML).join("");
  }
}

function projectSearchBlob(p) {
  return [
    p.title,
    p.slug,
    p.category,
    p.location,
    p.year,
    p.summary,
    p.description,
    p.concept,
    p.development,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function renderProjectsPage() {
  const grid = qs("[data-projects]");
  const filters = qs("[data-filters]");
  const searchInput = qs("[data-search]");
  const countEl = qs("[data-results-count]");
  if (!grid) return;

  const all = publishedProjects();
  const cats = ["الكل", ...new Set(all.map((p) => p.category).filter(Boolean))];

  const params = new URLSearchParams(location.search);
  let active = params.get("category") || "الكل";
  if (active === "All") active = "الكل";
  let query = (params.get("q") || "").trim();

  if (searchInput && query) searchInput.value = query;

  function filtered() {
    let list = all;
    if (active && active !== "الكل" && active !== "All") {
      list = list.filter((p) => p.category === active);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => projectSearchBlob(p).includes(q));
    }
    return list;
  }

  function syncUrl() {
    const url = new URL(location.href);
    if (!active || active === "الكل" || active === "All") url.searchParams.delete("category");
    else url.searchParams.set("category", active);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }

  function paint() {
    const list = filtered();
    grid.innerHTML =
      list.map(projectCardHTML).join("") ||
      `<p class="muted">لا نتائج مطابقة. جرّب تصنيفاً آخر أو امسح البحث.</p>`;
    if (countEl) {
      countEl.textContent = list.length
        ? `${list.length} مشروع${list.length === 1 ? "" : ""}`
        : "لا نتائج";
    }
    if (filters) {
      filters.innerHTML = cats
        .map(
          (c) =>
            `<button type="button" class="chip ${c === active ? "active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
        )
        .join("");
      filters.querySelectorAll("[data-cat]").forEach((btn) => {
        btn.addEventListener("click", () => {
          active = btn.getAttribute("data-cat");
          syncUrl();
          paint();
        });
      });
    }
  }

  if (searchInput) {
    let timer;
    searchInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        query = searchInput.value.trim();
        syncUrl();
        paint();
      }, 180);
    });
  }

  paint();
}

function renderProjectDetail() {
  const root = qs("[data-project]");
  if (!root) return;
  const slug = new URLSearchParams(location.search).get("slug");
  const p = slug ? getProjectBySlug(slug) : null;
  if (!p || (p.status && p.status !== "published")) {
    root.innerHTML = `<p class="muted">Project not found. <a href="projects.html">Back to archive</a></p>`;
    return;
  }
  document.title = `${p.title} — RED ZONE`;
  const gallery = (p.gallery || [])
    .map((src) => `<img src="${src}" alt="" loading="lazy" />`)
    .join("");

  root.innerHTML = `
    <p class="eyebrow">${escapeHtml(p.category)}</p>
    <h1 style="font-size:clamp(2.25rem,4vw,3.25rem);margin-top:0.5rem">${escapeHtml(p.title)}</h1>
    <p class="muted" style="margin-top:0.75rem">${escapeHtml(p.location)} · ${escapeHtml(p.year)}</p>
    <div class="detail-cover" style="margin-top:2rem">
      <img src="${p.cover}" alt="${escapeHtml(p.title)}" />
    </div>
    <div class="prose" style="margin-top:2.5rem">
      <p style="font-size:1.15rem">${escapeHtml(p.summary)}</p>
      <p style="margin-top:1.25rem">${escapeHtml(p.description)}</p>
      ${p.concept ? `<h2 style="font-size:1.75rem;margin-top:2.5rem">Concept</h2><p style="margin-top:0.75rem">${escapeHtml(p.concept)}</p>` : ""}
      ${p.development ? `<h2 style="font-size:1.75rem;margin-top:2.5rem">Development</h2><p style="margin-top:0.75rem">${escapeHtml(p.development)}</p>` : ""}
    </div>
    ${gallery ? `<div class="gallery">${gallery}</div>` : ""}
    <p style="margin-top:2.5rem"><a class="btn btn-ghost" href="projects.html">← All projects</a></p>
  `;
}





const BOOKS_KEY = "redzone-books-v1";

function loadBooks() {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (_) {}
  return (window.REDZONE_BOOKS_SEED || []).map((b) => ({ ...b }));
}

function saveBooks(list) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(list));
}

function publishedBooks() {
  return loadBooks().filter((b) => b.status === "published" || !b.status);
}

function bookSearchBlob(b) {
  return [b.title, b.title_ar, b.author, b.description, b.link]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function bookCardHTML(b) {
  return `
    <article class="project-card rise">
      <div class="frame">
        <img src="${b.cover}" alt="${escapeHtml(b.title_ar || b.title)}" loading="lazy" />
      </div>
      <h3 style="font-size:1.2rem;margin-top:0.85rem">${escapeHtml(b.title_ar || b.title)}</h3>
      <p class="meta">${escapeHtml(b.author || "")}${b.title && b.title_ar ? " · " + escapeHtml(b.title) : ""}</p>
      ${b.description ? `<p class="muted" style="font-size:0.85rem;margin-top:0.4rem">${escapeHtml(b.description)}</p>` : ""}
      <div style="margin-top:0.9rem;display:flex;flex-wrap:wrap;gap:0.5rem">
        <a class="btn" href="${escapeHtml(b.link)}" target="_blank" rel="noopener">عرض / تحميل</a>
      </div>
    </article>`;
}

function renderBooks() {
  const grid = qs("[data-books]");
  const filters = qs("[data-book-filters]");
  const searchInput = qs("[data-search-books]");
  const countEl = qs("[data-book-count]");
  if (!grid) return;

  const all = publishedBooks();
  // Derived "categories" from first letter groups or author — use simple All + authors with 2+ books, else just search
  const authors = [...new Set(all.map((b) => b.author).filter(Boolean))].sort();
  const cats = ["الكل", ...authors];

  const params = new URLSearchParams(location.search);
  let active = params.get("author") || "الكل";
  let query = (params.get("q") || "").trim();
  if (searchInput && query) searchInput.value = query;

  function filtered() {
    let list = all;
    if (active && active !== "الكل") {
      list = list.filter((b) => b.author === active);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((b) => bookSearchBlob(b).includes(q));
    }
    return list;
  }

  function syncUrl() {
    const url = new URL(location.href);
    if (!active || active === "الكل") url.searchParams.delete("author");
    else url.searchParams.set("author", active);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }

  function paint() {
    const list = filtered();
    if (!all.length) {
      grid.innerHTML = `<p class="muted">لا كتب منشورة بعد. أضف كتباً من صفحة النشر.</p>`;
      if (countEl) countEl.textContent = "";
      return;
    }
    grid.innerHTML =
      list.map(bookCardHTML).join("") ||
      `<p class="muted">لا نتائج مطابقة لبحثك.</p>`;
    if (countEl) {
      countEl.textContent = list.length ? `${list.length} كتاب` : "لا نتائج";
    }
    if (filters && authors.length) {
      filters.innerHTML = cats
        .map(
          (c) =>
            `<button type="button" class="chip ${c === active ? "active" : ""}" data-author="${escapeHtml(c)}">${escapeHtml(c)}</button>`
        )
        .join("");
      filters.querySelectorAll("[data-author]").forEach((btn) => {
        btn.addEventListener("click", () => {
          active = btn.getAttribute("data-author");
          syncUrl();
          paint();
        });
      });
    }
  }

  if (searchInput) {
    let timer;
    searchInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        query = searchInput.value.trim();
        syncUrl();
        paint();
      }, 180);
    });
  }

  paint();
}

/* —— Image upload (client-side, stored as compressed data URLs) —— */
async function fileToDataUrl(file, maxSide = 1400, quality = 0.72) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Prefer JPEG for photos; keep PNG only if source has transparency need — always JPEG for size
  return canvas.toDataURL("image/jpeg", quality);
}

function isDataUrl(src) {
  return typeof src === "string" && src.startsWith("data:");
}

function thumbHTML(src, label) {
  if (!src) return "";
  return `<div style="margin:0.5rem 0 1rem;display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
    <img src="${src}" alt="" style="width:5.5rem;height:5.5rem;object-fit:cover;border-radius:0.75rem;border:2px solid var(--red)" />
    <span class="muted" style="font-size:0.8rem">${label || ""}</span>
  </div>`;
}

/* —— Admin / publish desk —— */
const ADMIN_KEY = "redzone-admin-ok";

function isAdmin() {
  return sessionStorage.getItem(ADMIN_KEY) === "1";
}

function renderAdminLogin() {
  const form = qs("[data-admin-login]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const key = qs("#desk-key")?.value?.trim() || "";
    // Simple studio key (change if you want)
    if (key === "redzone" || key === "REDZONE" || key === "") {
      sessionStorage.setItem(ADMIN_KEY, "1");
      location.href = "admin.html";
    } else {
      alert("Wrong key. Try: redzone");
    }
  });
}

function renderAdminDesk() {
  const root = qs("[data-admin-desk]");
  if (!root) return;
  if (!isAdmin()) {
    location.href = "admin-login.html";
    return;
  }

  let list = loadProjects();
  let editing = null;

  function paint() {
    list = loadProjects();
    const rows = list
      .map(
        (p) => `
      <tr>
        <td style="display:flex;align-items:center;gap:0.65rem">
          <img src="${p.cover}" alt="" style="width:2.75rem;height:2.75rem;object-fit:cover;border-radius:0.5rem;border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'" />
          <span><strong>${escapeHtml(p.title)}</strong><br><span class="muted">${escapeHtml(p.slug)}</span></span>
        </td>
        <td>${escapeHtml(p.category)}</td>
        <td><span class="badge ${p.status === "published" ? "published" : "draft"}">${escapeHtml(p.status || "published")}</span></td>
        <td>
          <button type="button" class="btn btn-ghost" data-edit="${escapeHtml(p.id)}" style="padding:0.35rem 0.75rem;font-size:0.75rem">Edit</button>
          <button type="button" class="btn btn-ghost" data-toggle="${escapeHtml(p.id)}" style="padding:0.35rem 0.75rem;font-size:0.75rem">${p.status === "draft" ? "Publish" : "Unpublish"}</button>
          <button type="button" class="btn btn-ghost" data-del="${escapeHtml(p.id)}" style="padding:0.35rem 0.75rem;font-size:0.75rem;color:var(--red)">Delete</button>
        </td>
      </tr>`
      )
      .join("");

    const bookRows = loadBooks()
      .map(
        (b) => `
      <tr>
        <td style="display:flex;align-items:center;gap:0.65rem">
          <img src="${b.cover}" alt="" style="width:2.75rem;height:2.75rem;object-fit:cover;border-radius:0.5rem;border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'" />
          <span><strong>${escapeHtml(b.title_ar || b.title)}</strong><br><span class="muted">${escapeHtml(b.author || "")}</span></span>
        </td>
        <td style="max-width:12rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><a href="${escapeHtml(b.link)}" target="_blank" rel="noopener">${escapeHtml(b.link)}</a></td>
        <td><span class="badge ${b.status === "published" ? "published" : "draft"}">${escapeHtml(b.status || "published")}</span></td>
        <td>
          <button type="button" class="btn btn-ghost" data-edit-book="${escapeHtml(b.id)}" style="padding:0.35rem 0.75rem;font-size:0.75rem">تعديل</button>
          <button type="button" class="btn btn-ghost" data-toggle-book="${escapeHtml(b.id)}" style="padding:0.35rem 0.75rem;font-size:0.75rem">${b.status === "draft" ? "نشر" : "إخفاء"}</button>
          <button type="button" class="btn btn-ghost" data-del-book="${escapeHtml(b.id)}" style="padding:0.35rem 0.75rem;font-size:0.75rem;color:var(--red)">حذف</button>
        </td>
      </tr>`
      )
      .join("");

    root.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <div>
          <p class="eyebrow">Studio desk</p>
          <h1 style="font-size:2rem;margin-top:0.25rem">النشر</h1>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button type="button" class="btn" data-new>مشروع جديد</button>
          <button type="button" class="btn" data-new-book>كتاب جديد</button>
          <button type="button" class="btn btn-ghost" data-logout>خروج</button>
        </div>
      </div>

      <h2 class="serif" style="font-size:1.35rem;margin-bottom:0.75rem">المشاريع</h2>
      <div style="overflow-x:auto;margin-bottom:2.5rem">
        <table class="admin-table">
          <thead><tr><th>المشروع</th><th>التصنيف</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4" class="muted">لا مشاريع بعد.</td></tr>`}</tbody>
        </table>
      </div>

      <h2 class="serif" style="font-size:1.35rem;margin-bottom:0.75rem">الكتب</h2>
      <p class="muted" style="font-size:0.85rem;margin-bottom:0.75rem">انشر اسم الكتاب، صورة الغلاف، ورابط العرض/التحميل.</p>
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead><tr><th>الكتاب</th><th>الرابط</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>${bookRows || `<tr><td colspan="4" class="muted">لا كتب بعد.</td></tr>`}</tbody>
        </table>
      </div>
      <div id="editor" style="display:none;margin-top:2.5rem" class="card"></div>
    `;

    qs("[data-new]")?.addEventListener("click", () => openEditor(null));
    qs("[data-new-book]")?.addEventListener("click", () => openBookEditor(null));
    qs("[data-logout]")?.addEventListener("click", () => {
      sessionStorage.removeItem(ADMIN_KEY);
      location.href = "admin-login.html";
    });
    qsa("[data-edit-book]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-edit-book");
        openBookEditor(loadBooks().find((x) => x.id === id));
      })
    );
    qsa("[data-toggle-book]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-toggle-book");
        const next = loadBooks().map((x) =>
          x.id === id ? { ...x, status: x.status === "draft" ? "published" : "draft" } : x
        );
        saveBooks(next);
        paint();
      })
    );
    qsa("[data-del-book]").forEach((b) =>
      b.addEventListener("click", () => {
        if (!confirm("حذف هذا الكتاب؟")) return;
        const id = b.getAttribute("data-del-book");
        saveBooks(loadBooks().filter((x) => x.id !== id));
        paint();
      })
    );
    qsa("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-edit");
        openEditor(list.find((x) => x.id === id));
      })
    );
    qsa("[data-toggle]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-toggle");
        const next = list.map((x) =>
          x.id === id ? { ...x, status: x.status === "draft" ? "published" : "draft" } : x
        );
        saveProjects(next);
        paint();
      })
    );
    qsa("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        if (!confirm("Delete this project?")) return;
        const id = b.getAttribute("data-del");
        saveProjects(list.filter((x) => x.id !== id));
        paint();
      })
    );
  }

  function openEditor(project) {
    editing = project;
    const ed = qs("#editor");
    if (!ed) return;
    const d = project
      ? { ...project, gallery: [...(project.gallery || [])] }
      : {
          id: "",
          slug: "",
          title: "",
          category: "Architecture",
          location: "",
          year: String(new Date().getFullYear()),
          summary: "",
          description: "",
          concept: "",
          development: "",
          cover: "media/hero.jpg",
          gallery: [],
          featured: false,
          status: "draft",
        };

    let coverValue = d.cover || "";
    let galleryValues = [...(d.gallery || [])];

    function renderEditorForm() {
      const galThumbs = galleryValues
        .map(
          (src, i) => `
        <div style="position:relative;display:inline-block;margin:0.25rem">
          <img src="${src}" alt="" style="width:4.5rem;height:4.5rem;object-fit:cover;border-radius:0.6rem;border:1px solid var(--border)" />
          <button type="button" data-rm-gal="${i}" title="Remove" style="position:absolute;top:-0.35rem;right:-0.35rem;width:1.35rem;height:1.35rem;border-radius:999px;border:none;background:var(--red);color:#fff;font-size:0.75rem;cursor:pointer;line-height:1">×</button>
        </div>`
        )
        .join("");

      ed.style.display = "block";
      ed.innerHTML = `
      <h2 class="serif" style="font-size:1.5rem;margin-bottom:0.35rem">${project ? "تعديل مشروع" : "مشروع جديد"}</h2>
      <p class="muted" style="font-size:0.85rem;margin-bottom:1rem">ارفع صور من جهازك للغلاف والمعرض. الصور تُضغط وتُحفظ مع المشروع.</p>
      <form data-save>
        <label>العنوان</label>
        <input name="title" required value="${escapeHtml(d.title)}" />
        <label>الرابط (slug)</label>
        <input name="slug" required value="${escapeHtml(d.slug)}" placeholder="my-project" />
        <label>التصنيف</label>
        <input name="category" value="${escapeHtml(d.category)}" />
        <label>الموقع</label>
        <input name="location" value="${escapeHtml(d.location)}" />
        <label>السنة</label>
        <input name="year" value="${escapeHtml(d.year)}" />

        <label>صورة الغلاف</label>
        ${thumbHTML(coverValue, isDataUrl(coverValue) ? "مرفوعة من الجهاز" : coverValue)}
        <input type="file" accept="image/*" data-cover-file style="margin-bottom:0.5rem" />
        <p class="muted" style="font-size:0.75rem;margin:-0.25rem 0 1rem">أو مسار جاهز من الموقع:</p>
        <input name="cover_path" value="${escapeHtml(isDataUrl(coverValue) ? "" : coverValue)}" placeholder="media/hero.jpg" />

        <label>معرض الصور</label>
        <div data-gal-thumbs style="margin-bottom:0.5rem">${galThumbs || '<span class="muted" style="font-size:0.85rem">لا صور بعد</span>'}</div>
        <input type="file" accept="image/*" multiple data-gallery-files style="margin-bottom:1rem" />

        <label>ملخص</label>
        <textarea name="summary">${escapeHtml(d.summary)}</textarea>
        <label>الوصف</label>
        <textarea name="description">${escapeHtml(d.description)}</textarea>
        <label>Concept</label>
        <textarea name="concept">${escapeHtml(d.concept)}</textarea>
        <label>Development</label>
        <textarea name="development">${escapeHtml(d.development)}</textarea>
        <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">
          <input type="checkbox" name="featured" ${d.featured ? "checked" : ""} style="width:auto;margin:0" />
          مميز (Featured)
        </label>
        <label>الحالة</label>
        <select name="status">
          <option value="draft" ${d.status === "draft" ? "selected" : ""}>مسودة</option>
          <option value="published" ${d.status !== "draft" ? "selected" : ""}>منشور</option>
        </select>
        <div style="display:flex;gap:0.75rem;margin-top:0.5rem;flex-wrap:wrap">
          <button type="submit" class="btn">حفظ ونشر على الموقع</button>
          <button type="button" class="btn btn-ghost" data-cancel>إلغاء</button>
        </div>
        <p class="muted" style="font-size:0.75rem;margin-top:1rem">ملاحظة: الرفع محلي في المتصفح (localStorage). الصور تظهر للزوار على نفس الجهاز/المتصفح. للرفع السحابي الدائم لاحقاً يمكن ربط تخزين خارجي.</p>
      </form>
    `;

      qs("[data-cancel]", ed)?.addEventListener("click", () => {
        ed.style.display = "none";
      });

      // remove gallery item
      qsa("[data-rm-gal]", ed).forEach((btn) => {
        btn.addEventListener("click", () => {
          const i = Number(btn.getAttribute("data-rm-gal"));
          galleryValues.splice(i, 1);
          // preserve form text fields
          const form = qs("[data-save]", ed);
          syncDraftFromForm(form);
          renderEditorForm();
        });
      });

      // cover upload
      qs("[data-cover-file]", ed)?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          coverValue = await fileToDataUrl(file);
          const form = qs("[data-save]", ed);
          syncDraftFromForm(form);
          renderEditorForm();
        } catch (err) {
          alert("تعذر قراءة الصورة: " + (err.message || err));
        }
      });

      // gallery uploads
      qs("[data-gallery-files]", ed)?.addEventListener("change", async (e) => {
        const files = [...(e.target.files || [])];
        if (!files.length) return;
        try {
          for (const file of files) {
            const url = await fileToDataUrl(file);
            galleryValues.push(url);
          }
          const form = qs("[data-save]", ed);
          syncDraftFromForm(form);
          renderEditorForm();
        } catch (err) {
          alert("تعذر قراءة الصور: " + (err.message || err));
        }
      });

      qs("[data-save]", ed)?.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const slug = String(fd.get("slug") || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-|-$/g, "");
        const id = d.id || slug || crypto.randomUUID();
        const pathCover = String(fd.get("cover_path") || "").trim();
        const finalCover = isDataUrl(coverValue) ? coverValue : pathCover || coverValue || "media/hero.jpg";
        const item = {
          id,
          slug,
          title: String(fd.get("title") || "").trim(),
          category: String(fd.get("category") || "Architecture").trim(),
          location: String(fd.get("location") || "").trim(),
          year: String(fd.get("year") || "").trim(),
          cover: finalCover,
          summary: String(fd.get("summary") || "").trim(),
          description: String(fd.get("description") || "").trim(),
          concept: String(fd.get("concept") || "").trim(),
          development: String(fd.get("development") || "").trim(),
          gallery: galleryValues.slice(),
          featured: fd.get("featured") === "on",
          status: String(fd.get("status") || "draft"),
        };
        try {
          const next = loadProjects();
          const idx = next.findIndex((x) => x.id === id);
          if (idx >= 0) next[idx] = item;
          else next.unshift(item);
          saveProjects(next);
        } catch (err) {
          alert(
            "تعذر الحفظ — قد تكون الصور كبيرة على مساحة المتصفح. جرّب صوراً أقل أو أصغر.\n" +
              (err.message || "")
          );
          return;
        }
        ed.style.display = "none";
        paint();
      });
    }

    function syncDraftFromForm(form) {
      if (!form) return;
      const fd = new FormData(form);
      d.title = String(fd.get("title") || "");
      d.slug = String(fd.get("slug") || "");
      d.category = String(fd.get("category") || "");
      d.location = String(fd.get("location") || "");
      d.year = String(fd.get("year") || "");
      d.summary = String(fd.get("summary") || "");
      d.description = String(fd.get("description") || "");
      d.concept = String(fd.get("concept") || "");
      d.development = String(fd.get("development") || "");
      d.featured = fd.get("featured") === "on";
      d.status = String(fd.get("status") || "draft");
    }

    renderEditorForm();
  }


  function openBookEditor(book) {
    const ed = qs("#editor");
    if (!ed) return;
    const d = book
      ? { ...book }
      : {
          id: "",
          title: "",
          title_ar: "",
          author: "",
          cover: "media/detail-timber.jpg",
          link: "",
          description: "",
          status: "published",
        };
    let coverValue = d.cover || "";

    function render() {
      ed.style.display = "block";
      ed.innerHTML = `
        <h2 class="serif" style="font-size:1.5rem;margin-bottom:0.35rem">${book ? "تعديل كتاب" : "كتاب جديد"}</h2>
        <p class="muted" style="font-size:0.85rem;margin-bottom:1rem">الاسم + صورة الغلاف + رابط العرض أو التحميل.</p>
        <form data-save-book>
          <label>اسم الكتاب (عربي)</label>
          <input name="title_ar" required value="${escapeHtml(d.title_ar || "")}" placeholder="مثال: مدح الظلال" />
          <label>اسم الكتاب (إنجليزي) — اختياري</label>
          <input name="title" value="${escapeHtml(d.title || "")}" />
          <label>المؤلف</label>
          <input name="author" value="${escapeHtml(d.author || "")}" />
          <label>رابط العرض / التحميل</label>
          <input name="link" required type="url" value="${escapeHtml(d.link || "")}" placeholder="https://..." />
          <label>وصف قصير — اختياري</label>
          <textarea name="description">${escapeHtml(d.description || "")}</textarea>
          <label>صورة الغلاف</label>
          ${thumbHTML(coverValue, isDataUrl(coverValue) ? "مرفوعة من الجهاز" : coverValue)}
          <input type="file" accept="image/*" data-book-cover style="margin-bottom:0.5rem" />
          <p class="muted" style="font-size:0.75rem;margin:-0.25rem 0 1rem">أو مسار صورة من الموقع:</p>
          <input name="cover_path" value="${escapeHtml(isDataUrl(coverValue) ? "" : coverValue)}" placeholder="media/hero.jpg" />
          <label>الحالة</label>
          <select name="status">
            <option value="published" ${d.status !== "draft" ? "selected" : ""}>منشور</option>
            <option value="draft" ${d.status === "draft" ? "selected" : ""}>مسودة</option>
          </select>
          <div style="display:flex;gap:0.75rem;margin-top:0.75rem;flex-wrap:wrap">
            <button type="submit" class="btn">حفظ على صفحة الكتب</button>
            <button type="button" class="btn btn-ghost" data-cancel>إلغاء</button>
          </div>
        </form>
      `;
      qs("[data-cancel]", ed)?.addEventListener("click", () => {
        ed.style.display = "none";
      });
      qs("[data-book-cover]", ed)?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          coverValue = await fileToDataUrl(file);
          const form = qs("[data-save-book]", ed);
          if (form) {
            d.title_ar = form.title_ar.value;
            d.title = form.title.value;
            d.author = form.author.value;
            d.link = form.link.value;
            d.description = form.description.value;
            d.status = form.status.value;
          }
          render();
        } catch (err) {
          alert("تعذر قراءة الصورة");
        }
      });
      qs("[data-save-book]", ed)?.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const title_ar = String(fd.get("title_ar") || "").trim();
        const title = String(fd.get("title") || "").trim() || title_ar;
        const id =
          d.id ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-")
            .replace(/^-|-$/g, "") ||
          crypto.randomUUID();
        const pathCover = String(fd.get("cover_path") || "").trim();
        const finalCover = isDataUrl(coverValue)
          ? coverValue
          : pathCover || coverValue || "media/detail-timber.jpg";
        const item = {
          id,
          title,
          title_ar,
          author: String(fd.get("author") || "").trim(),
          link: String(fd.get("link") || "").trim(),
          description: String(fd.get("description") || "").trim(),
          cover: finalCover,
          status: String(fd.get("status") || "published"),
        };
        try {
          const next = loadBooks();
          const idx = next.findIndex((x) => x.id === id);
          if (idx >= 0) next[idx] = item;
          else next.unshift(item);
          saveBooks(next);
        } catch (err) {
          alert("تعذر الحفظ — جرّب صورة أصغر.\n" + (err.message || ""));
          return;
        }
        ed.style.display = "none";
        paint();
      });
    }
    render();
  }


  paint();
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  const page = document.body.dataset.page;
  if (page === "home") renderHome();
  if (page === "projects") renderProjectsPage();
  if (page === "project") renderProjectDetail();
  if (page === "books") renderBooks();
  if (page === "admin-login") renderAdminLogin();
  if (page === "admin") renderAdminDesk();
});
