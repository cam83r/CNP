/*
 * Jeu de données d'exemple — petit immeuble de bureaux, 2 étages.
 * Résultats attendus et calcul manuel : docs/VALIDATION.md (cas V-EX).
 * Les paramètres de pression/longueur sont des hypothèses de projet (pas des valeurs du code).
 */
(function (root) {
  'use strict';

  function app(preset, qte, extra) { return Object.assign({ id: preset + '_' + Math.random().toString(36).slice(2, 7), preset, qte }, extra || {}); }

  function exemple() {
    const P = root.CNP_DATA ? root.CNP_DATA.PRESETS : require('./data.js').PRESETS;
    const pr = id => P.find(p => p.id === id);
    const A = (id, q) => { const p = pr(id); return app(id, q, { dwv: p.dwv, sup: p.sup }); };
    return {
      version: 1,
      nom: 'Exemple — Bureaux 2 étages',
      params: {
        pressionLimite: 450,
        pertesBranchement: 20,
        longueurBranchement: 25,
        longueurDistribution: 45,
        pertesDispositifs: 50,
        denivele: 7,
        pressionMinAppareil: 105,
        raccordsMales: false,
        methodeAlim: 'F',
        vitesse: 2.4,
        matEvac: 'PVC',
        matAlim: 'Cuivre',
      },
      etages: [
        { id: 'E1', nom: 'Rez-de-chaussée', niveau: 0 },
        { id: 'E2', nom: 'Étage 2', niveau: 4 },
      ],
      locaux: [
        { id: 'L1', nom: 'WC Hommes RDC', etageId: 'E1', usage: 'pub', appareils: [A('wc_res6', 2), A('ur_auto', 2), A('lav', 2), A('as3', 1)] },
        { id: 'L2', nom: 'WC Femmes RDC', etageId: 'E1', usage: 'pub', appareils: [A('wc_res6', 3), A('lav', 2), A('as3', 1)] },
        { id: 'L3', nom: 'Cuisinette RDC', etageId: 'E1', usage: 'pub', appareils: [A('ec', 1)] },
        { id: 'L4', nom: 'Corridor RDC', etageId: 'E1', usage: 'pub', appareils: [A('fb', 1)] },
        { id: 'L5', nom: 'Conciergerie RDC', etageId: 'E1', usage: 'pub', appareils: [A('es', 1)] },
        { id: 'L6', nom: 'WC Hommes É2', etageId: 'E2', usage: 'pub', appareils: [A('wc_res6', 2), A('ur_auto', 2), A('lav', 2), A('as3', 1)] },
        { id: 'L7', nom: 'WC Femmes É2', etageId: 'E2', usage: 'pub', appareils: [A('wc_res6', 3), A('lav', 2), A('as3', 1)] },
        { id: 'L8', nom: 'Corridor É2', etageId: 'E2', usage: 'pub', appareils: [A('fb', 1)] },
      ],
      reseauxEvac: [
        { id: 'B1', nom: 'Branchement WC Hommes É2', type: 'branchement', locaux: ['L6'], amont: [], pente: 50 },
        { id: 'B2', nom: 'Branchement WC Femmes É2', type: 'branchement', locaux: ['L7'], amont: [], pente: 50 },
        { id: 'CC1', nom: 'Colonne de chute CC-1', type: 'colonne', locaux: ['L1', 'L2', 'L4', 'L8'], amont: ['B1', 'B2'], ventLongueur: 12 },
        { id: 'B3', nom: 'Branchement cuisinette + conciergerie', type: 'branchement', locaux: ['L3', 'L5'], amont: [], pente: 50 },
        { id: 'C1', nom: 'Collecteur principal', type: 'collecteur', locaux: [], amont: ['CC1', 'B3'], pente: 50, egoutPublic: true },
      ],
      ventilations: [
        { id: 'V1', nom: 'Colonne de ventilation primaire CV-1', type: 'colonne', source: 'locaux', locaux: ['L1', 'L2', 'L4', 'L6', 'L7', 'L8'], dnChute: '4', longueur: 12 },
        { id: 'V2', nom: 'Branchement de ventilation WC Femmes É2', type: 'branchement', source: 'locaux', locaux: ['L7'], longueur: 9 },
        { id: 'V3', nom: 'Ventilation individuelle évier de service', type: 'individuelle', source: 'manuel', fe: 3, dnSiphon: '3' },
      ],
      reseauxAlim: [
        { id: 'A1', nom: "Branchement d'eau général", partie: 'branchement', locaux: [], amont: ['A2', 'A3'], faSupp: 0 },
        { id: 'A2', nom: 'Distribution RDC', partie: 'distribution', locaux: ['L1', 'L2', 'L3', 'L4', 'L5'], amont: [] },
        { id: 'A3', nom: 'Colonne montante É2', partie: 'distribution', locaux: ['L6', 'L7', 'L8'], amont: [] },
      ],
      minimaux: { usage: 'affaires', populationMode: 'zones', zones: [{ id: 'z1', usageId: 'a_bureaux', surface: 900 }, { id: 'z2', usageId: 'a_bureaux', surface: 900 }], urinoirs: 2, besoins: [] },
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = exemple;
  else root.CNP_EXEMPLE = exemple;
})(typeof globalThis !== 'undefined' ? globalThis : this);
