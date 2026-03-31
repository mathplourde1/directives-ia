import React, { useState } from 'react';


const COLUMN_STYLES = [
  { id: 'non', libelle: 'Non autorisée', color: '#E41E25', bg: '#fff4f4', border: '#E41E25', headerBg: '#E41E25' },
  { id: 'aar', libelle: 'Autorisée avec restrictions', color: '#b45309', bg: '#fffbeb', border: '#f59e0b', headerBg: '#f59e0b' },
  { id: 'asr', libelle: 'Autorisée sans restriction', color: '#15803d', bg: '#f0fdf4', border: '#22c55e', headerBg: '#22c55e' },
  { id: 'obl', libelle: 'Obligatoire', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6', headerBg: '#3b82f6' },
];

function ActionChip({ action, levelId, onMoveTo, onRemove }) {
  const col = COLUMN_STYLES.find(c => c.id === levelId) || COLUMN_STYLES[0];
  const label = action.isAutre ? (action.autreText || 'Autre') : action.libelle;
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        background: hover ? col.bg : 'white',
        border: `1px solid ${col.border}`,
        borderRadius: 6,
        padding: '5px 8px',
        marginBottom: 4,
        fontSize: '0.82em',
        cursor: 'default',
        transition: 'background 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {action.isAutre ? (
        <input
          type="text"
          defaultValue={action.autreText || ''}
          onBlur={e => { action.autreText = e.target.value; }}
          placeholder="Préciser…"
          style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '1em', background: 'transparent' }}
        />
      ) : (
        <span style={{ flex: 1 }}>{label}</span>
      )}
      {/* Move buttons */}
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {COLUMN_STYLES.filter(c => c.id !== levelId).map(c => (
          <button key={c.id} type="button" title={`Déplacer vers "${c.libelle}"`}
            onClick={() => onMoveTo(action.id, c.id)}
            style={{ background: c.headerBg, color: 'white', border: 'none', borderRadius: 3, padding: '1px 5px', cursor: 'pointer', fontSize: '0.75em', fontWeight: 'bold', lineHeight: 1.4 }}>
            {c.id === 'non' ? '✗' : c.id === 'aar' ? 'R' : c.id === 'asr' ? '✓' : '★'}
          </button>
        ))}
        <button type="button" title="Retirer de la liste" onClick={() => onRemove(action.id)}
          style={{ background: '#ddd', color: '#555', border: 'none', borderRadius: 3, padding: '1px 5px', cursor: 'pointer', fontSize: '0.75em', lineHeight: 1.4 }}>
          −
        </button>
      </div>
    </div>
  );
}

export default function CategorySection({ category, mode, onModeChange, permissions, precisions, onPermissionChange, onPrecisionsChange }) {
  const [removedInCat, setRemovedInCat] = useState([]);

  const activeActions = category.actions.filter(a => !removedInCat.includes(a.id));
  const removedActions = category.actions.filter(a => removedInCat.includes(a.id));

  function handleMove(actionId, newLevel) {
    onPermissionChange(actionId, newLevel);
  }

  function handleRemove(actionId) {
    setRemovedInCat(prev => [...prev, actionId]);
  }

  function handleRestore(actionId) {
    setRemovedInCat(prev => prev.filter(id => id !== actionId));
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      border: `2px solid ${category.color}`,
      marginBottom: 20,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ background: category.color, color: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1em' }}>{category.libelle}</span>

        {/* Toggle */}
        <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
          <button type="button"
            onClick={() => onModeChange(category.id, 'aucune')}
            style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: mode === 'aucune' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: mode === 'aucune' ? 'rgba(255,255,255,0.9)' : 'transparent', color: mode === 'aucune' ? category.color : 'white', transition: 'background 0.15s', borderRadius: '999px 0 0 999px' }}>
            Aucune restriction
          </button>
          <button type="button"
            onClick={() => onModeChange(category.id, 'restreindre')}
            style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: mode === 'restreindre' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: mode === 'restreindre' ? 'rgba(255,255,255,0.9)' : 'transparent', color: mode === 'restreindre' ? category.color : 'white', transition: 'background 0.15s', borderRadius: '0 999px 999px 0' }}>
            Restreindre l'usage des SIA
          </button>
        </div>
      </div>

      {mode === 'aucune' ? (
        <div style={{ padding: '10px 16px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>
          Aucune restriction appliquée pour cette catégorie. Les SIA sont autorisés sans restriction pour toutes les actions.
        </div>
      ) : (
        <div style={{ padding: '12px 14px' }}>
          {/* 4 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {COLUMN_STYLES.map(col => {
              const colActions = activeActions.filter(a => (permissions[a.id] || 'non') === col.id);
              return (
                <div key={col.id} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ background: col.headerBg, color: 'white', padding: '4px 8px', fontSize: '0.75em', fontWeight: 'bold', textAlign: 'center' }}>
                    {col.libelle}
                  </div>
                  <div style={{ padding: '6px 6px', minHeight: 60 }}>
                    {colActions.length === 0 ? (
                      <p style={{ color: '#bbb', fontSize: '0.78em', fontStyle: 'italic', margin: '4px 0', textAlign: 'center' }}>—</p>
                    ) : (
                      colActions.map(action => (
                        <ActionChip
                          key={action.id}
                          action={action}
                          levelId={col.id}
                          onMoveTo={handleMove}
                          onRemove={handleRemove}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Précisions (one per category) */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.85em', display: 'block', marginBottom: 4, color: '#444' }}>Précisions</label>
            <textarea
              value={precisions[category.id] || ''}
              onChange={e => onPrecisionsChange(category.id, e.target.value)}
              placeholder="Ajoutez ici des précisions pour cette catégorie…"
              rows={2}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontFamily: 'inherit', fontSize: '0.88em', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Removed within category */}
          {removedActions.length > 0 && (
            <div style={{ background: '#f5f5f5', border: '1px dashed #bbb', borderRadius: 6, padding: '8px 10px' }}>
              <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'bold' }}>Actions retirées :</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {removedActions.map(action => (
                  <div key={action.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', border: `1px solid ${category.color}`, borderRadius: 16, padding: '2px 8px', fontSize: '0.8em' }}>
                    <span style={{ color: category.color }}>{action.isAutre ? 'Autre' : action.libelle}</span>
                    <button type="button" onClick={() => handleRestore(action.id)}
                      style={{ background: category.color, color: 'white', border: 'none', borderRadius: 10, padding: '0px 7px', cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold' }}>
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}