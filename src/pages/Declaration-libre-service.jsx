import React, { useState, useRef } from 'react';
import AutreActionModal from '@/components/guide/AutreActionModal';
import PHASES from '@/components/directives/directivesData';
import SIA_LIST_RAW from '@/components/listeSIA';

function AProposButton() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit', fontSize: '1.0em', fontWeight: 'bold', color: '#231F20', textTransform: 'uppercase' }}>
        <span style={{ fontSize: '0.8em', color: '#888', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
        À propos…
      </button>
      {open && (
        <div style={{ textAlign: 'left', paddingTop: 6, fontSize: '0.93em', lineHeight: 1.6 }}>
          Cette application vous est offerte gratuitement par le <a href="https://www.enseigner.ulaval.ca/a-propos" target="_blank" style={{ color: '#1e40af', textDecoration: 'underline' }}>Service de soutien à l'enseignement</a> de l'Université Laval, CC-BY 4.0 2026.<br /><br />
          <em><b>Déclaration d'utilisation de SIA: Aidée de l'IA.</b></em><br />
          Tous les textes présentés ont été validés par l'équipe de développement. Le code a été développé avec l'aide de ChatGPT et Claude, mais plus particulièrement par Base44 pour la version actuelle.
        </div>
      )}
    </div>
  );
}

const SIA_LIST = [...SIA_LIST_RAW].sort((a, b) => a.localeCompare(b, 'fr')).concat(['Autre']);

let customActionCounter = 0;
function makeCustomActionId() {return `ls-custom-${++customActionCounter}-${Date.now()}`;}

function defaultOutilEntry() {
  return { outil: '', outilLibre: '', actionIds: [], customActions: [] };
}

const QUESTIONS_REFLEXION = [
"En quoi l'utilisation d'un SIA a-t-elle soutenu ou limité votre réflexion personnelle dans cette évaluation?",
"Comment avez-vous vérifié, critiqué ou adapté les contenus générés?",
"Qu'avez-vous appris sur l'utilisation de ces SIA pour votre contexte disciplinaire?",
"Quel effet l'utilisation de ces systèmes a-t-elle eu sur vos apprentissages?"];


export default function DeclarationLibreService() {
  // Identification
  const [cours, setCours] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [enseignant, setEnseignant] = useState('');
  const [session, setSession] = useState('');
  const [sessionError, setSessionError] = useState(false);
  const [studentNom, setStudentNom] = useState('');
  const [nomError, setNomError] = useState(false);
  const [studentGroupe, setStudentGroupe] = useState('');
  const [isEquipe, setIsEquipe] = useState(false);
  const [nomEquipe, setNomEquipe] = useState('');
  const [equipiers, setEquipiers] = useState(['']);
  const [equipiersErrors, setEquipiersErrors] = useState([]);

  // Directives enseignant
  const [directivesMode, setDirectivesMode] = useState('aucune'); // 'aucune' | 'fournies'
  const [directivesTexte, setDirectivesTexte] = useState('');
  const [directivesTexteError, setDirectivesTexteError] = useState(false);

  // Déclaration SIA
  const [aucunSIA, setAucunSIA] = useState(true);
  const [outilEntries, setOutilEntries] = useState([defaultOutilEntry()]);
  const [entryErrors, setEntryErrors] = useState([{}]);
  const [autreActionModal, setAutreActionModal] = useState(null);

  // Commentaires (obligatoire)
  const [commentaire, setCommentaire] = useState('');
  const [commentaireError, setCommentaireError] = useState(false);

  // Aperçu
  const [apercu, setApercu] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [copyOk, setCopyOk] = useState(false);
  const apercuRef = useRef();

  const identOk = !!(session.trim() && studentNom.trim() && cours.trim() && evaluation.trim() && enseignant.trim());

  // Build ALL_PHASES actions flat map
  const ALL_PHASE_ACTIONS = [];
  PHASES.forEach((p) => p.actions.forEach((a) => {
    ALL_PHASE_ACTIONS.push({ ...a, phaseId: p.id, phaseLibelle: p.libelle, phaseColor: p.color });
  }));

  function updateEntry(i, field, value) {
    setOutilEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
    setEntryErrors((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: false } : e));
  }

  function toggleAction(entryIdx, actionId) {
    setOutilEntries((prev) => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      const has = e.actionIds.includes(actionId);
      return { ...e, actionIds: has ? e.actionIds.filter((id) => id !== actionId) : [...e.actionIds, actionId] };
    }));
    setEntryErrors((prev) => prev.map((e, idx) => idx === entryIdx ? { ...e, actionIds: false } : e));
  }

  function addCustomAction(entryIdx, { libelle, phaseLibelle, phaseColor, phaseId }) {
    const id = makeCustomActionId();
    setOutilEntries((prev) => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      return { ...e, customActions: [...(e.customActions || []), { id, libelle, phaseLibelle, phaseColor, phaseId }], actionIds: [...e.actionIds, id] };
    }));
    setEntryErrors((prev) => prev.map((e, idx) => idx === entryIdx ? { ...e, actionIds: false } : e));
  }

  function editCustomAction(entryIdx, id, { libelle, phaseLibelle, phaseColor, phaseId }) {
    setOutilEntries((prev) => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      return { ...e, customActions: e.customActions.map((a) => a.id === id ? { ...a, libelle, phaseLibelle, phaseColor, phaseId } : a) };
    }));
  }

  function removeCustomAction(entryIdx, id) {
    setOutilEntries((prev) => prev.map((e, idx) => {
      if (idx !== entryIdx) return e;
      return { ...e, customActions: e.customActions.filter((a) => a.id !== id), actionIds: e.actionIds.filter((aid) => aid !== id) };
    }));
  }

  function removeEntry(i) {
    setOutilEntries((prev) => prev.filter((_, idx) => idx !== i));
    setEntryErrors((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addEntry() {
    setOutilEntries((prev) => [...prev, defaultOutilEntry()]);
    setEntryErrors((prev) => [...prev, {}]);
  }

  function getOutilLabel(entry) {
    return entry.outil === 'Autre' && entry.outilLibre.trim() ? entry.outilLibre.trim() : entry.outil;
  }

  // Group actions by phase for display in entry card
  function getGroupedActionsForEntry(entry) {
    const customIds = new Set((entry.customActions || []).map((a) => a.id));
    const groups = {};
    // Phase-standard actions
    PHASES.forEach((p) => {
      groups[p.libelle] = { color: p.color, actions: p.actions.map((a) => ({ ...a, phaseLibelle: p.libelle, phaseColor: p.color, isCustom: false })) };
    });
    // Custom actions
    if ((entry.customActions || []).length > 0) {
      const customPhaseGroups = {};
      entry.customActions.forEach((a) => {
        const ph = a.phaseLibelle || 'Action personnalisée';
        if (!customPhaseGroups[ph]) customPhaseGroups[ph] = { color: a.phaseColor || '#888', customs: [] };
        customPhaseGroups[ph].customs.push(a);
      });
      // merge custom into their phase groups
      Object.entries(customPhaseGroups).forEach(([ph, { color, customs }]) => {
        if (!groups[ph]) groups[ph] = { color, actions: [] };
        customs.forEach((c) => groups[ph].actions.push({ ...c, isCustom: true }));
      });
    }
    return groups;
  }

  function handleSoumettre() {
    let hasErrors = false;
    if (!session.trim()) {setSessionError(true);hasErrors = true;} else {setSessionError(false);}
    if (!studentNom.trim()) {setNomError(true);hasErrors = true;} else {setNomError(false);}
    if (isEquipe) {
      const errs = equipiers.map((n) => !n.trim());
      setEquipiersErrors(errs);
      if (errs.some(Boolean)) hasErrors = true;
    }
    if (directivesMode === 'fournies' && !directivesTexte.trim()) {
      setDirectivesTexteError(true);hasErrors = true;
    } else {setDirectivesTexteError(false);}

    if (!aucunSIA) {
      const newEntryErrors = outilEntries.map((e) => {
        const err = {};
        if (!e.outil) err.outil = true;
        if (e.outil === 'Autre' && !e.outilLibre.trim()) err.outilLibre = true;
        if (e.actionIds.length === 0) err.actionIds = true;
        return err;
      });
      setEntryErrors(newEntryErrors);
      if (newEntryErrors.some((e) => Object.keys(e).length > 0)) hasErrors = true;
    }

    if (!commentaire.trim()) {setCommentaireError(true);hasErrors = true;} else {setCommentaireError(false);}

    if (hasErrors) {setSubmitStatus({ ok: false });return;}

    const tzCodes = { 'America/Toronto': 'HNE', 'America/Montreal': 'HNE', 'America/Vancouver': 'HNP', 'America/Edmonton': 'HNR', 'America/Winnipeg': 'HNC', 'America/Halifax': 'HNA', 'Europe/Paris': 'HEC' };
    const now = new Date();
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetFallbacks = { '-300': 'HNE', '-360': 'HNC', '-420': 'HNR', '-480': 'HNP', '0': 'UTC', '60': 'HEC' };
    const tzCode = tzCodes[userTz] || offsetFallbacks[String(-now.getTimezoneOffset())] || 'UTC';
    const timestamp = now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) + ' à ' + now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') + ' ' + tzCode;

    setApercu({
      cours, evaluation, enseignant, session,
      studentNom, studentGroupe, isEquipe, nomEquipe,
      equipiers: isEquipe ? [studentNom, ...equipiers] : [studentNom],
      directivesMode, directivesTexte,
      aucunSIA, outilEntries, commentaire, timestamp
    });
    setSubmitStatus({ ok: true });
    setTimeout(() => apercuRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function buildApercuHTML(ap) {
    const coursLabel = ap.cours || '[cours]';
    const evalLabel = ap.evaluation || '[évaluation]';
    const sessionLabel = ap.session || '[session]';
    const enseignantLabel = ap.enseignant || '[personne enseignante]';

    let intro;
    if (ap.isEquipe) {
      const noms = ap.equipiers.filter((n) => n.trim()).join(', ');
      const eq = ap.nomEquipe ? ` (équipe ${ap.nomEquipe})` : '';
      const gr = ap.studentGroupe ? `, groupe ${ap.studentGroupe}` : '';
      intro = `Nous, <strong>${noms}</strong>${eq}${gr}, soumettons cette déclaration${ap.evaluation ? ` dans le cadre de l'évaluation <strong>${evalLabel}</strong>` : ''}${ap.cours ? ` du cours <strong>${coursLabel}</strong>` : ''}${ap.session ? `, session <strong>${sessionLabel}</strong>` : ''}${ap.enseignant ? `, enseigné par <strong>${enseignantLabel}</strong>` : ''}.`;
    } else {
      const gr = ap.studentGroupe ? ` (groupe ${ap.studentGroupe})` : '';
      intro = `Je, <strong>${ap.studentNom}</strong>${gr}, soumets cette déclaration${ap.evaluation ? ` dans le cadre de l'évaluation <strong>${evalLabel}</strong>` : ''}${ap.cours ? ` du cours <strong>${coursLabel}</strong>` : ''}${ap.session ? `, session <strong>${sessionLabel}</strong>` : ''}${ap.enseignant ? `, enseigné par <strong>${enseignantLabel}</strong>` : ''}.`;
    }

    let directivesSection = '';
    if (ap.directivesMode === 'fournies' && ap.directivesTexte) {
      directivesSection = `<h2 style="font-family:Georgia,serif;font-size:16pt;margin:12pt 0 6pt;">Directives de la personne enseignante</h2>
<div style="font-family:Arial,sans-serif;font-size:11pt;white-space:pre-wrap;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;padding:10px 14px;margin-bottom:12pt;">${ap.directivesTexte}</div>`;
    }

    let declHtml;
    if (ap.aucunSIA) {
      declHtml = `<p style="font-style:italic;color:#555;">Aucun système d'intelligence artificielle n'a été utilisé pour cette évaluation.</p>`;
    } else {
      declHtml = `<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:10pt;">
<thead><tr>
  <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;">Outil</th>
  <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;">Phase</th>
  <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;">Actions déclarées</th>
</tr></thead><tbody>`;
      ap.outilEntries.forEach((entry) => {
        const customIds = new Set((entry.customActions || []).map((a) => a.id));
        // Build rows grouped by phase
        const phaseMap = {};
        entry.actionIds.forEach((id) => {
          let action = ALL_PHASE_ACTIONS.find((a) => a.id === id);
          if (!action) action = (entry.customActions || []).find((a) => a.id === id);
          if (!action) return;
          const ph = action.phaseLibelle || 'Action personnalisée';
          if (!phaseMap[ph]) phaseMap[ph] = [];
          const label = customIds.has(id) ? `${action.libelle} <em style="color:#666">(Action personnalisée)</em>` : action.libelle;
          phaseMap[ph].push(label);
        });
        const phases = Object.keys(phaseMap);
        if (phases.length === 0) return;
        let firstRow = true;
        const totalActions = Object.values(phaseMap).reduce((s, arr) => s + arr.length, 0);
        phases.forEach((ph) => {
          const acts = phaseMap[ph];
          if (firstRow) {
            declHtml += `<tr>
  <td style="border:1px solid #ccc;padding:6px;vertical-align:top" rowspan="${phases.length}"><strong>${getOutilLabel(entry)}</strong></td>
  <td style="border:1px solid #ccc;padding:6px;vertical-align:top;font-size:0.9em;color:#555;">${ph}</td>
  <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${acts.join('<br>')}</td>
</tr>`;
            firstRow = false;
          } else {
            declHtml += `<tr>
  <td style="border:1px solid #ccc;padding:6px;vertical-align:top;font-size:0.9em;color:#555;">${ph}</td>
  <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${acts.join('<br>')}</td>
</tr>`;
          }
        });
      });
      declHtml += `</tbody></table>`;
    }

    return `<h1 style="font-family:Georgia,serif;font-size:22px;font-weight:bold;text-align:center;border-bottom:1px solid black;padding-bottom:8pt;margin-bottom:8pt;">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)</h1>
<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;margin-bottom:8pt;">${intro}</p>
<p style="font-family:Arial,sans-serif;font-size:11pt;margin-bottom:12pt;">Les renseignements suivants présentent ${ap.isEquipe ? 'notre' : 'ma'} démarche d'utilisation des systèmes d'intelligence artificielle.</p>
${directivesSection}
<h2 style="font-family:Georgia,serif;font-size:16pt;margin:12pt 0 6pt;">${ap.isEquipe ? 'Notre' : 'Ma'} déclaration d'utilisation</h2>
<div style="font-family:Arial,sans-serif;font-size:11pt;">${declHtml}</div>
<h2 style="font-family:Georgia,serif;font-size:16pt;margin:12pt 0 6pt;">Commentaires et réflexion</h2>
<p style="font-family:Arial,sans-serif;font-size:11pt;white-space:pre-wrap;">${ap.commentaire}</p>
<h2 style="font-family:Georgia,serif;font-size:16pt;margin:12pt 0 6pt;">La soumission de cette déclaration confirme que :</h2>
<ul style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.7;margin:0 0 0 20px;list-style-type:disc;padding-left:0;">
<li style="margin-bottom:4pt">Les informations fournies sont complètes et fidèles à votre utilisation réelle.</li>
<li style="margin-bottom:4pt">Vous avez fait un usage responsable des SIA et avez respecté le droit d'auteur lors des requêtes et référencement.</li>
<li style="margin-bottom:4pt">Vous avez exercé votre jugement critique et validé l'exactitude des contenus générés par les SIA.</li>
<li style="margin-bottom:4pt">Le travail soumis reflète votre propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.</li>
<li style="margin-bottom:4pt">Vous comprenez qu'une fausse déclaration est une atteinte grave à l'éthique et risque de compromettre la crédibilité du travail réalisé.</li>
<li>Vous comprenez qu'un usage non autorisé, des données fausses ou inventées ou copier-coller des réponses générées par une SIA sans l'identifier constituent des infractions au <a href="https://www.ulaval.ca/sites/default/files/notre-universite/direction-gouv/Documents_officiels/Reglements/Reglement_disciplinaire_intention_etudiants.pdf">Règlement disciplinaire</a> de l'Université Laval.</li>
</ul>
<p style="font-family:Arial,sans-serif;font-size:9pt;color:#666;font-style:italic;margin-top:16pt;">Générée le ${ap.timestamp}</p>`;
  }

  function copyToClipboard(ap) {
    const html = buildApercuHTML(ap);
    const plain = html.replace(/<[^>]+>/g, '');
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })]).
      then(() => {setCopyOk(true);setTimeout(() => setCopyOk(false), 1800);}).
      catch(() => navigator.clipboard.writeText(html).then(() => {setCopyOk(true);setTimeout(() => setCopyOk(false), 1800);}));
    } else {
      navigator.clipboard.writeText(html).then(() => {setCopyOk(true);setTimeout(() => setCopyOk(false), 1800);});
    }
  }

  function downloadWord(ap) {
    const content = buildApercuHTML(ap);
    const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"><title>Déclaration SIA</title></head><body>${content}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href = url;a.download = 'declaration-libre-service-sia.doc';a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <style>{`
          .btn-primary { background-color: #1895FD; color: white; border: none; padding: 10px 20px; margin: 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; font-family: inherit; }
          .btn-primary:hover { background-color: #1278d4; }
          .section-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
          .entry-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 18px; margin-bottom: 16px; }
          .pill-toggle { display: flex; gap: 0; background: #f0f0f0; border-radius: 999px; padding: 3px; }
          .pill-opt { padding: 7px 16px; border-radius: 999px; border: none; cursor: pointer; font-family: inherit; font-size: 0.88em; transition: background 0.2s; }
        `}</style>

        <h1 style={{ color: '#1895FD', textAlign: 'center', fontSize: '1.5em', fontWeight: 'bold', marginBottom: 6 }}>
          Déclaration d'utilisation des SIA — Version libre service
        </h1>

        {/* Instructions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 6, color: '#231F20', textTransform: 'uppercase' }}>❓ Pourquoi remplir cette déclaration?</h2>
            <p style={{ fontSize: '0.93em', color: '#333', lineHeight: 1.6, marginBottom: 14 }}>
              Déclarer votre utilisation des SIA, c'est présenter votre démarche d'utilisation des SIA et illustrer votre éthique de travail par le respect des autorisations indiquées pour cette évaluation par la personne enseignante du cours. Cette déclaration vise ainsi à vous soutenir dans la mise en valeur de votre intégrité intellectuelle.
            </p>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8, color: '#231F20', textTransform: 'uppercase' }}>❓ Comment ça fonctionne?</h2>
            <ol style={{ listStyleType: 'decimal', paddingLeft: 20, marginTop: 8, marginBottom: 8 }}>
              <li>Remplissez la section d'identification.</li>
              <li>Si votre personne enseignante vous a fourni des directives, indiquez-les dans la section correspondante.</li>
              <li>Déclarez les outils SIA utilisés et les actions réalisées, phase par phase.</li>
              <li>Répondez à au moins une question de réflexion, puis générez votre déclaration.</li>
              <li>Copiez et collez le contenu généré en annexe de votre travail ou téléchargez une version Word à soumettre.</li>
            </ol>
            💡 Un doute sur la démarche? Contactez la personne enseignante du cours.<br />
            🔒 Vos données ne sont pas conservées par cette application.
          </div>
          <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 4 }}>
            <AProposButton />
          </div>
        </div>

        {/* === SECTION 1 : IDENTIFICATION === */}
        <div className="section-box">
          <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 14 }}>Identification</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 14 }}>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Cours <span style={{ color: '#E41E25' }}>*</span></label>
              <input type="text" value={cours} onChange={(e) => setCours(e.target.value)} placeholder="ex. GEL-1001"
              style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                Session <span style={{ color: '#E41E25' }}>*</span>
              </label>
              <input type="text" value={session} onChange={(e) => {setSession(e.target.value);setSessionError(false);}} placeholder="ex. Hiver 2025"
              style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: sessionError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: sessionError ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
              {sessionError && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ Requis</span>}
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Évaluation <span style={{ color: '#E41E25' }}>*</span></label>
              <input type="text" value={evaluation} onChange={(e) => setEvaluation(e.target.value)} placeholder="ex. Travail final"
              style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Personne(s) enseignante(s) <span style={{ color: '#E41E25' }}>*</span></label>
              <input type="text" value={enseignant} onChange={(e) => setEnseignant(e.target.value)} placeholder="ex. Prof. Tremblay"
              style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Équipe toggle */}
          <div style={{ marginBottom: 14 }}>
            <button type="button" onClick={() => setIsEquipe((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: 'bold', background: isEquipe ? '#1895FD' : '#e0e0e0', color: isEquipe ? 'white' : '#555' }}>
              <span style={{ width: 32, height: 18, borderRadius: 999, background: isEquipe ? 'rgba(255,255,255,0.4)' : '#bbb', display: 'inline-block', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 2, left: isEquipe ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
              </span>
              Ceci est un travail en équipe
            </button>
            {isEquipe &&
            <div style={{ marginTop: 10 }}>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Nom ou numéro d'équipe</label>
                <input type="text" value={nomEquipe} onChange={(e) => setNomEquipe(e.target.value)} placeholder="ex. Équipe A"
              style={{ width: '40%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>
            }
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                  {isEquipe ? 'Personne équipière 1' : 'Nom complet'} <span style={{ color: '#E41E25' }}>*</span>
                </label>
                <input type="text" value={studentNom} onChange={(e) => {setStudentNom(e.target.value);setNomError(false);}} placeholder="ex. Marie Tremblay"
                style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: nomError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: nomError ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                {nomError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis</span>}
              </div>
              {isEquipe && equipiers.map((nom, idx) =>
              <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Personne équipière {idx + 2} <span style={{ color: '#E41E25' }}>*</span></label>
                    <input type="text" value={nom}
                  onChange={(e) => {setEquipiers((prev) => prev.map((v, i) => i === idx ? e.target.value : v));setEquipiersErrors((prev) => prev.map((v, i) => i === idx ? false : v));}}
                  placeholder="ex. Jean Dupont"
                  style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: equipiersErrors[idx] ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: equipiersErrors[idx] ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                    {equipiersErrors[idx] && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis</span>}
                  </div>
                  {equipiers.length > 1 && <button type="button" onClick={() => {setEquipiers((prev) => prev.filter((_, i) => i !== idx));setEquipiersErrors((prev) => prev.filter((_, i) => i !== idx));}}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E41E25', fontSize: '1.1em', marginBottom: equipiersErrors[idx] ? 22 : 2 }}>✕</button>}
                </div>
              )}
              {isEquipe && <button type="button" onClick={() => setEquipiers((prev) => [...prev, ''])}
              style={{ background: 'none', border: '1px dashed #1895FD', color: '#1895FD', borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontSize: '0.88em', fontFamily: 'inherit', alignSelf: 'flex-start' }}>
                + Ajouter une personne équipière
              </button>}
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Numéro de groupe ou de section</label>
              <input type="text" value={studentGroupe} onChange={(e) => setStudentGroupe(e.target.value)} placeholder="ex. 65100"
              style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* === SECTION 2 : DIRECTIVES ENSEIGNANT === */}
        <div style={{ position: 'relative' }}>
          {!identOk && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs obligatoires" />}
        <div className="section-box" style={{ opacity: identOk ? 1 : 0.5, pointerEvents: identOk ? 'auto' : 'none' }}>
          <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 14 }}>Directives de la personne enseignante</h2>
          <div className="pill-toggle" style={{ marginBottom: 14, flexWrap: 'wrap', width: 'fit-content' }}>
            {[
              { val: 'aucune', label: "Aucune restrictions d'utilisation des SIA spécifiée" },
              { val: 'fournies', label: "La personne enseignante a indiqué les directives suivantes" }].
              map((opt) =>
              <button key={opt.val} type="button" className="pill-opt" onClick={() => {setDirectivesMode(opt.val);setDirectivesTexteError(false);}}
              style={{ fontWeight: directivesMode === opt.val ? 'bold' : 'normal', background: directivesMode === opt.val ? '#1895FD' : 'transparent', color: directivesMode === opt.val ? 'white' : '#555' }}>
                {opt.label}
              </button>
              )}
          </div>
          {directivesMode === 'fournies' &&
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5 }}>
                Directives reçues <span style={{ color: '#E41E25' }}>*</span>
              </label>
              <textarea value={directivesTexte} onChange={(e) => {setDirectivesTexte(e.target.value);setDirectivesTexteError(false);}} rows={5}
              placeholder="Copiez ou résumez ici les directives fournies par votre personne enseignante concernant l'utilisation des SIA pour cette évaluation…"
              style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: directivesTexteError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: directivesTexteError ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }} />
              {directivesTexteError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis</span>}
            </div>
            }
        </div>
        </div>

        {/* === SECTION 3 : DÉCLARATION === */}
        <div style={{ position: 'relative' }}>
          {!identOk && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs obligatoires" />}
          <div className="section-box" style={{ opacity: identOk ? 1 : 0.5, pointerEvents: identOk ? 'auto' : 'none' }}>
            <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 14 }}>
              {isEquipe ? 'Notre' : 'Ma'} déclaration d'utilisation
            </h2>

            {/* Toggle SIA */}
            <div className="pill-toggle" style={{ marginBottom: 20, width: 'fit-content' }}>
              {[
              { val: true, label: "Je n'ai utilisé aucun SIA pour cette évaluation." },
              { val: false, label: "J'ai utilisé le(s) SIA suivant(s)." }].
              map((opt) =>
              <button key={String(opt.val)} type="button" className="pill-opt" onClick={() => setAucunSIA(opt.val)}
              style={{ fontWeight: aucunSIA === opt.val ? 'bold' : 'normal', background: aucunSIA === opt.val ? opt.val ? '#231F20' : '#1895FD' : 'transparent', color: aucunSIA === opt.val ? 'white' : '#555' }}>
                  {opt.label}
                </button>
              )}
            </div>

            {!aucunSIA &&
            <>
                <p style={{ margin: '0 0 16px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>
                  Pour chaque SIA utilisé, indiquez l'outil et les actions réalisées, organisées par phase.
                </p>

                {outilEntries.map((entry, i) => {
                return (
                  <div key={i} className="entry-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <strong style={{ fontSize: '0.95em' }}>Outil {i + 1}</strong>
                        {outilEntries.length > 1 &&
                      <button type="button" onClick={() => removeEntry(i)}
                      style={{ background: 'none', border: '1px solid #E41E25', color: '#E41E25', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: '0.82em', fontFamily: 'inherit' }}>
                            ✕ Retirer
                          </button>
                      }
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start' }}>
                        {/* Outil selector */}
                        <div>
                          <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 5 }}>
                            Outil utilisé <span style={{ color: '#E41E25' }}>*</span>
                          </label>
                          <select value={entry.outil} onChange={(e) => updateEntry(i, 'outil', e.target.value)}
                        style={{ padding: '6px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: entryErrors[i]?.outil ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: entryErrors[i]?.outil ? '#fff4f4' : 'white', minWidth: 220 }}>
                            <option value="">-- Choisir --</option>
                            {SIA_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {entryErrors[i]?.outil && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 3 }}>⚠ Sélection requise</span>}
                          {entry.outil === 'Autre' &&
                        <div style={{ marginTop: 8 }}>
                              <input type="text" value={entry.outilLibre} onChange={(e) => updateEntry(i, 'outilLibre', e.target.value)}
                          placeholder="Précisez le nom…"
                          style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', fontSize: '0.93em', border: entryErrors[i]?.outilLibre ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, boxSizing: 'border-box' }} />
                              {entryErrors[i]?.outilLibre && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis</span>}
                            </div>
                        }
                        </div>

                        {/* Actions par phase */}
                        <div>
                          <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 8 }}>
                            Actions réalisées <span style={{ color: '#E41E25' }}>*</span>
                            <span style={{ fontWeight: 'normal', color: '#888', fontSize: '0.9em' }}> — ajoutez les actions par phase</span>
                          </label>
                          {entryErrors[i]?.actionIds && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginBottom: 6 }}>⚠ Ajoutez au moins une action</span>}
                          {!entry.outil ?
                        <div style={{ padding: '12px 14px', background: '#f8f9fa', border: '1px dashed #bbb', borderRadius: 6, color: '#888', fontSize: '0.87em', fontStyle: 'italic' }}>
                              Sélectionnez d'abord un outil ci-contre pour accéder aux actions possibles.
                            </div> :

                        <div style={{ border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
                              {PHASES.map((phase, gi) => {
                            const phaseCustoms = (entry.customActions || []).filter((a) => a.phaseId === phase.id);
                            return (
                              <div key={phase.id} style={{ borderBottom: gi < PHASES.length - 1 ? '1px solid #eee' : 'none' }}>
                                    <div style={{ background: '#f5f5f5', padding: '5px 10px', fontSize: '0.78em', fontWeight: 'bold', color: phase.color, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span>{phase.libelle}</span>
                                      <button type="button" onClick={() => setAutreActionModal({ entryIdx: i, prePhaseId: phase.id })}
                                  style={{ background: 'none', border: `1px dashed ${phase.color}`, color: phase.color, borderRadius: 4, padding: '2px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82em' }}>
                                        + Ajouter une action
                                      </button>
                                    </div>
                                    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5, minHeight: 36 }}>
                                      {phaseCustoms.length === 0 &&
                                  <span style={{ color: '#bbb', fontSize: '0.83em', fontStyle: 'italic' }}>Aucune action déclarée pour cette phase.</span>
                                  }
                                      {phaseCustoms.map((action) =>
                                  <label key={action.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88em' }}>
                                          <input type="checkbox" checked={entry.actionIds.includes(action.id)} onChange={() => toggleAction(i, action.id)}
                                    style={{ width: 15, height: 15, flexShrink: 0, cursor: 'pointer', accentColor: phase.color }} />
                                          <span style={{ flex: 1 }}>{action.libelle}</span>
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                            <button type="button" onClick={(e) => {e.preventDefault();setAutreActionModal({ entryIdx: i, editId: action.id });}}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1895FD', fontSize: '0.85em', padding: '0 2px', lineHeight: 1 }} title="Modifier">✏️</button>
                                            <button type="button" onClick={(e) => {e.preventDefault();removeCustomAction(i, action.id);}}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '1em', padding: '0 2px', lineHeight: 1 }} title="Retirer">×</button>
                                          </span>
                                        </label>
                                  )}
                                    </div>
                                  </div>);

                          })}
                            </div>
                        }
                        </div>
                      </div>
                    </div>);

              })}

                <button type="button" onClick={addEntry}
              style={{ background: '#1895FD', color: 'white', border: 'none', borderRadius: 5, padding: '10px 24px', cursor: 'pointer', fontSize: '0.95em', fontFamily: 'inherit', fontWeight: 'bold', display: 'block', width: '100%', marginBottom: 10 }}>
                  + Ajouter un autre outil
                </button>
              </>
            }
          </div>
        </div>

        {/* === SECTION 4 : COMMENTAIRES (obligatoire) === */}
        <div className="section-box">
          <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 6 }}>
            Commentaires et réflexion <span style={{ color: '#E41E25' }}>*</span>
          </h2>
          <p style={{ fontSize: '0.88em', color: '#555', margin: '0 0 12px', lineHeight: 1.6 }}>
            Répondez à au moins l'une des questions suivantes :
          </p>
          <ul style={{ margin: '0 0 14px 0', padding: '10px 14px', background: '#f0f8ff', border: '1px solid #b3d9f7', borderRadius: 6, listStyleType: 'disc', paddingLeft: 28 }}>
            {QUESTIONS_REFLEXION.map((q, i) =>
            <li key={i} style={{ fontSize: '0.88em', color: '#1a4a6b', marginBottom: i < QUESTIONS_REFLEXION.length - 1 ? 8 : 0, lineHeight: 1.5 }}>{q}</li>
            )}
          </ul>
          <textarea value={commentaire} onChange={(e) => {setCommentaire(e.target.value);setCommentaireError(false);}} rows={5}
          placeholder="Répondez à au moins une des questions ci-dessus…"
          style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: commentaireError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: commentaireError ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }} />
          {commentaireError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis — répondez à au moins une des questions ci-dessus</span>}
        </div>

        {/* === SUBMIT === */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <button className="btn-primary" style={{ fontSize: '1em', padding: '11px 28px' }} onClick={handleSoumettre}>
            Générer la déclaration
          </button>
          {submitStatus && (submitStatus.ok ?
          <span style={{ background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>✔️ Déclaration générée avec succès.</span> :
          <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Certains champs obligatoires ne sont pas remplis.</span>)
          }
        </div>

        {/* === MODAL CUSTOM ACTION === */}
        <AutreActionModal
          isOpen={!!autreActionModal}
          onClose={() => setAutreActionModal(null)}
          prePhaseId={autreActionModal?.prePhaseId}
          initialValues={autreActionModal?.editId ?
          outilEntries[autreActionModal.entryIdx]?.customActions?.find((a) => a.id === autreActionModal.editId) :
          null}
          onSave={(action) => {
            if (!autreActionModal) return;
            if (autreActionModal.editId) {
              editCustomAction(autreActionModal.entryIdx, autreActionModal.editId, action);
            } else {
              addCustomAction(autreActionModal.entryIdx, action);
            }
          }} />
        

        {/* === APERÇU === */}
        {apercu &&
        <>
            <div ref={apercuRef} style={{ background: 'white', padding: '40px 50px', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 20, fontFamily: 'Arial, sans-serif', fontSize: '16px', lineHeight: 1.5 }}>
              <div dangerouslySetInnerHTML={{ __html: buildApercuHTML(apercu) }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 30, alignItems: 'center', justifyContent: 'center' }}>
              <button type="button" className="btn-primary" style={{ background: '#6c757d' }} onClick={() => {setApercu(null);setSubmitStatus(null);window.scrollTo({ top: 0, behavior: 'smooth' });}}>
                ✏️ Continuer à modifier
              </button>
              <button type="button" className="btn-primary" onClick={() => copyToClipboard(apercu)}>
                📋 Copier pour Word
              </button>
              {copyOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
              <button type="button" className="btn-primary" onClick={() => downloadWord(apercu)}>
                📄 Télécharger en Word (.doc)
              </button>
            </div>
          </>
        }
      </div>
    </div>);

}