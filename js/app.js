
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvc09MjjUO4Gs5xCOvEuE9Q8I1M9SqgTOFy6_9QnREuHiK_WSpL1SxpNfgjNLrCTtW/exec";

const header = document.querySelector(".site-header");
const glow = document.querySelector(".cursor-glow");
const reveals = document.querySelectorAll(".reveal");
const packageButtons = document.querySelectorAll(".select-package");
const packageRadios = document.querySelectorAll('input[name="formule"]');
const form = document.getElementById("waitlistForm");
const submitBtn = form.querySelector(".submit-btn");
const statusBox = document.getElementById("formStatus");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
}, { passive: true });

window.addEventListener("pointermove", (event) => {
  if (!glow) return;
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

reveals.forEach((el) => observer.observe(el));

packageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.package;
    const target = [...packageRadios].find((radio) => radio.dataset.key === key);
    if (target) target.checked = true;
    document.getElementById("inscription").scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    const rotateX = ((y / rect.height) - 0.5) * -8;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".magnetic").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
  });
  button.addEventListener("pointerleave", () => {
    button.style.transform = "";
  });
});

function validateForm() {
  const missingFields = [];
  const requiredFields = form.querySelectorAll("[required]");

  form.querySelectorAll(".invalid").forEach((field) => {
    field.classList.remove("invalid");
  });

  const selectedPackage = form.querySelector(
    'input[name="formule"]:checked'
  );

  if (!selectedPackage) {
    missingFields.push("la formule de réservation");
  }

  requiredFields.forEach((field) => {
    if (field.type === "radio") {
      return;
    }

    if (field.type === "checkbox") {
      if (!field.checked) {
        missingFields.push("le consentement");
      }

      return;
    }

    const value = field.value.trim();

    if (!value) {
      missingFields.push(getFieldLabel(field));
      field.classList.add("invalid");
      return;
    }

    if (
      field.type === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      missingFields.push("une adresse e-mail valide");
      field.classList.add("invalid");
    }

    if (
      field.type === "tel" &&
      value.replace(/\D/g, "").length < 8
    ) {
      missingFields.push("un numéro de téléphone valide");
      field.classList.add("invalid");
    }
  });

  return {
    isValid: missingFields.length === 0,
    missingFields: [...new Set(missingFields)]
  };
}

function getFieldLabel(field) {
  const labels = {
    prenom: "le prénom",
    nom: "le nom",
    telephone: "le téléphone",
    email: "l’adresse e-mail",
    adresse: "l’adresse complète",
    codePostal: "le code postal",
    ville: "la ville",
    societe: "la société ou l’organisation"
  };

  return labels[field.name] || "un champ obligatoire";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusBox.textContent = "";
  statusBox.className = "form-status";

  const validation = validateForm();

if (!validation.isValid) {
  statusBox.textContent =
    "Merci de compléter : " +
    validation.missingFields.join(", ") +
    ".";

  statusBox.classList.add("error");

  const firstInvalidField = form.querySelector(".invalid");

  if (firstInvalidField) {
    firstInvalidField.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    firstInvalidField.focus();
  }

  return;
}

  if (GOOGLE_SCRIPT_URL.includes("COLLE_ICI")) {
    statusBox.textContent = "Ajoute d’abord l’URL Google Apps Script dans le fichier js/app.js.";
    statusBox.classList.add("error");
    return;
  }

  document.getElementById("dateInscription").value = new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris"
  });

  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const formData = new FormData(form);
    await fetch(GOOGLE_SCRIPT_URL, {
  method: "POST",
  mode: "no-cors",
  body: formData
});

    statusBox.textContent = "Votre demande a bien été enregistrée. Notre équipe vous contactera prochainement.";
    statusBox.classList.add("success");
    form.reset();
  } catch (error) {
    statusBox.textContent = "Une erreur est survenue. Merci de réessayer ou de contacter directement notre équipe.";
    statusBox.classList.add("error");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
});
