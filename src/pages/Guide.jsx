import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ETAPES from '@/components/etapesData';
import EtapeRow from '@/components/guide/EtapeRow';
import DirectiveSelectionModal from '@/components/DirectiveSelectionModal';
import DeclarationFieldModal from '@/components/DeclarationFieldModal';
import BrioSection from '@/components/BrioSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import DeclarationGabarit from '@/components/guide/DeclarationGabarit';
import PageRightNav from '@/components/guide/PageRightNav';


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
  justification_vierge: false,
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
  const [collapsedRows, setCollapsedRows] = useState(ETAPES.map(() => false));
  const [iaChangeConfirm, setIaChangeConfirm] = useState(null); // { rowIndex, newIa }
  const [declarationActive, setDeclarationActive] = useState(false);
  const [declMode, setDeclMode] = useState('etape'); // 'etape' | 'outil'
  const [declarationTitle, setDeclarationTitle] = useState("Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)");

  const INSTRUCTIONS_PAR_ETAPE = '<p><strong>⚠️ Consultez les directives concernant l\'utilisation autorisée des SIA dans la section <i>Utilisation de l\'intelligence artificielle</i> (la suivante) avant de débuter votre travail !</strong></p><p>Pour compléter votre déclaration d\'utilisation des SIA, suivez ces étapes :</p><ol><li>Accédez à l\'outil de déclaration : <a href="https://directives-ia.base44.app/Declaration" target="_blank">Déclaration d\'utilisation des SIA.</a></li><li>Importez le <strong>fichier de sauvegarde</strong> fourni par votre personne enseignante.</li><li>Remplissez les champs de déclaration pour chaque étape concernée.</li><li>Générez votre déclaration et téléchargez-la en format Word ou PDF.</li><li>Transmettez le fichier généré à votre personne enseignante dans la boite de dépôt dédiée de cette évaluation.</li></ol>';
  const INSTRUCTIONS_PAR_OUTIL = '<p><strong>⚠️ Consultez les directives concernant l\'utilisation autorisée des SIA dans la section <i>Utilisation de l\'intelligence artificielle</i> (la suivante) avant de débuter votre travail !</strong></p><p>Pour compléter votre déclaration d\'utilisation des SIA, suivez ces étapes :</p><ol><li>Accédez à l\'outil de déclaration par outil : <a href="https://directives-ia.base44.app/Declaration-outil" target="_blank">Déclaration d\'utilisation des SIA (par outil).</a></li><li>Importez le <strong>fichier de sauvegarde</strong> fourni par votre personne enseignante.</li><li>Remplissez les champs de déclaration pour chaque outil utilisé.</li><li>Générez votre déclaration et téléchargez-la en format Word ou PDF.</li><li>Transmettez le fichier généré à votre personne enseignante dans la boite de dépôt dédiée de cette évaluation.</li></ol>';

  const [instructorInstructions, setInstructorInstructions] = useState(INSTRUCTIONS_PAR_ETAPE);
  const [declarationFieldDescription, setDeclarationFieldDescription] = useState('Fichier à utiliser dans l\'outil de déclaration.');
  const [copyTitleOk, setCopyTitleOk] = useState(false);
  const [copyDescriptionOk, setCopyDescriptionOk] = useState(false);
  const [copyFileDescOk, setCopyFileDescOk] = useState(false);
  const [aProposOpen, setAProposOpen] = useState(false);
  const [showNewEvalDialog, setShowNewEvalDialog] = useState(false);
  const [highlightEvaluation, setHighlightEvaluation] = useState(false);
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

  function hasRowData(i) {
    const r = rows[i];
    return r.ia || r.justification || r.declaration || r.decl_iagraphie || r.decl_traces || r.decl_logique ||
    r.decl_traces_text || r.decl_logique_text || r.libelle_custom || r.exemples;
  }

  function handleCollapseRow(i) {
    if (rows[i].checked && hasRowData(i)) {
      if (!window.confirm('Des données ont déjà été saisies pour cette étape. Voulez-vous vraiment la marquer "Ne s\'applique pas" et effacer les données saisies ?')) return;
    }
    setRows((prev) => prev.map((r, idx) => idx === i ? defaultRowState() : r));
    setErrors((prev) => prev.map((e, idx) => idx === i ? defaultErrors() : e));
    setCollapsedRows((prev) => prev.map((v, idx) => idx === i ? true : v));
  }

  function handleRestoreRow(i) {
    setCollapsedRows((prev) => prev.map((v, idx) => idx === i ? false : v));
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
      // Auto-check "Aucune exigence" when "Non autorisée" is selected and declaration was not manually set
      const declarationUpdate = value === 'Non autorisée' && !r.declaration ? { declaration: 'aucune' } : {};
      return prev.map((row, idx) => idx === i ? { ...row, ia: value, justification, ...declarationUpdate } : row);
    });
    setErrors((prev) => prev.map((e, idx) => idx === i ? { ...e, ia: false, justification: false } : e));
  }

  function handleIaChange(i, value) {
    if (!rows[i].checked) {
      // Auto-check the row and set IA level in one atomic update
      const autoDecl = value === 'Non autorisée' ? { declaration: 'aucune' } : {};
      setRows((prev) => prev.map((r, idx) => idx === i ? { ...defaultRowState(), checked: true, ia: value, justification: GABARITS[value], ...autoDecl } : r));
      setErrors((prev) => prev.map((e, idx) => idx === i ? defaultErrors() : e));
      return;
    }
    const currentJust = rows[i].justification.trim();
    const isTemplate = Object.values(GABARITS).includes(currentJust) || !currentJust;
    if (!isTemplate) {
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
      if (!justText && !r.justification_vierge) {newErrors[i].justification = true;valid = false;}
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
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Exigences de déclaration d'utilisation de SIA</h2><p style="font-family:Arial,sans-serif;">Pour chacune des étapes de réalisation de l'évaluation ci-dessous, vous devez respecter les exigences de déclaration de l'utilisation de systèmes d'intelligence artificielle générative.</p>` : '';
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
      justification_vierge: r.justification_vierge,
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
    xml += `  <ordre>${etapesOrder.map((i) => ETAPES[i].id).join(',')}</ordre>\n`;
    xml += `  <etapes>\n`;
    rowsData.forEach((r) => {
      xml += `    <etape id="${ETAPES[r.index].id}">\n`;
      xml += `      <checked>${r.checked}</checked>\n`;
      xml += `      <ia>${escapeXml(r.ia)}</ia>\n`;
      xml += `      <justification>${escapeXml(r.justification)}</justification>\n`;
      xml += `      <justification_vierge>${r.justification_vierge}</justification_vierge>\n`;
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

    const now = new Date();
    const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
    const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    const coursPart = identification.cours ? slugify(identification.cours) : 'cours';
    const evalPart = identification.evaluation ? slugify(identification.evaluation) : 'evaluation';
    const filename = `sauvegarde-${coursPart}-${evalPart}-${dateStr}.txt`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
          const etapeId = node.getAttribute('id');
          const idx = ETAPES.findIndex((e) => e.id === etapeId);
          if (idx === -1) return;
          const get = (tag) => node.querySelector(tag)?.textContent ?? '';
          newRows[idx] = {
            checked: get('checked') === 'true',
            ia: get('ia'),
            justification: get('justification'),
            justification_vierge: get('justification_vierge') === 'true',
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

        // Restore order if present (stored as comma-separated ids)
        const ordreNode = root.querySelector('ordre');
        if (ordreNode) {
          const ids = ordreNode.textContent.split(',').map((s) => s.trim()).filter(Boolean);
          const parsedOrder = ids.map((id) => ETAPES.findIndex((e) => e.id === id)).filter((i) => i !== -1);
          // Append any ids missing from the saved order (e.g. new steps added later)
          const missing = ETAPES.map((_, i) => i).filter((i) => !parsedOrder.includes(i));
          setEtapesOrder([...parsedOrder, ...missing]);
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

  const identFilled = identification.cours.trim() && identification.evaluation.trim() && identification.enseignants.trim();

  function handleOpenBlankEval() {
    const payload = {
      identification: { cours: identification.cours, session: '', enseignants: identification.enseignants, evaluation: '' },
      highlightEvaluation: true
    };
    localStorage.setItem('guide_copy_state', JSON.stringify(payload));
    window.open(window.location.href + '?copy=1', '_blank');
  }

  function handleOpenCopyEval() {
    // Serialize current state to localStorage then open new tab
    const payload = {
      identification: { ...identification, evaluation: '' },
      rows,
      etapesOrder,
      collapsedRows,
      highlightEvaluation: true
    };
    localStorage.setItem('guide_copy_state', JSON.stringify(payload));
    window.open(window.location.href + '?copy=1', '_blank');
  }

  // On mount: check if we should restore a copy
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('copy') === '1') {
      const raw = localStorage.getItem('guide_copy_state');
      if (raw) {
        try {
          const payload = JSON.parse(raw);
          localStorage.removeItem('guide_copy_state');
          setIdentification(payload.identification || { cours: '', session: '', enseignants: '', evaluation: '' });
          setRows(payload.rows || ETAPES.map(() => defaultRowState()));
          setEtapesOrder(payload.etapesOrder || ETAPES.map((_, i) => i));
          setCollapsedRows(payload.collapsedRows || ETAPES.map(() => false));
          setErrors(ETAPES.map(() => defaultErrors()));
          setSubmitted(false);
          setSelections([]);
          if (payload.highlightEvaluation) {
            setHighlightEvaluation(true);
            setTimeout(() => {
              const el = document.getElementById('field-evaluation');
              if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }, 300);
          }
        } catch {}
      }
    }
  }, []);

  const errorStyle = { color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' };
  const inputErrorBorder = { border: '2px solid #E41E25', background: '#fff4f4' };

  return (
    <div style={{ background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
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
        .synthese-section { margin-top: 28px; padding: 16px; border: 1px solid #ffc103; border-radius: 8px; background: #fdfdff; }
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

      <h1 className="mr-12 mb-4 ml-12 text-2xl font-semibold">Assistant à la rédaction des directives d'utilisation des SIA pour une évaluation</h1>
      <div className="mb-2">Ce formulaire interactif permet de préciser les autorisations et directives d’utilisation de fonctionnalités ou systèmes d’intelligence artificielle (SIA) afin d’obtenir des consignes complètes à transmettre aux étudiantes et étudiants.</div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8, color: '#231F20' }} className="text-lg font-bold uppercase">❓ Comment ça fonctionne?</h2>
      <ol style={{ listStyleType: 'decimal', paddingLeft: 20, marginTop: 8 }} className="pb-2">
      <li>Remplissez la section d'identification.</li>
      <li>Sélectionnez uniquement les étapes de réalisation qui s'appliquent à cette évaluation, puis cochez le niveau d'autorisation d'utilisation des SIA pour chaque étape retenue.</li>
      <li>Choisissez et personnalisez au besoin les directives et exigences de déclaration — soyez bref et précis.</li>
      <li>Cliquez sur Soumettre pour obtenir une synthèse. Modifiez au besoin et soumettre à nouveau.</li>
      <li>Partagez ces directives dans Brio ou intégrez-le les consignes de l'évaluation.</li>
      <li>(Optionnel) Transposez ces directives dans un <a href="#declaration" target="self" className="text-blue-800 underline">formulaire de déclaration d'utilisation des SIA</a> que les personnes étudiantes devront remplir en ligne et joindre à leur soumission (deux versions disponibles).</li>
      </ol>
    💡 Un doute sur la démarche? Un <a href="https://www.enseigner.ulaval.ca/qui-peut-maider" target="blank" className="text-blue-800 underline">conseiller ou une conseillère en faculté</a> peut vous accompagner.<br /><br />

    🔒 Vos données ne sont pas conservées. Créez un <a href="#sauvegarde" className="text-blue-800 underline">fichier de sauvegarde</a> qui vous permettra de reprendre votre travail plus tard (<a href="#sauvegarde" className="text-blue-800 underline">importer un fichier de sauvegarde</a> existant).
        </div>
        <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 4 }}>
          <button
            type="button"
            onClick={() => setAProposOpen((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit', fontSize: '1.0em', fontWeight: 'bold', color: '#231F20', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '0.8em', color: '#888', display: 'inline-block', transform: aProposOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
            🧠 À propos…
          </button>
          {aProposOpen &&
          <div style={{ textAlign: 'left', paddingTop: 6 }}>
              Cette application vous est offerte gratuitement par le <a href="https://www.enseigner.ulaval.ca/a-propos" target="_blank" className="text-blue-800 underline">Service de soutien à l'enseignement</a> de l'Université Laval.<br /><br />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a839e74b536a607f6d9cc8/ce0c154f6_20240824_AIA_FR_EN.png" alt="Aidée de l'intelligence artificielle - crédit de l'image 2023 par Martine Peters CC BY-NC-SA 4.0" style={{ float: 'right', width: 80, marginLeft: 12, marginBottom: 4 }} />
              <b>Déclaration d'utilisation de SIA: Aidée de l'IA.</b><br />L'idée originale, la logique et les contenus de cette application ont été développés par des humains, qui ont utilisé des SIA conversationnels pour aider avec la génération de texte et la reformulation (ChatGPT, Gemini et Microsoft Copilot). Ce travail est basé sur un guide destiné au personnel enseignant du Service pédagogique FSA ULaval.  Tous les textes présentés ont été validés par l'équipe de développement. Le code a été développé par Mathieu Plourde avec l'aide de ChatGPT et Claude, mais plus particulièrement par Base44 pour cette version actuelle.<br /><br />Elle est développée et maintenue par Mathieu Plourde, CC-BY 4.0 2026 (version alpha 5).
            </div>
          }
        </div>
      </div>

      {/* Identification section */}
      <div id="evaluation-ciblee" style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, color: '#231F20', fontSize: '1.1em', fontWeight: 'bold', marginBottom: 6 }}>Évaluation ciblée</h2>
        <p style={{ margin: '0 0 14px 0', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>Les champs obligatoires de cette section d'identification doivent être valides pour continuer.</p>
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
            <input id="field-evaluation" type="text" value={identification.evaluation} onChange={(e) => {setIdentification((p) => ({ ...p, evaluation: e.target.value }));setIdentErrors((p) => ({ ...p, evaluation: false }));setHighlightEvaluation(false);}}
            placeholder="ex. Travail final"
            style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: highlightEvaluation ? '2px solid #00A4E4' : identErrors.evaluation ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: highlightEvaluation ? '#e8f6fd' : identErrors.evaluation ? '#fff4f4' : 'white', boxSizing: 'border-box', transition: 'border 0.3s, background 0.3s' }} />
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

      <div style={{ position: 'relative' }}>
        {!identFilled && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs requis dans la section Évaluation ciblée" />}
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', opacity: identFilled ? 1 : 0.5, pointerEvents: identFilled ? 'auto' : 'none' }}>
        <h2 style={{ marginTop: 0, color: '#231F20', fontSize: '1.1em', fontWeight: 'bold', marginBottom: 14 }}>Étapes de réalisation, permissions et exigences</h2>
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
                  return (
                    <Draggable key={etape.id} draggableId={etape.id} index={pos}>
                      {(provided, snapshot) => (
                        <EtapeRow
                          etape={etape}
                          i={i}
                          pos={pos}
                          etapesOrderLength={etapesOrder.length}
                          r={rows[i]}
                          err={errors[i]}
                          collapsed={collapsedRows[i]}
                          provided={provided}
                          snapshot={snapshot}
                          onCheckbox={handleCheckbox}
                          onCollapseRow={handleCollapseRow}
                          onRestoreRow={handleRestoreRow}
                          onIaChange={handleIaChange}
                          onOpenDirectiveModal={openDirectiveModal}
                          onToggleVierge={(idx) => {
                            const nextVierge = !rows[idx].justification_vierge;
                            setRows((prev) => prev.map((row, j) => j === idx ? { ...row, justification_vierge: nextVierge, justification: nextVierge ? '' : row.justification } : row));
                            setErrors((prev) => prev.map((e, j) => j === idx ? { ...e, justification: false } : e));
                          }}
                          onUpdateRow={updateRow}
                          onOpenDeclModal={openDeclModal}
                          onMoveEtape={moveEtape}
                        />
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </tbody>
            }
          </Droppable>
        </table>
        </DragDropContext>
        <br />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="submit" className="btn-primary" style={{ fontSize: '1.425em', padding: '14px 28px' }}>✅ Générer les directives mises en forme</button>
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
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => setShowNewEvalDialog(true)}
            disabled={!submitted}
            style={{ background: submitted ? '#4a4a4a' : '#b0b0b0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 5, cursor: submitted ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.95em', opacity: submitted ? 1 : 0.6 }}>
            ➕ Créer des directives pour une autre évaluation
          </button>
        </div>
      </form>
      </div>

      {/* ===== SYNTHESIS SECTIONS ===== */}
      {submitted &&
      <div id="synthese-container" key={submitKey}>
          {/* Section Brio */}
          <div id="brio-section"><BrioSection selections={selections} /></div>
          {/* Synthèses accordion */}
          <div id="syntheses" className="synthese-section">
            <h2 className="my-2 text-lg font-semibold text-center">Synthèses</h2>
            {/* Espace pour explications sous le titre */}
            <div id="syntheses-description">Trois options de mise en forme sont disponibles. Utilisez la fonction <strong>Copier pour coller en ligne (Brio)</strong> de l'une des synthèses ci-dessous dans la section <strong>Précisions sur le niveau sélectionné</strong> ou téléchargez une version Word à intégrer dans vos directives. <br /><br />
            Vous n'aimez pas une formulation? Vous pourrez modifier le contenu après avoir collé ou téléchargé la version de votre choix.</div>
            <Accordion type="single" defaultValue="texte-continu" collapsible className="mt-4">
              <AccordionItem value="texte-continu">
                <AccordionTrigger className="text-base font-semibold">Synthèse en texte continu</AccordionTrigger>
                <AccordionContent>
                  <div style={{ border: '1px solid #aaa', background: '#fff', padding: 12, borderRadius: 6 }}
                dangerouslySetInnerHTML={{ __html: buildTextHTML(selections) }} />
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <button type="button" className="btn-primary" onClick={() => copyRichText(buildTextHTML(selections), 's2-brio')}>Copier pour coller en ligne (Brio)</button>
                    {copyMsgs['s2-brio'] && <span className="copy-ok">Copié !</span>}
                    <button type="button" className="btn-secondary" onClick={() => downloadWord(buildTextHTML(selections, true), 'synthese-texte.doc')}>Télécharger en format Word</button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tableau">
                <AccordionTrigger className="text-base font-semibold">Tableau synthèse</AccordionTrigger>
                <AccordionContent>
                  {buildIdentLine() && <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.95em', marginBottom: 8 }}>{buildIdentLine()}</p>}
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
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <button type="button" className="btn-primary" onClick={() => copyRichText(buildTableHTML(selections), 's1-brio')}>Copier pour coller en ligne (Brio)</button>
                    {copyMsgs['s1-brio'] && <span className="copy-ok">Copié !</span>}
                    <button type="button" className="btn-secondary" onClick={() => downloadWord(buildTableHTML(selections, true), 'tableau-synthese.doc')}>Télécharger en format Word</button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="declaration">
                <AccordionTrigger className="text-base font-semibold">Exigences de déclaration d'utilisation de SIA</AccordionTrigger>
                <AccordionContent>
                  {buildIdentLine() && <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.95em', marginBottom: 8 }}>{buildIdentLine()}</p>}
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
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <button type="button" className="btn-primary" onClick={() => copyRichText(buildDeclTableHTML(selections), 's3-brio')}>Copier pour coller en ligne (Brio)</button>
                    {copyMsgs['s3-brio'] && <span className="copy-ok">Copié !</span>}
                    <button type="button" className="btn-secondary" onClick={() => downloadWord(buildDeclTableHTML(selections, true), 'exigences-declaration.doc')}>Télécharger en format Word</button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      }

      {/* ===== IA CHANGE CONFIRM DIALOG ===== */}
      {iaChangeConfirm &&
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
      }

      {/* ===== DIRECTIVE MODAL ===== */}
      <DirectiveSelectionModal
        isOpen={modalState.open}
        onClose={() => setModalState((s) => ({ ...s, open: false }))}
        onSave={(html) => {
          const { rowIndex } = modalState;
          if (rowIndex === null) return;
          const hasContent = html && html.replace(/<[^>]*>/g, '').trim().length > 0;
          setRows((prev) => prev.map((r, idx) => idx === rowIndex ? { ...r, justification: html, justification_vierge: hasContent ? false : r.justification_vierge } : r));
          setErrors((prev) => prev.map((e, idx) => idx === rowIndex ? { ...e, justification: false } : e));
        }}
        initialValue={modalState.rowIndex !== null ? rows[modalState.rowIndex]?.justification_vierge ? '' : rows[modalState.rowIndex]?.justification : ''}
        currentEtapeId={modalState.rowIndex !== null ? ETAPES[modalState.rowIndex]?.id : null}
        currentIaOption={modalState.rowIndex !== null ? rows[modalState.rowIndex]?.ia : null} />


      {/* ===== DECLARATION FIELD MODAL ===== */}
      <DeclarationFieldModal
        isOpen={declModalState.open}
        onClose={() => setDeclModalState((s) => ({ ...s, open: false }))}
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
        fieldCode={declModalState.fieldCode} />


      {/* ===== SAVE & LOAD ===== */}
      <div id="sauvegarde" className="save-section">
        <h2 style={{ marginTop: 0, color: '#231F20' }} className="my-2 text-xl font-semibold text-center">Sauvegarde et restauration</h2>
        <button type="button" className="btn-primary" onClick={handleSave}>💾 Créer un fichier de sauvegarde</button>
        <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
        📂 Importer un fichier de sauvegarde
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,.txt"
          style={{ display: 'none' }}
          onChange={handleLoad} />

        {showNewEvalDialog &&
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, padding: '28px 32px', maxWidth: 460, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <p style={{ marginBottom: 20, lineHeight: 1.6, fontSize: '1em', color: '#231F20', fontWeight: 'bold' }}>
              Désirez-vous un formulaire vierge ou une copie de celui-ci ?
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => { setShowNewEvalDialog(false); handleOpenBlankEval(); }}
                style={{ background: '#6c757d', color: 'white', border: 'none', borderRadius: 5, padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', flex: 1 }}>
                📄 Formulaire vierge
              </button>
              <button type="button" onClick={() => { setShowNewEvalDialog(false); handleOpenCopyEval(); }}
                style={{ background: '#00A4E4', color: 'white', border: 'none', borderRadius: 5, padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', flex: 1 }}>
                📋 Copie de celui-ci
              </button>
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button type="button" onClick={() => setShowNewEvalDialog(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9em' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
        }

        {saveError &&
        <div style={{ color: '#E41E25', marginTop: 10, padding: '8px 12px', background: '#fff4f4', border: '1px solid #E41E25', borderRadius: 5 }}>
            ⚠ {saveError}
          </div>
        }
      </div>

      {/* ===== DÉCLARATION ÉTUDIANTE ===== */}
      {submitted && <div id="declaration" style={{ marginTop: 20, padding: '16px 20px', border: '1px solid #1895FD', borderRadius: 8, background: 'white' }}>
        <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: '1.3em', fontWeight: 'bold', color: '#231F20' }}>
          Formulaire de déclaration pour personnes étudiantes
        </h2>
        <div style={{ marginBottom: 16, fontSize: '0.93em', color: '#444', lineHeight: 1.6 }}>
          Au-delà des directives que vous avez rédigées, si vous désirez que vos étudiantes et étudiants vous soumettent une déclaration d'utilisation des SIA dans le cadre de cette évaluation, vous pouvez leur offrir un gabarit Word déjà filtré ou une version interactive en ligne (déclaration par étape de réalisation ou par système d'intelligence artificielle utilisé).
        </div>

        {/* Toggle pill principal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: '0.9em', color: '#555', fontWeight: 'bold' }}>Type de déclaration :</span>
          <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid #ccc', overflow: 'hidden', background: '#f0f0f0' }}>
            <button type="button"
              onClick={() => { setDeclMode('etape'); setInstructorInstructions(INSTRUCTIONS_PAR_ETAPE); }}
              style={{ padding: '7px 18px', fontSize: '0.9em', fontWeight: declMode === 'etape' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: declMode === 'etape' ? '#00A4E4' : 'transparent', color: declMode === 'etape' ? 'white' : '#555', transition: 'background 0.15s' }}>
              Déclaration par étape
            </button>
            <button type="button"
              onClick={() => { setDeclMode('outil'); setInstructorInstructions(INSTRUCTIONS_PAR_OUTIL); }}
              style={{ padding: '7px 18px', fontSize: '0.9em', fontWeight: declMode === 'outil' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: declMode === 'outil' ? '#e6b800' : 'transparent', color: declMode === 'outil' ? '#231F20' : '#555', transition: 'background 0.15s' }}>
              Déclaration par SIA
            </button>
          </div>
        </div>

        {/* Gabarit Word en haut */}
        <DeclarationGabarit
          selections={selections}
          identification={identification}
          isGenerated={submitted}
          mode={declMode}
        />

        {/* Formulaire interactif (Brio) en dessous */}
        <div style={{ marginTop: 20, borderTop: '1px solid #e0e0e0', paddingTop: 20 }}>
          <div style={{ padding: '16px 20px', border: `1px solid ${declMode === 'outil' ? '#e6c000' : '#b3d9f7'}`, borderRadius: 8, background: declMode === 'outil' ? '#fffde7' : '#f7fbff' }}>
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: '1.05em', fontWeight: 'bold', color: '#231F20' }}>
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a839e74b536a607f6d9cc8/43d3bfa87_logo-brio.png" alt="Logo Brio" style={{ float: 'right', width: 70, marginLeft: 12, marginBottom: 4 }} />
              ✅ Option B : formulaire interactif en ligne (Brio)
            </h3>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.95em', lineHeight: 1.6 }}>Nous vous encourageons à ajouter un item de type <a href="https://aide.brioeducation.ca/enseignant/evaluations/creer-parametrer-les-evaluations/gerer-la-description-dune-evaluation/" target="blank" className="text-blue-800 underline">Fichier</a> juste au dessus de la section <i>Utilisation de l'intelligence artificielle</i> dans les instructions de votre évaluation. Téléchargez et partagez le fichier de sauvegarde de la section précédente.</p>
            </div>

            <div style={{ marginTop: 14, padding: '14px 18px', background: '#fff', border: '1px solid #ccc', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.93em' }}>À copier dans le champ Titre de la liste:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText('Déclaration d\'utilisation de systèmes d\'intelligence artificielle (SIA)');
                      setCopyTitleOk(true);
                      setTimeout(() => setCopyTitleOk(false), 1800);
                    }
                  }}
                  style={{ fontSize: '0.85em', padding: '6px 12px' }}>
                    Copier pour coller en ligne (Brio)
                  </button>
                  {copyTitleOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
                </div>
              </div>
              <input
              type="text"
              value={declarationTitle}
              onChange={(e) => setDeclarationTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: '0.9em',
                border: '1px solid #ccc',
                borderRadius: 4,
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }} />
            </div>

            <div style={{ marginTop: 14, padding: '14px 18px', background: '#fff', border: '1px solid #ccc', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.93em' }}>À copier dans la section Description:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                  type="button"
                  className="btn-primary"
                  onClick={async () => {
                    if (navigator.clipboard && window.ClipboardItem) {
                      const plain = instructorInstructions.replace(/<[^>]+>/g, '');
                      const blobHtml = new Blob([instructorInstructions], { type: 'text/html' });
                      const blobText = new Blob([plain], { type: 'text/plain' });
                      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]);
                    } else if (navigator.clipboard) {
                      await navigator.clipboard.writeText(instructorInstructions.replace(/<[^>]+>/g, ''));
                    }
                    setCopyDescriptionOk(true);
                    setTimeout(() => setCopyDescriptionOk(false), 1800);
                  }}
                  style={{ fontSize: '0.85em', padding: '6px 12px' }}>
                    Copier pour coller en ligne (Brio)
                  </button>
                  {copyDescriptionOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
                </div>
              </div>
              <ReactQuill
              value={instructorInstructions}
              onChange={setInstructorInstructions}
              modules={{
                toolbar: [
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link']]
              }}
              placeholder="Écrivez des instructions supplémentaires pour les personnes étudiantes..."
              style={{
                fontSize: '0.9em',
                backgroundColor: 'white',
                borderRadius: 4,
                minHeight: 120
              }}
              theme="snow" />
            </div>

            <div style={{ marginTop: 14 }}>
              <button type="button" className="btn-primary" onClick={handleSave}>💾 Télécharger un fichier de sauvegarde</button>
            </div>

            <div style={{ marginTop: 14, padding: '14px 18px', background: '#fff', border: '1px solid #ccc', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.93em' }}>À copier dans le champ Description du fichier:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(declarationFieldDescription);
                      setCopyFileDescOk(true);
                      setTimeout(() => setCopyFileDescOk(false), 1800);
                    }
                  }}
                  style={{ fontSize: '0.85em', padding: '6px 12px' }}>
                    Copier pour coller en ligne (Brio)
                  </button>
                  {copyFileDescOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
                </div>
              </div>
              <textarea
              value={declarationFieldDescription}
              onChange={(e) => setDeclarationFieldDescription(e.target.value)}
              rows={1}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: '0.9em',
                border: '1px solid #ccc',
                borderRadius: 4,
                boxSizing: 'border-box',
                backgroundColor: 'white',
                resize: 'none'
              }} />
            </div>
          </div>{/* fin wrapper bleu Option B */}
        </div>{/* fin formulaire interactif Brio */}
      </div>
      }{/* fin #declaration */}

      <PageRightNav submitted={submitted} />
      </div>{/* fin conteneur centré */}
    </div>
  );
}