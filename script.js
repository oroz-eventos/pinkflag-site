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
      if (nextId) setActive(nextId, { focus: true });
    }
  });

  const initiallySelected = tabs.find((t) => t.getAttribute("aria-selected") === "true");
  const initialPanelId = initiallySelected?.getAttribute("aria-controls") ?? panels[0]?.id;
  if (initialPanelId) setActive(initialPanelId);
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

if (!prefersReducedMotion) {
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));

  revealEls.forEach((el) => el.classList.add("reveal"));

  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal--in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  revealEls.forEach((el) => io.observe(el));
}

document.querySelectorAll("[data-tabs]").forEach((root) => initTabs(root));
