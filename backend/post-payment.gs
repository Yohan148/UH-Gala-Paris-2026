/*
  À appeler uniquement APRÈS confirmation réelle du paiement.
  Le prestataire de paiement doit fournir au minimum une référence permettant
  de retrouver l'inscription.

  Cette fonction met à jour le statut, puis envoie l'e-mail final.
*/
function confirmPaidRegistration(reference, transactionId, amountPaid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Inscriptions");
  if (!sheet) throw new Error("Onglet Inscriptions introuvable.");

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(reference)) {
      sheet.getRange(i + 1, 16).setValue("PAYÉ");
      sheet.getRange(i + 1, 17).setValue(transactionId || "");
      sheet.getRange(i + 1, 18).setValue(amountPaid || "");

      const data = {
        reference: rows[i][1],
        formule: rows[i][2],
        prenom: rows[i][3],
        nom: rows[i][4],
        prenomInvite2: rows[i][5],
        nomInvite2: rows[i][6],
        telephone: rows[i][7],
        email: rows[i][8],
        adresse: rows[i][9],
        codePostal: rows[i][10],
        ville: rows[i][11],
        transactionId: transactionId || "",
        amountPaid: amountPaid || ""
      };

      sendFinalEmail_(data);
      return true;
    }
  }

  throw new Error("Référence introuvable : " + reference);
}

function sendFinalEmail_(data) {
  const invitationPdf = buildInvitationPdf_(data);
  const attachments = [invitationPdf];

  // Active uniquement après validation fiscale et configuration de l'association.
  if (CERFA_CONFIG.enabled === true) {
    attachments.push(buildFiscalReceiptPdf_(data));
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111">
      <div style="background:#07101b;padding:28px;color:white;border-radius:16px 16px 0 0">
        <div style="color:#ff7a00;font-weight:700">GALA UNITED HATZALAH — PARIS</div>
        <h1 style="margin:12px 0 0">Votre réservation est confirmée</h1>
      </div>
      <div style="padding:28px;border:1px solid #eee;border-top:0;border-radius:0 0 16px 16px">
        <p>Bonjour ${data.prenom},</p>
        <p>Nous vous confirmons votre réservation et votre paiement pour le Gala United Hatzalah du <strong>22 novembre 2026</strong> à l’<strong>Hôtel du Collectionneur à Paris</strong>.</p>
        <p><strong>Formule :</strong> ${data.formule}<br>
        <strong>Référence :</strong> ${data.reference}<br>
        <strong>Transaction :</strong> ${data.transactionId}</p>
        <p>Vous trouverez votre invitation numérique en pièce jointe.</p>
        ${CERFA_CONFIG.enabled === true ? "<p>Votre reçu fiscal est également joint à cet e-mail.</p>" : ""}
        <p>Merci pour votre soutien,<br><strong>United Hatzalah France</strong></p>
      </div>
    </div>`;

  GmailApp.sendEmail(
    data.email,
    "Votre invitation — Gala United Hatzalah Paris",
    "Votre réservation est confirmée.",
    {
      htmlBody: html,
      attachments: attachments,
      name: "United Hatzalah France"
    }
  );
}

function buildInvitationPdf_(data) {
  const guest2 = (data.prenomInvite2 || data.nomInvite2)
    ? `<p style="font-size:18px">Avec : <strong>${data.prenomInvite2 || ""} ${data.nomInvite2 || ""}</strong></p>`
    : "";

  const html = `
  <html><body style="font-family:Arial,sans-serif;background:#07101b;color:white;padding:55px">
    <div style="border:2px solid #ff7a00;padding:55px;text-align:center">
      <div style="color:#ff7a00;font-size:16px;letter-spacing:2px">INVITATION OFFICIELLE</div>
      <h1 style="font-size:42px;margin:18px 0">Gala United Hatzalah</h1>
      <h2 style="font-size:26px;font-weight:normal">22 novembre 2026</h2>
      <p style="font-size:20px">Hôtel du Collectionneur — Paris</p>
      <div style="height:1px;background:#ff7a00;margin:35px 0"></div>
      <p style="font-size:22px">Invitation de</p>
      <p style="font-size:30px"><strong>${data.prenom} ${data.nom}</strong></p>
      ${guest2}
      <p style="font-size:18px">${data.formule}</p>
      <p style="margin-top:40px;color:#ff7a00">Référence : ${data.reference}</p>
    </div>
  </body></html>`;

  return HtmlService.createHtmlOutput(html)
    .getBlob()
    .getAs(MimeType.PDF)
    .setName("Invitation_Gala_United_Hatzalah_" + data.reference + ".pdf");
}
