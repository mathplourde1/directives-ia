import React, { useState, useRef } from 'react';
import PHASES, { PERMISSION_LEVELS } from '@/components/directives/directivesData';
import DirectivesSection from '@/components/directives/DirectivesSection';
import DirectivesGabarit from '@/components/directives/DirectivesGabarit';
import BrioSectionDirectives from '@/components/directives/BrioSectionDirectives';
import ExigenceEditModal from '@/components/restrictions/ExigenceEditModal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PageRightNav from '@/components/guide/PageRightNav';

const DIRECTIVES_NAV_ITEMS = [
  { id: 'evaluation-ciblee-d', label: 'Évaluation ciblée', conditional: false },
  { id: 'brio-d', label: 'Suggestion Brio', conditional: true },
  { id: 'synthese-container-d', label: 'Synthèses', conditional: true },
  { id: 'declaration-d', label: 'Déclaration étudiante', conditional: true },
  { id: 'sauvegarde-d', label: 'Sauvegarde', conditional: false },
];

function AProposButton() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit', fontSize: '1.0em', fontWeight: 'bold', color: '#231F20', textTransform: 'uppercase' }}>
        <span style={{ fontSize: '0.8em', color: '#888', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
        🧠 À propos…
      </button>
      {open && (
        <div style={{ textAlign: 'left', paddingTop: 6 }}>
          Cette application vous est offerte gratuitement par le <a href="https://www.enseigner.ulaval.ca/a-propos" target="_blank" className="text-blue-800 underline">Service de soutien à l'enseignement</a> de l'Université Laval, CC-BY 4.0 2026.<br /><br />
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a839e74b536a607f6d9cc8/ce0c154f6_20240824_AIA_FR_EN.png" alt="Aidée de l'intelligence artificielle" style={{ float: 'right', width: 80, marginLeft: 12, marginBottom: 4 }} />
          <b>Déclaration d'utilisation de SIA: Aidée de l'IA.</b><br />Tous les textes présentés ont été validés par l'équipe de développement. Le code a été développé avec l'aide de ChatGPT et Claude, mais plus particulièrement par Base44 pour la version actuelle.
        </div>
      )}
    </div>
  );
}

const ALL_ACTIONS = PHASES.flatMap(p => p.actions);

function initPermissions() {
  const p = {};
  ALL_ACTIONS.forEach(a => { p[a.id] = 'non'; });
  return p;
}

export default function Directives() {
  const [identification, setIdentification] = useState({ cours: '', session: '', enseignants: '', evaluation: '' });
  const [identErrors, setIdentErrors] = useState({ cours: false, evaluation: false, enseignants: false });
  const [permissions, setPermissions] = useState(initPermissions());

  const [sectionState, setSectionState] = useState({});
  const [sectionMode, setSectionMode] = useState('aucune');
  const [sectionPrecisions, setSectionPrecisions] = useState('');
  const [loadKey, setLoadKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitKey, setSubmitKey] = useState(0);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [copyMsgs, setCopyMsgs] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [exigencesMode, setExigencesMode] = useState('aucune');
  const [exigences, setExigences] = useState([]);
  const [exigenceTypeModal, setExigenceTypeModal] = useState(false);
  const [exigenceEditModal, setExigenceEditModal] = useState(null);
  const fileInputRef = useRef();

  const identFilled = identification.cours.trim() && identification.evaluation.trim() && identification.enseignants.trim();
  const errorStyle = { color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' };

  function handlePermissionChange(actionId, newPermission) {
    setPermissions(prev => ({ ...prev, [actionId]: newPermission }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newIdentErrors = { cours: !identification.cours.trim(), evaluation: !identification.evaluation.trim(), enseignants: !identification.enseignants.trim() };
    setIdentErrors(newIdentErrors);
    if (newIdentErrors.cours || newIdentErrors.evaluation || newIdentErrors.enseignants) { setSubmitStatus({ ok: false }); return; }
    if (sectionState.hasEmptyCustom) { setShowErrors(true); setSubmitStatus({ ok: false, emptyCustom: true }); return; }
    if (sectionState.hasNoActionInColumns) { setSubmitStatus({ ok: false, noActionInColumns: true }); return; }
    setShowErrors(false);
    setSubmitted(true);
    setSubmitKey(k => k + 1);
    setSubmitStatus({ ok: true });
    setTimeout(() => { document.getElementById('synthese-container-d')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  }

  // Build active permissions (only placed actions)
  const activePermissions = {};
  ALL_ACTIONS.forEach(a => {
    const state = sectionState;
    const columnOrder = state.columnOrder || {};
    const removedIds = state.removedIds || [];
    const inAColumn = Object.values(columnOrder).some(ids => (ids || []).includes(a.id));
    if (inAColumn && !removedIds.includes(a.id)) {
      activePermissions[a.id] = permissions[a.id] || 'non';
    }
  });

  function buildTableHTML(withHeading = false) {
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Tableau synthèse — Directives d'utilisation des SIA</h2>` : '';
    html += `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;margin-bottom:12px;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;font-weight:bold;">Phase</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;font-weight:bold;">Permissions SIA</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;font-weight:bold;">Actions SIA</th>
      </tr></thead><tbody>`;

    for (const phase of PHASES) {
      let firstRow = true;
      let rowCount = 0;
      for (const level of PERMISSION_LEVELS) {
        const actions = phase.actions.filter(a => activePermissions[a.id] === level.id);
        if (actions.length > 0) rowCount++;
      }
      if (rowCount === 0) continue;
      for (const level of PERMISSION_LEVELS) {
        const actions = phase.actions.filter(a => activePermissions[a.id] === level.id);
        if (actions.length === 0) continue;
        const items = actions.map(a => `<li style="display:list-item;list-style-type:disc;">${a.libelle}</li>`).join('');
        html += `<tr>`;
        if (firstRow) { html += `<td style="border:1px solid #ccc;padding:8px;font-weight:bold;vertical-align:top;" rowspan="${rowCount}">${phase.libelle}</td>`; firstRow = false; }
        html += `<td style="border:1px solid #ccc;padding:8px;font-weight:bold;vertical-align:top;">${level.libelle}</td>
          <td style="border:1px solid #ccc;padding:8px;vertical-align:top;"><ul style="margin:0;padding-left:18px;list-style-type:disc;">${items}</ul></td>
        </tr>`;
      }
    }
    html += '</tbody></table>';
    const prec = sectionState.precisions || '';
    if (prec) html += `<p style="font-family:Arial,sans-serif;font-size:0.92em;margin:0 0 8px 0;"><em>Précisions :</em> ${prec}</p>`;
    if (exigencesMode === 'inclure' && exigences.length > 0) {
      html += `<strong style="font-family:Arial,sans-serif;">EXIGENCES DE DÉCLARATION</strong><br>`;
      exigences.forEach(exig => {
        const typeLabels = { iagraphie: 'Références et IAgraphie', traces: 'Conserver les traces', logique: 'Expliquer la logique' };
        html += `<p style="font-family:Arial,sans-serif;font-weight:bold;margin:8px 0 2px 0;">${typeLabels[exig.type]}</p>`;
        html += `<div style="font-family:Arial,sans-serif;margin:0 0 8px 0;">${exig.description || ''}</div>`;
      });
    }
    return html;
  }

  function buildTextHTML(withHeading = false) {
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Synthèse en texte continu — Directives d'utilisation des SIA</h2>` : '';
    for (const phase of PHASES) {
      html += `<strong style="font-family:Arial,sans-serif;">${phase.libelle.toUpperCase()}</strong><br>`;
      let hasContent = false;
      for (const level of PERMISSION_LEVELS) {
        const actions = phase.actions.filter(a => activePermissions[a.id] === level.id);
        if (actions.length === 0) continue;
        hasContent = true;
        html += `<ul style="font-family:Arial,sans-serif;margin:0 0 6px 0;padding-left:22px;list-style-type:disc;">`;
        html += `<li style="display:list-item;list-style-type:disc;margin:2px 0;"><strong>${level.libelle}</strong>`;
        html += `<ul style="margin:2px 0 4px 0;padding-left:18px;list-style-type:disc;">`;
        actions.forEach(a => { html += `<li style="display:list-item;list-style-type:disc;margin:1px 0;">${a.libelle}</li>`; });
        html += `</ul></li></ul>`;
      }
      if (!hasContent) html += `<p style="font-family:Arial,sans-serif;font-style:italic;margin:0 0 6px 0;">Aucune action spécifiée pour cette phase.</p>`;
      html += '<hr style="margin:10px 0;" />';
    }
    const prec = sectionState.precisions || '';
    if (prec) html += `<p style="font-family:Arial,sans-serif;font-size:0.92em;margin:4px 0 0 0;"><em>Précisions :</em> ${prec}</p>`;
    if (exigencesMode === 'inclure' && exigences.length > 0) {
      html += `<strong style="font-family:Arial,sans-serif;">EXIGENCES DE DÉCLARATION</strong><br>`;
      exigences.forEach(exig => {
        const typeLabels = { iagraphie: 'Références et IAgraphie', traces: 'Conserver les traces', logique: 'Expliquer la logique' };
        html += `<p style="font-family:Arial,sans-serif;font-weight:bold;margin:8px 0 2px 0;">${typeLabels[exig.type]}</p>`;
        html += `<div style="font-family:Arial,sans-serif;margin:0 0 8px 0;">${exig.description || ''}</div>`;
      });
    }
    return html;
  }

  async function copyRichText(html, key) {
    const plain = html.replace(/<[^>]+>/g, '');
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([plain], { type: 'text/plain' });
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]);
      } else { await navigator.clipboard.writeText(html); }
      setCopyMsgs(m => ({ ...m, [key]: true }));
      setTimeout(() => setCopyMsgs(m => ({ ...m, [key]: false })), 1800);
    } catch { alert('Erreur lors de la copie.'); }
  }

  function downloadWord(htmlContent, filename) {
    const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>Export</title>
      <style>body{font-family:Arial,sans-serif;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:8px;}th{background-color:#f2f2f2;}</style>
      </head><body>${htmlContent}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  // ---- XML Save ----
  function handleSave() {
    const escXml = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const state = sectionState;
    const columnOrder = state.columnOrder || {};
    const removedIds = state.removedIds || [];
    const customActions = state.customActions || {};

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<directives-ia version="1.0">\n`;
    xml += `  <identification>\n    <cours>${escXml(identification.cours)}</cours>\n    <session>${escXml(identification.session)}</session>\n    <enseignants>${escXml(identification.enseignants)}</enseignants>\n    <evaluation>${escXml(identification.evaluation)}</evaluation>\n  </identification>\n`;
    xml += `  <mode>${escXml(sectionState.mode || 'aucune')}</mode>\n`;
    xml += `  <precisions>${escXml(sectionState.precisions || '')}</precisions>\n`;
    xml += `  <colonnes>\n`;
    Object.entries(columnOrder).forEach(([colId, ids]) => { xml += `    <colonne id="${colId}">${escXml((ids || []).join(','))}</colonne>\n`; });
    xml += `  </colonnes>\n`;
    xml += `  <retires>${escXml(removedIds.join(','))}</retires>\n`;
    xml += `  <actions_custom>\n`;
    Object.values(customActions).forEach(a => { xml += `    <action id="${escXml(a.id)}" libelle="${escXml(a.libelle)}" colId="${escXml(a.colId)}" />\n`; });
    xml += `  </actions_custom>\n`;
    xml += `  <permissions>\n`;
    ALL_ACTIONS.forEach(a => { if (permissions[a.id]) xml += `    <perm actionId="${escXml(a.id)}">${escXml(permissions[a.id])}</perm>\n`; });
    Object.values(customActions).forEach(a => { if (permissions[a.id]) xml += `    <perm actionId="${escXml(a.id)}">${escXml(permissions[a.id])}</perm>\n`; });
    xml += `  </permissions>\n`;
    xml += `  <exigences mode="${escXml(exigencesMode)}">\n`;
    exigences.forEach(exig => { xml += `    <exigence id="${escXml(exig.id)}" type="${escXml(exig.type)}">\n      <description>${escXml(exig.description)}</description>\n    </exigence>\n`; });
    xml += `  </exigences>\n</directives-ia>`;

    const now = new Date();
    const dateStr = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    const filename = `directives-${slugify(identification.cours || 'cours')}-${slugify(identification.evaluation || 'evaluation')}-${dateStr}.txt`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  // ---- XML Load ----
  function handleLoad(e) {
    setSaveError('');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(ev.target.result, 'application/xml');
        if (doc.querySelector('parseerror') || doc.querySelector('parsererror')) { setSaveError("Le fichier XML est invalide ou corrompu."); return; }
        const root = doc.querySelector('directives-ia');
        if (!root) { setSaveError("Ce fichier n'est pas un fichier de sauvegarde valide pour les directives."); return; }

        const identNode = root.querySelector('identification');
        if (identNode) {
          const getI = (tag) => identNode.querySelector(tag)?.textContent ?? '';
          setIdentification({ cours: getI('cours'), session: getI('session'), enseignants: getI('enseignants'), evaluation: getI('evaluation') });
        }
        const loadedPrecisions = root.querySelector('precisions')?.textContent || '';

        const columnOrder = {};
        doc.querySelectorAll('colonnes colonne').forEach(col => {
          const colId = col.getAttribute('id');
          const ids = col.textContent.split(',').map(s => s.trim()).filter(Boolean);
          columnOrder[colId] = ids;
        });
        const retiresText = root.querySelector('retires')?.textContent || '';
        const removedIds = retiresText.split(',').map(s => s.trim()).filter(Boolean);
        const customActions = {};
        doc.querySelectorAll('actions_custom action').forEach(a => {
          const id = a.getAttribute('id'); const libelle = a.getAttribute('libelle') || ''; const colId = a.getAttribute('colId') || 'non';
          if (id) customActions[id] = { id, libelle, colId };
        });

        const newPermissions = { ...initPermissions() };
        doc.querySelectorAll('permissions perm').forEach(p => {
          const actionId = p.getAttribute('actionId');
          if (actionId) newPermissions[actionId] = p.textContent;
        });

        const exigencesNode = root.querySelector('exigences');
        const newExigencesMode = exigencesNode?.getAttribute('mode') || 'aucune';
        const newExigences = [];
        exigencesNode?.querySelectorAll('exigence').forEach(exigNode => {
          const id = exigNode.getAttribute('id'); const type = exigNode.getAttribute('type'); const description = exigNode.querySelector('description')?.textContent || '';
          if (id && type) newExigences.push({ id, type, description });
        });

        const loadedMode = root.querySelector('mode')?.textContent || 'aucune';
        setPermissions(newPermissions);
        setSectionState({ columnOrder, removedIds, customActions, hasEmptyCustom: false, precisions: loadedPrecisions });
        setSectionMode(loadedMode);
        setSectionPrecisions(loadedPrecisions);
        setExigencesMode(newExigencesMode);
        setExigences(newExigences);
        setSubmitted(false);
        setSubmitStatus(null);
        setLoadKey(k => k + 1);
      } catch { setSaveError("Erreur lors de la lecture du fichier."); }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <style>{`
          :root { --rouge: #E41E25; --bleu-ul: #00A4E4; }
          h1 { color: #E41E25; text-align: center; }
          .btn-primary { background-color: #00A4E4; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
          .btn-primary:hover { background-color: #0084b0; }
          .btn-secondary { background-color: #6c757d; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
          .btn-secondary:hover { background-color: #545b62; }
          .synthese-section { margin-top: 28px; padding: 16px; border: 1px solid #ffc103; border-radius: 8px; background: #fdfdff; }
          .copy-ok { color: green; font-weight: bold; margin-left: 10px; }
          .synthese-apercu ul { list-style-type: disc !important; padding-left: 22px !important; }
          .synthese-apercu ul ul { list-style-type: disc !important; padding-left: 18px !important; }
          .synthese-apercu li { display: list-item !important; }
        `}</style>

        <h1 className="mr-12 mb-4 ml-12 text-2xl font-semibold">Outil de rédaction de directives d'utilisation des SIA pour une évaluation</h1>
        <div className="mb-2">Ce formulaire interactif s’adresse aux personnes enseignantes de l’Université Laval. Il vous permet de rédiger les directives d'autorisation d'utilisation des systèmes d'intelligence artificielle (SIA) selon trois phases de réalisation d’une évaluation (à l’intention des personnes étudiantes).</div>

        {/* Instructions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8, color: '#231F20' }} className="text-lg font-bold uppercase">❓ Comment ça fonctionne?</h2>
            <ol style={{ listStyleType: 'decimal', paddingLeft: 20, marginTop: 8 }} className="pb-2">
              <li>Remplissez la section d'identification.</li>
              <li>À partir de la zone d'actions suggérées, faites glisser les actions qu'un SIA est ou n'est pas autorisé à faire vers la colonne correspondante. Les actions non déplacées seront exclues des directives. 	Au besoin, ajoutez des actions personnalisées ou des précisions pédagogiques dans les espaces prévus à cet effet.</li>
              <li>Inscrivez, s’il y a lieu, les exigences de référencement et d’IAgraphie ou l'un des autres types d'exigences de déclaration (conserver des traces ou expliquer la logique d'utilisation).</li>
              <li>Cliquez sur <strong>Générer les directives</strong> pour visualiser et réviser la synthèse des directives.</li>
              <li>Partagez ces directives dans Brio ou intégrez-les aux consignes de l'évaluation.</li>
            </ol>
            Un doute sur la démarche? Un <a href="https://www.enseigner.ulaval.ca/qui-peut-maider" target="_blank" className="text-blue-800 underline">conseiller ou une conseillère en faculté</a> peut vous accompagner.<br />
            Vos données ne sont pas conservées. Créez un <a href="#sauvegarde-d" className="text-blue-800 underline">fichier de sauvegarde</a> pour reprendre votre travail plus tard.
          </div>
          <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 4 }}>
            <AProposButton />
          </div>
        </div>

        {/* Identification */}
        <div id="evaluation-ciblee-d" style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, color: '#231F20', fontSize: '1.1em', fontWeight: 'bold', marginBottom: 6 }}>Évaluation ciblée</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Identifiant du cours <span style={{ color: '#E41E25' }}>*</span></label>
              <input type="text" value={identification.cours} onChange={e => { setIdentification(p => ({ ...p, cours: e.target.value })); setIdentErrors(p => ({ ...p, cours: false })); }}
                placeholder="ex. IFT-1001"
                style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: identErrors.cours ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: identErrors.cours ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
              {identErrors.cours && <span style={errorStyle}>⚠ Ce champ est requis</span>}
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Session</label>
              <input type="text" value={identification.session} onChange={e => setIdentification(p => ({ ...p, session: e.target.value }))}
                placeholder="ex. Hiver 2026"
                style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Nom de l'évaluation <span style={{ color: '#E41E25' }}>*</span></label>
              <input type="text" value={identification.evaluation} onChange={e => { setIdentification(p => ({ ...p, evaluation: e.target.value })); setIdentErrors(p => ({ ...p, evaluation: false })); }}
                placeholder="ex. Travail final"
                style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: identErrors.evaluation ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: identErrors.evaluation ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
              {identErrors.evaluation && <span style={errorStyle}>⚠ Ce champ est requis</span>}
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Personne(s) enseignante(s) <span style={{ color: '#E41E25' }}>*</span></label>
              <input type="text" value={identification.enseignants} onChange={e => { setIdentification(p => ({ ...p, enseignants: e.target.value })); setIdentErrors(p => ({ ...p, enseignants: false })); }}
                placeholder="ex. Marie Tremblay"
                style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: identErrors.enseignants ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: identErrors.enseignants ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
              {identErrors.enseignants && <span style={errorStyle}>⚠ Ce champ est requis</span>}
            </div>
          </div>
        </div>

        {/* Main section */}
        <form onSubmit={handleSubmit} style={{ opacity: identFilled ? 1 : 0.5, position: 'relative' }}>
          {!identFilled && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs requis" />}

          <DirectivesSection
            key={loadKey}
            permissions={permissions}
            onPermissionChange={handlePermissionChange}
            onStateChange={(state) => setSectionState(state)}
            showErrors={showErrors}
            initialMode={sectionMode}
            initialPrecisions={sectionPrecisions}
            initialColumnOrder={sectionState.columnOrder}
            initialRemovedIds={sectionState.removedIds}
            initialCustomActions={sectionState.customActions}
          />

          {/* Exigences de déclaration */}
          <div style={{ background: 'white', borderRadius: 8, border: '2px solid #444444', marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ background: '#444444', color: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1em' }}>Exigences de déclaration</span>
              <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
                <button type="button" onClick={() => setExigencesMode('aucune')}
                  style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: exigencesMode === 'aucune' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: exigencesMode === 'aucune' ? 'rgba(255,255,255,0.9)' : 'transparent', color: exigencesMode === 'aucune' ? '#444444' : 'white', transition: 'background 0.15s', borderRadius: '999px 0 0 999px' }}>
                  Aucune exigence
                </button>
                <button type="button" onClick={() => setExigencesMode('inclure')}
                  style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: exigencesMode === 'inclure' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: exigencesMode === 'inclure' ? 'rgba(255,255,255,0.9)' : 'transparent', color: exigencesMode === 'inclure' ? '#444444' : 'white', transition: 'background 0.15s', borderRadius: '0 999px 999px 0' }}>
                  Inclure des exigences
                </button>
              </div>
            </div>
            {exigencesMode === 'inclure' && (
              <div style={{ padding: '12px 14px' }}>
                {exigences.length === 0 ? (
                  <p style={{ fontSize: '0.85em', color: '#999', fontStyle: 'italic', margin: '8px 0' }}>Aucune exigence ajoutée.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exigences.map((exig, idx) => {
                      const typeLabels = { iagraphie: 'Références et IAgraphie', traces: 'Conserver les traces', logique: 'Expliquer la logique' };
                      return (
                        <div key={exig.id} style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 4, padding: '10px', display: 'flex', alignItems: 'flex-start', fontSize: '0.9em', gap: 10 }}>
                          <div style={{ display: 'flex', gap: 2, flexShrink: 0, paddingTop: 4 }}>
                            <button type="button" onClick={() => { if (idx > 0) { const n = [...exigences]; [n[idx-1],n[idx]]=[n[idx],n[idx-1]]; setExigences(n); } }} disabled={idx===0} style={{ background: 'none', border: 'none', cursor: idx===0?'not-allowed':'pointer', color: idx===0?'#ccc':'#444', fontSize: '1em', padding: '2px 4px' }}>▲</button>
                            <button type="button" onClick={() => { if (idx < exigences.length-1) { const n = [...exigences]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; setExigences(n); } }} disabled={idx===exigences.length-1} style={{ background: 'none', border: 'none', cursor: idx===exigences.length-1?'not-allowed':'pointer', color: idx===exigences.length-1?'#ccc':'#444', fontSize: '1em', padding: '2px 4px' }}>▼</button>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#444444', marginBottom: 6 }}>{typeLabels[exig.type]}</div>
                            {exig.description && <div style={{ fontSize: '0.9em', color: '#555', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: exig.description }} />}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 4 }}>
                            <button type="button" onClick={() => setExigenceEditModal({ exigenceId: exig.id, type: exig.type })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0056b3', fontSize: '0.9em', padding: '2px 4px' }}>✎</button>
                            <button type="button" onClick={() => setExigences(prev => prev.filter(e => e.id !== exig.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E41E25', fontSize: '0.9em', padding: '2px 4px' }}>×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button type="button" onClick={() => setExigenceTypeModal(true)} style={{ background: '#444444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold', marginTop: 8 }}>
                  + Ajouter une exigence
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="submit" className="btn-primary" style={{ fontSize: '1.425em', padding: '14px 28px' }}>✅ Générer les directives mises en forme</button>
            {submitStatus && (submitStatus.ok ? (
              <span style={{ background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>✔️ Sommaires générés avec succès.</span>
            ) : submitStatus.emptyCustom ? (
              <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Au moins une action personnalisée est vide.</span>
            ) : submitStatus.noActionInColumns ? (
              <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Placez au moins une action dans une colonne de permission.</span>
            ) : (
              <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Certains champs obligatoires ne sont pas remplis.</span>
            ))}
          </div>
        </form>

        {/* SYNTHESIS SECTIONS */}
        {submitted && (
          <div key={submitKey}>
            <BrioSectionDirectives permissions={activePermissions} />
          <div id="synthese-container-d">
            <div className="synthese-section">
              <h2 className="my-2 text-lg font-semibold text-center">Synthèses</h2>
              <div style={{ marginBottom: 12 }}>Deux options de mise en forme sont disponibles. Utilisez la fonction <strong>Copier pour coller en ligne (Brio)</strong> ou téléchargez une version Word.</div>
              <Accordion type="single" defaultValue="texte-continu" collapsible className="mt-4">
                <AccordionItem value="texte-continu">
                  <AccordionTrigger className="text-base font-semibold">Synthèse en texte continu</AccordionTrigger>
                  <AccordionContent>
                    <div className="synthese-apercu" style={{ border: '1px solid #aaa', background: '#fff', padding: 12, borderRadius: 6 }} dangerouslySetInnerHTML={{ __html: buildTextHTML() }} />
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <button type="button" className="btn-primary" onClick={() => copyRichText(buildTextHTML(), 'text-brio')}>Copier pour coller en ligne (Brio)</button>
                      {copyMsgs['text-brio'] && <span className="copy-ok">Copié !</span>}
                      <button type="button" className="btn-secondary" onClick={() => downloadWord(buildTextHTML(true), 'directives-texte.doc')}>Télécharger en format Word</button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tableau">
                  <AccordionTrigger className="text-base font-semibold">Tableau synthèse</AccordionTrigger>
                  <AccordionContent>
                    <div className="synthese-apercu" dangerouslySetInnerHTML={{ __html: buildTableHTML() }} />
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <button type="button" className="btn-primary" onClick={() => copyRichText(buildTableHTML(), 'table-brio')}>Copier pour coller en ligne (Brio)</button>
                      {copyMsgs['table-brio'] && <span className="copy-ok">Copié !</span>}
                      <button type="button" className="btn-secondary" onClick={() => downloadWord(buildTableHTML(true), 'directives-tableau.doc')}>Télécharger en format Word</button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div id="declaration-d" style={{ marginTop: 20, padding: '16px 20px', border: '1px solid #1895FD', borderRadius: 8, background: 'white' }}>
              <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: '1.3em', fontWeight: 'bold', color: '#231F20' }}>Formulaire de déclaration pour personnes étudiantes</h2>
              <div style={{ marginBottom: 16, fontSize: '0.93em', color: '#444', lineHeight: 1.6 }}>
                Téléchargez un gabarit Word pré-rempli avec vos directives, que vous pouvez transmettre aux personnes étudiantes.
              </div>
              <DirectivesGabarit
                identification={identification}
                permissions={activePermissions}
                precisions={sectionState.precisions || ''}
                exigences={exigencesMode === 'inclure' ? exigences : []}
                isGenerated={submitted}
              />
            </div>
          </div>
          </div>
        )}

        {/* Exigence Type Modal */}
        {exigenceTypeModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: 10, padding: '24px 28px', maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1.05em', fontWeight: 'bold' }}>Sélectionner le type d'exigence</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ type: 'iagraphie', label: 'Références et IAgraphie' }, { type: 'traces', label: 'Conserver les traces' }, { type: 'logique', label: "Expliquer la logique d'utilisation" }].map(req => (
                  <button key={req.type} type="button" onClick={() => {
                    const id = `exig-${Date.now()}-${Math.random()}`;
                    const defaultDesc = req.type === 'iagraphie' ? 'Veuillez respecter les <a href="https://www.bibl.ulaval.ca/services/soutien-a-lapprentissage/citation-de-sources/comment-citer-des-sources" target="_blank" style="color:#0056b3;text-decoration:underline;">règles de citation de l\'IA</a> proposées par la Bibliothèque de l\'Université Laval.' : '';
                    setExigences(prev => [...prev, { id, type: req.type, description: defaultDesc }]);
                    setExigenceEditModal({ exigenceId: id, type: req.type });
                    setExigenceTypeModal(false);
                  }} style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 4, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', fontSize: '0.9em', fontWeight: '500' }}
                    onMouseEnter={e => e.target.style.background = '#e8e8e8'} onMouseLeave={e => e.target.style.background = '#f5f5f5'}>
                    {req.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button type="button" onClick={() => setExigenceTypeModal(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {exigenceEditModal && (
          <ExigenceEditModal isOpen={true} onClose={() => setExigenceEditModal(null)}
            onSave={(html) => { setExigences(prev => prev.map(ex => ex.id === exigenceEditModal.exigenceId ? { ...ex, description: html } : ex)); }}
            initialValue={exigences.find(e => e.id === exigenceEditModal.exigenceId)?.description || ''}
            exigenceType={exigenceEditModal.type}
          />
        )}

        {/* Save & Load */}
        <div id="sauvegarde-d" style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8, background: 'white' }}>
          <h2 style={{ marginTop: 0, color: '#231F20' }} className="my-2 text-xl font-semibold text-center">Sauvegarde et restauration</h2>
          <p style={{ fontSize: '0.88em', color: '#555', marginBottom: 12 }}>🔒 Vos données ne sont pas conservées automatiquement. Créez un fichier de sauvegarde pour reprendre votre travail plus tard.</p>
          <button type="button" className="btn-primary" onClick={handleSave}>💾 Créer un fichier de sauvegarde</button>
          <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>📂 Importer un fichier de sauvegarde</button>
          <input ref={fileInputRef} type="file" accept=".xml,.txt" style={{ display: 'none' }} onChange={handleLoad} />
          {saveError && <div style={{ color: '#E41E25', marginTop: 10, padding: '8px 12px', background: '#fff4f4', border: '1px solid #E41E25', borderRadius: 5 }}>⚠ {saveError}</div>}
        </div>
      </div>
      <PageRightNav submitted={submitted} items={DIRECTIVES_NAV_ITEMS} />
    </div>
  );
}