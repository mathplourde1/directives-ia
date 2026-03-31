import React, { useState } from 'react';
import { PERMISSION_LEVELS } from './restrictionsData';

export default function ActionCard({ action, permission, precisions, onPermissionChange, onPrecisionsChange, onRemove, categoryColor }) {
  const [showPrecisions, setShowPrecisions] = useState(false);
  const [localText, setLocalText] = useState(action.isAutre ? action.autreText || '' : '');

  const currentLevel = PERMISSION_LEVELS.find(l => l.id === permission) || PERMISSION_LEVELS[0];

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${currentLevel.border}`,
      borderLeft: `4px solid ${currentLevel.color}`,
      borderRadius: 6,
      padding: '8px 10px',
      marginBottom: 6,
      fontSize: '0.88em'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          {action.isAutre ? (
            <input
              type="text"
              value={localText}
              onChange={(e) => {
                setLocalText(e.target.value);
                onPermissionChange(action.id, permission, e.target.value);
              }}
              placeholder="Autre : préciser…"
              style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: '3px 6px', fontFamily: 'inherit', fontSize: '1em' }}
            />
          ) : (
            <span style={{ fontWeight: 500 }}>{action.libelle}</span>
          )}
        </div>

        {/* Permission selector */}
        <select
          value={permission}
          onChange={(e) => onPermissionChange(action.id, e.target.value, localText)}
          style={{
            border: `1px solid ${currentLevel.border}`,
            borderRadius: 4,
            padding: '3px 6px',
            fontSize: '0.9em',
            background: currentLevel.bg,
            color: currentLevel.color,
            fontWeight: 'bold',
            cursor: 'pointer',
            minWidth: 180,
            flexShrink: 0
          }}>
          {PERMISSION_LEVELS.map(l => (
            <option key={l.id} value={l.id}>{l.libelle}</option>
          ))}
        </select>

        {/* Précisions toggle */}
        <button
          type="button"
          onClick={() => setShowPrecisions(v => !v)}
          title="Ajouter des précisions"
          style={{
            background: precisions ? '#e0f0ff' : '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '3px 8px',
            cursor: 'pointer',
            fontSize: '0.85em',
            flexShrink: 0,
            color: precisions ? '#0056b3' : '#666'
          }}>
          {precisions ? '📝✓' : '📝'}
        </button>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(action.id)}
          title="Retirer cette action"
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: '3px 8px',
            cursor: 'pointer',
            fontSize: '0.85em',
            color: '#999',
            flexShrink: 0
          }}>
          ✕
        </button>
      </div>

      {showPrecisions && (
        <textarea
          value={precisions || ''}
          onChange={(e) => onPrecisionsChange(action.id, e.target.value)}
          placeholder="Précisions supplémentaires pour cette action…"
          rows={2}
          style={{
            width: '100%',
            marginTop: 6,
            padding: '6px 8px',
            border: '1px solid #ccc',
            borderRadius: 4,
            fontFamily: 'inherit',
            fontSize: '0.92em',
            boxSizing: 'border-box',
            resize: 'vertical'
          }}
        />
      )}
    </div>
  );
}