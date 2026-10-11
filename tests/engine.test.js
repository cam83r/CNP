// Tests de validation — exécuter : node --test tests/
// Chaque cas renvoie à docs/VALIDATION.md.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../app/js/engine.js');
const exemple = require('../app/js/exemple.js');

function local(id, etageId, apps, usage = 'pub') {
  return { id, nom: id, etageId, usage, appareils: apps.map(([dwv, qte, sup]) => ({ dwv, qte, sup })) };
}

// ---------------------------------------------------------------------------
// V-B1 — Note A-2.4.10., exemple 2 (immeuble à bureaux de 5 étages)
// ---------------------------------------------------------------------------
test('V-B1 colonne de chute, branchement de sous-sol et collecteur (A-2.4.10. ex. 2)', () => {
  const etageType = e => local('T' + e, 'E' + e, [
    ['toilette_robinet', 5], ['urinoir_applique_simple', 2], ['lavabo_dom_1_5', 4],
    ['avaloir_sol_3', 2], ['evier_autre_3', 1], ['fontaine', 1],
  ]);
  const p = {
    locaux: [1, 2, 3, 4, 5].map(etageType).concat([
      local('SS', 'E0', [['toilette_robinet', 1], ['lavabo_dom_1_25', 1], ['avaloir_sol_3', 2], ['evier_autre_3', 1]]),
    ]),
    reseauxEvac: [
      { id: 'CC', type: 'colonne', locaux: ['T1', 'T2', 'T3', 'T4', 'T5'] },
      { id: 'BSS', type: 'branchement', locaux: ['SS'], debitContinu: 0.23, pente: 50 },
      { id: 'COL50', type: 'collecteur', amont: ['CC', 'BSS'], pente: 50 },
      { id: 'COL25', type: 'collecteur', amont: ['CC', 'BSS'], pente: 25 },
    ],
  };
  const [cc, bss, col50, col25] = p.reseauxEvac.map(n => E.calcDwv(n, p));
  // Étage type : 30 + 3 + 6 + 6 + 3 + 0,5 = 48,5 FE (l'exemple du code compte la fontaine à 1 → 49)
  assert.equal(cc.feEtageMax, 48.5);
  assert.equal(cc.fe, 242.5);
  assert.equal(cc.dn, '4'); // code : DN 4
  // Sous-sol : 6 + 1 + 6 + 3 + 0,23 × 31,7 = 23,29 FE → DN 3 (code : 23 FE, DN 3)
  assert.equal(bss.fe, 23.29);
  assert.equal(bss.dn, '3');
  // Collecteur : 265,79 FE ; DN 4 insuffisant à 1:50 (240), suffisant à 1:25 (300)
  assert.equal(col50.fe, 265.79);
  assert.equal(col50.dn, '5');
  assert.equal(col25.dn, '4');
});

test('V-B2 limites du tableau 2.4.10.6.-A et charge par étage', () => {
  assert.equal(E.sizeStack(102, 18).dn, '3');
  assert.equal(E.sizeStack(103, 18).dn, '4');
  assert.equal(E.sizeStack(50, 19).dn, '4'); // 19 FE à un étage > 18 → DN 4
  assert.equal(E.sizeStack(50001, 0), null);
  assert.equal(E.sizeBranch(27).dn, '3');
  assert.equal(E.sizeBranch(28).dn, '4');
  assert.equal(E.sizeBranch(3901), null);
});

test('V-B3 pente : colonne prudente du tableau 2.4.10.6.-C', () => {
  assert.equal(E.penteColonneC(50), 4);
  assert.equal(E.penteColonneC(32), 4); // 1:32 → colonne 1:50
  assert.equal(E.penteColonneC(25), 5);
  assert.equal(E.penteColonneC(20), 5);
  assert.equal(E.penteColonneC(500), -1);
  assert.equal(E.sizeDrain(268, 25).row.dn, '4');
});

test('V-B4 pente minimale 2.4.8.1. et toilettes 2.4.9.2.', () => {
  const p = {
    locaux: [local('L', 'E1', [['toilette_reservoir', 3]])],
    reseauxEvac: [{ id: 'B', type: 'branchement', locaux: ['L'], pente: 100 }],
  };
  const r = E.calcDwv(p.reseauxEvac[0], p);
  assert.equal(r.fe, 12);
  assert.equal(r.dn, '4'); // en aval de la 3e toilette
  const p2 = { locaux: [local('L', 'E1', [['lavabo_dom_1_25', 2]])], reseauxEvac: [{ id: 'B', type: 'branchement', locaux: ['L'], pente: 100 }] };
  const r2 = E.calcDwv(p2.reseauxEvac[0], p2);
  assert.equal(r2.dn, '1¼'); // 2 FE → tabl. 2.4.10.6.-B DN 1¼
  assert.ok(r2.alertes.some(a => a.ref === '2.4.8.1. 1)' && a.niveau === 'erreur'));
});

// ---------------------------------------------------------------------------
// V-C — ventilation
// ---------------------------------------------------------------------------
test('V-C1 colonne de ventilation (tableau 2.5.8.4.)', () => {
  assert.equal(E.ventColonne('4', 245, 30).dn, '3'); // ligne 320 FE : DN 3 → 52 m
  assert.equal(E.ventColonne('4', 245, 60).dn, '4'); // DN 3 → 52 m < 60
  assert.equal(E.ventColonne('3', 102, 5).dn, '1½'); // ligne 102 : 1½ → 7,5 m ; moitié de 3 = 1½
  assert.equal(E.ventColonne('6', 100, 5).dn, '3'); // moitié de 6 = 3
});

test('V-C2 ventilation interne et branchements de ventilation', () => {
  const p = { locaux: [] };
  assert.equal(E.calcVent({ type: 'interne_etage', fe: 18 }, p).dn, '3');
  assert.equal(E.calcVent({ type: 'interne', fe: 8, wc: 2 }, p).dn, '3');
  assert.equal(E.calcVent({ type: 'interne', fe: 8, wc: 0 }, p).dn, '3');
  assert.equal(E.calcVent({ type: 'interne', fe: 4, wc: 0 }, p).dn, '2');
  assert.equal(E.calcVent({ type: 'interne', fe: 4, wc: 3 }, p).dn, null);
  assert.equal(E.calcVent({ type: 'branchement', fe: 17, longueur: 9 }, p).dn, '1½');
  assert.equal(E.calcVent({ type: 'branchement', fe: 100, longueur: 80 }, p).dn, '4');
  assert.equal(E.calcVent({ type: 'individuelle', dnSiphon: '3' }, p).dn, '1½');
});

// ---------------------------------------------------------------------------
// V-D — alimentation : exemples de la note A-2.6.3.1. 2) et A-2.6.3.4. 5)
// ---------------------------------------------------------------------------
test('V-D1 perte de pression moyenne : tableaux A-2.6.3.1. 2)-G, -H, -I', () => {
  assert.equal(E.sizeF(210.8, 2.4).dn, '2'); // branchement (tabl. G)
  const H = [[8, '¾'], [11, '1'], [15, '1'], [6, '⅝'], [21, '1¼']];
  H.forEach(([fa, dn]) => assert.equal(E.sizeF(fa, 1.5).dn, dn, `eau chaude ${fa}`));
  const I = [[11, '⅝'], [21, '1'], [29.8, '1'], [20, '1'], [49.8, '1¼'], [69.8, '1½'], [89.8, '1½'], [109.8, '2'], [60, '1½'], [169.8, '2'], [189.8, '2'], [210.8, '2']];
  I.forEach(([fa, dn]) => assert.equal(E.sizeF(fa, 2.4).dn, dn, `eau froide ${fa}`));
});

test('V-D2 petits bâtiments : tableaux A-2.6.3.1. 2)-B, -C, -D', () => {
  assert.equal(E.sizeA(210.8, 565, 30, 'branchement').dn, '2'); // tabl. B
  const C = [[8, '¾'], [11, '¾'], [15, '1'], [6, '⅝'], [21, '1']];
  C.forEach(([fa, dn]) => assert.equal(E.sizeA(fa, 540, 76, 'distribution').dn, dn, `eau chaude ${fa}`));
  const Dt = [[11, '¾'], [21, '1'], [29.8, '1¼'], [20, '1'], [49.8, '1¼'], [69.8, '1½'], [89.8, '1½'], [109.8, '1½'], [60, '1¼'], [169.8, '2'], [189.8, '2'], [210.8, '2']];
  Dt.forEach(([fa, dn]) => assert.equal(E.sizeA(fa, 540, 76, 'distribution').dn, dn, `eau froide ${fa}`));
  assert.ok(E.sizeA(10, 150, 30).err);
});

test('V-D3 méthode simplifiée : tableaux A-2.6.3.4. 5)-B, -C, -D', () => {
  const vit = [3.0, 2.4, 1.5];
  const B = [[23.8, ['1', '1', '1¼']]];
  const C = [[3.5, ['½', '½', '½']], [6.3, ['½', '½', '¾']], [8.4, ['¾', '¾', '¾']], [2.1, ['½', '½', '½']], [14.7, ['¾', '¾', '1']]];
  const Dd = [[2.8, ['½', '½', '½']], [5.7, ['½', '½', '¾']], [11.4, ['¾', '¾', '1']], [14.7, ['¾', '¾', '1']], [19.1, ['¾', '1', '1¼']], [21.3, ['1', '1', '1¼']], [23.8, ['1', '1', '1¼']], [3.6, ['½', '½', '½']]];
  [...B, ...C, ...Dd].forEach(([fa, dns]) => vit.forEach((v, i) => assert.equal(E.size2634(fa, v).dn, dns[i], `${fa} FA à ${v} m/s`)));
});

test('V-D4 bilan de pression (figure A-2.6.3.1. 2)-B)', () => {
  const r = E.pressionBilan({ pressionLimite: 565, pertesBranchement: 25, pertesDispositifs: 20, denivele: 35 / E.RHO_G, pressionMinAppareil: 105, longueurDistribution: 76 });
  assert.equal(r.pAdj, 540);
  assert.equal(r.disponible, 380);
  assert.equal(r.Leq, 114);
  assert.equal(r.parM, 3.33);
  assert.equal(r.ok, true);
});

test('V-D5 facteurs d’alimentation — sommaire tableau A-2.6.3.4. 5)-A (23,8 FA)', () => {
  const L = { id: 'X', usage: 'priv', appareils: [
    { sup: 'baignoire', qte: 2 }, { sup: 'douche', qte: 1 }, { sup: 'evier_cuisine_dom', qte: 2 }, { sup: 'lavabo', qte: 3 },
    { sup: 'lv_dom', qte: 2 }, { sup: 'mal_3_5', qte: 2 }, { sup: 'ra_1_2', qte: 1 }, { sup: 'toilette_6l', qte: 3 },
  ] };
  assert.equal(E.localTotals(L).fa.t, 23.8);
});

// ---------------------------------------------------------------------------
// V-EX — jeu d'exemple (bureaux 2 étages)
// ---------------------------------------------------------------------------
test('V-EX jeu d’exemple : résultats attendus documentés', () => {
  const p = exemple();
  const R = E.calcProject(p);
  const ev = Object.fromEntries(R.evac.map(r => [r.net.id, r]));
  assert.equal(ev.CC1.fe, 67); assert.equal(ev.CC1.feEtageMax, 33.5); assert.equal(ev.CC1.dn, '4');
  assert.equal(ev.CC1.vent.dn, '3');
  assert.equal(ev.B1.fe, 16); assert.equal(ev.B1.dn, '3');
  assert.equal(ev.B2.fe, 17); assert.equal(ev.B2.dn, '4');
  assert.equal(ev.B3.fe, 4.5); assert.equal(ev.B3.dn, '2');
  assert.equal(ev.C1.fe, 71.5); assert.equal(ev.C1.dn, '4');
  const al = Object.fromEntries(R.alim.map(r => [r.tr.id, r]));
  assert.equal(al.A1.fa.t, 58.9); assert.equal(al.A1.dn, '1½');
  assert.equal(al.A2.fa.t, 31.65); assert.equal(al.A2.dn, '1¼');
  assert.equal(al.A3.fa.t, 27.25); assert.equal(al.A3.dn, '1');
  assert.equal(al.A1.debit, 1.9);
  assert.equal(R.pression.parM, 3.06);
  const ve = Object.fromEntries(R.vent.map(r => [r.v.id, r]));
  assert.equal(ve.V1.dn, '3'); assert.equal(ve.V2.dn, '1½'); assert.equal(ve.V3.dn, '1½');
});

// ---------------------------------------------------------------------------
// V-E — appareils sanitaires minimaux (CNB 2020 modifié Québec, 3.7.2.)
// ---------------------------------------------------------------------------
test('V-E1 établissements d’affaires (tableau 3.7.2.2.-B) et nombre de personnes (3.1.17.1.)', () => {
  const r = E.calcMinimaux({ usage: 'affaires', zones: [{ usageId: 'a_bureaux', surface: 465 }] });
  assert.equal(r.total, 50); assert.equal(r.H, 25); assert.equal(r.wcH, 1); assert.equal(r.wcF, 1);
  const r2 = E.calcMinimaux({ usage: 'affaires', populationMode: 'total', personnes: 160 });
  assert.equal(r2.H, 80); assert.equal(r2.wcH, 4); assert.equal(r2.wcF, 4); // 3 + 1 groupe entamé de 50
  assert.equal(r2.lavF, 2); assert.equal(r2.asF, true);
  const r3 = E.calcMinimaux({ usage: 'affaires', populationMode: 'total', personnes: 101 });
  assert.equal(r3.H, 51); assert.equal(r3.wcH, 4);
});

test('V-E2 établissements de réunion (tableau 3.7.2.2.-A) et urinoirs (3.7.2.2. 3))', () => {
  const r = E.calcMinimaux({ usage: 'reunion', populationMode: 'sexes', hommes: 500, femmes: 500, urinoirs: 9 });
  assert.equal(r.wcH + r.urH, 8); // 7 + 1 groupe de 200
  assert.equal(r.urH, 5); // max 2/3 de 8 → 5
  assert.equal(r.wcF, 14); // 13 + 1 groupe de 100
  const r2 = E.calcMinimaux({ usage: 'reunion', populationMode: 'sexes', hommes: 60, femmes: 60, urinoirs: 1 });
  assert.equal(r2.wcH, 1); assert.equal(r2.urH, 1); assert.equal(r2.wcF, 3); // 2 exigées → 1 urinoir
});

test('V-E3 industriels (tableau 3.7.2.2.-C), commerciaux (11)) et exception 3.7.2.2. 2)', () => {
  assert.equal(E.calcMinimaux({ usage: 'industriel', populationMode: 'sexes', hommes: 131, femmes: 100 }).wcH, 8);
  assert.equal(E.calcMinimaux({ usage: 'industriel', populationMode: 'sexes', hommes: 131, femmes: 100 }).wcF, 5);
  const c = E.calcMinimaux({ usage: 'commercial', populationMode: 'sexes', hommes: 301, femmes: 151 });
  assert.equal(c.wcH, 2); assert.equal(c.wcF, 2);
  const u = E.calcMinimaux({ usage: 'restaurant', populationMode: 'total', personnes: 25 });
  assert.equal(u.unisexe, true); assert.equal(u.wcU, 1);
  assert.equal(E.calcMinimaux({ usage: 'restaurant', populationMode: 'total', personnes: 26 }).unisexe, false);
  assert.equal(E.calcMinimaux({ usage: 'commercial', populationMode: 'total', personnes: 80, surfaceE: 240 }).unisexe, true);
});

test('V-E4 jeu d’exemple : bureaux 2 × 900 m²', () => {
  const r = E.calcMinimaux(exemple().minimaux);
  assert.equal(r.total, 194); // 1800 / 9,3 = 193,5 → 194
  assert.equal(r.H, 97); assert.equal(r.wcH + r.urH, 4); assert.equal(r.urH, 2); assert.equal(r.wcF, 4);
  assert.equal(r.lavH, 2); assert.equal(r.lavF, 2);
});
