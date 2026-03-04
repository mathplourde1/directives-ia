import React, { useState, useRef } from 'react';

const ETAPES = [
"Matériel de préparation à l'évaluation (fiches d'étude, guide de révision, questions préparatoires, etc.)",
"Exécution de l'évaluation (examen, questionnaire, présentation, etc.)",
"Idéation/tempête d'idées (choix d'un sujet, formulation d'une question de recherche, préparation du plan du travail, etc.)",
"Recension d'informations (sources, articles, données, etc.)",
"Analyse des informations (comparaison des données, traduction, etc.)",
"Soutien à la rédaction (cohérence textuelle, transitions, etc.)",
"Soutien à la révision (grammaticale, syntaxique, stylistique, etc.)",
"Mise en forme (textuelle, graphiques, images, diagrammes, etc.)"];


const IA_OPTIONS = ['À déterminer', 'Non autorisée', 'Autorisée avec restrictions', 'Autorisée sans restrictions', 'Obligatoire'];

const GABARITS = {
  'À déterminer': "Plus d'instructions vous seront divulguées ultérieurement.",
  'Non autorisée': "Lors de cette étape, les outils d'IA générative ne sont pas autorisés car ...",
  'Autorisée avec restrictions': "Lors de cette étape, les outils d'IA générative sont autorisés dans ce contexte ... Ils sont interdits dans cet autre contexte ...",
  'Autorisée sans restrictions': "Lors de cette étape, les outils d'IA générative sont autorisés car ...",
  'Obligatoire': "Vous devez utiliser l'outil suivant lors de cette étape ..."
};

const defaultRowState = () => ({
  checked: false,
  ia: '',
  justification: '',
  declaration: '', // 'aucune' | 'requise'
  decl_iagraphie: false,
  decl_traces: false,
  decl_traces_text: '',
  decl_logique: false,
  decl_logique_text: ''
});

const defaultErrors = () => ({
  ia: false,
  justification: false,
  declaration: false,
  declaration_checkbox: false,
  decl_traces_text: false,
  decl_logique_text: false
});

export default function Guide() {
  const [rows, setRows] = useState(ETAPES.map(() => defaultRowState()));
  const [errors, setErrors] = useState(ETAPES.map(() => defaultErrors()));
  const [submitted, setSubmitted] = useState(false);
  const [selections, setSelections] = useState([]);
  const [copyMsgs, setCopyMsgs] = useState({});
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef();

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

  function handleIaChange(i, value) {
    updateRow(i, 'ia', value);
    // Set gabari template only if justification is empty or still a template
    setRows((prev) => {
      const r = prev[i];
      const isTemplate = Object.values(GABARITS).includes(r.justification.trim()) || !r.justification.trim();
      const justification = isTemplate ? GABARITS[value] : r.justification;
      return prev.map((row, idx) => idx === i ? { ...row, ia: value, justification } : row);
    });
    setErrors((prev) => prev.map((e, idx) => idx === i ? { ...e, ia: false, justification: false } : e));
  }

  function validate() {
    let valid = true;
    const newErrors = ETAPES.map(() => defaultErrors());
    let anyChecked = false;

    rows.forEach((r, i) => {
      if (!r.checked) return;
      anyChecked = true;

      if (!r.ia) {newErrors[i].ia = true;valid = false;}
      if (!r.justification.trim()) {newErrors[i].justification = true;valid = false;}
      if (!r.declaration) {newErrors[i].declaration = true;valid = false;}
      if (r.declaration === 'requise') {
        if (!r.decl_iagraphie && !r.decl_traces && !r.decl_logique) {
          newErrors[i].declaration_checkbox = true;valid = false;
        }
        if (r.decl_traces && !r.decl_traces_text.trim()) {newErrors[i].decl_traces_text = true;valid = false;}
        if (r.decl_logique && !r.decl_logique_text.trim()) {newErrors[i].decl_logique_text = true;valid = false;}
      }
    });

    setErrors(newErrors);
    return valid && anyChecked;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const sel = rows.map((r, i) => r.checked ? { etape: ETAPES[i], ...r } : null).filter(Boolean);
    setSelections(sel);
    setSubmitted(true);
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

  // ---- Helper: format declaration exigences as HTML ----
  function formatExigences(s, separator = '<br>') {
    if (s.declaration === 'aucune') return 'Aucune exigence';
    const items = [];
    if (s.decl_iagraphie) items.push('Références et IAgraphie');
    if (s.decl_traces) items.push(`Conserver les traces suivantes : ${s.decl_traces_text}`);
    if (s.decl_logique) items.push(`Expliquer la logique d'utilisation : ${s.decl_logique_text}`);
    return items.join(separator);
  }

  // ---- Build HTML for synthesis table (sections 1 & 2) ----
  function buildTableHTML(sels, withHeading = false) {
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Tableau synthèse</h2>` : '';
    html += `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Étapes</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">L'utilisation des SIAg est…</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Précisions</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Exigences de déclaration</th>
      </tr></thead><tbody>`;
    sels.forEach((s) => {
      html += `<tr>
        <td style="border:1px solid #ccc;padding:8px;">${s.etape}</td>
        <td style="border:1px solid #ccc;padding:8px;">${s.ia}</td>
        <td style="border:1px solid #ccc;padding:8px;">${s.justification.replace(/\n/g, '<br>')}</td>
        <td style="border:1px solid #ccc;padding:8px;">${formatExigences(s)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function buildTextHTML(sels, withHeading = false) {
    const heading = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Synthèse en texte continu</h2>` : '';
    return heading + sels.map((s) =>
    `<p><strong><i>${s.etape}</i></strong></p><p>L'utilisation des SIAg est : <strong>${s.ia}</strong></p><p>${s.justification}</p><p>Exigences de déclaration : ${formatExigences(s)}</p><hr />`
    ).join('');
  }

  // ---- Build HTML for declaration table (section 3) ----
  function buildDeclTableHTML(sels, withHeading = false) {
    let html = withHeading ? `<h2 style="font-family:Arial,sans-serif;">Exigences de déclaration d'utilisation de l'IA</h2><p style="font-family:Arial,sans-serif;">Pour chacune des étapes de réalisation de l'évaluation ci-dessous, vous devez respecter les exigences de déclaration de l'utilisation de systèmes d'intelligence artificielle générative.</p>` : '';
    html += `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
      <thead><tr>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Étapes</th>
        <th style="border:1px solid #ccc;padding:8px;background:#f2f2f2;">Exigences de déclaration</th>
      </tr></thead><tbody>`;
    sels.forEach((s) => {
      let exigences = '';
      if (s.declaration === 'aucune') {
        exigences = 'Aucune exigence';
      } else {
        const items = [];
        if (s.decl_iagraphie) items.push('Références et IAgraphie');
        if (s.decl_traces) items.push(`Conserver les traces suivantes : ${s.decl_traces_text}`);
        if (s.decl_logique) items.push(`Expliquer la logique d'utilisation : ${s.decl_logique_text}`);
        exigences = items.join('<br>');
      }
      html += `<tr>
        <td style="border:1px solid #ccc;padding:8px;">${s.etape}</td>
        <td style="border:1px solid #ccc;padding:8px;">${exigences}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function buildDeclTextHTML(sels) {
    return sels.map((s) => {
      let exigences = '';
      if (s.declaration === 'aucune') {
        exigences = 'Aucune exigence';
      } else {
        const items = [];
        if (s.decl_iagraphie) items.push('Références et IAgraphie');
        if (s.decl_traces) items.push(`Conserver les traces suivantes : ${s.decl_traces_text}`);
        if (s.decl_logique) items.push(`Expliquer la logique d'utilisation : ${s.decl_logique_text}`);
        exigences = items.join('<br>');
      }
      return `<p><strong><i>${s.etape}</i></strong></p><p>${exigences}</p><hr />`;
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
      decl_traces: r.decl_traces,
      decl_traces_text: r.decl_traces_text,
      decl_logique: r.decl_logique,
      decl_logique_text: r.decl_logique_text
    }));

    const escapeXml = (str) => String(str).
    replace(/&/g, '&amp;').
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;').
    replace(/"/g, '&quot;').
    replace(/'/g, '&apos;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<guide-ia version="1.0">\n  <etapes>\n`;
    rowsData.forEach((r) => {
      xml += `    <etape index="${r.index}">\n`;
      xml += `      <checked>${r.checked}</checked>\n`;
      xml += `      <ia>${escapeXml(r.ia)}</ia>\n`;
      xml += `      <justification>${escapeXml(r.justification)}</justification>\n`;
      xml += `      <declaration>${escapeXml(r.declaration)}</declaration>\n`;
      xml += `      <decl_iagraphie>${r.decl_iagraphie}</decl_iagraphie>\n`;
      xml += `      <decl_traces>${r.decl_traces}</decl_traces>\n`;
      xml += `      <decl_traces_text>${escapeXml(r.decl_traces_text)}</decl_traces_text>\n`;
      xml += `      <decl_logique>${r.decl_logique}</decl_logique>\n`;
      xml += `      <decl_logique_text>${escapeXml(r.decl_logique_text)}</decl_logique_text>\n`;
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
        if (etapeNodes.length !== ETAPES.length) {
          setSaveError(`Le fichier ne correspond pas à ce formulaire (${etapeNodes.length} étapes trouvées, ${ETAPES.length} attendues).`);
          return;
        }

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
            decl_traces: get('decl_traces') === 'true',
            decl_traces_text: get('decl_traces_text'),
            decl_logique: get('decl_logique') === 'true',
            decl_logique_text: get('decl_logique_text')
          };
        });

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
        .copy-ok { color: green; font-weight: bold; margin-left: 10px; }
        .save-section { margin-top: 32px; padding: 16px; border: 1px solid #ccc; border-radius: 8px; background: white; }
        .decl-sub { margin-left: 20px; margin-top: 6px; }
        textarea.justification-field { border: 2px solid #E41E25; background-color: #fff4f4; padding: 8px; font-family: inherit; width: 98%; }
        .radio-disabled label, .radio-disabled input { color: #999; pointer-events: none; }
      `}</style>

      <h1 className="text-2xl font-semibold">Guide interactif de rédaction de directives IA</h1>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        Développé de manière insouciante par vibecoding par Mathieu Plourde, CC-By 2026 (version alpha 4)<br /><br />
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <table className="main-table">
          <thead>
            <tr>
              <th>Étapes</th>
              <th>L’utilisation des SIAg est… <span className="required">*</span></th>
              <th>Personnalisation des directives <span className="required">*</span></th>
              <th>Exigences de déclaration <span className="required">*</span></th>
            </tr>
          </thead>
          <tbody>
            {ETAPES.map((etape, i) => {
              const r = rows[i];
              const err = errors[i];
              const disabled = !r.checked;
              return (
                <tr key={i}>
                  {/* Col 1: Étape checkbox */}
                  <td>
                    <input
                      type="checkbox"
                      id={`etape_${i}`}
                      checked={r.checked}
                      onChange={(e) => handleCheckbox(i, e.target.checked)} />

                    <label htmlFor={`etape_${i}`} className="step-label"> {etape}</label>
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
                    <textarea
                      className="justification-field"
                      rows={8}
                      value={r.justification}
                      onChange={(e) => updateRow(i, 'justification', e.target.value)}
                      placeholder="Entrez la justification"
                      style={err.justification ? { ...inputErrorBorder, width: '98%', padding: 8 } : {}} />

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
                                  <textarea
                              rows={3}
                              style={{ width: '95%', marginTop: 4, display: 'block', fontFamily: 'inherit', padding: 6, ...(err.decl_traces_text ? inputErrorBorder : { border: '1px solid #ccc' }) }}
                              placeholder="Instructions supplémentaires (requis)"
                              value={r.decl_traces_text}
                              onChange={(e) => {updateRow(i, 'decl_traces_text', e.target.value);}} />

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
                                  <textarea
                              rows={3}
                              style={{ width: '95%', marginTop: 4, display: 'block', fontFamily: 'inherit', padding: 6, ...(err.decl_logique_text ? inputErrorBorder : { border: '1px solid #ccc' }) }}
                              placeholder="Instructions supplémentaires (requis)"
                              value={r.decl_logique_text}
                              onChange={(e) => {updateRow(i, 'decl_logique_text', e.target.value);}} />

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
                </tr>);

            })}
          </tbody>
        </table>
        <br />
        <button type="submit" className="btn-primary">Soumettre</button>
      </form>

      {/* ===== SYNTHESIS SECTIONS ===== */}
      {submitted &&
      <div id="synthese-container">

          {/* Section 1: Tableau synthèse */}
          <SyntheseSection
          title="Tableau synthèse"
          onCopyBrio={() => copyRichText(buildTableHTML(selections), 's1-brio')}
          onDownloadWord={() => downloadWord(buildTableHTML(selections, true), 'tableau-synthese.doc')}
          copyOk={copyMsgs['s1-brio']}>

            <table className="synth-table">
              <thead>
                <tr>
                  <th>Étapes</th>
                  <th>L'utilisation des SIAg est…</th>
                  <th>Précisions</th>
                  <th>Exigences de déclaration</th>
                </tr>
              </thead>
              <tbody>
                {selections.map((s, i) =>
              <tr key={i}>
                    <td>{s.etape}</td>
                    <td>{s.ia}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{s.justification}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{formatExigences(s, '\n')}</td>
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
          onDownloadWord={() => downloadWord(buildDeclTableHTML(selections), 'exigences-declaration.doc')}
          copyOk={copyMsgs['s3-brio']}>

            <p style={{ marginBottom: 12 }}>
              Pour chacune des étapes de réalisation de l'évaluation ci-dessous, vous devez respecter les exigences de déclaration de l'utilisation de systèmes d'intelligence artificielle générative.
            </p>
            <table className="synth-table">
              <thead>
                <tr>
                  <th>Étapes</th>
                  <th>Exigences de déclaration</th>
                </tr>
              </thead>
              <tbody>
                {selections.map((s, i) => {
                let exigences = '';
                if (s.declaration === 'aucune') {
                  exigences = 'Aucune exigence';
                } else {
                  const items = [];
                  if (s.decl_iagraphie) items.push('Références et IAgraphie');
                  if (s.decl_traces) items.push(`Conserver les traces suivantes : ${s.decl_traces_text}`);
                  if (s.decl_logique) items.push(`Expliquer la logique d'utilisation : ${s.decl_logique_text}`);
                  exigences = items.join('\n');
                }
                return (
                  <tr key={i}>
                      <td>{s.etape}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{exigences}</td>
                    </tr>);

              })}
              </tbody>
            </table>
          </SyntheseSection>
        </div>
      }

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

function SyntheseSection({ title, children, onCopyBrio, onDownloadWord, copyOk }) {
  return (
    <div className="synthese-section">
      <h2 className="my-2 text-lg font-semibold text-center">{title}</h2>
      {children}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <button type="button" className="btn-primary" onClick={onCopyBrio}>Copier pour coller en ligne (Brio)</button>
        {copyOk && <span className="copy-ok">Copié !</span>}
        <button type="button" className="btn-secondary" onClick={onDownloadWord}>Télécharger en format Word</button>
      </div>
    </div>);

}