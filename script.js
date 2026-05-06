const year = document.getElementById("year");
const header = document.querySelector(".header");
const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");
const form = document.getElementById("contactForm");
const hint = document.getElementById("formHint");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

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

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !contact || !message) {
    if (hint) hint.textContent = "Preencha todos os campos obrigatorios.";
    return;
  }

  if (hint)
    hint.textContent =
      "Mensagem pronta! Em um projeto real, este envio iria para o WhatsApp/email ou para um backend.";
  form.reset();
});
