# Gala United Hatzalah — Hôtel du Collectionneur

## Parcours
1. Le destinataire reçoit le carton d'invitation par courrier.
2. Le QR code du carton pointe vers `index.html`.
3. Il choisit sa formule.
4. Ses informations sont enregistrées avec le statut `Paiement en attente`.
5. Il est redirigé vers le prestataire de paiement.
6. Après confirmation réelle du paiement, `confirmPaidRegistration(...)` doit être appelée.
7. Le statut passe à `PAYÉ`.
8. L'e-mail final part avec l'invitation numérique PDF.
9. Le reçu fiscal peut être joint uniquement si `CERFA_CONFIG.enabled = true` après validation fiscale.

## Fichiers
- `index.html`
- `don.html`
- `css/style.css`
- `js/config.js`
- `js/app.js`
- `js/don.js`
- `backend/registration.gs`
- `backend/post-payment.gs`
- `backend/cerfa.gs`
- `assets/`

## Google Sheet
Créer un onglet `Inscriptions` avec les colonnes :
Date | Référence | Formule | Prénom | Nom | Prénom invité 2 | Nom invité 2 | Téléphone | E-mail | Adresse | Code postal | Ville | Société | Message | Consentement | Statut | Transaction | Montant payé

## Paiements
Renseigner les 5 liens dans `js/config.js`.

Pour une vraie confirmation après paiement, le prestataire de paiement doit appeler votre backend ou fournir un mécanisme équivalent permettant d'exécuter :
`confirmPaidRegistration(reference, transactionId, amountPaid)`

## Reçu fiscal
Le fichier `backend/cerfa.gs` est désactivé par défaut.
Ne pas mettre `enabled: true` avant validation :
- de l'éligibilité de l'organisme à délivrer des reçus fiscaux ;
- des mentions obligatoires ;
- de la qualification fiscale du versement correspondant à la place de Gala.

## QR code
Aucun QR code n'est affiché sur le site.
Le QR sera créé séparément pour les cartons d'invitation et pointera vers l'URL finale de la landing.
