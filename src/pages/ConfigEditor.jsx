import React, { useState, useRef } from 'react';
import ETAPES_DEFAULT from '@/components/etapesData';
import exemplesDirectivesDefault from '@/components/exemplesDirectives.json';
import exemplesDeclarationsDefault from '@/components/exemplesDeclarations';

const CONTENT_OPTIONS = [
  { value: 'etapes', label: 'Étapes' },
  { value: 'directives', label: 'Exemples de directives' },
  { value: 'declarations', label: 'Exemples de déclarations' },
];

const NIVEAU_LABELS = {
  non: 'Non autorisée',
  aar: 'Autorisée avec restrictions',
  asr: 'Autorisée sans restrictions',
  obl: 'Obligatoire',
};

const NIVEAUX = ['non', 'aar', 'asr', 'obl'];
const ETAPE_IDS = ETAPES_DEFAULT.map(e => e.id);

const niveauColors = {
  non: { background: '#fde8e8', color: '#7b1d1d' },
  aar: { background: '#fff3cd', color: '#856404' },
  asr: { background: '#d4edda', color: '#155724' },
  obl: { background: '#cce5ff', color: '#004085' },
};

export default function ConfigEditor() {
  const [contentType, setContentType] = useState('etapes');
  const [data, setData] = useState({
    etapes: [...ETAPES_DEFAULT],
    directives: [...exemplesDirectivesDefault],
    declarations: [...exemplesDeclarationsDefault],
  });
  const [jsonText, setJsonText] = useState(JSON.stringify(ETAPES_DEFAULT, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef();

  const handleTypeChange = (type) => {
    setContentType(type);
    setJsonText(JSON.stringify(data[type], null, 2));
    setJsonError(null);
    setEditingIndex(null);
    setEditingItem(null);
  };

  const syncDataToJson = (newData, type) => {
    setData(prev => ({ ...prev, [type]: newData }));
    setJsonText(JSON.stringify(newData, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Le JSON doit être un tableau (array).');
      setData(prev => ({ ...prev, [contentType]: parsed }));
      setJsonError(null);
      if (editingIndex !== null) { setEditingIndex(null); setEditingItem(null); }
    } catch (e) {
      setJsonError(e.message);
    }
  };

  const handleDelete = (index) => {
    if (!window.confirm('Supprimer cet item ?')) return;
    const newData = data[contentType].filter((_, i) => i !== index);
    syncDataToJson(newData, contentType);
    if (editingIndex === index) { setEditingIndex(null); setEditingItem(null); }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditingItem({ ...data[contentType][index] });
  };

  const handleSaveEdit = () => {
    const newData = data[contentType].map((item, i) => i === editingIndex ? editingItem : item);
    syncDataToJson(newData, contentType);
    setEditingIndex(null);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingItem(null);
  };

  const handleAdd = () => {
    let newItem = {};
    if (contentType === 'etapes') {
      newItem = { id: 'nouveau_' + Date.now(), libelle: 'Nouvelle étape', parenthese: '', sequence: data.etapes.length + 1 };
    } else if (contentType === 'directives') {
      newItem = { parent: 'recherche', niveau: 'non', court: '', exemple: '', sequence: 1 };
    } else {
      newItem = { code: 'iagraphie', sequence: 1, court: '', exemple: '' };
    }
    const newData = [...data[contentType], newItem];
    syncDataToJson(newData, contentType);
    setEditingIndex(newData.length - 1);
    setEditingItem({ ...newItem });
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = contentType === 'etapes' ? 'etapesData.json'
      : contentType === 'directives' ? 'exemplesDirectives.json'
      : 'exemplesDeclarations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) throw new Error('Le fichier doit contenir un tableau JSON.');
        syncDataToJson(parsed, contentType);
        setImportError(null);
        setEditingIndex(null);
        setEditingItem(null);
      } catch (err) {
        setImportError(err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadWord = () => {
    const items = data[contentType];
    const label = CONTENT_OPTIONS.find(o => o.value === contentType)?.label || contentType;
    let tableHtml = '';

    if (contentType === 'etapes') {
      tableHtml = `<table border="1" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:11pt;">
        <thead><tr style="background:#f2f2f2;">
          <th style="padding:8px">ID</th><th style="padding:8px">Libellé</th><th style="padding:8px">Parenthèse</th><th style="padding:8px">Séquence</th>
        </tr></thead><tbody>
        ${items.map(e => `<tr><td style="padding:8px">${e.id}</td><td style="padding:8px">${e.libelle}</td><td style="padding:8px">${e.parenthese || ''}</td><td style="padding:8px">${e.sequence}</td></tr>`).join('')}
        </tbody></table>`;
    } else if (contentType === 'directives') {
      tableHtml = `<table border="1" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:11pt;">
        <thead><tr style="background:#f2f2f2;">
          <th style="padding:8px">Étape</th><th style="padding:8px">Niveau</th><th style="padding:8px">Court</th><th style="padding:8px">Exemple</th><th style="padding:8px">Séq.</th>
        </tr></thead><tbody>
        ${items.map(d => `<tr><td style="padding:8px">${d.parent}</td><td style="padding:8px">${NIVEAU_LABELS[d.niveau] || d.niveau}</td><td style="padding:8px">${d.court}</td><td style="padding:8px">${d.exemple}</td><td style="padding:8px">${d.sequence}</td></tr>`).join('')}
        </tbody></table>`;
    } else {
      tableHtml = `<table border="1" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:11pt;">
        <thead><tr style="background:#f2f2f2;">
          <th style="padding:8px">Code</th><th style="padding:8px">Séq.</th><th style="padding:8px">Court</th><th style="padding:8px">Exemple</th>
        </tr></thead><tbody>
        ${items.map(d => `<tr><td style="padding:8px">${d.code}</td><td style="padding:8px">${d.sequence}</td><td style="padding:8px">${d.court}</td><td style="padding:8px">${d.exemple}</td></tr>`).join('')}
        </tbody></table>`;
    }

    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>${label}</title></head>
      <body><h1 style="font-family:Arial;font-size:14pt;">${label}</h1>${tableHtml}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${contentType}.doc`; a.click();
    URL.revokeObjectURL(url);
  };

  // Styles
  const thS = { border: '1px solid #ccc', padding: '7px 10px', background: '#f5f5f5', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '0.82em' };
  const tdS = { border: '1px solid #e5e7eb', padding: '6px 9px', verticalAlign: 'top', fontSize: '0.83em' };
  const inputS = { width: '100%', padding: '3px 6px', border: '1px solid #aaa', borderRadius: 3, fontFamily: 'inherit', fontSize: '0.9em', boxSizing: 'border-box' };
  const selS = { padding: '3px 6px', border: '1px solid #aaa', borderRadius: 3, fontFamily: 'inherit', fontSize: '0.9em', width: '100%' };
  const idBadge = { background: '#e8f4fd', color: '#0056b3', padding: '2px 7px', borderRadius: 10, fontSize: '0.82em', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'inline-block' };
  const btnE = { background: '#00A4E4', color: 'white', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: '0.85em', marginRight: 3 };
  const btnD = { background: '#E41E25', color: 'white', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: '0.85em' };
  const btnOk = { background: '#28a745', color: 'white', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: '0.85em', marginRight: 3 };
  const btnCx = { background: '#6c757d', color: 'white', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: '0.85em' };
  const editRowBg = { background: '#fffde7' };
  const altRowBg = (i) => ({ background: i % 2 === 0 ? 'white' : '#fafafa' });

  const renderEditRow = (item, setter, isEtape, isDirective) => (
    <>
      {isEtape && <td style={tdS}><span style={idBadge}>{item.id}</span></td>}
      {isDirective && (
        <td style={tdS}>
          <select value={item.parent || ''} onChange={e => setter(p => ({ ...p, parent: e.target.value }))} style={selS}>
            {ETAPE_IDS.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </td>
      )}
      {isDirective && (
        <td style={tdS}>
          <select value={item.niveau || ''} onChange={e => setter(p => ({ ...p, niveau: e.target.value }))} style={selS}>
            {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </td>
      )}
      {!isEtape && !isDirective && (
        <td style={tdS}>
          <select value={item.code || ''} onChange={e => setter(p => ({ ...p, code: e.target.value }))} style={selS}>
            {['iagraphie', 'traces', 'logique'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>
      )}
      {!isDirective && <td style={tdS}><input type="number" value={item.sequence || ''} onChange={e => setter(p => ({ ...p, sequence: parseInt(e.target.value) || 0 }))} style={{ ...inputS, width: 56 }} /></td>}
      {isEtape && <td style={tdS}><input value={item.libelle || ''} onChange={e => setter(p => ({ ...p, libelle: e.target.value }))} style={inputS} /></td>}
      {isEtape && <td style={tdS}><input value={item.parenthese || ''} onChange={e => setter(p => ({ ...p, parenthese: e.target.value }))} style={inputS} /></td>}
      {!isEtape && <td style={tdS}><input value={item.court || ''} onChange={e => setter(p => ({ ...p, court: e.target.value }))} style={inputS} /></td>}
      {!isEtape && <td style={{ ...tdS, maxWidth: 260 }}><textarea value={item.exemple || ''} onChange={e => setter(p => ({ ...p, exemple: e.target.value }))} rows={3} style={{ ...inputS, resize: 'vertical' }} /></td>}
      {isDirective && <td style={tdS}><input type="number" value={item.sequence || ''} onChange={e => setter(p => ({ ...p, sequence: parseInt(e.target.value) || 0 }))} style={{ ...inputS, width: 56 }} /></td>}
    </>
  );

  const renderTable = () => {
    const items = data[contentType];

    if (contentType === 'etapes') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
          <thead><tr>
            <th style={thS}>ID <span style={{ color: '#999', fontWeight: 'normal' }}>(fixe)</span></th>
            <th style={thS}>Séq.</th>
            <th style={thS}>Libellé</th>
            <th style={thS}>Parenthèse</th>
            <th style={thS}>Actions</th>
          </tr></thead>
          <tbody>
            {items.map((item, i) => editingIndex === i ? (
              <tr key={i} style={editRowBg}>
                {renderEditRow(editingItem, setEditingItem, true, false)}
                <td style={tdS}><button onClick={handleSaveEdit} style={btnOk}>✔</button><button onClick={handleCancelEdit} style={btnCx}>✕</button></td>
              </tr>
            ) : (
              <tr key={i} style={altRowBg(i)}>
                <td style={tdS}><span style={idBadge}>{item.id}</span></td>
                <td style={tdS}>{item.sequence}</td>
                <td style={tdS}><strong>{item.libelle}</strong></td>
                <td style={{ ...tdS, color: '#555', maxWidth: 280 }}>{item.parenthese}</td>
                <td style={tdS}><button onClick={() => handleEdit(i)} style={btnE}>✎</button><button onClick={() => handleDelete(i)} style={btnD}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (contentType === 'directives') {
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83em' }}>
          <thead><tr>
            <th style={thS}>Étape</th>
            <th style={thS}>Niveau</th>
            <th style={thS}>Court</th>
            <th style={thS}>Exemple</th>
            <th style={thS}>Séq.</th>
            <th style={thS}>Actions</th>
          </tr></thead>
          <tbody>
            {items.map((item, i) => editingIndex === i ? (
              <tr key={i} style={editRowBg}>
                {renderEditRow(editingItem, setEditingItem, false, true)}
                <td style={tdS}><button onClick={handleSaveEdit} style={btnOk}>✔</button><button onClick={handleCancelEdit} style={btnCx}>✕</button></td>
              </tr>
            ) : (
              <tr key={i} style={altRowBg(i)}>
                <td style={tdS}><span style={idBadge}>{item.parent}</span></td>
                <td style={{ ...tdS, ...(niveauColors[item.niveau] || {}), fontWeight: 'bold', fontSize: '0.82em' }}>{NIVEAU_LABELS[item.niveau] || item.niveau}</td>
                <td style={{ ...tdS, maxWidth: 180 }}>{item.court}</td>
                <td style={{ ...tdS, maxWidth: 260, color: '#333' }}>{item.exemple}</td>
                <td style={tdS}>{item.sequence}</td>
                <td style={tdS}><button onClick={() => handleEdit(i)} style={btnE}>✎</button><button onClick={() => handleDelete(i)} style={btnD}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // declarations
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83em' }}>
        <thead><tr>
          <th style={thS}>Code</th>
          <th style={thS}>Séq.</th>
          <th style={thS}>Court</th>
          <th style={thS}>Exemple</th>
          <th style={thS}>Actions</th>
        </tr></thead>
        <tbody>
          {items.map((item, i) => editingIndex === i ? (
            <tr key={i} style={editRowBg}>
              {renderEditRow(editingItem, setEditingItem, false, false)}
              <td style={tdS}><button onClick={handleSaveEdit} style={btnOk}>✔</button><button onClick={handleCancelEdit} style={btnCx}>✕</button></td>
            </tr>
          ) : (
            <tr key={i} style={altRowBg(i)}>
              <td style={tdS}><span style={idBadge}>{item.code}</span></td>
              <td style={tdS}>{item.sequence}</td>
              <td style={{ ...tdS, maxWidth: 200 }}>{item.court}</td>
              <td style={{ ...tdS, maxWidth: 300, color: '#333' }}>{item.exemple}</td>
              <td style={tdS}><button onClick={() => handleEdit(i)} style={btnE}>✎</button><button onClick={() => handleDelete(i)} style={btnD}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ background: '#F2F2F2', minHeight: '100vh', padding: 20, color: '#231F20' }}>
      <style>{`
        .btn-prim { background:#00A4E4; color:white; border:none; padding:7px 16px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:0.88em; }
        .btn-prim:hover { background:#0084b0; }
        .btn-sec { background:#6c757d; color:white; border:none; padding:7px 16px; border-radius:5px; cursor:pointer; font-size:0.88em; }
        .btn-sec:hover { background:#545b62; }
        .btn-grn { background:#28a745; color:white; border:none; padding:7px 16px; border-radius:5px; cursor:pointer; font-size:0.88em; }
        .btn-grn:hover { background:#1e7e34; }
        .btn-wrd { background:#2b579a; color:white; border:none; padding:7px 16px; border-radius:5px; cursor:pointer; font-size:0.88em; }
        .btn-wrd:hover { background:#1e3f70; }
      `}</style>

      <h1 style={{ margin: '0 0 14px 0', fontSize: '1.3em', color: '#E41E25' }}>Éditeur de contenus</h1>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ background: 'white', padding: '5px 12px', borderRadius: 6, border: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.88em', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Contenu :</label>
          <select value={contentType} onChange={e => handleTypeChange(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '0.93em', cursor: 'pointer', outline: 'none' }}>
            {CONTENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button className="btn-grn" onClick={handleAdd}>+ Ajouter</button>
        <button className="btn-prim" onClick={handleDownloadJson}>⬇ JSON</button>
        <button className="btn-sec" onClick={() => fileInputRef.current?.click()}>📂 Importer JSON</button>
        <button className="btn-wrd" onClick={handleDownloadWord}>📄 Exporter Word</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        {importError && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ {importError}</span>}
      </div>

      {/* Status bar */}
      <div style={{ marginBottom: 10, fontSize: '0.82em', color: '#666' }}>
        {data[contentType].length} items —{' '}
        {jsonError
          ? <span style={{ color: '#E41E25' }}>⚠ JSON invalide : {jsonError}</span>
          : <span style={{ color: '#28a745' }}>✔ JSON valide</span>}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>

        {/* LEFT: JSON editor */}
        <div style={{ background: 'white', borderRadius: 8, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9em', marginBottom: 6, color: '#333' }}>Éditeur JSON</div>
          <p style={{ fontSize: '0.78em', color: '#888', margin: '0 0 8px 0' }}>Modifiez directement. Les changements se reflètent dans le tableau à droite.</p>
          <textarea
            value={jsonText}
            onChange={e => handleJsonChange(e.target.value)}
            style={{
              width: '100%', height: '68vh', fontFamily: 'monospace', fontSize: '0.78em',
              border: jsonError ? '2px solid #E41E25' : '2px solid #ddd',
              background: jsonError ? '#fff4f4' : 'white',
              borderRadius: 5, padding: 10, resize: 'none', boxSizing: 'border-box'
            }}
          />
          {jsonError && <p style={{ color: '#E41E25', fontSize: '0.8em', marginTop: 4 }}>⚠ {jsonError}</p>}
        </div>

        {/* RIGHT: Human-readable table */}
        <div style={{ background: 'white', borderRadius: 8, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9em', marginBottom: 6, color: '#333' }}>Rendu lisible</div>
          <p style={{ fontSize: '0.78em', color: '#888', margin: '0 0 8px 0' }}>Modifiez les items ici — le JSON se synchronise automatiquement.</p>
          {contentType === 'etapes' && (
            <p style={{ fontSize: '0.78em', color: '#888', margin: '0 0 8px 0', background: '#fff8e1', padding: '4px 8px', borderRadius: 4, border: '1px solid #ffe082' }}>
              ⚠ L'ID des étapes est fixe et non modifiable (référencé par d'autres composants).
            </p>
          )}
          <div style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
            {renderTable()}
          </div>
        </div>
      </div>
    </div>
  );
}