# Calcul de plomberie — prédimensionnement (CCQ ch. III / CNP 2020 modifié Québec)

Application web autonome, en français, pour prédimensionner les réseaux de plomberie selon le **Code de construction du Québec, chapitre III – Plomberie, et Code national de la plomberie – Canada 2020 (modifié)**. Tous les calculs s'exécutent dans le navigateur : il n'y a ni serveur ni étape de compilation.

> **Outil de prédimensionnement** — la conformité finale doit être validée par un professionnel contre le texte officiel du chapitre III.

## Utilisation

Ouvrir `app/index.html` dans un navigateur. Un double-clic suffit ; l'application fonctionne en `file://`.

Le jeu d'exemple, un immeuble de bureaux de 2 étages, se charge au premier lancement. Le projet est enregistré automatiquement dans le navigateur et peut être exporté ou importé en JSON.

## Modules

| Onglet | Contenu | Références |
|---|---|---|
| Tableau de bord | Indicateurs, état de chaque réseau, alertes, schéma unifilaire des colonnes, arborescence | — |
| A · Appareils | Locaux par étage ; appareils combinant évacuation (FE) et alimentation (FA privé/public, froide/chaude/total) ; recherche dans les tables | 2.4.9.3., 2.4.10.2., 2.6.3.2.-A à -D |
| B · Évacuation | Colonnes de chute, branchements, collecteurs ; DN hydraulique et diamètres minimaux ; pentes ; déviations ; écoulement continu | 2.4.8.1., 2.4.9., 2.4.10.3., 2.4.10.6.-A/B/C |
| C · Ventilation | Colonnes de ventilation (calcul automatique), branchements et collecteurs de ventilation, ventilation interne et individuelle ; rappels de raccordement | 2.5.4., 2.5.7.1., 2.5.8.1. à 2.5.8.4. |
| D · Alimentation | Méthodes A-2.6.3.1. 2) (petits bâtiments, perte de pression moyenne) et 2.6.3.4. ; bilan de pression ; DN ≥ ¾ ; vitesse ≤ 3,0 m/s ; débit indicatif | 2.6.3., A-2.6.3.1. 2) |
| E · Appareils minimaux | Nombre de personnes selon les surfaces, toilettes, urinoirs, lavabos et avaloirs de sol par usage ; exception de la toilette unique ; réinjection dans le module A | CCQ ch. I / CNB 3.1.17.1., 3.7.2. |
| Tables du code | Toutes les tables transcrites, avec filtre | — |

Chaque résultat affiche sa référence (article ou tableau) et une infobulle. L'export **CSV** (séparateur « ; », virgule décimale) et le **rapport PDF** (impression du navigateur) reprennent les locaux, les appareils et les résultats de chaque réseau, avec leurs justifications.

## Fiabilité des données

- Toutes les valeurs proviennent des PDF officiels du CNRC versés dans ce dépôt (chapitre III – Plomberie et chapitre I – Bâtiment pour le module E). Elles ont été vérifiées page par page contre l'image de chaque tableau ([`docs/EXTRACTION.md`](docs/EXTRACTION.md)).
- Aucune valeur n'est inventée. Ce qui n'est pas dans le chapitre III est signalé dans l'interface, notamment :
  - la courbe de demande de Hunter ;
  - la pression minimale par appareil ;
- Les tests ([`docs/VALIDATION.md`](docs/VALIDATION.md)) reproduisent les **exemples résolus du code** (notes A-2.4.10., A-2.6.3.1. 2), A-2.6.3.4. 5)), des cas limites des tableaux 3.7.2.2. et le jeu d'exemple :

  ```
  node --test tests/*.test.js
  ```

## Limites connues (phase 2)

- **Alimentation.** La méthode détaillée n'est pas implantée : pertes linéaires et singulières par tronçon, pression résiduelle, réduction à 75 % de 2.6.3.2. 3). Il en va de même pour la recirculation d'eau chaude.
- **Ventilation.** Les cas particuliers ne sont pas couverts : en boucle, par collecteur, ventilation d'équilibrage détaillée.
- **Pluvial** (2.4.10.4., 2.4.10.9. à 2.4.10.11.) et comparaison de scénarios.

## Structure

```
app/index.html      interface
app/styles.css      styles (thème clair/sombre, impression)
app/js/data.js      tables du code (source unique des valeurs)
app/js/engine.js    moteur de calcul (fonctions pures, testable sous Node)
app/js/exemple.js   jeu d'exemple
app/js/app.js       interface et exports
tests/              tests de validation (node --test)
docs/               extraction et validation
```
