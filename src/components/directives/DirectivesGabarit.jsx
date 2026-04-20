import React, { useState } from 'react';
import PHASES, { PERMISSION_LEVELS } from './directivesData';

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildGabaritHTML(identification, permissions, precisions = '', exigences = [], customActions = {}) {
  const cours = escHtml(identification.cours || '[cours]');
  const evaluation = escHtml(identification.evaluation || '[évaluation]');
  const session = escHtml(identification.session || '[session]');
  const enseignants = escHtml(identification.enseignants || '[personne enseignante]');

  const title = `<h1 style="font-family:Georgia,serif;font-size:22px;font-weight:bold;text-align:center;margin:0 0 14pt 0;padding-bottom:8pt;border-bottom:1px solid black;color:#000;">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)</h1>`;
  const intro = `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 8pt 0;">Je, <strong>[NOM]</strong> (groupe <strong>[GROUPE]</strong>), soumets cette déclaration dans le cadre de l'évaluation <strong>${evaluation}</strong> du cours <strong>${cours}</strong> de la session <strong>${session}</strong>.</p>
<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 16pt 0;">Conformément aux exigences de <strong>${enseignants}</strong>, les renseignements suivants présentent ma démarche.</p>`;

  // Group all actions by phase, then by permission level (including custom actions)
  let body = `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:14pt 0 4pt 0;color:#000;border-bottom:2px solid #ddd;padding-bottom:4pt;">Directives à l'intention des personnes étudiantes</h2>`;

  body += `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:9pt;margin-bottom:6pt;">
    <thead><tr>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;font-weight:bold;width:25%">Phases</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;font-weight:bold;width:30%">Permissions SIA</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;font-weight:bold;width:45%">Actions SIA</th>
    </tr></thead><tbody>`;

  const customByPhase = {};
  Object.values(customActions).forEach(a => {
    if (a.phaseId && a.id in permissions) {
      if (!customByPhase[a.phaseId]) customByPhase[a.phaseId] = [];
      customByPhase[a.phaseId].push(a);
    }
  });

  for (const phase of PHASES) {
    let firstRowInPhase = true;
    let phaseRowCount = 0;
    const phaseCustom = customByPhase[phase.id] || [];
    for (const level of PERMISSION_LEVELS) {
      const baseActions = phase.actions.filter(a => a.id in permissions && permissions[a.id] === level.id);
      const custActions = phaseCustom.filter(a => permissions[a.id] === level.id);
      if (baseActions.length + custActions.length > 0) phaseRowCount++;
    }
    if (phaseRowCount === 0) continue;

    for (const level of PERMISSION_LEVELS) {
      const baseActions = phase.actions.filter(a => a.id in permissions && permissions[a.id] === level.id);
      const custActions = phaseCustom.filter(a => permissions[a.id] === level.id);
      const levelActions = [...baseActions, ...custActions];
      if (levelActions.length === 0) continue;
      const items = levelActions.map(a => `<li style="margin:1pt 0;display:list-item;list-style-type:disc;">${escHtml(a.libelle)}</li>`).join('');
      body += `<tr>`;
      if (firstRowInPhase) {
        body += `<td style="border:1px solid #ccc;padding:6px;vertical-align:top;font-weight:bold;" rowspan="${phaseRowCount}">${escHtml(phase.libelle)}</td>`;
        firstRowInPhase = false;
      }
      body += `<td style="border:1px solid #ccc;padding:6px;vertical-align:top;color:${level.color};font-weight:bold;">${escHtml(level.libelle)}</td>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top;"><ul style="margin:0;padding-left:16px;list-style-type:disc;">${items}</ul></td>
      </tr>`;
    }
  }
  body += '</tbody></table>';
  if (precisions) body += `<p style="font-family:Arial,sans-serif;font-size:10pt;color:#444;margin:0 0 10pt 0;"><em>Précisions :</em> ${escHtml(precisions)}</p>`;

  // Exigences
  let exigencesBlock = '';
  if (exigences && exigences.length > 0) {
    const typeLabels = { iagraphie: 'Références et IAgraphie', traces: 'Conserver les traces', logique: "Expliquer la logique d'utilisation" };
    exigencesBlock += `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:14pt 0 4pt 0;color:#000;border-bottom:2px solid #ddd;padding-bottom:4pt;">Déclaration</h2>
<p style="font-family:Arial,sans-serif;font-size:11pt;margin:8pt 0 4pt 0;">Votre utilisation des SIA pour cette évaluation est-elle conforme aux directives ci-dessus ?</p>
<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 12pt 0;">☐ Oui &nbsp;&nbsp;&nbsp; ☐ Non</p>
<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 4pt 0;">Au besoin, ajoutez des précisions ou des commentaires sur votre utilisation des SIA pour cette évaluation.</p>
<div style="border:1px solid #aaa;border-radius:4px;min-height:80px;margin:4pt 0 14pt 0;padding:6px;background:#fafafa;">&nbsp;</div>`;
    exigences.forEach(exig => {
      const label = typeLabels[exig.type] || exig.type;
      exigencesBlock += `<p style="font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;margin:10pt 0 2pt 0;">${escHtml(label)}</p>`;
      if (exig.description) exigencesBlock += `<div style="font-family:Arial,sans-serif;font-size:10pt;color:#444;margin:0 0 6pt 0;">${exig.description}</div>`;
      if (exig.type === 'iagraphie') {
        exigencesBlock += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:6pt 0 4pt 0;">Avez-vous respecté les exigences de référencement et d'IAgraphie ci-dessus ?</p>`;
        exigencesBlock += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 8pt 0;">☐ Oui &nbsp;&nbsp;&nbsp; ☐ Non</p>`;
        exigencesBlock += `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 4pt 0;">Au besoin, ajoutez des précisions ou des commentaires sur le référencement et l'IAgraphie.</p>`;
        exigencesBlock += `<div style="border:1px solid #aaa;border-radius:4px;min-height:80px;margin:4pt 0 14pt 0;padding:6px;background:#fafafa;">&nbsp;</div>`;
      } else {
        exigencesBlock += `<p style="font-family:Arial,sans-serif;font-size:10pt;margin:2pt 0 0 0;color:#555;font-style:italic;">Réponse :</p>`;
        exigencesBlock += `<div style="border:1px solid #aaa;border-radius:4px;min-height:80px;margin:4pt 0 14pt 0;padding:6px;background:#fafafa;">&nbsp;</div>`;
      }
    });
  }

  const declarationSupp = ``;

  const affirmTitle = `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:12pt 0 4pt 0;color:#000;">Par la soumission de cette déclaration, vous confirmez que :</h2>`;
  const affirmList = [
    "Les informations fournies sont complètes et fidèles à votre utilisation réelle.",
    "Votre utilisation des SIA est conforme aux règles établies par la personne enseignante pour ce travail.",
    "Vous avez fait un usage responsable des SIA et avez respecté le Droit d'auteur lors des requêtes et référencement.",
    "Vous avez exercé votre jugement critique et validé l'exactitude des contenus générés par les SIA.",
    "Le travail soumis reflète votre propre pensée, même lorsqu'un SIA a été utilisé comme outil de soutien.",
    "Vous comprenez qu'une fausse déclaration est une atteinte grave à l'éthique et risque de compromettre la crédibilité du travail réalisé.",
    `Vous comprenez qu'un usage non autorisé, des données fausses ou inventées ou copier-coller des réponses générées par une SIA sans l'identifier constituent des infractions au <a href="https://www.ulaval.ca/sites/default/files/notre-universite/direction-gouv/Documents_officiels/Reglements/Reglement_disciplinaire_intention_etudiants.pdf" style="color:#0056b3;text-decoration:underline;">Règlement disciplinaire</a> de l'Université Laval.`
  ];
  const affirmHtml = `<ul style="margin:0 0 0 20px;padding-left:0;list-style-type:disc;font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;">${affirmList.map(a => `<li style="margin-bottom:4pt;display:list-item;list-style-type:disc;">${a}</li>`).join('')}</ul>`;
  const signatureBlock = `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:20pt 0 4pt 0;"><strong>Date :</strong> ___________________________</p>`;

  return title + intro + body + exigencesBlock + declarationSupp + affirmTitle + affirmHtml + signatureBlock;
}

function downloadWord(htmlContent, filename) {
  const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>${filename}</title>
    <style>body{font-family:Arial,sans-serif;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px;}</style>
    </head><body>${htmlContent}</body></html>`;
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export default function DirectivesGabarit({ identification, permissions, precisions = '', exigences, isGenerated, customActions = {} }) {
  const [showApercu, setShowApercu] = useState(false);

  const html = buildGabaritHTML(identification, permissions, precisions, exigences, customActions);
  const slugify = s => s.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
  const filename = `gabarit-directives-${slugify(identification.cours || 'cours')}-${slugify(identification.evaluation || 'evaluation')}.doc`;

  return (
    <div style={{ padding: '16px 20px', border: '1px solid #b3d9f7', borderRadius: 8, background: '#f7fbff' }}>
      <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: '1.05em', fontWeight: 'bold', color: '#231F20' }}>
        📄 Gabarit Word de déclaration étudiante
      </h3>
      <p style={{ fontSize: '0.88em', color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>
        Gabarit listant chaque action avec le niveau d'autorisation correspondant, à transmettre aux personnes étudiantes.
      </p>
      {!isGenerated && (
        <div style={{ padding: '10px 14px', background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 6, fontSize: '0.88em', color: '#856404', marginBottom: 14 }}>
          ⚠ Générez d'abord vos directives pour activer le téléchargement du gabarit.
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" disabled={!isGenerated}
          onClick={() => setShowApercu(v => !v)}
          style={{ background: isGenerated ? '#6c757d' : '#c0c0c0', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 5, cursor: isGenerated ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.9em' }}>
          {showApercu ? "🙈 Masquer l'aperçu" : "👁 Voir l'aperçu"}
        </button>
        <button type="button" disabled={!isGenerated}
          onClick={() => downloadWord(html, filename)}
          style={{ background: isGenerated ? '#00A4E4' : '#c0c0c0', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 5, cursor: isGenerated ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.9em' }}>
          📥 Télécharger le gabarit Word
        </button>
      </div>
      {showApercu && isGenerated && (
        <div style={{ marginTop: 16, border: '1px solid #ccc', borderRadius: 6, background: 'white', padding: '24px 28px', fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: 1.5, maxHeight: 520, overflowY: 'auto' }}
          dangerouslySetInnerHTML={{ __html: `<style>.gabarit-apercu a{color:#0056b3!important;text-decoration:underline!important;}</style><div class="gabarit-apercu">${html}</div>` }} />
      )}
    </div>
  );
}