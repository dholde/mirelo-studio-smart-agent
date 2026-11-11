(() => {
  if (window.__mireloKnowledge) return;
  window.__mireloKnowledge = true;

  const STORAGE_KEY = "mirelo-knowledge";
  const LIMIT = 4000;
  const PLACEHOLDER = "Select knowledge base";

  const style = document.createElement("style");
  style.textContent = `
    [data-mirelo-kb-select] {
      display: flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      max-width: 100%;
      margin: 0 4px 8px;
      color: var(--foreground);
      font: inherit;
    }
    [data-mirelo-kb-select] [data-kb-trigger] {
      height: 28px;
      padding: 0 28px 0 12px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--muted) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;
      color: var(--foreground);
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    [data-mirelo-kb-select] [data-kb-menu] {
      position: fixed;
      z-index: 80;
      min-width: 220px;
      padding: 6px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #1c1c1c;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    }
    [data-mirelo-kb-select] [data-kb-menu][hidden] { display: none; }
    [data-mirelo-kb-select] [data-kb-menu] button {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 32px;
      padding: 0 10px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--foreground);
      font: inherit;
      font-size: 13px;
      text-align: left;
      cursor: pointer;
    }
    [data-mirelo-kb-select] [data-kb-menu] button:hover { background: var(--sidebar-accent, #171717); }
    [data-mirelo-kb-select] [data-kb-menu] button::before {
      content: "";
      width: 14px;
      flex: none;
      text-align: center;
    }
    [data-mirelo-kb-select] [data-kb-menu] button[data-checked="true"]::before {
      content: "";
      width: 7px;
      height: 4px;
      margin-left: 3px;
      border-left: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(-45deg);
    }
    [data-mirelo-kb-select] [data-kb-note] {
      font-size: 11px;
      color: #f0a0a0;
    }
    [data-mirelo-kb-modal] {
      position: fixed;
      inset: 0;
      z-index: 90;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.55);
    }
    [data-mirelo-kb-modal][hidden] { display: none; }
    [data-mirelo-kb-modal] form {
      width: min(440px, calc(100vw - 32px));
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 20px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--card);
      color: var(--foreground);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    }
    [data-mirelo-kb-modal] h2 { margin: 0 0 4px; font-size: 16px; font-weight: 560; }
    [data-mirelo-kb-modal] input,
    [data-mirelo-kb-modal] textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--muted);
      color: var(--foreground);
      font: inherit;
      font-size: 14px;
      padding: 10px 12px;
    }
    [data-mirelo-kb-modal] textarea { min-height: 120px; resize: vertical; }
    [data-mirelo-kb-modal] .kb-actions { display: flex; justify-content: flex-end; gap: 8px; }
    [data-mirelo-kb-modal] button {
      height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--muted);
      color: var(--foreground);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    [data-mirelo-kb-modal] button.primary {
      background: var(--foreground);
      color: var(--background);
      border-color: transparent;
    }
    [data-mirelo-kb-page] {
      box-sizing: border-box;
      min-height: 100%;
      padding: 40px 32px 64px;
      color: var(--foreground);
      font: inherit;
    }
    [data-mirelo-kb-page] * { box-sizing: border-box; }
    [data-mirelo-kb-page] h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 560;
      letter-spacing: -0.02em;
    }
    [data-mirelo-kb-page] .kb-sub {
      margin: 8px 0 28px;
      color: color-mix(in srgb, var(--foreground) 62%, transparent);
      font-size: 14px;
    }
    [data-mirelo-kb-page] .kb-wrap { max-width: 720px; }
    [data-mirelo-kb-page] .kb-card,
    [data-mirelo-kb-page] form {
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--card);
      padding: 16px;
    }
    [data-mirelo-kb-page] .kb-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    [data-mirelo-kb-page] .kb-card { display: flex; gap: 12px; align-items: flex-start; }
    [data-mirelo-kb-page] .kb-card h2 { margin: 0 0 6px; font-size: 14px; font-weight: 560; }
    [data-mirelo-kb-page] .kb-card p {
      margin: 0;
      white-space: pre-wrap;
      color: color-mix(in srgb, var(--foreground) 78%, transparent);
      font-size: 13px;
      line-height: 1.45;
    }
    [data-mirelo-kb-page] .kb-empty {
      margin: 0 0 16px;
      color: color-mix(in srgb, var(--foreground) 62%, transparent);
      font-size: 14px;
    }
    [data-mirelo-kb-page] form { display: flex; flex-direction: column; gap: 10px; }
    [data-mirelo-kb-page] input,
    [data-mirelo-kb-page] textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--muted);
      color: var(--foreground);
      font: inherit;
      font-size: 14px;
      padding: 10px 12px;
    }
    [data-mirelo-kb-page] textarea { min-height: 120px; resize: vertical; }
    [data-mirelo-kb-page] .kb-actions { display: flex; gap: 8px; }
    [data-mirelo-kb-page] button {
      height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--muted);
      color: var(--foreground);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    [data-mirelo-kb-page] button.primary {
      background: var(--foreground);
      color: var(--background);
      border-color: transparent;
    }
  `;
  document.documentElement.append(style);

  function stored() {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return current;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("mirelo-kb-")) continue;
      const value = localStorage.getItem(key);
      if (!value) continue;
      localStorage.setItem(STORAGE_KEY, value);
      localStorage.removeItem(key);
      return value;
    }
    return "";
  }

  function load() {
    try {
      const parsed = JSON.parse(stored() || "");
      if (parsed && Array.isArray(parsed.bases)) {
        return { bases: parsed.bases, selectedId: parsed.selectedId || null };
      }
    } catch {
      /* seed below */
    }
    const seed = {
      bases: [
        {
          id: "example",
          name: "Example",
          text: "Prefer warm acoustic instruments. Avoid electronic drums and harsh distortion.",
        },
      ],
      selectedId: null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render();
  }

  function selectedBase() {
    const data = load();
    return data.bases.find((base) => base.id === data.selectedId) || null;
  }

  function editorElement() {
    return document.querySelector('[data-testid="editor-assistant-input"]');
  }

  function setEditorText(text) {
    const el = editorElement();
    const editor = el && el.__lexicalEditor;
    if (!editor) return false;
    const json = editor.getEditorState().toJSON();
    const lines = String(text).split("\n");
    json.root.children = (lines.length ? lines : [""]).map((line) => ({
      children: line
        ? [{ detail: 0, format: 0, mode: "normal", style: "", text: line, type: "text", version: 1 }]
        : [],
      direction: null,
      format: "",
      indent: 0,
      textFormat: 0,
      textStyle: "",
      type: "paragraph",
      version: 1,
    }));
    editor.setEditorState(editor.parseEditorState(json));
    return true;
  }

  function knowledgePrefix(base) {
    return `[Knowledge base: ${base.name}]\n${base.text.trim()}\n---\n`;
  }

  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest?.('[data-testid="editor-assistant-send"]');
      if (!button || button.dataset.kbPass === "1") return;
      const base = selectedBase();
      if (!base || !base.text.trim()) return;
      const current = (editorElement()?.__lexicalTextContent || "").trim();
      if (!current || current.startsWith("[Knowledge base:")) return;
      const next = knowledgePrefix(base) + current;
      const note = document.querySelector("[data-mirelo-kb-select] [data-kb-note]");
      if (next.length > LIMIT) {
        event.preventDefault();
        event.stopPropagation();
        if (note) note.textContent = `Over ${LIMIT} characters. Shorten the prompt or the knowledge base.`;
        return;
      }
      if (note) note.textContent = "";
      event.preventDefault();
      event.stopPropagation();
      setEditorText(next);
      setTimeout(() => {
        button.dataset.kbPass = "1";
        button.click();
        button.dataset.kbPass = "";
      }, 50);
    },
    true,
  );

  function bookIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML =
      '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>';
    return svg;
  }

  function ensureNav() {
    const menu = document.querySelector('a[href="/studio/projects"]')?.closest("ul");
    if (!menu) return;
    let item = menu.querySelector("[data-mirelo-kb-nav]");
    if (!item) {
      const template = menu.querySelector("li");
      if (!template) return;
      item = template.cloneNode(true);
      item.setAttribute("data-mirelo-kb-nav", "");
      const link = item.querySelector("a");
      if (!link) return;
      link.setAttribute("href", "#knowledge");
      link.setAttribute("aria-label", "Knowledge");
      link.removeAttribute("aria-current");
      const label = link.querySelector("span:last-child");
      if (label) label.textContent = "Knowledge";
      const icon = link.querySelector("span[aria-hidden='true'], svg");
      if (icon) icon.replaceWith(bookIcon());
      link.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();
          history.pushState(null, "", `${location.pathname}${location.search}#knowledge`);
          render();
        },
        true,
      );
      menu.append(item);
    }
    const link = item.querySelector("a");
    const active = location.hash === "#knowledge";
    link.dataset.active = active ? "true" : "false";
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }

  function closeMenus() {
    for (const menu of document.querySelectorAll("[data-kb-menu]")) {
      menu.hidden = true;
      menu.parentElement?.querySelector("[data-kb-trigger]")?.setAttribute("aria-expanded", "false");
    }
  }

  function closeModal() {
    const modal = document.querySelector("[data-mirelo-kb-modal]");
    if (modal) modal.hidden = true;
  }

  function openModal() {
    let modal = document.querySelector("[data-mirelo-kb-modal]");
    if (!modal) {
      modal = document.createElement("div");
      modal.setAttribute("data-mirelo-kb-modal", "");
      modal.innerHTML = `
        <form>
          <h2>Add knowledge base</h2>
          <input name="name" placeholder="Name" required />
          <textarea name="text" placeholder="What should the assistant know?" required></textarea>
          <div class="kb-actions">
            <button type="button" data-kb-cancel>Cancel</button>
            <button class="primary" type="submit">Add</button>
          </div>
        </form>`;
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
      });
      modal.querySelector("[data-kb-cancel]").addEventListener("click", closeModal);
      modal.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const name = form.name.value.trim();
        const text = form.text.value.trim();
        if (!name || !text) return;
        const data = load();
        const id = crypto.randomUUID();
        data.bases.push({ id, name, text });
        data.selectedId = id;
        save(data);
        form.reset();
        closeModal();
      });
      document.body.append(modal);
    }
    modal.hidden = false;
    modal.querySelector("input").focus();
  }

  function menuButton(label, checked, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (checked) button.dataset.checked = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    return button;
  }

  function choose(id) {
    const data = load();
    data.selectedId = id;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const note = document.querySelector("[data-mirelo-kb-select] [data-kb-note]");
    if (note) note.textContent = "";
    closeMenus();
    render();
  }

  function ensureSelector() {
    const composer = document.querySelector('[data-testid="editor-assistant-composer"]');
    if (!composer || !composer.parentElement) return;
    let row = composer.parentElement.querySelector("[data-mirelo-kb-select]");
    if (!row || row.querySelector("select")) {
      row?.remove();
      row = document.createElement("div");
      row.setAttribute("data-mirelo-kb-select", "");
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.setAttribute("data-kb-trigger", "");
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      const menu = document.createElement("div");
      menu.setAttribute("data-kb-menu", "");
      menu.hidden = true;
      const note = document.createElement("span");
      note.setAttribute("data-kb-note", "");
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = menu.hidden;
        closeMenus();
        if (!willOpen) return;
        const rect = trigger.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 6}px`;
        menu.style.left = `${rect.left}px`;
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      });
      row.append(trigger, menu, note);
      composer.parentElement.insertBefore(row, composer);
    }

    const data = load();
    const trigger = row.querySelector("[data-kb-trigger]");
    const menu = row.querySelector("[data-kb-menu]");
    const selected = data.bases.find((base) => base.id === data.selectedId);
    trigger.textContent = selected ? selected.name : PLACEHOLDER;
    const signature = JSON.stringify(data.bases.map((base) => [base.id, base.name, base.id === data.selectedId]));
    if (menu.dataset.signature === signature) return;
    menu.dataset.signature = signature;
    menu.replaceChildren();
    for (const base of data.bases) {
      menu.append(menuButton(base.name, base.id === data.selectedId, () => choose(base.id)));
    }
    menu.append(menuButton("None", false, () => choose(null)));
    menu.append(menuButton("Add +", false, () => {
      closeMenus();
      openModal();
    }));
  }

  function paintList(page) {
    const data = load();
    const list = page.querySelector("[data-kb-list]");
    const signature = JSON.stringify(data.bases);
    if (list.dataset.signature === signature) return;
    list.dataset.signature = signature;
    list.replaceChildren();
    if (data.bases.length === 0) {
      const empty = document.createElement("p");
      empty.className = "kb-empty";
      empty.textContent = "No knowledge bases yet.";
      list.append(empty);
      return;
    }
    for (const base of data.bases) {
      const card = document.createElement("article");
      card.className = "kb-card";
      const body = document.createElement("div");
      const title = document.createElement("h2");
      title.textContent = base.name;
      const copy = document.createElement("p");
      copy.textContent = base.text;
      body.append(title, copy);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        const next = load();
        next.bases = next.bases.filter((item) => item.id !== base.id);
        if (next.selectedId === base.id) next.selectedId = null;
        save(next);
      });
      card.append(body, remove);
      list.append(card);
    }
  }

  function buildPage() {
    const page = document.createElement("div");
    page.setAttribute("data-mirelo-kb-page", "");
    page.innerHTML = `
      <div class="kb-wrap">
        <h1>Knowledge</h1>
        <p class="kb-sub">Notes the editor assistant receives with your prompt. Stored in this browser only.</p>
        <div class="kb-list" data-kb-list></div>
        <form>
          <input name="name" placeholder="Name" required />
          <textarea name="text" placeholder="What should the assistant know?" required></textarea>
          <div class="kb-actions">
            <button class="primary" type="submit">Add knowledge base</button>
          </div>
        </form>
      </div>`;
    page.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const name = form.name.value.trim();
      const text = form.text.value.trim();
      if (!name || !text) return;
      const data = load();
      data.bases.push({ id: crypto.randomUUID(), name, text });
      save(data);
      form.reset();
    });
    return page;
  }

  function ensurePage() {
    const inset = document.querySelector('main[data-slot="sidebar-inset"]');
    if (!inset) return;
    const open = location.hash === "#knowledge";
    let page = inset.querySelector("[data-mirelo-kb-page]");
    if (!open) {
      page?.remove();
      for (const child of inset.querySelectorAll("[data-kb-hidden]")) {
        child.style.display = child.dataset.kbDisplay || "";
        child.removeAttribute("data-kb-hidden");
      }
      return;
    }
    if (!page) {
      for (const child of [...inset.children]) {
        child.dataset.kbDisplay = child.style.display || "";
        child.style.display = "none";
        child.setAttribute("data-kb-hidden", "");
      }
      page = buildPage();
      inset.append(page);
    }
    paintList(page);
  }

  let scheduled = false;
  function render() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      ensureNav();
      ensureSelector();
      ensurePage();
    });
  }

  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("[data-mirelo-kb-select]")) closeMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeMenus();
    closeModal();
  });
  window.addEventListener("popstate", render);
  window.addEventListener("hashchange", render);

  function start() {
    if (!document.documentElement) return;
    const observer = new MutationObserver(render);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    render();
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
