import React, { useState, useRef } from 'react';
import BLOOM_CATEGORIES, { PERMISSION_LEVELS } from '@/components/restrictions/restrictionsData';
import CategorySection from '@/components/restrictions/CategorySection';
import BrioSectionRestrictions from '@/components/restrictions/BrioSectionRestrictions';
import RestrictionsGabarit from '@/components/restrictions/RestrictionsGabarit';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PageRightNav from '@/components/guide/PageRightNav';

const RESTRICTIONS_NAV_ITEMS = [
  { id: 'evaluation-ciblee-r', label: 'Évaluation ciblée', conditional: false },
  { id: 'synthese-container-r', label: 'Synthèses', conditional: true },
  { id: 'declaration-r', label: 'Déclaration étudiante', conditional: true },
  { id: 'sauvegarde-r', label: 'Sauvegarde', conditional: false },
];

function AProposButton() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit', fontSize: '1.0em', fontWeight: 'bold', color: '#231F20', textTransform: 'uppercase' }}>
        <span style={{ fontSize: '0.8em', color: '#888', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
        🧠 À propos…
      </button>
      {open && (
        <div style={{ textAlign: 'left', paddingTop: 6 }}>
          Cette application vous est offerte gratuitement par le <a href="https://www.enseigner.ulaval.ca/a-propos" target="_blank" className="text-blue-800 underline">Service de soutien à l'enseignement</a> de l'Université Laval.<br /><br />
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a839e74b536a607f6d9cc8/ce0c154f6_20240824_AIA_FR_EN.png" alt="Aidée de l'intelligence artificielle" style={{ float: 'right', width: 80, marginLeft: 12, marginBottom: 4 }} />
          <b>Déclaration d'utilisation de SIA: Aidée de l'IA.</b><br />L'idée originale, la logique et les contenus de cette application ont été développés par des humains, qui ont utilisé des SIA conversationnels pour aider avec la génération de texte et la reformulation (ChatGPT, Gemini et Microsoft Copilot). Ce travail est basé sur un guide destiné au personnel enseignant du Service pédagogique FSA ULaval. Tous les textes présentés ont été validés par l'équipe de développement. Le code a été développé par Mathieu Plourde avec l'aide de ChatGPT et Claude, mais plus particulièrement par Base44 pour cette version actuelle.<br /><br />
          Elle est développée et maintenue par Mathieu Plourde, CC-BY 4.0 2026 (version alpha 5).
        </div>
      )}
    </div>
  );
}

// Initialize all actions to 'non' permission
function initPermissions() {
  const p = {};
  BLOOM_CATEGORIES.forEach(cat => cat.actions.forEach(a => { p[a.id] = 'non'; }));
  return p;
}

export default function Restrictions() {
  const [identification, setIdentification] = useState({ cours: '', session: '', enseignants: '', evaluation: '' });
  const [identErrors, setIdentErrors] = useState({ cours: false, evaluation: false, enseignants: false });
  const [permissions, setPermissions] = useState(initPermissions());
  // precisions keyed by category id
  const [precisions, setPrecisions] = useState({});
  // categoryModes keyed by category id: 'aucune' | 'restreindre'
  const [categoryModes, setCategoryModes] = useState({});
  // per-category state: { columnOrder, removedIds, customActions }
  const [catStates, setCatStates] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitKey, setSubmitKey] = useState(0);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [copyMsgs, setCopyMsgs] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef();

  const identFilled = identification.cours.trim() && identification.evaluation.trim() && identification.enseignants.trim();
  const errorStyle = { color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' };

  function handlePermissionChange(actionId, newPermission) {
    setPermissions(prev => ({ ...prev, [actionId]: newPermission }));
  }

  function handlePrecisionsChange(catId, text) {
    setPrecisions(prev => ({ ...prev, [catId]: text }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newIdentErrors = { cours: !identification.cours.trim(), evaluation: !identification.evaluation.trim(), enseignants: !identification.enseignants.trim() };
    setIdentErrors(newIdentErrors);
    if (newIdentErrors.cours || newIdentErrors.evaluation || newIdentErrors.enseignants) {
      setSubmitStatus({ ok: false });
      return;
    }
    // Check for empty custom actions
    const hasEmptyCustom = Object.values(catStates).some(s => s.hasEmptyCustom);
    if (hasEmptyCustom) {
      setShowErrors(true);
      setSubmitStatus({ ok: false, emptyCustom: true });
      return;
    }
    setShowErrors(false);
    setSubmitted(true);
    setSubmitKey(k => k + 1);
    setSubmitStatus({ ok: true, time: new Date() });
    setTimeout(() => { document.getElementById('synthese-container-r')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  }

  // Get all active actions for a category (excluding removed, including custom)
  function getCatActiveActions(cat) {
    const state = catStates[cat.id] || {};
    const removedIds = state.removedIds || [];
    const customActions = state.customActions || {};
    const columnOrder = state.columnOrder || {};

    const base = cat.actions.filter(a => !removedIds.includes(a.id));
    const customs = Object.values(customActions).filter(a => !removedIds.includes(a.id));
    const all = [...base, ...customs];

    // Return in column order
    const seen = new Set();
    const ordered = [];
    const allIds = new Set(all.map(a => a.id));
    Object.values(columnOrder).forEach(ids => {
      (ids || []).forEach(id => {
        if (allIds.has(id) && !seen.has(id)) { seen.add(id); ordered.push(all.find(a => a.id === id)); }
      });
    });
    all.forEach(a => { if (!seen.has(a.id)) ordered.push(a); });
    return ordered.filter(Boolean);
  }

  // Get all active actions across all restricted categories (excludes removed)
  function getAllActiveActions() {
    const all = [];
    BLOOM_CATEGORIES.forEach(cat => {
      if ((categoryModes[cat.id] || 'aucune') === 'restreindre') {
        getCatActiveActions(cat).forEach(a => all.push(a));
      }
    });
    return all;
  }

  // Build HTML helpers
  function buildIdentLine() {
    const parts = [];
    if (identification.cours?.trim()) parts.push(`Cours : ${identification.cours}`);
    if (identification.evaluation?.trim()) parts.push(`Évaluation : ${identification.evaluation}`);
    if (identification.session?.trim()) parts.push(`Session : ${identification.session}`);
    if (identification.enseignants?.trim()) parts.push(`Personne(s) enseignante(s) : ${identification.enseignants}`);
    return parts.join(' | ');
  }

  function buildIdentHeader() {
    const line = buildIdentLine();
    return line ? `<p style="font-family:Arial,sans-serif;margin-bottom:12px;">${line}</p>` : '';
  }

  function buildTableHTML(withHeading = false) {
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Tableau synthèse — Restrictions d'utilisation des SIA</h2>` : '';
    html += buildIdentHeader();
    for (const cat of BLOOM_CATEGORIES) {
      const mode = categoryModes[cat.id] || 'aucune';
      html += `<h3 style="font-family:Arial,sans-serif;font-weight:bold;margin:16px 0 4px 0;">${cat.libelle}</h3>`;
      if (mode === 'aucune') {
        html += `<p style="font-family:Arial,sans-serif;font-style:italic;color:#555;margin:0 0 12px 0;">Aucune restriction — toutes les actions sont autorisées sans restriction.</p>`;
        continue;
      }
      const prec = precisions[cat.id] || '';
      html += `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;margin-bottom:12px;">
        <thead><tr>
          <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;font-weight:bold;">Permissions SIA</th>
          <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;font-weight:bold;">Actions SIA</th>
        </tr></thead><tbody>`;
      // Group actions by permission level, in order of PERMISSION_LEVELS
      PERMISSION_LEVELS.forEach(level => {
        const actions = getCatActiveActions(cat).filter(a => (permissions[a.id] || 'non') === level.id);
        if (actions.length === 0) return;
        const actionItems = actions.map(a => `<li style="font-weight:normal;">${a.libelle || 'Action personnalisée'}</li>`).join('');
        html += `<tr>
          <td style="border:1px solid #ccc;padding:8px;font-weight:bold;color:${level.color};vertical-align:top;">${level.libelle}</td>
          <td style="border:1px solid #ccc;padding:8px;vertical-align:top;"><ul style="margin:0;padding-left:18px;">${actionItems}</ul></td>
        </tr>`;
      });
      html += '</tbody></table>';
      if (prec) html += `<p style="font-family:Arial,sans-serif;font-size:0.92em;color:#444;margin:0 0 8px 0;"><em>Précisions :</em> ${prec}</p>`;
    }
    return html;
  }

  function buildTextHTML(withHeading = false) {
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Synthèse en texte continu — Restrictions d'utilisation des SIA</h2>` : '';
    html += buildIdentHeader();
    for (const cat of BLOOM_CATEGORIES) {
      const mode = categoryModes[cat.id] || 'aucune';
      const prec = precisions[cat.id] || '';
      html += `<h3 style="font-family:Arial,sans-serif;font-weight:bold;margin:16px 0 4px 0;">${cat.libelle}</h3>`;
      if (mode === 'aucune') {
        html += `<p style="font-family:Arial,sans-serif;font-style:italic;color:#555;margin:0 0 12px 0;">Aucune restriction — toutes les actions sont autorisées sans restriction.</p>`;
      } else {
        // Group by permission level
        PERMISSION_LEVELS.forEach(level => {
          const actions = getCatActiveActions(cat).filter(a => (permissions[a.id] || 'non') === level.id);
          if (actions.length === 0) return;
          html += `<p style="font-family:Arial,sans-serif;margin:8px 0 2px 0;font-weight:bold;color:${level.color};">Actions SIA ${level.libelle}s</p>`;
          html += `<ul style="font-family:Arial,sans-serif;margin:0 0 6px 0;padding-left:22px;">`;
          actions.forEach(action => {
            html += `<li style="font-weight:normal;margin:2px 0;">${action.libelle || 'Action personnalisée'}</li>`;
          });
          html += `</ul>`;
        });
        if (prec) html += `<p style="font-family:Arial,sans-serif;font-size:0.92em;color:#444;margin:6px 0 0 0;"><em>Précisions :</em> ${prec}</p>`;
      }
      html += '<hr style="margin:12px 0;" />';
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
      } else {
        await navigator.clipboard.writeText(html);
      }
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
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  const activePermissions = {};
  getAllActiveActions().forEach(a => { activePermissions[a.id] = permissions[a.id] || 'non'; });


  function handleCategoryModeChange(catId, newMode) {
    setCategoryModes(prev => ({ ...prev, [catId]: newMode }));
  }

  function handleCatStateChange(catId, state) {
    setCatStates(prev => ({ ...prev, [catId]: state }));
  }

  // ---- XML Save ----
  function handleSave() {
    const escapeXml = (str) => String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<restrictions-ia version="1.0">\n`;
    xml += `  <identification>\n`;
    xml += `    <cours>${escapeXml(identification.cours)}</cours>\n`;
    xml += `    <session>${escapeXml(identification.session)}</session>\n`;
    xml += `    <enseignants>${escapeXml(identification.enseignants)}</enseignants>\n`;
    xml += `    <evaluation>${escapeXml(identification.evaluation)}</evaluation>\n`;
    xml += `  </identification>\n`;
    xml += `  <categories>\n`;
    BLOOM_CATEGORIES.forEach(cat => {
      const mode = categoryModes[cat.id] || 'aucune';
      const prec = precisions[cat.id] || '';
      const state = catStates[cat.id] || {};
      const columnOrder = state.columnOrder || {};
      const removedIds = state.removedIds || [];
      const customActions = state.customActions || {};
      xml += `    <categorie id="${cat.id}">\n`;
      xml += `      <mode>${escapeXml(mode)}</mode>\n`;
      xml += `      <precisions>${escapeXml(prec)}</precisions>\n`;
      xml += `      <colonnes>\n`;
      Object.entries(columnOrder).forEach(([colId, ids]) => {
        xml += `        <colonne id="${colId}">${escapeXml((ids || []).join(','))}</colonne>\n`;
      });
      xml += `      </colonnes>\n`;
      xml += `      <retires>${escapeXml(removedIds.join(','))}</retires>\n`;
      xml += `      <actions_custom>\n`;
      Object.values(customActions).forEach(a => {
        xml += `        <action id="${escapeXml(a.id)}" libelle="${escapeXml(a.libelle)}" colId="${escapeXml(a.colId)}" />\n`;
      });
      xml += `      </actions_custom>\n`;
      xml += `      <permissions>\n`;
      cat.actions.forEach(a => {
        if (permissions[a.id]) {
          xml += `        <perm actionId="${escapeXml(a.id)}">${escapeXml(permissions[a.id])}</perm>\n`;
        }
      });
      Object.values(customActions).forEach(a => {
        if (permissions[a.id]) {
          xml += `        <perm actionId="${escapeXml(a.id)}">${escapeXml(permissions[a.id])}</perm>\n`;
        }
      });
      xml += `      </permissions>\n`;
      xml += `    </categorie>\n`;
    });
    xml += `  </categories>\n</restrictions-ia>`;

    const now = new Date();
    const dateStr = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    const coursPart = identification.cours ? slugify(identification.cours) : 'cours';
    const evalPart = identification.evaluation ? slugify(identification.evaluation) : 'evaluation';
    const filename = `restrictions-${coursPart}-${evalPart}-${dateStr}.txt`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
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
        const root = doc.querySelector('restrictions-ia');
        if (!root) { setSaveError("Ce fichier n'est pas un fichier de sauvegarde valide pour les restrictions."); return; }

        // Restore identification
        const identNode = root.querySelector('identification');
        if (identNode) {
          const getI = (tag) => identNode.querySelector(tag)?.textContent ?? '';
          setIdentification({ cours: getI('cours'), session: getI('session'), enseignants: getI('enseignants'), evaluation: getI('evaluation') });
        }

        // Restore categories
        const newCategoryModes = {};
        const newPrecisions = {};
        const newPermissions = { ...initPermissions() };
        const newCatStates = {};

        doc.querySelectorAll('categorie').forEach(catNode => {
          const catId = catNode.getAttribute('id');
          if (!catId) return;
          newCategoryModes[catId] = catNode.querySelector('mode')?.textContent || 'aucune';
          newPrecisions[catId] = catNode.querySelector('precisions')?.textContent || '';

          // Column order
          const columnOrder = {};
          catNode.querySelectorAll('colonne').forEach(col => {
            const colId = col.getAttribute('id');
            const ids = col.textContent.split(',').map(s => s.trim()).filter(Boolean);
            columnOrder[colId] = ids;
          });

          // Removed ids
          const retiresText = catNode.querySelector('retires')?.textContent || '';
          const removedIds = retiresText.split(',').map(s => s.trim()).filter(Boolean);

          // Custom actions
          const customActions = {};
          catNode.querySelectorAll('action_custom, actions_custom action').forEach(a => {
            const id = a.getAttribute('id');
            const libelle = a.getAttribute('libelle') || '';
            const colId = a.getAttribute('colId') || 'non';
            if (id) customActions[id] = { id, libelle, colId };
          });

          newCatStates[catId] = { columnOrder, removedIds, customActions, hasEmptyCustom: false };

          // Permissions
          catNode.querySelectorAll('perm').forEach(p => {
            const actionId = p.getAttribute('actionId');
            if (actionId) newPermissions[actionId] = p.textContent;
          });
        });

        setCategoryModes(newCategoryModes);
        setPrecisions(newPrecisions);
        setPermissions(newPermissions);
        setCatStates(newCatStates);
        setSubmitted(false);
        setSubmitStatus(null);
      } catch {
        setSaveError("Erreur lors de la lecture du fichier. Vérifiez qu'il s'agit d'un fichier de sauvegarde valide.");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <style>{`
          :root { --rouge: #E41E25; --bleu-ul: #00A4E4; }
          body { font-size: smaller; }
          h1 { color: #E41E25; text-align: center; }
          .btn-primary { background-color: #00A4E4; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
          .btn-primary:hover { background-color: #0084b0; }
          .btn-secondary { background-color: #6c757d; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
          .btn-secondary:hover { background-color: #545b62; }
          .synthese-section { margin-top: 28px; padding: 16px; border: 1px solid #ffc103; border-radius: 8px; background: #fdfdff; }
          .synthese-section h3 { margin-top: 0; color: #231F20; }
          .copy-ok { color: green; font-weight: bold; margin-left: 10px; }
          .synth-table { width: 100%; border-collapse: collapse; background: white; }
          .synth-table th, .synth-table td { border: 1px solid #ccc; padding: 10px; text-align: left; vertical-align: top; }
          .synth-table th { background-color: #F2F2F2; }
        `}</style>

        <h1 className="mr-12 mb-4 ml-12 text-2xl font-semibold">Rédaction de directives - restrictions d'utilisation des SIA</h1>
        <div className="mb-2">Ce formulaire interactif permet de définir, action par action, le niveau d'autorisation d'utilisation des systèmes d'intelligence artificielle (SIA) selon les catégories de la taxonomie de Bloom.</div>

        {/* Instructions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8, color: '#231F20' }} className="text-lg font-bold uppercase">❓ Comment ça fonctionne?</h2>
            <ol style={{ listStyleType: 'decimal', paddingLeft: 20, marginTop: 8 }} className="pb-2">
              <li>Remplissez la section d'identification.</li>
              <li>Pour chaque catégorie de la taxonomie de Bloom, choisissez de restreindre ou non l'usage des SIA.</li>
              <li>Si vous choisissez de restreindre, déplacez chaque action dans la colonne correspondant au niveau de permission souhaité.</li>
              <li>Cliquez sur <strong>Générer les directives</strong> pour obtenir les synthèses.</li>
              <li>Partagez ces directives dans Brio ou intégrez-les aux consignes de l'évaluation.</li>
            </ol>
            💡 Un doute sur la démarche? Un <a href="https://www.enseigner.ulaval.ca/qui-peut-maider" target="_blank" className="text-blue-800 underline">conseiller ou une conseillère en faculté</a> peut vous accompagner.<br />
            🔒 Vos données ne sont pas conservées. Créez un <a href="#sauvegarde-r" className="text-blue-800 underline">fichier de sauvegarde</a> pour reprendre votre travail plus tard.
          </div>
          <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 4 }}>
            <AProposButton />
          </div>
        </div>

        {/* Identification */}
        <div id="evaluation-ciblee-r" style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: 20 }}>
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

        {/* Categories */}
        <form onSubmit={handleSubmit} style={{ opacity: identFilled ? 1 : 0.5, position: 'relative' }}>
          {!identFilled && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs requis" />}

          {BLOOM_CATEGORIES.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              mode={categoryModes[cat.id] || 'aucune'}
              onModeChange={handleCategoryModeChange}
              permissions={permissions}
              precisions={precisions}
              onPermissionChange={handlePermissionChange}
              onPrecisionsChange={handlePrecisionsChange}
              onStateChange={handleCatStateChange}
              showErrors={showErrors}
            />
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="submit" className="btn-primary" style={{ fontSize: '1.425em', padding: '14px 28px' }}>✅ Générer les directives mises en forme</button>
            {submitStatus && (submitStatus.ok ? (
              <span style={{ background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>✔️ Sommaires générés avec succès.</span>
            ) : submitStatus.emptyCustom ? (
              <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Au moins une action personnalisée est vide. Veuillez y inscrire une action ou la retirer.</span>
            ) : (
              <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Certains champs obligatoires ne sont pas remplis correctement.</span>
            ))}
          </div>
        </form>

        {/* SYNTHESIS SECTIONS */}
        {submitted && (
          <div id="synthese-container-r" key={submitKey}>
            {/* Brio */}
            <BrioSectionRestrictions permissions={activePermissions} />

            {/* Synthèses */}
            <div className="synthese-section">
              <h2 className="my-2 text-lg font-semibold text-center">Synthèses</h2>
              <div style={{ marginBottom: 12 }}>Deux options de mise en forme sont disponibles. Utilisez la fonction <strong>Copier pour coller en ligne (Brio)</strong> ou téléchargez une version Word à intégrer dans vos directives.</div>

              <Accordion type="single" defaultValue="texte-continu" collapsible className="mt-4">
                <AccordionItem value="texte-continu">
                  <AccordionTrigger className="text-base font-semibold">Synthèse en texte continu</AccordionTrigger>
                  <AccordionContent>
                    <div style={{ border: '1px solid #aaa', background: '#fff', padding: 12, borderRadius: 6 }}
                      dangerouslySetInnerHTML={{ __html: buildTextHTML() }} />
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <button type="button" className="btn-primary" onClick={() => copyRichText(buildTextHTML(), 'text-brio')}>Copier pour coller en ligne (Brio)</button>
                      {copyMsgs['text-brio'] && <span className="copy-ok">Copié !</span>}
                      <button type="button" className="btn-secondary" onClick={() => downloadWord(buildTextHTML(true), 'restrictions-texte.doc')}>Télécharger en format Word</button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tableau">
                  <AccordionTrigger className="text-base font-semibold">Tableau synthèse</AccordionTrigger>
                  <AccordionContent>
                    <div dangerouslySetInnerHTML={{ __html: buildTableHTML() }} />
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <button type="button" className="btn-primary" onClick={() => copyRichText(buildTableHTML(), 'table-brio')}>Copier pour coller en ligne (Brio)</button>
                      {copyMsgs['table-brio'] && <span className="copy-ok">Copié !</span>}
                      <button type="button" className="btn-secondary" onClick={() => downloadWord(buildTableHTML(true), 'restrictions-tableau.doc')}>Télécharger en format Word</button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Gabarit Word déclaration */}
            <div id="declaration-r" style={{ marginTop: 20, padding: '16px 20px', border: '1px solid #1895FD', borderRadius: 8, background: 'white' }}>
              <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: '1.3em', fontWeight: 'bold', color: '#231F20' }}>
                Formulaire de déclaration pour personnes étudiantes
              </h2>
              <div style={{ marginBottom: 16, fontSize: '0.93em', color: '#444', lineHeight: 1.6 }}>
                Téléchargez un gabarit Word pré-rempli avec vos directives, que vous pouvez transmettre aux personnes étudiantes pour leur déclaration d'utilisation des SIA.
              </div>
              <RestrictionsGabarit
                identification={identification}
                allActions={getAllActiveActions()}
                permissions={permissions}
                precisions={precisions}
                isGenerated={submitted}
              />
            </div>
          </div>
        )}

        {/* ===== SAVE & LOAD ===== */}
        <div id="sauvegarde-r" style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8, background: 'white' }}>
        <h2 style={{ marginTop: 0, color: '#231F20' }} className="my-2 text-xl font-semibold text-center">Sauvegarde et restauration</h2>
        <p style={{ fontSize: '0.88em', color: '#555', marginBottom: 12 }}>
          🔒 Vos données ne sont pas conservées automatiquement. Créez un fichier de sauvegarde pour reprendre votre travail plus tard.
        </p>
        <button type="button" className="btn-primary" onClick={handleSave}>💾 Créer un fichier de sauvegarde</button>
        <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>📂 Importer un fichier de sauvegarde</button>
        <input ref={fileInputRef} type="file" accept=".xml,.txt" style={{ display: 'none' }} onChange={handleLoad} />
        {saveError && (
          <div style={{ color: '#E41E25', marginTop: 10, padding: '8px 12px', background: '#fff4f4', border: '1px solid #E41E25', borderRadius: 5 }}>
            ⚠ {saveError}
          </div>
        )}
        </div>

      </div>
      <PageRightNav submitted={submitted} items={RESTRICTIONS_NAV_ITEMS} />
    </div>
  );
}