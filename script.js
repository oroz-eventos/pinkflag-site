const header = document.querySelector(".header");
const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

function syncHeaderScrolledState() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 0);
}

syncHeaderScrolledState();
window.addEventListener("scroll", syncHeaderScrolledState, { passive: true });

function closeMenu() {
  if (!menu || !menuToggle) return;
  menu.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "Menu";
  document.body.style.overflow = "";
  document.body.classList.remove("menu-open");
}

menuToggle?.addEventListener("click", () => {
  if (!menu || !menuToggle) return;
  const isOpen = menu.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "Fechar" : "Menu";
  document.body.style.overflow = isOpen ? "hidden" : "";
  document.body.classList.toggle("menu-open", isOpen);
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

menu?.querySelectorAll("[data-menu-close]").forEach((btn) => {
  btn.addEventListener("click", closeMenu);
});

function initTabs(root) {
  const tablist = root.querySelector('[role="tablist"]');
  if (!tablist) return;

  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));
  if (!tabs.length || !panels.length) return;

  function setActive(nextId, { focus = false } = {}) {
    tabs.forEach((tab) => {
      const isActive = tab.getAttribute("aria-controls") === nextId;
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive && focus) tab.focus();
    });

    panels.forEach((panel) => {
      panel.hidden = panel.id !== nextId;
    });
  }

  tablist.addEventListener("click", (e) => {
    const target = e.target.closest?.('[role="tab"]');
    if (!target) return;
    const nextId = target.getAttribute("aria-controls");
    if (!nextId) return;
    if (!panels.some((p) => p.id === nextId)) return;
    setActive(nextId);
  });

  tablist.addEventListener("keydown", (e) => {
    const currentIdx = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    if (currentIdx < 0) return;

    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = (currentIdx + dir + tabs.length) % tabs.length;
      const nextId = tabs[next]?.getAttribute("aria-controls");
      if (nextId && panels.some((p) => p.id === nextId)) setActive(nextId, { focus: true });
    }
  });

  const initiallySelected = tabs.find((t) => t.getAttribute("aria-selected") === "true");
  const initialPanelId =
    (initiallySelected?.getAttribute("aria-controls") &&
      panels.some((p) => p.id === initiallySelected.getAttribute("aria-controls")) &&
      initiallySelected.getAttribute("aria-controls")) ||
    panels[0]?.id;
  if (initialPanelId) setActive(initialPanelId);
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

if (!prefersReducedMotion) {
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));

  revealEls.forEach((el) => el.classList.add("reveal"));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("reveal--in", entry.isIntersecting);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  revealEls.forEach((el) => io.observe(el));
}

document.querySelectorAll("[data-tabs]").forEach((root) => initTabs(root));

function initCatalogCarousels() {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  document.querySelectorAll(".catalogCarousel").forEach((root) => {
    const viewport = root.querySelector(".catalogCarousel__viewport");
    const track = root.querySelector(".catalogCarousel__track");
    const btnPrev = root.querySelector(".catalogCarousel__prev");
    const btnNext = root.querySelector(".catalogCarousel__next");
    if (!viewport || !track || !btnPrev || !btnNext) return;

    function getSlides() {
      return Array.from(track.querySelectorAll(".catalogSlide"));
    }

    function getScrollPaddingLeft() {
      const v = parseFloat(getComputedStyle(viewport).scrollPaddingLeft);
      return Number.isFinite(v) ? v : 0;
    }

    /** Posição de scroll que alinha o início do slide à área visível (respeita scroll-padding do CSS). */
    function getScrollLeftForSlideIndex(slides, index) {
      const slide = slides[index];
      if (!slide) return 0;
      const pad = getScrollPaddingLeft();
      return Math.max(0, slide.offsetLeft - pad);
    }

    /** Slide mais próximo da posição atual (funciona no meio entre dois itens após arrastar). */
    function getNearestSlideIndex(slides) {
      const sl = viewport.scrollLeft;
      let best = 0;
      let bestDiff = Infinity;
      for (let i = 0; i < slides.length; i++) {
        const ideal = getScrollLeftForSlideIndex(slides, i);
        const diff = Math.abs(sl - ideal);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = i;
        }
      }
      return best;
    }

    function goToSlideIndex(index) {
      const slides = getSlides();
      const slide = slides[index];
      if (!slide) return;
      viewport.scrollTo({
        left: getScrollLeftForSlideIndex(slides, index),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }

    function updateNavState() {
      const slides = getSlides();
      if (!slides.length) {
        btnPrev.disabled = true;
        btnNext.disabled = true;
        return;
      }
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const sl = viewport.scrollLeft;
      btnPrev.disabled = sl <= 6;
      btnNext.disabled = maxScroll <= 2 || sl >= maxScroll - 6;
    }

    btnPrev.addEventListener("click", () => {
      if (btnPrev.disabled) return;
      const slides = getSlides();
      const idx = getNearestSlideIndex(slides);
      const prevIdx = idx - 1;
      if (prevIdx < 0) return;
      goToSlideIndex(prevIdx);
    });

    btnNext.addEventListener("click", () => {
      if (btnNext.disabled) return;
      const slides = getSlides();
      const idx = getNearestSlideIndex(slides);
      const nextIdx = idx + 1;
      if (nextIdx >= slides.length) return;
      goToSlideIndex(nextIdx);
    });

    viewport.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("resize", updateNavState, { passive: true });
    const ro = new ResizeObserver(updateNavState);
    ro.observe(viewport);
    ro.observe(track);

    updateNavState();
  });
}

initCatalogCarousels();

function initFloatingRects() {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) return;

  const rects = Array.from(document.querySelectorAll("[data-float-rect]"));
  if (!rects.length) return;

  let raf = 0;

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function update() {
    raf = 0;
    const vh = window.innerHeight || 1;
    const center = vh * 0.5;

    rects.forEach((el) => {
      const host = el.parentElement;
      if (!host) return;
      const r = host.getBoundingClientRect();
      const hostCenter = r.top + r.height * 0.5;
      const t = (hostCenter - center) / vh; // ~ -0.5..0.5 around viewport center
      const y = clamp(t * 10, -6, 6); // very subtle drift
      el.style.setProperty("--float-y", `${y.toFixed(2)}px`);
    });
  }

  function requestUpdate() {
    if (raf) return;
    raf = window.requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
}

initFloatingRects();

/**
 * Seção conceito: parallax com mola no frame (~±100px).
 */
function initConceptSection() {
  const media = document.querySelector("[data-concept-media]");
  const frame = document.querySelector("[data-concept-frame]");
  const stage = document.querySelector("[data-concept-stage]");
  if (!media || !frame || !stage) return;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (reduceMotion) return;

  const stiffness = 100;
  const damping = 30;
  let py = 0;
  let vy = 0;
  let lastT = performance.now();

  function getScrollT() {
    const rect = frame.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const span = Math.max(rect.height, vh * 0.5);
    const center = rect.top + rect.height * 0.5;
    const mid = vh * 0.5;
    return Math.max(-1, Math.min(1, (center - mid) / span));
  }

  function conceptMotionFrame(now) {
    const tMs = now;
    const dt = Math.min(0.05, Math.max(0.001, (tMs - lastT) / 1000));
    lastT = tMs;

    const scrollT = getScrollT();
    const parallaxTarget = -scrollT * 100;
    const ay = stiffness * (parallaxTarget - py) - damping * vy;
    vy += ay * dt;
    py += vy * dt;
    frame.style.transform = `translate3d(0, ${py.toFixed(2)}px, 0)`;

    requestAnimationFrame(conceptMotionFrame);
  }

  requestAnimationFrame(conceptMotionFrame);
}

initConceptSection();

function initModal(key) {
  const modal = document.getElementById(`${key}Modal`);
  if (!modal) return;

  const openers = Array.from(document.querySelectorAll(`[data-modal-open="${key}"]`));
  const closers = Array.from(document.querySelectorAll(`[data-modal-close="${key}"]`));
  const dialog = modal.querySelector(".modal__dialog");
  if (!dialog) return;

  let lastActive = null;

  function getFocusable() {
    return Array.from(
      dialog.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }

    if (e.key !== "Tab") return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      return;
    }

    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function open() {
    lastActive = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const focusable = getFocusable();
    (focusable[0] ?? dialog).focus();
    modal.addEventListener("keydown", onKeyDown);
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    modal.removeEventListener("keydown", onKeyDown);
    if (lastActive && typeof lastActive.focus === "function") lastActive.focus();
  }

  openers.forEach((btn) =>
    btn.addEventListener("click", () => {
      open();
    }),
  );

  closers.forEach((btn) =>
    btn.addEventListener("click", () => {
      close();
    }),
  );

  modal.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.matches(`[data-modal-close="${key}"]`)) return;
  });
}

initModal("contato");

/** Sanfona “Nossos produtos”: max-height com transição sempre visível (reset de transition + reflow). */
function initProductAccordionMotion() {
  const nav = document.querySelector("#nossos-produtos .productAccordion");
  if (!nav) return;

  const reduceMotion =
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

  const panels = Array.from(nav.querySelectorAll(".productAccordion__panel"));
  const animState = new WeakMap();
  const ANIM_MS = 820;

  function getParts(detailEl) {
    const body = detailEl.querySelector(".productAccordion__body");
    const inner = detailEl.querySelector(".productAccordion__bodyInner");
    return body && inner ? { body, inner } : null;
  }

  function openHeightPx(inner) {
    return Math.min(inner.scrollHeight + 12, 2000);
  }

  function clearAnim(detailEl) {
    const s = animState.get(detailEl);
    if (!s) return;
    window.clearTimeout(s.tid);
    s.body?.removeEventListener("transitionend", s.onEnd);
    animState.delete(detailEl);
  }

  /** Garante que o próximo max-height seja interpolado (evita “salto” quando o valor não muda). */
  function flushTransitionNone(body, setupFn) {
    body.style.transition = "none";
    setupFn();
    void body.offsetHeight;
    body.style.removeProperty("transition");
    void body.offsetHeight;
  }

  /** Fecha com transição de altura; no fim remove `open` e limpa inline. */
  function runCloseAnimation(detailEl, done) {
    const parts = getParts(detailEl);
    if (!parts || !detailEl.open) {
      done?.();
      return;
    }
    const { body, inner } = parts;
    clearAnim(detailEl);

    if (reduceMotion) {
      detailEl.removeAttribute("open");
      body.style.maxHeight = "0px";
      done?.();
      return;
    }

    const hPx = `${openHeightPx(inner)}px`;
    flushTransitionNone(body, () => {
      body.style.maxHeight = hPx;
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.style.maxHeight = "0px";
      });
    });

    let settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      clearAnim(detailEl);
      detailEl.removeAttribute("open");
      body.style.removeProperty("max-height");
      done?.();
    }

    function onEnd(te) {
      if (te.target !== body || te.propertyName !== "max-height") return;
      finish();
    }

    body.addEventListener("transitionend", onEnd);
    const tid = window.setTimeout(finish, ANIM_MS);
    animState.set(detailEl, { body, onEnd, tid });
  }

  /** Abre medindo altura; sempre reinicia de 0 com transição ligada. */
  function runOpenAnimation(detailEl) {
    const parts = getParts(detailEl);
    if (!parts || !detailEl.open) return;
    const { body, inner } = parts;

    if (reduceMotion) {
      body.style.maxHeight = `${openHeightPx(inner)}px`;
      return;
    }

    const targetPx = `${openHeightPx(inner)}px`;
    flushTransitionNone(body, () => {
      body.style.maxHeight = "0px";
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.style.maxHeight = targetPx;
      });
    });
  }

  function syncOpenHeightsFromResize() {
    panels.forEach((d) => {
      if (!d.open) return;
      const parts = getParts(d);
      if (!parts) return;
      parts.body.style.maxHeight = `${openHeightPx(parts.inner)}px`;
    });
  }

  let resizeT = 0;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(syncOpenHeightsFromResize, 120);
    },
    { passive: true },
  );

  panels.forEach((details) => {
    const parts = getParts(details);
    if (!parts) return;
    const { body, inner } = parts;

    details.addEventListener("toggle", () => {
      if (!details.open) {
        clearAnim(details);
        body.style.removeProperty("max-height");
        return;
      }
      panels.forEach((o) => {
        if (o !== details && o.open) {
          runCloseAnimation(o);
        }
      });
      requestAnimationFrame(() => {
        runOpenAnimation(details);
      });
    });

    if (typeof ToggleEvent !== "undefined") {
      details.addEventListener(
        "beforetoggle",
        (e) => {
          if (!(e instanceof ToggleEvent)) return;
          if (e.newState !== "closed" || e.oldState !== "open") return;
          if (!e.cancelable) return;
          if ("isTrusted" in e && e.isTrusted === false) return;
          e.preventDefault();
          runCloseAnimation(details);
        },
        { passive: false },
      );
    }

    if (details.open) {
      body.style.maxHeight = `${openHeightPx(inner)}px`;
    } else {
      body.style.maxHeight = "0px";
    }
  });
}

initProductAccordionMotion();

function initProductShowcase() {
  const root = document.querySelector("[data-product-showcase]");
  if (!root) return;
  const heroImg = root.querySelector(".productShowcase__img");
  if (!(heroImg instanceof HTMLImageElement)) return;
  const panels = Array.from(root.querySelectorAll("details[data-ph-label]"));
  if (!panels.length) return;

  const dw = root.getAttribute("data-art-dw") || "1920";
  const dh = root.getAttribute("data-art-dh") || "1080";

  function gcd(a, b) {
    let x = Math.abs(Number.parseInt(String(a), 10) || 0);
    let y = Math.abs(Number.parseInt(String(b), 10) || 0);
    if (!x || !y) return 1;
    while (y) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  function ratioLabel(w, h) {
    const wi = Number.parseInt(String(w), 10);
    const hi = Number.parseInt(String(h), 10);
    if (!wi || !hi) return "—";
    const g = gcd(wi, hi);
    return `${wi / g}∶${hi / g}`;
  }

  /** Duas linhas no placeholder: tamanho recomendado (px) e proporção. */
  function buildOverlayText(label) {
    const r = ratioLabel(dw, dh);
    return `${String(label || "").toUpperCase()}\n${dw}×${dh} px · ${r}`;
  }

  function placeholdUrl(w, h, bg, fg, text) {
    return `https://placehold.co/${w}x${h}/${bg}/${fg}/png?text=${encodeURIComponent(text)}`;
  }

  function readPanelTheme(panel) {
    const label = panel?.getAttribute("data-ph-label") || "Produto";
    const bg = (panel?.getAttribute("data-ph-bg") || "f2f2f2").replace("#", "");
    const fg = (panel?.getAttribute("data-ph-fg") || "1f0f16").replace("#", "");
    return { label, bg, fg };
  }

  function setImageFromPanel(panel) {
    const { label, bg, fg } = readPanelTheme(panel);
    const overlay = buildOverlayText(label);
    const dwNum = Number.parseInt(dw, 10) || 1920;
    const dhNum = Number.parseInt(dh, 10) || 1080;
    const src = placeholdUrl(dw, dh, bg, fg, overlay);
    const r = ratioLabel(dw, dh);
    const title = `${label} · ${dw}×${dh} px · ${r}`;
    const panelImg = panel?.querySelector?.(".productAccordion__img");
    heroImg.src = src;
    heroImg.width = dwNum;
    heroImg.height = dhNum;
    heroImg.title = title;

    if (panelImg instanceof HTMLImageElement) {
      panelImg.src = src;
      panelImg.width = dwNum;
      panelImg.height = dhNum;
      panelImg.title = title;
    }
  }

  panels.forEach((panel) => {
    panel.addEventListener("toggle", () => {
      if (!panel.open) return;
      setImageFromPanel(panel);
    });
  });

  setImageFromPanel(panels.find((p) => p.open) || panels[0]);
}

initProductShowcase();
