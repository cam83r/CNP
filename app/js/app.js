/* Interface — modules A à E, tableau de bord, tables du code, exports. */
(function () {
  'use strict';
  const E = window.CNP_ENGINE;
  const D = window.CNP_DATA;
  const KEY = 'cnp-plomberie-projet-v1';

  // ---------------------------------------------------------------------------
  // État
  // ---------------------------------------------------------------------------
  function load() {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ } }
  function normalize(p) {
    p.params = Object.assign({ methodeAlim: 'F', vitesse: 2.4 }, p.params || {});
    ['etages', 'locaux', 'reseauxEvac', 'ventilations', 'reseauxAlim'].forEach(k => { p[k] = p[k] || []; });
    p.minimaux = p.minimaux || { occupation: '', hommes: 0, femmes: 0, besoins: [] };
    return p;
  }
  let state = normalize(load() || window.CNP_EXEMPLE());
  let tab = 'dash';
  let ui = { search: '', tableSearch: '', openLocal: null };
  try { tab = sessionStorage.getItem('cnp-tab') || 'dash'; } catch (e) { /* ignore */ }

  function update(fn) { fn(state); save(); render(); }
  function uid(p) { return p + Math.random().toString(36).slice(2, 8); }
  const fmt = (x, n = 2) => (x === null || x === undefined || Number.isNaN(x)) ? '—' : (+x).toLocaleString('fr-CA', { maximumFractionDigits: n });

  // ---------------------------------------------------------------------------
  // Mini-DOM
  // ---------------------------------------------------------------------------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
    return el;
  }
  const svgNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, ...kids) {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    kids.flat().forEach(c => el.append(c.nodeType ? c : document.createTextNode(String(c))));
    return el;
  }

  const REF_TIPS = {
    'Tableau 2.4.9.3.': 'Diamètre minimal des tubulures de sortie et charge hydraulique des appareils (facteurs d’évacuation).',
    'Tableau 2.4.10.2.': 'Charge hydraulique selon le DN du siphon (appareils non listés au tableau 2.4.9.3.).',
    'Tableau 2.4.10.6.-A': 'Charge hydraulique maximale pour une colonne de chute (total et par étage).',
    'Tableau 2.4.10.6.-B': 'Charge hydraulique maximale pour un branchement d’évacuation.',
    'Tableau 2.4.10.6.-C': 'Charge maximale d’un collecteur sanitaire ou d’un branchement d’égout sanitaire, selon la pente.',
    '2.4.8.1. 1)': 'Tuyaux d’évacuation de DN ≤ 3 : pente d’au moins 1:50.',
    'A-2.4.8.1. 1)': 'Note : pentes < 1:100 permises pour DN ≥ 4 mais déconseillées.',
    '2.4.9.1. 1) b)': 'Un tuyau d’évacuation ne doit pas avoir un DN inférieur à celui du plus gros tuyau qui s’y déverse.',
    '2.4.9.2. 1)': 'DN des tuyaux d’évacuation d’une toilette ≥ 3.',
    '2.4.9.2. 2)': 'DN ≥ 4 en aval du raccordement à un 3e tuyau de vidange de toilette.',
    '2.4.9.2. 3)': 'Colonne de chute desservant plus de 6 toilettes : DN ≥ 4.',
    '2.4.9.4. 1)': 'Collecteur principal / branchement d’égout raccordé au réseau public en aval du regard principal : DN ≥ 4.',
    '2.4.10.3. 1)': 'Écoulement continu : 31,7 facteurs d’évacuation par L/s.',
    'Tableau 2.5.8.1.-A': 'Ventilation interne desservant des appareils sur un même étage.',
    'Tableau 2.5.8.1.-B': 'Ventilation interne — charges maximales (sans toilette / au plus 2 toilettes).',
    'Tableau 2.5.8.3.': 'Branchements et collecteurs de ventilation, ventilation secondaire et terminale (charge + longueur).',
    'Tableau 2.5.8.4.': 'Colonnes de ventilation primaire ou secondaire (DN de la chute, charge, longueur développée).',
    '2.5.8.4. 3)': 'DN minimal de la colonne de ventilation : la moitié de celui de la colonne de chute à sa base.',
    'Tableau 2.5.7.1. / 2.5.8.2.': 'Ventilation individuelle ou commune : selon le plus gros siphon desservi.',
    'Tableau 2.6.3.2.-A': 'Facteurs d’alimentation (usage privé / public ; eau froide, chaude, total) et DN minimal d’alimentation.',
    'Tableau 2.6.3.2.-B': 'Urinoirs à robinets de chasse.',
    'Tableau 2.6.3.2.-C': 'Toilettes à robinets de chasse.',
    'Tableau 2.6.3.2.-D': 'Appareils non listés : FA selon le DN du tuyau d’alimentation.',
    'Tableau A-2.6.3.1. 2)-F': 'Note A — méthode de la perte de pression moyenne : FA maximal par DN selon la vitesse.',
    'Tableau A-2.6.3.1. 2)-A': 'Note A — méthode applicable aux petits bâtiments : FA maximal selon la pression et la longueur.',
    'Tableau 2.6.3.4.': 'Bâtiments d’un ou deux logements / maisons en rangée avec branchement distinct.',
    '2.6.3.4. 1)': 'Branchement d’eau général : DN selon le débit de pointe, jamais < ¾.',
    '2.6.3.4. 4)': 'Entre le branchement/compteur et le premier tuyau de distribution du chauffe-eau : DN ≥ ¾.',
    '2.6.3.3. 1)': 'Réducteur de pression requis si la pression statique peut dépasser 550 kPa.',
    '2.6.3.5. 1)': 'Vitesse maximale selon le fabricant, sans jamais dépasser 3,0 m/s.',
  };
  function ref(r) { return h('span', { class: 'ref', tabindex: '0', 'data-tip': REF_TIPS[r] || `Voir ${r} du CNP 2020 (modifié Québec).` }, r); }
  const NIV = { erreur: 'Erreur', avert: 'Attention', info: 'Info', ok: 'OK' };
  function alertList(list) {
    if (!list || !list.length) return null;
    return h('ul', { class: 'alerts' }, list.map(a => h('li', { class: 'alert ' + a.niveau }, h('span', { class: 'tag' }, NIV[a.niveau]), h('span', { class: 'msg' }, a.msg, ' '), a.ref && a.ref !== '—' ? ref(a.ref) : null)));
  }
  function statusOf(alertes, ok) {
    if (alertes.some(a => a.niveau === 'erreur')) return 'erreur';
    if (alertes.some(a => a.niveau === 'avert')) return 'avert';
    return ok ? 'ok' : 'info';
  }
  const STATUS_TXT = { erreur: 'À corriger', avert: 'À vérifier', ok: 'Conforme (tableaux)', info: '—' };
  function statusBadge(st) { return h('span', { class: 'status ' + st }, STATUS_TXT[st]); }
  function dnBig(dn, meta) {
    return h('div', { class: 'dn-result' }, h('span', { class: 'big' + (dn ? '' : ' none') }, dn ? `DN ${dn}` : 'Hors tableau'), dn && E.dnMm(dn) ? h('span', { class: 'meta' }, `${E.dnMm(dn)} mm`) : null, meta ? h('span', { class: 'meta' }, meta) : null);
  }
  function constraintList(list) {
    if (!list || !list.length) return null;
    return h('ul', { class: 'constraints' }, list.map(c => h('li', null, h('span', { class: 'dn' }, c.dn ? `DN ${c.dn}` : '—'), h('span', { class: 'why' }, c.raison), ref(c.ref))));
  }

  function field(label, input, tip) { return h('label', { class: 'field', title: tip || null }, label, input); }
  function num(val, onchange, attrs) {
    return h('input', Object.assign({ type: 'number', value: val ?? '', step: 'any', onchange: e => onchange(e.target.value === '' ? null : +e.target.value) }, attrs || {}));
  }
  function txt(val, onchange, attrs) { return h('input', Object.assign({ type: 'text', value: val ?? '', onchange: e => onchange(e.target.value) }, attrs || {})); }
  function sel(val, options, onchange, attrs) {
    return h('select', Object.assign({ onchange: e => onchange(e.target.value) }, attrs || {}), options.map(o => {
      if (o.group) return h('optgroup', { label: o.group }, o.options.map(x => h('option', { value: x.v, selected: String(x.v) === String(val) }, x.t)));
      return h('option', { value: o.v, selected: String(o.v) === String(val) }, o.t);
    }));
  }
  function chips(all, selected, onToggle, labelOf) {
    if (!all.length) return h('span', { class: 'muted' }, 'Aucun élément.');
    return h('div', { class: 'chips' }, all.map(x => {
      const on = selected.includes(x.id);
      return h('label', { class: 'chip' + (on ? ' on' : '') }, h('input', { type: 'checkbox', checked: on, onchange: () => onToggle(x.id) }), labelOf(x));
    }));
  }
  function toggle(arr, id) { const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); }

  // ---------------------------------------------------------------------------
  // Listes de choix
  // ---------------------------------------------------------------------------
  const DWV_OPTS = [{ v: '', t: '— aucune évacuation —' }, { group: 'Tableau 2.4.9.3. / 2.4.10.2.', options: D.T_2_4_9_3.map(f => ({ v: f.id, t: `${f.nom} — ${fmt(f.fe)} FE` })) }];
  const SUP_OPTS = [
    { v: '', t: '— aucune alimentation —' },
    { group: 'Tableaux 2.6.3.2.-A, -B, -C', options: D.T_2_6_3_2_A.map(f => ({ v: f.id, t: f.nom + (f.fab ? ' (fabricant)' : '') })) },
    { group: 'Tableau 2.6.3.2.-D (non listé)', options: D.T_2_6_3_2_D.map(r => ({ v: 'D:' + r.dn, t: `Appareil non listé, alimentation DN ${r.dn}` })) },
    { group: 'Autre', options: [{ v: 'MAN', t: 'Valeurs du fabricant (saisie manuelle)' }] },
  ];
  const PRESET_OPTS = [{ v: '', t: 'Personnalisé' }].concat(D.PRESETS.map(p => ({ v: p.id, t: p.nom })));
  const PENTES = [400, 200, 133, 100, 68, 50, 32, 25];

  // ---------------------------------------------------------------------------
  // Onglets
  // ---------------------------------------------------------------------------
  const TABS = [
    { id: 'dash', t: 'Tableau de bord' },
    { id: 'projet', t: 'Projet et paramètres' },
    { id: 'locaux', t: 'A · Appareils' },
    { id: 'evac', t: 'B · Évacuation' },
    { id: 'vent', t: 'C · Ventilation' },
    { id: 'alim', t: 'D · Alimentation' },
    { id: 'min', t: 'E · Appareils minimaux' },
    { id: 'tables', t: 'Tables du code' },
  ];

  function render() {
    const R = E.calcProject(state);
    const errs = {
      evac: R.evac.reduce((n, r) => n + r.alertes.filter(a => a.niveau === 'erreur').length + (r.vent ? r.vent.alertes.filter(a => a.niveau === 'erreur').length : 0), 0),
      vent: R.vent.reduce((n, r) => n + r.alertes.filter(a => a.niveau === 'erreur').length, 0),
      alim: R.alim.reduce((n, r) => n + r.alertes.filter(a => a.niveau === 'erreur').length, 0) + R.pression.alertes.filter(a => a.niveau === 'erreur').length,
      locaux: R.locaux.reduce((n, x) => n + x.t.alertes.filter(a => a.niveau === 'erreur').length, 0),
    };
    const nav = document.getElementById('tabs');
    nav.replaceChildren(...TABS.map(t => h('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === t.id), onclick: () => { tab = t.id; try { sessionStorage.setItem('cnp-tab', tab); } catch (e) { /* ignore */ } render(); } }, t.t, errs[t.id] ? h('span', { class: 'count' }, errs[t.id]) : null)));
    const main = document.getElementById('main');
    const scroll = window.scrollY;
    const views = { dash: viewDash, projet: viewProjet, locaux: viewLocaux, evac: viewEvac, vent: viewVent, alim: viewAlim, min: viewMin, tables: viewTables };
    main.replaceChildren(views[tab](R));
    window.scrollTo(0, scroll);
  }

  // ---------------------------------------------------------------------------
  // Tableau de bord
  // ---------------------------------------------------------------------------
  function viewDash(R) {
    const allAlerts = [];
    R.locaux.forEach(x => allAlerts.push(...x.t.alertes));
    R.evac.forEach(r => { r.alertes.forEach(a => allAlerts.push({ ...a, msg: `${r.net.nom} : ${a.msg}` })); if (r.vent) r.vent.alertes.filter(a => a.niveau !== 'info').forEach(a => allAlerts.push({ ...a, msg: `${r.net.nom} (ventilation) : ${a.msg}` })); });
    R.vent.forEach(r => r.alertes.filter(a => a.niveau !== 'info').forEach(a => allAlerts.push({ ...a, msg: `${r.v.nom} : ${a.msg}` })));
    R.pression.alertes.forEach(a => allAlerts.push({ ...a, msg: `Pression : ${a.msg}` }));
    R.alim.forEach(r => r.alertes.filter(a => a.niveau !== 'info' && !R.locaux.some(x => x.t.alertes.includes(a))).forEach(a => allAlerts.push({ ...a, msg: `${r.tr.nom} : ${a.msg}` })));
    const nErr = allAlerts.filter(a => a.niveau === 'erreur').length;
    const nWarn = allAlerts.filter(a => a.niveau === 'avert').length;
    const order = { erreur: 0, avert: 1, info: 2 };
    allAlerts.sort((a, b) => order[a.niveau] - order[b.niveau]);
    const nbApp = state.locaux.reduce((n, l) => n + (l.appareils || []).reduce((m, a) => m + (+a.qte || 0), 0), 0);

    return h('div', { class: 'stack' },
      h('div', { class: 'section-head' }, h('div', null, h('h2', null, state.nom || 'Projet'), h('p', null, `${state.etages.length} étage(s), ${state.locaux.length} local(aux), ${nbApp} appareil(s). Résultats recalculés à chaque modification.`))),
      h('div', { class: 'grid kpis' },
        kpi('Facteurs d’évacuation', fmt(R.totaux.fe), 'FE, tous les locaux', 'Tableau 2.4.9.3.'),
        kpi('Facteurs d’alimentation', fmt(R.totaux.t), `froide ${fmt(R.totaux.f)} · chaude ${fmt(R.totaux.c)}`, 'Tableau 2.6.3.2.-A'),
        kpi('Pression disponible', R.pression.parM === null ? '—' : `${fmt(R.pression.parM)} kPa/m`, R.pression.ok === null ? 'données incomplètes' : R.pression.ok ? '≥ 2,6 kPa/m' : '< 2,6 kPa/m : méthode détaillée', 'A-2.6.3.1. 2)'),
        kpi('Alertes', `${nErr} / ${nWarn}`, 'erreurs / à vérifier', null)),
      h('div', { class: 'grid cols-2' },
        h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h3', null, 'Réseaux d’évacuation'), h('button', { class: 'btn sm', onclick: () => go('evac') }, 'Modifier')),
          R.evac.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'compact' },
            h('thead', null, h('tr', null, h('th', null, 'Réseau'), h('th', null, 'Type'), h('th', { class: 'num' }, 'FE'), h('th', { class: 'num' }, 'DN'), h('th', { class: 'num' }, 'Vent.'), h('th', null, 'Statut'))),
            h('tbody', null, R.evac.map(r => h('tr', null, h('td', null, r.net.nom), h('td', null, TYPE_EVAC[r.net.type]), h('td', { class: 'num' }, fmt(r.fe)), h('td', { class: 'num' }, r.dn ? r.dn : '—'), h('td', { class: 'num' }, r.vent && r.vent.dn ? r.vent.dn : ''), h('td', null, statusBadge(statusOf(r.alertes.concat(r.vent ? r.vent.alertes : []), !!r.dn)))))))) : h('p', { class: 'muted' }, 'Aucun réseau.')),
        h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h3', null, 'Alimentation en eau'), h('button', { class: 'btn sm', onclick: () => go('alim') }, 'Modifier')),
          R.alim.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'compact' },
            h('thead', null, h('tr', null, h('th', null, 'Tronçon'), h('th', { class: 'num' }, 'FA total'), h('th', { class: 'num' }, 'DN'), h('th', { class: 'num' }, 'Débit indic.'), h('th', null, 'Statut'))),
            h('tbody', null, R.alim.map(r => h('tr', null, h('td', null, r.tr.nom), h('td', { class: 'num' }, fmt(r.fa.t)), h('td', { class: 'num' }, r.dn || '—'), h('td', { class: 'num' }, r.debit ? `${fmt(r.debit)} L/s` : '—'), h('td', null, statusBadge(statusOf(r.alertes, !!r.dn)))))))) : h('p', { class: 'muted' }, 'Aucun tronçon.'),
          h('p', { class: 'muted', style: 'margin-top:8px;font-size:12px' }, `Méthode : ${METH[state.params.methodeAlim]} — vitesse ${fmt(state.params.vitesse)} m/s.`))),
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h3', null, 'Alertes'), h('span', { class: 'muted' }, allAlerts.length ? '' : 'Aucune alerte.')), alertList(allAlerts)),
      h('div', { class: 'card' }, h('h3', null, 'Schéma unifilaire — colonnes de chute'), h('div', { class: 'grid cols-3', style: 'margin-top:10px' }, R.evac.filter(r => r.net.type === 'colonne').map(schemaColonne)), h('h4', { style: 'margin-top:14px' }, 'Arborescence d’évacuation'), treeEvac(R)));
  }
  function kpi(lbl, val, sub, r) { return h('div', { class: 'card kpi' }, h('div', { class: 'lbl' }, lbl, ' ', r ? ref(r) : null), h('div', { class: 'val' }, val), h('div', { class: 'sub' }, sub)); }
  function go(t) { tab = t; try { sessionStorage.setItem('cnp-tab', tab); } catch (e) { /* ignore */ } render(); window.scrollTo(0, 0); }
  const TYPE_EVAC = { colonne: 'Colonne de chute', branchement: 'Branchement d’évacuation', collecteur: 'Collecteur / branchement d’égout' };
  const METH = { F: 'Perte de pression moyenne (tabl. A-2.6.3.1. 2)-F)', A: 'Petits bâtiments (tabl. A-2.6.3.1. 2)-A)', 2634: 'Méthode simplifiée 1-2 logements (tabl. 2.6.3.4.)' };

  // Schéma unifilaire d'une colonne de chute
  function schemaColonne(r) {
    const etages = state.etages.slice().sort((a, b) => (+b.niveau || 0) - (+a.niveau || 0));
    const n = Math.max(etages.length, 1);
    const W = 420, top = 40, step = 52, Hh = top + n * step + 50;
    const x = 210;
    const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'schema', role: 'img', 'aria-label': `Schéma de ${r.net.nom}` });
    svg.append(s('line', { x1: 40, y1: top, x2: W - 20, y2: top, class: 'roof' }));
    svg.append(s('text', { x: 40, y: top - 6, class: 'muted' }, 'Toit'));
    svg.append(s('line', { x1: x, y1: 8, x2: x, y2: top + 6, class: 'vent' }));
    svg.append(s('text', { x: x + 10, y: 18 }, r.vent && r.vent.dn ? `Ventilation DN ${r.vent.dn}` : 'Ventilation'));
    let cum = 0;
    const lowest = etages.length ? top + n * step - 12 : top + step;
    svg.append(s('line', { x1: x, y1: top, x2: x, y2: lowest + 16, class: 'dwv' }));
    etages.forEach((et, i) => {
      const y = top + (i + 1) * step - 12;
      const fe = r.feEtage[et.id] || 0;
      cum += fe;
      svg.append(s('line', { x1: 20, y1: y + 12, x2: W - 20, y2: y + 12, class: 'floor' }));
      svg.append(s('text', { x: 20, y: y + 8, class: 'muted' }, et.nom));
      if (fe > 0) {
        svg.append(s('line', { x1: x, y1: y, x2: x + 60, y2: y, class: 'dwv', 'stroke-width': 3 }));
        svg.append(s('text', { x: x + 66, y: y + 4 }, `+${fmt(fe)} FE`));
      }
      svg.append(s('text', { x: x - 10, y: y + 4, 'text-anchor': 'end', class: 'muted' }, `Σ ${fmt(cum)}`));
    });
    svg.append(s('text', { x: x, y: lowest + 34, 'text-anchor': 'middle' }, `${r.net.nom} — ${r.dn ? 'DN ' + r.dn : 'hors tableau'} — ${fmt(r.fe)} FE`));
    return h('div', null, svg);
  }
  function treeEvac(R) {
    const nets = state.reseauxEvac;
    const used = new Set(); nets.forEach(n => (n.amont || []).forEach(a => used.add(a)));
    const roots = nets.filter(n => !used.has(n.id));
    const byId = Object.fromEntries(R.evac.map(r => [r.net.id, r]));
    function node(n, depth, seen) {
      const r = byId[n.id];
      if (seen.has(n.id) || depth > 12) return h('li', null, n.nom, ' (boucle)');
      const s2 = new Set(seen); s2.add(n.id);
      return h('li', null, h('strong', null, n.nom), ` — ${TYPE_EVAC[n.type]}, ${fmt(r.fe)} FE → `, h('strong', null, r.dn ? `DN ${r.dn}` : 'hors tableau'),
        (n.locaux || []).length ? h('span', { class: 'muted' }, ` · ${(n.locaux || []).map(id => (state.locaux.find(l => l.id === id) || {}).nom).filter(Boolean).join(', ')}`) : null,
        (n.amont || []).length ? h('ul', { class: 'tree' }, n.amont.map(id => nets.find(x => x.id === id)).filter(Boolean).map(c => node(c, depth + 1, s2))) : null);
    }
    return roots.length ? h('ul', { class: 'tree' }, roots.map(r => node(r, 0, new Set()))) : h('p', { class: 'muted' }, 'Aucun réseau.');
  }

  // ---------------------------------------------------------------------------
  // Projet et paramètres
  // ---------------------------------------------------------------------------
  function viewProjet() {
    const p = state.params;
    return h('div', { class: 'stack' },
      h('div', { class: 'section-head' }, h('div', null, h('h2', null, 'Projet et paramètres'), h('p', null, 'Édition du code, matériaux, étages et gestion du fichier de projet.'))),
      h('div', { class: 'grid cols-2' },
        h('div', { class: 'card' }, h('h3', null, 'Projet'),
          h('div', { class: 'fields', style: 'margin-top:10px' },
            field('Nom du projet', txt(state.nom, v => update(s => { s.nom = v; }))),
            field('Matériau — évacuation', sel(p.matEvac || 'PVC', ['ABS', 'PVC', 'Fonte', 'Autre'].map(v => ({ v, t: v })), v => update(s => { s.params.matEvac = v; }))),
            field('Matériau — alimentation', sel(p.matAlim || 'Cuivre', ['Cuivre', 'PEX', 'PE-RT', 'CPVC', 'Autre'].map(v => ({ v, t: v })), v => update(s => { s.params.matAlim = v; })))),
          h('p', { class: 'muted', style: 'margin-top:10px;font-size:12.5px' }, 'Les tableaux de charge hydraulique (2.4.10.6., 2.5.8.) ne dépendent pas du matériau. Pour l’alimentation, la vitesse maximale suit les recommandations du fabricant des tuyaux et raccords, sans dépasser 3,0 m/s (2.6.3.5. 1)) : choisir la vitesse dans l’onglet D.')),
        h('div', { class: 'card' }, h('h3', null, 'Édition du code'),
          h('p', { style: 'margin-top:8px' }, h('strong', null, D.EDITION.titre)),
          h('p', { class: 'muted' }, D.EDITION.vigueur),
          h('p', { class: 'muted', style: 'font-size:12px' }, 'Source des tables : ', D.EDITION.source, '. Transcription vérifiée page par page — voir docs/EXTRACTION.md.'))),
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h3', null, 'Étages'), h('button', { class: 'btn sm', onclick: () => update(s => { s.etages.push({ id: uid('E'), nom: `Étage ${s.etages.length + 1}`, niveau: s.etages.length * 4 }); }) }, '+ Étage')),
        h('div', { class: 'table-wrap' }, h('table', { class: 'compact' },
          h('thead', null, h('tr', null, h('th', null, 'Nom'), h('th', null, 'Niveau du plancher (m)'), h('th', { class: 'num' }, 'Locaux'), h('th', null, ''))),
          h('tbody', null, state.etages.map(et => h('tr', null,
            h('td', null, txt(et.nom, v => update(() => { et.nom = v; }))),
            h('td', null, num(et.niveau, v => update(() => { et.niveau = v; }), { style: 'width:100px' })),
            h('td', { class: 'num' }, state.locaux.filter(l => l.etageId === et.id).length),
            h('td', null, h('button', { class: 'icon-btn', title: 'Supprimer', onclick: () => { if (state.locaux.some(l => l.etageId === et.id) && !confirm('Des locaux sont assignés à cet étage. Supprimer quand même ?')) return; update(s => { s.etages = s.etages.filter(x => x !== et); }); } }, '×')))))))),
      h('div', { class: 'card' }, h('h3', null, 'Fichier de projet'),
        h('p', { class: 'muted', style: 'margin-top:6px' }, 'Le projet est enregistré automatiquement dans ce navigateur. Exporter en JSON pour l’archiver ou le partager.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: exportJSON }, 'Exporter JSON'),
          h('label', { class: 'btn' }, 'Importer JSON', h('input', { type: 'file', accept: '.json,application/json', class: 'hidden', onchange: importJSON })),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn', onclick: () => { if (confirm('Remplacer le projet par le jeu d’exemple ?')) { state = normalize(window.CNP_EXEMPLE()); save(); render(); } } }, 'Charger l’exemple'),
          h('button', { class: 'btn danger', onclick: () => { if (confirm('Créer un projet vide ? Le projet actuel sera remplacé.')) { state = normalize({ nom: 'Nouveau projet', params: { methodeAlim: 'F', vitesse: 2.4 }, etages: [{ id: 'E1', nom: 'Rez-de-chaussée', niveau: 0 }] }); save(); render(); } } }, 'Nouveau projet'))));
  }
  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function slug() { return (state.nom || 'projet').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'projet'; }
  function exportJSON() { download(`${slug()}.json`, JSON.stringify(state, null, 2), 'application/json'); }
  function importJSON(e) {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { try { state = normalize(JSON.parse(t)); save(); render(); } catch (err) { alert('Fichier JSON invalide.'); } });
  }

  // ---------------------------------------------------------------------------
  // Module A — locaux et appareils
  // ---------------------------------------------------------------------------
  function searchIndex() {
    const out = [];
    D.PRESETS.forEach(p => out.push({ kind: 'Combinaison usuelle', label: p.nom, add: { preset: p.id, dwv: p.dwv, sup: p.sup } }));
    D.T_2_4_9_3.forEach(f => out.push({ kind: `Évacuation · ${fmt(f.fe)} FE`, label: f.nom, add: { preset: '', dwv: f.id, sup: null } }));
    D.T_2_6_3_2_A.forEach(f => out.push({ kind: 'Alimentation', label: f.nom, add: { preset: '', dwv: null, sup: f.id } }));
    return out;
  }
  const SEARCH = searchIndex();
  const norm = t => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function viewLocaux(R) {
    const tot = R.totaux;
    return h('div', { class: 'stack' },
      h('div', { class: 'section-head' },
        h('div', null, h('h2', null, 'Module A — Locaux et appareils sanitaires'),
          h('p', null, 'Chaque appareil combine une entrée d’évacuation (facteur d’évacuation, ', ref('Tableau 2.4.9.3.'), ') et une entrée d’alimentation (facteurs d’alimentation privé/public, ', ref('Tableau 2.6.3.2.-A'), '). Les combinaisons usuelles remplissent les deux ; tout reste modifiable.')),
        h('button', { class: 'btn primary', onclick: () => update(s => { const id = uid('L'); s.locaux.push({ id, nom: `Local ${s.locaux.length + 1}`, etageId: (s.etages[0] || {}).id, usage: 'pub', appareils: [] }); ui.openLocal = id; }) }, '+ Local')),
      h('div', { class: 'grid kpis' },
        kpi('FE totaux', fmt(tot.fe), 'facteurs d’évacuation', 'Tableau 2.4.9.3.'),
        kpi('FA eau froide', fmt(tot.f), 'facteurs d’alimentation', 'Tableau 2.6.3.2.-A'),
        kpi('FA eau chaude', fmt(tot.c), 'facteurs d’alimentation', 'Tableau 2.6.3.2.-A'),
        kpi('FA total', fmt(tot.t), 'base des méthodes de calcul', 'Tableau 2.6.3.2.-A')),
      h('div', { class: 'banner' }, 'Le FA total n’est pas la somme froide + chaude : le code donne une colonne « Total » propre à chaque appareil. Les méthodes de dimensionnement de la note A-2.6.3.1. 2) utilisent la somme des valeurs totales. La réduction à 75 % (', ref('2.6.3.2. 3)'), ') ne s’applique qu’à une méthode de conception détaillée.'),
      state.locaux.length ? null : h('p', { class: 'muted' }, 'Aucun local. Ajouter un local pour saisir des appareils.'),
      R.locaux.map(({ local, t }) => localCard(local, t)));
  }

  function localCard(loc, t) {
    const results = ui.openLocal === loc.id && ui.search ? SEARCH.filter(x => norm(x.label).includes(norm(ui.search))).slice(0, 30) : [];
    return h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('input', { class: 'title-input', value: loc.nom, onchange: e => update(() => { loc.nom = e.target.value; }), 'aria-label': 'Nom du local' }),
        field('Étage', sel(loc.etageId, state.etages.map(e => ({ v: e.id, t: e.nom })), v => update(() => { loc.etageId = v; }))),
        field('Usage par défaut', sel(loc.usage || 'pub', [{ v: 'priv', t: 'Privé' }, { v: 'pub', t: 'Public' }], v => update(() => { loc.usage = v; })), 'Définitions « usage privé / usage public », 1.4.1.2. [A]'),
        h('span', { class: 'muted mono' }, `${fmt(t.fe)} FE · FA ${fmt(t.fa.t)}`),
        h('button', { class: 'icon-btn', title: 'Dupliquer le local', onclick: () => update(s => { const c = JSON.parse(JSON.stringify(loc)); c.id = uid('L'); c.nom += ' (copie)'; c.appareils.forEach(a => { a.id = uid('a'); }); s.locaux.splice(s.locaux.indexOf(loc) + 1, 0, c); }) }, '⧉'),
        h('button', { class: 'icon-btn', title: 'Supprimer le local', onclick: () => { if (confirm(`Supprimer « ${loc.nom} » ?`)) update(s => { s.locaux = s.locaux.filter(x => x !== loc); s.reseauxEvac.forEach(n => { n.locaux = (n.locaux || []).filter(id => id !== loc.id); }); s.reseauxAlim.forEach(n => { n.locaux = (n.locaux || []).filter(id => id !== loc.id); }); s.ventilations.forEach(n => { n.locaux = (n.locaux || []).filter(id => id !== loc.id); }); }); } }, '×')),
      (loc.appareils || []).length ? h('div', { class: 'table-wrap' }, h('table', { class: 'compact' },
        h('thead', null, h('tr', null, h('th', null, 'Combinaison'), h('th', null, 'Évacuation'), h('th', null, 'Alimentation'), h('th', { class: 'num' }, 'Qté'), h('th', null, 'Usage'), h('th', { class: 'num' }, 'FE'), h('th', { class: 'num' }, 'FA f / c / total'), h('th', null, ''))),
        h('tbody', null, t.lignes.map(li => appRow(loc, li))),
        h('tfoot', null, h('tr', null, h('td', { colspan: 5 }, 'Total du local'), h('td', { class: 'num' }, fmt(t.fe)), h('td', { class: 'num' }, `${fmt(t.fa.f)} / ${fmt(t.fa.c)} / ${fmt(t.fa.t)}`), h('td', null))))) : h('p', { class: 'muted' }, 'Aucun appareil.'),
      h('div', { style: 'margin-top:10px' },
        h('input', { type: 'search', placeholder: 'Rechercher un appareil dans les tables du code (ex. : lavabo, urinoir, douche)…', value: ui.openLocal === loc.id ? ui.search : '', style: 'width:100%',
          oninput: e => { ui.openLocal = loc.id; ui.search = e.target.value; render(); const el = document.getElementById('srch-' + loc.id); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, id: 'srch-' + loc.id }),
        results.length ? h('div', { class: 'search-results' }, results.map(x => h('button', { type: 'button', onclick: () => { ui.search = ''; update(() => { loc.appareils.push(Object.assign({ id: uid('a'), qte: 1 }, x.add)); }); } }, h('span', null, x.label), h('span', { class: 'kind' }, x.kind)))) : null),
      alertList(t.alertes));
  }

  function appRow(loc, li) {
    const a = li.app;
    const s = li.fa;
    const supFx = a.sup && E.SUP[a.sup];
    const needMan = a.sup === 'MAN' || (supFx && supFx.fab);
    return h('tr', null,
      h('td', null, sel(a.preset || '', PRESET_OPTS, v => update(() => { a.preset = v; const p = E.PRESET[v]; if (p) { a.dwv = p.dwv; a.sup = p.sup; } }))),
      h('td', null, sel(a.dwv || '', DWV_OPTS, v => update(() => { a.dwv = v || null; a.preset = ''; }))),
      h('td', null, sel(a.sup || '', SUP_OPTS, v => update(() => { a.sup = v || null; a.preset = ''; })),
        a.sup && a.sup.startsWith('D:') ? h('div', { style: 'margin-top:4px' }, sel(a.eauD || 'fc', [{ v: 'fc', t: 'Eau froide et chaude' }, { v: 'f', t: 'Eau froide seulement' }, { v: 'c', t: 'Eau chaude seulement' }], v => update(() => { a.eauD = v; }))) : null,
        needMan ? h('div', { class: 'row', style: 'margin-top:4px' }, ['f', 'c', 't'].map(k => num((a.faManuel || {})[k], v => update(() => { a.faManuel = Object.assign({}, a.faManuel, { [k]: v }); }), { placeholder: { f: 'FA froide', c: 'FA chaude', t: 'FA total' }[k], style: 'width:84px' }))) : null),
      h('td', { class: 'num' }, num(a.qte, v => update(() => { a.qte = Math.max(0, v || 0); }), { style: 'width:64px', min: 0, step: 1 })),
      h('td', null, sel(a.usage || '', [{ v: '', t: `Local (${loc.usage === 'priv' ? 'privé' : 'public'})` }, { v: 'priv', t: 'Privé' }, { v: 'pub', t: 'Public' }], v => update(() => { a.usage = v || undefined; }))),
      h('td', { class: 'num' }, li.fe === null ? '—' : h('span', { title: li.feRef }, `${fmt(li.q * li.fe)}`), li.fe !== null && li.q !== 1 ? h('div', { class: 'muted', style: 'font-size:11px' }, `${li.q} × ${fmt(li.fe)}`) : null),
      h('td', { class: 'num', title: s ? s.ref : '' }, s ? (s.so ? h('span', { style: 'color:var(--err)' }, 's/o') : `${fmt(li.q * s.f)} / ${fmt(li.q * s.c)} / ${fmt(li.q * s.t)}`) : '—'),
      h('td', null, h('button', { class: 'icon-btn', title: 'Retirer', onclick: () => update(() => { loc.appareils = loc.appareils.filter(x => x !== a); }) }, '×')));
  }

  // ---------------------------------------------------------------------------
  // Module B — évacuation
  // ---------------------------------------------------------------------------
  function viewEvac(R) {
    return h('div', { class: 'stack' },
      h('div', { class: 'section-head' },
        h('div', null, h('h2', null, 'Module B — Réseaux d’évacuation'),
          h('p', null, 'Assigner des locaux (et/ou des réseaux amont) à chaque colonne de chute, branchement d’évacuation ou collecteur. Le DN retenu est le plus grand des DN exigés par la charge hydraulique (', ref('Tableau 2.4.10.6.-A'), ' ', ref('Tableau 2.4.10.6.-B'), ' ', ref('Tableau 2.4.10.6.-C'), ') et par les diamètres minimaux de la sous-section 2.4.9.')),
        h('div', { class: 'row' }, ['colonne', 'branchement', 'collecteur'].map(t => h('button', { class: 'btn', onclick: () => update(s => { s.reseauxEvac.push({ id: uid('N'), nom: `${TYPE_EVAC[t]} ${s.reseauxEvac.length + 1}`, type: t, locaux: [], amont: [], pente: t === 'colonne' ? null : 50 }); }) }, '+ ' + TYPE_EVAC[t])))),
      R.evac.length ? h('div', { class: 'grid cols-2' }, R.evac.map(evacCard)) : h('p', { class: 'muted' }, 'Aucun réseau.'));
  }

  function evacCard(r) {
    const n = r.net;
    const others = state.reseauxEvac.filter(x => x !== n);
    return h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('input', { class: 'title-input', value: n.nom, onchange: e => update(() => { n.nom = e.target.value; }) }),
        statusBadge(statusOf(r.alertes.concat(r.vent ? r.vent.alertes : []), !!r.dn)),
        h('button', { class: 'icon-btn', title: 'Supprimer', onclick: () => { if (confirm(`Supprimer « ${n.nom} » ?`)) update(s => { s.reseauxEvac = s.reseauxEvac.filter(x => x !== n); s.reseauxEvac.forEach(x => { x.amont = (x.amont || []).filter(id => id !== n.id); }); }); } }, '×')),
      h('div', { class: 'fields' },
        field('Type', sel(n.type, Object.entries(TYPE_EVAC).map(([v, t]) => ({ v, t })), v => update(() => { n.type = v; if (v !== 'colonne' && !n.pente) n.pente = 50; }))),
        n.type !== 'colonne' || n.deviation ? field('Pente (1:x)', penteInput(n)) : null,
        field('Écoulement continu (L/s)', num(n.debitContinu, v => update(() => { n.debitContinu = v; }), { min: 0 }), 'Pompes, équipements : 31,7 FE par L/s (2.4.10.3. 1))'),
        n.type === 'colonne' ? field('Long. dév. colonne de ventilation (m)', num(n.ventLongueur, v => update(() => { n.ventLongueur = v; }), { min: 0 }), 'De l’extrémité inférieure à l’air libre (2.5.8.4. 2))') : null),
      h('div', { class: 'row', style: 'margin-top:8px' },
        n.type === 'colonne' ? h('label', { class: 'inline' }, h('input', { type: 'checkbox', checked: n.deviation, onchange: e => update(() => { n.deviation = e.target.checked; if (e.target.checked && !n.pente) n.pente = 50; }) }), 'Déviation horizontale ≥ 1,5 m ', ref('2.4.10.6. 2)')) : null,
        n.type === 'collecteur' ? h('label', { class: 'inline' }, h('input', { type: 'checkbox', checked: n.egoutPublic, onchange: e => update(() => { n.egoutPublic = e.target.checked; }) }), 'Raccordé à l’égout public (en aval du regard principal) ', ref('2.4.9.4. 1)')) : null),
      h('h4', { style: 'margin-top:12px' }, 'Locaux raccordés'),
      chips(state.locaux, n.locaux || (n.locaux = []), id => update(() => toggle(n.locaux, id)), l => `${l.nom}`),
      others.length ? h('h4', { style: 'margin-top:10px' }, 'Réseaux amont') : null,
      others.length ? chips(others, n.amont || (n.amont = []), id => update(() => toggle(n.amont, id)), x => x.nom) : null,
      dnBig(r.dn, `${fmt(r.fe)} FE${r.feCont ? ` (dont ${fmt(r.feCont)} continu)` : ''} · ${r.wc} toilette(s)${n.type === 'colonne' ? ` · max ${fmt(r.feEtageMax)} FE/étage` : ''}`),
      constraintList(r.contraintes),
      r.vent ? h('div', { style: 'margin-top:10px' }, h('h4', null, 'Colonne de ventilation primaire / secondaire'), dnBig(r.vent.dn, `chute DN ${r.dn}, ${fmt(r.fe)} FE, L = ${n.ventLongueur ? fmt(n.ventLongueur) + ' m' : '?'}`), constraintList(r.vent.details), alertList(r.vent.alertes)) : null,
      alertList(r.alertes),
      n.type === 'colonne' ? h('div', { style: 'margin-top:10px' }, schemaColonne(r)) : null);
  }
  function penteInput(n) {
    const known = PENTES.includes(+n.pente);
    return h('div', { class: 'row' },
      sel(known ? n.pente : 'autre', PENTES.map(p => ({ v: p, t: `1:${p}` })).concat([{ v: 'autre', t: 'Autre…' }]), v => update(() => { n.pente = v === 'autre' ? (n.pente || 75) : +v; })),
      known ? null : num(n.pente, v => update(() => { n.pente = v; }), { style: 'width:80px', min: 1 }));
  }

  // ---------------------------------------------------------------------------
  // Module C — ventilation
  // ---------------------------------------------------------------------------
  const TYPE_VENT = {
    colonne: 'Colonne de ventilation primaire / secondaire (2.5.8.4.)',
    branchement: 'Branchement / collecteur de ventilation, ventilation secondaire ou terminale (2.5.8.3.)',
    interne: 'Ventilation interne (2.5.8.1.-B)',
    interne_etage: 'Ventilation interne, appareils sur un même étage (2.5.8.1.-A)',
    individuelle: 'Ventilation individuelle ou commune (2.5.7.1.)',
  };
  function viewVent(R) {
    const colonnes = R.evac.filter(r => r.net.type === 'colonne');
    return h('div', { class: 'stack' },
      h('div', { class: 'section-head' },
        h('div', null, h('h2', null, 'Module C — Ventilation'),
          h('p', null, 'Les colonnes de ventilation des colonnes de chute sont calculées automatiquement (onglet B). Ajouter ici les autres tuyaux de ventilation à dimensionner.')),
        h('button', { class: 'btn primary', onclick: () => update(s => { s.ventilations.push({ id: uid('V'), nom: `Ventilation ${s.ventilations.length + 1}`, type: 'branchement', source: 'manuel', fe: 0, longueur: 0, locaux: [] }); }) }, '+ Tuyau de ventilation')),
      h('div', { class: 'card' }, h('h3', null, 'Exigences de raccordement à rappeler'),
        h('ul', { class: 'constraints', style: 'margin-top:8px' },
          rule('2.5.4.1. 1)', 'Toute colonne de chute doit être prolongée vers le haut en colonne de ventilation primaire.'),
          rule('2.5.4.2. 1)', 'Colonne de chute reliée à des appareils sur plus de 4 étages : colonne de ventilation secondaire, raccordée à la hauteur ou immédiatement sous le tuyau d’évacuation le plus bas (2.5.4.2. 3)).'),
          rule('2.5.4.3. 1)', 'Plus de 11 étages : tuyau de ventilation de chute pour chaque groupe de 5 étages (comptés de haut en bas) et à chaque déviation.'),
          rule('2.5.4.4. 1)', 'Déviation ≥ 1,5 m, partie supérieure sur plus de 2 étages et > 100 FE : tuyaux de ventilation d’équilibrage pour déviations.'),
          rule('2.5.7.2. 2)', 'Les collecteurs sanitaires doivent comporter au moins un tuyau de ventilation de DN ≥ 3.'),
          rule('2.5.8.4. 5)', 'Au moins une colonne de chute ou un tuyau vertical doit se prolonger à l’air libre avec un DN ≥ 3 jusqu’au toit.'),
          rule('2.5.6.5.', 'Débouchés à l’air libre : voir l’article pour les distances et la protection contre le givre (2.5.6.5. 6)).'))),
      colonnes.length ? h('div', { class: 'card' }, h('h3', null, 'Colonnes de ventilation (depuis les colonnes de chute)'),
        h('div', { class: 'table-wrap', style: 'margin-top:8px' }, h('table', { class: 'compact' },
          h('thead', null, h('tr', null, h('th', null, 'Colonne de chute'), h('th', { class: 'num' }, 'DN chute'), h('th', { class: 'num' }, 'FE'), h('th', { class: 'num' }, 'Longueur (m)'), h('th', { class: 'num' }, 'DN ventilation'), h('th', null, 'Référence'))),
          h('tbody', null, colonnes.map(r => h('tr', null, h('td', null, r.net.nom), h('td', { class: 'num' }, r.dn || '—'), h('td', { class: 'num' }, fmt(r.fe)), h('td', { class: 'num' }, r.net.ventLongueur ? fmt(r.net.ventLongueur) : '—'), h('td', { class: 'num' }, r.vent && r.vent.dn ? r.vent.dn : '—'), h('td', null, ref('Tableau 2.5.8.4.'), ' ', ref('2.5.8.4. 3)')))))))) : null,
      R.vent.length ? h('div', { class: 'grid cols-2' }, R.vent.map(ventCard)) : h('p', { class: 'muted' }, 'Aucun tuyau de ventilation ajouté.'),
      h('div', { class: 'banner' }, 'Phase 2 : ventilation en boucle, par collecteur et cas particuliers (2.5.2., 2.5.3.) — le modèle de données accepte de nouveaux types de tuyaux de ventilation.'));
  }
  function rule(r, t) { return h('li', null, h('span', { class: 'why', style: 'color:var(--text)' }, t), ref(r)); }

  function ventCard(r) {
    const v = r.v;
    return h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('input', { class: 'title-input', value: v.nom, onchange: e => update(() => { v.nom = e.target.value; }) }),
        statusBadge(statusOf(r.alertes, !!r.dn)),
        h('button', { class: 'icon-btn', title: 'Supprimer', onclick: () => update(s => { s.ventilations = s.ventilations.filter(x => x !== v); }) }, '×')),
      h('div', { class: 'fields' },
        field('Type', sel(v.type, Object.entries(TYPE_VENT).map(([k, t]) => ({ v: k, t })), x => update(() => { v.type = x; }))),
        v.type !== 'individuelle' ? field('Charge desservie', sel(v.source || 'manuel', [{ v: 'manuel', t: 'Saisie manuelle' }, { v: 'locaux', t: 'Somme des locaux choisis' }], x => update(() => { v.source = x; v.locaux = v.locaux || []; }))) : null,
        v.type !== 'individuelle' && v.source !== 'locaux' ? field('Charge (FE)', num(v.fe, x => update(() => { v.fe = x; }), { min: 0 })) : null,
        v.type === 'interne' && v.source !== 'locaux' ? field('Toilettes desservies', num(v.wc, x => update(() => { v.wc = x; }), { min: 0, step: 1 })) : null,
        v.type === 'branchement' || v.type === 'colonne' ? field('Longueur développée (m)', num(v.longueur, x => update(() => { v.longueur = x; }), { min: 0 }), v.type === 'branchement' ? 'Selon 2.5.8.3. 2) à 5)' : 'Selon 2.5.8.4. 2)') : null,
        v.type === 'colonne' ? field('DN de la colonne de chute', sel(v.dnChute || '4', D.T_2_4_10_6_A.map(r => ({ v: r.dn, t: r.dn })), x => update(() => { v.dnChute = x; }))) : null,
        v.type === 'individuelle' ? field('DN du siphon desservi', sel(v.dnSiphon || '1½', D.T_2_5_7_1.map(r => ({ v: r.siphon, t: r.siphon })), x => update(() => { v.dnSiphon = x; }))) : null),
      v.source === 'locaux' && v.type !== 'individuelle' ? h('div', { style: 'margin-top:8px' }, h('h4', null, 'Locaux'), chips(state.locaux, v.locaux || (v.locaux = []), id => update(() => toggle(v.locaux, id)), l => l.nom)) : null,
      dnBig(r.dn, `${fmt(r.fe)} FE${v.type === 'interne' ? ` · ${r.wc} toilette(s)` : ''}`),
      r.raison ? h('ul', { class: 'constraints' }, h('li', null, h('span', { class: 'dn' }, r.dn ? `DN ${r.dn}` : '—'), h('span', { class: 'why' }, r.raison), ref(r.ref))) : null,
      alertList(r.alertes));
  }

  // ---------------------------------------------------------------------------
  // Module D — alimentation
  // ---------------------------------------------------------------------------
  const PARTIE = { branchement: 'Branchement d’eau général', principal: 'Tuyau principal (avant le 1er chauffe-eau)', distribution: 'Réseau de distribution' };
  function viewAlim(R) {
    const p = state.params;
    const b = R.pression;
    const velOpts = (p.methodeAlim === '2634' ? D.T_2_6_3_4_V : D.T_A_F_V).map(v => ({ v, t: `${fmt(v)} m/s` }));
    return h('div', { class: 'stack' },
      h('div', { class: 'section-head' },
        h('div', null, h('h2', null, 'Module D — Alimentation en eau'),
          h('p', null, 'Le chapitre III exige que le réseau assure le débit de pointe à la pression requise par le fabricant (', ref('2.6.3.1. 1)'), '), selon les règles de l’ASHRAE et de l’ASPE. La note A-2.6.3.1. 2) donne deux méthodes de rechange tabulées, implantées ici ; la méthode simplifiée 2.6.3.4. vise les bâtiments d’un ou deux logements.')),
        h('button', { class: 'btn primary', onclick: () => update(s => { s.reseauxAlim.push({ id: uid('T'), nom: `Tronçon ${s.reseauxAlim.length + 1}`, partie: 'distribution', locaux: [], amont: [] }); }) }, '+ Tronçon')),
      h('div', { class: 'grid cols-2' },
        h('div', { class: 'card' }, h('h3', null, 'Méthode et données'),
          h('div', { class: 'fields', style: 'margin-top:10px' },
            field('Méthode de dimensionnement', sel(p.methodeAlim, Object.entries(METH).map(([v, t]) => ({ v, t })), v => update(s => { s.params.methodeAlim = v; if (v === '2634' && !D.T_2_6_3_4_V.includes(+s.params.vitesse)) s.params.vitesse = 2.4; }))),
            p.methodeAlim !== 'A' ? field('Vitesse maximale (fabricant)', sel(p.vitesse, velOpts, v => update(s => { s.params.vitesse = +v; })), '≤ 3,0 m/s (2.6.3.5. 1))') : null,
            field('Pression statique min. à la limite de propriété (kPa)', num(p.pressionLimite, v => update(s => { s.params.pressionLimite = v; }), { min: 0 })),
            field('Pertes du branchement d’eau général (kPa)', num(p.pertesBranchement, v => update(s => { s.params.pertesBranchement = v; }), { min: 0 })),
            field('Longueur dév. du branchement (m)', num(p.longueurBranchement, v => update(s => { s.params.longueurBranchement = v; }), { min: 0 }), 'Limite de propriété → point d’entrée dans le bâtiment'),
            field('Longueur dév. entrée → robinet le plus éloigné (m)', num(p.longueurDistribution, v => update(s => { s.params.longueurDistribution = v; }), { min: 0 })),
            field('Pertes compteur, RP, DA, traitement (kPa)', num(p.pertesDispositifs, v => update(s => { s.params.pertesDispositifs = v; }), { min: 0 })),
            field('Dénivelé entrée → robinet le plus éloigné (m)', num(p.denivele, v => update(s => { s.params.denivele = v; })), 'Converti à 9,81 kPa/m'),
            field('Pression min. de service, appareil le plus éloigné (kPa)', num(p.pressionMinAppareil, v => update(s => { s.params.pressionMinAppareil = v; }), { min: 0 }), 'Selon la fiche du fabricant (2.6.3.1. 1)) — ex. : W.-C. à robinet de chasse')),
          h('label', { class: 'inline', style: 'margin-top:10px' }, h('input', { type: 'checkbox', checked: p.raccordsMales, onchange: e => update(s => { s.params.raccordsMales = e.target.checked; }) }), 'Raccords à embout mâle (pertes additionnelles)'),
          p.methodeAlim === 'A' ? h('div', { class: 'banner', style: 'margin-top:10px;margin-bottom:0' }, 'Petit bâtiment : ', D.A_2_6_3_1.petitBatiment, ' Les trames de vitesse du tableau imprimé ne sont pas reproduites — vérifier la vitesse admissible du matériau dans le tableau officiel.') : null,
          p.methodeAlim === '2634' ? h('div', { class: 'banner', style: 'margin-top:10px;margin-bottom:0' }, 'Conditions 2.6.3.4. 5) : 1 ou 2 logements / maison en rangée avec branchement distinct ; 100 % des FA privés ; pression ≥ 200 kPa au point d’entrée ; longueur totale ≤ 90 m.') : null),
        h('div', { class: 'card' }, h('h3', null, 'Bilan de pression ', ref('A-2.6.3.1. 2)')),
          h('div', { class: 'table-wrap', style: 'margin-top:10px' }, h('table', { class: 'compact' }, h('tbody', null,
            prow('Pression statique minimale (limite de propriété)', b.P0, 'kPa'),
            prow('− pertes du branchement d’eau général', p.pertesBranchement, 'kPa'),
            prow('= pression ajustée au point d’entrée', b.pAdj, 'kPa', true),
            prow('− compteur, RP, DA, traitement', p.pertesDispositifs, 'kPa'),
            prow(`− hauteur (${fmt(p.denivele)} m × 9,81)`, b.hauteur, 'kPa'),
            prow('− pression minimale de l’appareil', p.pressionMinAppareil, 'kPa'),
            prow('= pression disponible pour les pertes de charge', b.disponible, 'kPa', true),
            prow(`Longueur équivalente (${fmt(p.longueurDistribution)} m × 1,5)`, b.Leq, 'm'),
            prow('Pression disponible par mètre (min. 2,6)', b.parM, 'kPa/m', true)))),
          b.ok === true ? alertList([{ niveau: 'ok', msg: `${fmt(b.parM)} kPa/m ≥ 2,6 kPa/m : les méthodes tabulées de la note A-2.6.3.1. 2) s’appliquent.`, ref: 'A-2.6.3.1. 2)' }]) : null,
          alertList(b.alertes),
          h('p', { class: 'muted', style: 'font-size:12px;margin-top:8px' }, 'La pression résiduelle détaillée (pertes linéaires et singulières par tronçon) relève de la méthode de conception détaillée (ASHRAE / ASPE) — prévue en phase 2.'))),
      R.alim.length ? h('div', { class: 'grid cols-2' }, R.alim.map(alimCard)) : h('p', { class: 'muted' }, 'Aucun tronçon.'),
      h('div', { class: 'banner' }, h('strong', null, 'Débit de pointe. '), 'Le CNP 2020 ne publie pas de courbe de demande (courbe de Hunter). Le débit affiché « indicatif » est interpolé linéairement entre les couples (FA, L/s) de la colonne de vitesse choisie du ', ref('Tableau A-2.6.3.1. 2)-F'), ' : valeur informative à confirmer par une méthode détaillée. Recirculation d’eau chaude : phase 2.'));
  }
  function prow(l, v, u, strong) { return h('tr', null, h('td', null, strong ? h('strong', null, l) : l), h('td', { class: 'num' }, strong ? h('strong', null, `${fmt(v)} ${u}`) : `${fmt(v)} ${u}`)); }

  function alimCard(r) {
    const t = r.tr;
    const others = state.reseauxAlim.filter(x => x !== t);
    return h('div', { class: 'card' },
      h('div', { class: 'card-head' },
        h('input', { class: 'title-input', value: t.nom, onchange: e => update(() => { t.nom = e.target.value; }) }),
        statusBadge(statusOf(r.alertes, !!r.dn)),
        h('button', { class: 'icon-btn', title: 'Supprimer', onclick: () => update(s => { s.reseauxAlim = s.reseauxAlim.filter(x => x !== t); s.reseauxAlim.forEach(x => { x.amont = (x.amont || []).filter(id => id !== t.id); }); }) }, '×')),
      h('div', { class: 'fields' },
        field('Partie du réseau', sel(t.partie || 'distribution', Object.entries(PARTIE).map(([v, x]) => ({ v, t: x })), v => update(() => { t.partie = v; }))),
        field('FA additionnels (gicleurs, irrigation…)', num(t.faSupp, v => update(() => { t.faSupp = v; }), { min: 0 }))),
      h('h4', { style: 'margin-top:12px' }, 'Locaux desservis'),
      chips(state.locaux, t.locaux || (t.locaux = []), id => update(() => toggle(t.locaux, id)), l => l.nom),
      others.length ? h('h4', { style: 'margin-top:10px' }, 'Tronçons en aval desservis par celui-ci') : null,
      others.length ? chips(others, t.amont || (t.amont = []), id => update(() => toggle(t.amont, id)), x => x.nom) : null,
      dnBig(r.dn, `FA total ${fmt(r.fa.t)} (froide ${fmt(r.fa.f)} · chaude ${fmt(r.fa.c)})`),
      h('div', { class: 'row muted', style: 'font-size:12.5px' },
        r.capacite ? h('span', null, `Capacité du DN à la vitesse choisie : ${fmt(r.capacite)} L/s`) : null,
        h('span', null, `Débit indicatif : ${r.debit ? fmt(r.debit) + ' L/s' : 'hors plage du tableau'}`)),
      constraintList(r.details),
      alertList(r.alertes));
  }

  // ---------------------------------------------------------------------------
  // Module E — appareils minimaux
  // ---------------------------------------------------------------------------
  function viewMin() {
    const m = state.minimaux;
    m.besoins = m.besoins || [];
    return h('div', { class: 'stack' },
      h('div', { class: 'section-head' }, h('div', null, h('h2', null, 'Module E — Appareils sanitaires minimaux'),
        h('p', null, 'Nombre minimal de W.-C., urinoirs et lavabos selon l’usage et le nombre de personnes.'))),
      h('div', { class: 'banner warn' }, h('strong', null, 'Table non disponible — à confirmer. '),
        'Le nombre minimal d’appareils sanitaires ne fait pas partie du chapitre III – Plomberie : il relève de la section 3.7. de la division B du CNB, adoptée par le Code de construction du Québec, chapitre I – Bâtiment. Le PDF fourni ne contient pas cette section (il n’y fait référence qu’à l’article 3.7.2.5.). Aucune valeur n’est inventée : saisir ci-dessous les quantités exigées, ou fournir la section 3.7. pour automatiser ce module.'),
      h('div', { class: 'card' }, h('h3', null, 'Occupation'),
        h('div', { class: 'fields', style: 'margin-top:10px' },
          field('Type d’occupation / usage', txt(m.occupation, v => update(s => { s.minimaux.occupation = v; }))),
          field('Hommes', num(m.hommes, v => update(s => { s.minimaux.hommes = v; }), { min: 0, step: 1 })),
          field('Femmes', num(m.femmes, v => update(s => { s.minimaux.femmes = v; }), { min: 0, step: 1 })),
          field('Référence (article / tableau du ch. I)', txt(m.reference, v => update(s => { s.minimaux.reference = v; }), { placeholder: 'ex. : CNB 3.7.2.2., tableau …' })))),
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h3', null, 'Appareils requis (saisie manuelle)'), h('button', { class: 'btn sm', onclick: () => update(s => { s.minimaux.besoins.push({ id: uid('b'), preset: 'wc_res6', qte: 1, groupe: 'Hommes' }); }) }, '+ Ligne')),
        m.besoins.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'compact' },
          h('thead', null, h('tr', null, h('th', null, 'Groupe'), h('th', null, 'Appareil'), h('th', { class: 'num' }, 'Qté requise'), h('th', null, ''))),
          h('tbody', null, m.besoins.map(b => h('tr', null,
            h('td', null, txt(b.groupe, v => update(() => { b.groupe = v; }), { style: 'width:120px' })),
            h('td', null, sel(b.preset, D.PRESETS.map(p => ({ v: p.id, t: p.nom })), v => update(() => { b.preset = v; }))),
            h('td', { class: 'num' }, num(b.qte, v => update(() => { b.qte = Math.max(0, v || 0); }), { style: 'width:70px', min: 0, step: 1 })),
            h('td', null, h('button', { class: 'icon-btn', onclick: () => update(s => { s.minimaux.besoins = s.minimaux.besoins.filter(x => x !== b); }) }, '×'))))))) : h('p', { class: 'muted' }, 'Aucune ligne.'),
        h('div', { class: 'row', style: 'margin-top:10px' },
          h('span', { class: 'muted' }, 'Réinjecter dans le module A :'),
          state.etages.length ? sel(ui.minEtage || state.etages[0].id, state.etages.map(e => ({ v: e.id, t: e.nom })), v => { ui.minEtage = v; }) : null,
          h('button', { class: 'btn primary', disabled: !m.besoins.length || !state.etages.length, onclick: () => update(s => {
            const groupes = [...new Set(s.minimaux.besoins.map(b => b.groupe || 'Groupe'))];
            groupes.forEach(g => {
              const apps = s.minimaux.besoins.filter(b => (b.groupe || 'Groupe') === g && b.qte > 0).map(b => { const p = E.PRESET[b.preset]; return { id: uid('a'), preset: b.preset, dwv: p.dwv, sup: p.sup, qte: b.qte }; });
              if (apps.length) s.locaux.push({ id: uid('L'), nom: `${g} (minimaux)`, etageId: ui.minEtage || s.etages[0].id, usage: 'pub', appareils: apps });
            });
            tab = 'locaux';
          }) }, 'Créer les locaux'))));
  }

  // ---------------------------------------------------------------------------
  // Tables du code
  // ---------------------------------------------------------------------------
  function viewTables() {
    const q = norm(ui.tableSearch);
    const f = x => !q || norm(x).includes(q);
    const NLNP = v => v === D.NP ? 'NP' : v === Infinity ? 'NL' : fmt(v);
    const so = v => v === null ? 's/o' : fmt(v);
    return h('div', { class: 'stack' },
      h('div', { class: 'section-head' }, h('div', null, h('h2', null, 'Tables du code'), h('p', null, 'Valeurs transcrites du ', D.EDITION.court, '. NL = non limitée ; NP = non permise ; s/o = sans objet.')),
        h('input', { type: 'search', placeholder: 'Filtrer les appareils…', value: ui.tableSearch, id: 'tsearch', oninput: e => { ui.tableSearch = e.target.value; render(); const el = document.getElementById('tsearch'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }, style: 'min-width:260px' })),
      tableCard('Tableau 2.4.9.3. / 2.4.10.2. — Charge hydraulique des appareils', ['Appareil sanitaire', 'Tubulure min. (DN)', 'Facteur d’évacuation'],
        D.T_2_4_9_3.filter(x => f(x.nom)).map(x => [x.nom + (x.note ? ` — ${x.note}` : ''), x.tub || 's/o', fmt(x.fe)])),
      tableCard('Tableaux 2.6.3.2.-A / -B / -C — Facteurs d’alimentation', ['Appareil', 'DN min.', 'Privé : froide', 'chaude', 'total', 'Public : froide', 'chaude', 'total'],
        D.T_2_6_3_2_A.filter(x => f(x.nom)).map(x => [x.nom + (x.ref ? ` (${x.ref})` : ''), x.dn || 's/o', ...x.priv.map(so), ...x.pub.map(so)])),
      q ? null : h('div', { class: 'stack' },
        tableCard('Tableau 2.6.3.2.-D — Appareils non listés', ['DN d’alimentation', 'Usage privé', 'Usage public'], D.T_2_6_3_2_D.map(r => [r.dn, fmt(r.priv), fmt(r.pub)])),
        tableCard('Tableau 2.4.10.6.-A — Colonnes de chute', ['DN', 'mm', 'FE max.', 'FE max. par étage'], D.T_2_4_10_6_A.map(r => [r.dn, E.dnMm(r.dn) || 'n.d.', fmt(r.max), fmt(r.parEtage)])),
        tableCard('Tableau 2.4.10.6.-B — Branchements d’évacuation', ['DN', 'mm', 'FE max.'], D.T_2_4_10_6_B.map(r => [r.dn, E.dnMm(r.dn) || 'n.d.', fmt(r.max)])),
        tableCard('Tableau 2.4.10.6.-C — Collecteurs / branchements d’égout sanitaire', ['DN'].concat(D.PENTES_C.map(p => `1:${p}`)), D.T_2_4_10_6_C.map(r => [r.dn, ...r.max.map(so)])),
        tableCard('Tableau 2.5.8.1.-A — Ventilation interne d’étage', ['DN', 'FE max.'], D.T_2_5_8_1_A.map(r => [r.dn, fmt(r.max)])),
        tableCard('Tableau 2.5.8.1.-B — Ventilation interne', ['DN', 'Sans toilette', 'Au plus 2 toilettes'], D.T_2_5_8_1_B.map(r => [r.dn, so(r.sansWc), so(r.wc2)])),
        tableCard('Tableau 2.5.8.3. — Branchements de ventilation (longueur max., m)', ['FE'].concat(D.T_2_5_8_3_DN.map(d => 'DN ' + d)), D.T_2_5_8_3.map(r => [fmt(r.fe), ...r.L.map(NLNP)])),
        tableCard('Tableau 2.5.8.4. — Colonnes de ventilation (longueur max., m)', ['Chute', 'FE'].concat(D.T_2_5_8_4_DN.map(d => 'DN ' + d)), D.T_2_5_8_4.map(r => [r.chute, fmt(r.fe), ...r.L.map(NLNP)])),
        tableCard('Tableau 2.5.7.1. — Ventilation selon le siphon', ['Siphon (DN)', 'Ventilation min. (DN)'], D.T_2_5_7_1.map(r => [r.siphon, r.vent])),
        tableCard('Tableau A-2.6.3.1. 2)-F — Perte de pression moyenne', ['DN'].concat(D.T_A_F_V.flatMap(v => [`${fmt(v)} m/s : L/s`, 'FA'])), D.T_A_F.map(r => [r.dn, ...r.q.flatMap((q, i) => [fmt(q), fmt(r.fa[i])])])),
        ...D.T_A_A.map(p => tableCard(`Tableau A-2.6.3.1. 2)-A — Petits bâtiments, ${p.plage} (FA max.)`, ['Branch.', 'Distr.'].concat(D.T_A_A_L.map(l => `${l} m`)), p.rows.map(r => [r[0], r[1], ...r[2].map(x => fmt(x))]))),
        tableCard('Tableau 2.6.3.4. — 1 ou 2 logements (FA max.)', ['DN'].concat(D.T_2_6_3_4_V.map(v => `${fmt(v)} m/s`)), D.T_2_6_3_4.map(r => [r.dn, ...r.fa.map(x => fmt(x))])),
        tableCard('Équivalences métriques du DN', ['DN (po)', 'DN (mm)'], D.DN.map(d => [d.dn, d.mm === null ? 'non donné' : d.mm]))));
  }
  function tableCard(title, head, rows) {
    return h('div', { class: 'card' }, h('h3', null, title),
      h('div', { class: 'table-wrap', style: 'margin-top:8px' }, h('table', { class: 'compact' },
        h('thead', null, h('tr', null, head.map((c, i) => h('th', { class: i ? 'num' : '' }, c)))),
        h('tbody', null, rows.length ? rows.map(r => h('tr', null, r.map((c, i) => h('td', { class: i ? 'num' : '' }, c)))) : h('tr', null, h('td', { colspan: head.length, class: 'muted' }, 'Aucun résultat.'))))));
  }

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------
  function csvCell(v) { const s2 = v === null || v === undefined ? '' : String(v); return /[;"\n]/.test(s2) ? `"${s2.replace(/"/g, '""')}"` : s2; }
  const dec = v => (v === null || v === undefined || v === '') ? '' : String(v).replace('.', ',');
  function exportCSV() {
    const R = E.calcProject(state);
    const L = [];
    const row = (...c) => L.push(c.map(csvCell).join(';'));
    row('Projet', state.nom); row('Édition', D.EDITION.titre); row('Avertissement', 'Outil de prédimensionnement — la conformité finale doit être validée par un professionnel contre le texte officiel du chapitre III.'); row();
    row('LOCAUX ET APPAREILS'); row('Étage', 'Local', 'Évacuation (tabl. 2.4.9.3.)', 'Alimentation (tabl. 2.6.3.2.)', 'Qté', 'Usage', 'FE unitaire', 'FE', 'FA froide', 'FA chaude', 'FA total');
    R.locaux.forEach(({ local, t }) => {
      const et = (state.etages.find(e => e.id === local.etageId) || {}).nom || '';
      t.lignes.forEach(li => row(et, local.nom, li.app.dwv ? (E.DWV[li.app.dwv] || {}).nom : '', li.fa ? li.fa.nom : '', li.q, li.usage === 'pub' ? 'public' : 'privé', dec(li.fe), dec(li.fe === null ? '' : E.round(li.q * li.fe, 3)), dec(li.fa ? E.round(li.q * li.fa.f, 3) : ''), dec(li.fa ? E.round(li.q * li.fa.c, 3) : ''), dec(li.fa ? E.round(li.q * li.fa.t, 3) : '')));
    });
    row();
    row('ÉVACUATION'); row('Réseau', 'Type', 'Pente 1:x', 'FE', 'Toilettes', 'DN retenu', 'mm', 'DN ventilation', 'Justification', 'Alertes');
    R.evac.forEach(r => row(r.net.nom, TYPE_EVAC[r.net.type], r.net.pente || '', dec(r.fe), r.wc, r.dn || 'hors tableau', E.dnMm(r.dn) || '', r.vent ? r.vent.dn || '' : '', r.contraintes.map(c => `${c.ref}: ${c.raison}`).join(' | '), r.alertes.concat(r.vent ? r.vent.alertes : []).map(a => `[${a.niveau}] ${a.msg} (${a.ref})`).join(' | ')));
    row();
    row('VENTILATION'); row('Tuyau', 'Type', 'FE', 'Longueur (m)', 'DN', 'Référence', 'Justification', 'Alertes');
    R.vent.forEach(r => row(r.v.nom, TYPE_VENT[r.v.type], dec(r.fe), dec(r.v.longueur), r.dn || 'hors tableau', r.ref, r.raison, r.alertes.map(a => `[${a.niveau}] ${a.msg}`).join(' | ')));
    row();
    row('ALIMENTATION'); row('Méthode', METH[state.params.methodeAlim], 'Vitesse (m/s)', dec(state.params.vitesse));
    row('Pression ajustée (kPa)', dec(R.pression.pAdj), 'Disponible pour pertes (kPa)', dec(R.pression.disponible), 'kPa/m', dec(R.pression.parM));
    row('Tronçon', 'Partie', 'FA froide', 'FA chaude', 'FA total', 'DN', 'mm', 'Capacité (L/s)', 'Débit indicatif (L/s)', 'Justification', 'Alertes');
    R.alim.forEach(r => row(r.tr.nom, PARTIE[r.tr.partie], dec(r.fa.f), dec(r.fa.c), dec(r.fa.t), r.dn || 'hors tableau', E.dnMm(r.dn) || '', dec(r.capacite), dec(r.debit), r.details.map(d => `${d.ref}: ${d.raison}`).join(' | '), r.alertes.map(a => `[${a.niveau}] ${a.msg}`).join(' | ')));
    download(`${slug()}-calcul.csv`, '﻿' + L.join('\r\n'), 'text/csv;charset=utf-8');
  }

  function printReport() {
    const R = E.calcProject(state);
    const root = document.getElementById('print-root');
    const tbl = (head, rows) => h('table', null, h('thead', null, h('tr', null, head.map(c => h('th', null, c)))), h('tbody', null, rows.map(r => h('tr', null, r.map(c => h('td', null, c))))));
    root.replaceChildren(
      h('h1', null, `Calcul de plomberie — ${state.nom || ''}`),
      h('p', null, D.EDITION.titre, ' · ', new Date().toLocaleDateString('fr-CA')),
      h('div', { class: 'warnbox' }, 'Outil de prédimensionnement — la conformité finale doit être validée par un professionnel contre le texte officiel du chapitre III.'),
      h('h2', null, 'Locaux et appareils'),
      tbl(['Étage', 'Local', 'Appareils', 'FE', 'FA total'], R.locaux.map(({ local, t }) => [(state.etages.find(e => e.id === local.etageId) || {}).nom || '', local.nom, (local.appareils || []).map(a => `${a.qte} × ${(E.PRESET[a.preset] || {}).nom || (E.DWV[a.dwv] || {}).nom || (E.SUP[a.sup] || {}).nom || a.sup}`).join(', '), fmt(t.fe), fmt(t.fa.t)])),
      h('h2', null, 'Réseaux d’évacuation'),
      tbl(['Réseau', 'Type', 'FE', 'DN', 'Ventilation', 'Justification'], R.evac.map(r => [r.net.nom, TYPE_EVAC[r.net.type] + (r.net.pente ? ` (1:${r.net.pente})` : ''), fmt(r.fe), r.dn ? `${r.dn} (${E.dnMm(r.dn) || 'n.d.'} mm)` : 'hors tableau', r.vent && r.vent.dn ? r.vent.dn : '', r.contraintes.map(c => `${c.ref} — ${c.raison}`).join('; ')])),
      h('h2', null, 'Ventilation'),
      tbl(['Tuyau', 'Type', 'FE', 'DN', 'Justification'], R.vent.map(r => [r.v.nom, TYPE_VENT[r.v.type], fmt(r.fe), r.dn || 'hors tableau', `${r.ref} — ${r.raison}`])),
      h('h2', null, 'Alimentation en eau'),
      h('p', null, `${METH[state.params.methodeAlim]}, vitesse ${fmt(state.params.vitesse)} m/s. Pression ajustée ${fmt(R.pression.pAdj)} kPa ; disponible pour les pertes ${fmt(R.pression.disponible)} kPa ; ${fmt(R.pression.parM)} kPa/m (min. 2,6).`),
      tbl(['Tronçon', 'FA f / c / total', 'DN', 'Débit indicatif', 'Justification'], R.alim.map(r => [r.tr.nom, `${fmt(r.fa.f)} / ${fmt(r.fa.c)} / ${fmt(r.fa.t)}`, r.dn ? `${r.dn} (${E.dnMm(r.dn) || 'n.d.'} mm)` : 'hors tableau', r.debit ? `${fmt(r.debit)} L/s` : '—', r.details.map(d => `${d.ref} — ${d.raison}`).join('; ')])),
      h('h2', null, 'Alertes'),
      h('ul', null, [].concat(...R.evac.map(r => r.alertes.concat(r.vent ? r.vent.alertes : []).filter(a => a.niveau !== 'info').map(a => `${r.net.nom} : ${a.msg} (${a.ref})`)), ...R.vent.map(r => r.alertes.filter(a => a.niveau !== 'info').map(a => `${r.v.nom} : ${a.msg} (${a.ref})`)), ...R.alim.map(r => r.alertes.filter(a => a.niveau !== 'info').map(a => `${r.tr.nom} : ${a.msg} (${a.ref})`)), R.pression.alertes.map(a => `Pression : ${a.msg} (${a.ref})`)).map(t => h('li', null, t))));
    window.print();
  }

  // ---------------------------------------------------------------------------
  // Démarrage
  // ---------------------------------------------------------------------------
  document.getElementById('edition').textContent = D.EDITION.court + ' — ' + D.EDITION.vigueur;
  document.getElementById('btn-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-pdf').addEventListener('click', printReport);
  document.getElementById('btn-theme').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('cnp-theme', next); } catch (e) { /* ignore */ }
  });
  try { const t = localStorage.getItem('cnp-theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) { /* ignore */ }
  render();
})();
