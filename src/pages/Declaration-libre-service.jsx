import React, { useState, useRef, useEffect } from 'react';
import PHASES from '@/components/directives/directivesData';
import SIA_LIST_RAW from '@/components/listeSIA';

function AProposButton() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit', fontSize: '1.0em', fontWeight: 'bold', color: '#231F20', textTransform: 'uppercase' }}>
        <span style={{ fontSize: '0.8em', color: '#888', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
        À propos…
      </button>
      {open &&
      <div style={{ textAlign: 'left', paddingTop: 6, fontSize: '0.93em', lineHeight: 1.6 }}>
          Cette application vous est offerte gratuitement par le <a href="https://www.enseigner.ulaval.ca/a-propos" target="_blank" style={{ color: '#1e40af', textDecoration: 'underline' }}>Service de soutien à l'enseignement</a> de l'Université Laval, CC-BY 4.0 2026.<br /><br />
          <em><b>Déclaration d'utilisation de SIA: Aidée de l'IA.</b></em><br />
          Tous les textes présentés ont été validés par l'équipe de développement. Le code a été développé avec l'aide de ChatGPT et Claude, mais plus particulièrement par Base44 pour la version actuelle.
        </div>
      }
    </div>);

}

const SIA_LIST = [...SIA_LIST_RAW].sort((a, b) => a.localeCompare(b, 'fr')).concat(['Autre']);

function defaultOutilEntry() {
  return { outil: '', outilLibre: '', descriptionActions: '' };
}

const QUESTIONS_REFLEXION = [
  "En quoi l'utilisation d'un SIA a-t-elle soutenu ou limité votre réflexion personnelle dans cette évaluation?",
  "Comment avez-vous vérifié, critiqué ou adapté les contenus générés par le SIA? Donnez des exemples concrets.",
  "Qu'avez-vous appris sur l'utilisation de ces SIA pour votre contexte disciplinaire? Qu'est-ce qui vous a surpris?",
  "Quel effet l'utilisation de ces systèmes a-t-elle eu sur vos apprentissages? Quelles compétences ont été développées ou au contraire peu sollicitées?",
  "Décrivez comment vous avez validé les informations fournies par le SIA. Quelles sources avez-vous consultées pour vérifier l'exactitude des contenus générés?",
  "Identifiez au moins deux forces et deux limites du SIA que vous avez observées dans le cadre de ce travail. Appuyez vos observations sur des exemples concrets.",
  "Expliquez quelles modifications vous avez apportées aux résultats générés par le SIA et pourquoi. Précisez la part de contribution humaine dans le produit final remis.",
];


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

  // Déclaration SIA
  const [aucunSIA, setAucunSIA] = useState(true);
  const [outilEntries, setOutilEntries] = useState([defaultOutilEntry()]);
  const [entryErrors, setEntryErrors] = useState([{}]);
  const [showAide, setShowAide] = useState([false]);

  // Commentaires (obligatoire)
  const [commentaire, setCommentaire] = useState('');
  const [commentaireError, setCommentaireError] = useState(false);

  // Aperçu
  const [apercu, setApercu] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [copyOk, setCopyOk] = useState(false);
  const apercuRef = useRef();

  const identOk = !!(session.trim() && studentNom.trim() && cours.trim() && evaluation.trim() && enseignant.trim());

  // Réinitialiser l'aperçu si l'utilisateur modifie quoi que ce soit après génération
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (apercu) { setApercu(null); setSubmitStatus(null); }
  }, [cours, evaluation, enseignant, session, studentNom, studentGroupe, isEquipe, nomEquipe,
      JSON.stringify(equipiers), aucunSIA, JSON.stringify(outilEntries), commentaire]);

  function updateEntry(i, field, value) {
    setOutilEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
    setEntryErrors((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: false } : e));
  }

  function insertActionInEntry(i, libelle) {
    setOutilEntries((prev) => prev.map((e, idx) => {
      if (idx !== i) return e;
      const current = e.descriptionActions.trim();
      const newVal = current ? current + '\n- ' + libelle : '- ' + libelle;
      return { ...e, descriptionActions: newVal };
    }));
    setEntryErrors((prev) => prev.map((e, idx) => idx === i ? { ...e, descriptionActions: false } : e));
  }

  function removeEntry(i) {
    setOutilEntries((prev) => prev.filter((_, idx) => idx !== i));
    setEntryErrors((prev) => prev.filter((_, idx) => idx !== i));
    setShowAide((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addEntry() {
    setOutilEntries((prev) => [...prev, defaultOutilEntry()]);
    setEntryErrors((prev) => [...prev, {}]);
    setShowAide((prev) => [...prev, false]);
  }

  function getOutilLabel(entry) {
    return entry.outil === 'Autre' && entry.outilLibre.trim() ? entry.outilLibre.trim() : entry.outil;
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
    if (!aucunSIA) {
      const newEntryErrors = outilEntries.map((e) => {
        const err = {};
        if (!e.outil) err.outil = true;
        if (e.outil === 'Autre' && !e.outilLibre.trim()) err.outilLibre = true;
        if (!e.descriptionActions.trim()) err.descriptionActions = true;
        return err;
      });
      setEntryErrors(newEntryErrors);
      if (newEntryErrors.some((e) => Object.keys(e).length > 0)) hasErrors = true;
    }

    setCommentaireError(false);

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
      const gr = ap.studentGroupe ? ` (groupe ${ap.studentGroupe})` : '';
      intro = `Nous, <strong>${noms}</strong>${eq}${gr}, soumettons cette déclaration dans le cadre de l'évaluation <strong>${evalLabel}</strong> du cours <strong>${coursLabel}</strong> de la session <strong>${sessionLabel}</strong>.<br><br>Conformément aux exigences de <strong>${enseignantLabel}</strong>, les renseignements suivants présentent notre démarche.`;
    } else {
      const gr = ap.studentGroupe ? ` (groupe ${ap.studentGroupe})` : '';
      intro = `Je, <strong>${ap.studentNom}</strong>${gr}, soumets cette déclaration dans le cadre de l'évaluation <strong>${evalLabel}</strong> du cours <strong>${coursLabel}</strong> de la session <strong>${sessionLabel}</strong>.<br><br>Conformément aux exigences de <strong>${enseignantLabel}</strong>, les renseignements suivants présentent ma démarche.`;
    }

    let declHtml;
    if (ap.aucunSIA) {
      declHtml = `<p style="font-style:italic;color:#555;">Aucun système d'intelligence artificielle n'a été utilisé pour cette évaluation.</p>`;
    } else {
      declHtml = `<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:10pt;">
<thead><tr>
  <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;">Outil</th>
  <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;">Actions déclarées</th>
</tr></thead><tbody>`;
      ap.outilEntries.forEach((entry) => {
        if (!entry.descriptionActions.trim()) return;
        const actionsHtml = entry.descriptionActions.trim().replace(/\n/g, '<br>');
        declHtml += `<tr>
  <td style="border:1px solid #ccc;padding:6px;vertical-align:top;white-space:nowrap;"><strong>${getOutilLabel(entry)}</strong></td>
  <td style="border:1px solid #ccc;padding:6px;vertical-align:top;">${actionsHtml}</td>
</tr>`;
      });
      declHtml += `</tbody></table>`;
    }

    return `<h1 style="font-family:Georgia,serif;font-size:22px;font-weight:bold;text-align:center;border-bottom:1px solid black;padding-bottom:8pt;margin-bottom:8pt;">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)</h1>
<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;margin-bottom:8pt;">${intro}</p>
<h2 style="font-family:Georgia,serif;font-size:16pt;margin:12pt 0 6pt;">${ap.isEquipe ? 'Notre' : 'Ma'} déclaration d'utilisation</h2>
<div style="font-family:Arial,sans-serif;font-size:11pt;">${declHtml}</div>
${ap.commentaire?.trim() ? `<h2 style="font-family:Georgia,serif;font-size:16pt;margin:12pt 0 6pt;">Commentaires et réflexion</h2><p style="font-family:Arial,sans-serif;font-size:11pt;white-space:pre-wrap;">${ap.commentaire}</p>` : ''}
${ap.isEquipe
  ? `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:12pt 0 4pt 0;color:#000;">Par la soumission de cette déclaration, nous confirmons que :</h2>
<ul style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;margin:0 0 0 20px;list-style-type:disc;padding-left:0;">
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Nous avons utilisé les SIA de manière conforme et nous avons décrit leur utilisation de manière fidèle.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Notre utilisation des SIA est conforme aux règles établies par la personne enseignante pour ce travail.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Nous avons fait un usage responsable des SIA et nous avons respecté le <a href="https://www.bda.ulaval.ca/intelligence-artificielle/" target="_blank" style="color:#0056b3;text-decoration:underline;">droit d'auteur</a> lors des requêtes et du référencement.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Nous avons exercé notre jugement critique et validé l'exactitude des contenus générés par les SIA.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Le travail soumis reflète notre propre pensée collective, même lorsqu'un SIA a été utilisé comme outil de soutien.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Nous comprenons qu'une fausse déclaration constitue une atteinte grave à l'éthique et risque de compromettre la crédibilité du travail réalisé.</li>
<li style="display:list-item;list-style-type:disc;">Nous comprenons qu'un usage non autorisé, l'utilisation de données fausses ou inventées ou le copier-coller de réponses générées par une SIA sans l'identifier constituent des infractions au <a href="https://www.ulaval.ca/sites/default/files/notre-universite/direction-gouv/Documents_officiels/Reglements/Reglement_disciplinaire_intention_etudiants.pdf" target="_blank" style="color:#0056b3;text-decoration:underline;">Règlement disciplinaire</a> de l'Université Laval.</li>
</ul>`
  : `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:12pt 0 4pt 0;color:#000;">Par la soumission de cette déclaration, je confirme que :</h2>
<ul style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;margin:0 0 0 20px;list-style-type:disc;padding-left:0;">
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">J'ai utilisé les SIA de manière conforme et j'ai décrit leur utilisation de manière fidèle.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Mon utilisation des SIA est conforme aux règles établies par la personne enseignante pour ce travail.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">J'ai fait un usage responsable des SIA et j'ai respecté le <a href="https://www.bda.ulaval.ca/intelligence-artificielle/" target="_blank" style="color:#0056b3;text-decoration:underline;">droit d'auteur</a> lors des requêtes et du référencement.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">J'ai exercé mon jugement critique et validé l'exactitude des contenus générés par les SIA.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Le travail soumis reflète ma propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.</li>
<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">Je comprends qu'une fausse déclaration constitue une atteinte grave à l'éthique et risque de compromettre la crédibilité du travail réalisé.</li>
<li style="display:list-item;list-style-type:disc;">Je comprends qu'un usage non autorisé, l'utilisation de données fausses ou inventées ou le copier-coller de réponses générées par une SIA sans l'identifier constituent des infractions au <a href="https://www.ulaval.ca/sites/default/files/notre-universite/direction-gouv/Documents_officiels/Reglements/Reglement_disciplinaire_intention_etudiants.pdf" target="_blank" style="color:#0056b3;text-decoration:underline;">Règlement disciplinaire</a> de l'Université Laval.</li>
</ul>`
}
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
          Déclaration libre-service d'utilisation des SIA lors d'une évaluation
        </h1>

        {/* Instructions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 6, color: '#231F20', textTransform: 'uppercase' }}>Pourquoi remplir cette déclaration?</h2>
            <p style={{ fontSize: '0.93em', color: '#333', lineHeight: 1.6, marginBottom: 14 }}>
              Déclarer votre utilisation des systèmes d'intelligence artificielle (SIA), c'est présenter votre démarche d'utilisation des SIA et illustrer votre éthique de travail par le respect des autorisations indiquées pour cette évaluation par la personne enseignante du cours. Cette déclaration vise ainsi à vous soutenir dans la mise en valeur de votre intégrité intellectuelle.
            </p>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8, color: '#231F20', textTransform: 'uppercase' }}>Comment ça fonctionne?</h2>
            <ol style={{ listStyleType: 'decimal', paddingLeft: 20, marginTop: 8, marginBottom: 8 }}>
              <li>Remplissez la section d'identification.</li>
              <li className=" hidden">Si votre personne enseignante vous a fourni des directives, indiquez-les dans la section correspondante.</li>
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

        {/* === SECTION 2 : DÉCLARATION === */}
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
                  Pour chaque SIA utilisé, indiquez l'outil et décrivez librement les actions réalisées. Utilisez l'aide à la rédaction pour vous inspirer des actions disponibles.
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

                        {/* Actions réalisées (texte libre + aide) */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
                              Actions réalisées <span style={{ color: '#E41E25' }}>*</span>
                            </label>
                            <button type="button"
                              onClick={() => setShowAide((prev) => prev.map((v, idx) => idx === i ? !v : v))}
                              style={{ background: showAide[i] ? '#e8f4ff' : 'none', border: '1px solid #1895FD', color: '#1895FD', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82em' }}>
                              💡 {showAide[i] ? 'Masquer l\'aide' : 'Aide à la rédaction'}
                            </button>
                          </div>
                          {entryErrors[i]?.descriptionActions && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginBottom: 6 }}>⚠ Décrivez au moins une action</span>}
                          <textarea
                            value={entry.descriptionActions}
                            onChange={(e) => updateEntry(i, 'descriptionActions', e.target.value)}
                            rows={4}
                            placeholder="Décrivez librement les actions réalisées avec cet outil…"
                            style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.9em', border: entryErrors[i]?.descriptionActions ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: entryErrors[i]?.descriptionActions ? '#fff4f4' : 'white', boxSizing: 'border-box', resize: 'vertical' }}
                          />
                          {showAide[i] && (
                            <div style={{ marginTop: 8, border: '1px solid #b3d9f7', borderRadius: 6, overflow: 'hidden' }}>
                              <div style={{ background: '#e8f4ff', padding: '6px 12px', fontSize: '0.8em', color: '#1a4a6b', fontStyle: 'italic' }}>
                                Cliquez sur une action pour l'insérer dans le champ de texte ci-dessus.
                              </div>
                              {PHASES.map((phase, gi) => (
                                <div key={phase.id} style={{ borderTop: gi > 0 ? '1px solid #dde' : 'none' }}>
                                  <div style={{ background: '#f5f5f5', padding: '4px 10px', fontSize: '0.77em', fontWeight: 'bold', color: phase.color }}>
                                    {phase.libelle}
                                  </div>
                                  <div style={{ padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {phase.actions.map((action) => (
                                      <button key={action.id} type="button"
                                        onClick={() => insertActionInEntry(i, action.libelle)}
                                        style={{ background: 'white', border: `1px solid ${phase.color}`, color: '#333', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82em', textAlign: 'left' }}>
                                        {action.libelle}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
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

        {/* === SECTION 4 : COMMENTAIRES (facultatif) === */}
        <div style={{ position: 'relative' }}>
          {!identOk && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs obligatoires" />}
        <div className="section-box" style={{ opacity: identOk ? 1 : 0.5, pointerEvents: identOk ? 'auto' : 'none' }}>
          <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 6 }}>
            Commentaires et réflexion <span style={{ fontWeight: 'normal', color: '#888', fontSize: '0.88em' }}>(facultatif)</span>
          </h2>
          <p style={{ fontSize: '0.88em', color: '#555', margin: '0 0 12px', lineHeight: 1.6 }}>
            Si applicable, assurez-vous de répondre aux exigences partagées par la personne enseignante dans ce champ pour cette évaluation. Alternativement, nous vous suggérons de répondre à l'une ou plusieurs des questions suivantes pour enrichir votre déclaration :
          </p>
          <ul style={{ margin: '0 0 14px 0', padding: '10px 14px 10px 28px', background: '#f0f8ff', border: '1px solid #b3d9f7', borderRadius: 6, listStyleType: 'disc' }}>
            {QUESTIONS_REFLEXION.map((q, i) =>
            <li key={i} style={{ fontSize: '0.88em', color: '#1a4a6b', marginBottom: i < QUESTIONS_REFLEXION.length - 1 ? 8 : 0, lineHeight: 1.5 }}>{q}</li>
            )}
          </ul>
          <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={5}
          placeholder="Vos commentaires ou réponses aux questions ci-dessus (facultatif)…"
          style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #ccc', borderRadius: 4, background: 'white', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>
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