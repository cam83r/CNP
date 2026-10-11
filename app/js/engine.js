/*
 * Moteur de calcul — prédimensionnement plomberie selon CCQ ch. III / CNP 2020 (modifié).
 * Fonctions pures : aucune dépendance au DOM. Utilisable dans le navigateur
 * (window.CNP_ENGINE) et dans Node (require) pour les tests.
 */
(function (root) {
  'use strict';

  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.CNP_DATA;

  const RHO_G = 9.81; // kPa par mètre de colonne d'eau (physique, hors code)

  // ---------------------------------------------------------------------------
  // Outils DN
  // ---------------------------------------------------------------------------
  const DN_IDX = {};
  D.DN.forEach((d, i) => { DN_IDX[d.dn] = d; });

  function dnVal(dn) { return dn && DN_IDX[dn] ? DN_IDX[dn].v : null; }
  function dnMm(dn) { return dn && DN_IDX[dn] ? DN_IDX[dn].mm : null; }
  function dnLabel(dn) {
    if (!dn) return '—';
    const mm = dnMm(dn);
    return mm ? `DN ${dn} (${mm} mm)` : `DN ${dn}`;
  }
  function dnMax(a, b) {
    if (!a) return b;
    if (!b) return a;
    return dnVal(a) >= dnVal(b) ? a : b;
  }
  /** Plus petit DN d'une liste ordonnée dont la valeur est ≥ v. */
  function dnAtLeast(list, v) {
    for (const dn of list) if (dnVal(dn) >= v - 1e-9) return dn;
    return null;
  }

  function round(x, n = 2) { const p = Math.pow(10, n); return Math.round(x * p) / p; }
  /** Nombre au format français pour les messages (virgule décimale). */
  function n(x) { return typeof x === 'number' && Number.isFinite(x) ? String(round(x, 3)).replace('.', ',') : String(x); }

  // ---------------------------------------------------------------------------
  // Module A — appareils et charges
  // ---------------------------------------------------------------------------
  const DWV = {}; D.T_2_4_9_3.forEach(f => { DWV[f.id] = f; });
  const SUP = {}; D.T_2_6_3_2_A.forEach(f => { SUP[f.id] = f; });
  const PRESET = {}; D.PRESETS.forEach(p => { PRESET[p.id] = p; });

  function refDwv(f) { return f.ref || 'Tableau 2.4.9.3.'; }
  function refSup(f) { return f.ref || 'Tableau 2.6.3.2.-A'; }

  /**
   * Facteurs d'alimentation d'un appareil pour un usage donné.
   * sup peut être :
   *   - un id du tableau 2.6.3.2.-A/B/C
   *   - 'D:<dn>' : appareil non listé (tableau 2.6.3.2.-D), avec app.eauD = 'fc' | 'f' | 'c'
   *   - 'MAN'    : valeurs saisies (fabricant) dans app.faManuel = {f, c, t}
   * Retourne { f, c, t, dn, ref, so (true si s/o pour cet usage), nom }.
   */
  function supplyFactors(app, usage) {
    const u = usage === 'pub' ? 'pub' : 'priv';
    const sid = app.sup;
    if (!sid) return null;
    if (sid === 'MAN' || (SUP[sid] && SUP[sid].fab)) {
      const m = app.faManuel || {};
      const f = +m.f || 0, c = +m.c || 0, t = +m.t || 0;
      return { f, c, t, dn: m.dn || null, ref: 'Recommandations du fabricant (tableau 2.6.3.2.-A, note 5)', so: false, manuel: true, nom: SUP[sid] ? SUP[sid].nom : 'Valeurs du fabricant' };
    }
    if (sid.startsWith('D:')) {
      const dn = sid.slice(2);
      const row = D.T_2_6_3_2_D.find(r => r.dn === dn);
      if (!row) return null;
      const v = row[u];
      const eau = app.eauD || 'fc';
      return { f: eau.includes('f') ? v : 0, c: eau.includes('c') ? v : 0, t: v, dn, ref: 'Tableau 2.6.3.2.-D', so: false, nom: `Appareil non listé, alimentation DN ${dn}` };
    }
    const fx = SUP[sid];
    if (!fx) return null;
    const v = fx[u];
    const so = v[2] === null;
    return { f: v[0] || 0, c: v[1] || 0, t: v[2] || 0, dn: fx.dn, ref: refSup(fx), so, nom: fx.nom };
  }

  function appUsage(app, local) { return app.usage || (local && local.usage) || 'priv'; }

  /** Totaux d'un local. */
  function localTotals(local) {
    const r = { fe: 0, wc: 0, maxTub: null, fa: { f: 0, c: 0, t: 0 }, maxSupDn: null, alertes: [], lignes: [] };
    (local.appareils || []).forEach(app => {
      const q = Math.max(0, +app.qte || 0);
      const usage = appUsage(app, local);
      const ligne = { app, q, usage, fe: null, fa: null };
      if (app.dwv) {
        const f = DWV[app.dwv];
        if (f) {
          ligne.fe = f.fe; ligne.feRef = refDwv(f);
          r.fe += q * f.fe;
          if (f.wc) r.wc += q;
          if (f.tub && q > 0) r.maxTub = dnMax(r.maxTub, f.tub);
        }
      }
      if (app.sup) {
        const s = supplyFactors(app, usage);
        if (s) {
          ligne.fa = s;
          r.fa.f += q * s.f; r.fa.c += q * s.c; r.fa.t += q * s.t;
          if (s.dn && q > 0) r.maxSupDn = dnMax(r.maxSupDn, s.dn);
          if (s.so && q > 0) r.alertes.push({ niveau: 'erreur', ref: s.ref, msg: `${local.nom} : « ${s.nom} » est s/o pour l'usage ${usage === 'pub' ? 'public' : 'privé'} — aucune valeur dans le tableau.` });
          if (s.manuel && q > 0 && !(s.t > 0)) r.alertes.push({ niveau: 'avert', ref: s.ref, msg: `${local.nom} : « ${s.nom} » — saisir les facteurs d'alimentation du fabricant.` });
        }
      }
      r.lignes.push(ligne);
    });
    r.fe = round(r.fe, 3);
    r.fa = { f: round(r.fa.f, 3), c: round(r.fa.c, 3), t: round(r.fa.t, 3) };
    return r;
  }

  // ---------------------------------------------------------------------------
  // Agrégation des réseaux (locaux + réseaux amont, sans double compte)
  // ---------------------------------------------------------------------------
  function collect(net, nets, seen = new Set(), path = new Set()) {
    const out = { locaux: new Set(), continu: 0, cycle: false };
    if (path.has(net.id)) { out.cycle = true; return out; }
    if (seen.has(net.id)) return out;
    seen.add(net.id); path.add(net.id);
    (net.locaux || []).forEach(id => out.locaux.add(id));
    out.continu += Math.max(0, +net.debitContinu || 0);
    (net.amont || []).forEach(aid => {
      const a = nets.find(n => n.id === aid);
      if (!a) return;
      const sub = collect(a, nets, seen, path);
      sub.locaux.forEach(id => out.locaux.add(id));
      out.continu += sub.continu;
      if (sub.cycle) out.cycle = true;
    });
    path.delete(net.id);
    return out;
  }

  // ---------------------------------------------------------------------------
  // Module B — évacuation
  // ---------------------------------------------------------------------------

  /** Colonne de la table 2.4.10.6.-C applicable à une pente 1:x (prudente). */
  function penteColonneC(denom) {
    if (!(denom > 0)) return -1;
    // Colonne la plus plate dont la pente est ≥ à la pente de calcul :
    // plus petit dénominateur de table qui est ≥ au dénominateur réel ;
    // au-delà de 1:25 (plus raide), on retient 1:25.
    let idx = -1;
    for (let i = 0; i < D.PENTES_C.length; i++) if (D.PENTES_C[i] >= denom - 1e-9) idx = i;
    return idx;
  }

  function sizeStack(fe, feEtageMax) {
    for (const r of D.T_2_4_10_6_A) if (r.max >= fe - 1e-9 && r.parEtage >= feEtageMax - 1e-9) return r;
    return null;
  }
  function sizeBranch(fe) {
    for (const r of D.T_2_4_10_6_B) if (r.max >= fe - 1e-9) return r;
    return null;
  }
  function sizeDrain(fe, denom) {
    const ci = penteColonneC(denom);
    if (ci < 0) return { row: null, col: -1 };
    for (const r of D.T_2_4_10_6_C) { const m = r.max[ci]; if (m !== null && m >= fe - 1e-9) return { row: r, col: ci, max: m }; }
    return { row: null, col: ci };
  }

  /**
   * Calcule un réseau d'évacuation.
   * net = { id, nom, type: 'colonne'|'branchement'|'collecteur', locaux[], amont[], debitContinu (L/s),
   *         pente (dénominateur 1:x), deviation (bool, colonne), egoutPublic (bool, collecteur),
   *         ventLongueur (m, colonne) }
   */
  function calcDwv(net, project) {
    const nets = project.reseauxEvac || [];
    const coll = collect(net, nets);
    const alertes = [];
    const contraintes = [];
    if (coll.cycle) alertes.push({ niveau: 'erreur', msg: 'Boucle détectée dans les réseaux amont.', ref: '—' });

    let feApp = 0, wc = 0, maxTub = null;
    const feEtage = {};
    const etages = new Set();
    coll.locaux.forEach(lid => {
      const loc = (project.locaux || []).find(l => l.id === lid);
      if (!loc) return;
      const t = localTotals(loc);
      feApp += t.fe; wc += t.wc; maxTub = dnMax(maxTub, t.maxTub);
      if (t.fe > 0) { feEtage[loc.etageId] = (feEtage[loc.etageId] || 0) + t.fe; etages.add(loc.etageId); }
    });
    const feCont = coll.continu * D.FE_PAR_LS;
    const fe = round(feApp + feCont, 2);
    const feEtageMax = Object.values(feEtage).reduce((a, b) => Math.max(a, b), 0);
    const res = { net, fe, feApp: round(feApp, 2), feCont: round(feCont, 2), wc, maxTub, feEtage, feEtageMax: round(feEtageMax, 2), nbEtages: etages.size, contraintes, alertes, dn: null, hydro: null };
    if (feCont > 0) contraintes.push({ dn: null, ref: '2.4.10.3. 1)', raison: `Écoulement continu ${n(round(coll.continu, 3))} L/s × 31,7 = ${n(round(feCont, 2))} FE` });

    // Dimensionnement hydraulique
    if (net.type === 'colonne') {
      const r = sizeStack(fe, feEtageMax);
      if (r) { res.hydro = r.dn; contraintes.push({ dn: r.dn, ref: 'Tableau 2.4.10.6.-A', raison: `${n(fe)} FE ≤ ${n(r.max)} FE ; max. par étage ${n(round(feEtageMax, 2))} ≤ ${n(r.parEtage)}` }); }
      else alertes.push({ niveau: 'erreur', ref: 'Tableau 2.4.10.6.-A', msg: `Charge ${n(fe)} FE (ou ${n(round(feEtageMax, 2))} FE par étage) hors tableau — dédoubler la colonne.` });
      if (net.deviation) {
        const b = sizeBranch(fe);
        if (b) contraintes.push({ dn: b.dn, ref: '2.4.10.6. 2) / Tableau 2.4.10.6.-B', raison: `Déviation ≥ 1,5 m : ${n(fe)} FE ≤ ${n(b.max)} FE` });
        else alertes.push({ niveau: 'erreur', ref: '2.4.10.6. 2)', msg: 'Déviation : charge hors tableau 2.4.10.6.-B.' });
        if (net.pente > 0) {
          const c = sizeDrain(fe, net.pente);
          if (c.row) contraintes.push({ dn: c.row.dn, ref: '2.4.10.6. 2) / Tableau 2.4.10.6.-C', raison: `Déviation à 1:${n(D.PENTES_C[c.col])} : ${n(fe)} FE ≤ ${n(c.max)} FE` });
          else alertes.push({ niveau: 'erreur', ref: '2.4.10.6. 2)', msg: 'Déviation : charge ou pente hors tableau 2.4.10.6.-C.' });
        }
      }
    } else if (net.type === 'branchement') {
      const r = sizeBranch(fe);
      if (r) { res.hydro = r.dn; contraintes.push({ dn: r.dn, ref: 'Tableau 2.4.10.6.-B', raison: `${n(fe)} FE ≤ ${n(r.max)} FE` }); }
      else alertes.push({ niveau: 'erreur', ref: 'Tableau 2.4.10.6.-B', msg: `Charge ${n(fe)} FE hors tableau — dédoubler le branchement.` });
    } else if (net.type === 'collecteur') {
      const c = sizeDrain(fe, net.pente);
      if (c.col < 0) alertes.push({ niveau: 'erreur', ref: 'Tableau 2.4.10.6.-C', msg: `Pente 1:${net.pente || '?'} plus faible que 1:400 ou non saisie — hors tableau.` });
      else if (c.row) {
        res.hydro = c.row.dn;
        const p = D.PENTES_C[c.col];
        contraintes.push({ dn: c.row.dn, ref: 'Tableau 2.4.10.6.-C', raison: `${n(fe)} FE ≤ ${n(c.max)} FE à 1:${n(p)}${p !== +net.pente ? ` (colonne prudente pour 1:${n(net.pente)})` : ''}` });
      } else alertes.push({ niveau: 'erreur', ref: 'Tableau 2.4.10.6.-C', msg: `Charge ${n(fe)} FE hors tableau à cette pente.` });
    }

    // Diamètres minimaux (sous-section 2.4.9.)
    if (maxTub) contraintes.push({ dn: maxTub, ref: '2.4.9.1. 1) b)', raison: `Plus grosse tubulure de sortie raccordée (tabl. 2.4.9.3.)` });
    if (wc >= 1) contraintes.push({ dn: '3', ref: '2.4.9.2. 1)', raison: `Dessert ${wc} toilette(s) : DN ≥ 3` });
    if (net.type === 'colonne' && wc > D.EXIGENCES.wcColonneDN4) contraintes.push({ dn: '4', ref: '2.4.9.2. 3)', raison: `Colonne desservant ${wc} toilettes (> 6) : DN ≥ 4` });
    if (net.type !== 'colonne' && wc >= 3) contraintes.push({ dn: '4', ref: '2.4.9.2. 2)', raison: `En aval d'une 3e toilette (${wc}) : DN ≥ 4` });
    if (net.type === 'collecteur' && net.egoutPublic) contraintes.push({ dn: '4', ref: '2.4.9.4. 1)', raison: 'Raccordé au réseau d’égouts public : DN ≥ 4' });

    let dn = null;
    contraintes.forEach(c => { if (c.dn) dn = dnMax(dn, c.dn); });
    res.dn = res.hydro ? dn : null;
    if (!res.hydro && fe > 0 && !alertes.some(a => a.niveau === 'erreur')) alertes.push({ niveau: 'erreur', ref: '—', msg: 'Aucun diamètre hydraulique déterminé.' });
    if (fe === 0) alertes.push({ niveau: 'info', ref: '2.4.10.1.', msg: 'Aucune charge raccordée.' });

    // Pentes (2.4.8.1.)
    if (net.type === 'branchement' || net.type === 'collecteur' || (net.type === 'colonne' && net.deviation)) {
      const p = +net.pente;
      if (!(p > 0)) alertes.push({ niveau: 'avert', ref: '2.4.8.1.', msg: 'Pente non saisie.' });
      else if (res.dn && dnVal(res.dn) <= 3 && p > D.EXIGENCES.penteMinPetitDN) alertes.push({ niveau: 'erreur', ref: '2.4.8.1. 1)', msg: `DN ${res.dn} : pente 1:${n(p)} insuffisante — minimum 1:50 pour DN ≤ 3.` });
      else if (res.dn && dnVal(res.dn) >= 4 && p > D.EXIGENCES.penteConseilleeGrosDN) alertes.push({ niveau: 'avert', ref: 'A-2.4.8.1. 1)', msg: `Pente 1:${n(p)} < 1:100 : permise pour DN ≥ 4 mais déconseillée (note A-2.4.8.1. 1)).` });
    }

    // Ventilation de la colonne (2.5.4. / 2.5.8.4.)
    if (net.type === 'colonne') {
      if (res.nbEtages > D.EXIGENCES.etagesVentSecondaire) alertes.push({ niveau: 'avert', ref: '2.5.4.2. 1)', msg: `Appareils sur ${res.nbEtages} étages (> 4) : colonne de ventilation secondaire requise (sauf si la colonne sert de ventilation interne).` });
      if (res.nbEtages > D.EXIGENCES.etagesVentChute) alertes.push({ niveau: 'avert', ref: '2.5.4.3. 1)', msg: `Appareils sur ${res.nbEtages} étages (> 11) : tuyaux de ventilation de chute requis (par groupe de 5 étages et aux déviations).` });
      if (res.dn) res.vent = ventColonne(res.dn, fe, net.ventLongueur);
    }
    return res;
  }

  // ---------------------------------------------------------------------------
  // Module C — ventilation
  // ---------------------------------------------------------------------------

  /** Colonne de ventilation primaire/secondaire — tableau 2.5.8.4. et 2.5.8.4. 3). */
  function ventColonne(dnChute, fe, longueur) {
    const out = { dn: null, ref: 'Tableau 2.5.8.4.', alertes: [], details: [] };
    const rows = D.T_2_5_8_4.filter(r => r.chute === dnChute);
    const demi = dnVal(dnChute) / 2;
    const dnDemi = dnAtLeast(D.T_2_5_8_4_DN, demi);
    out.details.push({ dn: dnDemi, ref: '2.5.8.4. 3)', raison: `Au moins la moitié du DN de la colonne de chute (${dnChute} / 2 = ${n(demi)})` });
    const row = rows.find(r => r.fe >= fe - 1e-9);
    if (!row) { out.alertes.push({ niveau: 'erreur', ref: 'Tableau 2.5.8.4.', msg: `Charge ${n(fe)} FE hors tableau pour une colonne de chute DN ${dnChute}.` }); out.dn = dnDemi; return out; }
    const L = +longueur;
    if (!(L > 0)) {
      out.alertes.push({ niveau: 'avert', ref: '2.5.8.4. 2)', msg: 'Longueur développée de la colonne de ventilation non saisie — seul le critère 2.5.8.4. 3) est appliqué.' });
      out.dn = dnDemi; return out;
    }
    let dnL = null, lmax = null;
    for (let i = 0; i < D.T_2_5_8_4_DN.length; i++) {
      const m = row.L[i];
      if (m === D.NP) continue;
      if (L <= m + 1e-9) { dnL = D.T_2_5_8_4_DN[i]; lmax = m; break; }
    }
    if (!dnL) out.alertes.push({ niveau: 'erreur', ref: 'Tableau 2.5.8.4.', msg: `Longueur ${n(L)} m hors tableau.` });
    else out.details.push({ dn: dnL, ref: 'Tableau 2.5.8.4.', raison: `Chute DN ${dnChute}, ligne ${row.fe} FE, L = ${n(L)} m ≤ ${lmax === Infinity ? 'NL' : n(lmax) + ' m'}` });
    out.dn = dnMax(dnDemi, dnL);
    out.alertes.push({ niveau: 'info', ref: '2.5.8.4. 5)', msg: 'Au moins une colonne de chute doit se prolonger en ventilation primaire avec un DN ≥ 3 jusqu’au toit.' });
    return out;
  }

  /** Tuyau de ventilation selon son type. */
  function calcVent(v, project) {
    let fe = +v.fe || 0, wc = +v.wc || 0;
    if (v.source === 'locaux') {
      fe = 0; wc = 0;
      (v.locaux || []).forEach(lid => { const loc = (project.locaux || []).find(l => l.id === lid); if (loc) { const t = localTotals(loc); fe += t.fe; wc += t.wc; } });
      fe = round(fe, 2);
    }
    const out = { v, fe, wc, dn: null, ref: '', raison: '', alertes: [] };
    const L = +v.longueur;
    if (v.type === 'interne_etage') {
      out.ref = 'Tableau 2.5.8.1.-A';
      const r = D.T_2_5_8_1_A.find(r => r.max >= fe - 1e-9);
      if (r) { out.dn = r.dn; out.raison = `${n(fe)} FE ≤ ${n(r.max)} FE`; } else out.alertes.push({ niveau: 'erreur', ref: out.ref, msg: `${n(fe)} FE hors tableau (max 120).` });
      out.alertes.push({ niveau: 'info', ref: '2.5.8.1. 2)', msg: 'Exclure la charge de l’appareil (ou des appareils symétriques) le plus en aval.' });
    } else if (v.type === 'interne') {
      out.ref = 'Tableau 2.5.8.1.-B';
      if (wc > 2) out.alertes.push({ niveau: 'erreur', ref: out.ref, msg: `${wc} toilettes : le tableau couvre au plus 2 toilettes.` });
      else {
        const key = wc > 0 ? 'wc2' : 'sansWc';
        const r = D.T_2_5_8_1_B.find(r => r[key] !== null && r[key] >= fe - 1e-9);
        if (r) { out.dn = r.dn; out.raison = `${n(fe)} FE ≤ ${n(r[key])} FE (${wc > 0 ? 'au plus 2 toilettes' : 'sans toilette'})`; } else out.alertes.push({ niveau: 'erreur', ref: out.ref, msg: `${n(fe)} FE hors tableau.` });
      }
      out.alertes.push({ niveau: 'info', ref: '2.5.8.1. 2)', msg: 'Exclure la charge de l’appareil (ou des appareils symétriques) le plus en aval.' });
    } else if (v.type === 'branchement') {
      out.ref = 'Tableau 2.5.8.3.';
      const r = D.T_2_5_8_3.find(r => r.fe >= fe - 1e-9);
      if (!r) out.alertes.push({ niveau: 'erreur', ref: out.ref, msg: `${n(fe)} FE hors tableau (max 5600).` });
      else if (!(L > 0)) out.alertes.push({ niveau: 'erreur', ref: '2.5.8.3. 2) à 5)', msg: 'Longueur développée requise.' });
      else {
        for (let i = 0; i < D.T_2_5_8_3_DN.length; i++) {
          const m = r.L[i]; if (m === D.NP) continue;
          if (L <= m + 1e-9) { out.dn = D.T_2_5_8_3_DN[i]; out.raison = `Ligne ${n(r.fe)} FE, L = ${n(L)} m ≤ ${m === Infinity ? 'NL' : n(m) + ' m'}`; break; }
        }
        if (!out.dn) out.alertes.push({ niveau: 'erreur', ref: out.ref, msg: `Longueur ${n(L)} m hors tableau.` });
      }
    } else if (v.type === 'colonne') {
      const r = ventColonne(v.dnChute, fe, L);
      out.ref = r.ref; out.dn = r.dn; out.raison = r.details.map(d => `${d.ref} : ${d.raison}`).join(' ; '); out.alertes.push(...r.alertes);
    } else if (v.type === 'individuelle') {
      out.ref = 'Tableau 2.5.7.1. / 2.5.8.2.';
      const r = D.T_2_5_7_1.find(r => r.siphon === v.dnSiphon);
      if (r) { out.dn = r.vent; out.raison = `Siphon DN ${r.siphon} → ventilation DN ${r.vent} (longueur non prise en compte, 2.5.8.2. 2))`; } else out.alertes.push({ niveau: 'erreur', ref: out.ref, msg: 'DN de siphon hors tableau.' });
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Module D — alimentation en eau
  // ---------------------------------------------------------------------------

  function velIndex(list, v) { return list.findIndex(x => Math.abs(x - v) < 1e-9); }

  /** Méthode de la perte de pression moyenne — tableau A-2.6.3.1. 2)-F. */
  function sizeF(fa, vitesse) {
    const vi = velIndex(D.T_A_F_V, vitesse);
    if (vi < 0) return { err: `Vitesse ${n(vitesse)} m/s absente du tableau A-2.6.3.1. 2)-F (3,0 / 2,4 / 1,5 / 1,2).` };
    const r = D.T_A_F.find(r => r.fa[vi] >= fa - 1e-9);
    if (!r) return { err: `${n(fa)} FA hors tableau A-2.6.3.1. 2)-F à ${n(vitesse)} m/s — méthode détaillée requise.` };
    return { dn: r.dn, faMax: r.fa[vi], q: r.q[vi], ref: 'Tableau A-2.6.3.1. 2)-F', raison: `${n(fa)} FA ≤ ${n(r.fa[vi])} FA à ${n(vitesse)} m/s (capacité ${n(r.q[vi])} L/s)` };
  }

  /**
   * Débit indicatif : interpolation linéaire sur les couples (FA, L/s) de la colonne
   * de vitesse choisie du tableau A-2.6.3.1. 2)-F. Le code ne donne pas de courbe
   * de demande : valeur informative seulement.
   */
  function debitIndicatif(fa, vitesse) {
    const vi = velIndex(D.T_A_F_V, vitesse);
    if (vi < 0 || !(fa > 0)) return null;
    const pts = D.T_A_F.map(r => [r.fa[vi], r.q[vi]]);
    if (fa < pts[0][0] || fa > pts[pts.length - 1][0]) return null;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      if (fa >= x0 && fa <= x1) return round(y0 + (y1 - y0) * (fa - x0) / (x1 - x0), 2);
    }
    return null;
  }

  /** Méthode applicable aux petits bâtiments — tableau A-2.6.3.1. 2)-A. */
  function sizeA(fa, pression, longueur, partie) {
    const plage = D.T_A_A.find(p => pression >= p.pmin && pression <= p.pmax);
    if (!plage) return { err: `Pression ${n(pression)} kPa < 200 kPa : hors tableau A-2.6.3.1. 2)-A.` };
    const ci = D.T_A_A_L.findIndex(l => l >= longueur - 1e-9);
    if (ci < 0) return { err: `Longueur ${n(longueur)} m > 305 m : hors tableau A-2.6.3.1. 2)-A.` };
    const row = plage.rows.find(r => r[2][ci] >= fa - 1e-9 && r[2][ci] > 0);
    if (!row) return { err: `${n(fa)} FA hors tableau A-2.6.3.1. 2)-A (note 1 : méthode détaillée requise).` };
    const dn = partie === 'branchement' ? row[0] : row[1];
    return { dn, faMax: row[2][ci], ref: 'Tableau A-2.6.3.1. 2)-A', raison: `Plage ${plage.plage}, colonne ${n(D.T_A_A_L[ci])} m : ${n(fa)} FA ≤ ${n(row[2][ci])} FA (ligne ${row[0]} / ${row[1]})` };
  }

  /** Méthode simplifiée — tableau 2.6.3.4. (1 ou 2 logements, maisons en rangée). */
  function size2634(fa, vitesse) {
    const vi = velIndex(D.T_2_6_3_4_V, vitesse);
    if (vi < 0) return { err: `Vitesse ${n(vitesse)} m/s absente du tableau 2.6.3.4. (3,0 / 2,4 / 1,5).` };
    const r = D.T_2_6_3_4.find(r => r.fa[vi] >= fa - 1e-9);
    if (!r) return { err: `${n(fa)} FA hors tableau 2.6.3.4. à ${n(vitesse)} m/s.` };
    return { dn: r.dn, faMax: r.fa[vi], ref: 'Tableau 2.6.3.4.', raison: `${n(fa)} FA ≤ ${n(r.fa[vi])} FA à ${n(vitesse)} m/s` };
  }

  /** Bilan de pression (note A-2.6.3.1. 2), figure A-2.6.3.1. 2)-B). */
  function pressionBilan(p) {
    const P0 = +p.pressionLimite || 0;
    const pAdj = P0 - (+p.pertesBranchement || 0);
    const hauteur = RHO_G * (+p.denivele || 0);
    const disponible = pAdj - (+p.pertesDispositifs || 0) - hauteur - (+p.pressionMinAppareil || 0);
    const Leq = (+p.longueurDistribution || 0) * D.A_2_6_3_1.facteurRaccords;
    const parM = Leq > 0 ? disponible / Leq : null;
    const alertes = [];
    if (!(P0 > 0)) alertes.push({ niveau: 'avert', ref: 'A-2.6.3.1. 2)', msg: 'Pression statique minimale à la limite de propriété non saisie.' });
    if (!(+p.pressionMinAppareil > 0)) alertes.push({ niveau: 'avert', ref: '2.6.3.1. 1)', msg: 'Pression de service minimale de l’appareil le plus éloigné non saisie (fiche du fabricant).' });
    if (P0 > D.EXIGENCES.pressionStatiqueMax) alertes.push({ niveau: 'avert', ref: '2.6.3.3. 1)', msg: `Pression statique ${n(P0)} kPa > 550 kPa : un réducteur de pression est requis pour tout appareil où la pression statique peut dépasser 550 kPa.` });
    if (p.raccordsMales) alertes.push({ niveau: 'avert', ref: 'A-2.6.3.1. 2) b) ii)', msg: 'Raccords à embout mâle : augmenter les pertes selon la fiche du fabricant (le facteur 1,5 ne suffit pas).' });
    let ok = null;
    if (parM !== null) {
      ok = parM >= D.A_2_6_3_1.perteMinKPaParM - 1e-9;
      if (!ok) alertes.push({ niveau: 'erreur', ref: 'A-2.6.3.1. 2)', msg: `Pression disponible ${n(round(parM, 2))} kPa/m < 2,6 kPa/m : le réseau doit être calculé selon une méthode détaillée (ASHRAE / ASPE).` });
    }
    if (disponible < 0) alertes.push({ niveau: 'erreur', ref: 'A-2.6.3.1. 2)', msg: 'Pression insuffisante pour alimenter l’appareil le plus éloigné.' });
    return { P0, pAdj: round(pAdj, 1), hauteur: round(hauteur, 1), disponible: round(disponible, 1), Leq: round(Leq, 1), parM: parM === null ? null : round(parM, 2), ok, alertes };
  }

  /**
   * Calcule un tronçon d'alimentation.
   * tr = { id, nom, partie: 'branchement'|'principal'|'distribution', locaux[], amont[], faSupp (FA ajoutés : gicleurs, irrigation…) }
   */
  function calcSupply(tr, project) {
    const P = project.params || {};
    const nets = project.reseauxAlim || [];
    const coll = collect({ ...tr, debitContinu: 0 }, nets);
    const alertes = [];
    if (coll.cycle) alertes.push({ niveau: 'erreur', ref: '—', msg: 'Boucle détectée dans les tronçons amont.' });
    const fa = { f: 0, c: 0, t: 0 };
    let maxSupDn = null; let pub = false;
    const supp = (function sumSupp(t, seen = new Set()) { if (seen.has(t.id)) return 0; seen.add(t.id); let s = +t.faSupp || 0; (t.amont || []).forEach(a => { const x = nets.find(n => n.id === a); if (x) s += sumSupp(x, seen); }); return s; })(tr);
    coll.locaux.forEach(lid => {
      const loc = (project.locaux || []).find(l => l.id === lid);
      if (!loc) return;
      const t = localTotals(loc);
      fa.f += t.fa.f; fa.c += t.fa.c; fa.t += t.fa.t;
      maxSupDn = dnMax(maxSupDn, t.maxSupDn);
      if ((loc.appareils || []).some(a => appUsage(a, loc) === 'pub' && +a.qte > 0)) pub = true;
      alertes.push(...t.alertes);
    });
    fa.t += supp;
    const FA = round(fa.t, 2);
    const res = { tr, fa: { f: round(fa.f, 2), c: round(fa.c, 2), t: FA }, faSupp: supp, maxSupDn, alertes, dn: null, details: [], debit: null };
    const methode = P.methodeAlim || 'F';
    const v = +P.vitesse || 2.4;
    if (v > D.EXIGENCES.vitesseMax) alertes.push({ niveau: 'erreur', ref: '2.6.3.5. 1)', msg: 'Vitesse > 3,0 m/s interdite.' });
    let s;
    if (FA <= 0) { alertes.push({ niveau: 'info', ref: '—', msg: 'Aucune charge raccordée.' }); return res; }
    if (methode === 'F') s = sizeF(FA, v);
    else if (methode === 'A') {
      const bil = pressionBilan(P);
      const press = tr.partie === 'branchement' ? +P.pressionLimite : bil.pAdj;
      const L = tr.partie === 'branchement' ? +P.longueurBranchement : +P.longueurDistribution;
      s = sizeA(FA, press, L, tr.partie === 'branchement' ? 'branchement' : 'distribution');
    } else if (methode === '2634') {
      s = size2634(FA, v);
      if (pub) alertes.push({ niveau: 'avert', ref: '2.6.3.4. 5) a)', msg: 'Méthode simplifiée : utiliser 100 % des FA de l’usage privé.' });
    }
    if (s.err) alertes.push({ niveau: 'erreur', ref: s.ref || (methode === 'F' ? 'Tableau A-2.6.3.1. 2)-F' : methode === 'A' ? 'Tableau A-2.6.3.1. 2)-A' : 'Tableau 2.6.3.4.'), msg: s.err });
    else { res.dn = s.dn; res.details.push({ dn: s.dn, ref: s.ref, raison: s.raison }); if (s.q) res.capacite = s.q; }

    if (tr.partie === 'branchement' || tr.partie === 'principal') {
      const ref = tr.partie === 'branchement' ? '2.6.3.4. 1)' : '2.6.3.4. 4)';
      res.details.push({ dn: '¾', ref, raison: tr.partie === 'branchement' ? 'Branchement d’eau général : DN ≥ ¾' : 'Entre le branchement / compteur et le premier tuyau de distribution du chauffe-eau : DN ≥ ¾' });
      if (res.dn) res.dn = dnMax(res.dn, '¾');
    }
    if (maxSupDn && res.dn && dnVal(res.dn) < dnVal(maxSupDn)) alertes.push({ niveau: 'avert', ref: '2.6.3.4. 2)', msg: `DN calculé ${res.dn} < DN minimal d’alimentation d’un appareil desservi (${maxSupDn}) : le tuyau alimentant cet appareil doit respecter le tableau 2.6.3.2.` });
    res.debit = debitIndicatif(FA, D.T_A_F_V.includes(v) ? v : 3.0);
    return res;
  }

  // ---------------------------------------------------------------------------
  // Synthèse projet
  // ---------------------------------------------------------------------------
  function calcProject(project) {
    const locaux = (project.locaux || []).map(l => ({ local: l, t: localTotals(l) }));
    const evac = (project.reseauxEvac || []).map(n => calcDwv(n, project));
    const vent = (project.ventilations || []).map(v => calcVent(v, project));
    const alim = (project.reseauxAlim || []).map(t => calcSupply(t, project));
    const pression = pressionBilan(project.params || {});
    const tot = locaux.reduce((a, x) => ({ fe: a.fe + x.t.fe, f: a.f + x.t.fa.f, c: a.c + x.t.fa.c, t: a.t + x.t.fa.t }), { fe: 0, f: 0, c: 0, t: 0 });
    return { locaux, evac, vent, alim, pression, totaux: { fe: round(tot.fe, 2), f: round(tot.f, 2), c: round(tot.c, 2), t: round(tot.t, 2) } };
  }

  const ENGINE = {
    D, RHO_G, dnVal, dnMm, dnLabel, dnMax, dnAtLeast, round, DWV, SUP, PRESET,
    supplyFactors, localTotals, calcDwv, ventColonne, calcVent, sizeStack, sizeBranch, sizeDrain, penteColonneC,
    sizeF, sizeA, size2634, debitIndicatif, pressionBilan, calcSupply, calcProject,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE;
  else root.CNP_ENGINE = ENGINE;
})(typeof globalThis !== 'undefined' ? globalThis : this);
