import React, { useState, useEffect } from 'react';

// ---- Helpers partagés ----

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatExigences(s) {
  if (s.declaration === 'aucune')
    return `<ul style="margin:0;padding-left:18px;list-style-type:disc;"><li style="display:list-item;">Aucune exigence</li></ul>`;
  const items = [];
  if (s.decl_iagraphie) items.push(`Références et IAgraphie : ${s.decl_iagraphie_text}`);
  if (s.decl_traces) items.push(`Conserver les traces suivantes : ${s.decl_traces_text}`);
  if (s.decl_logique) items.push(`Expliquer la logique d'utilisation : ${s.decl_logique_text}`);
  if (items.length === 0) return '—';
  return `<ul style="margin:0;padding-left:18px;list-style-type:disc;">${items.map(i => `<li style="display:list-item;">${i}</li>`).join('')}</ul>`;
}

// ---- Générateurs HTML gabarit ----

function buildGabaritEtapeHTML(selections, identification) {
  const cours = escHtml(identification.cours || '[cours]');
  const evaluation = escHtml(identification.evaluation || '[évaluation]');
  const session = escHtml(identification.session || '[session]');
  const enseignants = escHtml(identification.enseignants || '[personne enseignante]');

  const title = `<h1 style="font-family:Georgia,serif;font-size:22px;font-weight:bold;text-align:center;margin:0 0 8pt 0;padding-bottom:8pt;border-bottom:1px solid black;color:#000;">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)</h1>`;

  const intro = `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;margin:8pt 0 4pt 0;">
    Je, <strong>[Nom complet de l'étudiant(e)]</strong> (groupe <strong>[Numéro de groupe]</strong>), soumets cette déclaration dans le cadre de l'évaluation nommée <strong>${evaluation}</strong> du cours <strong>${cours}</strong> de la session <strong>${session}</strong>, enseigné par <strong>${enseignants}</strong>.
  </p>
  <p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;margin:0 0 11pt 0;">
    Conformément aux exigences de la personne enseignante, les renseignements suivants présentent ma démarche d'utilisation des systèmes d'intelligence artificielle.
  </p>`;

  const directivesTitle = `<h2 style="font-family:Georgia,serif;font-size:16pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">Directives de la personne enseignante</h2>`;
  let directivesTable = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:9pt;margin-bottom:12pt;">
    <thead><tr>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:22%">Étape</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:15%">Utilisation des SIA</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:38%">Directives</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:25%">Exigences de déclaration</th>
    </tr></thead><tbody>`;
  selections.forEach(s => {
    const label = s.parenthese
      ? `<strong>${escHtml(s.etape)}</strong><br><span style="color:#555;font-size:0.88em">(${escHtml(s.parenthese)})</span>`
      : `<strong>${escHtml(s.etape)}</strong>`;
    directivesTable += `<tr>
      <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${label}</td>
      <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${escHtml(s.ia)}</td>
      <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${s.justification}</td>
      <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${formatExigences(s)}</td>
    </tr>`;
  });
  directivesTable += '</tbody></table>';

  const stepsWithDecl = selections.filter(s => s.declaration !== 'aucune');
  const declTitle = `<h2 style="font-family:Georgia,serif;font-size:16pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">Ma déclaration d'utilisation — par étape</h2>`;
  let declTable;
  if (stepsWithDecl.length === 0) {
    declTable = `<p style="font-family:Arial,sans-serif;font-size:10pt;color:#555;margin:0 0 12pt 0;padding:10px 14px;background:#f8f8f8;border:1px solid #ddd;border-radius:4px;">Cette évaluation n'indique aucune exigence de déclaration. Utilisez le champ Commentaires additionnels ci-dessous si vous le jugez approprié.</p>`;
  } else {
    declTable = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:10pt;margin-bottom:12pt;">
    <thead><tr>
      <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;width:25%">Étape de réalisation</th>
      <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;width:30%">Outil(s) SIA utilisé(s)</th>
      <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;width:45%">Exigences de déclaration — réponses</th>
    </tr></thead><tbody>`;
    stepsWithDecl.forEach(s => {
      const exigItems = [];
      if (s.decl_iagraphie) exigItems.push(`<strong>Références et IAgraphie :</strong> Indiquer si et comment vous êtes en conformité, où se trouvent les références ou commentez ici directement.`);
      if (s.decl_traces) exigItems.push(`<strong>Traces conservées :</strong> Indiquer si et comment vous êtes en conformité, où se trouvent les traces ou commentez ici directement.`);
      if (s.decl_logique) exigItems.push(`<strong>Logique d'utilisation :</strong> Indiquer si et comment vous êtes en conformité, où se trouve la logique ou commentez ici directement.`);
      const exigHtml = exigItems.length
        ? `<ul style="margin:0;padding-left:16px;">${exigItems.map(i => `<li style="display:list-item;margin-bottom:4px">${i}</li>`).join('')}</ul>`
        : '—';
      const label = s.parenthese
        ? `<strong>${escHtml(s.etape)}</strong><br><span style="color:#555;font-size:0.88em">(${escHtml(s.parenthese)})</span>`
        : `<strong>${escHtml(s.etape)}</strong>`;
      declTable += `<tr>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${label}<br><span style="color:#888;font-size:0.85em;font-style:italic">${escHtml(s.ia)}</span></td>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top;color:#888;font-style:italic">[Outil(s) utilisé(s) ou « Aucun SIA »]</td>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${exigHtml}</td>
      </tr>`;
    });
    declTable += '</tbody></table>';
  }

  const commentsSection = `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:12pt 0 4pt 0;color:#000;">Commentaires additionnels</h2>
  <p style="font-family:Arial,sans-serif;font-size:10pt;color:#555;margin:0 0 6pt 0;">Vous pouvez ajouter ici tout commentaire pertinent concernant votre utilisation des SIA dans le cadre de cette évaluation.</p>
  <div style="border:1px solid #ccc;border-radius:4px;min-height:80px;padding:8px;font-family:Arial,sans-serif;font-size:10pt;color:#aaa;font-style:italic;">[Commentaires optionnels]</div>`;

  const affirmTitle = `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:12pt 0 4pt 0;color:#000;">La soumission de cette déclaration confirme que :</h2>`;
  const affirmList = [
    "Les informations fournies sont complètes et fidèles à mon utilisation réelle.",
    "Mon utilisation des SIA est conforme aux règles établies par la personne enseignante pour ce travail.",
    "J'ai exercé mon jugement critique sur les contenus générés par les SIA.",
    "Le travail soumis reflète ma propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.",
    "Je comprends que l'omission ou une fausse déclaration constitue une infraction au Règlement disciplinaire."
  ];
  const affirmHtml = `<ul style="margin:0 0 0 20px;padding-left:0;font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;">${affirmList.map(a => `<li style="margin-bottom:4pt">${a}</li>`).join('')}</ul>`;

  const signatureBlock = `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:20pt 0 4pt 0;"><strong>Date :</strong> ___________________________</p>`;

  return title + intro + directivesTitle + directivesTable + declTitle + declTable + commentsSection + affirmTitle + affirmHtml + signatureBlock;
}

function buildGabaritOutilHTML(selections, identification) {
  const cours = escHtml(identification.cours || '[cours]');
  const evaluation = escHtml(identification.evaluation || '[évaluation]');
  const session = escHtml(identification.session || '[session]');
  const enseignants = escHtml(identification.enseignants || '[personne enseignante]');

  const title = `<h1 style="font-family:Georgia,serif;font-size:22px;font-weight:bold;text-align:center;margin:0 0 8pt 0;padding-bottom:8pt;border-bottom:1px solid black;color:#000;">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)</h1>`;

  const intro = `<p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;margin:8pt 0 4pt 0;">
    Je, <strong>[Nom complet de l'étudiant(e)]</strong> (groupe <strong>[Numéro de groupe]</strong>), soumets cette déclaration dans le cadre de l'évaluation nommée <strong>${evaluation}</strong> du cours <strong>${cours}</strong> de la session <strong>${session}</strong>, enseigné par <strong>${enseignants}</strong>.
  </p>
  <p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;margin:0 0 11pt 0;">
    Conformément aux exigences de la personne enseignante, les renseignements suivants présentent ma démarche d'utilisation des systèmes d'intelligence artificielle.
  </p>`;

  const directivesTitle = `<h2 style="font-family:Georgia,serif;font-size:16pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">Directives de la personne enseignante</h2>`;
  let directivesTable = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:9pt;margin-bottom:12pt;">
    <thead><tr>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:22%">Étape</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:15%">Utilisation des SIA</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:38%">Directives</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;width:25%">Exigences de déclaration</th>
    </tr></thead><tbody>`;
  selections.forEach(s => {
    const label = s.parenthese
      ? `<strong>${escHtml(s.etape)}</strong><br><span style="color:#555;font-size:0.88em">(${escHtml(s.parenthese)})</span>`
      : `<strong>${escHtml(s.etape)}</strong>`;
    directivesTable += `<tr>
      <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${label}</td>
      <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${escHtml(s.ia)}</td>
      <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${s.justification}</td>
      <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${formatExigences(s)}</td>
    </tr>`;
  });
  directivesTable += '</tbody></table>';

  const declTitle = `<h2 style="font-family:Georgia,serif;font-size:16pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">Ma déclaration d'utilisation — par SIA</h2>`;
  const declInstructions = `<p style="font-family:Arial,sans-serif;font-size:10pt;color:#555;margin:0 0 8pt 0;">Pour chaque SIA utilisé, indiquez le nom du SIA et les étapes pour lesquelles vous l'avez utilisé. Ajoutez des lignes au besoin.</p>`;

  // Build list of step labels for the helper column — exclude non-authorized steps
  const etapesList = selections.filter(s => s.ia !== 'Non autorisée').map(s => escHtml(s.etape)).join(', ');

  let declTable = `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:10pt;margin-bottom:8pt;">
    <thead><tr>
      <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;width:30%">Nom du SIA utilisé</th>
      <th style="border:1px solid #ccc;padding:6px;background:#edfbf0;width:70%">Étapes de réalisation concernées</th>
    </tr></thead><tbody>`;
  // 3 empty rows for the student to fill in
  for (let i = 0; i < 3; i++) {
    declTable += `<tr>
      <td style="border:1px solid #ccc;padding:6px;height:32px;vertical-align:top;color:#aaa;font-style:italic">[Nom du SIA]</td>
      <td style="border:1px solid #ccc;padding:6px;height:32px;vertical-align:top;color:#aaa;font-style:italic">[Étapes : ${etapesList}]</td>
    </tr>`;
  }
  declTable += '</tbody></table>';

  // Exigences section
  const hasExigences = selections.some(s => s.declaration !== 'aucune' && (s.decl_iagraphie || s.decl_traces || s.decl_logique));
  let exigencesHtml = '';
  if (hasExigences) {
    exigencesHtml = `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:12pt 0 6pt 0;color:#000;">Exigences de déclaration à compléter (si applicable)</h2>
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:10pt;margin-bottom:12pt;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:6px;background:#f0f8ff;width:22%">Étape</th>
        <th style="border:1px solid #ccc;padding:6px;background:#f0f8ff;width:78%">Exigences — réponses</th>
      </tr></thead><tbody>`;
    selections.forEach(s => {
      if (s.declaration === 'aucune') return;
      const exigItems = [];
      if (s.decl_iagraphie) exigItems.push(`<strong>Références et IAgraphie :</strong> Indiquer si et comment vous êtes en conformité, où se trouvent les références ou commentez ici directement.`);
      if (s.decl_traces) exigItems.push(`<strong>Traces conservées :</strong> Indiquer si et comment vous êtes en conformité, où se trouvent les traces ou commentez ici directement.`);
      if (s.decl_logique) exigItems.push(`<strong>Logique d'utilisation :</strong> Indiquer si et comment vous êtes en conformité, où se trouve la logique ou commentez ici directement.`);
      if (!exigItems.length) return;
      const exigContent = `<ul style="margin:0;padding-left:16px;">${exigItems.map(i => `<li style="display:list-item;margin-bottom:6px">${i}</li>`).join('')}</ul>`;
      const label = s.parenthese ? `<strong>${escHtml(s.etape)}</strong><br><span style="color:#555;font-size:0.88em">(${escHtml(s.parenthese)})</span>` : `<strong>${escHtml(s.etape)}</strong>`;
      exigencesHtml += `<tr>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${label}</td>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top">${exigContent}</td>
      </tr>`;
    });
    exigencesHtml += '</tbody></table>';
  }

  const commentsSection = `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:12pt 0 4pt 0;color:#000;">Commentaires additionnels</h2>
  <p style="font-family:Arial,sans-serif;font-size:10pt;color:#555;margin:0 0 6pt 0;">Vous pouvez ajouter ici tout commentaire pertinent concernant votre utilisation des SIA dans le cadre de cette évaluation.</p>
  <div style="border:1px solid #ccc;border-radius:4px;min-height:80px;padding:8px;font-family:Arial,sans-serif;font-size:10pt;color:#aaa;font-style:italic;">[Commentaires optionnels]</div>`;

  const affirmTitle = `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:12pt 0 4pt 0;color:#000;">La soumission de cette déclaration confirme que :</h2>`;
  const affirmList = [
    "Les informations fournies sont complètes et fidèles à mon utilisation réelle.",
    "Mon utilisation des SIA est conforme aux règles établies par la personne enseignante pour ce travail.",
    "J'ai exercé mon jugement critique sur les contenus générés par les SIA.",
    "Le travail soumis reflète ma propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.",
    "Je comprends que l'omission ou une fausse déclaration constitue une infraction au Règlement disciplinaire."
  ];
  const affirmHtml = `<ul style="margin:0 0 0 20px;padding-left:0;font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;">${affirmList.map(a => `<li style="margin-bottom:4pt">${a}</li>`).join('')}</ul>`;
  const signatureBlock = `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:20pt 0 4pt 0;"><strong>Date :</strong> ___________________________</p>`;

  return title + intro + directivesTitle + directivesTable + declTitle + declInstructions + declTable + exigencesHtml + commentsSection + affirmTitle + affirmHtml + signatureBlock;
}

function downloadWordGabarit(htmlContent, filename) {
  const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>${filename}</title>
    <style>body{font-family:Arial,sans-serif;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px;}</style>
    </head><body>${htmlContent}</body></html>`;
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Composant principal ----

export default function DeclarationGabarit({ selections, identification, isGenerated, mode }) {
  const [showApercu, setShowApercu] = useState(false);

  useEffect(() => { setShowApercu(false); }, [mode]);

  const html = mode === 'etape'
    ? buildGabaritEtapeHTML(selections, identification)
    : buildGabaritOutilHTML(selections, identification);

  const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
  const filename = `gabarit-declaration-${mode}-${slugify(identification.cours || 'cours')}-${slugify(identification.evaluation || 'evaluation')}.doc`;

  return (
    <div style={{ padding: '16px 20px', border: '1px solid #b3d9f7', borderRadius: 8, background: '#f7fbff' }}>
      <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: '1.05em', fontWeight: 'bold', color: '#231F20' }}>
        📄 Option : gabarit Word à compléter manuellement
      </h3>
      <p style={{ fontSize: '0.88em', color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>
        {mode === 'etape'
          ? 'Gabarit filtré listant chaque étape de réalisation avec un espace pour identifier les outils SIA utilisés et répondre aux exigences de déclaration.'
          : 'Gabarit filtré avec un tableau pour déclarer chaque outil utilisé et les étapes concernées, suivi des exigences de déclaration à compléter.'}
      </p>

      {!isGenerated && (
        <div style={{ padding: '10px 14px', background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 6, fontSize: '0.88em', color: '#856404', marginBottom: 14 }}>
          ⚠ Générez d'abord vos directives (bouton <strong>Générer les directives mises en forme</strong>) pour activer le téléchargement du gabarit.
        </div>
      )}

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          disabled={!isGenerated}
          onClick={() => setShowApercu(v => !v)}
          style={{
            background: isGenerated ? '#6c757d' : '#c0c0c0',
            color: 'white', border: 'none', padding: '8px 18px', borderRadius: 5,
            cursor: isGenerated ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.9em'
          }}>
          {showApercu ? '🙈 Masquer l\'aperçu' : '👁 Voir l\'aperçu'}
        </button>
        <button
          type="button"
          disabled={!isGenerated}
          onClick={() => downloadWordGabarit(html, filename)}
          style={{
            background: isGenerated ? '#00A4E4' : '#c0c0c0',
            color: 'white', border: 'none', padding: '8px 18px', borderRadius: 5,
            cursor: isGenerated ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.9em'
          }}>
          📥 Télécharger le gabarit Word
        </button>
      </div>

      {/* Aperçu */}
      {showApercu && isGenerated && (
        <div style={{
          marginTop: 16, border: '1px solid #ccc', borderRadius: 6,
          background: 'white', padding: '24px 28px',
          fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: 1.5,
          maxHeight: 520, overflowY: 'auto'
        }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}