import React, { useState, useRef, useEffect } from 'react';
import ETAPES from '@/components/etapesData';
import ReactQuill from 'react-quill';
import EtapeShuttle from '@/components/EtapeShuttle';
import SIA_LIST_RAW from '@/components/listeSIA';

const SIA_LIST = [...SIA_LIST_RAW].sort((a, b) => a.localeCompare(b, 'fr')).concat(['Autre']);

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
  ]
};

function parseXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) return { error: 'parse', raw: xmlText };
  const root = doc.querySelector('guide-ia');
  if (!root) return { error: 'structure', raw: xmlText };
  try {
    const getI = (node, tag) => node?.querySelector(tag)?.textContent ?? '';
    const identNode = root.querySelector('identification');
    const identification = {
      cours: getI(identNode, 'cours'),
      session: getI(identNode, 'session'),
      enseignants: getI(identNode, 'enseignants'),
      evaluation: getI(identNode, 'evaluation')
    };
    const ordreNode = root.querySelector('ordre');
    const ordreIds = ordreNode ? ordreNode.textContent.split(',').map(s => s.trim()).filter(Boolean) : null;
    const etapeNodes = doc.querySelectorAll('etape');
    const etapeMap = {};
    etapeNodes.forEach(node => { const id = node.getAttribute('id'); if (id) etapeMap[id] = node; });
    const orderedIds = ordreIds || Object.keys(etapeMap);
    const etapes = [];
    orderedIds.forEach(id => {
      const node = etapeMap[id];
      if (!node) return;
      if (node.querySelector('checked')?.textContent !== 'true') return;
      const get = tag => node.querySelector(tag)?.textContent ?? '';
      const found = ETAPES.find(e => e.id === id);
      let etapeInfo;
      if (found && id !== 'autres') {
        etapeInfo = { ...found };
      } else {
        etapeInfo = { id: 'autres', libelle: get('libelle_custom') || (found ? found.libelle : id), parenthese: get('exemples') || (found ? found.parenthese : '') };
      }
      etapes.push({
        etapeInfo,
        ia: get('ia'),
        justification: get('justification'),
        declaration: get('declaration'),
        decl_iagraphie: get('decl_iagraphie') === 'true',
        decl_iagraphie_text: get('decl_iagraphie_text'),
        decl_traces: get('decl_traces') === 'true',
        decl_traces_text: get('decl_traces_text'),
        decl_logique: get('decl_logique') === 'true',
        decl_logique_text: get('decl_logique_text'),
      });
    });
    return { ok: true, identification, etapes };
  } catch { return { error: 'structure', raw: xmlText }; }
}

function defaultOutilEntry() {
  return { outil: '', outilLibre: '', etapes: [] };
}

export default function DeclarationOutil() {
  const [data, setData] = useState(null);
  const [aucunSIA, setAucunSIA] = useState(false);
  const [aucunSIACommentaire, setAucunSIACommentaire] = useState('');
  const [commentaireGlobal, setCommentaireGlobal] = useState('');
  const [aucunSIAJustification, setAucunSIAJustification] = useState('');
  const [aucunSIAJustifError, setAucunSIAJustifError] = useState(false);
  const [outilEntries, setOutilEntries] = useState([defaultOutilEntry()]);
  const [entryErrors, setEntryErrors] = useState([{}]);
  const [studentNom, setStudentNom] = useState('');
  const [studentGroupe, setStudentGroupe] = useState('');
  const [nomError, setNomError] = useState(false);
  const [isEquipe, setIsEquipe] = useState(false);
  const [nomEquipe, setNomEquipe] = useState('');
  const [equipiers, setEquipiers] = useState(['']);
  const [equipiersErrors, setEquipiersErrors] = useState([]);
  const [directivesVisible, setDirectivesVisible] = useState(false);
  const [sessionOverride, setSessionOverride] = useState('');
  const [sessionEditMode, setSessionEditMode] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [apercu, setApercu] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [copyOk, setCopyOk] = useState(false);
  const [obligNonCouvJustif, setObligNonCouvJustif] = useState('');
  const [obligNonCouvJustifError, setObligNonCouvJustifError] = useState(false);
  const [nonAutoriseeJustifs, setNonAutoriseeJustifs] = useState({});
  const [nonAutoriseeJustifErrors, setNonAutoriseeJustifErrors] = useState({});
  const [exigencesResponses, setExigencesResponses] = useState({});
  const [exigencesErrors, setExigencesErrors] = useState({});
  const [, forceUpdate] = useState(0);
  const fileInputRef = useRef();
  const apercuRef = useRef();

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = parseXML(ev.target.result);
      setData(result);
      if (result.ok) { setSessionOverride(''); setSessionEditMode(false); setSessionError(false); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function updateEntry(i, field, value) {
    setOutilEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
    setEntryErrors(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: false } : e));
  }

  function toggleEtape(entryIdx, etapeId) {
    setOutilEntries(prev => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      const has = e.etapes.includes(etapeId);
      return { ...e, etapes: has ? e.etapes.filter(id => id !== etapeId) : [...e.etapes, etapeId] };
    }));
    setEntryErrors(prev => prev.map((e, idx) => idx === entryIdx ? { ...e, etapes: false } : e));
  }

  function addEntry() {
    setOutilEntries(prev => [...prev, defaultOutilEntry()]);
    setEntryErrors(prev => [...prev, {}]);
  }

  function removeEntry(i) {
    setOutilEntries(prev => prev.filter((_, idx) => idx !== i));
    setEntryErrors(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleSoumettre() {
    let hasErrors = false;
    const effectiveSession = data.identification.session && !sessionEditMode ? data.identification.session : sessionOverride.trim();
    if (!effectiveSession) { setSessionError(true); hasErrors = true; } else { setSessionError(false); }
    if (!studentNom.trim()) { setNomError(true); hasErrors = true; } else { setNomError(false); }
    if (isEquipe) {
      const errs = equipiers.map(n => !n.trim());
      setEquipiersErrors(errs);
      if (errs.some(Boolean)) hasErrors = true;
    }
    if (aucunSIA) {
      const etapesObligatoires = data.etapes.filter(e => e.ia?.toLowerCase().includes('obligatoire'));
      if (etapesObligatoires.length > 0 && !aucunSIAJustification.trim()) {
        setAucunSIAJustifError(true);
        hasErrors = true;
      } else {
        setAucunSIAJustifError(false);
      }
    }
    if (!aucunSIA) {
      // Validate obligatoires non couvertes justification
      if (obligatoiresNonCouvertes.length > 0 && !obligNonCouvJustif.trim()) {
        setObligNonCouvJustifError(true); hasErrors = true;
      } else { setObligNonCouvJustifError(false); }

      // Validate non autorisées justifications
      const newNonAutoriseeErrors = {};
      nonAutoriseesSelectionnees.forEach(e => {
        if (!nonAutoriseeJustifs[e.etapeInfo.id]?.trim()) {
          newNonAutoriseeErrors[e.etapeInfo.id] = true; hasErrors = true;
        }
      });
      setNonAutoriseeJustifErrors(newNonAutoriseeErrors);

      // Validate exigences responses
      const newExigencesErrors = {};
      etapesAvecExigences.forEach(etape => {
        const id = etape.etapeInfo.id;
        const resp = exigencesResponses[id] || {};
        if (etape.decl_iagraphie && !resp.iagraphie?.trim() && !resp.iagraphieAilleurs) {
          newExigencesErrors[`${id}_iagraphie`] = true; hasErrors = true;
        }
        if (etape.decl_traces && !resp.traces?.trim() && !resp.tracesAilleurs) {
          newExigencesErrors[`${id}_traces`] = true; hasErrors = true;
        }
        if (etape.decl_logique && !resp.logique?.trim() && !resp.logiqueAilleurs) {
          newExigencesErrors[`${id}_logique`] = true; hasErrors = true;
        }
      });
      setExigencesErrors(newExigencesErrors);

      const newEntryErrors = outilEntries.map(e => {
        const err = {};
        if (!e.outil) err.outil = true;
        if (e.outil === 'Autre' && !e.outilLibre.trim()) err.outilLibre = true;
        if (e.etapes.length === 0) err.etapes = true;
        return err;
      });
      setEntryErrors(newEntryErrors);
      if (newEntryErrors.some(e => Object.keys(e).length > 0)) hasErrors = true;
    }
    if (hasErrors) { setSubmitStatus({ ok: false }); return; }

    const tzCodes = { 'America/Toronto': 'HNE', 'America/Montreal': 'HNE', 'America/Ottawa': 'HNE', 'America/Vancouver': 'HNP', 'America/Edmonton': 'HNR', 'America/Winnipeg': 'HNC', 'America/Halifax': 'HNA', 'Europe/Paris': 'HEC' };
    const now = new Date();
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMin = -now.getTimezoneOffset();
    const offsetFallbacks = { '-300': 'HNE', '-360': 'HNC', '-420': 'HNR', '-480': 'HNP', '0': 'UTC', '60': 'HEC' };
    const tzCode = tzCodes[userTz] || offsetFallbacks[String(offsetMin)] || 'UTC';
    const timestamp = now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ' à ' + now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') + ' ' + tzCode;

    setApercu({
      identification: { ...data.identification, session: effectiveSession },
      studentNom, studentGroupe, isEquipe, nomEquipe,
      equipiers: isEquipe ? [studentNom, ...equipiers] : [studentNom],
      etapes: data.etapes,
      aucunSIA,
      aucunSIACommentaire,
      aucunSIAJustification,
      outilEntries,
      commentaireGlobal,
      obligNonCouvJustif,
      nonAutoriseeJustifs,
      exigencesResponses,
      timestamp
    });
    setSubmitStatus({ ok: true, time: new Date() });
    setTimeout(() => apercuRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function formatExigencesHTML(etape) {
    if (etape.declaration === 'aucune') return '<ul style="margin:0;padding-left:18px;list-style-type:disc;"><li style="display:list-item;">Aucune exigence</li></ul>';
    const items = [];
    if (etape.decl_iagraphie) items.push(`Références et IAgraphie : ${etape.decl_iagraphie_text}`);
    if (etape.decl_traces) items.push(`Conserver les traces suivantes : ${etape.decl_traces_text}`);
    if (etape.decl_logique) items.push(`Expliquer la logique d'utilisation : ${etape.decl_logique_text}`);
    if (items.length === 0) return '—';
    return `<ul style="margin:0;padding-left:18px;list-style-type:disc;">${items.map(i => `<li style="display:list-item;">${i}</li>`).join('')}</ul>`;
  }

  function getOutilLabel(entry) {
    return entry.outil === 'Autre' && entry.outilLibre.trim() ? entry.outilLibre.trim() : entry.outil;
  }

  function buildApercuHTML(ap) {
    const titleHtml = `<h1 style="font-family:Georgia,serif;font-size:24px;font-weight:bold;text-align:center;margin:0 0 8pt 0;padding-bottom:8pt;border-bottom:1px solid black;color:#000;">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)</h1>`;
    const cours = ap.identification.cours || '[cours]';
    const evaluation = ap.identification.evaluation || '[évaluation]';
    const session = ap.identification.session || '[session]';
    const enseignants = ap.identification.enseignants || '[personne enseignante]';

    let introHtml;
    if (ap.isEquipe) {
      const noms = ap.equipiers.filter(n => n.trim()).join(', ');
      const equipeInfo = ap.nomEquipe ? ` (équipe ${ap.nomEquipe})` : '';
      const groupeInfo = ap.studentGroupe ? `, groupe ${ap.studentGroupe}` : '';
      introHtml = `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;margin:0 0 8pt 0;">Nous, <strong>${noms}</strong>${equipeInfo}${groupeInfo}, soumettons cette déclaration dans le cadre de l'évaluation nommée <strong>${evaluation}</strong> du cours <strong>${cours}</strong> de la session <strong>${session}</strong>, enseigné par <strong>${enseignants}</strong>.</p>`;
    } else {
      const groupeInfo = ap.studentGroupe ? ` (groupe ${ap.studentGroupe})` : '';
      introHtml = `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;margin:0 0 8pt 0;">Je, <strong>${ap.studentNom}</strong>${groupeInfo}, soumets cette déclaration dans le cadre de l'évaluation nommée <strong>${evaluation}</strong> du cours <strong>${cours}</strong> de la session <strong>${session}</strong>, enseigné par <strong>${enseignants}</strong>.</p>`;
    }
    introHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;margin:0 0 11pt 0;">Conformément aux exigences de la personne enseignante, les renseignements suivants présentent ${ap.isEquipe ? 'notre' : 'ma'} démarche d'utilisation des systèmes d'intelligence artificielle.</p>`;

    const directivesTitle = `<h2 style="font-family:Georgia,serif;font-size:16pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">Directives de la personne enseignante</h2>`;
    let directivesTable = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:9px;margin-bottom:12pt;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:20%">Étape</th>
        <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:15%">Utilisation des SIA</th>
        <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:40%">Directives</th>
        <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:25%">Exigences de déclaration</th>
      </tr></thead><tbody>`;
    ap.etapes.forEach(etape => {
      const label = etape.etapeInfo.parenthese
        ? `<strong>${etape.etapeInfo.libelle}</strong><br><span style="color:#555;font-size:0.88em">(${etape.etapeInfo.parenthese})</span>`
        : `<strong>${etape.etapeInfo.libelle}</strong>`;
      directivesTable += `<tr>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${label}</td>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${etape.ia}</td>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${etape.justification}</td>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${formatExigencesHTML(etape)}</td>
      </tr>`;
    });
    directivesTable += '</tbody></table>';

    const declTitle = `<h2 style="font-family:Georgia,serif;font-size:16pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">${ap.isEquipe ? 'Notre' : 'Mon'} déclaration d'utilisation</h2>`;
    let declTable;
    if (ap.aucunSIA) {
      let aucunHtml = `<p style="font-family:Arial,sans-serif;font-size:11pt;font-style:italic;color:#555;margin:0 0 6pt 0;">Aucun système d'intelligence artificielle n'a été utilisé pour cette évaluation.</p>`;
      if (ap.aucunSIAJustification) {
        aucunHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 4pt 0;"><strong>Justification (étape(s) obligatoire(s)) :</strong></p><p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 8pt 0;white-space:pre-wrap;">${ap.aucunSIAJustification}</p>`;
      }
      if (ap.aucunSIACommentaire) {
        aucunHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 4pt 0;"><strong>Commentaires :</strong></p><p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 8pt 0;white-space:pre-wrap;">${ap.aucunSIACommentaire}</p>`;
      }
      declTable = aucunHtml;
    } else {
      declTable = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:11px;margin-bottom:12pt;">
        <thead><tr>
          <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;width:22%">Outil utilisé</th>
          <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;width:28%">Étapes de réalisation</th>
          <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;width:50%">Commentaires</th>
        </tr></thead><tbody>`;
      ap.outilEntries.forEach(entry => {
        const etapeLabels = entry.etapes.map(id => {
          const found = ap.etapes.find(e => e.etapeInfo.id === id);
          return found ? found.etapeInfo.libelle : id;
        }).join('<br>');
        declTable += `<tr>
          <td style="border:1px solid #ccc;padding:6px;vertical-align:top"><strong>${entry.outil === 'Autre' && entry.outilLibre ? entry.outilLibre : entry.outil}</strong></td>
          <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${etapeLabels}</td>
          <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${entry.description}</td>
        </tr>`;
      });
      declTable += '</tbody></table>';
      if (ap.commentaireGlobal?.trim()) {
        declTable += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:8pt 0 4pt 0;"><strong>Commentaires :</strong></p><p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 8pt 0;white-space:pre-wrap;">${ap.commentaireGlobal}</p>`;
      }
    }

    // Champs dynamiques
    let dynamiquesHtml = '';
    const hasDynamiques = (ap.obligNonCouvJustif && ap.obligNonCouvJustif.trim()) ||
      (ap.nonAutoriseeJustifs && Object.values(ap.nonAutoriseeJustifs).some(v => v?.trim())) ||
      (ap.exigencesResponses && Object.keys(ap.exigencesResponses).length > 0);
    if (hasDynamiques) {
      dynamiquesHtml += `<h2 style="font-family:Georgia,serif;font-size:16pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">Informations complémentaires</h2>`;
      if (ap.obligNonCouvJustif && ap.obligNonCouvJustif.trim()) {
        dynamiquesHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 4pt 0;"><strong>Justification — étape(s) obligatoire(s) non couvertes :</strong></p><p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 10pt 0;white-space:pre-wrap;">${ap.obligNonCouvJustif}</p>`;
      }
      if (ap.nonAutoriseeJustifs) {
        Object.entries(ap.nonAutoriseeJustifs).forEach(([id, justif]) => {
          if (!justif?.trim()) return;
          const etape = ap.etapes.find(e => e.etapeInfo.id === id);
          const label = etape ? etape.etapeInfo.libelle : id;
          dynamiquesHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 4pt 0;"><strong>Justification — étape non autorisée « ${label} » :</strong></p><p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 10pt 0;white-space:pre-wrap;">${justif}</p>`;
        });
      }
      if (ap.exigencesResponses) {
        Object.entries(ap.exigencesResponses).forEach(([id, resp]) => {
          const etape = ap.etapes.find(e => e.etapeInfo.id === id);
          const label = etape ? etape.etapeInfo.libelle : id;
          const parts = [];
          if (resp.iagraphieAilleurs) parts.push(`<em>Références et IAgraphie : déjà répondu dans le travail soumis.</em>`);
          else if (resp.iagraphie?.trim()) parts.push(`<strong>Références et IAgraphie :</strong> ${resp.iagraphie}`);
          if (resp.tracesAilleurs) parts.push(`<em>Traces conservées : déjà répondu dans le travail soumis.</em>`);
          else if (resp.traces?.trim()) parts.push(`<strong>Traces conservées :</strong> ${resp.traces}`);
          if (resp.logiqueAilleurs) parts.push(`<em>Logique d'utilisation : déjà répondu dans le travail soumis.</em>`);
          else if (resp.logique?.trim()) parts.push(`<strong>Logique d'utilisation :</strong> ${resp.logique}`);
          if (parts.length > 0) {
            dynamiquesHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 4pt 0;"><strong>Exigences de déclaration — ${label} :</strong></p><p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 10pt 0;">${parts.join('<br>')}</p>`;
          }
        });
      }
    }

    const affirmTitle = `<h2 style="font-family:Georgia,serif;font-size:16pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">La soumission de cette déclaration confirme que :</h2>`;
    const affirmList = [
      `Les informations fournies sont complètes et fidèles à ${ap.isEquipe ? 'notre' : 'mon'} utilisation réelle.`,
      `${ap.isEquipe ? 'Notre' : 'Mon'} utilisation des SIA est conforme aux règles établies par la personne enseignante pour ce travail.`,
      `${ap.isEquipe ? 'Nous avons' : 'J\'ai'} exercé ${ap.isEquipe ? 'notre' : 'mon'} jugement critique sur les contenus générés par les SIA.`,
      `Le travail soumis reflète ${ap.isEquipe ? 'notre' : 'ma'} propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.`,
      `${ap.isEquipe ? 'Nous comprenons' : 'Je comprends'} que l'omission ou une fausse déclaration constitue une infraction au Règlement disciplinaire.`
    ];
    const affirmHtml = `<ul style="margin:0 0 0 20px;padding-left:0;font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;">${affirmList.map(a => `<li style="margin-bottom:4pt">${a}</li>`).join('')}</ul>`;
    const timestampHtml = `<p style="font-family:Arial,sans-serif;font-size:10pt;color:#666;font-style:italic;margin:16pt 0 0 0;">Générée le ${ap.timestamp}</p>`;

    return titleHtml + introHtml + directivesTitle + directivesTable + declTitle + declTable + dynamiquesHtml + affirmTitle + affirmHtml + timestampHtml;
  }

  function copyDeclToClipboard(ap) {
    const htmlText = buildApercuHTML(ap);
    const plainText = htmlText.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '');
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = new Blob([htmlText], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': blobText })])
        .then(() => { setCopyOk(true); setTimeout(() => setCopyOk(false), 1800); })
        .catch(() => navigator.clipboard.writeText(htmlText).then(() => { setCopyOk(true); setTimeout(() => setCopyOk(false), 1800); }));
    } else {
      navigator.clipboard.writeText(htmlText).then(() => { setCopyOk(true); setTimeout(() => setCopyOk(false), 1800); });
    }
  }

  function downloadDeclWord(ap) {
    const content = buildApercuHTML(ap);
    const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"><title>Déclaration SIA</title><style>body{font-family:Arial,sans-serif;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px;}</style></head><body>${content}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'declaration-outil-sia.doc'; a.click();
    URL.revokeObjectURL(url);
  }

  const effectiveSession = data?.identification?.session && !sessionEditMode ? data.identification.session : sessionOverride.trim();
  const identOk = !!(effectiveSession && studentNom.trim() && (!isEquipe || (equipiers.length > 0 && equipiers[0].trim())));

  // Derived lists for exigences section (only relevant when !aucunSIA)
  const allSelectedEtapeIds = aucunSIA ? [] : [...new Set(outilEntries.flatMap(e => e.etapes))];
  const obligatoiresNonCouvertes = data?.etapes?.filter(e =>
    e.ia?.toLowerCase().includes('obligatoire') && !allSelectedEtapeIds.includes(e.etapeInfo.id)
  ) ?? [];
  const nonAutoriseesSelectionnees = data?.etapes?.filter(e =>
    e.ia?.toLowerCase().includes('non autorisé') && allSelectedEtapeIds.includes(e.etapeInfo.id)
  ) ?? [];
  const etapesAvecExigences = data?.etapes?.filter(e =>
    allSelectedEtapeIds.includes(e.etapeInfo.id) &&
    (e.decl_iagraphie || e.decl_traces || e.decl_logique) &&
    e.declaration !== 'aucune'
  ) ?? [];

  return (
    <div style={{ background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <style>{`
        :root { --rouge: #E41E25; --bleu: #00A4E4; }
        h1 { color: #E41E25; text-align: center; }
        .btn-primary { background-color: #00A4E4; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
        .btn-primary:hover { background-color: #0084b0; }
        .section-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .entry-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 18px; margin-bottom: 16px; }
        .locked-field { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 8px; font-size: 0.9em; line-height: 1.5; color: #333; }
        .raw-box { background: #fff8e1; border: 1px solid #f0c040; border-radius: 6px; padding: 14px; margin-top: 12px; font-size: 0.82em; white-space: pre-wrap; overflow-x: auto; font-family: monospace; max-height: 300px; overflow-y: auto; }
        .quill-wrapper .ql-editor { min-height: 100px; font-family: inherit; font-size: 0.93em; }
      `}</style>

      <h1 className="mb-4 text-2xl font-semibold">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA) dans le cadre d'une évaluation</h1>
      <p style={{ textAlign: 'center', color: '#555', marginBottom: 20, fontSize: '0.95em' }}>Formulaire par outil utilisé</p>

      {/* Upload zone */}
      {!data?.ok &&
        <div className="section-box" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16, fontSize: '1em' }}>
            Importez le fichier de sauvegarde fourni par la personne enseignante pour afficher les directives d'utilisation des SIA pour cette évaluation.
          </p>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            📂 Importer le fichier de sauvegarde
          </button>
          <input ref={fileInputRef} type="file" accept=".xml,.txt" style={{ display: 'none' }} onChange={handleFile} />
          {data?.error &&
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <div style={{ color: '#E41E25', fontWeight: 'bold', marginBottom: 8 }}>⚠ Ce fichier XML n'est pas conforme au format attendu.</div>
              <p style={{ fontSize: '0.9em', marginBottom: 8 }}>Le fichier ne peut pas être interprété automatiquement.</p>
              <button className="btn-primary" onClick={() => {
                const blob = new Blob([data.raw], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'contenu-brut.txt'; a.click();
                URL.revokeObjectURL(url);
              }}>💾 Sauvegarder la version brute</button>
              <div className="raw-box">{data.raw}</div>
            </div>
          }
        </div>
      }

      {data?.ok &&
        <>
          {/* Identification */}
          <div className="section-box">
            <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 4 }}>Identification</h2>
            <p style={{ margin: '0 0 10px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>Les champs obligatoires doivent être valides pour continuer.</p>

            {/* Identification info row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '0.95em', marginBottom: 14 }}>
              {data.identification.cours && <div><strong>Cours :</strong> {data.identification.cours}</div>}
              <div>
                <strong>Session :<span style={{ color: '#E41E25' }}> *</span></strong>{' '}
                {data.identification.session && !sessionEditMode
                  ? <span>{data.identification.session}{' '}
                    <button type="button" onClick={() => { setSessionOverride(data.identification.session); setSessionEditMode(true); setSessionError(false); }}
                      style={{ background: 'none', border: 'none', color: '#00A4E4', cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline', padding: 0 }}>Modifier</button>
                  </span>
                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input type="text" value={sessionOverride} onChange={e => { setSessionOverride(e.target.value); setSessionError(false); }} placeholder="ex. Hiver 2025"
                      style={{ padding: '3px 6px', fontFamily: 'inherit', fontSize: '0.95em', border: sessionError ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: sessionError ? '#fff4f4' : 'white', width: 160 }} />
                    {data.identification.session && <button type="button" onClick={() => { setSessionEditMode(false); setSessionOverride(''); setSessionError(false); }}
                      style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.82em', textDecoration: 'underline', padding: 0 }}>Annuler</button>}
                    {sessionError && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ Requis</span>}
                  </span>
                }
              </div>
              {data.identification.evaluation && <div><strong>Évaluation :</strong> {data.identification.evaluation}</div>}
              {data.identification.enseignants && <div><strong>Personne(s) enseignante(s) :</strong> {data.identification.enseignants}</div>}
            </div>

            {/* Team toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 14, alignItems: 'center' }}>
              <div>
                <button type="button" onClick={() => setIsEquipe(v => !v)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: 'bold', transition: 'background 0.2s', background: isEquipe ? '#00A4E4' : '#e0e0e0', color: isEquipe ? 'white' : '#555' }}>
                  <span style={{ width: 32, height: 18, borderRadius: 999, background: isEquipe ? 'rgba(255,255,255,0.4)' : '#bbb', display: 'inline-block', position: 'relative', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: isEquipe ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                  </span>
                  Ceci est un travail en équipe
                </button>
              </div>
              {isEquipe && <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Nom ou numéro d'équipe</label>
                <input type="text" value={nomEquipe} onChange={e => setNomEquipe(e.target.value)} placeholder="ex. Équipe A ou Équipe 03"
                  style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                    {isEquipe ? 'Personne équipière 1' : 'Nom complet'} <span style={{ color: '#E41E25' }}>*</span>
                  </label>
                  <input type="text" value={studentNom} onChange={e => { setStudentNom(e.target.value); setNomError(false); }} placeholder="ex. Marie Tremblay"
                    style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: nomError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: nomError ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                  {nomError && <span style={{ color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' }}>⚠ Ce champ est requis</span>}
                </div>
                {isEquipe && equipiers.map((nom, idx) =>
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Personne équipière {idx + 2} <span style={{ color: '#E41E25' }}>*</span></label>
                      <input type="text" value={nom}
                        onChange={e => { setEquipiers(prev => prev.map((v, i) => i === idx ? e.target.value : v)); setEquipiersErrors(prev => prev.map((v, i) => i === idx ? false : v)); }}
                        placeholder="ex. Jean Dupont"
                        style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: equipiersErrors[idx] ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: equipiersErrors[idx] ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                      {equipiersErrors[idx] && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis</span>}
                    </div>
                    {equipiers.length > 1 && <button type="button" onClick={() => { setEquipiers(prev => prev.filter((_, i) => i !== idx)); setEquipiersErrors(prev => prev.filter((_, i) => i !== idx)); }}
                      style={{ marginBottom: equipiersErrors[idx] ? 22 : 2, background: 'none', border: 'none', cursor: 'pointer', color: '#E41E25', fontSize: '1.1em' }} title="Retirer">✕</button>}
                  </div>
                )}
                {isEquipe && <button type="button" onClick={() => setEquipiers(prev => [...prev, ''])}
                  style={{ background: 'none', border: '1px dashed #00A4E4', color: '#00A4E4', borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontSize: '0.88em', fontFamily: 'inherit', alignSelf: 'flex-start' }}>
                  + Ajouter une personne équipière
                </button>}
              </div>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Numéro de groupe ou de section</label>
                <input type="text" value={studentGroupe} onChange={e => setStudentGroupe(e.target.value)} placeholder="ex. 65100"
                  style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Static directive summary */}
          <div className="section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.05em' }}>Directives d'utilisation des SIA</h2>
              <button type="button" onClick={() => setDirectivesVisible(v => !v)}
                style={{ background: 'none', border: '1px solid #00A4E4', color: '#00A4E4', borderRadius: 5, padding: '4px 14px', cursor: 'pointer', fontSize: '0.85em', fontFamily: 'inherit' }}>
                {directivesVisible ? '▲ Masquer les directives' : '▼ Révéler les directives'}
              </button>
            </div>
            {directivesVisible && (
              <div>
                <p style={{ margin: '0 0 14px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>
                  La personne enseignante a indiqué les directives d'utilisation des SIA suivantes :
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', background: 'white' }}>
                  <colgroup>
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '25%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', textAlign: 'left' }}>Étape</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', textAlign: 'left' }}>L'utilisation des SIA est…</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', textAlign: 'left' }}>Directives de la personne enseignante</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', textAlign: 'left' }}>Exigences de déclaration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.etapes.map((etape, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}>
                          <strong>{etape.etapeInfo.libelle}</strong>
                          {etape.etapeInfo.parenthese && <span style={{ display: 'block', color: '#555', fontSize: '0.85em', marginTop: 2 }}>({etape.etapeInfo.parenthese})</span>}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}><strong>{etape.ia}</strong></td>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '0.95em', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: etape.justification }} />
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}>
                          <div dangerouslySetInnerHTML={{ __html: formatExigencesHTML(etape) }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <button className="btn-primary" style={{ background: '#6c757d' }} onClick={() => { setData(null); setApercu(null); setSubmitStatus(null); }}>
                🔄 Charger un autre fichier
              </button>
            </div>
          </div>

          {/* Declaration form */}
          {(() => {
            return (
              <div style={{ position: 'relative' }}>
                {!identOk && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs obligatoires" />}
                <div className="section-box" style={{ opacity: identOk ? 1 : 0.5, pointerEvents: identOk ? 'auto' : 'none' }}>
                  <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8 }}>Votre déclaration par outil utilisé</h2>

                  {/* TogglePill SIA ou non */}
                  <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#f0f0f0', borderRadius: 999, padding: 3, width: 'fit-content' }}>
                    {[
                      { val: true,  label: 'Je n\'ai utilisé aucun SIA pour cette évaluation.' },
                      { val: false, label: 'J\'ai utilisé le(s) SIA suivant(s).' },
                    ].map(opt => (
                      <button key={String(opt.val)} type="button"
                        onClick={() => setAucunSIA(opt.val)}
                        style={{
                          padding: '7px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', fontSize: '0.9em', fontWeight: aucunSIA === opt.val ? 'bold' : 'normal',
                          background: aucunSIA === opt.val ? (opt.val ? '#231F20' : '#00A4E4') : 'transparent',
                          color: aucunSIA === opt.val ? 'white' : '#555',
                          transition: 'background 0.2s, color 0.2s',
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {aucunSIA ? (
                    <div style={{ marginBottom: 20 }}>
                      {/* Avertissement étapes obligatoires */}
                      {data.etapes.filter(e => e.ia?.toLowerCase().includes('obligatoire')).length > 0 && (() => {
                        const obligatoires = data.etapes.filter(e => e.ia?.toLowerCase().includes('obligatoire'));
                        return (
                          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '14px 18px', marginBottom: 14 }}>
                            <p style={{ fontWeight: 'bold', color: '#856404', margin: '0 0 10px', fontSize: '0.92em' }}>
                              ⚠ Vous avez indiqué ne pas avoir utilisé de SIA. L'utilisation d'un SIA est pourtant marquée comme étant obligatoire pour au moins une étape de réalisation.
                            </p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em', marginBottom: 12 }}>
                              <thead>
                                <tr>
                                  <th style={{ border: '1px solid #ffc107', padding: '6px 8px', background: '#fff8e1', textAlign: 'left', width: '25%' }}>Étape</th>
                                  <th style={{ border: '1px solid #ffc107', padding: '6px 8px', background: '#fff8e1', textAlign: 'left', width: '15%' }}>Utilisation des SIA</th>
                                  <th style={{ border: '1px solid #ffc107', padding: '6px 8px', background: '#fff8e1', textAlign: 'left' }}>Directives</th>
                                </tr>
                              </thead>
                              <tbody>
                                {obligatoires.map((etape, i) => (
                                  <tr key={i}>
                                    <td style={{ border: '1px solid #ffc107', padding: '6px 8px', verticalAlign: 'top' }}>
                                      <strong>{etape.etapeInfo.libelle}</strong>
                                      {etape.etapeInfo.parenthese && <span style={{ display: 'block', color: '#666', fontSize: '0.85em' }}>({etape.etapeInfo.parenthese})</span>}
                                    </td>
                                    <td style={{ border: '1px solid #ffc107', padding: '6px 8px', verticalAlign: 'top' }}><strong>{etape.ia}</strong></td>
                                    <td style={{ border: '1px solid #ffc107', padding: '6px 8px', verticalAlign: 'top' }}>
                                      <div style={{ fontSize: '0.95em' }} dangerouslySetInnerHTML={{ __html: etape.justification }} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5, color: '#856404' }}>
                              Justifiez pourquoi vous n'avez pas utilisé de SIA pour cette étape ou ces étapes. <span style={{ color: '#E41E25' }}>*</span>
                            </label>
                            <textarea
                              value={aucunSIAJustification}
                              onChange={e => { setAucunSIAJustification(e.target.value); setAucunSIAJustifError(false); }}
                              placeholder="Expliquez les raisons pour lesquelles vous n'avez pas utilisé de SIA malgré cette exigence…"
                              rows={4}
                              style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: aucunSIAJustifError ? '2px solid #E41E25' : '1px solid #ffc107', borderRadius: 4, background: aucunSIAJustifError ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }}
                            />
                            {aucunSIAJustifError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>⚠ Ce champ est requis</span>}
                          </div>
                        );
                      })()}
                      {/* Commentaires facultatifs */}
                      <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, padding: '14px 18px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5, color: '#231F20' }}>
                          Commentaires <span style={{ fontWeight: 'normal', color: '#888' }}>(facultatif)</span>
                        </label>
                        <textarea
                          value={aucunSIACommentaire}
                          onChange={e => setAucunSIACommentaire(e.target.value)}
                          placeholder="Ajoutez tout commentaire pertinent concernant votre non-utilisation des SIA…"
                          rows={3}
                          style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #ccc', borderRadius: 4, background: 'white', boxSizing: 'border-box', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 16px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>
                        Pour chaque système d'intelligence artificielle utilisé, indiquez l'outil, les étapes concernées et décrivez votre usage.
                      </p>

                      {outilEntries.map((entry, i) => (
                        <div key={i} className="entry-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <strong style={{ fontSize: '0.95em', color: '#231F20' }}>Outil {i + 1}</strong>
                            {outilEntries.length > 1 &&
                              <button type="button" onClick={() => removeEntry(i)}
                                style={{ background: 'none', border: '1px solid #E41E25', color: '#E41E25', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: '0.82em', fontFamily: 'inherit' }}>
                                ✕ Retirer
                              </button>
                            }
                          </div>

                          {/* 1) Outil + Étapes côte à côte */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 14, alignItems: 'start' }}>
                            {/* Outil dropdown */}
                            <div>
                              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5 }}>
                                Outil utilisé <span style={{ color: '#E41E25' }}>*</span>
                              </label>
                              <select value={entry.outil} onChange={e => updateEntry(i, 'outil', e.target.value)}
                                style={{ padding: '6px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: entryErrors[i]?.outil ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: entryErrors[i]?.outil ? '#fff4f4' : 'white', minWidth: 240 }}>
                                <option value="">-- Choisir --</option>
                                {SIA_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              {entryErrors[i]?.outil && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>⚠ Sélection requise</span>}
                              {entry.outil === 'Autre' &&
                                <div style={{ marginTop: 8 }}>
                                  <input type="text" value={entry.outilLibre} onChange={e => updateEntry(i, 'outilLibre', e.target.value)}
                                    placeholder="Précisez le nom…"
                                    style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', fontSize: '0.93em', border: entryErrors[i]?.outilLibre ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: entryErrors[i]?.outilLibre ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                                  {entryErrors[i]?.outilLibre && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>⚠ Ce champ est requis</span>}
                                </div>
                              }
                            </div>

                            {/* Étapes shuttle */}
                            <div>
                              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 6 }}>
                                Étape(s) de réalisation <span style={{ color: '#E41E25' }}>*</span>
                                <span style={{ fontWeight: 'normal', color: '#888', fontSize: '0.9em' }}> — survolez une étape pour voir des exemples</span>
                              </label>
                              {(entry.outil && (entry.outil !== 'Autre' || entry.outilLibre.trim())) ? (
                                <EtapeShuttle
                                  dataEtapes={data.etapes}
                                  selectedIds={entry.etapes}
                                  onChange={ids => { updateEntry(i, 'etapes', ids); }}
                                  hasError={!!entryErrors[i]?.etapes}
                                />
                              ) : (
                                <div style={{ padding: '12px 16px', background: '#f8f9fa', border: '1px dashed #aaa', borderRadius: 6, color: '#888', fontSize: '0.88em', fontStyle: 'italic' }}>
                                  {entry.outil === 'Autre' ? 'Précisez le nom de l\'outil ci-dessus pour sélectionner les étapes.' : 'Sélectionnez d\'abord un outil pour accéder aux étapes de réalisation.'}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}

                      <button type="button" onClick={addEntry}
                        style={{ background: '#00A4E4', color: 'white', border: 'none', borderRadius: 5, padding: '10px 24px', cursor: 'pointer', fontSize: '0.95em', fontFamily: 'inherit', fontWeight: 'bold', display: 'block', width: '100%', marginBottom: 20 }}>
                        + Ajouter un autre outil utilisé
                      </button>
                    </>
                  )}

                  {/* Exigences dynamiques — affiché uniquement si !aucunSIA */}
                  {!aucunSIA && (obligatoiresNonCouvertes.length > 0 || nonAutoriseesSelectionnees.length > 0 || etapesAvecExigences.length > 0) && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '0.98em', marginBottom: 12, color: '#231F20' }}>Exigences à répondre avant de soumettre</h3>

                      {/* Étapes obligatoires non couvertes */}
                      {obligatoiresNonCouvertes.length > 0 && (
                        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '14px 18px', marginBottom: 14 }}>
                          <p style={{ fontWeight: 'bold', color: '#856404', margin: '0 0 8px', fontSize: '0.92em' }}>
                            ⚠ Étape(s) obligatoire(s) non couverte(s) par vos outils déclarés
                          </p>
                          <ul style={{ margin: '0 0 10px 18px', padding: 0, fontSize: '0.9em' }}>
                            {obligatoiresNonCouvertes.map((e, i) => (
                              <li key={i}><strong>{e.etapeInfo.libelle}</strong> — {e.ia}</li>
                            ))}
                          </ul>
                          <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5, color: '#856404' }}>
                            Justifiez pourquoi ces étapes obligatoires ne figurent pas dans votre déclaration. <span style={{ color: '#E41E25' }}>*</span>
                          </label>
                          <textarea value={obligNonCouvJustif} onChange={e => { setObligNonCouvJustif(e.target.value); setObligNonCouvJustifError(false); }}
                            placeholder="Expliquez pourquoi vous n'avez pas utilisé de SIA pour ces étapes malgré l'obligation…"
                            rows={3}
                            style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: obligNonCouvJustifError ? '2px solid #E41E25' : '1px solid #ffc107', borderRadius: 4, background: obligNonCouvJustifError ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }} />
                          {obligNonCouvJustifError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>⚠ Ce champ est requis</span>}
                        </div>
                      )}

                      {/* Étapes non autorisées sélectionnées */}
                      {nonAutoriseesSelectionnees.map(etape => {
                        const id = etape.etapeInfo.id;
                        const hasError = nonAutoriseeJustifErrors[id];
                        const outilsPourEtape = outilEntries.filter(e => e.etapes.includes(id)).map(e => e.outil === 'Autre' && e.outilLibre ? e.outilLibre : e.outil).filter(Boolean);
                        return (
                          <div key={id} style={{ background: '#fde8e8', border: '1px solid #E41E25', borderRadius: 8, padding: '14px 18px', marginBottom: 14 }}>
                            <p style={{ fontWeight: 'bold', color: '#7b1d1d', margin: '0 0 4px', fontSize: '0.92em' }}>
                              🚫 Étape non autorisée sélectionnée : <em>{etape.etapeInfo.libelle}</em>
                            </p>
                            {outilsPourEtape.length > 0 && <p style={{ margin: '0 0 6px', fontSize: '0.88em', color: '#7b1d1d' }}>Vous déclarez avoir utilisé : {outilsPourEtape.map((o, i) => <strong key={i}>{i > 0 ? ', ' : ''}{o}</strong>)}</p>}
                            {etape.justification && <div style={{ fontSize: '0.88em', color: '#555', marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: etape.justification }} />}
                            <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5, color: '#7b1d1d' }}>
                              Justifiez l'utilisation d'un SIA pour cette étape non autorisée. <span style={{ color: '#E41E25' }}>*</span>
                            </label>
                            <textarea value={nonAutoriseeJustifs[id] || ''} onChange={e => { setNonAutoriseeJustifs(prev => ({ ...prev, [id]: e.target.value })); setNonAutoriseeJustifErrors(prev => ({ ...prev, [id]: false })); }}
                              placeholder="Expliquez les circonstances ou raisons de cette utilisation…"
                              rows={3}
                              style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: hasError ? '2px solid #E41E25' : '1px solid #E41E25', borderRadius: 4, background: hasError ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }} />
                            {hasError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>⚠ Ce champ est requis</span>}
                          </div>
                        );
                      })}

                      {/* Exigences de déclaration par étape */}
                      {etapesAvecExigences.map(etape => {
                        const id = etape.etapeInfo.id;
                        const resp = exigencesResponses[id] || {};
                        const setResp = (field, val) => {
                          setExigencesResponses(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));
                          setExigencesErrors(prev => { const n = { ...prev }; delete n[`${id}_${field.replace('Ailleurs','')}`]; return n; });
                        };
                        const outilsPourEtape = outilEntries.filter(e => e.etapes.includes(id)).map(e => e.outil === 'Autre' && e.outilLibre ? e.outilLibre : e.outil).filter(Boolean);
                        return (
                          <div key={id} style={{ background: '#f0f8ff', border: '1px solid #00A4E4', borderRadius: 8, padding: '14px 18px', marginBottom: 14 }}>
                            <p style={{ fontWeight: 'bold', color: '#00527a', margin: '0 0 4px', fontSize: '0.92em' }}>
                              📋 Exigences de déclaration pour : <em>{etape.etapeInfo.libelle}</em>
                            </p>
                            {outilsPourEtape.length > 0 && <p style={{ margin: '0 0 10px', fontSize: '0.88em', color: '#00527a' }}>Vous déclarez avoir utilisé : {outilsPourEtape.map((o, i) => <strong key={i}>{i > 0 ? ', ' : ''}{o}</strong>)}</p>}

                            {etape.decl_iagraphie && (
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 4 }}>
                                  Références et IAgraphie{etape.decl_iagraphie_text ? <span> — <span dangerouslySetInnerHTML={{ __html: etape.decl_iagraphie_text }} /></span> : ''} <span style={{ color: '#E41E25' }}>*</span>
                                </label>
                                <textarea value={resp.iagraphie || ''} onChange={e => setResp('iagraphie', e.target.value)} rows={2} disabled={resp.iagraphieAilleurs}
                                  placeholder="Indiquez les références et IAgraphie…"
                                  style={{ width: '100%', padding: '6px 9px', fontFamily: 'inherit', fontSize: '0.93em', border: exigencesErrors[`${id}_iagraphie`] ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: resp.iagraphieAilleurs ? '#eee' : (exigencesErrors[`${id}_iagraphie`] ? '#fff4f4' : 'white'), boxSizing: 'border-box', resize: 'vertical' }} />
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: '0.88em', color: '#555', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={!!resp.iagraphieAilleurs} onChange={e => setResp('iagraphieAilleurs', e.target.checked)} />
                                  Cette exigence est déjà répondue ailleurs dans le travail soumis
                                </label>
                                {exigencesErrors[`${id}_iagraphie`] && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis ou cochez la case</span>}
                              </div>
                            )}

                            {etape.decl_traces && (
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 4 }}>
                                  Traces conservées{etape.decl_traces_text ? <span> — <span dangerouslySetInnerHTML={{ __html: etape.decl_traces_text }} /></span> : ''} <span style={{ color: '#E41E25' }}>*</span>
                                </label>
                                <textarea value={resp.traces || ''} onChange={e => setResp('traces', e.target.value)} rows={2} disabled={resp.tracesAilleurs}
                                  placeholder="Indiquez les traces que vous avez conservées…"
                                  style={{ width: '100%', padding: '6px 9px', fontFamily: 'inherit', fontSize: '0.93em', border: exigencesErrors[`${id}_traces`] ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: resp.tracesAilleurs ? '#eee' : (exigencesErrors[`${id}_traces`] ? '#fff4f4' : 'white'), boxSizing: 'border-box', resize: 'vertical' }} />
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: '0.88em', color: '#555', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={!!resp.tracesAilleurs} onChange={e => setResp('tracesAilleurs', e.target.checked)} />
                                  Cette exigence est déjà répondue ailleurs dans le travail soumis
                                </label>
                                {exigencesErrors[`${id}_traces`] && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis ou cochez la case</span>}
                              </div>
                            )}

                            {etape.decl_logique && (
                              <div>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 4 }}>
                                  Logique d'utilisation{etape.decl_logique_text ? <span> — <span dangerouslySetInnerHTML={{ __html: etape.decl_logique_text }} /></span> : ''} <span style={{ color: '#E41E25' }}>*</span>
                                </label>
                                <textarea value={resp.logique || ''} onChange={e => setResp('logique', e.target.value)} rows={2} disabled={resp.logiqueAilleurs}
                                  placeholder="Expliquez la logique de votre utilisation du SIA…"
                                  style={{ width: '100%', padding: '6px 9px', fontFamily: 'inherit', fontSize: '0.93em', border: exigencesErrors[`${id}_logique`] ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: resp.logiqueAilleurs ? '#eee' : (exigencesErrors[`${id}_logique`] ? '#fff4f4' : 'white'), boxSizing: 'border-box', resize: 'vertical' }} />
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: '0.88em', color: '#555', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={!!resp.logiqueAilleurs} onChange={e => setResp('logiqueAilleurs', e.target.checked)} />
                                  Cette exigence est déjà répondue ailleurs dans le travail soumis
                                </label>
                                {exigencesErrors[`${id}_logique`] && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis ou cochez la case</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Commentaires globaux — seulement si outils déclarés */}
                  {!aucunSIA && (
                    <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5, color: '#231F20' }}>
                        Commentaires <span style={{ fontWeight: 'normal', color: '#888' }}>(facultatif)</span>
                      </label>
                      <textarea
                        value={commentaireGlobal}
                        onChange={e => setCommentaireGlobal(e.target.value)}
                        placeholder="Ajoutez tout commentaire pertinent concernant votre utilisation des SIA pour cette évaluation…"
                        rows={3}
                        style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #ccc', borderRadius: 4, background: 'white', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>
                  )}

                  {/* Submit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button className="btn-primary" style={{ fontSize: '1em', padding: '11px 28px' }} onClick={handleSoumettre}>
                      Générer la déclaration
                    </button>
                    {submitStatus && (submitStatus.ok
                      ? (() => {
                        const diffMs = new Date() - submitStatus.time;
                        const diffMin = Math.floor(diffMs / 60000);
                        const elapsed = diffMin <= 0 ? "à l'instant" : `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
                        return <span style={{ background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>✔️ Déclaration générée avec succès {elapsed}.</span>;
                      })()
                      : <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Certains champs obligatoires ne sont pas remplis correctement.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Apercu */}
          {apercu &&
            <>
              <div ref={apercuRef} style={{ background: 'white', padding: '40px 50px', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 20, fontFamily: 'Arial, sans-serif', fontSize: '16px', lineHeight: 1.4, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8pt', paddingBottom: '8pt', borderBottom: '1px solid black', margin: '0 0 8pt 0', color: '#000' }}>
                  Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)
                </h1>

                {/* Intro */}
                <div style={{ fontSize: '0.92em', lineHeight: 1.6, marginBottom: 16, marginTop: 16 }}>
                  {apercu.isEquipe
                    ? (() => {
                      const noms = apercu.equipiers.filter(n => n.trim()).join(', ');
                      const equipeInfo = apercu.nomEquipe ? ` (équipe ${apercu.nomEquipe})` : '';
                      const groupeInfo = apercu.studentGroupe ? `, groupe ${apercu.studentGroupe}` : '';
                      return <p style={{ margin: '0 0 6px' }}>Nous, <strong>{noms}</strong>{equipeInfo}{groupeInfo}, soumettons cette déclaration dans le cadre de l'évaluation nommée <strong>{apercu.identification.evaluation || '[évaluation]'}</strong> du cours <strong>{apercu.identification.cours || '[cours]'}</strong> de la session <strong>{apercu.identification.session || '[session]'}</strong>, enseigné par <strong>{apercu.identification.enseignants || '[personne enseignante]'}</strong>.</p>;
                    })()
                    : <p style={{ margin: '0 0 6px' }}>Je, <strong>{apercu.studentNom}</strong>{apercu.studentGroupe ? ` (groupe ${apercu.studentGroupe})` : ''}, soumets cette déclaration dans le cadre de l'évaluation nommée <strong>{apercu.identification.evaluation || '[évaluation]'}</strong> du cours <strong>{apercu.identification.cours || '[cours]'}</strong> de la session <strong>{apercu.identification.session || '[session]'}</strong>, enseigné par <strong>{apercu.identification.enseignants || '[personne enseignante]'}</strong>.</p>
                  }
                  <p style={{ margin: 0 }}>Conformément aux exigences de la personne enseignante, les renseignements suivants présentent {apercu.isEquipe ? 'notre' : 'ma'} démarche d'utilisation des systèmes d'intelligence artificielle.</p>
                </div>

                {/* Directive summary */}
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'bold', margin: '16pt 0 6pt 0', color: '#000' }}>Directives de la personne enseignante</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76em' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '7px 9px', background: '#F2F2F2', width: '20%', textAlign: 'left' }}>Étape</th>
                      <th style={{ border: '1px solid #ccc', padding: '7px 9px', background: '#F2F2F2', width: '15%', textAlign: 'left' }}>Utilisation des SIA</th>
                      <th style={{ border: '1px solid #ccc', padding: '7px 9px', background: '#F2F2F2', width: '40%', textAlign: 'left' }}>Directives</th>
                      <th style={{ border: '1px solid #ccc', padding: '7px 9px', background: '#F2F2F2', width: '25%', textAlign: 'left' }}>Exigences de déclaration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apercu.etapes.map((etape, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #ccc', padding: '7px 9px', verticalAlign: 'top' }}>
                          <strong>{etape.etapeInfo.libelle}</strong>
                          {etape.etapeInfo.parenthese && <span style={{ display: 'block', color: '#555', fontSize: '0.87em' }}>({etape.etapeInfo.parenthese})</span>}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '7px 9px', verticalAlign: 'top' }}>{etape.ia}</td>
                        <td style={{ border: '1px solid #ccc', padding: '7px 9px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '0.95em', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: etape.justification }} />
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '7px 9px', verticalAlign: 'top' }}>
                          <div dangerouslySetInnerHTML={{ __html: formatExigencesHTML(etape) }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Student declarations */}
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'bold', margin: '16pt 0 6pt 0', color: '#000' }}>{apercu.isEquipe ? 'Notre' : 'Ma'} déclaration d'utilisation</h2>
                {apercu.aucunSIA ? (
                  <div style={{ fontSize: '0.92em' }}>
                    <p style={{ fontStyle: 'italic', color: '#555', margin: '0 0 8px' }}>Aucun système d'intelligence artificielle n'a été utilisé pour cette évaluation.</p>
                    {apercu.aucunSIAJustification && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>Justification (étape(s) obligatoire(s)) :</strong>
                        <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#333' }}>{apercu.aucunSIAJustification}</p>
                      </div>
                    )}
                    {apercu.aucunSIACommentaire && (
                      <div>
                        <strong>Commentaires :</strong>
                        <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#333' }}>{apercu.aucunSIACommentaire}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ccc', padding: '7px 9px', background: '#edfbf0', width: '25%', textAlign: 'left' }}>Outil utilisé</th>
                        <th style={{ border: '1px solid #ccc', padding: '7px 9px', background: '#edfbf0', width: '75%', textAlign: 'left' }}>Étapes de réalisation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apercu.outilEntries.map((entry, i) => {
                        const etapeItems = entry.etapes.map(id => {
                          const found = apercu.etapes.find(e => e.etapeInfo.id === id);
                          return found ? { libelle: found.etapeInfo.libelle, ia: found.ia } : { libelle: id, ia: null };
                        });
                        return (
                          <tr key={i}>
                            <td style={{ border: '1px solid #ccc', padding: '7px 9px', verticalAlign: 'top' }}>
                              <strong>{entry.outil === 'Autre' && entry.outilLibre ? entry.outilLibre : entry.outil}</strong>
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '7px 9px', verticalAlign: 'top' }}>
                              <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {etapeItems.map((item, li) => (
                                  <li key={li}>{item.libelle}{item.ia ? <span style={{ color: '#555', fontStyle: 'italic' }}> ({item.ia})</span> : ''}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Commentaires globaux apercu */}
                {!apercu.aucunSIA && apercu.commentaireGlobal?.trim() && (
                  <div style={{ marginTop: 12, fontSize: '0.92em' }}>
                    <strong>Commentaires :</strong>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#333' }}>{apercu.commentaireGlobal}</p>
                  </div>
                )}

                {/* Champs dynamiques */}
                {!apercu.aucunSIA && (() => {
                  const blocks = [];
                  if (apercu.obligNonCouvJustif?.trim()) {
                    blocks.push(
                      <div key="oblig" style={{ marginBottom: 10 }}>
                        <strong>Justification — étape(s) obligatoire(s) non couvertes :</strong>
                        <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#333', fontSize: '0.92em' }}>{apercu.obligNonCouvJustif}</p>
                      </div>
                    );
                  }
                  if (apercu.nonAutoriseeJustifs) {
                    Object.entries(apercu.nonAutoriseeJustifs).forEach(([id, justif]) => {
                      if (!justif?.trim()) return;
                      const etape = apercu.etapes.find(e => e.etapeInfo.id === id);
                      const label = etape ? etape.etapeInfo.libelle : id;
                      blocks.push(
                        <div key={`na_${id}`} style={{ marginBottom: 10 }}>
                          <strong>Justification — étape non autorisée « {label} » :</strong>
                          <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#333', fontSize: '0.92em' }}>{justif}</p>
                        </div>
                      );
                    });
                  }
                  if (apercu.exigencesResponses) {
                    Object.entries(apercu.exigencesResponses).forEach(([id, resp]) => {
                      const etape = apercu.etapes.find(e => e.etapeInfo.id === id);
                      const label = etape ? etape.etapeInfo.libelle : id;
                      const parts = [];
                      if (resp.iagraphieAilleurs) parts.push(<span key="ia"><em>Références et IAgraphie : déjà répondu dans le travail soumis.</em></span>);
                      else if (resp.iagraphie?.trim()) parts.push(<span key="ia"><strong>Références et IAgraphie :</strong> {resp.iagraphie}</span>);
                      if (resp.tracesAilleurs) parts.push(<span key="tr"><em>Traces conservées : déjà répondu dans le travail soumis.</em></span>);
                      else if (resp.traces?.trim()) parts.push(<span key="tr"><strong>Traces conservées :</strong> {resp.traces}</span>);
                      if (resp.logiqueAilleurs) parts.push(<span key="lo"><em>Logique d'utilisation : déjà répondu dans le travail soumis.</em></span>);
                      else if (resp.logique?.trim()) parts.push(<span key="lo"><strong>Logique d'utilisation :</strong> {resp.logique}</span>);
                      if (parts.length > 0) {
                        blocks.push(
                          <div key={`ex_${id}`} style={{ marginBottom: 10 }}>
                            <strong>Exigences de déclaration — {label} :</strong>
                            <div style={{ margin: '4px 0 0', fontSize: '0.92em', color: '#333' }}>
                              {parts.map((p, i) => <div key={i}>{p}</div>)}
                            </div>
                          </div>
                        );
                      }
                    });
                  }
                  if (blocks.length === 0) return null;
                  return (
                    <>
                      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'bold', margin: '16pt 0 6pt 0', color: '#000' }}>Informations complémentaires</h2>
                      <div style={{ fontSize: '0.92em' }}>{blocks}</div>
                    </>
                  );
                })()}

                {/* Final affirmations */}
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'bold', margin: '16pt 0 6pt 0', color: '#000' }}>La soumission de cette déclaration confirme que :</h2>
                <ul style={{ margin: '0 0 0 20px', paddingLeft: 0, lineHeight: 1.7, listStyleType: 'disc', fontSize: '0.92em' }}>
                  <li style={{ marginBottom: '4pt' }}>Les informations fournies sont complètes et fidèles à {apercu.isEquipe ? 'notre' : 'mon'} utilisation réelle.</li>
                  <li style={{ marginBottom: '4pt' }}>{apercu.isEquipe ? 'Notre' : 'Mon'} utilisation des SIA est conforme aux règles établies par la personne enseignante pour ce travail.</li>
                  <li style={{ marginBottom: '4pt' }}>{apercu.isEquipe ? 'Nous avons' : 'J\'ai'} exercé {apercu.isEquipe ? 'notre' : 'mon'} jugement critique sur les contenus générés par les SIA.</li>
                  <li style={{ marginBottom: '4pt' }}>Le travail soumis reflète {apercu.isEquipe ? 'notre' : 'ma'} propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.</li>
                  <li>{apercu.isEquipe ? 'Nous comprenons' : 'Je comprends'} que l'omission ou une fausse déclaration constitue une infraction au Règlement disciplinaire.</li>
                </ul>

                <p style={{ marginTop: '16pt', fontSize: '0.82em', color: '#666', fontStyle: 'italic', margin: '16pt 0 0 0' }}>
                  Générée le {apercu.timestamp}
                </p>
              </div>

              {/* Export buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20, alignItems: 'center', justifyContent: 'center' }}>
                <button type="button" className="btn-primary" style={{ background: '#6c757d' }} onClick={() => { setApercu(null); setSubmitStatus(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  ✏️ Continuer à modifier la déclaration
                </button>
                <span title='Utilisez "Conserver la mise en forme source" dans Word.'>
                  <button type="button" className="btn-primary" onClick={() => copyDeclToClipboard(apercu)}>
                    📋 Copier pour coller dans Word
                  </button>
                </span>
                {copyOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
                <button type="button" className="btn-primary" onClick={() => downloadDeclWord(apercu)}>
                  📄 Télécharger en Word (.doc)
                </button>
              </div>
            </>
          }
        </>
      }
    </div>
  );
}