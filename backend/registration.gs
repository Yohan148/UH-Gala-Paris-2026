function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inscriptions");
    if (!sheet) throw new Error("Onglet Inscriptions introuvable.");

    const p = e.parameter;
    sheet.appendRow([
      new Date(),
      p.reference || "",
      p.formule || "",
      p.prenom || "",
      p.nom || "",
      p.prenomInvite2 || "",
      p.nomInvite2 || "",
      p.telephone || "",
      p.email || "",
      p.adresse || "",
      p.codePostal || "",
      p.ville || "",
      p.societe || "",
      p.message || "",
      p.consentement || "",
      p.statut || "Paiement en attente",
      "",
      ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({success:true}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success:false,error:error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("Gala United Hatzalah — service actif");
}
