
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Date d'inscription",
        "Formule",
        "Prénom",
        "Nom",
        "Téléphone",
        "E-mail",
        "Adresse",
        "Code postal",
        "Ville",
        "Société / organisation",
        "Message",
        "Consentement"
      ]);
    }

    const p = e.parameter;

    sheet.appendRow([
      p.dateInscription || new Date(),
      p.formule || "",
      p.prenom || "",
      p.nom || "",
      p.telephone || "",
      p.email || "",
      p.adresse || "",
      p.codePostal || "",
      p.ville || "",
      p.societe || "",
      p.message || "",
      p.consentement || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput("Gala United Hatzalah — formulaire actif")
    .setMimeType(ContentService.MimeType.TEXT);
}
