const form = document.getElementById("leadForm");
const hint = document.getElementById("formHint");

document.getElementById("year").textContent = String(new Date().getFullYear());

function normalizeDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function buildWhatsAppLink({ name, whatsapp, type, message }) {
  const phone = normalizeDigits(whatsapp);

  const lines = [
    "Olá! Quero um orçamento com a Oroz Eventos.",
    "",
    `Nome: ${name}`,
    `Tipo de evento: ${type}`,
    message ? `Mensagem: ${message}` : null,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join("\n"));
  return { phone, url: `https://wa.me/${phone}?text=${text}` };
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = String(data.get("name") ?? "").trim();
  const whatsapp = String(data.get("whatsapp") ?? "").trim();
  const type = String(data.get("type") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();

  if (!name || !whatsapp || !type) {
    if (hint) hint.textContent = "Preencha nome, WhatsApp e tipo de evento.";
    return;
  }

  const { phone, url } = buildWhatsAppLink({ name, whatsapp, type, message });

  if (phone.length < 10) {
    if (hint) hint.textContent = "WhatsApp parece incompleto. Ex.: 11999999999";
    return;
  }

  if (hint) hint.textContent = "Abrindo WhatsApp…";
  window.open(url, "_blank", "noopener,noreferrer");
  form.reset();
  if (hint) hint.textContent = "Tudo certo. Se não abrir, revise o número do WhatsApp.";
});
