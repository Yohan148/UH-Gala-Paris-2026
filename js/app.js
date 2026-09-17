(() => {
  const CONFIG = window.GALA_CONFIG || {};
  const form = document.getElementById("reservationForm");
  const dateInput = document.getElementById("dateInscription");
  const referenceInput = document.getElementById("reference");
  const formStatus = document.getElementById("formStatus");
  const submitButton = form?.querySelector(".submit-btn");

  function createReference() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `GALA26-${timestamp}-${randomPart}`;
  }

  function configureAllodonsLinks() {
    const links = document.querySelectorAll(".js-allodons");
    const url = String(CONFIG.allodonsUrl || "").trim();
    const ready = url && !url.includes("COLLE_ICI");

    links.forEach(link => {
      if (ready) {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.href = "#";
        link.addEventListener("click", event => {
          event.preventDefault();
          alert("Le lien AlloDons doit encore être renseigné dans js/config.js.");
        });
      }
    });
  }

  function validateForm() {
    let valid = true;
    const requiredFields = form.querySelectorAll("input[required]");

    requiredFields.forEach(field => {
      field.classList.remove("invalid");
      if (!field.checkValidity()) {
        field.classList.add("invalid");
        valid = false;
      }
    });

    return valid;
  }

  async function submitPreRegistration(event) {
    event.preventDefault();
    if (!form) return;

    formStatus.className = "form-status";
    formStatus.textContent = "";

    if (!validateForm()) {
      formStatus.classList.add("error");
      formStatus.textContent = "Merci de renseigner le nombre de personnes, votre e-mail et d’accepter d’être contacté(e).";
      return;
    }

    const scriptUrl = String(CONFIG.googleScriptUrl || "").trim();
    if (!scriptUrl) {
      formStatus.classList.add("error");
      formStatus.textContent = "La connexion au formulaire n’est pas configurée.";
      return;
    }

    const reference = createReference();
    referenceInput.value = reference;
    dateInput.value = new Date().toISOString();

    const formData = new FormData(form);
    formData.set("action", "register");

    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "Envoi en cours…";

    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        body: formData
      });

      formStatus.classList.add("success");
      formStatus.innerHTML = "Votre pré-inscription a bien été enregistrée.<br>Notre équipe vous recontactera rapidement.";

      form.reset();
      const qty = form.querySelector('input[name="nombrePersonnes"]');
      if (qty) qty.value = "1";
      referenceInput.value = "";
      dateInput.value = "";
    } catch (error) {
      console.error(error);
      formStatus.classList.add("error");
      formStatus.textContent = "Une erreur est survenue. Merci de réessayer ou de nous contacter directement.";
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "Envoyer ma pré-inscription";
    }
  }

  form?.addEventListener("submit", submitPreRegistration);

  window.addEventListener("scroll", () => {
    document.querySelector(".site-header")?.classList.toggle("scrolled", window.scrollY > 30);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
  configureAllodonsLinks();
})();
