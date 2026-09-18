(() => {
  const CONFIG = window.GALA_CONFIG || {};

  const form = document.getElementById("reservationForm");
  const dateInput = document.getElementById("dateInscription");
  const referenceInput = document.getElementById("reference");
  const formStatus = document.getElementById("formStatus");
  const submitButton = form?.querySelector(".submit-btn");


  /* =========================================================
     CRÉATION DE LA RÉFÉRENCE
  ========================================================= */

  function createReference() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase();

    return `GALA26-${timestamp}-${randomPart}`;
  }


  /* =========================================================
     LIENS ALLODONS
  ========================================================= */

  function configureAllodonsLinks() {
    const links = document.querySelectorAll(".js-allodons");
    const url = String(CONFIG.allodonsUrl || "").trim();

    const ready =
      url &&
      !url.includes("COLLE_ICI");

    links.forEach(link => {

      if (ready) {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

      } else {
        link.href = "#";

        link.addEventListener("click", event => {
          event.preventDefault();

          alert(
            "Le lien AlloDons doit encore être renseigné dans js/config.js."
          );
        });
      }

    });
  }


  /* =========================================================
     VALIDATION DU FORMULAIRE
  ========================================================= */

  function validateForm() {
    let valid = true;

    const prenom =
      form.querySelector('input[name="prenom"]');

    const nom =
      form.querySelector('input[name="nom"]');

    const nombrePersonnes =
      form.querySelector('input[name="nombrePersonnes"]');

    const telephone =
      form.querySelector('input[name="telephone"]');

    const email =
      form.querySelector('input[name="email"]');

    const consentement =
      form.querySelector('input[name="consentement"]');


    // On retire les anciennes erreurs visuelles
    form
      .querySelectorAll(".invalid")
      .forEach(field => {
        field.classList.remove("invalid");
      });


    /* ---------------------------------------------------------
       PRÉNOM OBLIGATOIRE
    --------------------------------------------------------- */

    if (
      !prenom ||
      !prenom.value.trim()
    ) {
      prenom?.classList.add("invalid");
      valid = false;
    }


    /* ---------------------------------------------------------
       NOM OBLIGATOIRE
    --------------------------------------------------------- */

    if (
      !nom ||
      !nom.value.trim()
    ) {
      nom?.classList.add("invalid");
      valid = false;
    }


    /* ---------------------------------------------------------
       NOMBRE DE PERSONNES OBLIGATOIRE
    --------------------------------------------------------- */

    const qty =
      parseInt(
        nombrePersonnes?.value || "0",
        10
      );

    if (
      !qty ||
      qty < 1 ||
      qty > 50
    ) {
      nombrePersonnes?.classList.add("invalid");
      valid = false;
    }


    /* ---------------------------------------------------------
       TÉLÉPHONE FACULTATIF
    --------------------------------------------------------- */

    // Aucun contrôle si le téléphone est vide.


    /* ---------------------------------------------------------
       E-MAIL FACULTATIF
       Si renseigné, on vérifie juste son format.
    --------------------------------------------------------- */

    if (
      email &&
      email.value.trim() !== "" &&
      !email.checkValidity()
    ) {
      email.classList.add("invalid");
      valid = false;
    }


    /* ---------------------------------------------------------
       CONSENTEMENT OBLIGATOIRE
    --------------------------------------------------------- */

    if (
      !consentement ||
      !consentement.checked
    ) {
      valid = false;
    }


    return valid;
  }


  /* =========================================================
     ENVOI DE LA PRÉ-INSCRIPTION
  ========================================================= */

  async function submitPreRegistration(event) {
    event.preventDefault();

    if (!form) return;


    formStatus.className = "form-status";
    formStatus.textContent = "";


    /* ---------------------------------------------------------
       VALIDATION
    --------------------------------------------------------- */

    if (!validateForm()) {
      formStatus.classList.add("error");

      formStatus.textContent =
        "Merci de renseigner le nombre de personnes, votre prénom, votre nom et d’accepter d’être contacté(e).";

      return;
    }


    /* ---------------------------------------------------------
       URL GOOGLE APPS SCRIPT
    --------------------------------------------------------- */

    const scriptUrl =
      String(
        CONFIG.googleScriptUrl || ""
      ).trim();


    if (
      !scriptUrl ||
      scriptUrl.includes("COLLE_ICI")
    ) {
      formStatus.classList.add("error");

      formStatus.textContent =
        "La connexion au formulaire n’est pas configurée.";

      return;
    }


    /* ---------------------------------------------------------
       RÉFÉRENCE + DATE
    --------------------------------------------------------- */

    const reference =
      createReference();

    referenceInput.value =
      reference;

    dateInput.value =
      new Date().toISOString();


    /* ---------------------------------------------------------
       DONNÉES DU FORMULAIRE
    --------------------------------------------------------- */

    const formData =
      new FormData(form);

    formData.set(
      "action",
      "register"
    );


    /* ---------------------------------------------------------
       BOUTON ENVOI
    --------------------------------------------------------- */

    submitButton.disabled =
      true;

    submitButton
      .querySelector("span")
      .textContent =
      "Envoi en cours…";


    /* ---------------------------------------------------------
       ENVOI À GOOGLE APPS SCRIPT
    --------------------------------------------------------- */

    try {

      await fetch(
        scriptUrl,
        {
          method: "POST",
          mode: "no-cors",
          body: formData
        }
      );


      /* -------------------------------------------------------
         SUCCÈS
      ------------------------------------------------------- */

      formStatus.classList.add(
        "success"
      );

      formStatus.innerHTML =
        "Votre pré-inscription a bien été enregistrée.<br>Notre équipe vous recontactera rapidement.";


      /* -------------------------------------------------------
         RESET FORMULAIRE
      ------------------------------------------------------- */

      form.reset();


      const qty =
        form.querySelector(
          'input[name="nombrePersonnes"]'
        );

      if (qty) {
        qty.value = "1";
      }


      referenceInput.value = "";
      dateInput.value = "";


    } catch (error) {

      console.error(error);


      formStatus.classList.add(
        "error"
      );

      formStatus.textContent =
        "Une erreur est survenue. Merci de réessayer ou de nous contacter directement.";


    } finally {

      submitButton.disabled =
        false;

      submitButton
        .querySelector("span")
        .textContent =
        "Envoyer ma pré-inscription";
    }
  }


  /* =========================================================
     ÉVÉNEMENT FORMULAIRE
  ========================================================= */

  form?.addEventListener(
    "submit",
    submitPreRegistration
  );


  /* =========================================================
     HEADER AU SCROLL
  ========================================================= */

  window.addEventListener(
    "scroll",
    () => {

      document
        .querySelector(".site-header")
        ?.classList.toggle(
          "scrolled",
          window.scrollY > 30
        );

    }
  );


  /* =========================================================
     ANIMATIONS REVEAL
  ========================================================= */

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (
            entry.isIntersecting
          ) {
            entry
              .target
              .classList
              .add("visible");
          }

        });

      },
      {
        threshold: 0.12
      }
    );


  document
    .querySelectorAll(".reveal")
    .forEach(el => {
      observer.observe(el);
    });


  /* =========================================================
     INITIALISATION ALLODONS
  ========================================================= */

  configureAllodonsLinks();

})();