# Extraction des tables normatives

**Source :** *Code de construction du Québec, chapitre III – Plomberie, et Code national de la plomberie – Canada 2020 (modifié)*, CNRC, PDF de 272 pages, créé le 2025-09-18. Il est versé à la racine du dépôt.

**Édition en vigueur.** Le chapitre III fondé sur le CNP 2020 intégrant les modifications du Québec est entré en vigueur le 2024-07-11. Une période transitoire de six mois a suivi. Selon la RBQ, les nouvelles installations y sont assujetties depuis le 2025-01-11.

**Méthode.** Le texte a été extrait avec `pdftotext -layout`. Chaque tableau a ensuite été comparé visuellement à l'image de sa page, rendue avec `pdftoppm`. Toutes les valeurs se trouvent dans `app/js/data.js`, chaque bloc portant son numéro de tableau et sa page.

| Donnée | Référence | Page | Vérification |
|---|---|---|---|
| Charge des appareils (FE) et tubulure min. | Tableau 2.4.9.3. | 2-37 à 2-39 | image ✔ |
| Charge selon le DN du siphon | Tableau 2.4.10.2. | 2-40 | texte ✔ |
| Écoulement continu : 31,7 FE par L/s | 2.4.10.3. 1) | 2-40 | texte ✔ |
| Colonnes de chute (total et par étage) | Tableau 2.4.10.6.-A | 2-41 | image ✔ |
| Branchements d'évacuation | Tableau 2.4.10.6.-B | 2-41 | image ✔ |
| Collecteurs et branchements d'égout sanitaire (selon la pente) | Tableau 2.4.10.6.-C | 2-42 | image ✔ |
| Pente minimale : 1:50 pour DN ≤ 3 | 2.4.8.1. 1) et note A-2.4.8.1. 1) | 2-37 | image ✔ |
| Diamètres minimaux (toilettes, égout public) | 2.4.9.1., 2.4.9.2., 2.4.9.4. | 2-37, 2-39 | image ✔ |
| Ventilation selon le siphon | Tableau 2.5.7.1. | 2-50 | image ✔ |
| Ventilation interne d'étage | Tableau 2.5.8.1.-A | 2-51 | image ✔ |
| Ventilation interne | Tableau 2.5.8.1.-B | 2-52 | image ✔ |
| Branchements et collecteurs de ventilation | Tableau 2.5.8.3. | 2-53 | image ✔ |
| Colonnes de ventilation primaire et secondaire | Tableau 2.5.8.4. | 2-54 | image ✔ |
| Facteurs d'alimentation (privé/public, froide/chaude/total) | Tableau 2.6.3.2.-A | 2-63, 2-64 | image ✔ |
| Urinoirs et toilettes à robinet de chasse | Tableaux 2.6.3.2.-B et -C | 2-65 | image ✔ |
| Appareils non listés | Tableau 2.6.3.2.-D | 2-65 | image ✔ |
| Pression statique max. 550 kPa, DN ≥ ¾, vitesse ≤ 3,0 m/s | 2.6.3.3., 2.6.3.4., 2.6.3.5. | 2-65, 2-66 | image ✔ |
| Méthode simplifiée pour 1 ou 2 logements | Tableau 2.6.3.4. | 2-66 | image ✔ |
| Méthode applicable aux petits bâtiments | Tableau A-2.6.3.1. 2)-A | 2-145 | image ✔ (sans les trames de vitesse) |
| Méthode de la perte de pression moyenne | Tableau A-2.6.3.1. 2)-F | 2-151 | image ✔ |
| 2,6 kPa/m min. ; longueur × 1,5 | Note A-2.6.3.1. 2), figure B | 2-149, 2-150 | texte ✔ |
| Équivalences DN ↔ mm | Tableau des équivalences métriques | dernière page | image ✔ |

## Constats sur la spécification initiale

1. **Numéros des tableaux.**
   - Les unités de charge d'évacuation sont au **tableau 2.4.9.3.** ; 2.4.10.3. est l'article sur l'écoulement continu.
   - Les facteurs d'alimentation privés et publics sont au **tableau 2.6.3.2.-A**. En évacuation, le code ne fait aucune distinction privé/public.
2. **Colonnes de chute.** Le tableau 2.4.10.6.-A ne dépend pas du nombre d'étages. Il donne une charge totale et une **charge maximale par étage**.
3. **Branchements horizontaux.** Le tableau 2.4.10.6.-B ne dépend pas de la pente. Seul le tableau 2.4.10.6.-C, pour les collecteurs et branchements d'égout, tient compte de la pente.
4. **Pente minimale.**
   - Le code n'exige que 1:50 pour un DN ≤ 3 (2.4.8.1. 1)).
   - Pour un DN ≥ 4, la note A recommande d'éviter les pentes inférieures à 1:100. Ce n'est pas une exigence.
5. **Ventilation.** Il n'y a pas de « tableau 2.5.8.1 » unique. Il faut choisir selon le cas : 2.5.8.1.-A/B (ventilation interne), 2.5.8.3. (branchements et collecteurs, avec longueur) ou 2.5.8.4. (colonnes, avec DN de la chute et longueur).
6. **Courbe de Hunter.**
   - Le CNP 2020 ne publie **aucune courbe de demande** convertissant les FA en L/s.
   - L'article 2.6.3.1. renvoie aux méthodes ASHRAE et ASPE.
   - La note A-2.6.3.1. 2) propose deux méthodes tabulées (tableaux A et F), qui sont implantées.
   - Le débit affiché est **indicatif**. Il est interpolé dans la colonne de vitesse choisie du tableau F.
7. **Pression minimale par appareil.** Le code ne fixe pas de valeur. Il renvoie aux spécifications du fabricant (2.6.3.1. 1)). Les 105 kPa du jeu d'exemple viennent de la figure A-2.6.3.1. 2)-B et sont une hypothèse.
8. **Appareils minimaux (section 3.7.).** Ce contenu n'est **pas dans le chapitre III** : il relève de la division B du CNB, soit le CCQ chapitre I – Bâtiment. Il a été extrait du second PDF (voir plus bas).
9. **Incohérence interne du code.**
   - L'exemple 2 de la note A-2.4.10. compte la fontaine à 1 FE.
   - Le tableau 2.4.9.3. lui attribue ½ FE.
   - L'application applique le tableau. Le DN obtenu est le même (voir VALIDATION.md, V-B1).
10. **Lave-vaisselle domestique.** Il est « s/o » en usage public (tableau 2.6.3.2.-A). L'application signale l'erreur au lieu de deviner une valeur.

## Valeurs non transcrites ou à confirmer

- **Trames de vitesse du tableau A-2.6.3.1. 2)-A.** La zone 3,0, 2,4 ou 1,5 m/s de chaque cellule est indiquée par une trame grise. Elle n'est pas reproduite : consulter le tableau officiel.
- **DN ⅝ et 15.** Ces DN figurent dans les tableaux mais pas dans le tableau des équivalences métriques. Leur équivalent en mm est affiché « n.d. ».
- **Chéneaux, descentes et collecteurs pluviaux** (2.4.10.9. à 2.4.10.11.). Ces tableaux sont prévus pour la phase 2 (pluvial).

## Module E — CCQ chapitre I – Bâtiment

**Source :** *Code de construction du Québec, chapitre I – Bâtiment, et Code national du bâtiment – Canada 2020 (modifié)*, PDF de 1659 pages (« CCQ Chapitre I.pdf »), division B.

| Donnée | Référence | Page | Vérification |
|---|---|---|---|
| Nombre de personnes (surface par occupant) | Tableau 3.1.17.1. | 3-49, 3-50 | image ✔ |
| Méthode de détermination (sièges fixes, 2 personnes par chambre, tableau) | 3.1.17.1. 1) | 3-48 | texte ✔ |
| Répartition égale entre les sexes ; toilette unique ; urinoirs | 3.7.2.2. 1) à 3) | 3-191, 3-192 | image ✔ |
| Établissements de réunion | Tableau 3.7.2.2.-A | 3-192 | image ✔ |
| Écoles primaires et garderies ; culte ; soins et habitations ; logements | 3.7.2.2. 5), 6), 8), 9) | 3-192 | image ✔ |
| Établissements d'affaires | Tableau 3.7.2.2.-B | 3-192 | image ✔ |
| Établissements commerciaux ; suites commerciales ≤ 500 m² | 3.7.2.2. 11) et 14) | 3-193 | image ✔ |
| Établissements industriels | Tableau 3.7.2.2.-C ; 3.7.2.1. 2) | 3-193 | image ✔ |
| Lavabos | 3.7.2.3. 1) | 3-193 | image ✔ |
| Avaloir de sol (plus de 2 toilettes ou urinoirs) | 3.7.2.6. 1)a) | 3-194 | texte ✔ |
| Accès sans obstacles (rappels seulement) | 3.8.2.8. | — | texte ✔ |

### Interprétations à confirmer

Le code ne précise pas l'arrondi. L'application applique les règles suivantes et l'indique dans l'interface :

- Le nombre de personnes calculé (surface ÷ m² par personne) est arrondi à l'unité supérieure.
- Avec une répartition égale, la moitié est aussi arrondie à l'unité supérieure. Exemple : 194 → 97 de chaque sexe.
- « 1 par groupe additionnel de N » : un groupe entamé compte. Exemple : 51 personnes dans un établissement d'affaires → 4 toilettes.
- « 1 lavabo par groupe de 2 toilettes ou urinoirs supplémentaires » : un groupe entamé compte. Le calcul suppose une salle de toilettes par sexe.
- Toilettes pour hommes remplacées par des urinoirs : au plus ⌊2/3⌋ du nombre exigé, ou 1 si 2 toilettes sont exigées.
