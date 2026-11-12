(() => {
  if (window.__mireloKnowledge) return;
  window.__mireloKnowledge = true;

  const STORAGE_KEY = "mirelo-knowledge";
  const LIMIT = 4000;
  const PLACEHOLDER = "Select knowledge base";
  const PAGE_SOURCE = "mirelo-knowledge-page";
  const EXTENSION_SOURCE = "mirelo-knowledge-extension";
  const OPTIMIZE_FIELDS = new Set(["context", "speech", "music", "sfx"]);
  const OPTIMIZE_ERRORS = {
    empty: "Write a prompt first.",
    "too-long": `Over ${LIMIT} characters. Shorten the prompt.`,
    "missing-key": "Add your OpenAI API key in the extension options.",
    auth: "The saved API key was rejected. Replace it in the extension options.",
    rate: "OpenAI is rate limiting requests. Try again in a moment.",
    busy: "An optimization is already running.",
    failed: "The OpenAI request failed.",
  };

  const ICONS = {
    speech: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 17v5"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    sfx: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12h3l3-8 4 16 3-8h7"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>',
    chevron: '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };

  const ASPECTS = [
    {
      id: "speech",
      label: "Speech",
      icon: ICONS.speech,
      placeholder: "e.g. A warm, friendly narrator who speaks like a trusted friend…",
      groups: {
        "Voice Characteristics": ["Deep", "High-pitched", "Warm", "Breathy", "Raspy"],
        "Vocal Delivery": ["Conversational", "Narrative", "Instructional", "Theatrical", "Whispered"],
        "Emotion & Tone": ["Calm", "Joyful", "Confident", "Serious", "Empathetic"],
        "Pace & Rhythm": ["Slow", "Fast", "Steady", "Rhythmic", "Deliberate"],
        "Articulation & Prosody": ["Clear", "Precise", "Monotone", "Expressive", "Emphatic"],
      },
    },
    {
      id: "music",
      label: "Sound & Music",
      icon: ICONS.music,
      placeholder: "e.g. Soft acoustic textures, light percussion, never overpowering the voice…",
      groups: {
        "Mood & Atmosphere": ["Peaceful", "Mysterious", "Tense", "Uplifting", "Melancholic"],
        "Timbre & Texture": ["Warm", "Bright", "Dark", "Smooth", "Gritty"],
        "Rhythm & Tempo": ["Slow", "Fast", "Pulsating", "Steady", "Irregular"],
        "Dynamics & Intensity": ["Subtle", "Gentle", "Powerful", "Intense", "Restrained"],
        "Style & Aesthetics": ["Organic", "Electronic", "Cinematic", "Ambient", "Experimental"],
      },
    },
    {
      id: "sfx",
      label: "SFX",
      icon: ICONS.sfx,
      placeholder: "e.g. Short, rounded UI sounds; cartoonish but never harsh…",
      groups: {
        "Realism & Stylization": ["Realistic", "Hyperrealistic", "Stylized", "Abstract", "Synthetic"],
        "Intensity & Presence": ["Subtle", "Restrained", "Balanced", "Punchy", "Exaggerated"],
        "Texture & Character": ["Clean", "Organic", "Polished", "Gritty", "Minimal"],
      },
    },
  ];

  function emptyAspect() {
    return { description: "", attributes: [] };
  }

  function emptySound() {
    return Object.fromEntries(ASPECTS.map((aspect) => [aspect.id, emptyAspect()]));
  }

  const expandedIds = new Set();

  function createEditorState() {
    return {
      name: "",
      context: "",
      sound: emptySound(),
      activeAspect: "speech",
      inspirationOpen: true,
    };
  }

  const pageState = createEditorState();

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
    [data-mirelo-kb-select] [data-kb-pill] { margin: 0; }
    [data-mirelo-kb-modal] {
      position: fixed;
      inset: 0;
      z-index: 90;
      display: flex;
      background: rgba(0, 0, 0, 0.55);
    }
    [data-mirelo-kb-modal][hidden] { display: none; }
    [data-mirelo-kb-modal] {
      align-items: flex-start;
      overflow: auto;
      padding: 32px 16px;
    }
    [data-mirelo-kb-modal] form {
      width: min(760px, 100%);
      margin: auto;
      flex: none;
      color: #f2f2f2;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    }
    [data-kb-pill] {
      display: inline-flex;
      align-self: flex-start;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      height: 28px;
      margin: 0 0 8px;
      padding: 0 12px;
      border: 1px solid #3a3a3a;
      border-radius: 999px;
      background: #1c1c1c;
      color: inherit;
      font: inherit;
      font-size: 13px;
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
    }
    [data-kb-pill] span { overflow: hidden; text-overflow: ellipsis; }
    [data-kb-pill] svg { width: 14px; height: 14px; display: block; flex: none; }
    [data-kb-pill]:hover { background: #2a2a2a; }
    [data-kb-hidden-line] { display: none !important; }
    [data-kb-prompt] { display: block; white-space: pre-wrap; }
    [data-mirelo-kb-view] {
      position: fixed;
      inset: 0;
      z-index: 95;
      display: flex;
      overflow: auto;
      padding: 32px 16px;
      background: rgba(0, 0, 0, 0.55);
    }
    [data-mirelo-kb-view][hidden] { display: none; }
    [data-mirelo-kb-view] .kb-view-card {
      width: min(720px, 100%);
      margin: auto;
      flex: none;
      color: #f2f2f2;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    }
    [data-mirelo-kb-view] .kb-missing { margin: 0; color: #9a9a9a; font-size: 13px; }
    [data-mirelo-kb-page] {
      box-sizing: border-box;
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: auto;
      overscroll-behavior: contain;
      padding: 40px 20px 64px;
      background: #000;
    }
    .kb-ui {
      color: #f2f2f2;
      font: inherit;
      font-size: 15px;
      line-height: 1.5;
    }
    .kb-ui * { box-sizing: border-box; }
    .kb-ui button,
    .kb-ui input,
    .kb-ui textarea { font: inherit; color: inherit; height: auto; }
    .kb-ui .kb-wrap {
      max-width: 880px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .kb-ui .page-header h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .kb-ui .page-header p { margin: 0; color: #9a9a9a; }
    .kb-ui .kb-list { display: flex; flex-direction: column; gap: 20px; }
    .kb-ui.card,
    .kb-ui .card {
      background: #121212;
      border: 1px solid #2a2a2a;
      border-radius: 24px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .kb-ui .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .kb-ui .card-copy { flex: 1; min-width: 0; }
    .kb-ui .card-title { font-weight: 600; font-size: 16px; margin: 0 0 4px; }
    .kb-ui .card-body { color: #cfcfcf; margin: 0; white-space: pre-line; overflow-wrap: break-word; }
    .kb-ui .card-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .kb-ui .btn {
      border-radius: 999px;
      padding: 8px 16px;
      border: 1px solid #3a3a3a;
      background: #1b1b1b;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .kb-ui .btn:hover { background: #242424; }
    .kb-ui .btn-primary {
      background: #ececec;
      color: #0a0a0a;
      border-color: #ececec;
      font-weight: 500;
      padding: 10px 20px;
    }
    .kb-ui .btn-primary:hover { background: #fff; }
    .kb-ui .btn-primary:disabled,
    .kb-ui .btn-primary:disabled:hover {
      background: #ececec;
      opacity: .4;
      cursor: not-allowed;
    }
    .kb-ui .btn-ghost {
      background: transparent;
      border-color: transparent;
      color: #9a9a9a;
      padding: 6px 10px;
    }
    .kb-ui .btn-ghost:hover { background: #1b1b1b; color: #f2f2f2; }
    .kb-ui .profile-toggle { align-self: flex-start; }
    .kb-ui .btn:focus-visible,
    .kb-ui .chip:focus-visible,
    .kb-ui .tab:focus-visible,
    .kb-ui .input:focus-visible { outline: 2px solid #f2f2f2; outline-offset: 2px; }
    .kb-ui .input {
      width: 100%;
      background: #1b1b1b;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      padding: 14px 16px;
      outline: none;
    }
    .kb-ui .input::placeholder { color: #6b6b6b; }
    .kb-ui .input:focus { border-color: #3a3a3a; }
    .kb-ui textarea.input { resize: vertical; min-height: 96px; line-height: 1.55; }
    .kb-ui .optimize-field { position: relative; display: flex; flex-direction: column; }
    .kb-ui .optimize-field > .input { margin: 0; padding-right: 46px; }
    .kb-ui .optimize-field > textarea.input { padding-bottom: 46px; }
    .kb-ui .optimize-btn {
      position: absolute;
      right: 10px;
      bottom: 10px;
      z-index: 1;
      width: 28px;
      height: 28px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: 1px solid #3a3a3a;
      background: #121212;
      color: #cfcfcf;
      cursor: pointer;
    }
    .kb-ui .optimize-field:has(textarea) .optimize-btn { bottom: 20px; }
    .kb-ui .optimize-btn svg { width: 14px; height: 14px; display: block; }
    .kb-ui .optimize-btn:hover { background: #242424; color: #f2f2f2; }
    .kb-ui .optimize-btn:focus-visible { outline: 2px solid #f2f2f2; outline-offset: 2px; }
    .kb-ui textarea.optimize-readonly {
      min-height: 0;
      resize: none;
      color: #cfcfcf;
      cursor: default;
    }
    [data-optimize-modal] {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: flex;
      align-items: flex-start;
      overflow: auto;
      padding: 32px 16px;
      background: rgba(0, 0, 0, 0.55);
    }
    [data-optimize-modal][hidden] { display: none; }
    [data-optimize-modal] [hidden] { display: none !important; }
    [data-optimize-modal] .optimize-dialog {
      width: min(640px, 100%);
      margin: auto;
      flex: none;
      color: #f2f2f2;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    }
    [data-optimize-modal] .optimize-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 36px 8px;
      text-align: center;
    }
    [data-optimize-modal] .optimize-loading p { margin: 0; color: #cfcfcf; }
    [data-optimize-modal] .optimize-spinner {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #3a3a3a;
      border-top-color: #f2f2f2;
      animation: kb-optimize-spin .8s linear infinite;
    }
    @keyframes kb-optimize-spin { to { transform: rotate(360deg); } }
    [data-optimize-modal] .optimize-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    [data-optimize-modal] [data-optimize-error] {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 28px 8px;
      text-align: center;
    }
    [data-optimize-modal] [data-optimize-error] p { margin: 0; color: #cfcfcf; }
    [data-optimize-modal] [data-optimize-result] {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .kb-ui .field-label {
      font-size: 13px;
      color: #9a9a9a;
      margin: 0 0 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kb-ui .optional { color: #6b6b6b; font-weight: 400; }
    .kb-ui .section {
      border-top: 1px solid #2a2a2a;
      padding-top: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .kb-ui .section-head h2 { font-size: 15px; font-weight: 600; margin: 0 0 2px; }
    .kb-ui .section-head p { margin: 0; color: #9a9a9a; font-size: 13px; }
    .kb-ui .tabs {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: #1b1b1b;
      border: 1px solid #2a2a2a;
      border-radius: 999px;
      width: fit-content;
      max-width: 100%;
      overflow-x: auto;
    }
    .kb-ui .tab {
      border: 0;
      background: transparent;
      border-radius: 999px;
      padding: 8px 14px;
      cursor: pointer;
      color: #9a9a9a;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      white-space: nowrap;
    }
    .kb-ui .tab:hover { color: #f2f2f2; }
    .kb-ui .tab[aria-selected="true"] { background: #2c2c2c; color: #f2f2f2; }
    .kb-ui .tab svg,
    .kb-ui .profile-label svg,
    .kb-ui .inspiration-toggle svg { width: 16px; height: 16px; display: block; flex: none; }
    .kb-ui .profile-label svg { width: 15px; height: 15px; }
    .kb-ui .tab-count {
      font-size: 11px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      background: #ececec;
      color: #0a0a0a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    .kb-ui .aspect-panel { display: flex; flex-direction: column; gap: 12px; }
    .kb-ui .selected-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 28px; }
    .kb-ui .selected-row .hint { color: #6b6b6b; font-size: 13px; }
    .kb-ui .inspiration { background: #0d0d0d; border: 1px solid #2a2a2a; border-radius: 18px; overflow: hidden; }
    .kb-ui .inspiration-toggle {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: transparent;
      border: 0;
      cursor: pointer;
      font-size: 14px;
    }
    .kb-ui .inspiration-toggle .left { display: inline-flex; align-items: center; gap: 8px; }
    .kb-ui .inspiration-toggle svg { color: #9a9a9a; }
    .kb-ui .chevron { transition: transform .2s; }
    .kb-ui .inspiration[data-open="true"] .chevron { transform: rotate(180deg); }
    .kb-ui .inspiration-body { display: none; padding: 4px 16px 16px; flex-direction: column; gap: 14px; }
    .kb-ui .inspiration[data-open="true"] .inspiration-body { display: flex; }
    .kb-ui .attr-group { display: grid; grid-template-columns: 1fr; gap: 8px; }
    .kb-ui .attr-group-label { font-size: 13px; color: #9a9a9a; }
    .kb-ui .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .kb-ui .chip {
      border: 1px solid #2a2a2a;
      background: #1b1b1b;
      color: #d6d6d6;
      border-radius: 999px;
      padding: 5px 12px;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .kb-ui .chip:hover { border-color: #3a3a3a; color: #f2f2f2; }
    .kb-ui .chip[aria-pressed="true"] { background: #ececec; color: #0a0a0a; border-color: #ececec; }
    .kb-ui .chip-static { cursor: default; }
    .kb-ui .chip-static:hover { border-color: #2a2a2a; color: #d6d6d6; }
    .kb-ui .chip-remove { background: #ececec; color: #0a0a0a; border-color: #ececec; padding-right: 8px; }
    .kb-ui .chip-remove:hover { color: #0a0a0a; }
    .kb-ui .chip svg { width: 12px; height: 12px; display: block; flex: none; }
    .kb-ui .form-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .kb-ui .kb-actions { display: flex; gap: 8px; align-items: center; }
    .kb-ui .editor-title { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
    .kb-ui .summary-text { font-size: 13px; color: #6b6b6b; }
    .kb-ui .profile { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid #2a2a2a; padding-top: 14px; }
    .kb-ui .profile-row { display: grid; grid-template-columns: 1fr; gap: 6px; }
    .kb-ui .profile-label { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #9a9a9a; }
    .kb-ui .profile-content { display: flex; flex-direction: column; gap: 6px; }
    .kb-ui .profile-content p { margin: 0; color: #cfcfcf; font-size: 14px; white-space: pre-line; }
    .kb-ui .profile-content .chip { font-size: 12px; padding: 3px 10px; }
    .kb-ui .empty { color: #6b6b6b; font-size: 14px; margin: 0; }
    @media (min-width: 640px) {
      .kb-ui .attr-group { grid-template-columns: 180px 1fr; align-items: center; }
      .kb-ui .profile-row { grid-template-columns: 140px 1fr; }
    }
  `;
  document.documentElement.append(style);

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));

  function aspectById(id) {
    return ASPECTS.find((aspect) => aspect.id === id);
  }

  function aspectFilled(aspect) {
    return aspect.description.trim().length > 0 || aspect.attributes.length > 0;
  }

  function aspectCount(aspect) {
    return aspect.attributes.length + (aspect.description.trim() ? 1 : 0);
  }

  function filledAspects(sound) {
    return ASPECTS.filter((aspect) => aspectFilled(sound[aspect.id]));
  }

  function knownAttribute(aspectId, tag) {
    const aspect = aspectById(aspectId);
    return !!aspect && Object.values(aspect.groups).some((tags) => tags.includes(tag));
  }

  function toggleAttribute(state, tag) {
    const value = state.sound[state.activeAspect];
    value.attributes = value.attributes.includes(tag)
      ? value.attributes.filter((item) => item !== tag)
      : [...value.attributes, tag];
  }

  function soundForSave(sound) {
    return Object.fromEntries(ASPECTS.map((aspect) => [aspect.id, {
      description: sound[aspect.id].description.trim(),
      attributes: [...sound[aspect.id].attributes],
    }]));
  }

  function normalizeAspect(aspect) {
    const source = aspect && typeof aspect === "object" ? aspect : {};
    const raw = Array.isArray(source.attributes) ? source.attributes : [];
    const description = typeof source.description === "string"
      ? source.description
      : typeof source.text === "string"
        ? source.text
        : "";
    return {
      description,
      attributes: [...new Set(raw.filter((item) => typeof item === "string"))],
    };
  }

  function normalizeBase(base) {
    if (!base || typeof base !== "object") return null;
    const name = typeof base.name === "string" ? base.name.trim() : "";
    if (!name) return null;
    const legacy = typeof base.text === "string" ? base.text : "";
    return {
      id: String(base.id || crypto.randomUUID()),
      name,
      context: typeof base.context === "string" ? base.context : legacy,
      sound: Object.fromEntries(ASPECTS.map((aspect) => [aspect.id, normalizeAspect(base.sound?.[aspect.id])])),
    };
  }

  function baseNeedsMigration(base) {
    if (!base || typeof base !== "object") return true;
    if (typeof base.context !== "string" || "text" in base || !base.sound) return true;
    return ASPECTS.some((aspect) => {
      const value = base.sound[aspect.id];
      return !value || typeof value.description !== "string" || !Array.isArray(value.attributes);
    });
  }

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
        const bases = parsed.bases.map(normalizeBase).filter(Boolean);
        const selectedId = bases.some((base) => base.id === parsed.selectedId) ? parsed.selectedId : null;
        const data = { bases, selectedId };
        if (parsed.bases.some(baseNeedsMigration) || parsed.selectedId !== selectedId) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        return data;
      }
    } catch {
      /* seed below */
    }
    const seed = {
      bases: [
        {
          id: "example",
          name: "Example",
          context: "Prefer warm acoustic instruments. Avoid electronic drums and harsh distortion.",
          sound: emptySound(),
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

  function knowledgeBody(base) {
    const parts = [];
    const context = base.context.trim();
    if (context) parts.push(context);
    const blocks = [];
    for (const aspect of ASPECTS) {
      const value = base.sound[aspect.id];
      if (!aspectFilled(value)) continue;
      const lines = [`${aspect.label}:`];
      if (value.description.trim()) lines.push(value.description.trim());
      if (value.attributes.length) lines.push(`Attributes: ${value.attributes.join(", ")}`);
      blocks.push(lines.join("\n"));
    }
    if (blocks.length) parts.push(blocks.join("\n\n"));
    return parts.join("\n\n");
  }

  function knowledgePrefix(base) {
    const body = knowledgeBody(base);
    if (!body) return "";
    return `[Knowledge base: ${base.name}]\n${body}\n---\n`;
  }

  function parseKnowledgeMessage(text) {
    const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
    const match = normalized.match(/^\[Knowledge base: ([^\n\]]+)\]\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return null;
    return { name: match[1], body: match[2].trim(), prompt: match[3].trim() };
  }

  function parseKnowledgeBody(body) {
    const sound = emptySound();
    const descriptions = Object.fromEntries(ASPECTS.map((aspect) => [aspect.id, []]));
    const labels = Object.fromEntries(ASPECTS.map((aspect) => [aspect.label, aspect.id]));
    const context = [];
    let current = null;
    for (const line of String(body || "").split("\n")) {
      const heading = line.trim().replace(/:$/, "");
      if (labels[heading] && line.trim().endsWith(":")) {
        current = labels[heading];
        continue;
      }
      if (!current) {
        context.push(line);
        continue;
      }
      if (line.startsWith("Attributes:")) {
        sound[current].attributes = line.slice("Attributes:".length).split(",").map((item) => item.trim()).filter(Boolean);
      } else if (line.trim()) descriptions[current].push(line);
    }
    for (const aspect of ASPECTS) sound[aspect.id].description = descriptions[aspect.id].join("\n");
    return { context: context.join("\n").trim(), sound };
  }

  function baseByName(name) {
    const data = load();
    const selected = data.bases.find((base) => base.id === data.selectedId && base.name === name);
    return selected || data.bases.find((base) => base.name === name) || null;
  }

  function makePill(name, raw) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.kbPill = "";
    button.dataset.kbName = name;
    if (raw) button.dataset.kbRaw = raw;
    button.setAttribute("aria-label", `View knowledge base ${name}`);
    const label = document.createElement("span");
    label.textContent = name;
    button.append(bookIcon(), label);
    return button;
  }

  function collapseKnowledgeMessage(el) {
    if (el.querySelector(":scope > [data-kb-pill]")) return;
    const children = [...el.children];
    if (children.length >= 2) {
      const lines = children.map((child) => (child.innerText || "").trim());
      const start = lines.findIndex((line) => line.startsWith("[Knowledge base:"));
      const dash = lines.findIndex((line, index) => index > start && line === "---");
      if (start !== -1 && dash !== -1 && lines[start].endsWith("]")) {
        const name = lines[start].slice("[Knowledge base: ".length, -1);
        const raw = children.slice(start, dash + 1).map((child) => child.innerText).join("\n");
        for (let i = start; i <= dash; i++) children[i].setAttribute("data-kb-hidden-line", "");
        children[start].before(makePill(name, raw));
        return;
      }
    }
    const visible = el.innerText || "";
    const parsed = parseKnowledgeMessage(visible);
    if (!parsed) return;
    const hidden = document.createElement("span");
    hidden.dataset.kbHiddenLine = "";
    while (el.firstChild) hidden.append(el.firstChild);
    const prompt = document.createElement("div");
    prompt.dataset.kbPrompt = "";
    prompt.textContent = parsed.prompt;
    el.append(makePill(parsed.name, visible), prompt, hidden);
  }

  function ensureChatPills() {
    if (!document.body?.textContent?.includes("[Knowledge base:")) return;
    const skip = "[data-mirelo-kb-page], [data-mirelo-kb-modal], [data-mirelo-kb-view], [data-testid='editor-assistant-input'], [data-testid='editor-assistant-composer']";
    const candidates = [];
    for (const el of document.querySelectorAll("p, div, li, article, section")) {
      if (el.closest(skip) || el.querySelector("[data-kb-pill]")) continue;
      const raw = el.textContent || "";
      if (!raw.includes("[Knowledge base:") || !raw.includes("---")) continue;
      candidates.push(el);
    }
    const smallest = candidates.filter((el) => !candidates.some((other) => other !== el && el.contains(other)));
    for (const el of smallest) {
      const visible = el.innerText || "";
      if (visible.includes("[Knowledge base:") && visible.includes("---")) collapseKnowledgeMessage(el);
    }
  }

  function profileRowsHtml(sound) {
    return filledAspects(sound).map((aspect) => {
      const value = sound[aspect.id];
      return `
        <div class="profile-row">
          <span class="profile-label">${aspect.icon}${esc(aspect.label)}</span>
          <div class="profile-content">
            ${value.description ? `<p>${esc(value.description)}</p>` : ""}
            ${value.attributes.length ? `<div class="chips">${value.attributes.map((tag) => `<span class="chip chip-static">${esc(tag)}</span>`).join("")}</div>` : ""}
          </div>
        </div>`;
    }).join("");
  }

  function closeKnowledgeView() {
    const view = document.querySelector("[data-mirelo-kb-view]");
    if (view) view.hidden = true;
  }

  function openKnowledgeView(name, pill) {
    const stored = baseByName(name);
    let base = stored;
    if (!base) {
      const raw = pill?.dataset.kbRaw || "";
      const parsed = parseKnowledgeMessage(raw.endsWith("\n") ? raw : `${raw}\n`);
      base = parsed
        ? { name, ...parseKnowledgeBody(parsed.body) }
        : { name, context: "", sound: emptySound() };
    }
    let view = document.querySelector("[data-mirelo-kb-view]");
    if (!view) {
      view = document.createElement("div");
      view.hidden = true;
      view.setAttribute("data-mirelo-kb-view", "");
      view.addEventListener("click", (event) => {
        if (event.target === view || event.target.closest("[data-kb-view-close]")) closeKnowledgeView();
      });
      document.body.append(view);
    }
    const rows = profileRowsHtml(base.sound);
    view.innerHTML = `
      <div class="card kb-ui kb-view-card" role="dialog" aria-modal="true" aria-label="${esc(base.name)}">
        <div class="card-head">
          <h2 class="editor-title">${esc(base.name)}</h2>
          <button type="button" class="btn" data-kb-view-close>Close</button>
        </div>
        ${stored ? "" : '<p class="kb-missing">This knowledge base is no longer saved in this browser.</p>'}
        ${base.context ? `<p class="card-body">${esc(base.context)}</p>` : ""}
        ${rows ? `<div class="profile">${rows}</div>` : ""}
      </div>`;
    view.hidden = false;
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

  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest?.('[data-testid="editor-assistant-send"]');
      if (!button || button.dataset.kbPass === "1") return;
      const base = selectedBase();
      const prefix = base && knowledgePrefix(base);
      if (!prefix) return;
      const current = (editorElement()?.__lexicalTextContent || "").trim();
      if (!current || current.startsWith("[Knowledge base:")) return;
      const next = prefix + current;
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

  let optimizeTarget = null;

  function optimizeField(field, root) {
    if (field.hasAttribute("data-kb-context")) return "context";
    const aspectId = root.kbState?.activeAspect;
    return OPTIMIZE_FIELDS.has(aspectId) ? aspectId : "";
  }

  function ensureOptimizeModal() {
    let modal = document.querySelector("[data-optimize-modal]");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.setAttribute("data-optimize-modal", "");
    modal.className = "kb-ui";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="card optimize-dialog" role="dialog" aria-modal="true" aria-label="Optimize prompt">
        <div class="optimize-loading" data-optimize-loading>
          <div class="optimize-spinner" aria-hidden="true"></div>
          <p data-optimize-status aria-live="polite">Analyzing prompt ...</p>
        </div>
        <div data-optimize-error hidden>
          <p data-optimize-error-text></p>
          <div class="optimize-actions">
            <button type="button" class="btn btn-primary" data-optimize-action="options">Open extension options</button>
            <button type="button" class="btn" data-optimize-action="close">Close</button>
          </div>
        </div>
        <div data-optimize-result hidden>
          <div>
            <p class="field-label">Original prompt</p>
            <textarea class="input optimize-readonly" data-optimize-original readonly rows="5"></textarea>
          </div>
          <div>
            <p class="field-label">Suggested improvements</p>
            <textarea class="input optimize-readonly" data-optimize-improvements readonly rows="4"></textarea>
          </div>
          <div>
            <p class="field-label">Optimized Prompt</p>
            <textarea class="input optimize-readonly" data-optimize-prompt readonly rows="4"></textarea>
          </div>
          <div class="optimize-actions">
            <button type="button" class="btn btn-primary" data-optimize-action="accept">Accept optimized prompt</button>
            <button type="button" class="btn" data-optimize-action="keep">Keep original prompt</button>
          </div>
        </div>
      </div>`;
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeOptimize(false);
        return;
      }
      const action = event.target.closest("[data-optimize-action]");
      if (!action || !modal.contains(action)) return;
      if (action.dataset.optimizeAction === "options") {
        window.postMessage({ source: PAGE_SOURCE, type: "open-options" }, "https://mirelo.ai");
        return;
      }
      closeOptimize(action.dataset.optimizeAction === "accept");
    });
    document.body.append(modal);
    return modal;
  }

  function showOptimizeError(modal, code) {
    modal.querySelector("[data-optimize-loading]").hidden = true;
    modal.querySelector("[data-optimize-result]").hidden = true;
    const error = modal.querySelector("[data-optimize-error]");
    error.hidden = false;
    error.querySelector("[data-optimize-error-text]").textContent = OPTIMIZE_ERRORS[code] || OPTIMIZE_ERRORS.failed;
    const options = error.querySelector("[data-optimize-action='options']");
    options.hidden = code !== "missing-key" && code !== "auth";
    (options.hidden ? error.querySelector("[data-optimize-action='close']") : options).focus();
  }

  function showOptimizeResult(modal, original, improvements, prompt) {
    modal.querySelector("[data-optimize-loading]").hidden = true;
    modal.querySelector("[data-optimize-error]").hidden = true;
    const result = modal.querySelector("[data-optimize-result]");
    result.hidden = false;
    result.querySelector("[data-optimize-original]").value = original;
    result.querySelector("[data-optimize-improvements]").value = improvements;
    result.querySelector("[data-optimize-prompt]").value = prompt;
    result.querySelector("[data-optimize-action='accept']")?.focus();
  }

  function openOptimize(root, field, trigger) {
    const modal = ensureOptimizeModal();
    const loading = modal.querySelector("[data-optimize-loading]");
    if (optimizeTarget && !modal.hidden && !loading.hidden) return;
    const text = field.value.trim();
    const fieldId = optimizeField(field, root);
    const requestId = crypto.randomUUID();
    optimizeTarget = {
      root,
      trigger,
      kind: field.hasAttribute("data-kb-context") ? "context" : "aspect",
      aspectId: root.kbState?.activeAspect,
      requestId,
      text,
      prompt: "",
    };
    modal.querySelector("[data-optimize-result]").hidden = true;
    modal.querySelector("[data-optimize-error]").hidden = true;
    modal.hidden = false;
    if (!text) {
      showOptimizeError(modal, "empty");
      return;
    }
    if (text.length > LIMIT) {
      showOptimizeError(modal, "too-long");
      return;
    }
    if (!fieldId) {
      showOptimizeError(modal, "failed");
      return;
    }
    modal.querySelector("[data-optimize-loading]").hidden = false;
    modal.querySelector("[data-optimize-status]").textContent = "Analyzing prompt ...";
    window.postMessage({
      source: PAGE_SOURCE,
      type: "optimize",
      requestId,
      text,
      field: fieldId,
    }, "https://mirelo.ai");
  }

  function applyOptimized(target) {
    const prompt = target.prompt;
    const state = target.root?.kbState;
    if (!prompt || !state) return;
    if (target.kind === "context") {
      state.context = prompt;
      const live = target.root.querySelector("[data-kb-context]");
      if (live) live.value = prompt;
      return;
    }
    const aspect = state.sound[target.aspectId];
    if (!aspect) return;
    aspect.description = prompt;
    if (state.activeAspect === target.aspectId) {
      const live = target.root.querySelector("[data-aspect-text]");
      if (live) live.value = prompt;
    }
    renderTabs(target.root, state);
    renderSummary(target.root, state);
  }

  function closeOptimize(accept) {
    const modal = document.querySelector("[data-optimize-modal]");
    if (!modal || modal.hidden) return false;
    if (accept && optimizeTarget) applyOptimized(optimizeTarget);
    modal.hidden = true;
    const trigger = optimizeTarget?.trigger;
    optimizeTarget = null;
    if (trigger?.isConnected) trigger.focus();
    return true;
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== "https://mirelo.ai") return;
    const data = event.data;
    if (!data || data.source !== EXTENSION_SOURCE || data.type !== "optimize-result") return;
    const modal = document.querySelector("[data-optimize-modal]");
    if (!modal || modal.hidden || !optimizeTarget || data.requestId !== optimizeTarget.requestId) return;
    if (data.ok && data.prompt && data.improvements) {
      optimizeTarget.prompt = data.prompt;
      showOptimizeResult(modal, optimizeTarget.text, data.improvements, data.prompt);
      return;
    }
    showOptimizeError(modal, data.error || "failed");
  });

  function openModal() {
    let modal = document.querySelector("[data-mirelo-kb-modal]");
    if (!modal) {
      modal = document.createElement("div");
      modal.setAttribute("data-mirelo-kb-modal", "");
      modal.innerHTML = `
        <form class="card kb-ui" data-kb-form data-kb-prefix="modal" aria-label="Add knowledge base">
          <h2 class="editor-title">Add knowledge base</h2>
        </form>`;
      const form = modal.querySelector("form");
      bindEditor(form, createEditorState(), {
        submitLabel: "Add",
        showCancel: true,
        onSave(base) {
          const data = load();
          data.bases.push(base);
          data.selectedId = base.id;
          expandedIds.add(base.id);
          save(data);
          closeModal();
        },
      });
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
      });
      form.querySelector("[data-kb-cancel]").addEventListener("click", closeModal);
      document.body.append(modal);
    }
    const form = modal.querySelector("form");
    resetEditor(form, form.kbState);
    modal.hidden = false;
    form.querySelector("[data-kb-name]").focus();
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
    const currentPill = row.querySelector("[data-kb-pill]");
    if (!selected) currentPill?.remove();
    else if (currentPill?.dataset.kbName !== selected.name) {
      currentPill?.remove();
      trigger.after(makePill(selected.name));
    }
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

  function cardHtml(base) {
    const filled = filledAspects(base.sound);
    const expanded = expandedIds.has(base.id);
    const profileRows = profileRowsHtml(base.sound);

    return `
      <article class="card">
        <div class="card-head">
          <div class="card-copy">
            <h3 class="card-title">${esc(base.name)}</h3>
            ${base.context ? `<p class="card-body">${esc(base.context)}</p>` : ""}
          </div>
          <div class="card-actions">
            <button type="button" class="btn" data-action="delete" data-id="${esc(base.id)}">Delete</button>
          </div>
        </div>
        ${filled.length ? `
          <button type="button" class="btn btn-ghost profile-toggle" data-action="toggle" data-id="${esc(base.id)}" aria-expanded="${expanded}">
            ${expanded ? "Hide" : "Show"} sound profile · ${filled.map((aspect) => esc(aspect.label)).join(", ")}
          </button>
          ${expanded ? `<div class="profile">${profileRows}</div>` : ""}` : ""}
      </article>`;
  }

  function paintList(page) {
    const data = load();
    const list = page.querySelector("[data-kb-list]");
    const signature = JSON.stringify({
      bases: data.bases,
      expanded: [...expandedIds],
    });
    if (list.dataset.signature === signature) return;
    list.dataset.signature = signature;
    list.innerHTML = data.bases.length
      ? data.bases.map(cardHtml).join("")
      : '<p class="empty">No knowledge bases yet.</p>';
  }

  function optimizeButton() {
    return `<button type="button" class="optimize-btn" data-optimize aria-label="Optimize prompt">${ICONS.sparkle}</button>`;
  }

  function editorMarkup(prefix, submitLabel, showCancel) {
    return `
      <div>
        <label class="field-label" for="${prefix}-name">Name</label>
        <input id="${prefix}-name" class="input" data-kb-name placeholder="Name" autocomplete="off" />
      </div>
      <div class="optimize-field">
        <label class="field-label" for="${prefix}-context">General context</label>
        <textarea id="${prefix}-context" class="input" data-kb-context placeholder="What should the assistant know?"></textarea>
        ${optimizeButton()}
      </div>
      <div class="section">
        <div class="section-head">
          <h2>Sound profile <span class="optional">· optional</span></h2>
          <p>Describe how speech, music and SFX should feel. Pick attributes for inspiration.</p>
        </div>
        <div class="tabs" role="tablist" data-aspect-tabs aria-label="Sound aspects"></div>
        <div data-aspect-panel class="aspect-panel" role="tabpanel"></div>
      </div>
      <div class="form-footer">
        <div class="kb-actions">
          ${showCancel ? '<button type="button" class="btn" data-kb-cancel>Cancel</button>' : ""}
          <button type="submit" class="btn btn-primary" data-kb-submit disabled>${submitLabel}</button>
        </div>
        <span class="summary-text" data-kb-summary></span>
      </div>`;
  }

  function renderTabs(root, state) {
    const prefix = root.dataset.kbPrefix;
    const tabs = root.querySelector("[data-aspect-tabs]");
    tabs.innerHTML = ASPECTS.map((aspect) => {
      const count = aspectCount(state.sound[aspect.id]);
      return `
        <button type="button" class="tab" role="tab" id="${prefix}-tab-${aspect.id}" aria-selected="${state.activeAspect === aspect.id}" data-aspect="${aspect.id}">
          ${aspect.icon}<span>${esc(aspect.label)}</span>${count ? `<span class="tab-count" aria-label="${count} items">${count}</span>` : ""}
        </button>`;
    }).join("");
  }

  function renderPanel(root, state) {
    const prefix = root.dataset.kbPrefix;
    const aspect = aspectById(state.activeAspect);
    const value = state.sound[aspect.id];
    const panel = root.querySelector("[data-aspect-panel]");
    panel.setAttribute("aria-labelledby", `${prefix}-tab-${aspect.id}`);
    panel.innerHTML = `
      <div class="optimize-field">
        <label class="field-label" for="${prefix}-aspect">Describe ${esc(aspect.label.toLowerCase())}</label>
        <textarea id="${prefix}-aspect" class="input" data-aspect-text placeholder="${esc(aspect.placeholder)}">${esc(value.description)}</textarea>
        ${optimizeButton()}
      </div>
      <div class="selected-row" aria-live="polite">
        ${value.attributes.length
          ? value.attributes.map((tag) => `<button type="button" class="chip chip-remove" data-remove="${esc(tag)}" aria-label="Remove ${esc(tag)}">${esc(tag)}${ICONS.x}</button>`).join("")
          : '<span class="hint">No attributes selected</span>'}
        ${value.attributes.length ? '<button type="button" class="btn btn-ghost" data-clear>Clear</button>' : ""}
      </div>
      <div class="inspiration" data-open="${state.inspirationOpen}">
        <button type="button" class="inspiration-toggle" aria-expanded="${state.inspirationOpen}" data-toggle-inspiration>
          <span class="left">${ICONS.sparkle}Get inspiration</span>${ICONS.chevron}
        </button>
        <div class="inspiration-body">
          ${Object.entries(aspect.groups).map(([group, tags]) => `
            <div class="attr-group" role="group" aria-label="${esc(group)}">
              <span class="attr-group-label">${esc(group)}</span>
              <div class="chips">
                ${tags.map((tag) => `<button type="button" class="chip" aria-pressed="${value.attributes.includes(tag)}" data-attr="${esc(tag)}">${esc(tag)}</button>`).join("")}
              </div>
            </div>`).join("")}
        </div>
      </div>`;
  }

  function renderSummary(root, state) {
    const filled = filledAspects(state.sound);
    root.querySelector("[data-kb-summary]").textContent = filled.length
      ? `Sound profile: ${filled.map((aspect) => aspect.label).join(", ")}`
      : "";
    root.querySelector("[data-kb-submit]").disabled = !state.name.trim();
  }

  function resetEditor(root, state) {
    state.name = "";
    state.context = "";
    state.sound = emptySound();
    state.activeAspect = "speech";
    root.querySelector("[data-kb-name]").value = "";
    root.querySelector("[data-kb-context]").value = "";
    renderTabs(root, state);
    renderPanel(root, state);
    renderSummary(root, state);
  }

  function bindEditor(root, state, options) {
    root.kbState = state;
    root.insertAdjacentHTML("beforeend", editorMarkup(root.dataset.kbPrefix, options.submitLabel, options.showCancel));
    root.querySelector("[data-kb-name]").value = state.name;
    root.querySelector("[data-kb-context]").value = state.context;
    root.querySelector("[data-kb-name]").addEventListener("input", (event) => {
      state.name = event.target.value;
      renderSummary(root, state);
    });
    root.querySelector("[data-kb-context]").addEventListener("input", (event) => {
      state.context = event.target.value;
    });
    root.querySelector("[data-aspect-tabs]").addEventListener("click", (event) => {
      const tab = event.target.closest(".tab");
      if (!tab) return;
      state.activeAspect = tab.dataset.aspect;
      renderTabs(root, state);
      renderPanel(root, state);
      root.querySelector(`#${root.dataset.kbPrefix}-tab-${state.activeAspect}`)?.focus();
    });
    const panel = root.querySelector("[data-aspect-panel]");
    panel.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || button.hasAttribute("data-optimize")) return;
      const focusAttr = button.dataset.attr || button.dataset.remove || "";
      if (button.dataset.attr) {
        if (!knownAttribute(state.activeAspect, button.dataset.attr)) return;
        toggleAttribute(state, button.dataset.attr);
      } else if (button.dataset.remove) {
        toggleAttribute(state, button.dataset.remove);
      } else if (button.hasAttribute("data-clear")) {
        state.sound[state.activeAspect].attributes = [];
      } else if (button.hasAttribute("data-toggle-inspiration")) {
        state.inspirationOpen = !state.inspirationOpen;
      } else return;
      renderTabs(root, state);
      renderPanel(root, state);
      renderSummary(root, state);
      if (focusAttr) root.querySelector(`[data-attr="${CSS.escape(focusAttr)}"]`)?.focus();
      else if (button.hasAttribute("data-toggle-inspiration") || button.hasAttribute("data-clear")) {
        root.querySelector("[data-toggle-inspiration]")?.focus();
      }
    });
    panel.addEventListener("input", (event) => {
      if (!event.target.hasAttribute("data-aspect-text")) return;
      state.sound[state.activeAspect].description = event.target.value;
      renderTabs(root, state);
      renderSummary(root, state);
    });
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-optimize]");
      if (!button || !root.contains(button)) return;
      const field = button.parentElement?.querySelector("input, textarea");
      if (field) openOptimize(root, field, button);
    });
    root.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!state.name.trim()) return;
      const base = {
        id: crypto.randomUUID(),
        name: state.name.trim(),
        context: state.context.trim(),
        sound: soundForSave(state.sound),
      };
      resetEditor(root, state);
      options.onSave(base);
    });
    renderTabs(root, state);
    renderPanel(root, state);
    renderSummary(root, state);
  }

  function buildPage() {
    const page = document.createElement("div");
    page.setAttribute("data-mirelo-kb-page", "");
    page.className = "kb-ui";
    page.innerHTML = `
      <div class="kb-wrap">
        <header class="page-header">
          <h1>Knowledge</h1>
          <p>Notes the editor assistant receives with your prompt. Stored in this browser only.</p>
        </header>
        <section class="kb-list" data-kb-list aria-label="Knowledge bases"></section>
        <form class="card" data-kb-form data-kb-prefix="page" aria-label="Add knowledge base"></form>
      </div>`;

    page.querySelector("[data-kb-list]").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const id = button.dataset.id;
      if (button.dataset.action === "delete") {
        const data = load();
        data.bases = data.bases.filter((item) => item.id !== id);
        if (data.selectedId === id) data.selectedId = null;
        expandedIds.delete(id);
        save(data);
        return;
      }
      if (button.dataset.action === "toggle") {
        if (expandedIds.has(id)) expandedIds.delete(id);
        else expandedIds.add(id);
        paintList(page);
      }
    });

    bindEditor(page.querySelector("[data-kb-form]"), pageState, {
      submitLabel: "Add knowledge base",
      showCancel: false,
      onSave(base) {
        const data = load();
        data.bases.push(base);
        expandedIds.add(base.id);
        save(data);
      },
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
      if (inset.dataset.kbPinned) {
        inset.style.position = inset.dataset.kbPosition || "";
        delete inset.dataset.kbPosition;
        delete inset.dataset.kbPinned;
      }
      for (const child of inset.querySelectorAll("[data-kb-hidden]")) {
        child.style.display = child.dataset.kbDisplay || "";
        child.removeAttribute("data-kb-hidden");
      }
      return;
    }
    if (!inset.dataset.kbPinned) {
      inset.dataset.kbPinned = "1";
      inset.dataset.kbPosition = inset.style.position;
      if (getComputedStyle(inset).position === "static") inset.style.position = "relative";
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
      ensureChatPills();
    });
  }

  document.addEventListener("click", (event) => {
    const pill = event.target.closest?.("[data-kb-pill]");
    if (!pill) return;
    event.preventDefault();
    event.stopPropagation();
    openKnowledgeView(pill.dataset.kbName || "", pill);
  }, true);
  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("[data-mirelo-kb-select]")) closeMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (closeOptimize(false)) return;
    closeMenus();
    closeModal();
    closeKnowledgeView();
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
