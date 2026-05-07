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
}

menuToggle?.addEventListener("click", () => {
  if (!menu || !menuToggle) return;
  const isOpen = menu.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
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

    function getActiveSlideIndex(slides) {
      const sl = viewport.scrollLeft;
      let idx = 0;
      for (let i = 0; i < slides.length; i++) {
        if (slides[i].offsetLeft <= sl + 12) idx = i;
      }
      return idx;
    }

    /** Alinha o slide à borda esquerda do viewport (scroll horizontal só neste elemento). */
    function scrollSlideIntoViewport(slide) {
      const vRect = viewport.getBoundingClientRect();
      const sRect = slide.getBoundingClientRect();
      const delta = sRect.left - vRect.left;
      viewport.scrollTo({
        left: viewport.scrollLeft + delta,
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
      const idx = getActiveSlideIndex(slides);
      const prevIdx = idx - 1;
      if (prevIdx < 0) return;
      scrollSlideIntoViewport(slides[prevIdx]);
    });

    btnNext.addEventListener("click", () => {
      if (btnNext.disabled) return;
      const slides = getSlides();
      const idx = getActiveSlideIndex(slides);
      const nextIdx = idx + 1;
      if (nextIdx >= slides.length) return;
      scrollSlideIntoViewport(slides[nextIdx]);
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
