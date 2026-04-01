import React, { useState } from 'react';
import BLOOM_CATEGORIES, { PERMISSION_LEVELS } from './restrictionsData';

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildGabaritHTML(identification, allActions, permissions, precisions, exigences = []) {
  const cours = escHtml(identification.cours || '[cours]');
  const evaluation = escHtml(identification.evaluation || '[évaluation]');
  const session = escHtml(identification.session || '[session]');
  const enseignants = escHtml(identification.enseignants || '[personne enseignante]');

  const title = `<h1 style="font-family:Georgia,serif;font-size:22px;font-weight:bold;text-align:center;margin:0 0 14pt 0;padding-bottom:8pt;border-bottom:1px solid black;color:#000;">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)</h1>`;
  const intro = `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 8pt 0;">Je, <strong>[NOM]</strong> (groupe <strong>[GROUPE]</strong>), soumets cette déclaration dans le cadre de l'évaluation nommée <strong>${evaluation}</strong> du cours <strong>${cours}</strong> de la session <strong>${session}</strong>, enseigné par <strong>${enseignants}</strong>.</p>
<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 16pt 0;">Conformément aux exigences de la personne enseignante, les renseignements suivants présentent ma démarche.</p>`;

  let body = '';
  // allActions is already the flat ordered list passed from parent (active only, across all categories)
  // Group by category using categoryActions map
  const catMap = {};
  BLOOM_CATEGORIES.forEach(cat => { catMap[cat.id] = cat; });

  // Build per-category buckets preserving order from allActions
  const catBuckets = {};
  for (const action of allActions) {
    // Find which category this action belongs to (by id prefix or explicit catId)
    let catId = action.catId;
    if (!catId) {
      // derive from id: connaitre-1 -> connaitre, analyser-1 -> analyser, creer-1 -> creer, custom-connaitre-... -> connaitre
      const match = action.id.match(/^(?:custom-)?([a-z]+)-/);
      catId = match ? match[1] : null;
    }
    if (!catId || !catMap[catId]) continue;
    if (!catBuckets[catId]) catBuckets[catId] = [];
    catBuckets[catId].push(action);
  }

  for (const cat of BLOOM_CATEGORIES) {
    const catActions = catBuckets[cat.id] || [];
    if (catActions.length === 0) continue;

    body += `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:14pt 0 4pt 0;color:#000;border-bottom:2px solid #ddd;padding-bottom:4pt;">${escHtml(cat.libelle)}</h2>`;
    body += `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:9pt;margin-bottom:6pt;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;font-weight:bold;width:40%">Permissions SIA</th>
        <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2;font-weight:bold;width:60%">Actions SIA</th>
      </tr></thead><tbody>`;

    PERMISSION_LEVELS.forEach(level => {
      const levelActions = catActions.filter(a => (permissions[a.id] || 'non') === level.id);
      if (levelActions.length === 0) return;
      const items = levelActions.map(a => `<li style="font-weight:normal;margin:1pt 0;">${escHtml(a.libelle || 'Action personnalisée')}</li>`).join('');
      body += `<tr>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top;color:${level.color};font-weight:bold;">${escHtml(level.libelle)}</td>
        <td style="border:1px solid #ccc;padding:6px;vertical-align:top;"><ul style="margin:0;padding-left:16px;">${items}</ul></td>
      </tr>`;
    });
    body += '</tbody></table>';

    const catPrec = precisions[cat.id] || '';
    if (catPrec) body += `<p style="font-family:Arial,sans-serif;font-size:9pt;color:#444;margin:0 0 10pt 0;"><em>Précisions :</em> ${escHtml(catPrec)}</p>`;
  }

  // Exigences de déclaration
  let exigencesBlock = '';
  if (exigences && exigences.length > 0) {
    const typeLabels = { iagraphie: 'Références et IAgraphie', traces: 'Conserver les traces', logique: 'Expliquer la logique d\'utilisation' };
    exigencesBlock += `<h2 style="font-family:Georgia,serif;font-size:14pt;font-weight:bold;margin:14pt 0 4pt 0;color:#000;border-bottom:2px solid #ddd;padding-bottom:4pt;">Exigences de déclaration</h2>`;
    exigences.forEach(exig => {
      const label = typeLabels[exig.type] || exig.type;
      exigencesBlock += `<p style="font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;margin:10pt 0 2pt 0;">${escHtml(label)}</p>`;
      if (exig.description) {
        exigencesBlock += `<div style="font-family:Arial,sans-serif;font-size:10pt;color:#444;margin:0 0 6pt 0;">${exig.description}</div>`;
      }
      exigencesBlock += `<p style="font-family:Arial,sans-serif;font-size:10pt;margin:2pt 0 0 0;color:#555;font-style:italic;">Réponse :</p>`;
      exigencesBlock += `<div style="border:1px solid #aaa;border-radius:4px;min-height:80px;margin:4pt 0 14pt 0;padding:6px;background:#fafafa;">&nbsp;</div>`;
    });
  }

  const declarationSupp = `<p style="font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;margin:14pt 0 2pt 0;">Déclaration supplémentaire ou commentaires sur l'utilisation des SIA pour cette évaluation :</p>
<div style="border:1px solid #aaa;border-radius:4px;min-height:80px;margin:4pt 0 16pt 0;padding:6px;background:#fafafa;">&nbsp;</div>`;

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
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RestrictionsGabarit({ identification, allActions, permissions, precisions, exigences, isGenerated }) {
  const [showApercu, setShowApercu] = useState(false);

  const html = buildGabaritHTML(identification, allActions, permissions, precisions, exigences);
  const slugify = s => s.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
  const filename = `gabarit-restrictions-${slugify(identification.cours || 'cours')}-${slugify(identification.evaluation || 'evaluation')}.doc`;

  return (
    <div style={{ padding: '16px 20px', border: '1px solid #b3d9f7', borderRadius: 8, background: '#f7fbff' }}>
      <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: '1.05em', fontWeight: 'bold', color: '#231F20' }}>
        📄 Gabarit Word de déclaration étudiante
      </h3>
      <p style={{ fontSize: '0.88em', color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>
        Gabarit filtré listant chaque action avec le niveau d'autorisation correspondant, à transmettre aux personnes étudiantes.
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
          dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}