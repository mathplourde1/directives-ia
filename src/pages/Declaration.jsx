import React, { useState, useRef, useEffect } from 'react';
import ETAPES from '@/components/etapesData';

const ETAPE_IDS = ETAPES.map((e) => e.id);

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

    // Build order array from <ordre> element (list of ids)
    const ordreNode = root.querySelector('ordre');
    const ordreIds = ordreNode ? ordreNode.textContent.split(',').map((s) => s.trim()).filter(Boolean) : null;

    // Parse etape nodes into a map keyed by id
    const etapeNodes = doc.querySelectorAll('etape');
    const etapeMap = {};
    etapeNodes.forEach((node) => {
      const id = node.getAttribute('id');
      if (id) etapeMap[id] = node;
    });

    // Determine the ordered list of ids to process
    const orderedIds = ordreIds || Object.keys(etapeMap);

    const etapes = [];
    orderedIds.forEach((id) => {
      const node = etapeMap[id];
      if (!node) return;

      const checked = node.querySelector('checked')?.textContent === 'true';
      if (!checked) return;

      const get = (tag) => node.querySelector(tag)?.textContent ?? '';

      // Determine etape info by id
      let etapeInfo;
      const found = ETAPES.find((e) => e.id === id);
      if (found && id !== 'autres') {
        etapeInfo = { ...found };
      } else {
        const libelleCustom = get('libelle_custom');
        const exemples = get('exemples');
        etapeInfo = {
          id: 'autres',
          libelle: libelleCustom || (found ? found.libelle : id),
          parenthese: exemples || (found ? found.parenthese : '')
        };
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
        decl_logique_text: get('decl_logique_text')
      });
    });

    return { ok: true, identification, etapes };
  } catch {
    return { error: 'structure', raw: xmlText };
  }
}

function defaultStudentState() {
  return {
    // aucune exigence checkbox
    aucune_conforme: false,
    // iagraphie
    iagraphie_conforme: false,
    // traces
    traces_reponse: '',
    traces_conforme: false,
    // logique
    logique_reponse: '',
    logique_conforme: false
  };
}

export default function Declaration() {
  const [data, setData] = useState(null); // null | { error, raw } | { ok, identification, etapes }
  const [studentStates, setStudentStates] = useState([]);
  const [studentNom, setStudentNom] = useState('');
  const [studentGroupe, setStudentGroupe] = useState('');
  const [nomError, setNomError] = useState(false);
  const [isEquipe, setIsEquipe] = useState(false);
  const [nomEquipe, setNomEquipe] = useState('');
  const [equipiers, setEquipiers] = useState(['']);
  const [apercu, setApercu] = useState(null); // null | snapshot
  const [commentaires, setCommentaires] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null); // null | {ok:true,time} | {ok:false}
  const [fieldErrors, setFieldErrors] = useState([]); // per-etape: {traces_reponse, logique_reponse}
  const [uncheckedExplanations, setUncheckedExplanations] = useState({}); // field key → string
  const [uncheckedExpErrors, setUncheckedExpErrors] = useState({}); // field key → bool
  const [equipiersErrors, setEquipiersErrors] = useState([]); // per-equipier: bool
  const [sessionOverride, setSessionOverride] = useState(''); // student-entered or modified session
  const [sessionEditMode, setSessionEditMode] = useState(false); // true when editing XML session
  const [sessionError, setSessionError] = useState(false);
  const [hasFichiersJoints, setHasFichiersJoints] = useState(false);
  const [fichiersJointsConfirme, setFichiersJointsConfirme] = useState(false);
  const [fichiersJointsError, setFichiersJointsError] = useState(false);
  const [, forceUpdate] = useState(0);
  const [copyOk, setCopyOk] = useState(false);
  const fileInputRef = useRef();
  const apercuRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseXML(ev.target.result);
      setData(result);
      if (result.ok) {
        setStudentStates(result.etapes.map(() => defaultStudentState()));
        setSessionOverride('');
        setSessionEditMode(false);
        setSessionError(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function updateStudent(i, field, value) {
    setStudentStates((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  // Tick every minute to keep elapsed time fresh
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  function buildUncheckedItems(states) {
    const items = [];
    data.etapes.forEach((etape, i) => {
      const s = states[i] || defaultStudentState();
      const isAucune = etape.declaration === 'aucune';
      const label = etape.etapeInfo.libelle;
      if (isAucune && !s.aucune_conforme) {
        items.push({ etape: label, exigence: 'Aucune exigence', field: `aucune_${i}` });
      } else {
        if (etape.decl_iagraphie && !s.iagraphie_conforme) items.push({ etape: label, exigence: 'Références et IAgraphie', field: `iag_${i}` });
        if (etape.decl_traces && !s.traces_conforme) items.push({ etape: label, exigence: 'Conserver les traces suivantes', field: `traces_${i}` });
        if (etape.decl_logique && !s.logique_conforme) items.push({ etape: label, exigence: 'Expliquer la logique d\'utilisation', field: `logique_${i}` });
      }
    });
    return items;
  }

  function doGenerate(effectiveSession) {
    const unchecked = buildUncheckedItems(studentStates);
    // Store each explanation as { question, reponse } for structured display
    const explanations = unchecked.
    map((u) => ({
      question: `${u.etape} — ${u.exigence} : Expliquez pourquoi cette confirmation n'a pas été cochée`,
      reponse: uncheckedExplanations[u.field]?.trim() || ''
    })).
    filter((e) => e.reponse);

    const now = new Date();
    const tzCodes = {
      'America/St_Johns': 'HNT', 'America/Halifax': 'HNA', 'America/Glace_Bay': 'HNA',
      'America/Moncton': 'HNA', 'America/Goose_Bay': 'HNA',
      'America/Toronto': 'HNE', 'America/Montreal': 'HNE', 'America/Ottawa': 'HNE',
      'America/Thunder_Bay': 'HNE', 'America/Nipigon': 'HNE', 'America/Iqaluit': 'HNE',
      'America/Winnipeg': 'HNC', 'America/Regina': 'HNC', 'America/Swift_Current': 'HNC',
      'America/Rankin_Inlet': 'HNC', 'America/Resolute': 'HNC',
      'America/Edmonton': 'HNR', 'America/Calgary': 'HNR', 'America/Yellowknife': 'HNR',
      'America/Vancouver': 'HNP', 'America/Whitehorse': 'HNP', 'America/Dawson': 'HNP',
      'America/Dawson_Creek': 'HNR', 'America/Fort_Nelson': 'HNR', 'America/Creston': 'HNR',
      'America/New_York': 'HNE', 'America/Chicago': 'HNC', 'America/Denver': 'HNR',
      'America/Los_Angeles': 'HNP', 'America/Phoenix': 'HNR', 'America/Anchorage': 'HNAL',
      'America/Honolulu': 'HAH', 'America/Puerto_Rico': 'HNA',
      'Europe/Paris': 'HEC', 'Europe/London': 'GMT', 'Europe/Brussels': 'HEC',
      'Europe/Berlin': 'HEC', 'Europe/Zurich': 'HEC', 'Europe/Madrid': 'HEC',
      'Europe/Rome': 'HEC', 'Europe/Amsterdam': 'HEC', 'Europe/Lisbon': 'GMT',
      'Asia/Tokyo': 'JST', 'Asia/Shanghai': 'CST', 'Asia/Kolkata': 'IST',
      'Asia/Dubai': 'GST', 'Australia/Sydney': 'AEST', 'Pacific/Auckland': 'NZST'
    };
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Also try offset-based fallback for common cases
    const offsetMin = -now.getTimezoneOffset();
    const offsetFallbacks = {
      '-210': 'HNT', '-180': 'HNA', '-120': 'HAA',
      '-300': 'HNE', '-360': 'HNC', '-420': 'HNR', '-480': 'HNP',
      '-540': 'HNAL', '-600': 'HAH', '0': 'UTC', '60': 'HEC', '120': 'HEET'
    };
    const tzCode = tzCodes[userTz] || offsetFallbacks[String(offsetMin)] || 'UTC';
    const timestamp = now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' à ' + now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') +
    ' ' + tzCode;
    setApercu({
      identification: { ...data.identification, session: effectiveSession },
      studentNom, studentGroupe, isEquipe, nomEquipe,
      equipiers: isEquipe ? [studentNom, ...equipiers] : [studentNom],
      etapes: data.etapes,
      states: studentStates,
      commentaires: commentaires.trim(),
      explanations,
      hasFichiersJoints,
      fichiersJointsConfirme,
      timestamp
    });
    setSubmitStatus({ ok: true, time: new Date() });
    setTimeout(() => apercuRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function handleSoumettre() {
    let hasErrors = false;

    // Validate session
    const effectiveSession = data.identification.session && !sessionEditMode ?
    data.identification.session :
    sessionOverride.trim();
    if (!effectiveSession) { setSessionError(true); hasErrors = true; } else { setSessionError(false); }

    // Validate nom
    if (!studentNom.trim()) { setNomError(true); hasErrors = true; } else { setNomError(false); }

    // Validate all teammate names if team mode is on
    if (isEquipe) {
      const errs = equipiers.map((n) => !n.trim());
      setEquipiersErrors(errs);
      if (errs.some(Boolean)) hasErrors = true;
    }

    // Validate text fields (traces & logique must have text)
    const newFieldErrors = data.etapes.map((etape, i) => {
      const s = studentStates[i] || defaultStudentState();
      return {
        traces_reponse: etape.decl_traces && !s.traces_reponse.trim(),
        logique_reponse: etape.decl_logique && !s.logique_reponse.trim()
      };
    });
    const hasFieldErrors = newFieldErrors.some((e) => e.traces_reponse || e.logique_reponse);
    setFieldErrors(newFieldErrors);
    if (hasFieldErrors) hasErrors = true;

    // Validate fichiers joints confirmation
    if (hasFichiersJoints && !fichiersJointsConfirme) { setFichiersJointsError(true); hasErrors = true; } else { setFichiersJointsError(false); }

    // Validate explanations for unchecked items
    const unchecked = buildUncheckedItems(studentStates);
    const newExpErrors = {};
    unchecked.forEach((u) => {
      if (!uncheckedExplanations[u.field]?.trim()) newExpErrors[u.field] = true;
    });
    setUncheckedExpErrors(newExpErrors);
    if (Object.keys(newExpErrors).length > 0) hasErrors = true;

    if (hasErrors) { setSubmitStatus({ ok: false }); return; }

    doGenerate(effectiveSession);
  }

  function buildApercuHTML(ap) {
    const s = (i) => ap.states[i] || defaultStudentState();

    // --- Document title ---
    let titleHtml = `<h1 style="font-family:Georgia,serif;font-size:24px;font-weight:bold;text-align:center;margin:0 0 8pt 0;padding-bottom:8pt;border-bottom:1px solid black;color:#000;">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)</h1>`;

    // --- Paragraph d'introduction ---
    const cours = ap.identification.cours || '[cours]';
    const evaluation = ap.identification.evaluation || '[évaluation]';
    const session = ap.identification.session || '[session]';
    const enseignants = ap.identification.enseignants || '[personne enseignante]';

    let introHtml = '';
    if (ap.isEquipe) {
      const noms = ap.equipiers.filter((n) => n.trim());
      const nomsList = noms.join(', ');
      const equipeInfo = ap.nomEquipe ? ` (équipe ${ap.nomEquipe})` : '';
      const groupeInfo = ap.studentGroupe ? `, groupe ${ap.studentGroupe}` : '';
      introHtml = `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.2;margin:0 0 11pt 0;">
        Nous, <strong>${nomsList}</strong>${equipeInfo}${groupeInfo}, soumettons cette déclaration dans le cadre de l'évaluation nommée <strong>${evaluation}</strong> du cours <strong>${cours}</strong> de la session <strong>${session}</strong>, enseigné par <strong>${enseignants}</strong>.
      </p>`;
    } else {
      const groupeInfo = ap.studentGroupe ? ` (groupe ${ap.studentGroupe})` : '';
      introHtml = `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.2;margin:0 0 11pt 0;">
        Je, <strong>${ap.studentNom}</strong>${groupeInfo}, soumets cette déclaration dans le cadre de l'évaluation nommée <strong>${evaluation}</strong> du cours <strong>${cours}</strong> de la session <strong>${session}</strong>, enseigné par <strong>${enseignants}</strong>.
      </p>`;
    }
    introHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.2;margin:0 0 11pt 0;">Conformément aux exigences de ${ap.isEquipe ? 'notre' : 'ma'} personne enseignante, les renseignements suivants présentent ${ap.isEquipe ? 'notre' : 'ma'} démarche.</p>`;

    // --- Tableau synthèse ---
    let tableHtml = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:7px;background:#f2f2f2;width:15%">Étape</th>
        <th style="border:1px solid #ccc;padding:7px;background:#f2f2f2;width:13%">Utilisation SIA</th>
        <th style="border:1px solid #ccc;padding:7px;background:#f2f2f2;width:24%">Directives de la personne enseignante</th>
        <th style="border:1px solid #ccc;padding:7px;background:#e8f4fd;width:24%">Exigences de déclaration</th>
        <th style="border:1px solid #ccc;padding:7px;background:#edfbf0;width:24%">Déclaration</th>
      </tr></thead><tbody>`;

    ap.etapes.forEach((etape, i) => {
      const st = s(i);
      const isAucune = etape.declaration === 'aucune';
      const etapeLabel = etape.etapeInfo.parenthese ?
      `<strong>${etape.etapeInfo.libelle}</strong><br><span style="color:#555;font-size:0.88em">(${etape.etapeInfo.parenthese})</span>` :
      `<strong>${etape.etapeInfo.libelle}</strong>`;

      let exigencesHtml = '';
      if (isAucune) {exigencesHtml = '<em>Aucune exigence</em>';} else
      {
        if (etape.decl_iagraphie) exigencesHtml += `<div><strong>IAgraphie :</strong> ${etape.decl_iagraphie_text}</div>`;
        if (etape.decl_traces) exigencesHtml += `<div><strong>Traces :</strong> ${etape.decl_traces_text}</div>`;
        if (etape.decl_logique) exigencesHtml += `<div><strong>Logique :</strong> ${etape.decl_logique_text}</div>`;
      }

      let reponsesHtml = '';
      if (isAucune) {
        reponsesHtml = st.aucune_conforme ? '✔ Pris connaissance' : '✘ Non confirmé';
      } else {
        if (etape.decl_iagraphie) reponsesHtml += `<div><strong>IAgraphie :</strong> ${st.iagraphie_conforme ? '✔ Confirmé' : '✘ Non confirmé'}</div>`;
        if (etape.decl_traces) reponsesHtml += `<div><strong>Traces :</strong> ${st.traces_reponse || '(aucune réponse)'} ${st.traces_conforme ? '✔' : '✘'}</div>`;
        if (etape.decl_logique) reponsesHtml += `<div><strong>Logique :</strong> ${st.logique_reponse || '(aucune réponse)'} ${st.logique_conforme ? '✔' : '✘'}</div>`;
      }

      tableHtml += `<tr>
        <td style="border:1px solid #ccc;padding:7px;vertical-align:top">${etapeLabel}</td>
        <td style="border:1px solid #ccc;padding:7px;vertical-align:top">${etape.ia}</td>
        <td style="border:1px solid #ccc;padding:7px;vertical-align:top">${etape.justification}</td>
        <td style="border:1px solid #ccc;padding:7px;vertical-align:top;background:#f0f7ff">${exigencesHtml}</td>
        <td style="border:1px solid #ccc;padding:7px;vertical-align:top;background:#f2fbf4">${reponsesHtml}</td>
      </tr>`;
    });
    tableHtml += '</tbody></table>';

    // --- Commentaires ---
    let commentairesHtml = '';
    if (ap.commentaires || ap.explanations && ap.explanations.length > 0) {
      commentairesHtml = `<h2 style="font-family:Georgia,serif;font-size:18pt;font-weight:bold;margin:8pt 0;color:#000;">Commentaires, exceptions et précisions</h2>`;
      if (ap.commentaires) commentairesHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.2;margin:0 0 11pt 0;white-space:pre-wrap">${ap.commentaires}</p>`;
      if (ap.explanations) ap.explanations.forEach((e) => {
        commentairesHtml += `<p style="font-family:Arial,sans-serif;font-size:10pt;margin:0 0 4pt 0;color:#333"><strong>${e.question}</strong></p>`;
        commentairesHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.2;margin:0 0 11pt 0">${e.reponse}</p>`;
      });
    }

    // --- Fichiers joints ---
    let fichiersHtml = '';
    if (ap.hasFichiersJoints) {
      const fjText = ap.fichiersJointsConfirme ?
      '✔ Engagement confirmé — les fichiers requis seront transmis à la personne enseignante.' :
      '✘ Engagement non confirmé';
      fichiersHtml = `<h2 style="font-family:Georgia,serif;font-size:18pt;font-weight:bold;margin:8pt 0;color:#000;">Fichiers joints</h2>`;
      fichiersHtml += `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.2;margin:0">${fjText}</p>`;
    }

    // --- Affirmations finales ---
    const affirmationsHtml = `<h2 style="font-family:Georgia,serif;font-size:18pt;font-weight:bold;margin:8pt 0;color:#000;">La soumission de cette déclaration confirme que :</h2>`;
    const affirmationsList = [
      `Les informations fournies sont complètes et fidèles à ${ap.isEquipe ? 'notre' : 'mon'} utilisation réelle.`,
      `${ap.isEquipe ? 'Notre' : 'Mon'} utilisation de l'IAg est conforme aux règles établies par la personne enseignante pour ce travail.`,
      `${ap.isEquipe ? 'Nous avons' : 'J\'ai'} exercé ${ap.isEquipe ? 'notre' : 'mon'} jugement critique sur les contenus générés par les SIA, si autorisés.`,
      `Le travail soumis reflète ${ap.isEquipe ? 'notre' : 'ma'} propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.`,
      `${ap.isEquipe ? 'Nous comprenons' : 'Je comprends'} que l'omission ou une fausse déclaration constitue une infraction au Règlement disciplinaire.`
    ];
    const affirmationsHtml2 = `<ul style="margin:0 0 0 20px;padding-left:0;font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;">
      ${affirmationsList.map((a) => `<li style="margin-bottom:4pt">${a}</li>`).join('')}
    </ul>`;

    const timestampHtml = `<p style="font-family:Arial,sans-serif;font-size:10pt;color:#666;font-style:italic;margin:16pt 0 0 0;">Générée le ${ap.timestamp}</p>`;

    return titleHtml + introHtml + tableHtml + commentairesHtml + fichiersHtml + affirmationsHtml + affirmationsHtml2 + timestampHtml;
  }

  function copyDeclToClipboard(ap) {
    const content = buildApercuHTML(ap);
    const htmlText = content;
    const plainText = htmlText.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '');
    
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = new Blob([htmlText], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': blobText })])
        .then(() => {
          setCopyOk(true);
          setTimeout(() => setCopyOk(false), 1800);
        })
        .catch(() => {
          navigator.clipboard.writeText(htmlText)
            .then(() => {
              setCopyOk(true);
              setTimeout(() => setCopyOk(false), 1800);
            });
        });
    } else {
      navigator.clipboard.writeText(htmlText)
        .then(() => {
          setCopyOk(true);
          setTimeout(() => setCopyOk(false), 1800);
        });
    }
  }

  function downloadDeclWord(ap) {
    const content = buildApercuHTML(ap);
    const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>Déclaration SIA</title>
      <style>body{font-family:Arial,sans-serif;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:7px;}</style>
      </head><body>${content}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href = url;a.download = 'declaration-sia.doc';a.click();
    URL.revokeObjectURL(url);
  }

  function downloadDeclPDF(ap) {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 36;
      let y = margin;

      doc.setFontSize(13);
      doc.setTextColor('#E41E25');
      doc.text('Déclaration d\'utilisation des SIA', margin, y);
      y += 18;

      doc.setFontSize(9);
      doc.setTextColor('#000000');
      const identLines = [];
      if (ap.identification.cours) identLines.push(`Cours : ${ap.identification.cours}`);
      if (ap.identification.evaluation) identLines.push(`Évaluation : ${ap.identification.evaluation}`);
      if (ap.identification.session) identLines.push(`Session : ${ap.identification.session}`);
      if (ap.identification.enseignants) identLines.push(`Personne(s) enseignante(s) : ${ap.identification.enseignants}`);
      if (ap.isEquipe) {
        if (ap.nomEquipe) identLines.push(`Équipe : ${ap.nomEquipe}`);
        ap.equipiers.forEach((n, i) => {if (n.trim()) identLines.push(`Personne équipière ${i + 1} : ${n}`);});
      } else {
        identLines.push(`Nom : ${ap.studentNom}`);
      }
      if (ap.studentGroupe) identLines.push(`Groupe : ${ap.studentGroupe}`);
      doc.text(identLines.join('   |   '), margin, y, { maxWidth: pageW - margin * 2 });
      y += 22;

      // Table headers
      const colW = (pageW - margin * 2) / 5;
      const headers = ['Étape', 'Utilisation SIA', 'Directives enseignant', 'Exigences de déclaration', 'Votre déclaration'];
      doc.setFillColor(242, 242, 242);
      doc.rect(margin, y, pageW - margin * 2, 16, 'F');
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      headers.forEach((h, i) => doc.text(h, margin + colW * i + 4, y + 11));
      doc.setFont(undefined, 'normal');
      y += 16;

      ap.etapes.forEach((etape, idx) => {
        const s = ap.states[idx] || defaultStudentState();
        const isAucune = etape.declaration === 'aucune';
        const stripHtml = (h) => h ? h.replace(/<[^>]+>/g, '') : '';

        let exigences = '';
        if (isAucune) {exigences = 'Aucune exigence';} else
        {
          const parts = [];
          if (etape.decl_iagraphie) parts.push(`IAgraphie: ${stripHtml(etape.decl_iagraphie_text)}`);
          if (etape.decl_traces) parts.push(`Traces: ${stripHtml(etape.decl_traces_text)}`);
          if (etape.decl_logique) parts.push(`Logique: ${stripHtml(etape.decl_logique_text)}`);
          exigences = parts.join('\n');
        }

        let reponses = '';
        if (isAucune) {reponses = s.aucune_conforme ? '✔ Pris connaissance' : '✘ Non confirmé';} else
        {
          const parts = [];
          if (etape.decl_iagraphie) parts.push(`IAgraphie: ${s.iagraphie_conforme ? '✔' : '✘'}`);
          if (etape.decl_traces) parts.push(`Traces: ${s.traces_reponse || '-'} ${s.traces_conforme ? '✔' : '✘'}`);
          if (etape.decl_logique) parts.push(`Logique: ${s.logique_reponse || '-'} ${s.logique_conforme ? '✔' : '✘'}`);
          reponses = parts.join('\n');
        }

        const cells = [
        etape.etapeInfo.libelle,
        etape.ia,
        stripHtml(etape.justification),
        exigences,
        reponses];

        const lineH = 11;
        const cellLines = cells.map((c) => doc.splitTextToSize(c || '', colW - 8));
        const rowH = Math.max(...cellLines.map((l) => l.length)) * lineH + 10;

        if (y + rowH > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, y, pageW - margin * 2, rowH);
        cellLines.forEach((lines, ci) => {
          doc.rect(margin + colW * ci, y, colW, rowH);
          doc.setFontSize(8);
          doc.text(lines, margin + colW * ci + 4, y + 9);
        });
        y += rowH;
      });

      // Commentaires
      if (ap.commentaires || ap.explanations && ap.explanations.length > 0) {
        y += 12;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Commentaires, exceptions et précisions :', margin, y);
        doc.setFont(undefined, 'normal');
        y += 12;
        if (ap.commentaires) {
          const lines = doc.splitTextToSize(ap.commentaires, pageW - margin * 2);
          doc.text(lines, margin, y);
          y += lines.length * 11 + 6;
        }
        if (ap.explanations) ap.explanations.forEach((e) => {
          doc.setFont(undefined, 'italic');
          const qLines = doc.splitTextToSize(e.question, pageW - margin * 2);
          doc.text(qLines, margin, y);
          y += qLines.length * 10 + 2;
          doc.setFont(undefined, 'bold');
          const rLines = doc.splitTextToSize(e.reponse, pageW - margin * 2);
          doc.text(rLines, margin, y);
          doc.setFont(undefined, 'normal');
          y += rLines.length * 11 + 6;
        });
      }

      if (ap.hasFichiersJoints) {
        y += 12;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        const fjText = ap.fichiersJointsConfirme ?
        'Fichiers joints : Engagement confirmé — les fichiers requis seront transmis à la personne enseignante.' :
        'Fichiers joints : Engagement non confirmé';
        const fjLines = doc.splitTextToSize(fjText, pageW - margin * 2);
        doc.text(fjLines, margin, y);
        y += fjLines.length * 11 + 6;
      }

      y += 14;
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Générée le ${ap.timestamp}`, margin, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);

      doc.save('declaration-sia.pdf');
    });
  }

  const errorStyle = { color: '#E41E25', fontSize: '0.82em', marginTop: 4 };

  return (
    <div style={{ background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <style>{`
        :root { --rouge: #E41E25; --bleu-ul: #00A4E4; }
        h1 { color: #E41E25; text-align: center; }
        table.decl-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table.decl-table th, table.decl-table td { border: 1px solid #ccc; padding: 10px; text-align: left; vertical-align: top; }
        table.decl-table th { background-color: #F2F2F2; }
        .btn-primary { background-color: #00A4E4; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
        .btn-primary:hover { background-color: #0084b0; }
        .locked-field { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 8px; font-size: 0.9em; line-height: 1.5; color: #333; }
        .locked-field a { color: #0056b3; text-decoration: underline; }
        .student-input { width: 95%; padding: 6px 8px; border: 1px solid #aaa; border-radius: 4px; font-family: inherit; font-size: 0.9em; margin-top: 6px; }
        .conforme-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 0.88em; }
        .section-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .raw-box { background: #fff8e1; border: 1px solid #f0c040; border-radius: 6px; padding: 14px; margin-top: 12px; font-size: 0.82em; white-space: pre-wrap; overflow-x: auto; font-family: monospace; max-height: 300px; overflow-y: auto; }
      `}</style>

      <h1 className="mb-4 text-2xl font-semibold">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA) dans le cadre d'une évaluation</h1>

      {/* Upload zone */}
      {!data?.ok &&
      <div className="section-box" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16, fontSize: '1em' }}>
            Importez le fichier de sauvegarde fourni par votre personne enseignante pour afficher les directives d'utilisation des SIA pour cette évaluation.
          </p>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            📂 Importer le fichier de sauvegarde
          </button>
          <input ref={fileInputRef} type="file" accept=".xml,.txt" style={{ display: 'none' }} onChange={handleFile} />

          <div style={{ marginTop: 12 }}>
            



          </div>

          {/* Error state */}
          {data?.error &&
        <div style={{ marginTop: 20, textAlign: 'left' }}>
              {data.error === 'manual' ?
          <div style={{ color: '#555', marginBottom: 8, fontSize: '0.9em', background: '#f0f4f8', border: '1px solid #ccc', borderRadius: 6, padding: '10px 14px' }}>
                  En mode manuel, remplissez le formulaire sans fichier XML. Aucune directive n'est pré-remplie.
                </div> :

          <>
                  <div style={{ color: '#E41E25', fontWeight: 'bold', marginBottom: 8 }}>
                    ⚠ Ce fichier XML n'est pas conforme au format attendu.
                  </div>
                  <p style={{ fontSize: '0.9em', marginBottom: 8 }}>
                    Le fichier ne peut pas être interprété automatiquement. Vous pouvez sauvegarder le contenu brut ci-dessous et remplir vos déclarations en mode <strong>manuel</strong>.
                  </p>
                </>
          }
              {data.error !== 'manual' && <>
                <button className="btn-primary" onClick={() => {
              const blob = new Blob([data.raw], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;a.download = 'contenu-brut.txt';a.click();
              URL.revokeObjectURL(url);
            }}>
                  💾 Sauvegarder la version brute
                </button>
                <div className="raw-box">{data.raw}</div>
              </>}
            </div>
        }
        </div>
      }

      {/* Main content after successful load */}
      {data?.ok &&
      <>
          {/* Identification */}
          <div className="section-box">
            <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 10 }}>Évaluation ciblée</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '0.95em' }}>
              {data.identification.cours && <div><strong>Cours :</strong> {data.identification.cours}</div>}
              <div>
                <strong>Session :</strong>{' '}
                {data.identification.session && !sessionEditMode ?
              <span>
                    {data.identification.session}{' '}
                    <button type="button" onClick={() => {setSessionOverride(data.identification.session);setSessionEditMode(true);setSessionError(false);}}
                style={{ background: 'none', border: 'none', color: '#00A4E4', cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline', padding: 0 }}>
                      Modifier
                    </button>
                  </span> :

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input
                  type="text"
                  value={sessionOverride}
                  onChange={(e) => {setSessionOverride(e.target.value);setSessionError(false);}}
                  placeholder="ex. Hiver 2025"
                  style={{ padding: '3px 6px', fontFamily: 'inherit', fontSize: '0.95em', border: sessionError ? '2px solid #E41E25' : '1px solid #aaa', borderRadius: 4, background: sessionError ? '#fff4f4' : 'white', width: 160 }} />
                    {data.identification.session &&
                <button type="button" onClick={() => {setSessionEditMode(false);setSessionOverride('');setSessionError(false);}}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.82em', textDecoration: 'underline', padding: 0 }}>
                        Annuler
                      </button>
                }
                    {sessionError && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ Requis</span>}
                  </span>
              }
              </div>
              {data.identification.evaluation && <div><strong>Évaluation :</strong> {data.identification.evaluation}</div>}
              {data.identification.enseignants && <div><strong>Personne(s) enseignante(s) :</strong> {data.identification.enseignants}</div>}
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn-primary" style={{ background: '#6c757d' }} onClick={() => {setData(null);setStudentStates([]);}}>
                🔄 Charger un autre fichier
              </button>
            </div>
          </div>

          {/* Student identity */}
          <div className="section-box">
            <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 6 }}>Identification</h2>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>Les champs obligatoires de cette section d'identification doivent être valides pour continuer.</p>

            {/* Team toggle row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 14, alignItems: 'center' }}>
              <div>
                <button
                type="button"
                onClick={() => setIsEquipe((v) => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: 'bold', transition: 'background 0.2s',
                  background: isEquipe ? '#00A4E4' : '#e0e0e0', color: isEquipe ? 'white' : '#555'
                }}>
                  <span style={{ width: 32, height: 18, borderRadius: 999, background: isEquipe ? 'rgba(255,255,255,0.4)' : '#bbb', display: 'inline-block', position: 'relative', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: isEquipe ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                  </span>
                  Ceci est un travail en équipe
                </button>
              </div>
              {isEquipe &&
            <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Nom ou numéro d'équipe</label>
                  <input type="text" value={nomEquipe} onChange={(e) => setNomEquipe(e.target.value)}
              placeholder="ex. Équipe A ou Équipe 03"
              style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
                </div>
            }
            </div>

            {/* Names left column, groupe right column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {/* Left column: all teammate names stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Personne 1 (main student) */}
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                    {isEquipe ? 'Personne équipière 1' : 'Nom complet'} <span style={{ color: '#E41E25' }}>*</span>
                  </label>
                  <input
                  type="text"
                  value={studentNom}
                  onChange={(e) => {setStudentNom(e.target.value);setNomError(false);}}
                  placeholder="ex. Marie Tremblay"
                  style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: nomError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: nomError ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                  {nomError && <span style={{ color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' }}>⚠ Ce champ est requis</span>}
                </div>

                {/* Additional teammates */}
                {isEquipe && equipiers.map((nom, idx) =>
              <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                        Personne équipière {idx + 2} <span style={{ color: '#E41E25' }}>*</span>
                      </label>
                      <input type="text" value={nom}
                  onChange={(e) => {
                    setEquipiers((prev) => prev.map((v, i) => i === idx ? e.target.value : v));
                    setEquipiersErrors((prev) => prev.map((v, i) => i === idx ? false : v));
                  }}
                  placeholder="ex. Jean Dupont"
                  style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: equipiersErrors[idx] ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: equipiersErrors[idx] ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                      {equipiersErrors[idx] && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Ce champ est requis</span>}
                    </div>
                    {equipiers.length > 1 &&
                <button type="button" onClick={() => {setEquipiers((prev) => prev.filter((_, i) => i !== idx));setEquipiersErrors((prev) => prev.filter((_, i) => i !== idx));}}
                style={{ marginBottom: equipiersErrors[idx] ? 22 : 2, background: 'none', border: 'none', cursor: 'pointer', color: '#E41E25', fontSize: '1.1em' }} title="Retirer">✕</button>
                }
                  </div>
              )}

                {isEquipe &&
              <div>
                    <button type="button" onClick={() => setEquipiers((prev) => [...prev, ''])}
                style={{ background: 'none', border: '1px dashed #00A4E4', color: '#00A4E4', borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontSize: '0.88em', fontFamily: 'inherit' }}>
                      + Ajouter une personne équipière
                    </button>
                  </div>
              }
              </div>

              {/* Right column: groupe */}
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                  Numéro de groupe ou de section
                </label>
                <input
                type="text"
                value={studentGroupe}
                onChange={(e) => setStudentGroupe(e.target.value)}
                placeholder="ex. 65100"
                style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Declaration table + commentaires */}
          {(() => {
              const effectiveSession = data.identification.session && !sessionEditMode ? data.identification.session : sessionOverride.trim();
              const identOk = !!(effectiveSession && studentNom.trim() && (!isEquipe || (equipiers.length > 0 && equipiers[0].trim())));
              return (
          <div style={{ position: 'relative' }}>
            {!identOk && <div style={{ position: 'absolute', inset: 0, background: 'rgba(242,242,242,0.7)', zIndex: 10, borderRadius: 10, cursor: 'not-allowed' }} title="Remplissez d'abord les champs obligatoires (session et nom) dans la section Identification" />}
          <div className="section-box" style={{ padding: 0, overflow: 'hidden', opacity: identOk ? 1 : 0.5, pointerEvents: identOk ? 'auto' : 'none' }}>
            <table className="decl-table" style={{ fontSize: '0.93em', marginTop: 20, marginLeft: 20, marginRight: 20, width: 'calc(100% - 40px)' }}>
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '32%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Étape</th>
                  <th>L'utilisation des SIA est…</th>
                  <th>Directives de la personne enseignante</th>
                  <th>Votre déclaration</th>
                </tr>
              </thead>
              <tbody>
                {data.etapes.map((etape, i) => {
                const s = studentStates[i] || defaultStudentState();
                const hasTraces = etape.decl_traces;
                const hasLogique = etape.decl_logique;
                const hasIagraphie = etape.decl_iagraphie;
                const isAucune = etape.declaration === 'aucune';

                return (
                  <tr key={i}>
                      {/* Col 1: Étape */}
                      <td>
                        <strong>{etape.etapeInfo.libelle}</strong>
                        {etape.etapeInfo.parenthese &&
                      <span style={{ display: 'block', fontWeight: 'normal', color: '#555', fontSize: '0.88em', marginTop: 3 }}>
                            ({etape.etapeInfo.parenthese})
                          </span>
                      }
                      </td>

                      {/* Col 2: IA level */}
                      <td><strong>{etape.ia}</strong></td>

                      {/* Col 3: Directives (locked) */}
                      <td>
                        <div className="locked-field" dangerouslySetInnerHTML={{ __html: etape.justification }} />
                      </td>

                      {/* Col 4: Student declaration */}
                      <td>
                        {isAucune &&
                      <div className="conforme-row">
                            <input type="checkbox" id={`aucune_${i}`} checked={s.aucune_conforme}
                        onChange={(e) => updateStudent(i, 'aucune_conforme', e.target.checked)} />
                            <label htmlFor={`aucune_${i}`}>Aucune exigence — j'affirme être en conformité avec cette directive.</label>
                          </div>
                      }

                        {!isAucune &&
                      <div>
                            {hasIagraphie &&
                        <div style={{ marginBottom: 12 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.88em', marginBottom: 4 }}>Références et IAgraphie</div>
                                <div className="locked-field" style={{ fontSize: '0.85em' }} dangerouslySetInnerHTML={{ __html: etape.decl_iagraphie_text }} />
                                <div className="conforme-row">
                                  <input type="checkbox" id={`iag_${i}`} checked={s.iagraphie_conforme}
                            onChange={(e) => updateStudent(i, 'iagraphie_conforme', e.target.checked)} />
                                  <label htmlFor={`iag_${i}`}>Je confirme avoir respecté cette exigence.</label>
                                </div>
                              </div>
                        }

                            {hasTraces &&
                        <div style={{ marginBottom: 12 }}>
                               <div style={{ fontWeight: 'bold', fontSize: '0.88em', marginBottom: 4 }}>Conserver les traces suivantes</div>
                               <div className="locked-field" style={{ fontSize: '0.85em' }} dangerouslySetInnerHTML={{ __html: etape.decl_traces_text }} />
                               <textarea
                            className="student-input"
                            rows={3}
                            placeholder="Décrivez les traces que vous avez conservées…"
                            value={s.traces_reponse}
                            style={{ border: fieldErrors[i]?.traces_reponse ? '2px solid #E41E25' : undefined, background: fieldErrors[i]?.traces_reponse ? '#fff4f4' : undefined }}
                            onChange={(e) => {updateStudent(i, 'traces_reponse', e.target.value);setFieldErrors((prev) => prev.map((fe, fi) => fi === i ? { ...fe, traces_reponse: false } : fe));}} />
                               {fieldErrors[i]?.traces_reponse && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ Ce champ est requis</span>}

                                <div className="conforme-row">
                                  <input type="checkbox" id={`traces_${i}`} checked={s.traces_conforme}
                            onChange={(e) => updateStudent(i, 'traces_conforme', e.target.checked)} />
                                  <label htmlFor={`traces_${i}`}>Je confirme avoir conservé les traces requises.</label>
                                </div>
                              </div>
                        }

                            {hasLogique &&
                        <div style={{ marginBottom: 4 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.88em', marginBottom: 4 }}>Expliquer la logique d'utilisation</div>
                                <div className="locked-field" style={{ fontSize: '0.85em' }} dangerouslySetInnerHTML={{ __html: etape.decl_logique_text }} />
                                <textarea
                            className="student-input"
                            rows={3}
                            placeholder="Expliquez votre logique d'utilisation de l'IA…"
                            value={s.logique_reponse}
                            style={{ border: fieldErrors[i]?.logique_reponse ? '2px solid #E41E25' : undefined, background: fieldErrors[i]?.logique_reponse ? '#fff4f4' : undefined }}
                            onChange={(e) => {updateStudent(i, 'logique_reponse', e.target.value);setFieldErrors((prev) => prev.map((fe, fi) => fi === i ? { ...fe, logique_reponse: false } : fe));}} />
                                {fieldErrors[i]?.logique_reponse && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ Ce champ est requis</span>}

                                <div className="conforme-row">
                                  <input type="checkbox" id={`logique_${i}`} checked={s.logique_conforme}
                            onChange={(e) => updateStudent(i, 'logique_conforme', e.target.checked)} />
                                  <label htmlFor={`logique_${i}`}>Je confirme avoir expliqué ma logique d'utilisation.</label>
                                </div>
                              </div>
                        }
                          </div>
                      }
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>

            {/* Commentaires + unchecked explanations + submit */}
            <div style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8 }}>Commentaires, exceptions et précisions</h2>
            <textarea
              rows={4}
              value={commentaires}
              onChange={(e) => setCommentaires(e.target.value)}
              placeholder="Ajoutez ici tout commentaire, exception ou précision que vous souhaitez transmettre à votre personne enseignante…"
              style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box', resize: 'vertical' }} />

            {/* Dynamic fields for unchecked confirmations */}
            {buildUncheckedItems(studentStates).map((u) =>
            <div key={u.field} style={{ marginTop: 14 }}>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 4 }}>
                  <span style={{ color: '#E41E25' }}>*</span> {u.etape} — {u.exigence} : Expliquez pourquoi cette confirmation n'a pas été cochée.
                </label>
                <textarea
                rows={2}
                value={uncheckedExplanations[u.field] || ''}
                onChange={(e) => {
                  setUncheckedExplanations((prev) => ({ ...prev, [u.field]: e.target.value }));
                  setUncheckedExpErrors((prev) => ({ ...prev, [u.field]: false }));
                }}
                placeholder="Expliquez la raison…"
                style={{ width: '100%', padding: '6px 9px', fontFamily: 'inherit', fontSize: '0.9em', border: uncheckedExpErrors[u.field] ? '2px solid #E41E25' : '1px solid #aaa', background: uncheckedExpErrors[u.field] ? '#fff4f4' : 'white', borderRadius: 4, boxSizing: 'border-box', resize: 'vertical' }} />
                {uncheckedExpErrors[u.field] && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ Ce champ est requis</span>}
              </div>
            )}

            {/* Fichiers joints toggle */}
            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={() => {setHasFichiersJoints((v) => !v);setFichiersJointsConfirme(false);setFichiersJointsError(false);}}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: 'bold', transition: 'background 0.2s',
                  background: hasFichiersJoints ? '#00A4E4' : '#e0e0e0', color: hasFichiersJoints ? 'white' : '#555'
                }}>
                <span style={{ width: 32, height: 18, borderRadius: 999, background: hasFichiersJoints ? 'rgba(255,255,255,0.4)' : '#bbb', display: 'inline-block', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: hasFichiersJoints ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                </span>
                J'ai au moins un fichier joint à soumettre en soutien à cette déclaration
              </button>
              {hasFichiersJoints &&
              <div style={{ marginTop: 10 }}>
                <div className="conforme-row">
                  <input type="checkbox" id="fichiers_joints_confirme" checked={fichiersJointsConfirme}
                onChange={(e) => { setFichiersJointsConfirme(e.target.checked); setFichiersJointsError(false); }} />
                  <label htmlFor="fichiers_joints_confirme" style={{ color: fichiersJointsError ? '#E41E25' : undefined }}>Je m'engage à transmettre le ou les fichiers requis à ma personne enseignante.</label>
                </div>
                {fichiersJointsError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 2 }}>⚠ Cette confirmation est requise</span>}
              </div>
              }
            </div>

            {/* Submit button */}
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ fontSize: '1em', padding: '11px 28px' }} onClick={handleSoumettre}>
                Générer la déclaration
              </button>
              {submitStatus && (submitStatus.ok ? (() => {
                const diffMs = new Date() - submitStatus.time;
                const diffMin = Math.floor(diffMs / 60000);
                const diffH = Math.floor(diffMin / 60);
                const elapsed = diffH > 0 ? `il y a ${diffH} heure${diffH > 1 ? 's' : ''}` : diffMin <= 0 ? "à l'instant" : `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
                return <span style={{ background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>✔️ Déclaration générée avec succès {elapsed}.</span>;
              })() :
              <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Certains champs obligatoires ne sont pas remplis correctement.</span>)
              }
            </div>
            </div>
            </div>
            </div>
            );})()}

            {/* Preview */}
          {apercu &&
          <>
          <div ref={apercuRef} style={{ background: 'white', padding: '40px 50px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 20, fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: 1.2, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
              {/* Document title */}
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8pt', paddingBottom: '8pt', borderBottom: '1px solid black', margin: '0 0 8pt 0', color: '#000' }}>
                Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)
              </h1>

              {/* Paragraphe d'introduction */}
              <div style={{ fontSize: '0.93em', lineHeight: 1.7, marginBottom: 16 }}>
                {apercu.isEquipe ? (() => {
              const noms = apercu.equipiers.filter((n) => n.trim()).join(', ');
              const equipeInfo = apercu.nomEquipe ? ` (équipe ${apercu.nomEquipe})` : '';
              const groupeInfo = apercu.studentGroupe ? `, groupe ${apercu.studentGroupe}` : '';
              return <p style={{ margin: '0 0 6px' }}>Nous, <strong>{noms}</strong>{equipeInfo}{groupeInfo}, soumettons cette déclaration dans le cadre de l'évaluation nommée <strong>{apercu.identification.evaluation || '[évaluation]'}</strong> du cours <strong>{apercu.identification.cours || '[cours]'}</strong> de la session <strong>{apercu.identification.session || '[session]'}</strong>, enseigné par <strong>{apercu.identification.enseignants || '[personne enseignante]'}</strong>.</p>;
            })() :
            <p style={{ margin: '0 0 6px' }}>Je, <strong>{apercu.studentNom}</strong>{apercu.studentGroupe ? ` (groupe ${apercu.studentGroupe})` : ''}, soumets cette déclaration dans le cadre de l'évaluation nommée <strong>{apercu.identification.evaluation || '[évaluation]'}</strong> du cours <strong>{apercu.identification.cours || '[cours]'}</strong> de la session <strong>{apercu.identification.session || '[session]'}</strong>, enseigné par <strong>{apercu.identification.enseignants || '[personne enseignante]'}</strong>.</p>
            }
                <p style={{ margin: 0 }}>Conformément aux exigences de {apercu.isEquipe ? 'notre' : 'ma'} personne enseignante, les renseignements suivants présentent {apercu.isEquipe ? 'notre' : 'ma'} démarche.</p>
              </div>

              {/* Declaration summary table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', width: '15%' }}>Étape</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', width: '13%' }}>Utilisation SIA</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', width: '24%' }}>Directives de la personne enseignante</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#e8f4fd', width: '24%' }}>Exigences de déclaration</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#edfbf0', width: '24%' }}>Déclaration</th>
                  </tr>
                </thead>
                <tbody>
                  {apercu.etapes.map((etape, i) => {
                const st = apercu.states[i] || defaultStudentState();
                const isAucune = etape.declaration === 'aucune';
                return (
                  <tr key={i}>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}>
                          <strong>{etape.etapeInfo.libelle}</strong>
                          {etape.etapeInfo.parenthese && <span style={{ display: 'block', color: '#555', fontSize: '0.87em' }}>({etape.etapeInfo.parenthese})</span>}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}>{etape.ia}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '0.88em', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: etape.justification }} />
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top', background: '#f0f7ff' }}>
                          {isAucune ?
                      <em style={{ color: '#555' }}>Aucune exigence</em> :
                      <div style={{ fontSize: '0.88em', lineHeight: 1.5 }}>
                                {etape.decl_iagraphie && <div style={{ marginBottom: 6 }}><strong>IAgraphie :</strong> <span dangerouslySetInnerHTML={{ __html: etape.decl_iagraphie_text }} /></div>}
                                {etape.decl_traces && <div style={{ marginBottom: 6 }}><strong>Traces :</strong> <span dangerouslySetInnerHTML={{ __html: etape.decl_traces_text }} /></div>}
                                {etape.decl_logique && <div><strong>Logique :</strong> <span dangerouslySetInnerHTML={{ __html: etape.decl_logique_text }} /></div>}
                              </div>
                      }
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top', background: '#f2fbf4' }}>
                          {isAucune ?
                      <span style={{ color: st.aucune_conforme ? '#1a7a36' : '#c0392b', fontWeight: 'bold' }}>
                                {st.aucune_conforme ? '✔ Pris connaissance' : '✘ Non confirmé'}
                              </span> :
                      <div style={{ fontSize: '0.88em', lineHeight: 1.6 }}>
                                {etape.decl_iagraphie && <div style={{ marginBottom: 6 }}>
                                  <strong>IAgraphie :</strong> <span style={{ color: st.iagraphie_conforme ? '#1a7a36' : '#c0392b' }}>{st.iagraphie_conforme ? '✔ Confirmé' : '✘ Non confirmé'}</span>
                                </div>}
                                {etape.decl_traces && <div style={{ marginBottom: 6 }}>
                                  <strong>Traces :</strong> {st.traces_reponse ? <span style={{ color: '#333' }}>{st.traces_reponse}</span> : <em style={{ color: '#999' }}>Aucune réponse</em>}
                                  <span style={{ marginLeft: 6, color: st.traces_conforme ? '#1a7a36' : '#c0392b' }}>{st.traces_conforme ? '✔' : '✘'}</span>
                                </div>}
                                {etape.decl_logique && <div>
                                  <strong>Logique :</strong> {st.logique_reponse ? <span style={{ color: '#333' }}>{st.logique_reponse}</span> : <em style={{ color: '#999' }}>Aucune réponse</em>}
                                  <span style={{ marginLeft: 6, color: st.logique_conforme ? '#1a7a36' : '#c0392b' }}>{st.logique_conforme ? '✔' : '✘'}</span>
                                </div>}
                              </div>
                      }
                        </td>
                      </tr>);

              })}
                </tbody>
              </table>

              {/* Commentaires + explanations */}
              {(apercu.commentaires || apercu.explanations && apercu.explanations.length > 0) &&
              <div style={{ marginTop: '16pt', paddingTop: '8pt', paddingBottom: '8pt' }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 'bold', margin: '8pt 0', color: '#000' }}>Commentaires, exceptions et précisions</h2>
                  {apercu.commentaires &&
              <p style={{ margin: '0 0 8pt 0', whiteSpace: 'pre-wrap' }}>{apercu.commentaires}</p>
              }
                  {apercu.explanations && apercu.explanations.map((e, i) =>
              <div key={i} style={{ marginBottom: '8pt' }}>
                      <p style={{ margin: '0 0 4pt 0', fontSize: '10px', color: '#333' }}><strong>{e.question}</strong></p>
                      <p style={{ margin: '0 0 8pt 0' }}>{e.reponse}</p>
                    </div>
              )}
                </div>
              }

              {/* Fichiers joints */}
              {apercu.hasFichiersJoints &&
              <div style={{ marginTop: '16pt', paddingTop: '8pt', paddingBottom: '8pt' }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 'bold', margin: '8pt 0', color: '#000' }}>Fichiers joints</h2>
                  <p style={{ margin: 0 }}>{apercu.fichiersJointsConfirme ? '✔ Engagement confirmé — les fichiers requis seront transmis à la personne enseignante.' : '✘ Engagement non confirmé'}</p>
                </div>
              }

              {/* Affirmations finales */}
              <div style={{ marginTop: '16pt', paddingTop: '8pt', paddingBottom: '8pt' }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 'bold', margin: '8pt 0', color: '#000' }}>La soumission de cette déclaration confirme que :</h2>
                <ul style={{ margin: '0 0 0 20px', paddingLeft: 0, lineHeight: 1.6, listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '4pt' }}>Les informations fournies sont complètes et fidèles à {apercu.isEquipe ? 'notre' : 'mon'} utilisation réelle.</li>
                  <li style={{ marginBottom: '4pt' }}>{apercu.isEquipe ? 'Notre' : 'Mon'} utilisation de l'IAg est conforme aux règles établies par la personne enseignante pour ce travail.</li>
                  <li style={{ marginBottom: '4pt' }}>{apercu.isEquipe ? 'Nous avons' : 'J\'ai'} exercé {apercu.isEquipe ? 'notre' : 'mon'} jugement critique sur les contenus générés par les SIA, si autorisés.</li>
                  <li style={{ marginBottom: '4pt' }}>Le travail soumis reflète {apercu.isEquipe ? 'notre' : 'ma'} propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.</li>
                  <li>{apercu.isEquipe ? 'Nous comprenons' : 'Je comprends'} que l'omission ou une fausse déclaration constitue une infraction au Règlement disciplinaire.</li>
                </ul>
              </div>

              {/* Timestamp */}
              <p style={{ marginTop: '16pt', fontSize: '10px', color: '#666', fontStyle: 'italic', margin: '16pt 0 0 0' }}>
                Générée le {apercu.timestamp}
              </p>
              </div>

              {/* Export buttons outside preview */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20, alignItems: 'center' }}>
              <button type="button" className="btn-primary" onClick={() => copyDeclToClipboard(apercu)}>
                📋 Copier pour coller dans Word
              </button>
              {copyOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
              <button type="button" className="btn-primary" onClick={() => downloadDeclWord(apercu)}>
                📄 Télécharger en Word (.doc)
              </button>
              <button type="button" className="btn-primary" style={{ background: '#6c757d' }} onClick={() => downloadDeclPDF(apercu)}>
                📋 Télécharger en PDF
              </button>
              </div>
              </>
              }
        </>
      }

    </div>);



}