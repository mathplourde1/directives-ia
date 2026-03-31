import React from 'react';

export default function RemovedActions({ removedActions, allCategories, onRestore }) {
  if (removedActions.length === 0) return null;

  return (
    <div style={{
      background: '#f9f9f9',
      border: '1px dashed #bbb',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 20
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95em', fontWeight: 'bold', color: '#666' }}>
        🗑 Actions retirées ({removedActions.length})
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {removedActions.map(actionId => {
          let label = actionId;
          let catColor = '#888';
          for (const cat of allCategories) {
            const found = cat.actions.find(a => a.id === actionId);
            if (found) { label = found.isAutre ? 'Autre' : found.libelle; catColor = cat.color; break; }
          }
          return (
            <div key={actionId} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'white', border: `1px solid ${catColor}`,
              borderRadius: 20, padding: '4px 10px', fontSize: '0.82em'
            }}>
              <span style={{ color: catColor, fontWeight: 500 }}>{label}</span>
              <button
                type="button"
                onClick={() => onRestore(actionId)}
                style={{
                  background: catColor, color: 'white', border: 'none',
                  borderRadius: 10, padding: '1px 8px', cursor: 'pointer',
                  fontSize: '0.85em', fontWeight: 'bold'
                }}>
                Réactiver
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}