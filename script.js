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

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

if (!prefersReducedMotion) {
  const revealEls = Array.from(
    document.querySelectorAll(
      ".hero, #quem-somos .about__copy, #quem-somos .about__media, #o-que-fazemos .section__head, #o-que-fazemos .gridCard",
    ),
  );

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
