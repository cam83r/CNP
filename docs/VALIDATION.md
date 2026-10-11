# Cas de validation

Exécution : `node --test tests/*.test.js` (Node ≥ 18). Le fichier `tests/engine.test.js` reproduit chacun des cas ci-dessous.

Les cas V-B1 et V-D1 à V-D5 viennent des **exemples résolus du code lui-même**, dans les notes de l'annexe A. Le cas V-EX est le jeu d'exemple de l'application, calculé à la main.

## V-B1 — Note A-2.4.10., exemple 2 (bureaux de 5 étages)

**Étage type**

| Appareil | Valeur du tableau | FE |
|---|---|---|
| 5 toilettes à robinet de chasse | 6 | 30 |
| 2 urinoirs en applique à évacuation simple | 1½ | 3 |
| 4 lavabos à siphon de 1½ | 1½ | 6 |
| 2 avaloirs de sol à siphon DN 3 | 3 | 6 |
| 1 évier de service à siphon DN 3 | 3 | 3 |
| 1 fontaine | ½ | ½ |
| **Total** | | **48,5 FE** |

Le code compte la fontaine à 1 FE et obtient 49 FE, ce qui contredit son propre tableau 2.4.9.3.

**Résultats**

| Élément | Charge | Application | Code |
|---|---|---|---|
| Colonne de chute | 5 × 48,5 = 242,5 FE ; 48,5 FE par étage | DN 4 (≤ 540 et ≤ 100 par étage) | DN 4 ✔ |
| Branchement de sous-sol | 6 + 1 + 6 + 3 + 0,23 L/s × 31,7 = 23,29 FE | DN 3 (≤ 27) | 23 FE, DN 3 ✔ |
| Collecteur | 265,79 FE | DN 4 insuffisant à 1:50 (240), suffisant à 1:25 (300) | « DN 4 à pente ≥ 1:32 » ✔ |

Pour le collecteur, l'application retient DN 5 à 1:50 et DN 4 à 1:25.

## V-B2 à V-B4 — Limites des tableaux et règles 2.4.8. / 2.4.9.

- **Colonne de chute** : 102 FE donne DN 3 ; 103 FE donne DN 4. Une charge de 19 FE à un seul étage dépasse 18 et impose DN 4.
- **Branchement** : 27 FE donne DN 3 ; 28 FE donne DN 4.
- **Pente de 1:32** : la colonne 1:50 du tableau C est retenue, par prudence.
- **3 toilettes à réservoir** (12 FE) sur un branchement : DN 4, par 2.4.9.2. 2).
- **2 lavabos à siphon de 1¼** (2 FE) : DN 1¼. À une pente de 1:100, l'application signale une erreur de pente (minimum 1:50).

## V-C1, V-C2 — Ventilation

| Cas | Résultat | Raison |
|---|---|---|
| Chute DN 4, 245 FE, 30 m | DN 3 | Ligne 320 ; DN 3 permis jusqu'à 52 m |
| Chute DN 4, 245 FE, 60 m | DN 4 | 60 m > 52 m pour DN 3 |
| Chute DN 3, 102 FE, 5 m | DN 1½ | 7,5 m permis ; moitié de 3 |
| Chute DN 6, 100 FE, 5 m | DN 3 | Minimum = moitié de 6 (2.5.8.4. 3)) |
| Ventilation interne d'étage, 18 FE | DN 3 | Tableau 2.5.8.1.-A |
| Ventilation interne, 8 FE, 2 toilettes | DN 3 | |
| Ventilation interne, 4 FE, sans toilette | DN 2 | |
| Ventilation interne, 3 toilettes | Hors tableau | |
| Branchement de ventilation, 17 FE, 9 m | DN 1½ | Ligne 20 ; 15 m permis |
| Branchement de ventilation, 100 FE, 80 m | DN 4 | |
| Siphon DN 3 | Ventilation DN 1½ | Tableau 2.5.7.1. |

## V-D1 — Note A-2.6.3.1. 2), méthode de la perte de pression moyenne (tableaux G, H, I)

- **Branchement d'eau général**, 210,8 FA à 2,4 m/s : DN 2 ✔.
- **Eau chaude**, à 1,5 m/s : 8 → ¾, 11 → 1, 15 → 1, 6 → ⅝, 21 → 1¼ ✔.
- **Eau froide**, à 2,4 m/s : tuyaux A à R conformes au tableau I. Exemples : 29,8 → 1 ; 49,8 → 1¼ ; 109,8 → 2 ; 60 → 1½ ✔.

## V-D2 — Méthode applicable aux petits bâtiments (tableaux B, C, D)

- **Branchement d'eau général**, 565 kPa et 30 m, 210,8 FA : DN 2 ✔.
- **Distribution**, 540 kPa et 76 m :
  - eau chaude : 8 → ¾, 11 → ¾, 15 → 1, 6 → ⅝, 21 → 1 ✔ ;
  - eau froide : 29,8 → 1¼, 109,8 → 1½, 169,8 → 2, etc. ✔.

## V-D3 — Méthode simplifiée 2.6.3.4. (tableaux A-2.6.3.4. 5)-B, -C, -D)

Toutes les lignes des trois tableaux sont reproduites aux trois vitesses. Exemple : 23,8 FA donne 1 / 1 / 1¼ ✔.

## V-D4 — Bilan de pression (figure A-2.6.3.1. 2)-B)

1. 565 − 25 = 540 kPa (pression ajustée au point d'entrée).
2. 540 − (20 + 35 + 105) = 380 kPa (pression disponible pour les pertes de charge).
3. 76 m × 1,5 = 114 m (longueur équivalente).
4. 380 / 114 = 3,33 kPa/m ≥ 2,6 ✔.

## V-D5 — Sommaire du tableau A-2.6.3.4. 5)-A

2 baignoires, 1 douche, 2 éviers, 3 lavabos, 2 lave-vaisselle, 2 machines à laver, 1 robinet d'arrosage et 3 toilettes de 6 L, en usage privé : **23,8 FA** ✔.

---

## V-EX — Jeu d'exemple : bureaux de 2 étages

Le jeu se trouve dans `app/js/exemple.js`. Tous les appareils sont en usage public (salles de toilettes communes, définition 1.4.1.2.).

### Locaux

| Local (étage) | Appareils | FE | FA total |
|---|---|---|---|
| WC Hommes (RDC et É2) | 2 toilettes à réservoir ≤ 6 L/c, 2 urinoirs en applique à évacuation simple avec robinet de chasse automatique, 2 lavabos ≤ 8,3 L/min à siphon de 1¼, 1 avaloir de sol DN 3 | 2×4 + 2×1½ + 2×1 + 3 = **16** | 2×2,2 + 2×4 + 2×2 = **16,4** |
| WC Femmes (RDC et É2) | 3 toilettes, 2 lavabos, 1 avaloir de sol DN 3 | 3×4 + 2×1 + 3 = **17** | 3×2,2 + 2×2 = **10,6** |
| Cuisinette RDC | Évier de cuisine domestique | 1½ | 1,4 |
| Corridors (RDC et É2) | Fontaine | ½ chacun | 0,25 chacun |
| Conciergerie RDC | Évier de service à siphon DN 3 | 3 | 3 |

### Évacuation

| Réseau | Charge | DN | Justification |
|---|---|---|---|
| Branchement WC Hommes É2 | 16 FE | **DN 3** | Tableau B (27) ; toilette ≥ 3 |
| Branchement WC Femmes É2 | 17 FE | **DN 4** | Tableau B donne DN 3, mais 3 toilettes imposent DN 4 (2.4.9.2. 2)) |
| Colonne de chute CC-1 | 67 FE ; 33,5 FE par étage | **DN 4** | 33,5 > 18 par étage pour DN 3 ; 10 toilettes > 6 (2.4.9.2. 3)) |
| Ventilation de CC-1 (12 m) | Ligne 140 FE | **DN 3** | DN 2 permis jusqu'à 8 m seulement ; DN 3 jusqu'à 61 m |
| Branchement cuisinette + conciergerie | 4,5 FE | **DN 2** | Tableau B (6) |
| Collecteur principal (1:50, égout public) | 71,5 FE | **DN 4** | Tableau C (240 à 1:50) ; 2.4.9.4. |

### Ventilation

- Branchement de ventilation WC Femmes É2 (17 FE, 9 m) : **DN 1½**.
- Ventilation individuelle de l'évier de service (siphon DN 3) : **DN 1½**.

### Alimentation (perte de pression moyenne, 2,4 m/s)

| Tronçon | FA | DN | Raison |
|---|---|---|---|
| Distribution RDC | 31,65 | **DN 1¼** | Le DN 1 est limité à 30 |
| Colonne montante É2 | 27,25 | **DN 1** | |
| Branchement d'eau général | 58,9 | **DN 1½** | Le DN 1¼ est limité à 54 |

- **Débit indicatif du branchement** : 1,8 + (58,9 − 54) / (102 − 54) × (2,8 − 1,8) = **1,9 L/s**.
- **Bilan de pression** (hypothèses de projet : 450 kPa, 20 kPa, 50 kPa, 7 m, 105 kPa, 45 m) :
  1. 450 − 20 = 430 kPa ;
  2. 430 − 50 − 7 × 9,81 − 105 = 206,3 kPa ;
  3. 206,3 / (45 × 1,5) = **3,06 kPa/m** ≥ 2,6 ✔.
