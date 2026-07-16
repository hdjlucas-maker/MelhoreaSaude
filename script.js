// CONFIGURAÇÃO
const WHATSAPP_NUMBER = "5521976620148"; // seu número sem +
const WEBHOOK_URL = ""; // opcional: cole seu webhook (Zapier/Make/n8n/Google Apps Script). Se vazio, apenas abre WhatsApp.
const DRAFT_KEY = "melhoreasaude_lead";

document.addEventListener("DOMContentLoaded", () => {
  // Preenche o ano no footer se o elemento existir
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  setupMiniForm();
  setupFullForm();
});

function setupMiniForm() {
  const miniForm = document.getElementById("miniLeadForm");
  if (!miniForm) return;

  miniForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!miniForm.checkValidity()) {
      miniForm.reportValidity();
      return;
    }

    const nome = document.getElementById("mini-nome")?.value.trim() || "";
    const telefone = document.getElementById("mini-telefone")?.value.trim() || "";

    const payload = {
      nome,
      telefone,
      source: "landing_hero_mini_form",
      origin: window.location.href,
      ts: new Date().toISOString()
    };

    await sendToWebhook(payload);

    const text = encodeURIComponent(
      `Olá, meu nome é ${nome}. Preenchi o formulário e quero saber mais sobre o Combo Magnetizador + Mineralizador. Telefone: ${telefone}.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");

    miniForm.reset();
  });
}

function setupFullForm() {
  const form = document.getElementById("leadForm");
  if (!form) return;

  // Auto-save rascunho no localStorage
  ["nome", "email", "telefone", "endereco", "modelo"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(getFormData()));
    });
  });

  // Restaura rascunho salvo
  const saved = localStorage.getItem(DRAFT_KEY);
  if (saved) {
    try {
      const obj = JSON.parse(saved);
      ["nome", "email", "telefone", "endereco", "modelo"].forEach((id) => {
        const el = document.getElementById(id);
        if (el && obj[id]) el.value = obj[id];
      });
    } catch (e) {
      /* rascunho inválido, ignora */
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = getFormData();
    await sendToWebhook(data);

    const text = encodeURIComponent(
      `Olá, meu nome é ${data.nome}. Tenho interesse no Combo Magnetizador + Mineralizador e gostaria de tirar algumas dúvidas antes de comprar. Telefone: ${data.telefone}. Cidade: ${data.endereco || ""}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");

    alert("Obrigado! Vamos te chamar no WhatsApp. Se preferir comprar agora, use o botão \"Comprar Agora no Site Oficial\".");
    form.reset();
    localStorage.removeItem(DRAFT_KEY);
  });

  function getFormData() {
    return {
      nome: document.getElementById("nome")?.value.trim() || "",
      email: document.getElementById("email")?.value.trim() || "",
      telefone: document.getElementById("telefone")?.value.trim() || "",
      endereco: document.getElementById("endereco")?.value.trim() || "",
      modelo: document.getElementById("modelo")?.value || "Combo Mega",
      source: document.getElementById("source")?.value || "landing_combo_mag_min",
      consent: document.getElementById("consent")?.checked || false,
      origin: window.location.href,
      ts: new Date().toISOString()
    };
  }
}

async function sendToWebhook(payload) {
  if (!WEBHOOK_URL || !WEBHOOK_URL.startsWith("http")) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (err) {
    console.warn("Webhook falhou", err);
  }
}