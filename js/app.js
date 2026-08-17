// =========================================================
// GALA UNITED HATZALAH 2026
// APP.JS
// ---------------------------------------------------------
// Ce fichier gère :
// - le choix de la formule
// - l'affichage du 2e invité pour les couples
// - la validation du formulaire
// - la création d'une référence unique GALA26-...
// - l'enregistrement dans Google Apps Script
// - la redirection vers Stripe
// - l'ajout automatique de client_reference_id au lien Stripe
// - les animations de la page
//
// IMPORTANT :
// config.js doit être chargé AVANT app.js dans index.html
// =========================================================


// =========================================================
// CONFIGURATION
// =========================================================

const CONFIG = window.GALA_CONFIG || {};


// =========================================================
// ELEMENTS DU DOM
// =========================================================

const form = document.getElementById("reservationForm");
const statusBox = document.getElementById("formStatus");

const formuleInput = document.getElementById("formule");
const selectionText = document.getElementById("selectionText");

const guestTwo = document.getElementById("guestTwo");
const prenomInvite2 = document.getElementById("prenomInvite2");
const nomInvite2 = document.getElementById("nomInvite2");

const referenceInput = document.getElementById("reference");
const dateInscriptionInput = document.getElementById("dateInscription");


// =========================================================
// ETAT COURANT
// =========================================================

let currentPackage = "";


// =========================================================
// LIBELLES POUR LES MESSAGES D'ERREUR
// =========================================================

const fieldLabels = {
  prenom: "le prénom",
  nom: "le nom",
  prenomInvite2: "le prénom du deuxième invité",
  nomInvite2: "le nom du deuxième invité",
  telephone: "le téléphone",
  email: "l’adresse e-mail",
  adresse: "l’adresse complète",
  codePostal: "le code postal",
  ville: "la ville"
};


// =========================================================
// CHOIX DE LA FORMULE
// =========================================================

document.querySelectorAll(".select-package").forEach((button) => {
  button.addEventListener("click", () => {

    currentPackage = button.dataset.key || "";

    formuleInput.value = button.dataset.label || "";
    selectionText.textContent = button.dataset.label || "";

    document.querySelectorAll(".select-package").forEach((item) => {
      item.classList.remove("selected");
    });

    button.classList.add("selected");


    // -----------------------------------------------------
    // Affichage du deuxième invité uniquement pour le couple
    // -----------------------------------------------------

    const isCouple = currentPackage === "couple";

    guestTwo.hidden = !isCouple;

    prenomInvite2.required = isCouple;
    nomInvite2.required = isCouple;

    if (!isCouple) {
      prenomInvite2.value = "";
      nomInvite2.value = "";
    }


    // -----------------------------------------------------
    // Scroll vers le formulaire
    // -----------------------------------------------------

    const reservationSection = document.getElementById("reservation");

    if (reservationSection) {
      reservationSection.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});


// =========================================================
// VALIDATION DU FORMULAIRE
// =========================================================

function validateForm() {

  const missingFields = [];

  form.querySelectorAll(".invalid").forEach((field) => {
    field.classList.remove("invalid");
  });


  // -------------------------------------------------------
  // Vérification qu'une formule a bien été sélectionnée
  // -------------------------------------------------------

  if (!currentPackage) {
    missingFields.push("une formule de réservation");
  }


  // -------------------------------------------------------
  // Vérification de tous les champs obligatoires
  // -------------------------------------------------------

  form.querySelectorAll("[required]").forEach((field) => {

    // Checkbox
    if (field.type === "checkbox") {

      if (!field.checked) {
        missingFields.push("le consentement");
      }

      return;
    }


    const value = field.value.trim();


    // Champ vide
    if (!value) {

      missingFields.push(
        fieldLabels[field.name] || "un champ obligatoire"
      );

      field.classList.add("invalid");

      return;
    }


    // Email invalide
    if (
      field.type === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {

      missingFields.push("une adresse e-mail valide");
      field.classList.add("invalid");
    }


    // Téléphone invalide
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


// =========================================================
// GENERATION DE LA REFERENCE UNIQUE
// =========================================================

function createReference() {

  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `GALA26-${timestamp}-${randomPart}`;
}


// =========================================================
// CONSTRUCTION DU LIEN STRIPE
// =========================================================

function buildStripePaymentUrl(paymentUrl, reference) {

  const url = new URL(
    paymentUrl,
    window.location.href
  );


  // -------------------------------------------------------
  // Cette référence revient dans Stripe après le paiement
  // via checkout.session.completed
  // -------------------------------------------------------

  url.searchParams.set(
    "client_reference_id",
    reference
  );


  return url.toString();
}


// =========================================================
// ENVOI DU FORMULAIRE
// =========================================================

form.addEventListener("submit", async (event) => {

  event.preventDefault();


  // -------------------------------------------------------
  // Reset du message
  // -------------------------------------------------------

  statusBox.className = "form-status";
  statusBox.textContent = "";


  // -------------------------------------------------------
  // Validation
  // -------------------------------------------------------

  const validation = validateForm();

  if (!validation.isValid) {

    statusBox.textContent =
      "Merci de compléter : " +
      validation.missingFields.join(", ") +
      ".";

    statusBox.classList.add("error");

    return;
  }


  // -------------------------------------------------------
  // Récupération du lien Stripe depuis config.js
  // -------------------------------------------------------

  const paymentUrl =
    CONFIG.paymentUrls?.[currentPackage];


  if (
    !paymentUrl ||
    paymentUrl.includes("COLLE_ICI")
  ) {

    statusBox.textContent =
      "Le lien de paiement de cette formule doit être configuré dans js/config.js.";

    statusBox.classList.add("error");

    return;
  }


  // -------------------------------------------------------
  // Vérification de l'URL Google Apps Script
  // -------------------------------------------------------

  if (
    !CONFIG.googleScriptUrl ||
    CONFIG.googleScriptUrl.includes("COLLE_ICI")
  ) {

    statusBox.textContent =
      "L’URL Google Apps Script doit être configurée dans js/config.js.";

    statusBox.classList.add("error");

    return;
  }


  // -------------------------------------------------------
  // Date d'inscription
  // -------------------------------------------------------

  if (dateInscriptionInput) {

    dateInscriptionInput.value =
      new Date().toLocaleString(
        "fr-FR",
        {
          timeZone: "Europe/Paris"
        }
      );
  }


  // -------------------------------------------------------
  // Création de la référence unique
  // -------------------------------------------------------

  const reference = createReference();

  referenceInput.value = reference;


  // -------------------------------------------------------
  // Préparation des données pour Google Apps Script
  // -------------------------------------------------------

  const formData = new FormData(form);

  formData.append(
    "statut",
    "Paiement en attente"
  );


  // -------------------------------------------------------
  // Sauvegarde dans le Google Sheet AVANT Stripe
  // -------------------------------------------------------

  try {

    await fetch(
      CONFIG.googleScriptUrl,
      {
        method: "POST",
        mode: "no-cors",
        body: formData
      }
    );

  } catch (error) {

    console.error(
      "Erreur lors de l'enregistrement Google Apps Script :",
      error
    );

    statusBox.textContent =
      "Une erreur est survenue avant le paiement. Merci de réessayer.";

    statusBox.classList.add("error");

    return;
  }


  // -------------------------------------------------------
  // Construction du lien Stripe AVEC client_reference_id
  // -------------------------------------------------------

  let stripeUrl;

  try {

    stripeUrl = buildStripePaymentUrl(
      paymentUrl,
      reference
    );

  } catch (error) {

    console.error(
      "Lien Stripe invalide :",
      error
    );

    statusBox.textContent =
      "Le lien de paiement Stripe est invalide.";

    statusBox.classList.add("error");

    return;
  }


  // -------------------------------------------------------
  // Message de confirmation
  // -------------------------------------------------------

  statusBox.textContent =
    "Vos informations sont enregistrées. Redirection vers le paiement…";

  statusBox.classList.add("success");


  // -------------------------------------------------------
  // Redirection Stripe
  // -------------------------------------------------------

  setTimeout(() => {

    window.location.href = stripeUrl;

  }, 650);
});


// =========================================================
// ANIMATIONS REVEAL
// =========================================================

const revealObserver = new IntersectionObserver(
  (entries) => {

    entries.forEach((entry) => {

      if (entry.isIntersecting) {

        entry.target.classList.add("visible");

        revealObserver.unobserve(
          entry.target
        );
      }
    });
  },
  {
    threshold: 0.14
  }
);


document.querySelectorAll(".reveal").forEach((element) => {

  revealObserver.observe(
    element
  );
});


// =========================================================
// HEADER AU SCROLL
// =========================================================

window.addEventListener("scroll", () => {

  const header =
    document.querySelector(".site-header");

  if (!header) {
    return;
  }

  header.classList.toggle(
    "scrolled",
    window.scrollY > 20
  );
});