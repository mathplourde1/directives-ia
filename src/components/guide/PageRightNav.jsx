import React, { useState } from 'react';

const NAV_ITEMS = [
  { id: 'evaluation-ciblee', label: 'Évaluation ciblée', conditional: false },
  { id: 'synthese-container', label: 'Synthèses', conditional: true },
  { id: 'brio-section', label: 'Suggestion Brio', conditional: true },
  { id: 'sauvegarde', label: 'Sauvegarde et restauration', conditional: false },
  { id: 'declaration', label: 'Déclaration étudiante', conditional: true },
];

export default function PageRightNav({ submitted }) {
  const [visible, setVisible] = useState(true);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 80,
      right: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    }}>
      {/* Toggle button */}
      <button
        onClick={() => setVisible(v => !v)}
        title={visible ? 'Masquer la navigation' : 'Afficher la navigation'}
        style={{
          background: '#00A4E4',
          color: 'white',
          border: 'none',
          borderRadius: '6px 0 0 6px',
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: '0.8em',
          fontWeight: 'bold',
          marginBottom: 2,
          letterSpacing: '0.01em',
          boxShadow: '-2px 2px 6px rgba(0,0,0,0.12)',
        }}>
        {visible ? '▶ Nav' : '◀ Nav'}
      </button>

      {/* Nav panel */}
      {visible && (
        <div style={{
          background: 'white',
          border: '1px solid #ccc',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          boxShadow: '-2px 4px 12px rgba(0,0,0,0.10)',
          padding: '10px 0',
          minWidth: 180,
        }}>
          <p style={{
            margin: '0 0 6px 0',
            padding: '0 14px 6px',
            fontSize: '0.72em',
            fontWeight: 'bold',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid #eee',
          }}>Navigation</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {NAV_ITEMS.map(item => {
              const active = !item.conditional || submitted;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => active && scrollTo(item.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '7px 14px',
                      fontSize: '0.85em',
                      fontFamily: 'inherit',
                      cursor: active ? 'pointer' : 'default',
                      color: active ? '#00A4E4' : '#bbb',
                      fontWeight: active ? '600' : '400',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (active) e.currentTarget.style.background = '#f0f8ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    title={!active ? 'Générez d\'abord les directives' : ''}
                  >
                    {item.conditional && !submitted && (
                      <span style={{ marginRight: 4, fontSize: '0.85em' }}>🔒</span>
                    )}
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}