/*
 * Données normatives — Code de construction du Québec, chapitre III – Plomberie,
 * et Code national de la plomberie – Canada 2020 (modifié) (CNP 2020 intégrant
 * les modifications du Québec), CNRC, 2e impression (PDF du 2025-09-18).
 *
 * Chaque valeur est transcrite du PDF et vérifiée visuellement contre l'image
 * de la page (voir docs/EXTRACTION.md). Ne rien modifier sans revérifier le texte.
 *
 * Conventions :
 *   - DN : désignation du diamètre nominal telle qu'écrite dans le code (en po).
 *   - null : « s/o » dans le tableau (sans objet).
 *   - Infinity : « NL » (non limitée) ; -1 : « NP » (non permise).
 */
(function (root) {
  'use strict';

  const EDITION = {
    titre: 'Code de construction du Québec, chapitre III – Plomberie, et Code national de la plomberie – Canada 2020 (modifié)',
    court: 'CCQ ch. III / CNP 2020 (modifié Québec)',
    source: 'CNRC, PDF « CCQ Chapitre III – Plomberie, et CNP – Canada 2020 (modifié) », 272 p., créé le 2025-09-18',
    vigueur: 'Entrée en vigueur le 2024-07-11 ; obligatoire pour les nouvelles installations depuis le 2025-01-11 (fin de la période transitoire, selon la RBQ).',
  };

  const NL = Infinity;
  const NP = -1;

  // Ordre des DN et équivalences métriques — « Tableau des équivalences métriques
  // pour le diamètre nominal de tuyau (DN) », dernière page du CNP.
  // ⅝ et 15 ne figurent pas dans ce tableau : mm = null (non donné).
  const DN = [
    { dn: '⅛', v: 0.125, mm: 6 },
    { dn: '¼', v: 0.25, mm: 8 },
    { dn: '⅜', v: 0.375, mm: 10 },
    { dn: '½', v: 0.5, mm: 15 },
    { dn: '⅝', v: 0.625, mm: null },
    { dn: '¾', v: 0.75, mm: 20 },
    { dn: '1', v: 1, mm: 25 },
    { dn: '1¼', v: 1.25, mm: 32 },
    { dn: '1½', v: 1.5, mm: 38 },
    { dn: '2', v: 2, mm: 50 },
    { dn: '2½', v: 2.5, mm: 65 },
    { dn: '3', v: 3, mm: 75 },
    { dn: '4', v: 4, mm: 100 },
    { dn: '5', v: 5, mm: 125 },
    { dn: '6', v: 6, mm: 150 },
    { dn: '8', v: 8, mm: 200 },
    { dn: '10', v: 10, mm: 250 },
    { dn: '12', v: 12, mm: 300 },
    { dn: '15', v: 15, mm: null },
  ];

  // ---------------------------------------------------------------------------
  // ÉVACUATION
  // ---------------------------------------------------------------------------

  // Tableau 2.4.9.3. — Diamètre minimal des tubulures de sortie et charge
  // hydraulique des appareils (facteurs d'évacuation, FE). Pages 2-37 à 2-39.
  // tub : DN minimal de la tubulure de sortie (null = s/o).
  // wc : true si l'appareil compte comme toilette pour l'article 2.4.9.2.
  const T_2_4_9_3 = [
    { id: 'armoire_biere', nom: 'Armoire à bière', tub: '1½', fe: 1.5 },
    { id: 'avaloir_douche_a', nom: 'Avaloir de douche — débit total < 9,5 L/min', tub: '1½', fe: 1.5 },
    { id: 'avaloir_douche_b', nom: 'Avaloir de douche — débit total 9,5 à 20 L/min', tub: '2', fe: 3 },
    { id: 'avaloir_douche_c', nom: 'Avaloir de douche — débit total > 20 L/min', tub: '3', fe: 6 },
    { id: 'avaloir_sol_2', nom: 'Avaloir de sol — siphon DN 2', tub: '2', fe: 2 },
    { id: 'avaloir_sol_3', nom: 'Avaloir de sol — siphon DN 3', tub: '2', fe: 3 },
    { id: 'avaloir_sol_urgence', nom: "Avaloir de sol d'urgence", tub: '2', fe: 0, note: 'Note (2) : aucune charge hydraulique pour les avaloirs de sol d’urgence.' },
    { id: 'bac_laver_a', nom: 'Bac à laver — 1 ou 2 compartiments (ou 2 bacs, siphon commun)', tub: '1½', fe: 1.5 },
    { id: 'bac_laver_b', nom: 'Bac à laver — 3 compartiments', tub: '1½', fe: 2 },
    { id: 'baignoire', nom: 'Baignoire (avec ou sans pomme de douche)', tub: '1½', fe: 1.5 },
    { id: 'bain_pieds', nom: 'Bain de pieds, bain de siège', tub: '1½', fe: 1.5 },
    { id: 'bidet', nom: 'Bidet', tub: '1¼', fe: 1 },
    { id: 'bloc_reservoir', nom: 'Bloc sanitaire — avec réservoir de chasse', tub: null, fe: 6, wc: true },
    { id: 'bloc_robinet', nom: 'Bloc sanitaire — avec robinet de chasse', tub: null, fe: 8, wc: true },
    { id: 'broyeur_comm', nom: "Broyeur d'ordures (commercial)", tub: '2', fe: 3 },
    { id: 'eplucheur', nom: 'Éplucheur de légumes', tub: '2', fe: 3 },
    { id: 'evier_petit', nom: 'Évier — petit, domestique ou non, 1 ou 2 compartiments (ou 2 éviers, siphon commun)', tub: '1½', fe: 1.5 },
    { id: 'evier_autre_1_5', nom: 'Évier — autres types, siphon DN 1½', tub: '1½', fe: 1.5 },
    { id: 'evier_autre_2', nom: 'Évier — autres types, siphon DN 2', tub: '1½', fe: 2 },
    { id: 'evier_autre_3', nom: 'Évier — autres types, siphon DN 3', tub: '1½', fe: 3 },
    { id: 'fontaine', nom: "Fontaine d'eau potable", tub: '1¼', fe: 0.5 },
    { id: 'glaciere', nom: 'Glacière', tub: '1¼', fe: 1 },
    { id: 'lavabo_coiffure', nom: 'Lavabo — salon de coiffure ou de beauté', tub: '1½', fe: 1.5 },
    { id: 'lavabo_dentiste', nom: 'Lavabo — de dentiste', tub: '1¼', fe: 1 },
    { id: 'lavabo_dom_1_25', nom: 'Lavabo — domestique 1 compartiment (ou 2, siphon commun), siphon DN 1¼', tub: '1¼', fe: 1 },
    { id: 'lavabo_dom_1_5', nom: 'Lavabo — domestique 1 compartiment (ou 2, siphon commun), siphon DN 1½', tub: '1¼', fe: 1.5 },
    { id: 'lavabo_multi_1_5', nom: 'Lavabo — compartiments multiples / industriel, siphon DN 1½ (tabl. 2.4.10.2.)', tub: '1½', fe: 2, ref: 'Tableaux 2.4.9.3. et 2.4.10.2.' },
    { id: 'lavabo_multi_2', nom: 'Lavabo — compartiments multiples / industriel, siphon DN 2 (tabl. 2.4.10.2.)', tub: '1½', fe: 3, ref: 'Tableaux 2.4.9.3. et 2.4.10.2.' },
    { id: 'lv_dom', nom: 'Lave-vaisselle domestique (non relié)', tub: '1½', fe: 1.5 },
    { id: 'lv_dom_relie', nom: "Lave-vaisselle domestique relié à un broyeur ou à un évier domestique", tub: '1½', fe: 0, note: 'Aucune charge si relié à un broyeur d’ordures ou à un évier domestique.' },
    { id: 'lv_comm', nom: 'Lave-vaisselle commercial', tub: '2', fe: 3 },
    { id: 'mal_dom', nom: 'Machine à laver domestique', tub: null, fe: 2, note: 'Voir aussi 2.4.9.3. 3) : admission du siphon DN ≥ 2 et tuyau vertical ≥ 600 mm.' },
    { id: 'mal_comm', nom: 'Machine à laver commerciale', tub: null, fe: 2 },
    { id: 'table_autopsie', nom: "Table d'autopsie", tub: '1½', fe: 2 },
    { id: 'toilette_reservoir', nom: 'Toilette à réservoir de chasse', tub: '3', fe: 4, wc: true },
    { id: 'toilette_robinet', nom: 'Toilette à robinet de chasse', tub: '3', fe: 6, wc: true },
    { id: 'toilette_broyeur', nom: 'Toilette à broyeur', tub: '¾', fe: 4 },
    { id: 'unite_dentaire', nom: 'Unité dentaire', tub: '1¼', fe: 1 },
    { id: 'urinoir_colonne', nom: 'Urinoir — sur colonne, évacuation siphonique ou simple', tub: '2', fe: 4 },
    { id: 'urinoir_stalle', nom: 'Urinoir — stalle, évacuation simple', tub: '2', fe: 2 },
    { id: 'urinoir_applique_simple', nom: 'Urinoir — en applique, évacuation simple', tub: '1½', fe: 1.5 },
    { id: 'urinoir_applique_autre', nom: 'Urinoir — en applique, autres types', tub: '2', fe: 3 },
    // Tableau 2.4.10.2. — appareils non compris au tableau 2.4.9.3. (selon le DN du siphon)
    { id: 'autre_siphon_1_25', nom: 'Autre appareil (non listé) — siphon DN 1¼', tub: null, fe: 1, ref: 'Tableau 2.4.10.2.' },
    { id: 'autre_siphon_1_5', nom: 'Autre appareil (non listé) — siphon DN 1½', tub: null, fe: 2, ref: 'Tableau 2.4.10.2.' },
    { id: 'autre_siphon_2', nom: 'Autre appareil (non listé) — siphon DN 2', tub: null, fe: 3, ref: 'Tableau 2.4.10.2.' },
    { id: 'autre_siphon_3', nom: 'Autre appareil (non listé) — siphon DN 3', tub: null, fe: 5, ref: 'Tableau 2.4.10.2.' },
    { id: 'autre_siphon_4', nom: 'Autre appareil (non listé) — siphon DN 4', tub: null, fe: 6, ref: 'Tableau 2.4.10.2.' },
  ];

  // 2.4.10.3. 1) — écoulement continu : 31,7 FE par L/s.
  const FE_PAR_LS = 31.7;

  // Tableau 2.4.10.6.-A — Charge hydraulique maximale pour une colonne de chute (p. 2-41).
  const T_2_4_10_6_A = [
    { dn: '1¼', max: 2, parEtage: 2 },
    { dn: '1½', max: 8, parEtage: 2 },
    { dn: '2', max: 24, parEtage: 6 },
    { dn: '3', max: 102, parEtage: 18 },
    { dn: '4', max: 540, parEtage: 100 },
    { dn: '5', max: 1400, parEtage: 250 },
    { dn: '6', max: 2900, parEtage: 500 },
    { dn: '8', max: 7600, parEtage: 830 },
    { dn: '10', max: 15000, parEtage: 2700 },
    { dn: '12', max: 26000, parEtage: 4680 },
    { dn: '15', max: 50000, parEtage: 9000 },
  ];

  // Tableau 2.4.10.6.-B — Charge hydraulique maximale pour un branchement d'évacuation (p. 2-41).
  const T_2_4_10_6_B = [
    { dn: '1¼', max: 2 },
    { dn: '1½', max: 3 },
    { dn: '2', max: 6 },
    { dn: '3', max: 27 },
    { dn: '4', max: 180 },
    { dn: '5', max: 390 },
    { dn: '6', max: 700 },
    { dn: '8', max: 1600 },
    { dn: '10', max: 2500 },
    { dn: '12', max: 3900 },
  ];

  // Tableau 2.4.10.6.-C — Collecteur sanitaire ou branchement d'égout sanitaire (p. 2-42).
  // Pentes (dénominateur 1:x) : 400, 200, 133, 100, 50, 25.
  const PENTES_C = [400, 200, 133, 100, 50, 25];
  const T_2_4_10_6_C = [
    { dn: '3', max: [null, null, null, null, 27, 36] },
    { dn: '4', max: [null, null, null, 180, 240, 300] },
    { dn: '5', max: [null, null, 380, 390, 480, 670] },
    { dn: '6', max: [null, null, 600, 700, 840, 1300] },
    { dn: '8', max: [null, 1400, 1500, 1600, 2250, 3370] },
    { dn: '10', max: [null, 2500, 2700, 3000, 4500, 6500] },
    { dn: '12', max: [2240, 3900, 4500, 5400, 8300, 13000] },
    { dn: '15', max: [4800, 7000, 9300, 10400, 16300, 22500] },
  ];

  // ---------------------------------------------------------------------------
  // VENTILATION
  // ---------------------------------------------------------------------------

  // Tableau 2.5.7.1. — DN minimal du tuyau de ventilation selon le DN du siphon desservi (p. 2-50).
  const T_2_5_7_1 = [
    { siphon: '1¼', vent: '1¼' },
    { siphon: '1½', vent: '1¼' },
    { siphon: '2', vent: '1½' },
    { siphon: '3', vent: '1½' },
    { siphon: '4', vent: '1½' },
    { siphon: '5', vent: '2' },
    { siphon: '6', vent: '2' },
  ];

  // Tableau 2.5.8.1.-A — Ventilation interne, appareils sur un même étage (p. 2-51).
  const T_2_5_8_1_A = [
    { dn: '1¼', max: 1 },
    { dn: '1½', max: 2 },
    { dn: '2', max: 5 },
    { dn: '3', max: 18 },
    { dn: '4', max: 120 },
  ];

  // Tableau 2.5.8.1.-B — Ventilation interne (p. 2-52).
  // sansWc : appareils sauf toilettes ; wc2 : desservant au plus 2 toilettes.
  const T_2_5_8_1_B = [
    { dn: '1½', sansWc: 2, wc2: null },
    { dn: '2', sansWc: 4, wc2: 3 },
    { dn: '3', sansWc: 12, wc2: 8 },
    { dn: '4', sansWc: 36, wc2: 14 },
    { dn: '5', sansWc: null, wc2: 18 },
    { dn: '6', sansWc: null, wc2: 23 },
  ];

  // Tableau 2.5.8.3. — Branchements de ventilation, collecteurs de ventilation,
  // tuyaux de ventilation secondaire et terminale (p. 2-53). Longueur max (m).
  const T_2_5_8_3_DN = ['1¼', '1½', '2', '3', '4', '5', '6', '8'];
  const T_2_5_8_3 = [
    { fe: 2, L: [9, NL, NL, NL, NL, NL, NL, NL] },
    { fe: 8, L: [9, 30, 61, NL, NL, NL, NL, NL] },
    { fe: 20, L: [7.5, 15, 46, NL, NL, NL, NL, NL] },
    { fe: 24, L: [4.5, 9, 30, NL, NL, NL, NL, NL] },
    { fe: 42, L: [NP, 9, 30, NL, NL, NL, NL, NL] },
    { fe: 60, L: [NP, 4.5, 15, 120, NL, NL, NL, NL] },
    { fe: 100, L: [NP, NP, 11, 79, 305, NL, NL, NL] },
    { fe: 200, L: [NP, NP, 9, 76, 275, NL, NL, NL] },
    { fe: 500, L: [NP, NP, 6, 55, 215, NL, NL, NL] },
    { fe: 1100, L: [NP, NP, NP, 15, 61, 215, NL, NL] },
    { fe: 1900, L: [NP, NP, NP, 6, 21, 61, 215, NL] },
    { fe: 2200, L: [NP, NP, NP, NP, 9, 27, 105, 335] },
    { fe: 3600, L: [NP, NP, NP, NP, 7.5, 18, 76, 245] },
    { fe: 5600, L: [NP, NP, NP, NP, NP, 7.5, 18, 76] },
  ];

  // Tableau 2.5.8.4. — Colonnes de ventilation primaire ou secondaire (p. 2-54).
  const T_2_5_8_4_DN = ['1¼', '1½', '2', '3', '4', '5', '6', '8', '10', '12'];
  const T_2_5_8_4 = [
    { chute: '1¼', fe: 2, L: [9, NL, NL, NL, NL, NL, NL, NL, NL, NL] },
    { chute: '1½', fe: 8, L: [15, 46, NL, NL, NL, NL, NL, NL, NL, NL] },
    { chute: '2', fe: 12, L: [9, 23, 61, NL, NL, NL, NL, NL, NL, NL] },
    { chute: '2', fe: 24, L: [8, 15, 46, NL, NL, NL, NL, NL, NL, NL] },
    { chute: '3', fe: 10, L: [NP, 13, 46, 317, NL, NL, NL, NL, NL, NL] },
    { chute: '3', fe: 21, L: [NP, 10, 33.5, 247, NL, NL, NL, NL, NL, NL] },
    { chute: '3', fe: 53, L: [NP, 8, 28.5, 207, NL, NL, NL, NL, NL, NL] },
    { chute: '3', fe: 102, L: [NP, 7.5, 26, 189, NL, NL, NL, NL, NL, NL] },
    { chute: '4', fe: 43, L: [NP, NP, 10.5, 76, 299, NL, NL, NL, NL, NL] },
    { chute: '4', fe: 140, L: [NP, NP, 8, 61, 229, NL, NL, NL, NL, NL] },
    { chute: '4', fe: 320, L: [NP, NP, 7, 52, 195, NL, NL, NL, NL, NL] },
    { chute: '4', fe: 540, L: [NP, NP, 6.5, 46, 177, NL, NL, NL, NL, NL] },
    { chute: '5', fe: 190, L: [NP, NP, NP, 25, 97.5, 302, NL, NL, NL, NL] },
    { chute: '5', fe: 490, L: [NP, NP, NP, 19, 76, 232, NL, NL, NL, NL] },
    { chute: '5', fe: 940, L: [NP, NP, NP, 16, 64, 204, NL, NL, NL, NL] },
    { chute: '5', fe: 1400, L: [NP, NP, NP, 15, 58, 180, NL, NL, NL, NL] },
    { chute: '6', fe: 500, L: [NP, NP, NP, 10, 39.5, 122, 305, NL, NL, NL] },
    { chute: '6', fe: 1100, L: [NP, NP, NP, 8, 30.5, 94.5, 238, NL, NL, NL] },
    { chute: '6', fe: 2000, L: [NP, NP, NP, 6.5, 25.5, 79, 201, NL, NL, NL] },
    { chute: '6', fe: 2900, L: [NP, NP, NP, 6, 23.5, 73, 183, NL, NL, NL] },
    { chute: '8', fe: 1800, L: [NP, NP, NP, NP, 9.5, 29, 73, 287, NL, NL] },
    { chute: '8', fe: 3400, L: [NP, NP, NP, NP, 7, 22, 58, 219.5, NL, NL] },
    { chute: '8', fe: 5600, L: [NP, NP, NP, NP, 6, 19, 49, 186, NL, NL] },
    { chute: '8', fe: 7600, L: [NP, NP, NP, NP, 5.5, 17, 43, 170.5, NL, NL] },
    { chute: '10', fe: 4000, L: [NP, NP, NP, NP, NP, 9.5, 24, 94.5, 292.5, NL] },
    { chute: '10', fe: 7200, L: [NP, NP, NP, NP, NP, 7, 18, 73, 225.5, NL] },
    { chute: '10', fe: 11000, L: [NP, NP, NP, NP, NP, 6, 15.5, 61, 192, NL] },
    { chute: '10', fe: 15000, L: [NP, NP, NP, NP, NP, 5.5, 14, 55, 174, NL] },
    { chute: '12', fe: 7300, L: [NP, NP, NP, NP, NP, NP, 9.5, 36.5, 116, 287] },
    { chute: '12', fe: 13000, L: [NP, NP, NP, NP, NP, NP, 7, 28.5, 91, 219.5] },
    { chute: '12', fe: 20000, L: [NP, NP, NP, NP, NP, NP, 6, 24, 76, 186] },
    { chute: '12', fe: 26000, L: [NP, NP, NP, NP, NP, NP, 5.5, 22, 70, 152] },
    { chute: '15', fe: 15000, L: [NP, NP, NP, NP, NP, NP, NP, 12, 39.5, 94.5] },
    { chute: '15', fe: 25000, L: [NP, NP, NP, NP, NP, NP, NP, 9.5, 29, 73] },
    { chute: '15', fe: 38000, L: [NP, NP, NP, NP, NP, NP, NP, 8, 24.5, 61] },
    { chute: '15', fe: 50000, L: [NP, NP, NP, NP, NP, NP, NP, 7, 22.5, 55] },
  ];

  // ---------------------------------------------------------------------------
  // ALIMENTATION EN EAU
  // ---------------------------------------------------------------------------

  // Tableaux 2.6.3.2.-A, -B et -C — facteurs d'alimentation (FA) (p. 2-63, 2-64, 2-65).
  // priv / pub : [eau froide, eau chaude, total] ; null = s/o.
  // fab : true = « se reporter aux recommandations du fabricant » (FA à saisir).
  const T_2_6_3_2_A = [
    { id: 'baignoire', nom: 'Baignoire (avec ou sans pomme de douche)', dn: '½', priv: [1, 1, 1.4], pub: [3, 3, 4] },
    { id: 'baignoire_bec_3_4', nom: 'Baignoire avec bec DN ¾', dn: '¾', priv: [2.25, 2.25, 3], pub: [4.5, 4.5, 6] },
    { id: 'bidet', nom: 'Bidet', dn: '⅜', priv: [1.5, 1.5, 2], pub: [null, null, null] },
    { id: 'bloc_6l', nom: 'Bloc sanitaire avec réservoir de chasse de 6 L/c', dn: null, priv: [2.7, 1.5, 3.6], pub: [null, null, null], note: 'Note (4) : bloc fondé sur un DN ½ pour l’alimentation de la baignoire. Bloc de plus de 3 appareils : ajouter les appareils additionnels (note 3).' },
    { id: 'bloc_plus_6l', nom: 'Bloc sanitaire avec réservoir de chasse de plus de 6 L/c', dn: null, priv: [4, 3, 6], pub: [null, null, null], note: 'Note (4) : bloc fondé sur un DN ½ pour l’alimentation de la baignoire. Bloc de plus de 3 appareils : ajouter les appareils additionnels (note 3).' },
    { id: 'douche_multi', nom: 'Douche, pulvérisateur, pommes multiples (par pomme de douche)', dn: null, priv: [1, 1, 1.4], pub: [3, 3, 4], note: 'Note (5) : DN selon les recommandations du fabricant.' },
    { id: 'evier_bar', nom: 'Évier, bar', dn: '⅜', priv: [0.75, 0.75, 1], pub: [1.5, 1.5, 2] },
    { id: 'evier_cuisine_comm', nom: 'Évier de cuisine, commercial, par robinet', dn: '½', priv: [null, null, null], pub: [3, 3, 4] },
    { id: 'evier_cuisine_dom', nom: 'Évier de cuisine, domestique, 8,3 L/min', dn: '⅜', priv: [1, 1, 1.4], pub: [1, 1, 1.4] },
    { id: 'evier_cuisine_dom_plus', nom: 'Évier de cuisine, domestique, plus de 8,3 L/min', dn: '⅜', priv: [1.5, 1.5, 2], pub: [1.5, 1.5, 2] },
    { id: 'evier_labo', nom: 'Évier de laboratoire', dn: '⅜', priv: [null, null, null], pub: [1.5, 1.5, 2] },
    { id: 'evier_lavage', nom: 'Évier de lavage, par robinet', dn: '½', priv: [null, null, null], pub: [1.5, 1.5, 2] },
    { id: 'evier_service', nom: 'Évier de service ou à vadrouille', dn: '½', priv: [null, null, null], pub: [2.25, 2.25, 3] },
    { id: 'evier_clinique_rc', nom: 'Évier de service pour clinique, à robinet de chasse', dn: '1', priv: [null, null, null], pub: [6, null, 6] },
    { id: 'evier_clinique_robinet', nom: 'Évier de service pour clinique, avec robinet', dn: '½', priv: [null, null, null], pub: [2.25, 2.25, 3] },
    { id: 'evier_lessive', nom: 'Évier pour lessive (1 ou 2 compartiments)', dn: '⅜', priv: [1, 1, 1.4], pub: [1, 1, 1.4] },
    { id: 'fontaine', nom: "Fontaine d'eau potable ou refroidisseur d'eau", dn: '⅜', priv: [null, null, null], pub: [0.25, null, 0.25] },
    { id: 'lavabo', nom: 'Lavabo, au plus 8,3 L/min', dn: '⅜', priv: [0.5, 0.5, 0.7], pub: [1.5, 1.5, 2] },
    { id: 'lavabo_plus', nom: 'Lavabo, plus de 8,3 L/min', dn: '⅜', priv: [0.75, 0.75, 1], pub: [1.5, 1.5, 2] },
    { id: 'lavabo_dentiste', nom: 'Lavabo de dentiste', dn: '⅜', priv: [null, null, null], pub: [1.5, 1.5, 2] },
    { id: 'lv_comm', nom: 'Lave-vaisselle, commercial', dn: null, priv: [null, null, null], pub: [null, null, null], fab: true, note: 'Note (5) : se reporter aux recommandations du fabricant.' },
    { id: 'lv_dom', nom: 'Lave-vaisselle, domestique', dn: '⅜', priv: [null, 1.4, 1.4], pub: [null, null, null] },
    { id: 'mal_3_5', nom: 'Machine à laver 3,5 kg', dn: '½', priv: [1, 1, 1.4], pub: [2.25, 2.25, 3] },
    { id: 'mal_6_8', nom: 'Machine à laver 6,8 kg', dn: '½', priv: [null, null, null], pub: [3, 3, 4] },
    { id: 'mal_comm', nom: 'Machine à laver, commerciale', dn: null, priv: [null, null, null], pub: [null, null, null], fab: true, note: 'Note (5) : se reporter aux recommandations du fabricant.' },
    { id: 'douche', nom: 'Pomme de douche, au plus 9,5 L/min', dn: '½', priv: [1, 1, 1.4], pub: [3, 3, 4] },
    { id: 'douche_plus', nom: 'Pomme de douche, plus de 9,5 L/min', dn: '½', priv: [1.5, 1.5, 2], pub: [3, 3, 4] },
    { id: 'rince_bassine', nom: 'Rince-bassine', dn: '1', priv: [null, null, null], pub: [7.5, 7.5, 10] },
    { id: 'ra_1_2', nom: "Robinet d'arrosage DN ½", dn: '½', priv: [2.5, null, 2.5], pub: [2.5, null, 2.5] },
    { id: 'ra_3_4', nom: "Robinet d'arrosage DN ¾", dn: '¾', priv: [3, null, 3], pub: [6, null, 6] },
    { id: 'ra_combine', nom: "Robinet d'arrosage, eau froide et chaude combinée", dn: '½', priv: [1.9, 1.9, 2.5], pub: [1.9, 1.9, 2.5] },
    { id: 'toilette_6l', nom: 'Toilette, au plus 6 L/c, à réservoir de chasse', dn: '⅜', priv: [2.2, null, 2.2], pub: [2.2, null, 2.2] },
    { id: 'toilette_plus_6l', nom: 'Toilette, plus de 6 L/c, à réservoir de chasse', dn: '⅜', priv: [3, null, 3], pub: [5, null, 5] },
    { id: 'unite_dentaire', nom: 'Unité dentaire', dn: '⅜', priv: [null, null, null], pub: [1, null, 1] },
    { id: 'urinoir_reservoir', nom: 'Urinoir, à réservoir de chasse', dn: '⅜', priv: [3, null, 3], pub: [3, null, 3] },
    { id: 'urinoir_rc_auto', nom: 'Urinoir, à robinet de chasse automatique', dn: '½', priv: [2, null, 2], pub: [4, null, 4] },
    // Tableau 2.6.3.2.-B — urinoirs à robinets de chasse (p. 2-65)
    { id: 'urinoir_rc_1_2', nom: 'Urinoir à robinet de chasse — alimentation DN ½', dn: '½', priv: [2, null, 2], pub: [4, null, 4], ref: 'Tableau 2.6.3.2.-B' },
    { id: 'urinoir_rc_3_4', nom: 'Urinoir à robinet de chasse — alimentation DN ¾', dn: '¾', priv: [null, null, null], pub: [5, null, 5], ref: 'Tableau 2.6.3.2.-B' },
    // Tableau 2.6.3.2.-C — toilettes à robinets de chasse (p. 2-65)
    { id: 'toilette_rc', nom: 'Toilette à robinet de chasse — alimentation DN 1', dn: '1', priv: [6, null, 6], pub: [10, null, 10], ref: 'Tableau 2.6.3.2.-C' },
  ];

  // Tableau 2.6.3.2.-D — appareils ne figurant pas au tableau 2.6.3.2.-A (p. 2-65).
  // Le code donne une seule « charge hydraulique » par usage (non ventilée froide/chaude).
  const T_2_6_3_2_D = [
    { dn: '⅜', priv: 1, pub: 2 },
    { dn: '½', priv: 2, pub: 4 },
    { dn: '¾', priv: 3, pub: 6 },
    { dn: '1', priv: 6, pub: 10 },
  ];

  // Tableau 2.6.3.4. — bâtiments d'un ou deux logements et maisons en rangée
  // avec branchement d'eau général distinct (p. 2-66). FA max selon la vitesse.
  const T_2_6_3_4_V = [3.0, 2.4, 1.5];
  const T_2_6_3_4 = [
    { dn: '½', fa: [8, 7, 4] },
    { dn: '¾', fa: [21, 16, 9] },
    { dn: '1', fa: [43, 31, 18] },
    { dn: '1¼', fa: [83, 57, 30] },
  ];

  // Tableau A-2.6.3.1. 2)-F — Méthode de la perte de pression moyenne (p. 2-151).
  // Note explicative (annexe A) — n'est pas une exigence ; solution reconnue.
  const T_A_F_V = [3.0, 2.4, 1.5, 1.2];
  const T_A_F = [
    { dn: '½', q: [0.46, 0.36, 0.23, 0.18], fa: [8, 7, 3.5, 2.5] },
    { dn: '⅝', q: [0.68, 0.54, 0.34, 0.27], fa: [13, 11, 6.5, 4.5] },
    { dn: '¾', q: [0.95, 0.77, 0.48, 0.38], fa: [21, 17, 9, 7.5] },
    { dn: '1', q: [1.62, 1.26, 0.81, 0.65], fa: [42, 30, 18, 14] },
    { dn: '1¼', q: [2.47, 1.8, 1.24, 0.99], fa: [83, 54, 29, 22] },
    { dn: '1½', q: [3.5, 2.8, 1.75, 1.4], fa: [146, 102, 46, 34] },
    { dn: '2', q: [6.08, 4.92, 3.04, 2.43], fa: [337, 265, 120, 81] },
    { dn: '2½', q: [9.39, 7.89, 4.69, 3.75], fa: [692, 500, 245, 170] },
    { dn: '3', q: [13.23, 10.73, 6.7, 5.36], fa: [1018, 750, 400, 295] },
    { dn: '4', q: [23.94, 18.9, 11.78, 9.42], fa: [2480, 1800, 850, 600] },
    { dn: '5', q: [37, 29, 18.35, 14.68], fa: [4400, 3350, 1625, 1125] },
    { dn: '6', q: [52.1, 42, 26.38, 21.11], fa: [6600, 4800, 2875, 2125] },
  ];

  // Tableau A-2.6.3.1. 2)-A — Méthode applicable aux petits bâtiments (p. 2-145).
  // Lignes : [DN branchement d'eau général, DN réseau de distribution, FA par longueur].
  // Les trames de vitesse (3,0 / 2,4 / 1,5 m/s) du tableau imprimé ne sont pas reproduites.
  const T_A_A_L = [12, 18, 24, 30, 46, 61, 76, 91, 122, 152, 183, 213, 244, 274, 305];
  const T_A_A = [
    {
      plage: '200 à 310 kPa', pmin: 200, pmax: 310,
      rows: [
        ['¾', '½', [6, 5, 4, 3, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]],
        ['¾', '⅝', [12, 10, 9, 7, 5, 3, 3, 3, 2, 2, 1, 1, 1, 1, 0]],
        ['¾', '¾', [18, 16, 14, 12, 9, 6, 5, 5, 4, 4, 3, 2, 2, 2, 1]],
        ['1', '1', [36, 31, 27, 25, 20, 17, 15, 13, 12, 10, 8, 6, 6, 6, 6]],
        ['1½', '1¼', [83, 68, 57, 48, 38, 32, 28, 25, 21, 18, 15, 12, 12, 11, 11]],
        ['1½', '1½', [151, 124, 105, 91, 70, 57, 49, 45, 36, 31, 26, 23, 21, 20, 20]],
        ['2', '1½', [151, 151, 132, 110, 80, 64, 53, 46, 38, 32, 27, 23, 21, 20, 20]],
        ['2', '2', [359, 329, 292, 265, 217, 185, 164, 147, 124, 96, 70, 61, 57, 54, 51]],
        ['2½', '2½', [445, 418, 390, 370, 330, 300, 280, 265, 240, 220, 198, 175, 158, 143, 133]],
      ],
    },
    {
      plage: '311 à 413 kPa', pmin: 311, pmax: 413,
      rows: [
        ['¾', '½', [8, 7, 6, 5, 4, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0]],
        ['¾', '⅝', [13, 13, 12, 11, 9, 7, 5, 5, 3, 3, 2, 2, 1, 1, 1]],
        ['¾', '¾', [21, 21, 19, 17, 14, 11, 9, 8, 6, 5, 4, 4, 3, 3, 3]],
        ['1', '1', [42, 42, 41, 36, 30, 25, 23, 20, 18, 15, 12, 10, 9, 8, 8]],
        ['1½', '1¼', [83, 83, 83, 83, 66, 52, 44, 39, 33, 29, 24, 20, 19, 17, 16]],
        ['1½', '1½', [151, 151, 151, 151, 128, 105, 90, 78, 62, 52, 42, 38, 35, 32, 30]],
        ['2', '1½', [151, 151, 151, 151, 150, 117, 98, 84, 67, 55, 42, 38, 35, 32, 30]],
        ['2', '2', [359, 359, 359, 359, 359, 318, 280, 250, 205, 165, 142, 123, 110, 102, 94]],
        ['2½', '2½', [611, 611, 610, 580, 535, 500, 470, 440, 400, 365, 335, 315, 285, 267, 250]],
      ],
    },
    {
      plage: 'plus de 413 kPa', pmin: 413.0001, pmax: Infinity,
      rows: [
        ['¾', '½', [8, 8, 7, 6, 5, 4, 3, 3, 2, 1, 1, 1, 1, 1, 0]],
        ['¾', '⅝', [13, 13, 13, 13, 11, 8, 7, 6, 5, 4, 3, 3, 3, 2, 2]],
        ['¾', '¾', [21, 21, 21, 21, 17, 13, 11, 10, 8, 7, 6, 6, 5, 4, 4]],
        ['1', '1', [42, 42, 42, 42, 38, 32, 29, 26, 22, 18, 14, 13, 12, 12, 11]],
        ['1½', '1¼', [83, 83, 83, 83, 83, 74, 62, 54, 43, 34, 26, 25, 23, 22, 21]],
        ['1½', '1½', [151, 151, 151, 151, 151, 151, 130, 113, 88, 73, 51, 51, 46, 43, 40]],
        ['2', '1½', [151, 151, 151, 151, 151, 151, 142, 122, 98, 82, 64, 51, 46, 43, 40]],
        ['2', '2', [359, 359, 359, 359, 359, 359, 359, 340, 288, 245, 204, 172, 153, 141, 129]],
        ['2½', '2½', [611, 611, 611, 611, 611, 611, 610, 570, 510, 460, 430, 404, 380, 356, 329]],
      ],
    },
  ];

  // Constantes de la note A-2.6.3.1. 2) (méthode de la perte de pression moyenne).
  const A_2_6_3_1 = {
    perteMinKPaParM: 2.6, // « au moins 2,6 kPa par mètre »
    facteurRaccords: 1.5, // longueur développée × 1,5 (raccords de DN intérieur ≥ DN du tuyau)
    petitBatiment: 'Usage du groupe A, D, E ou F div. 2 ou 3 (CNB 3.1.2.), hauteur ≤ 3 étages, superficie ≤ 600 m².',
  };

  // Autres exigences numériques citées par le moteur.
  const EXIGENCES = {
    pressionStatiqueMax: 550, // 2.6.3.3. 1) réducteur de pression au-delà de 550 kPa
    vitesseMax: 3.0, // 2.6.3.5. 1) jamais plus de 3,0 m/s
    dnMinBranchementEau: '¾', // 2.6.3.4. 1) et 4)
    simplifie: { pressionMin: 200, longueurMax: 90 }, // 2.6.3.4. 5) b) et c)
    penteMinPetitDN: 50, // 2.4.8.1. 1) DN ≤ 3 : pente ≥ 1:50
    penteConseilleeGrosDN: 100, // A-2.4.8.1. 1) pentes < 1:100 déconseillées (DN ≥ 4)
    etagesVentSecondaire: 4, // 2.5.4.2. 1) plus de 4 étages
    etagesVentChute: 11, // 2.5.4.3. 1) plus de 11 étages
    deviationColonne: 1.5, // 2.4.10.6. 2) déviation ≥ 1,5 m
    wcColonneDN4: 6, // 2.4.9.2. 3) colonne desservant plus de 6 toilettes : DN ≥ 4
  };

  // Combinaisons usuelles (aide à la saisie) : association d'une entrée du
  // tableau 2.4.9.3. et d'une entrée du tableau 2.6.3.2. Modifiables par appareil.
  const PRESETS = [
    { id: 'wc_res6', nom: 'Toilette à réservoir ≤ 6 L/c', dwv: 'toilette_reservoir', sup: 'toilette_6l' },
    { id: 'wc_res_plus', nom: 'Toilette à réservoir > 6 L/c', dwv: 'toilette_reservoir', sup: 'toilette_plus_6l' },
    { id: 'wc_rc', nom: 'Toilette à robinet de chasse', dwv: 'toilette_robinet', sup: 'toilette_rc' },
    { id: 'ur_rc', nom: 'Urinoir en applique (évac. simple), robinet de chasse DN ½', dwv: 'urinoir_applique_simple', sup: 'urinoir_rc_1_2' },
    { id: 'ur_auto', nom: 'Urinoir en applique (évac. simple), robinet de chasse automatique', dwv: 'urinoir_applique_simple', sup: 'urinoir_rc_auto' },
    { id: 'ur_res', nom: 'Urinoir en applique (évac. simple), réservoir de chasse', dwv: 'urinoir_applique_simple', sup: 'urinoir_reservoir' },
    { id: 'lav', nom: 'Lavabo ≤ 8,3 L/min, siphon DN 1¼', dwv: 'lavabo_dom_1_25', sup: 'lavabo' },
    { id: 'lav15', nom: 'Lavabo ≤ 8,3 L/min, siphon DN 1½', dwv: 'lavabo_dom_1_5', sup: 'lavabo' },
    { id: 'ec', nom: 'Évier de cuisine domestique 8,3 L/min', dwv: 'evier_petit', sup: 'evier_cuisine_dom' },
    { id: 'ec_comm', nom: 'Évier de cuisine commercial (par robinet), siphon DN 2', dwv: 'evier_autre_2', sup: 'evier_cuisine_comm' },
    { id: 'es', nom: 'Évier de service, siphon DN 3', dwv: 'evier_autre_3', sup: 'evier_service' },
    { id: 'dou', nom: 'Douche ≤ 9,5 L/min', dwv: 'avaloir_douche_a', sup: 'douche' },
    { id: 'bain', nom: 'Baignoire', dwv: 'baignoire', sup: 'baignoire' },
    { id: 'fb', nom: "Fontaine d'eau potable", dwv: 'fontaine', sup: 'fontaine' },
    { id: 'lv_relie', nom: 'Lave-vaisselle domestique (relié à l’évier)', dwv: 'lv_dom_relie', sup: 'lv_dom' },
    { id: 'lv', nom: 'Lave-vaisselle domestique (non relié)', dwv: 'lv_dom', sup: 'lv_dom' },
    { id: 'mal', nom: 'Machine à laver domestique 3,5 kg', dwv: 'mal_dom', sup: 'mal_3_5' },
    { id: 'as3', nom: 'Avaloir de sol, siphon DN 3', dwv: 'avaloir_sol_3', sup: null },
    { id: 'as2', nom: 'Avaloir de sol, siphon DN 2', dwv: 'avaloir_sol_2', sup: null },
    { id: 'ra', nom: "Robinet d'arrosage DN ½", dwv: null, sup: 'ra_1_2' },
  ];

  const DATA = {
    EDITION, NL, NP, DN, T_2_4_9_3, FE_PAR_LS, T_2_4_10_6_A, T_2_4_10_6_B, PENTES_C, T_2_4_10_6_C,
    T_2_5_7_1, T_2_5_8_1_A, T_2_5_8_1_B, T_2_5_8_3_DN, T_2_5_8_3, T_2_5_8_4_DN, T_2_5_8_4,
    T_2_6_3_2_A, T_2_6_3_2_D, T_2_6_3_4_V, T_2_6_3_4, T_A_F_V, T_A_F, T_A_A_L, T_A_A, A_2_6_3_1,
    EXIGENCES, PRESETS,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.CNP_DATA = DATA;
})(typeof globalThis !== 'undefined' ? globalThis : this);
