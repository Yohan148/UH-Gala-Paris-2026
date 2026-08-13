/*
  IMPORTANT :
  Le reçu fiscal ne doit être activé qu'après validation de l'éligibilité de
  l'organisme et des informations juridiques à faire figurer sur le reçu.
  Le modèle officiel pour les particuliers est le reçu 2041-RD / Cerfa 11580.
*/
const CERFA_CONFIG = {
  enabled: false,

  organisationName: "À RENSEIGNER",
  organisationAddress: "À RENSEIGNER",
  organisationSiretOrRna: "À RENSEIGNER",

  // À confirmer avec le service comptable / fiscal.
  articleReference: "À RENSEIGNER",
  receiptPrefix: "UH26"
};

function buildFiscalReceiptPdf_(data) {
  if (!CERFA_CONFIG.enabled) {
    throw new Error("CERFA_CONFIG.enabled est false.");
  }

  const receiptNumber = CERFA_CONFIG.receiptPrefix + "-" + data.reference;
  const amount = data.amountPaid || "";

  const html = `
  <html><body style="font-family:Arial,sans-serif;padding:45px;color:#111">
    <h1 style="font-size:24px">Reçu au titre des dons et versements</h1>
    <p><strong>Numéro d'ordre :</strong> ${receiptNumber}</p>
    <hr>
    <h2>Organisme bénéficiaire</h2>
    <p>
      ${CERFA_CONFIG.organisationName}<br>
      ${CERFA_CONFIG.organisationAddress}<br>
      Identifiant : ${CERFA_CONFIG.organisationSiretOrRna}
    </p>
    <h2>Donateur</h2>
    <p>
      ${data.prenom} ${data.nom}<br>
      ${data.adresse}<br>
      ${data.codePostal} ${data.ville}
    </p>
    <h2>Versement</h2>
    <p><strong>Montant :</strong> ${amount} €</p>
    <p><strong>Référence :</strong> ${data.reference}</p>
    <p><strong>Transaction :</strong> ${data.transactionId}</p>
    <p><strong>Base légale / catégorie :</strong> ${CERFA_CONFIG.articleReference}</p>
    <p style="margin-top:35px;font-size:11px;color:#555">
      Document technique à utiliser uniquement après validation fiscale et
      paramétrage conforme de l'organisme émetteur.
    </p>
  </body></html>`;

  return HtmlService.createHtmlOutput(html)
    .getBlob()
    .getAs(MimeType.PDF)
    .setName("Recu_fiscal_" + receiptNumber + ".pdf");
}
