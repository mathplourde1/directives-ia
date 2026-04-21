import { useState, useRef } from 'react';
import AutreActionModal from '@/components/guide/AutreActionModal';
import PHASES, { PERMISSION_LEVELS } from '@/components/directives/directivesData';
import SIA_LIST_RAW from '@/components/listeSIA';

const SIA_LIST = [...SIA_LIST_RAW].sort((a, b) => a.localeCompare(b, 'fr')).concat(['Autre']);

const PERM_STYLES = {
  non: { label: 'Non autorisée', color: '#E41E25', bg: '#fff4f4', border: '#E41E25' },
  aar: { label: 'Autorisée avec restrictions', color: '#b45309', bg: '#fffbeb', border: '#f59e0b' },
  asr: { label: 'Autorisée sans restrictions', color: '#15803d', bg: '#f0fdf4', border: '#22c55e' },
  obl: { label: 'Obligatoire', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6' },
};

// Build a flat lookup of all actions from PHASES
const ALL_ACTIONS_MAP = {};
PHASES.forEach(p => p.actions.forEach(a => { ALL_ACTIONS_MAP[a.id] = { ...a, phaseId: p.id, phaseLibelle: p.libelle, phaseColor: p.color }; }));

function parseDirectivesXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) return { error: 'parse', raw: xmlText };
  const root = doc.querySelector('directives-ia');
  if (!root) return { error: 'structure', raw: xmlText };
  try {
    const getT = (node, tag) => node?.querySelector(tag)?.textContent ?? '';
    const identNode = root.querySelector('identification');
    const identification = {
      cours: getT(identNode, 'cours'),
      session: getT(identNode, 'session'),
      enseignants: getT(identNode, 'enseignants'),
      evaluation: getT(identNode, 'evaluation'),
    };
    const mode = getT(root, 'mode') || 'aucune';
    const precisions = getT(root, 'precisions');

    const colonnes = {};
    root.querySelectorAll('colonne').forEach(col => {
      const id = col.getAttribute('id');
      const ids = col.textContent.split(',').map(s => s.trim()).filter(Boolean);
      colonnes[id] = ids;
    });

    const customActionsMap = {};
    root.querySelectorAll('action_custom').forEach(a => {
      const id = a.getAttribute('id');
      const perm = a.getAttribute('permission') || 'asr';
      if (id) customActionsMap[id] = { id, libelle: a.textContent.trim(), perm };
    });

    const activeActions = [];
    ['non', 'aar', 'asr', 'obl'].forEach(permId => {
      (colonnes[permId] || []).forEach(actionId => {
        if (ALL_ACTIONS_MAP[actionId]) {
          activeActions.push({ ...ALL_ACTIONS_MAP[actionId], perm: permId, isCustom: false });
        } else if (customActionsMap[actionId]) {
          activeActions.push({ ...customActionsMap[actionId], perm: permId, phaseLibelle: 'Actions personnalisées', phaseColor: '#888', isCustom: true });
        }
      });
    });

    const exigencesNode = root.querySelector('exigences');
    const exigencesMode = exigencesNode?.getAttribute('mode') || 'aucune';
    const exigences = [];
    exigencesNode?.querySelectorAll('exigence').forEach(exigNode => {
      const id = exigNode.getAttribute('id');
      const type = exigNode.getAttribute('type');
      const description = exigNode.querySelector('description')?.textContent || '';
      if (id && type) exigences.push({ id, type, description });
    });

    return { ok: true, identification, mode, precisions, colonnes, activeActions, exigencesMode, exigences };
  } catch { return { error: 'structure', raw: xmlText }; }
}

let customActionCounter = 0;
function makeCustomActionId() { return `custom-student-${++customActionCounter}-${Date.now()}`; }

function defaultOutilEntry() {
  return { outil: '', outilLibre: '', actionIds: [], customActions: [] };
}

export default function DeclarationGuidee() {
  const [data, setData] = useState(null);
  const [aucunSIA, setAucunSIA] = useState(true);
  const [aucunSIAJustif, setAucunSIAJustif] = useState('');
  const [aucunSIAJustifError, setAucunSIAJustifError] = useState(false);
  const [aucunSIACommentaire, setAucunSIACommentaire] = useState('');
  const [outilEntries, setOutilEntries] = useState([defaultOutilEntry()]);
  const [entryErrors, setEntryErrors] = useState([{}]);
  const [studentNom, setStudentNom] = useState('');
  const [studentGroupe, setStudentGroupe] = useState('');
  const [nomError, setNomError] = useState(false);
  const [isEquipe, setIsEquipe] = useState(false);
  const [nomEquipe, setNomEquipe] = useState('');
  const [equipiers, setEquipiers] = useState(['']);
  const [equipiersErrors, setEquipiersErrors] = useState([]);
  const [sessionOverride, setSessionOverride] = useState('');
  const [sessionEditMode, setSessionEditMode] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [directivesVisible, setDirectivesVisible] = useState(false);
  const [obligNonCouvJustif, setObligNonCouvJustif] = useState('');
  const [obligNonCouvJustifError, setObligNonCouvJustifError] = useState(false);
  const [nonAutoriseeJustifs, setNonAutoriseeJustifs] = useState({});
  const [nonAutoriseeJustifErrors, setNonAutoriseeJustifErrors] = useState({});
  const [commentaireGlobal, setCommentaireGlobal] = useState('');
  const [exigencesResponses, setExigencesResponses] = useState({});
  const [exigencesErrors, setExigencesErrors] = useState({});
  const [autreActionModal, setAutreActionModal] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [copyOk, setCopyOk] = useState(false);
  const fileInputRef = useRef();
  const apercuRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = parseDirectivesXML(ev.target.result);
      setData(result);
      if (result.ok) { setSessionOverride(''); setSessionEditMode(false); setSessionError(false); setApercu(null); setSubmitStatus(null); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function updateEntry(i, field, value) {
    setOutilEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
    setEntryErrors(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: false } : e));
  }

  function toggleAction(entryIdx, actionId) {
    setOutilEntries(prev => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      const has = e.actionIds.includes(actionId);
      return { ...e, actionIds: has ? e.actionIds.filter(id => id !== actionId) : [...e.actionIds, actionId] };
    }));
    setEntryErrors(prev => prev.map((e, idx) => idx === entryIdx ? { ...e, actionIds: false } : e));
  }

  function addCustomAction(entryIdx, { libelle, phaseLibelle, phaseColor, phaseId }) {
    const id = makeCustomActionId();
    setOutilEntries(prev => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      return { ...e, customActions: [...(e.customActions || []), { id, libelle, phaseLibelle, phaseColor, phaseId }], actionIds: [...e.actionIds, id] };
    }));
    setEntryErrors(prev => prev.map((e, idx) => idx === entryIdx ? { ...e, actionIds: false } : e));
  }

  function editCustomAction(entryIdx, id, { libelle, phaseLibelle, phaseColor, phaseId }) {
    setOutilEntries(prev => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      return { ...e, customActions: e.customActions.map(a => a.id === id ? { ...a, libelle, phaseLibelle, phaseColor, phaseId } : a) };
    }));
  }

  function removeCustomAction(entryIdx, id) {
    setOutilEntries(prev => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      return { ...e, customActions: e.customActions.filter(a => a.id !== id), actionIds: e.actionIds.filter(aid => aid !== id) };
    }));
  }

  function removeEntry(i) {
    setOutilEntries(prev => prev.filter((_, idx) => idx !== i));
    setEntryErrors(prev => prev.filter((_, idx) => idx !== i));
  }

  function addEntry() {
    setOutilEntries(prev => [...prev, defaultOutilEntry()]);
    setEntryErrors(prev => [...prev, {}]);
  }

  const effectiveSession = data?.identification?.session && !sessionEditMode ? data.identification.session : sessionOverride.trim();
  const identOk = !!(effectiveSession && studentNom.trim());

  function getAllActionsForEntry(entry) {
    return [...(data?.activeActions || []), ...(entry.customActions || []).map(a => ({ ...a, perm: 'asr', isCustom: true }))];
  }

  const allSelectedActionIds = aucunSIA ? [] : [...new Set(outilEntries.flatMap(e => e.actionIds))];
  const obligActions = data?.activeActions?.filter(a => a.perm === 'obl') ?? [];
  const obligNonCouvertes = obligActions.filter(a => !allSelectedActionIds.includes(a.id));
  const nonAutoriseeSelectionnees = (data?.activeActions ?? []).filter(a => a.perm === 'non' && allSelectedActionIds.includes(a.id));

  function handleSoumettre() {
    let hasErrors = false;
    if (!effectiveSession) { setSessionError(true); hasErrors = true; } else { setSessionError(false); }
    if (!studentNom.trim()) { setNomError(true); hasErrors = true; } else { setNomError(false); }
    if (isEquipe) {
      const errs = equipiers.map(n => !n.trim());
      setEquipiersErrors(errs);
      if (errs.some(Boolean)) hasErrors = true;
    }
    if (aucunSIA) {
      if (obligActions.length > 0 && !aucunSIAJustif.trim()) { setAucunSIAJustifError(true); hasErrors = true; } else { setAucunSIAJustifError(false); }
    } else {
      if (obligNonCouvertes.length > 0 && !obligNonCouvJustif.trim()) { setObligNonCouvJustifError(true); hasErrors = true; } else { setObligNonCouvJustifError(false); }
      const newNonAutoriseeErrors = {};
      nonAutoriseeSelectionnees.forEach(a => { if (!nonAutoriseeJustifs[a.id]?.trim()) { newNonAutoriseeErrors[a.id] = true; hasErrors = true; } });
      setNonAutoriseeJustifErrors(newNonAutoriseeErrors);
      if (data.exigencesMode === 'inclure' && data.exigences?.length > 0) {
        const newExigErrors = {};
        data.exigences.forEach(exig => {
          const resp = exigencesResponses[exig.id] || {};
          if (!resp.value?.trim() && !resp.ailleurs) { newExigErrors[exig.id] = true; hasErrors = true; }
        });
        setExigencesErrors(newExigErrors);
      }
      const newEntryErrors = outilEntries.map(e => {
        const err = {};
        if (!e.outil) err.outil = true;
        if (e.outil === 'Autre' && !e.outilLibre.trim()) err.outilLibre = true;
        if (e.actionIds.length === 0) err.actionIds = true;
        return err;
      });
      setEntryErrors(newEntryErrors);
      if (newEntryErrors.some(e => Object.keys(e).length > 0)) hasErrors = true;
    }
    if (hasErrors) { setSubmitStatus({ ok: false }); return; }

    const tzCodes = { 'America/Toronto': 'HNE', 'America/Montreal': 'HNE', 'America/Vancouver': 'HNP', 'America/Edmonton': 'HNR', 'America/Winnipeg': 'HNC', 'America/Halifax': 'HNA', 'Europe/Paris': 'HEC' };
    const now = new Date();
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetFallbacks = { '-300': 'HNE', '-360': 'HNC', '-420': 'HNR', '-480': 'HNP', '0': 'UTC', '60': 'HEC' };
    const tzCode = tzCodes[userTz] || offsetFallbacks[String(-now.getTimezoneOffset())] || 'UTC';
    const timestamp = now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) + ' a\u0300 ' + now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') + ' ' + tzCode;

    setApercu({
      identification: { ...data.identification, session: effectiveSession },
      studentNom, studentGroupe, isEquipe, nomEquipe,
      equipiers: isEquipe ? [studentNom, ...equipiers] : [studentNom],
      aucunSIA, aucunSIAJustif, aucunSIACommentaire,
      outilEntries, activeActions: data.activeActions, precisions: data.precisions,
      obligNonCouvJustif, nonAutoriseeJustifs, commentaireGlobal,
      exigencesMode: data.exigencesMode, exigences: data.exigences, exigencesResponses,
      timestamp,
    });
    setSubmitStatus({ ok: true, time: new Date() });
    setTimeout(() => apercuRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function getOutilLabel(entry) {
    return entry.outil === 'Autre' && entry.outilLibre.trim() ? entry.outilLibre.trim() : entry.outil;
  }

  function buildApercuHTML(ap) {
    const cours = ap.identification.cours || '[cours]';
    const evaluation = ap.identification.evaluation || '[evaluation]';
    const session = ap.identification.session || '[session]';
    const enseignants = ap.identification.enseignants || '[personne enseignante]';
    let intro;
    if (ap.isEquipe) {
      const noms = ap.equipiers.filter(n => n.trim()).join(', ');
      const eq = ap.nomEquipe ? ` (equipe ${ap.nomEquipe})` : '';
      const gr = ap.studentGroupe ? `, groupe ${ap.studentGroupe}` : '';
      intro = `Nous, <strong>${noms}</strong>${eq}${gr}, soumettons cette declaration dans le cadre de l'evaluation <strong>${evaluation}</strong> du cours <strong>${cours}</strong>, session <strong>${session}</strong>, enseigne par <strong>${enseignants}</strong>.`;
    } else {
      const gr = ap.studentGroupe ? ` (groupe ${ap.studentGroupe})` : '';
      intro = `Je, <strong>${ap.studentNom}</strong>${gr}, soumets cette declaration dans le cadre de l'evaluation <strong>${evaluation}</strong> du cours <strong>${cours}</strong>, session <strong>${session}</strong>, enseigne par <strong>${enseignants}</strong>.`;
    }
    let declHtml;
    if (ap.aucunSIA) {
      declHtml = `<p style="font-style:italic;color:#555;">Aucun systeme d'intelligence artificielle n'a ete utilise pour cette evaluation.</p>`;
      if (ap.aucunSIAJustif) declHtml += `<p><strong>Justification (action(s) obligatoire(s)) :</strong><br>${ap.aucunSIAJustif}</p>`;
      if (ap.aucunSIACommentaire) declHtml += `<p><strong>Commentaires :</strong><br>${ap.aucunSIACommentaire}</p>`;
    } else {
      declHtml = `<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:10pt;"><thead><tr><th style="border:1px solid #ccc;padding:6px;background:#edfbf0;">Outil</th><th style="border:1px solid #ccc;padding:6px;background:#edfbf0;">Actions declarees</th></tr></thead><tbody>`;
      ap.outilEntries.forEach(entry => {
        const allActionsForEntry = [...(ap.activeActions || []), ...(entry.customActions || []).map(a => ({ ...a, perm: 'asr' }))];
        const customIds = new Set((entry.customActions || []).map(a => a.id));
        const actions = entry.actionIds.map(id => { const a = allActionsForEntry.find(x => x.id === id); if (!a) return id; return customIds.has(id) ? `${a.libelle} <em style="color:#666">(Action personnalisee)</em>` : `${a.libelle}${PERM_STYLES[a.perm] ? ` <em>(${PERM_STYLES[a.perm].label})</em>` : ''}`; });
        declHtml += `<tr><td style="border:1px solid #ccc;padding:6px;vertical-align:top"><strong>${getOutilLabel(entry)}</strong></td><td style="border:1px solid #ccc;padding:6px;vertical-align:top">${actions.join('<br>')}</td></tr>`;
      });
      declHtml += `</tbody></table>`;
      if (ap.obligNonCouvJustif) declHtml += `<p><strong>Justification - action(s) obligatoire(s) non couvertes :</strong><br>${ap.obligNonCouvJustif}</p>`;
      Object.entries(ap.nonAutoriseeJustifs || {}).forEach(([id, justif]) => {
        if (!justif?.trim()) return;
        const a = ap.activeActions?.find(x => x.id === id);
        declHtml += `<p><strong>Justification - action non autorisee : ${a?.libelle || id} :</strong><br>${justif}</p>`;
      });
      if (ap.exigencesMode === 'inclure' && ap.exigences?.length > 0) {
        const typeLabels = { iagraphie: 'References et IAgraphie', traces: 'Conserver les traces', logique: "Expliquer la logique d'utilisation" };
        declHtml += `<h3 style="font-family:Georgia,serif;font-size:13pt;margin:10pt 0 4pt;">Exigences de declaration</h3>`;
        ap.exigences.forEach(exig => {
          const resp = ap.exigencesResponses?.[exig.id] || {};
          const label = typeLabels[exig.type] || exig.type;
          declHtml += `<p style="margin:6pt 0 2pt 0;"><strong>${label} :</strong>${exig.description ? ` <span style="font-weight:normal;">${exig.description}</span>` : ''}</p>`;
          if (resp.ailleurs) {
            declHtml += `<p style="margin:0 0 6pt 0;"><em>Deja repondu dans le travail soumis ou dans cette declaration.</em></p>`;
          } else if (resp.value?.trim()) {
            declHtml += `<p style="margin:0 0 6pt 0;white-space:pre-wrap;">${resp.value}</p>`;
          }
        });
      }
      if (ap.commentaireGlobal?.trim()) declHtml += `<p><strong>Commentaires :</strong><br>${ap.commentaireGlobal}</p>`;
    }
    return `<h1 style="font-family:Georgia,serif;font-size:22px;font-weight:bold;text-align:center;border-bottom:1px solid black;padding-bottom:8pt;margin-bottom:8pt;">Declaration d'utilisation de systemes d'intelligence artificielle (SIA)</h1>
<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;margin-bottom:8pt;">${intro}</p>
<p style="font-family:Arial,sans-serif;font-size:11pt;margin-bottom:12pt;">Conformement aux exigences de la personne enseignante, les renseignements suivants presentent ${ap.isEquipe ? 'notre' : 'ma'} demarche d'utilisation des systemes d'intelligence artificielle.</p>
<h2 style="font-family:Georgia,serif;font-size:16pt;margin:12pt 0 6pt;">${ap.isEquipe ? 'Notre' : 'Mon'} declaration d'utilisation</h2>
<div style="font-family:Arial,sans-serif;font-size:11pt;">${declHtml}</div>
<h2 style="font-family:Georgia,serif;font-size:16pt;margin:12pt 0 6pt;">La soumission de cette declaration confirme que :</h2>
<ul style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;margin:0 0 0 20px;list-style-type:disc;padding-left:0;">
<li style="margin-bottom:4pt">Les informations fournies sont completes et fideles a votre utilisation reelle.</li>
<li style="margin-bottom:4pt">Votre utilisation des SIA est conforme aux regles etablies par la personne enseignante pour ce travail.</li>
<li style="margin-bottom:4pt">Vous avez fait un usage responsable des SIA et avez respecte le droit d'auteur lors des requetes et referencement.</li>
<li style="margin-bottom:4pt">Vous avez exerce votre jugement critique et valide l'exactitude des contenus generes par les SIA.</li>
<li style="margin-bottom:4pt">Le travail soumis reflete votre propre pensee, meme lorsqu'un SIA a ete utilise comme outil de soutien.</li>
<li style="margin-bottom:4pt">Vous comprenez qu'une fausse declaration est une atteinte grave a l'ethique et risque de compromettre la credibilite du travail realise.</li>
<li>Vous comprenez qu'un usage non autorise, des donnees fausses ou inventees ou copier-coller des reponses generees par une SIA sans l'identifier constituent des infractions au <a href="https://www.ulaval.ca/sites/default/files/notre-universite/direction-gouv/Documents_officiels/Reglements/Reglement_disciplinaire_intention_etudiants.pdf">Reglement disciplinaire</a> de l'Universite Laval.</li>
</ul>
<p style="font-family:Arial,sans-serif;font-size:9pt;color:#666;font-style:italic;margin-top:16pt;">Generee le ${ap.timestamp}</p>`;
  }

  function copyToClipboard(ap) {
    const html = buildApercuHTML(ap);
    const plain = html.replace(/<[^>]+>/g, '');
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })])
        .then(() => { setCopyOk(true); setTimeout(() => setCopyOk(false), 1800); })
        .catch(() => navigator.clipboard.writeText(html).then(() => { setCopyOk(true); setTimeout(() => setCopyOk(false), 1800); }));
    } else {
      navigator.clipboard.writeText(html).then(() => { setCopyOk(true); setTimeout(() => setCopyOk(false), 1800); });
    }
  }

  function downloadWord(ap) {
    const content = buildApercuHTML(ap);
    const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"><title>Declaration SIA</title></head><body>${content}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'declaration-guidee-sia.doc'; a.click();
    URL.revokeObjectURL(url);
  }

  function groupByPhase(actions) {
    const groups = {};
    actions.forEach(a => {
      const key = a.phaseLibelle || 'Autres';
      if (!groups[key]) groups[key] = { color: a.phaseColor || '#888', actions: [] };
      groups[key].actions.push(a);
    });
    return groups;
  }

  return (
    <div style={{ background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <style>{`
          .btn-primary { background-color: #1895FD; color: white; border: none; padding: 10px 20px; margin: 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; font-family: inherit; }
          .btn-primary:hover { background-color: #1278d4; }
          .section-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
          .entry-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 18px; margin-bottom: 16px; }
        `}</style>

        <h1 style={{ color: '#1895FD', textAlign: 'center', fontSize: '1.5em', fontWeight: 'bold', marginBottom: 6 }}>
          Declaration d'utilisation des SIA lors d'une evaluation
        </h1>

        <div style={{ marginBottom: 20 }}>
          <div className="mb-2">Cet outil permet de produire une declaration d'utilisation des systèmes d'intelligence artificeille (SIA) pour une evaluation basee sur les directives determinees par la personne enseignante.</div>
          <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8, color: '#231F20' }} className="text-lg font-bold uppercase">Comment ca fonctionne?</h2>
          <ol style={{ listStyleType: 'decimal', paddingLeft: 20, marginTop: 8 }} className="pb-2">
            <li>Importe le fichier de directives d'utilisation des SIA (aussi nommé <i>fichier de sauvegarde</i>) pour l'evaluation fourni par la personne enseignante.</li>
            <li>Remplis les sections du formulaire selon l'utilisation que tu as fait des SIA.</li>
            <li>Genere la declaration et apporte des precisions au besoin.</li>
            <li>Telecharge et transmets cette declaration a l'endroit indique par la personne enseignante.</li>
          </ol>
        </div>

        {/* Upload zone */}
        {!data?.ok && (
          <div className="section-box">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
              {/* Colonne A : import fichier */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: 16, fontSize: '1em' }}>
                  Importez le fichier de sauvegarde des directives fourni par la personne enseignante.
                </p>
                <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                  Importer le fichier de sauvegarde
                </button>
                <input ref={fileInputRef} type="file" accept=".xml,.txt" style={{ display: 'none' }} onChange={handleFile} />
                {data?.error && (
                  <div style={{ marginTop: 20, textAlign: 'left', color: '#E41E25', fontWeight: 'bold' }}>
                    Ce fichier n'est pas reconnu comme un fichier de directives valide.
                  </div>
                )}
              </div>
              {/* Colonne B : libre-service */}
              <div style={{ textAlign: 'center', borderLeft: '1px solid #e0e0e0', paddingLeft: 24 }}>
                <p style={{ marginBottom: 16, fontSize: '1em', color: '#555' }}>
                  La personne enseignante ne vous a pas partage de fichier de sauvegarde avec des instructions precises ?
                </p>
                <a href="/Declaration-libre-service" style={{ display: 'inline-block', padding: '10px 20px', background: '#f0f0f0', color: '#231F20', border: '1px solid #ccc', borderRadius: 5, fontWeight: 'bold', fontSize: '0.95em', textDecoration: 'none' }}>
                  Acceder au formulaire de declaration libre-service
                </a>
              </div>
            </div>
          </div>
        )}

        {data?.ok && (
          <>
            {/* Identification */}
            <div className="section-box">
              <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 10 }}>Identification</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '0.95em', marginBottom: 14 }}>
                {data.identification.cours && <div><strong>Cours :</strong> {data.identification.cours}</div>}
                <div>
                  <strong>Session :<span style={{ color: '#E41E25' }}> *</span></strong>{' '}
                  {data.identification.session && !sessionEditMode
                    ? <span>{data.identification.session}{' '}
                        <button type="button" onClick={() => { setSessionOverride(data.identification.session); setSessionEditMode(true); setSessionError(false); }}
                          style={{ background: 'none', border: 'none', color: '#1895FD', cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline', padding: 0 }}>Modifier</button>
                      </span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input type="text" value={sessionOverride} onChange={e => { setSessionOverride(e.target.value); setSessionError(false); }} placeholder="ex. Hiver 2025"
                          style={{ padding: '3px 6px', fontFamily: 'inherit', fontSize: '0.95em', border: sessionError ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, width: 160 }} />
                        {data.identification.session && <button type="button" onClick={() => { setSessionEditMode(false); setSessionOverride(''); }}
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.82em', textDecoration: 'underline', padding: 0 }}>Annuler</button>}
                        {sessionError && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>Requis</span>}
                      </span>
                  }
                </div>
                {data.identification.evaluation && <div><strong>Evaluation :</strong> {data.identification.evaluation}</div>}
                {data.identification.enseignants && <div><strong>Personne(s) enseignante(s) :</strong> {data.identification.enseignants}</div>}
              </div>

              {/* Equipe toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 14, alignItems: 'center' }}>
                <div>
                  <button type="button" onClick={() => setIsEquipe(v => !v)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: 'bold', background: isEquipe ? '#1895FD' : '#e0e0e0', color: isEquipe ? 'white' : '#555' }}>
                    <span style={{ width: 32, height: 18, borderRadius: 999, background: isEquipe ? 'rgba(255,255,255,0.4)' : '#bbb', display: 'inline-block', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: 2, left: isEquipe ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                    </span>
                    Ceci est un travail en equipe
                  </button>
                </div>
                {isEquipe && <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Nom ou numero d'equipe</label>
                  <input type="text" value={nomEquipe} onChange={e => setNomEquipe(e.target.value)} placeholder="ex. Equipe A"
                    style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
                </div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                      {isEquipe ? 'Personne equipiere 1' : 'Nom complet'} <span style={{ color: '#E41E25' }}>*</span>
                    </label>
                    <input type="text" value={studentNom} onChange={e => { setStudentNom(e.target.value); setNomError(false); }} placeholder="ex. Marie Tremblay"
                      style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: nomError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: nomError ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                    {nomError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>Ce champ est requis</span>}
                  </div>
                  {isEquipe && equipiers.map((nom, idx) =>
                    <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Personne equipiere {idx + 2} <span style={{ color: '#E41E25' }}>*</span></label>
                        <input type="text" value={nom}
                          onChange={e => { setEquipiers(prev => prev.map((v, i) => i === idx ? e.target.value : v)); setEquipiersErrors(prev => prev.map((v, i) => i === idx ? false : v)); }}
                          placeholder="ex. Jean Dupont"
                          style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: equipiersErrors[idx] ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: equipiersErrors[idx] ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                        {equipiersErrors[idx] && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>Ce champ est requis</span>}
                      </div>
                      {equipiers.length > 1 && <button type="button" onClick={() => { setEquipiers(prev => prev.filter((_, i) => i !== idx)); setEquipiersErrors(prev => prev.filter((_, i) => i !== idx)); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E41E25', fontSize: '1.1em', marginBottom: equipiersErrors[idx] ? 22 : 2 }}>X</button>}
                    </div>
                  )}
                  {isEquipe && <button type="button" onClick={() => setEquipiers(prev => [...prev, ''])}
                    style={{ background: 'none', border: '1px dashed #1895FD', color: '#1895FD', borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontSize: '0.88em', fontFamily: 'inherit', alignSelf: 'flex-start' }}>
                    + Ajouter une personne equipiere
                  </button>}
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Numero de groupe ou de section</label>
                  <input type="text" value={studentGroupe} onChange={e => setStudentGroupe(e.target.value)} placeholder="ex. 65100"
                    style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Directives reveal */}
            <div className="section-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: directivesVisible ? 12 : 0 }}>
                <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.05em' }}>Directives d'utilisation des SIA</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setDirectivesVisible(v => !v)}
                    style={{ background: 'none', border: '1px solid #1895FD', color: '#1895FD', borderRadius: 5, padding: '4px 14px', cursor: 'pointer', fontSize: '0.85em', fontFamily: 'inherit' }}>
                    {directivesVisible ? 'Masquer' : 'Reveler les directives'}
                  </button>
                  <button className="btn-primary" style={{ background: '#6c757d', margin: 0, fontSize: '0.85em', padding: '4px 12px' }} onClick={() => { setData(null); setApercu(null); setSubmitStatus(null); }}>
                    Changer de fichier
                  </button>
                </div>
              </div>
              {directivesVisible && (
                <div>
                  {data.mode === 'aucune'
                    ? <p style={{ color: '#555', fontStyle: 'italic', fontSize: '0.9em', margin: '8px 0 0' }}>Aucune restriction - les SIA sont autorises sans restrictions pour toutes les actions.</p>
                    : (
                      <>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em', marginBottom: data.precisions ? 10 : 0 }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #ccc', padding: '7px 10px', background: '#F2F2F2', textAlign: 'left', width: '55%' }}>Action</th>
                              <th style={{ border: '1px solid #ccc', padding: '7px 10px', background: '#F2F2F2', textAlign: 'left', width: '25%' }}>Phase</th>
                              <th style={{ border: '1px solid #ccc', padding: '7px 10px', background: '#F2F2F2', textAlign: 'left', width: '20%' }}>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.activeActions.map((a, i) => {
                              const ps = PERM_STYLES[a.perm] || {};
                              return (
                                <tr key={i}>
                                  <td style={{ border: '1px solid #ccc', padding: '6px 10px', verticalAlign: 'top' }}>{a.libelle}</td>
                                  <td style={{ border: '1px solid #ccc', padding: '6px 10px', verticalAlign: 'top', color: a.phaseColor, fontSize: '0.9em' }}>{a.phaseLibelle}</td>
                                  <td style={{ border: '1px solid #ccc', padding: '6px 10px', verticalAlign: 'top' }}>
                                    <span style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, borderRadius: 4, padding: '2px 7px', fontSize: '0.85em', whiteSpace: 'nowrap' }}>{ps.label}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {data.precisions && (
                          <div style={{ background: '#f0f8ff', border: '1px solid #1895FD', borderRadius: 6, padding: '10px 14px', fontSize: '0.88em', color: '#333' }}>
                            <strong>Precisions de la personne enseignante :</strong> {data.precisions}
                          </div>
                        )}
                      </>
                    )
                  }
                </div>
              )}
            </div>

            {/* Declaration form */}
            <div style={{ position: 'relative' }}>
              {!identOk && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs obligatoires" />}
              <div className="section-box" style={{ opacity: identOk ? 1 : 0.5, pointerEvents: identOk ? 'auto' : 'none' }}>
                <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 14 }}>
                  {isEquipe ? 'Notre' : 'Ma'} declaration d'utilisation
                </h2>

                {/* Toggle SIA */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#f0f0f0', borderRadius: 999, padding: 3, width: 'fit-content' }}>
                  {[
                    { val: true, label: "Je n'ai utilise aucun SIA pour cette evaluation." },
                    { val: false, label: "J'ai utilise le(s) SIA suivant(s)." },
                  ].map(opt => (
                    <button key={String(opt.val)} type="button" onClick={() => setAucunSIA(opt.val)}
                      style={{ padding: '7px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: aucunSIA === opt.val ? 'bold' : 'normal', background: aucunSIA === opt.val ? (opt.val ? '#231F20' : '#1895FD') : 'transparent', color: aucunSIA === opt.val ? 'white' : '#555', transition: 'background 0.2s' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {aucunSIA ? (
                  <div style={{ marginBottom: 20 }}>
                    {obligActions.length > 0 && (
                      <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '14px 18px', marginBottom: 14 }}>
                        <p style={{ fontWeight: 'bold', color: '#856404', margin: '0 0 8px', fontSize: '0.92em' }}>
                          L'utilisation d'un SIA est obligatoire pour au moins une action.
                        </p>
                        <ul style={{ margin: '0 0 10px 18px', fontSize: '0.9em' }}>
                          {obligActions.map((a, i) => <li key={i}><strong>{a.libelle}</strong></li>)}
                        </ul>
                        <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5, color: '#856404' }}>
                          Justifiez pourquoi vous n'avez pas utilise de SIA pour cette action. <span style={{ color: '#E41E25' }}>*</span>
                        </label>
                        <textarea value={aucunSIAJustif} onChange={e => { setAucunSIAJustif(e.target.value); setAucunSIAJustifError(false); }} rows={3}
                          placeholder="Expliquez les raisons pour lesquelles vous n'avez pas utilise de SIA..."
                          style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: aucunSIAJustifError ? '2px solid #E41E25' : '1px solid #ffc107', borderRadius: 4, background: aucunSIAJustifError ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }} />
                        {aucunSIAJustifError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>Ce champ est requis</span>}
                      </div>
                    )}
                    <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, padding: '14px 18px' }}>
                      <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5 }}>
                        Commentaires <span style={{ fontWeight: 'normal', color: '#888' }}>(facultatif)</span>
                      </label>
                      <textarea value={aucunSIACommentaire} onChange={e => setAucunSIACommentaire(e.target.value)} rows={3}
                        placeholder="Ajoutez tout commentaire pertinent..."
                        style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #ccc', borderRadius: 4, background: 'white', boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ margin: '0 0 16px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>
                      Pour chaque SIA utilise, indiquez l'outil et les actions effectuees.
                    </p>

                    {outilEntries.map((entry, i) => {
                      const grouped = groupByPhase([...data.activeActions, ...(entry.customActions || []).map(a => ({ ...a, perm: 'asr' }))]);
                      return (
                        <div key={i} className="entry-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <strong style={{ fontSize: '0.95em' }}>Outil {i + 1}</strong>
                            {outilEntries.length > 1 && (
                              <button type="button" onClick={() => removeEntry(i)}
                                style={{ background: 'none', border: '1px solid #E41E25', color: '#E41E25', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: '0.82em', fontFamily: 'inherit' }}>
                                Retirer
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start' }}>
                            {/* Outil selector */}
                            <div>
                              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5 }}>
                                Outil utilise <span style={{ color: '#E41E25' }}>*</span>
                              </label>
                              <select value={entry.outil} onChange={e => updateEntry(i, 'outil', e.target.value)}
                                style={{ padding: '6px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: entryErrors[i]?.outil ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: entryErrors[i]?.outil ? '#fff4f4' : 'white', minWidth: 220 }}>
                                <option value="">-- Choisir --</option>
                                {SIA_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              {entryErrors[i]?.outil && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>Selection requise</span>}
                              {entry.outil === 'Autre' && (
                                <div style={{ marginTop: 8 }}>
                                  <input type="text" value={entry.outilLibre} onChange={e => updateEntry(i, 'outilLibre', e.target.value)}
                                    placeholder="Precisez le nom..."
                                    style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', fontSize: '0.93em', border: entryErrors[i]?.outilLibre ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, boxSizing: 'border-box' }} />
                                  {entryErrors[i]?.outilLibre && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>Ce champ est requis</span>}
                                </div>
                              )}
                            </div>

                            {/* Actions checkboxes */}
                            <div>
                              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 8 }}>
                                Actions realisees <span style={{ color: '#E41E25' }}>*</span>
                                <span style={{ fontWeight: 'normal', color: '#888', fontSize: '0.9em' }}> - cochez toutes celles qui s'appliquent</span>
                              </label>
                              {entryErrors[i]?.actionIds && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginBottom: 6 }}>Selectionnez au moins une action</span>}
                              {!(entry.outil) && (
                                <div style={{ padding: '12px 14px', background: '#f8f9fa', border: '1px dashed #bbb', borderRadius: 6, color: '#888', fontSize: '0.87em', fontStyle: 'italic' }}>
                                  Selectionnez d'abord un outil ci-contre pour acceder aux actions possibles.
                                </div>
                              )}
                              {entry.outil && (
                              <div style={{ border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
                                {Object.entries(grouped).map(([phaseLibelle, { color, actions: phaseActions }], gi) => (
                                  <div key={gi} style={{ borderBottom: gi < Object.keys(grouped).length - 1 ? '1px solid #eee' : 'none' }}>
                                    <div style={{ background: '#f5f5f5', padding: '5px 10px', fontSize: '0.78em', fontWeight: 'bold', color, borderBottom: '1px solid #eee' }}>{phaseLibelle}</div>
                                    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {phaseActions.map(action => {
                                        const ps = PERM_STYLES[action.perm] || {};
                                        const checked = entry.actionIds.includes(action.id);
                                        const isCustom = !!(entry.customActions || []).find(ca => ca.id === action.id);
                                        return (
                                          <label key={action.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88em' }}>
                                            <input type="checkbox" checked={checked} onChange={() => toggleAction(i, action.id)}
                                              style={{ width: 15, height: 15, flexShrink: 0, cursor: 'pointer', accentColor: isCustom ? '#888' : ps.color }} />
                                            <span style={{ flex: 1 }}>{action.libelle}</span>
                                            {isCustom ? (
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                                <span style={{ background: '#f0f0f0', color: '#666', border: '1px solid #ccc', borderRadius: 3, padding: '1px 6px', fontSize: '0.8em', whiteSpace: 'nowrap' }}>Action personnalisee</span>
                                                <button type="button" onClick={e => { e.preventDefault(); setAutreActionModal({ entryIdx: i, editId: action.id }); }}
                                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1895FD', fontSize: '0.85em', padding: '0 2px', lineHeight: 1 }} title="Modifier">edit</button>
                                                <button type="button" onClick={e => { e.preventDefault(); removeCustomAction(i, action.id); }}
                                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '1em', padding: '0 2px', lineHeight: 1 }} title="Retirer">x</button>
                                              </span>
                                            ) : (
                                              <span style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, borderRadius: 3, padding: '1px 6px', fontSize: '0.8em', whiteSpace: 'nowrap', flexShrink: 0 }}>{ps.label}</span>
                                            )}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                                <div style={{ borderTop: '1px solid #eee', padding: '8px 10px', background: '#fafafa' }}>
                                  <button type="button" onClick={() => setAutreActionModal({ entryIdx: i })}
                                    style={{ background: 'none', border: '1px dashed #1895FD', color: '#1895FD', borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82em', width: '100%', textAlign: 'left' }}>
                                    + Ajouter une action non listee
                                  </button>
                                </div>
                              </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button type="button" onClick={addEntry}
                      style={{ background: '#1895FD', color: 'white', border: 'none', borderRadius: 5, padding: '10px 24px', cursor: 'pointer', fontSize: '0.95em', fontFamily: 'inherit', fontWeight: 'bold', display: 'block', width: '100%', marginBottom: 20 }}>
                      + Ajouter un autre outil
                    </button>

                    {/* Exigences dynamiques */}
                    {(obligNonCouvertes.length > 0 || nonAutoriseeSelectionnees.length > 0) && (
                      <div style={{ marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '0.98em', marginBottom: 12 }}>Elements a preciser avant de soumettre</h3>

                        {obligNonCouvertes.length > 0 && (
                          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '14px 18px', marginBottom: 14 }}>
                            <p style={{ fontWeight: 'bold', color: '#856404', margin: '0 0 8px', fontSize: '0.92em' }}>
                              Action(s) obligatoire(s) non declaree(s)
                            </p>
                            <ul style={{ margin: '0 0 10px 18px', fontSize: '0.9em' }}>
                              {obligNonCouvertes.map((a, idx) => <li key={idx}><strong>{a.libelle}</strong></li>)}
                            </ul>
                            <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5, color: '#856404' }}>
                              Justifiez pourquoi ces actions obligatoires ne figurent pas dans votre declaration. <span style={{ color: '#E41E25' }}>*</span>
                            </label>
                            <textarea value={obligNonCouvJustif} onChange={e => { setObligNonCouvJustif(e.target.value); setObligNonCouvJustifError(false); }} rows={3}
                              placeholder="Expliquez pourquoi vous n'avez pas utilise de SIA pour ces actions malgre l'obligation..."
                              style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: obligNonCouvJustifError ? '2px solid #E41E25' : '1px solid #ffc107', borderRadius: 4, background: obligNonCouvJustifError ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }} />
                            {obligNonCouvJustifError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>Ce champ est requis</span>}
                          </div>
                        )}

                        {nonAutoriseeSelectionnees.map(action => {
                          const hasError = nonAutoriseeJustifErrors[action.id];
                          return (
                            <div key={action.id} style={{ background: '#fde8e8', border: '1px solid #E41E25', borderRadius: 8, padding: '14px 18px', marginBottom: 14 }}>
                              <p style={{ fontWeight: 'bold', color: '#7b1d1d', margin: '0 0 6px', fontSize: '0.92em' }}>
                                Action non autorisee declaree : <em>{action.libelle}</em>
                              </p>
                              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5, color: '#7b1d1d' }}>
                                Justifiez l'utilisation d'un SIA pour cette action non autorisee. <span style={{ color: '#E41E25' }}>*</span>
                              </label>
                              <textarea value={nonAutoriseeJustifs[action.id] || ''} onChange={e => { setNonAutoriseeJustifs(prev => ({ ...prev, [action.id]: e.target.value })); setNonAutoriseeJustifErrors(prev => ({ ...prev, [action.id]: false })); }} rows={3}
                                placeholder="Expliquez les circonstances ou raisons de cette utilisation..."
                                style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: hasError ? '2px solid #E41E25' : '1px solid #E41E25', borderRadius: 4, background: hasError ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }} />
                              {hasError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>Ce champ est requis</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Exigences de declaration */}
                    {data.exigencesMode === 'inclure' && data.exigences?.length > 0 && (() => {
                      const typeLabels = { iagraphie: 'References et IAgraphie', traces: 'Conserver les traces', logique: "Expliquer la logique d'utilisation" };
                      return (
                        <div style={{ background: '#f0f8ff', border: '1px solid #1895FD', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
                          <p style={{ fontWeight: 'bold', color: '#00527a', margin: '0 0 12px', fontSize: '0.95em' }}>Exigences de declaration</p>
                          {data.exigences.map(exig => {
                            const resp = exigencesResponses[exig.id] || {};
                            const setResp = (field, val) => {
                              setExigencesResponses(prev => ({ ...prev, [exig.id]: { ...(prev[exig.id] || {}), [field]: val } }));
                              setExigencesErrors(prev => { const n = { ...prev }; delete n[exig.id]; return n; });
                            };
                            const label = typeLabels[exig.type] || exig.type;
                            const hasError = exigencesErrors[exig.id];
                            return (
                              <div key={exig.id} style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 4 }}>
                                  {label} <span style={{ color: '#E41E25' }}>*</span>
                                </label>
                                {exig.description && (
                                  <div style={{ fontSize: '0.85em', color: '#555', marginBottom: 6, padding: '6px 10px', background: '#e8f4fd', borderRadius: 4 }} dangerouslySetInnerHTML={{ __html: exig.description }} />
                                )}
                                <textarea value={resp.value || ''} onChange={e => setResp('value', e.target.value)} rows={2} disabled={resp.ailleurs}
                                  placeholder={`Repondez a l'exigence : ${label}...`}
                                  style={{ width: '100%', padding: '6px 9px', fontFamily: 'inherit', fontSize: '0.93em', border: hasError ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: resp.ailleurs ? '#eee' : (hasError ? '#fff4f4' : 'white'), boxSizing: 'border-box', resize: 'vertical' }} />
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: '0.88em', color: '#555', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={!!resp.ailleurs} onChange={e => setResp('ailleurs', e.target.checked)} />
                                  Cette exigence a deja ete traitee ailleurs dans le travail soumis ou dans cette declaration.
                                </label>
                                {hasError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>Ce champ est requis ou cochez la case</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Commentaires globaux */}
                    <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5 }}>
                        Commentaires <span style={{ fontWeight: 'normal', color: '#888' }}>(facultatif)</span>
                      </label>
                      <textarea value={commentaireGlobal} onChange={e => setCommentaireGlobal(e.target.value)} rows={3}
                        placeholder="Ajoutez tout commentaire pertinent concernant votre utilisation des SIA..."
                        style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #ccc', borderRadius: 4, background: 'white', boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>
                  </>
                )}

                {/* Submit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn-primary" style={{ fontSize: '1em', padding: '11px 28px' }} onClick={handleSoumettre}>
                    Generer la declaration
                  </button>
                  {submitStatus && (submitStatus.ok
                    ? <span style={{ background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>Declaration generee avec succes.</span>
                    : <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>Certains champs obligatoires ne sont pas remplis.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Autre action modal */}
            <AutreActionModal
              isOpen={!!autreActionModal}
              onClose={() => setAutreActionModal(null)}
              initialValues={autreActionModal?.editId
                ? outilEntries[autreActionModal.entryIdx]?.customActions?.find(a => a.id === autreActionModal.editId)
                : null}
              onSave={action => {
                if (!autreActionModal) return;
                if (autreActionModal.editId) {
                  editCustomAction(autreActionModal.entryIdx, autreActionModal.editId, action);
                } else {
                  addCustomAction(autreActionModal.entryIdx, action);
                }
              }}
            />

            {/* Apercu */}
            {apercu && (
              <>
                <div ref={apercuRef} style={{ background: 'white', padding: '40px 50px', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 20, fontFamily: 'Arial, sans-serif', fontSize: '16px', lineHeight: 1.5 }}>
                  <div dangerouslySetInnerHTML={{ __html: buildApercuHTML(apercu) }} />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 30, alignItems: 'center', justifyContent: 'center' }}>
                  <button type="button" className="btn-primary" style={{ background: '#6c757d' }} onClick={() => { setApercu(null); setSubmitStatus(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    Continuer a modifier
                  </button>
                  <button type="button" className="btn-primary" onClick={() => copyToClipboard(apercu)}>
                    Copier pour Word
                  </button>
                  {copyOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copie !</span>}
                  <button type="button" className="btn-primary" onClick={() => downloadWord(apercu)}>
                    Telecharger en Word (.doc)
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}