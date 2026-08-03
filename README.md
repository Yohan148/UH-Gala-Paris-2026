# Landing page — Gala United Hatzalah Paris 2026

## Structure

- `index.html`
- `css/style.css`
- `js/app.js`
- `assets/logo-gala-hatzalah.png`
- `assets/hero-gala-paris.png`
- `google-apps-script.gs`

## Connexion à Google Sheets

1. Crée un nouveau Google Sheet.
2. Dans le Google Sheet : **Extensions → Apps Script**.
3. Efface le code existant.
4. Copie le contenu de `google-apps-script.gs`.
5. Clique sur **Déployer → Nouveau déploiement**.
6. Type : **Application Web**.
7. Exécuter en tant que : **Moi**.
8. Qui a accès : **Tout le monde**.
9. Copie l’URL du déploiement.
10. Ouvre `js/app.js`.
11. Remplace :

```js
const GOOGLE_SCRIPT_URL = "COLLE_ICI_TON_URL_GOOGLE_APPS_SCRIPT";
```

par ton URL.

## Images

Les deux images PNG sont déjà présentes dans `assets` :

- `logo-gala-hatzalah.png`
- `hero-gala-paris.png`

## Prix affichés

- Individuel : 400 €
- Couple : 800 €
- Table complète de 10 personnes : 4 000 €
