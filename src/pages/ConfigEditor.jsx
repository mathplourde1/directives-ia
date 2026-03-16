import React, { useState, useRef } from 'react';
import ETAPES_DEFAULT from '@/components/etapesData';
import exemplesDirectivesDefault from '@/components/exemplesDirectives.json';
import exemplesDeclarationsDefault from '@/components/exemplesDeclarations';
import ItemEditorModal from '@/components/ItemEditorModal';

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
const NIVEAUX_ORDER = { non: 0, aar: 1, asr: 2, obl: 3 };
const niveauColors = {
  non: { background: '#fde8e8', color: '#7b1d1d' },
  aar: { background: '#fff3cd', color: '#856404' },
  asr: { background: '#d4edda', color: '#155724' },
  obl: { background: '#cce5ff', color: '#004085' },
};
const ETAPE_IDS = ETAPES_DEFAULT.map(e => e.id);

const getItemKey = (item, type) => {
  if (type === 'etapes') return item.id || '';
  if (type === 'directives') return `${item.parent}|${item.niveau}|${item.sequence}|${item.court}`;
  return `${item.code}|${item.sequence}|${item.court}`;
};

const sortNaturally = (items, type) => {
  if (type === 'etapes') return [...items].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  if (type === 'directives') return [...items].sort((a, b) => {
    const pi = ETAPE_IDS.indexOf(a.parent) - ETAPE_IDS.indexOf(b.parent);
    if (pi !== 0) return pi;
    const ni = (NIVEAUX_ORDER[a.niveau] || 0) - (NIVEAUX_ORDER[b.niveau] || 0);
    if (ni !== 0) return ni;
    return (a.sequence || 0) - (b.sequence || 0);
  });
  return [...items].sort((a, b) => {
    if (a.code !== b.code) return String(a.code).localeCompare(String(b.code));
    return (a.sequence || 0) - (b.sequence || 0);
  });
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
  const [modifiedKeys, setModifiedKeys] = useState({ etapes: new Set(), directives: new Set(), declarations: new Set() });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [modalIsNew, setModalIsNew] = useState(false);
  const [modalEditOrigIndex, setModalEditOrigIndex] = useState(null);

  // Filters / sort
  const [keyword, setKeyword] = useState('');
  const [filterParent, setFilterParent] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef();

  // ── Helpers ──
  const syncDataToJson = (newData, type) => {
    setData(prev => ({ ...prev, [type]: newData }));
    setJsonText(JSON.stringify(newData, null, 2));
    setJsonError(null);
  };

  const addModifiedKey = (item, type) => {
    setModifiedKeys(prev => ({ ...prev, [type]: new Set([...prev[type], getItemKey(item, type)]) }));
  };

  const clearModified = (type) => {
    setModifiedKeys(prev => ({ ...prev, [type]: new Set() }));
  };

  // ── Type change ──
  const handleTypeChange = (type) => {
    setContentType(type);
    setJsonText(JSON.stringify(data[type], null, 2));
    setJsonError(null);
    setKeyword(''); setFilterParent(''); setFilterNiveau(''); setFilterCode('');
    setSortCol(null);
  };

  // ── JSON editor ──
  const handleJsonChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Le JSON doit être un tableau (array).');
      setData(prev => ({ ...prev, [contentType]: parsed }));
      clearModified(contentType);
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  // ── Add ──
  const handleAdd = () => {
    const items = data[contentType];
    let newItem = {};
    if (contentType === 'etapes') {
      newItem = { id: 'nouveau_' + Date.now(), libelle: '', parenthese: '', sequence: items.length ? Math.max(...items.map(i => i.sequence || 0)) + 1 : 1 };
    } else if (contentType === 'directives') {
      const siblings = items.filter(i => i.parent === 'recherche' && i.niveau === 'non');
      newItem = { parent: 'recherche', niveau: 'non', court: '', exemple: '', sequence: siblings.length ? Math.max(...siblings.map(i => i.sequence || 0)) + 1 : 1 };
    } else {
      const siblings = items.filter(i => i.code === 'iagraphie');
      newItem = { code: 'iagraphie', sequence: siblings.length ? Math.max(...siblings.map(i => i.sequence || 0)) + 1 : 1, court: '', exemple: '' };
    }
    setModalItem(newItem);
    setModalIsNew(true);
    setModalEditOrigIndex(null);
    setModalOpen(true);
  };

  // ── Edit ──
  const handleEdit = (origIndex) => {
    setModalItem({ ...data[contentType][origIndex] });
    setModalIsNew(false);
    setModalEditOrigIndex(origIndex);
    setModalOpen(true);
  };

  // ── Delete ──
  const handleDelete = (origIndex) => {
    if (!window.confirm('Supprimer cet item ?')) return;
    syncDataToJson(data[contentType].filter((_, i) => i !== origIndex), contentType);
  };

  // ── Modal save ──
  const handleModalSave = (savedItem) => {
    let newData;
    if (modalIsNew) {
      newData = sortNaturally([...data[contentType], savedItem], contentType);
    } else {
      newData = data[contentType].map((item, i) => i === modalEditOrigIndex ? savedItem : item);
    }
    syncDataToJson(newData, contentType);
    addModifiedKey(savedItem, contentType);
    setModalOpen(false);
    setModalItem(null);
  };

  // ── Import ──
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) throw new Error('Le fichier doit contenir un tableau JSON.');
        syncDataToJson(parsed, contentType);
        clearModified(contentType);
        setImportError(null);
      } catch (err) { setImportError(err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Downloads ──
  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = contentType === 'etapes' ? 'etapesData.json' : contentType === 'directives' ? 'exemplesDirectives.json' : 'exemplesDeclarations.json';
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    const items = data[contentType];
    const label = CONTENT_OPTIONS.find(o => o.value === contentType)?.label || contentType;
    let rows = '';
    let headers = '';
    if (contentType === 'etapes') {
      headers = '<tr style="background:#f2f2f2;"><th style="padding:8px">ID</th><th style="padding:8px">Séq.</th><th style="padding:8px">Libellé</th><th style="padding:8px">Parenthèse</th></tr>';
      rows = items.map(e => `<tr><td style="padding:8px">${e.id}</td><td style="padding:8px">${e.sequence}</td><td style="padding:8px">${e.libelle}</td><td style="padding:8px">${e.parenthese || ''}</td></tr>`).join('');
    } else if (contentType === 'directives') {
      headers = '<tr style="background:#f2f2f2;"><th style="padding:8px">Étape</th><th style="padding:8px">Niveau</th><th style="padding:8px">Court</th><th style="padding:8px">Exemple</th><th style="padding:8px">Séq.</th></tr>';
      rows = items.map(d => `<tr><td style="padding:8px">${d.parent}</td><td style="padding:8px">${NIVEAU_LABELS[d.niveau] || d.niveau}</td><td style="padding:8px">${d.court}</td><td style="padding:8px">${d.exemple}</td><td style="padding:8px">${d.sequence}</td></tr>`).join('');
    } else {
      headers = '<tr style="background:#f2f2f2;"><th style="padding:8px">Code</th><th style="padding:8px">Séq.</th><th style="padding:8px">Court</th><th style="padding:8px">Exemple</th></tr>';
      rows = items.map(d => `<tr><td style="padding:8px">${d.code}</td><td style="padding:8px">${d.sequence}</td><td style="padding:8px">${d.court}</td><td style="padding:8px">${d.exemple}</td></tr>`).join('');
    }
    const tableHtml = `<table border="1" style="border-collapse:collapse;width:100%;font-family:Arial;font-size:11pt;"><thead>${headers}</thead><tbody>${rows}</tbody></table>`;
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"></head><body><h1 style="font-family:Arial;font-size:14pt;">${label}</h1>${tableHtml}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${contentType}.doc`; a.click(); URL.revokeObjectURL(url);
  };

  // ── Filter / Sort ──
  const hasFilters = keyword || filterParent || filterNiveau || filterCode || sortCol;

  const clearFilters = () => {
    setKeyword(''); setFilterParent(''); setFilterNiveau(''); setFilterCode(''); setSortCol(null);
  };

  const handleSortClick = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const getFiltered = () => {
    let items = data[contentType].map((item, i) => ({ ...item, _origIndex: i }));
    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter(item =>
        Object.entries(item).some(([k, v]) => !k.startsWith('_') && typeof v === 'string' && v.toLowerCase().includes(kw))
      );
    }
    if (contentType === 'directives') {
      if (filterParent) items = items.filter(i => i.parent === filterParent);
      if (filterNiveau) items = items.filter(i => i.niveau === filterNiveau);
    }
    if (contentType === 'declarations') {
      if (filterCode) items = items.filter(i => i.code === filterCode);
    }
    if (sortCol) {
      items = [...items].sort((a, b) => {
        const av = a[sortCol] ?? ''; const bv = b[sortCol] ?? '';
        const cmp = (typeof av === 'number' && typeof bv === 'number') ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  };

  const isModified = (item) => modifiedKeys[contentType].has(getItemKey(item, contentType));

  // ── Styles ──
  const thBase = { border: '1px solid #ccc', padding: '7px 10px', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '0.82em' };
  const thS = { ...thBase, background: '#f0f0f0', cursor: 'pointer', userSelect: 'none' };
  const thFixed = { ...thBase, background: '#f0f0f0', cursor: 'default' };
  const tdS = { border: '1px solid #e5e7eb', padding: '6px 9px', verticalAlign: 'top', fontSize: '0.83em' };
  const idBadge = { background: '#e8f4fd', color: '#0056b3', padding: '2px 7px', borderRadius: 10, fontSize: '0.82em', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'inline-block' };
  const btnE = { background: '#00A4E4', color: 'white', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: '0.85em', marginRight: 3 };
  const btnD = { background: '#E41E25', color: 'white', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: '0.85em' };
  const selFil = { padding: '4px 6px', border: '1px solid #ccc', borderRadius: 4, fontFamily: 'inherit', fontSize: '0.85em' };

  const thSort = (col, label) => (
    <th style={{ ...thS, background: sortCol === col ? '#ddeeff' : '#f0f0f0' }} onClick={() => handleSortClick(col)}>
      {label}{' '}
      <span style={{ fontSize: '0.75em', color: sortCol === col ? '#0056b3' : '#bbb' }}>
        {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  );

  const rowBg = (item, i) => isModified(item) ? '#fce4ec' : (i % 2 === 0 ? 'white' : '#fafafa');
  const Star = ({ item }) => isModified(item) ? <span title="Modifié dans cette session" style={{ color: '#c62828', marginRight: 4 }}>★</span> : null;

  const filteredItems = getFiltered();

  const renderTable = () => {
    if (contentType === 'etapes') return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={thFixed}>ID <span style={{ color: '#bbb', fontWeight: 'normal' }}>(fixe)</span></th>
          {thSort('sequence', 'Séq.')}
          {thSort('libelle', 'Libellé')}
          {thSort('parenthese', 'Parenthèse')}
          <th style={thFixed}>Actions</th>
        </tr></thead>
        <tbody>
          {filteredItems.map((item, i) => (
            <tr key={item._origIndex} style={{ background: rowBg(item, i) }}>
              <td style={tdS}><Star item={item} /><span style={idBadge}>{item.id}</span></td>
              <td style={tdS}>{item.sequence}</td>
              <td style={tdS}><strong>{item.libelle}</strong></td>
              <td style={{ ...tdS, maxWidth: 240, color: '#555' }}>{item.parenthese}</td>
              <td style={tdS}>
                <button onClick={() => handleEdit(item._origIndex)} style={btnE}>✎</button>
                <button onClick={() => handleDelete(item._origIndex)} style={btnD}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (contentType === 'directives') return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          {thSort('parent', 'Étape')}
          {thSort('niveau', 'Niveau')}
          {thSort('court', 'Court')}
          {thSort('exemple', 'Exemple')}
          {thSort('sequence', 'Séq.')}
          <th style={thFixed}>Actions</th>
        </tr></thead>
        <tbody>
          {filteredItems.map((item, i) => (
            <tr key={item._origIndex} style={{ background: rowBg(item, i) }}>
              <td style={tdS}><Star item={item} /><span style={idBadge}>{item.parent}</span></td>
              <td style={{ ...tdS, ...(niveauColors[item.niveau] || {}), fontWeight: 'bold', fontSize: '0.8em' }}>{NIVEAU_LABELS[item.niveau] || item.niveau}</td>
              <td style={{ ...tdS, maxWidth: 150 }}>{item.court}</td>
              <td style={{ ...tdS, maxWidth: 220, color: '#333' }} dangerouslySetInnerHTML={{ __html: item.exemple }} />
              <td style={tdS}>{item.sequence}</td>
              <td style={tdS}>
                <button onClick={() => handleEdit(item._origIndex)} style={btnE}>✎</button>
                <button onClick={() => handleDelete(item._origIndex)} style={btnD}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          {thSort('code', 'Code')}
          {thSort('sequence', 'Séq.')}
          {thSort('court', 'Court')}
          {thSort('exemple', 'Exemple')}
          <th style={thFixed}>Actions</th>
        </tr></thead>
        <tbody>
          {filteredItems.map((item, i) => (
            <tr key={item._origIndex} style={{ background: rowBg(item, i) }}>
              <td style={tdS}><Star item={item} /><span style={idBadge}>{item.code}</span></td>
              <td style={tdS}>{item.sequence}</td>
              <td style={{ ...tdS, maxWidth: 180 }}>{item.court}</td>
              <td style={{ ...tdS, maxWidth: 240, color: '#333' }} dangerouslySetInnerHTML={{ __html: item.exemple }} />
              <td style={tdS}>
                <button onClick={() => handleEdit(item._origIndex)} style={btnE}>✎</button>
                <button onClick={() => handleDelete(item._origIndex)} style={btnD}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ background: '#F2F2F2', minHeight: '100vh', padding: 20, color: '#231F20' }}>
      <style>{`
        .btn-prim{background:#00A4E4;color:white;border:none;padding:7px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:.88em}.btn-prim:hover{background:#0084b0}
        .btn-sec{background:#6c757d;color:white;border:none;padding:7px 16px;border-radius:5px;cursor:pointer;font-size:.88em}.btn-sec:hover{background:#545b62}
        .btn-grn{background:#28a745;color:white;border:none;padding:7px 16px;border-radius:5px;cursor:pointer;font-size:.88em;font-weight:bold}.btn-grn:hover{background:#1e7e34}
        .btn-wrd{background:#2b579a;color:white;border:none;padding:7px 16px;border-radius:5px;cursor:pointer;font-size:.88em}.btn-wrd:hover{background:#1e3f70}
        .btn-clr{background:white;color:#444;border:1px solid #ccc;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:.83em}.btn-clr:hover{background:#f0f0f0;border-color:#999}
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
        <button className="btn-grn" onClick={handleAdd}>+ Ajouter un item</button>
        <button className="btn-prim" onClick={handleDownloadJson}>⬇ JSON</button>
        <button className="btn-sec" onClick={() => fileInputRef.current?.click()}>📂 Importer JSON</button>
        <button className="btn-wrd" onClick={handleDownloadWord}>📄 Exporter Word</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        {importError && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ {importError}</span>}
      </div>

      {/* Status */}
      <div style={{ marginBottom: 10, fontSize: '0.82em', color: '#666' }}>
        {data[contentType].length} items —{' '}
        {jsonError
          ? <span style={{ color: '#E41E25' }}>⚠ JSON invalide : {jsonError}</span>
          : <span style={{ color: '#28a745' }}>✔ JSON valide</span>}
        {modifiedKeys[contentType].size > 0 && (
          <span style={{ marginLeft: 12, color: '#c62828' }}>★ {modifiedKeys[contentType].size} modifié(s)</span>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>

        {/* LEFT: JSON */}
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

        {/* RIGHT: Table */}
        <div style={{ background: 'white', borderRadius: 8, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9em', marginBottom: 8, color: '#333' }}>Rendu lisible</div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10, padding: 8, background: '#f8f8f8', borderRadius: 6, border: '1px solid #eee' }}>
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="🔍 Mot-clé..."
              style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, fontFamily: 'inherit', fontSize: '0.85em', width: 130 }}
            />
            {contentType === 'directives' && <>
              <select value={filterParent} onChange={e => setFilterParent(e.target.value)} style={selFil}>
                <option value="">Toutes étapes</option>
                {ETAPE_IDS.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
              <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)} style={selFil}>
                <option value="">Tous niveaux</option>
                {['non', 'aar', 'asr', 'obl'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </>}
            {contentType === 'declarations' && (
              <select value={filterCode} onChange={e => setFilterCode(e.target.value)} style={selFil}>
                <option value="">Tous codes</option>
                {['iagraphie', 'traces', 'logique'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {hasFilters && <button className="btn-clr" onClick={clearFilters}>✕ Retirer les filtres</button>}
            <span style={{ marginLeft: 'auto', fontSize: '0.78em', color: '#888' }}>{filteredItems.length} / {data[contentType].length}</span>
          </div>

          {contentType === 'etapes' && (
            <p style={{ fontSize: '0.78em', color: '#888', margin: '0 0 8px 0', background: '#fff8e1', padding: '4px 8px', borderRadius: 4, border: '1px solid #ffe082' }}>
              ⚠ L'ID des étapes est fixe et non modifiable.
            </p>
          )}

          <div style={{ overflowX: 'auto', maxHeight: '64vh', overflowY: 'auto' }}>
            {filteredItems.length === 0
              ? <p style={{ color: '#999', padding: 16, textAlign: 'center', fontSize: '0.9em' }}>Aucun résultat.</p>
              : renderTable()
            }
          </div>
        </div>
      </div>

      <ItemEditorModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setModalItem(null); }}
        onSave={handleModalSave}
        item={modalItem}
        contentType={contentType}
        allItems={data[contentType]}
        isNew={modalIsNew}
      />
    </div>
  );
}