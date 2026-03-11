import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ETAPES from '@/components/etapesData';
import DirectiveSelectionModal from '@/components/DirectiveSelectionModal';
import DeclarationFieldModal from '@/components/DeclarationFieldModal';


const IA_OPTIONS = ['Non autorisée', 'Autorisée avec restrictions', 'Autorisée sans restrictions', 'Obligatoire'];


const GABARITS = {
  'Non autorisée': "Lors de cette étape, les SIA ne sont pas autorisés car ...",
  'Autorisée avec restrictions': "Lors de cette étape, les SIA sont autorisés dans ce contexte ... Ils sont interdits dans cet autre contexte ...",
  'Autorisée sans restrictions': "Lors de cette étape, les SIA sont autorisés afin de ...",
  'Obligatoire': "Pour cette étape, vous devez utiliser [nommer le SIA] afin de …"
};

const defaultRowState = () => ({
  checked: false,
  ia: '',
  justification: '',
  declaration: '', // 'aucune' | 'requise'
  decl_iagraphie: false,
  decl_iagraphie_text: '<a href="https://www.bibl.ulaval.ca/services/soutien-a-lapprentissage/citation-de-sources/comment-citer-des-sources" target="_blank">Comment citer ses sources ?</a> (Bibliothèque de l\'Université Laval)',
  decl_traces: false,
  decl_traces_text: '',
  decl_logique: false,
  decl_logique_text: '',
  libelle_custom: '',
  exemples: ''
});

const defaultErrors = () => ({
  ia: false,
  justification: false,
  declaration: false,
  declaration_checkbox: false,
  decl_iagraphie_text: false,
  decl_traces_text: false,
  decl_logique_text: false,
  libelle_custom: false,
  exemples: false
});

export default function Guide() {
  const [identification, setIdentification] = useState({ cours: '', session: '', enseignants: '', evaluation: '' });
  const [identErrors, setIdentErrors] = useState({ cours: false, evaluation: false, enseignants: false });
  const [etapesOrder, setEtapesOrder] = useState(ETAPES.map((_, i) => i));
  const [rows, setRows] = useState(ETAPES.map(() => defaultRowState()));
  const [errors, setErrors] = useState(ETAPES.map(() => defaultErrors()));
  const [submitted, setSubmitted] = useState(false);
  const [submitKey, setSubmitKey] = useState(0);
  const [selections, setSelections] = useState([]);
  const [copyMsgs, setCopyMsgs] = useState({});
  const [saveError, setSaveError] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null); // null | { ok: true, time: Date } | { ok: false }
  const [, forceUpdate] = useState(0);
  const [iaChangeConfirm, setIaChangeConfirm] = useState(null); // { rowIndex, newIa }
  const fileInputRef = useRef();
  const [modalState, setModalState] = useState({ open: false, rowIndex: null, cursorPos: null });
  const [declModalState, setDeclModalState] = useState({ open: false, rowIndex: null, fieldCode: null });

  function openDeclModal(i, fieldCode) {
    setDeclModalState({ open: true, rowIndex: i, fieldCode });
  }
  const textAreaRefs = useRef(ETAPES.map(() => React.createRef()));

  // Tick every minute to keep elapsed time fresh
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  function openDirectiveModal(i) {
    const ta = textAreaRefs.current[i]?.current;
    const cursorPos = ta ? ta.selectionStart : null;
    setModalState({ open: true, rowIndex: i, cursorPos });
  }

  function handleInsertDirective(text) {
    const { rowIndex, cursorPos } = modalState;
    if (rowIndex === null) return;
    setRows((prev) => {
      const current = prev[rowIndex].justification;
      const pos = cursorPos !== null ? cursorPos : current.length;
      const next = current.slice(0, pos) + text + current.slice(pos);
      return prev.map((r, idx) => idx === rowIndex ? { ...r, justification: next } : r);
    });
    setErrors((prev) => prev.map((e, idx) => idx === rowIndex ? { ...e, justification: false } : e));
  }

  function updateRow(i, field, value) {
    setRows((prev) => {
      const next = prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r);
      return next;
    });
    // Clear related errors on change
    setErrors((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: false, declaration_checkbox: false } : e));
  }

  function handleCheckbox(i, checked) {
    setRows((prev) => prev.map((r, idx) => idx === i ? {
      ...defaultRowState(),
      checked
    } : r));
    setErrors((prev) => prev.map((e, idx) => idx === i ? defaultErrors() : e));
  }

  function applyIaChange(i, value, keepText) {
    setRows((prev) => {
      const r = prev[i];
      const justification = keepText ? r.justification : GABARITS[value];
      return prev.map((row, idx) => idx === i ? { ...row, ia: value, justification } : row);
    });
    setErrors((prev) => prev.map((e, idx) => idx === i ? { ...e, ia: false, justification: false } : e));
  }

  function handleIaChange(i, value) {
    const currentJust = rows[i].justification.trim();
    const isTemplate = Object.values(GABARITS).includes(currentJust) || !currentJust;
    if (!isTemplate) {
      // User has customized text — ask what to do
      setIaChangeConfirm({ rowIndex: i, newIa: value });
      return;
    }
    applyIaChange(i, value, false);
  }

  function moveEtape(fromPos, toPos) {
    if (toPos < 0 || toPos >= etapesOrder.length) return;
    setEtapesOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromPos, 1);
      next.splice(toPos, 0, removed);
      return next;
    });
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    moveEtape(result.source.index, result.destination.index);
  }

  function validate() {
    // Validate identification
    const newIdentErrors = { cours: !identification.cours.trim(), evaluation: !identification.evaluation.trim(), enseignants: !identification.enseignants.trim() };
    setIdentErrors(newIdentErrors);
    if (newIdentErrors.cours || newIdentErrors.evaluation || newIdentErrors.enseignants) return false;

    let valid = true;
    const newErrors = ETAPES.map(() => defaultErrors());
    let anyChecked = false;

    rows.forEach((r, i) => {
      if (!r.checked) return;
      anyChecked = true;

      if (ETAPES[i].id === 'autres' && !r.libelle_custom.trim()) {newErrors[i].libelle_custom = true;valid = false;}
      if (ETAPES[i].id === 'autres' && !r.exemples.trim()) {newErrors[i].exemples = true;valid = false;}
      if (!r.ia) {newErrors[i].ia = true;valid = false;}
      const justText = r.justification.replace(/<[^>]*>/g, '').trim();
      if (!justText) {newErrors[i].justification = true;valid = false;}
      if (!r.declaration) {newErrors[i].declaration = true;valid = false;}
      if (r.declaration === 'requise') {
        if (!r.decl_iagraphie && !r.decl_traces && !r.decl_logique) {
          newErrors[i].declaration_checkbox = true;valid = false;
        }
        if (r.decl_iagraphie && !r.decl_iagraphie_text.trim()) {newErrors[i].decl_iagraphie_text = true;valid = false;}
        if (r.decl_traces && !r.decl_traces_text.trim()) {newErrors[i].decl_traces_text = true;valid = false;}
        if (r.decl_logique && !r.decl_logique_text.trim()) {newErrors[i].decl_logique_text = true;valid = false;}
      }
    });

    setErrors(newErrors);
    return valid && anyChecked;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {setSubmitStatus({ ok: false });return;}

    // Build selections in the current display order
    const sel = etapesOrder.
    map((i) => {
      const r = rows[i];
      if (!r.checked) return null;
      return { etape: ETAPES[i].id === 'autres' && r.libelle_custom.trim() ? r.libelle_custom.trim() : ETAPES[i].libelle, parenthese: ETAPES[i].id === 'autres' ? r.exemples : ETAPES[i].parenthese, etapeId: ETAPES[i].id, ...r };
    }).
    filter(Boolean);
    setSelections(sel);
    setSubmitted(true);
    setSubmitKey((k) => k + 1);
    setSubmitStatus({ ok: true, time: new Date() });
    setTimeout(() => {
      document.getElementById('synthese-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // ---- Copy rich text to clipboard ----
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
      setCopyMsgs((m) => ({ ...m, [key]: true }));
      setTimeout(() => setCopyMsgs((m) => ({ ...m, [key]: false })), 1800);
    } catch {
      alert('Erreur lors de la copie. Essayez manuellement.');
    }
  }

  // ---- Helper: identification header line for exports ----
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
    if (!line) return '';
    return `<p style="font-family:Arial,sans-serif;margin-bottom:12px;">${line}</p>`;
  }

  // ---- Helper: format declaration exigences as HTML bullet list ----
  function formatExigences(s) {
    if (s.declaration === 'aucune') return `<ul style="margin:0;padding-left:18px;list-style-type:disc;"><li style="display:list-item;">Aucune exigence</li></ul>`;
    const items = [];
    if (s.decl_iagraphie) items.push(`Références et IAgraphie : ${s.decl_iagraphie_text}`);
    if (s.decl_traces) items.push(`Conserver les traces suivantes : ${s.decl_traces_text}`);
    if (s.decl_logique) items.push(`Expliquer la logique d'utilisation : ${s.decl_logique_text}`);
    return `<ul style="margin:0;padding-left:18px;list-style-type:disc;">${items.map((i) => `<li style="display:list-item;">${i}</li>`).join('')}</ul>`;
  }

  // ---- Build HTML for synthesis table (sections 1 & 2) ----
  function buildTableHTML(sels, withHeading = false) {
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Tableau synthèse</h2>` : '';
    html += buildIdentHeader();
    html += `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Étapes</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">L'utilisation des SIA est…</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Précisions</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Exigences de déclaration</th>
      </tr></thead><tbody>`;
    sels.forEach((s) => {
      const etapeHtml = s.parenthese ? `<strong>${s.etape}</strong> (${s.parenthese})` : `<strong>${s.etape}</strong>`;
      html += `<tr>
        <td style="border:1px solid #ccc;padding:8px;">${etapeHtml}</td>
        <td style="border:1px solid #ccc;padding:8px;">${s.ia}</td>
        <td style="border:1px solid #ccc;padding:8px;">${s.justification}</td>
        <td style="border:1px solid #ccc;padding:8px;">${formatExigences(s)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function buildTextHTML(sels, withHeading = false) {
    const heading = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Synthèse en texte continu</h2>` : '';
    return heading + buildIdentHeader() + sels.map((s) => {
      const etapeHtml = s.parenthese ? `<strong><i>${s.etape}</i></strong> (${s.parenthese})` : `<strong><i>${s.etape}</i></strong>`;
      return `<p>${etapeHtml}</p><p>L'utilisation des SIA est : <strong>${s.ia}</strong></p><div>${s.justification}</div><p>Exigences de déclaration :</p>${formatExigences(s)}<hr />`;
    }).join('');
  }

  // ---- Build HTML for declaration table (section 3) ----
  function buildDeclTableHTML(sels, withHeading = false) {
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Exigences de déclaration d'utilisation de l'IA</h2><p style="font-family:Arial,sans-serif;">Pour chacune des étapes de réalisation de l'évaluation ci-dessous, vous devez respecter les exigences de déclaration de l'utilisation de systèmes d'intelligence artificielle générative.</p>` : '';
    html += buildIdentHeader();
    html += `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Étapes</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Exigences de déclaration</th>
      </tr></thead><tbody>`;
    sels.forEach((s) => {
      const etapeHtml = s.parenthese ? `<strong>${s.etape}</strong> (${s.parenthese})` : `<strong>${s.etape}</strong>`;
      html += `<tr>
        <td style="border:1px solid #ccc;padding:8px;">${etapeHtml}</td>
        <td style="border:1px solid #ccc;padding:8px;">${formatExigences(s)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function buildDeclTextHTML(sels) {
    return buildIdentHeader() + sels.map((s) => {
      let exigences = '';
      if (s.declaration === 'aucune') {
        exigences = 'Aucune exigence';
      } else {
        const items = [];
        if (s.decl_iagraphie) items.push(`Références et IAgraphie : ${s.decl_iagraphie_text}`);
        if (s.decl_traces) items.push(`Conserver les traces suivantes : ${s.decl_traces_text}`);
        if (s.decl_logique) items.push(`Expliquer la logique d'utilisation : ${s.decl_logique_text}`);
        exigences = items.join('<br>');
      }
      const etapeHtml = s.parenthese ? `<strong><i>${s.etape}</i></strong> (${s.parenthese})` : `<strong><i>${s.etape}</i></strong>`;
      return `<p>${etapeHtml}</p><p>${exigences}</p><hr />`;
    }).join('');
  }

  // ---- Word export ----
  function downloadWord(htmlContent, filename) {
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>Export</title>
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 8px; }
        th { background-color: #f2f2f2; }
      </style>
      </head><body>${htmlContent}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- XML Save ----
  function handleSave() {
    const rowsData = rows.map((r, i) => ({
      index: i,
      checked: r.checked,
      ia: r.ia,
      justification: r.justification,
      declaration: r.declaration,
      decl_iagraphie: r.decl_iagraphie,
      decl_iagraphie_text: r.decl_iagraphie_text,
      decl_traces: r.decl_traces,
      decl_traces_text: r.decl_traces_text,
      decl_logique: r.decl_logique,
      decl_logique_text: r.decl_logique_text,
      libelle_custom: r.libelle_custom,
      exemples: r.exemples
    }));

    const escapeXml = (str) => String(str).
    replace(/&/g, '&amp;').
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;').
    replace(/"/g, '&quot;').
    replace(/'/g, '&apos;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<guide-ia version="1.0">\n`;
    xml += `  <identification>\n`;
    xml += `    <cours>${escapeXml(identification.cours)}</cours>\n`;
    xml += `    <session>${escapeXml(identification.session)}</session>\n`;
    xml += `    <enseignants>${escapeXml(identification.enseignants)}</enseignants>\n`;
    xml += `    <evaluation>${escapeXml(identification.evaluation)}</evaluation>\n`;
    xml += `  </identification>\n`;
    xml += `  <ordre>${etapesOrder.join(',')}</ordre>\n`;
    xml += `  <etapes>\n`;
    rowsData.forEach((r) => {
      xml += `    <etape index="${r.index}">\n`;
      xml += `      <checked>${r.checked}</checked>\n`;
      xml += `      <ia>${escapeXml(r.ia)}</ia>\n`;
      xml += `      <justification>${escapeXml(r.justification)}</justification>\n`;
      xml += `      <declaration>${escapeXml(r.declaration)}</declaration>\n`;
      xml += `      <decl_iagraphie>${r.decl_iagraphie}</decl_iagraphie>\n`;
      xml += `      <decl_iagraphie_text>${escapeXml(r.decl_iagraphie_text)}</decl_iagraphie_text>\n`;
      xml += `      <decl_traces>${r.decl_traces}</decl_traces>\n`;
      xml += `      <decl_traces_text>${escapeXml(r.decl_traces_text)}</decl_traces_text>\n`;
      xml += `      <decl_logique>${r.decl_logique}</decl_logique>\n`;
      xml += `      <decl_logique_text>${escapeXml(r.decl_logique_text)}</decl_logique_text>\n`;
      xml += `      <libelle_custom>${escapeXml(r.libelle_custom)}</libelle_custom>\n`;
      xml += `      <exemples>${escapeXml(r.exemples)}</exemples>\n`;
      xml += `    </etape>\n`;
    });
    xml += `  </etapes>\n</guide-ia>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sauvegarde-guide-ia.xml';
    a.click();
    URL.revokeObjectURL(url);
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

        const parseError = doc.querySelector('parsererror');
        if (parseError) {setSaveError("Le fichier XML est invalide ou corrompu.");return;}

        const root = doc.querySelector('guide-ia');
        if (!root) {setSaveError("Ce fichier n'est pas un fichier de sauvegarde valide (balise racine manquante).");return;}

        const etapeNodes = doc.querySelectorAll('etape');

        const newRows = ETAPES.map(() => defaultRowState());
        etapeNodes.forEach((node) => {
          const idx = parseInt(node.getAttribute('index'));
          if (isNaN(idx) || idx < 0 || idx >= ETAPES.length) return;
          const get = (tag) => node.querySelector(tag)?.textContent ?? '';
          newRows[idx] = {
            checked: get('checked') === 'true',
            ia: get('ia'),
            justification: get('justification'),
            declaration: get('declaration'),
            decl_iagraphie: get('decl_iagraphie') === 'true',
            decl_iagraphie_text: get('decl_iagraphie_text') || '<a href="https://www.bibl.ulaval.ca/services/soutien-a-lapprentissage/citation-de-sources/comment-citer-des-sources" target="_blank">Comment citer ses sources ?</a> (Bibliothèque de l\'Université Laval)',
            decl_traces: get('decl_traces') === 'true',
            decl_traces_text: get('decl_traces_text'),
            decl_logique: get('decl_logique') === 'true',
            decl_logique_text: get('decl_logique_text'),
            libelle_custom: get('libelle_custom'),
            exemples: get('exemples')
          };
        });

        // Restore order if present
        const ordreNode = root.querySelector('ordre');
        if (ordreNode) {
          const parsed = ordreNode.textContent.split(',').map(Number);
          if (parsed.length === ETAPES.length && parsed.every((n) => !isNaN(n))) {
            setEtapesOrder(parsed);
          }
        } else {
          setEtapesOrder(ETAPES.map((_, i) => i));
        }

        // Restore identification if present
        const identNode = root.querySelector('identification');
        if (identNode) {
          const getI = (tag) => identNode.querySelector(tag)?.textContent ?? '';
          setIdentification({ cours: getI('cours'), session: getI('session'), enseignants: getI('enseignants'), evaluation: getI('evaluation') });
        }

        setRows(newRows);
        setErrors(ETAPES.map(() => defaultErrors()));
        setSubmitted(false);
        setSelections([]);
      } catch {
        setSaveError("Erreur lors de la lecture du fichier. Vérifiez qu'il s'agit d'un fichier de sauvegarde valide.");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  const errorStyle = { color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' };
  const inputErrorBorder = { border: '2px solid #E41E25', background: '#fff4f4' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <style>{`
        :root { --rouge: #E41E25; --bleu-ul: #00A4E4; --gris-pale: #F2F2F2; --gris-fonce: #231F20; --bordure: #ccc; }
        body { font-size: smaller; }
        h1 { color: #E41E25; text-align: center; }
        table.main-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table.main-table th, table.main-table td { border: 1px solid #ccc; padding: 10px; text-align: left; vertical-align: top; }
        table.main-table th { background-color: #F2F2F2; color: #231F20; }
        .step-label { cursor: pointer; font-weight: bold; }
        .required { color: #E41E25; }
        .btn-primary { background-color: #00A4E4; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
        .btn-primary:hover { background-color: #0084b0; }
        .btn-secondary { background-color: #6c757d; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
        .btn-secondary:hover { background-color: #545b62; }
        .synthese-section { margin-top: 28px; padding: 16px; border: 1px solid #ccc; border-radius: 8px; background: #fdfdff; }
        .synthese-section h3 { margin-top: 0; color: #231F20; }
        .synth-table { width: 100%; border-collapse: collapse; background: white; }
        .synth-table th, .synth-table td { border: 1px solid #ccc; padding: 10px; text-align: left; vertical-align: top; }
        .synth-table th { background-color: #F2F2F2; }
        .synth-table td ul { list-style-type: disc; padding-left: 20px; margin: 0; }
        .synth-table td li { display: list-item; list-style-type: disc; }
        .copy-ok { color: green; font-weight: bold; margin-left: 10px; }
        .synth-table td a, .synthese-section a { color: #0056b3; text-decoration: underline; }
        .save-section { margin-top: 32px; padding: 16px; border: 1px solid #ccc; border-radius: 8px; background: white; }
        .decl-sub { margin-left: 20px; margin-top: 6px; }
        textarea.justification-field { border: 2px solid #E41E25; background-color: #fff4f4; padding: 8px; font-family: inherit; width: 98%; }
        .radio-disabled label, .radio-disabled input { color: #999; pointer-events: none; }
        table.main-table td ul, .synthese-section ul { list-style-type: disc; padding-left: 20px; margin: 4px 0; }
        table.main-table td ol, .synthese-section ol { list-style-type: decimal; padding-left: 20px; margin: 4px 0; }
        table.main-table td li, .synthese-section li { display: list-item; }
      `}</style>

      <h1 className="mr-10 mb-4 ml-10 text-2xl font-semibold">Rédiger et personnaliser les directives d'utilisation des systèmes d'intelligence artificielle (SIA) pour une évaluation</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }} className="mr-5 ml-5">
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8, color: '#231F20' }} className="text-lg font-bold uppercase">👉 Instructions</h2>
        
        Ce guide interactif à l'intention du personnel enseignant vous permet de rédiger en quelques étapes des directives complètes, claires et prêtes à transmettre aux étudiantes et étudiants concernant l'utilisation des SIA dans le cadre d'une évaluation. 
      <ul style={{ listStyleType: 'disc', paddingLeft: 20, marginTop: 8 }} className="pb-2">
      <li>Cochez les étapes concernées par l'évaluation.</li>
      <li>Complétez les informations requises. Soyez concis et précis.</li>
      <li>Soumettez le formulaire pour obtenir une synthèse des directives qui précisent les usages autorisés, les attentes pédagogiques et les balises à respecter.</li>
      <li>Vous pouvez apporter des modifications en cliquant <b>Soumettre</b> à nouveau.</li>
      <li>Transmettez ensuite aux personnes étudiantes une synthèse transparente qui soutient leur réussite et l'intégrité.</li>
          </ul>
        Cette application en ligne ne conserve pas vos données. Si vous désirez reprendre votre travail plus tard, utilisez la fonction de sauvegarde en bas de la page.
        </div>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8, color: '#231F20' }} className="text-lg font-bold uppercase">🧠 À propos...</h2>
          Cette application vous est offerte gratuitement par le <a href="https://www.enseigner.ulaval.ca/a-propos" target="_blank" className="text-blue-800 underline">Service de soutien à l'enseignement</a> de l'Université Laval.<br /><br />
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a839e74b536a607f6d9cc8/ce0c154f6_20240824_AIA_FR_EN.png" alt="Aidée de l'intelligence artificielle - crédit de l'image 2023 par Martine Peters CC BY-NC-SA 4.0" style={{ float: 'right', width: 80, marginLeft: 12, marginBottom: 4 }} />
          <b>Déclaration d'utilisation de SIA: Aidée de l'IA.</b><br />L'idée originale, la logique et les contenus de cette application ont été développés par des humains, qui ont utilisé des SIA conversationnels pour aider avec la génération de texte et la reformulation (ChatGPT, Gemini et Microsoft Copilot). Ce travail est basé sur un guide destiné au personnel enseignant du Service pédagogique FSA ULaval.  Tous les textes présentés ont été validés par l'équipe de développement. Le code a été développé par Mathieu Plourde avec l'aide de ChatGPT et Claude, mais plus particulièrement par Base44 pour cette version actuelle.<br /><br />Elle est développée et maintenue par Mathieu Plourde, CC-By 2026 (version alpha 5).
        </div>
      </div>

      {/* Identification section */}
      <div style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, color: '#231F20', fontSize: '1.1em', fontWeight: 'bold', marginBottom: 14 }}>Évaluation ciblée</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Identifiant du cours <span className="required">*</span></label>
            <input type="text" value={identification.cours} onChange={(e) => {setIdentification((p) => ({ ...p, cours: e.target.value }));setIdentErrors((p) => ({ ...p, cours: false }));}}
            placeholder="ex. IFT-1001"
            style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: identErrors.cours ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: identErrors.cours ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
            {identErrors.cours && <span style={errorStyle}>⚠ Ce champ est requis</span>}
          </div>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Session</label>
            <input type="text" value={identification.session} onChange={(e) => setIdentification((p) => ({ ...p, session: e.target.value }))}
            placeholder="ex. Hiver 2026"
            style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Nom de l'évaluation <span className="required">*</span></label>
            <input type="text" value={identification.evaluation} onChange={(e) => {setIdentification((p) => ({ ...p, evaluation: e.target.value }));setIdentErrors((p) => ({ ...p, evaluation: false }));}}
            placeholder="ex. Travail final"
            style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: identErrors.evaluation ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: identErrors.evaluation ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
            {identErrors.evaluation && <span style={errorStyle}>⚠ Ce champ est requis</span>}
          </div>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Personne(s) enseignante(s) <span className="required">*</span></label>
            <input type="text" value={identification.enseignants} onChange={(e) => {setIdentification((p) => ({ ...p, enseignants: e.target.value }));setIdentErrors((p) => ({ ...p, enseignants: false }));}}
            placeholder="ex. Marie Tremblay"
            style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: identErrors.enseignants ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: identErrors.enseignants ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
            {identErrors.enseignants && <span style={errorStyle}>⚠ Ce champ est requis</span>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <DragDropContext onDragEnd={onDragEnd}>
        <table className="main-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Étapes</th>
              <th>L'utilisation des SIA est… <span className="required">*</span></th>
              <th>Personnalisation des directives <span className="required">*</span></th>
              <th>Exigences de déclaration <span className="required">*</span></th>
            </tr>
          </thead>
          <Droppable droppableId="etapes-table">
            {(provided) =>
              <tbody ref={provided.innerRef} {...provided.droppableProps}>
            {etapesOrder.map((etapeIdx, pos) => {
                  const etape = ETAPES[etapeIdx];
                  const i = etapeIdx;
                  const r = rows[i];
                  const err = errors[i];
                  const disabled = !r.checked;
                  return (
                    <Draggable key={etape.id} draggableId={etape.id} index={pos}>
                  {(provided, snapshot) =>
                      <tr ref={provided.innerRef} {...provided.draggableProps}
                      style={{ ...provided.draggableProps.style, background: snapshot.isDragging ? '#e0f3fc' : '' }}>
                  {/* Col 1: Étape checkbox */}
                  <td
                          style={{ verticalAlign: 'top', cursor: 'pointer', transition: 'background 0.15s' }}
                          onClick={() => handleCheckbox(i, !r.checked)}
                          onMouseEnter={(e) => {if (!snapshot.isDragging) e.currentTarget.style.background = '#eaf6fd';}}
                          onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                    {/* Drag handle + reorder buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }} onClick={(e) => e.stopPropagation()}>
                      <span {...provided.dragHandleProps} title="Glisser pour réordonner"
                            style={{ cursor: 'grab', color: '#aaa', fontSize: '1.1em', padding: '2px 4px', userSelect: 'none', lineHeight: 1 }}>⠿</span>
                      <button type="button" title="En haut de la liste" onClick={() => moveEtape(pos, 0)} disabled={pos === 0}
                            style={{ background: 'none', border: 'none', cursor: pos === 0 ? 'default' : 'pointer', fontSize: '0.9em', padding: '1px 3px', opacity: pos === 0 ? 0.25 : 1 }}>⏫</button>
                      <button type="button" title="Déplacer vers le haut" onClick={() => moveEtape(pos, pos - 1)} disabled={pos === 0}
                            style={{ background: 'none', border: 'none', cursor: pos === 0 ? 'default' : 'pointer', fontSize: '0.9em', padding: '1px 3px', opacity: pos === 0 ? 0.25 : 1 }}>🔼</button>
                      <button type="button" title="Déplacer vers le bas" onClick={() => moveEtape(pos, pos + 1)} disabled={pos === etapesOrder.length - 1}
                            style={{ background: 'none', border: 'none', cursor: pos === etapesOrder.length - 1 ? 'default' : 'pointer', fontSize: '0.9em', padding: '1px 3px', opacity: pos === etapesOrder.length - 1 ? 0.25 : 1 }}>🔽</button>
                      <button type="button" title="En bas de la liste" onClick={() => moveEtape(pos, etapesOrder.length - 1)} disabled={pos === etapesOrder.length - 1}
                            style={{ background: 'none', border: 'none', cursor: pos === etapesOrder.length - 1 ? 'default' : 'pointer', fontSize: '0.9em', padding: '1px 3px', opacity: pos === etapesOrder.length - 1 ? 0.25 : 1 }}>⏬</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                              type="checkbox"
                              id={`etape_${i}`}
                              checked={r.checked}
                              onChange={(e) => {e.stopPropagation();handleCheckbox(i, e.target.checked);}}
                              style={{ width: 18, height: 18, minWidth: 18, accentColor: '#00A4E4', cursor: 'pointer', flexShrink: 0 }} />
                      <label htmlFor={`etape_${i}`} className="step-label" style={{ cursor: 'pointer', margin: 0 }}>
                        {etape.libelle}
                        {etape.parenthese && <span style={{ fontWeight: 'normal', color: '#555', fontSize: '0.88em' }}> ({etape.parenthese})</span>}
                      </label>
                      </div>
                      {etape.id === 'autres' && r.checked &&
                          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ marginBottom: 6 }}>
                          <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 2 }}>
                            Libellé <span className="required">*</span>
                          </label>
                          <input
                                type="text"
                                value={r.libelle_custom}
                                onChange={(e) => updateRow(i, 'libelle_custom', e.target.value)}
                                placeholder="Nom de l'étape personnalisée"
                                style={{ width: '95%', padding: '5px 8px', fontFamily: 'inherit', border: err.libelle_custom ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: err.libelle_custom ? '#fff4f4' : 'white' }} />

                          {err.libelle_custom && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                        </div>
                        <div>
                          <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 2 }}>
                            Exemples <span className="required">*</span>
                          </label>
                          <textarea
                                rows={3}
                                value={r.exemples}
                                onChange={(e) => updateRow(i, 'exemples', e.target.value)}
                                placeholder="Décrivez des exemples d'utilisation"
                                style={{ width: '95%', padding: '5px 8px', fontFamily: 'inherit', border: err.exemples ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: err.exemples ? '#fff4f4' : 'white' }} />

                          {err.exemples && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                        </div>
                      </div>
                          }
                      </td>

                  {/* Col 2: IA options */}
                  <td>
                    <div className={disabled ? 'radio-disabled' : ''}>
                      {IA_OPTIONS.map((opt, j) =>
                            <div key={j}>
                          <input
                                type="radio"
                                id={`radio_${i}_${j}`}
                                name={`ia_${i}`}
                                value={opt}
                                checked={r.ia === opt}
                                disabled={disabled}
                                onChange={() => handleIaChange(i, opt)} />

                          <label htmlFor={`radio_${i}_${j}`} style={{ marginLeft: 4 }}>{opt}</label>
                        </div>
                            )}
                    </div>
                    {err.ia && <span style={errorStyle}>⚠ Sélection requise</span>}
                  </td>

                  {/* Col 3: Justification */}
                  <td>
                    {r.ia &&
                          <>
                        {r.justification ?
                            <div
                              dangerouslySetInnerHTML={{ __html: r.justification }}
                              style={{
                                width: '95%', minHeight: 48, marginTop: 4, padding: '6px 8px',
                                fontFamily: 'inherit', fontSize: '0.9em', lineHeight: 1.5,
                                border: err.justification ? '2px solid #E41E25' : '1px solid #ccc',
                                background: err.justification ? '#fff4f4' : '#fafafa',
                                borderRadius: 4, cursor: 'text'
                              }}
                              onClick={() => openDirectiveModal(i)} /> :

                            <div
                              style={{
                                width: '95%', minHeight: 48, marginTop: 4, padding: '6px 8px',
                                fontFamily: 'inherit', fontSize: '0.9em', color: '#aaa',
                                border: err.justification ? '2px solid #E41E25' : '1px solid #ccc',
                                background: err.justification ? '#fff4f4' : '#fafafa',
                                borderRadius: 4, cursor: 'text'
                              }}
                              onClick={() => openDirectiveModal(i)}>

                              Cliquez pour rédiger…
                            </div>
                            }
                        <button
                              type="button"
                              onClick={() => openDirectiveModal(i)}
                              style={{ marginTop: 4, fontSize: '0.78em', padding: '3px 10px', background: '#00A4E4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                          ✏ Modifier / insérer un exemple
                        </button>
                      </>
                          }
                    {!r.ia && r.checked && <span style={{ color: '#999', fontSize: '0.9em' }}>Sélectionnez une option IA d'abord.</span>}
                    {err.justification && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                  </td>

                  {/* Col 4: Exigences de déclaration */}
                  <td>
                    {disabled ?
                          <span style={{ color: '#999', fontSize: '0.9em' }}>—</span> :

                          <>
                        <div>
                          <input
                                type="radio"
                                id={`decl_aucune_${i}`}
                                name={`decl_${i}`}
                                value="aucune"
                                checked={r.declaration === 'aucune'}
                                onChange={() => updateRow(i, 'declaration', 'aucune')} />

                          <label htmlFor={`decl_aucune_${i}`} style={{ marginLeft: 4 }}>Aucune exigence</label>
                        </div>
                        <div>
                          <input
                                type="radio"
                                id={`decl_requise_${i}`}
                                name={`decl_${i}`}
                                value="requise"
                                checked={r.declaration === 'requise'}
                                onChange={() => updateRow(i, 'declaration', 'requise')} />

                          <label htmlFor={`decl_requise_${i}`} style={{ marginLeft: 4 }}>Exigence(s) requise(s)</label>
                        </div>
                        {err.declaration && <span style={errorStyle}>⚠ Sélection requise</span>}

                        {r.declaration === 'requise' &&
                            <div className="decl-sub">
                            {/* Iagraphie */}
                            <div>
                              <input
                                  type="checkbox"
                                  id={`iagraphie_${i}`}
                                  checked={r.decl_iagraphie}
                                  onChange={(e) => updateRow(i, 'decl_iagraphie', e.target.checked)} />

                              <label htmlFor={`iagraphie_${i}`} style={{ marginLeft: 4 }}>Références et IAgraphie</label>
                              {r.decl_iagraphie &&
                                <>
                                  <div
                                    dangerouslySetInnerHTML={{ __html: r.decl_iagraphie_text || '<span style="color:#aaa">Cliquez pour rédiger…</span>' }}
                                    onClick={() => openDeclModal(i, 'iagraphie')}
                                    style={{ width: '95%', minHeight: 36, marginTop: 4, padding: '5px 7px', fontFamily: 'inherit', fontSize: '0.88em', lineHeight: 1.5, border: err.decl_iagraphie_text ? '2px solid #E41E25' : '1px solid #ccc', background: err.decl_iagraphie_text ? '#fff4f4' : '#fafafa', borderRadius: 4, cursor: 'text' }} />
                                  <button type="button" onClick={() => openDeclModal(i, 'iagraphie')} style={{ marginTop: 3, fontSize: '0.75em', padding: '2px 8px', background: '#00A4E4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✏ Modifier / insérer un exemple</button>
                                  {err.decl_iagraphie_text && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                                </>
                              }
                              </div>
                            {/* Traces */}
                            <div style={{ marginTop: 6 }}>
                              <input
                                  type="checkbox"
                                  id={`traces_${i}`}
                                  checked={r.decl_traces}
                                  onChange={(e) => updateRow(i, 'decl_traces', e.target.checked)} />

                              <label htmlFor={`traces_${i}`} style={{ marginLeft: 4 }}>Conserver les traces suivantes :</label>
                              {r.decl_traces &&
                                <>
                                  <div
                                    dangerouslySetInnerHTML={{ __html: r.decl_traces_text || '<span style="color:#aaa">Cliquez pour rédiger…</span>' }}
                                    onClick={() => openDeclModal(i, 'traces')}
                                    style={{ width: '95%', minHeight: 36, marginTop: 4, padding: '5px 7px', fontFamily: 'inherit', fontSize: '0.88em', lineHeight: 1.5, border: err.decl_traces_text ? '2px solid #E41E25' : '1px solid #ccc', background: err.decl_traces_text ? '#fff4f4' : '#fafafa', borderRadius: 4, cursor: 'text' }} />
                                  <button type="button" onClick={() => openDeclModal(i, 'traces')} style={{ marginTop: 3, fontSize: '0.75em', padding: '2px 8px', background: '#00A4E4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✏ Modifier / insérer un exemple</button>
                                  {err.decl_traces_text && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                                </>
                                }
                            </div>
                            {/* Logique */}
                            <div style={{ marginTop: 6 }}>
                              <input
                                  type="checkbox"
                                  id={`logique_${i}`}
                                  checked={r.decl_logique}
                                  onChange={(e) => updateRow(i, 'decl_logique', e.target.checked)} />

                              <label htmlFor={`logique_${i}`} style={{ marginLeft: 4 }}>Expliquer la logique d'utilisation :</label>
                              {r.decl_logique &&
                                <>
                                  <div
                                    dangerouslySetInnerHTML={{ __html: r.decl_logique_text || '<span style="color:#aaa">Cliquez pour rédiger…</span>' }}
                                    onClick={() => openDeclModal(i, 'logique')}
                                    style={{ width: '95%', minHeight: 36, marginTop: 4, padding: '5px 7px', fontFamily: 'inherit', fontSize: '0.88em', lineHeight: 1.5, border: err.decl_logique_text ? '2px solid #E41E25' : '1px solid #ccc', background: err.decl_logique_text ? '#fff4f4' : '#fafafa', borderRadius: 4, cursor: 'text' }} />
                                  <button type="button" onClick={() => openDeclModal(i, 'logique')} style={{ marginTop: 3, fontSize: '0.75em', padding: '2px 8px', background: '#00A4E4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✏ Modifier / insérer un exemple</button>
                                  {err.decl_logique_text && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                                </>
                                }
                            </div>
                            {err.declaration_checkbox && <span style={errorStyle}>⚠ Au moins une exigence doit être sélectionnée</span>}
                          </div>
                            }
                      </>
                          }
                  </td>
                  </tr>
                      }
                </Draggable>);

                })}
            {provided.placeholder}
          </tbody>
              }
          </Droppable>
        </table>
        </DragDropContext>
        <br />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="submit" className="btn-primary">Soumettre</button>
          {submitStatus && (submitStatus.ok ? (() => {
            const diffMs = new Date() - submitStatus.time;
            const diffMin = Math.floor(diffMs / 60000);
            const diffH = Math.floor(diffMin / 60);
            const elapsed = diffH > 0 ?
            `il y a ${diffH} heure${diffH > 1 ? 's' : ''}` :
            diffMin <= 0 ? "à l'instant" : `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
            return (
              <span style={{ background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>
                ✔️ Sommaires générés avec succès {elapsed}.
              </span>);

          })() :
          <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>
              ⚠ Certains champs obligatoires ne sont pas remplis correctement.
            </span>)
          }
        </div>
      </form>

      {/* ===== SYNTHESIS SECTIONS ===== */}
      {submitted &&
      <div id="synthese-container" key={submitKey}>
          {/* Section Brio */}
          <BrioSection selections={selections} />
          {/* Section 1: Tableau synthèse */}
          <SyntheseSection
          title="Tableau synthèse"
          onCopyBrio={() => copyRichText(buildTableHTML(selections), 's1-brio')}
          onDownloadWord={() => downloadWord(buildTableHTML(selections, true), 'tableau-synthese.doc')}
          copyOk={copyMsgs['s1-brio']}
          identLine={buildIdentLine() || null}>

            <table className="synth-table">
              <thead>
                <tr>
                  <th>Étapes</th>
                  <th>L'utilisation des SIA est…</th>
                  <th>Précisions</th>
                  <th>Exigences de déclaration</th>
                </tr>
              </thead>
              <tbody>
                {selections.map((s, i) =>
              <tr key={i}>
                    <td><strong>{s.etape}</strong>{s.parenthese && <span style={{ fontWeight: 'normal' }}> ({s.parenthese})</span>}</td>
                    <td>{s.ia}</td>
                    <td dangerouslySetInnerHTML={{ __html: s.justification }} />
                    <td dangerouslySetInnerHTML={{ __html: formatExigences(s) }} />
                  </tr>
              )}
              </tbody>
            </table>
          </SyntheseSection>

          {/* Section 2: Synthèse texte HTML */}
          <SyntheseSection
          title="Synthèse en texte continu"
          onCopyBrio={() => copyRichText(buildTextHTML(selections), 's2-brio')}
          onDownloadWord={() => downloadWord(buildTextHTML(selections, true), 'synthese-texte.doc')}
          copyOk={copyMsgs['s2-brio']}>

            <div style={{ border: '1px solid #aaa', background: '#fff', padding: 12, borderRadius: 6 }}
          dangerouslySetInnerHTML={{ __html: buildTextHTML(selections) }} />
          
          </SyntheseSection>

          {/* Section 3: Exigences de déclaration */}
          <SyntheseSection
          title="Exigences de déclaration d'utilisation de l'IA"
          onCopyBrio={() => copyRichText(buildDeclTableHTML(selections), 's3-brio')}
          onDownloadWord={() => downloadWord(buildDeclTableHTML(selections, true), 'exigences-declaration.doc')}
          copyOk={copyMsgs['s3-brio']}
          identLine={buildIdentLine() || null}>

            <p style={{ marginBottom: 12 }}>
              Pour chacune des étapes de réalisation de l'évaluation ci-dessous, vous devez respecter les exigences de déclaration de l'utilisation de systèmes d'intelligence artificielle.
            </p>
            <table className="synth-table">
              <thead>
                <tr>
                  <th>Étapes</th>
                  <th>Exigences de déclaration</th>
                </tr>
              </thead>
              <tbody>
                {selections.map((s, i) =>
              <tr key={i}>
                    <td><strong>{s.etape}</strong>{s.parenthese && <span style={{ fontWeight: 'normal' }}> ({s.parenthese})</span>}</td>
                    <td dangerouslySetInnerHTML={{ __html: formatExigences(s) }} />
                  </tr>
              )}
              </tbody>
            </table>
          </SyntheseSection>
        </div>
      }

      {/* ===== IA CHANGE CONFIRM DIALOG ===== */}
      {iaChangeConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: 10, padding: '28px 32px', maxWidth: 480, width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)', fontFamily: 'Arial, sans-serif'
          }}>
            <p style={{ marginBottom: 20, lineHeight: 1.6, fontSize: '0.95em', color: '#231F20' }}>
              Vous avez déjà personnalisé vos directives pour cette étape et êtes sur le point de changer le niveau de permission. Que désirez-vous faire?
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  applyIaChange(iaChangeConfirm.rowIndex, iaChangeConfirm.newIa, true);
                  setIaChangeConfirm(null);
                }}
                style={{ background: '#00A4E4', color: 'white', border: 'none', borderRadius: 5, padding: '9px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.88em', flex: 1 }}>
                Conserver le texte personnalisé et l'adapter
              </button>
              <button
                type="button"
                onClick={() => {
                  applyIaChange(iaChangeConfirm.rowIndex, iaChangeConfirm.newIa, false);
                  setIaChangeConfirm(null);
                }}
                style={{ background: '#6c757d', color: 'white', border: 'none', borderRadius: 5, padding: '9px 16px', cursor: 'pointer', fontSize: '0.88em', flex: 1 }}>
                Utiliser le texte par défaut du niveau choisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DIRECTIVE MODAL ===== */}
      <DirectiveSelectionModal
        isOpen={modalState.open}
        onClose={() => setModalState((s) => ({ ...s, open: false }))}
        onSave={(html) => {
          const { rowIndex } = modalState;
          if (rowIndex === null) return;
          setRows((prev) => prev.map((r, idx) => idx === rowIndex ? { ...r, justification: html } : r));
          setErrors((prev) => prev.map((e, idx) => idx === rowIndex ? { ...e, justification: false } : e));
        }}
        initialValue={modalState.rowIndex !== null ? rows[modalState.rowIndex]?.justification : ''}
        currentEtapeId={modalState.rowIndex !== null ? ETAPES[modalState.rowIndex]?.id : null}
        currentIaOption={modalState.rowIndex !== null ? rows[modalState.rowIndex]?.ia : null} />


      {/* ===== DECLARATION FIELD MODAL ===== */}
      <DeclarationFieldModal
        isOpen={declModalState.open}
        onClose={() => setDeclModalState(s => ({ ...s, open: false }))}
        onSave={(html) => {
          const { rowIndex, fieldCode } = declModalState;
          if (rowIndex === null) return;
          const fieldMap = { iagraphie: 'decl_iagraphie_text', traces: 'decl_traces_text', logique: 'decl_logique_text' };
          const field = fieldMap[fieldCode];
          if (!field) return;
          updateRow(rowIndex, field, html);
        }}
        initialValue={declModalState.rowIndex !== null && declModalState.fieldCode ? (() => {
          const fieldMap = { iagraphie: 'decl_iagraphie_text', traces: 'decl_traces_text', logique: 'decl_logique_text' };
          return rows[declModalState.rowIndex]?.[fieldMap[declModalState.fieldCode]] || '';
        })() : ''}
        fieldCode={declModalState.fieldCode}
      />

      {/* ===== SAVE & LOAD ===== */}
      <div className="save-section">
        <h2 style={{ marginTop: 0, color: '#231F20' }} className="my-2 text-xl font-semibold text-center">Sauvegarde et restauration</h2>
        <button type="button" className="btn-primary" onClick={handleSave}>Créer un fichier de sauvegarde</button>
        <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          Importer un fichier de sauvegarde
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          style={{ display: 'none' }}
          onChange={handleLoad} />

        {saveError &&
        <div style={{ color: '#E41E25', marginTop: 10, padding: '8px 12px', background: '#fff4f4', border: '1px solid #E41E25', borderRadius: 5 }}>
            ⚠ {saveError}
          </div>
        }
      </div>
    </div>);

}

function SyntheseSection({ title, children, onCopyBrio, onDownloadWord, copyOk, identLine }) {
  return (
    <div className="synthese-section">
      <h2 className="my-2 text-lg font-semibold text-center">{title}</h2>
      {identLine && <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.95em', marginBottom: 8 }}>{identLine}</p>}
      {children}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <button type="button" className="btn-primary" onClick={onCopyBrio}>Copier pour coller en ligne (Brio)</button>
        {copyOk && <span className="copy-ok">Copié !</span>}
        <button type="button" className="btn-secondary" onClick={onDownloadWord}>Télécharger en format Word</button>
      </div>
    </div>);

}