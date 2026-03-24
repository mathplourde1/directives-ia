import React, { useState } from 'react';

const NAV_ITEMS = [
  { id: 'evaluation-ciblee', label: 'Évaluation ciblée', conditional: false },
  { id: 'brio-section', label: 'Suggestion Brio', conditional: true },
  { id: 'synthese-section', label: 'Synthèses', conditional: true },
  { id: 'sauvegarde', label: 'Sauvegarde et restauration', conditional: false },
  { id: 'declaration', label: 'Déclaration étudiante', conditional: true },
];

export default function PageRightNav({ submitted }) {
  const [open, setOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      width: open ? 200 : 28,
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px 0 0 8px',
      borderRight: 'none',
      boxShadow: '-2px 4px 12px rgba(0,0,0,0.08)',
      position: 'fixed',
      top: 80,
      right: 0,
      zIndex: 100,
    }}>
      {/* Collapsed tab — always visible */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={open ? 'Masquer la navigation' : 'Afficher la navigation'}
        style={{
          flexShrink: 0,
          width: 28,
          background: 'none',
          border: 'none',
          borderRight: open ? '1px solid #eee' : 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <span style={{
          display: 'inline-block',
          transform: 'rotate(-90deg)',
          whiteSpace: 'nowrap',
          fontSize: '0.8em',
          fontWeight: 'bold',
          color: '#888',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}>
          {open ? '▼ Masquer' : 'Navigation ▲'}
        </span>
      </button>

      {/* Nav panel */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        opacity: open ? 1 : 0,
        transition: 'opacity 0.2s ease',
        pointerEvents: open ? 'auto' : 'none',
        padding: open ? '10px 0' : 0,
      }}>
        <p style={{
          margin: '0 0 6px 0',
          padding: '0 12px 6px',
          fontSize: '0.7em',
          fontWeight: 'bold',
          color: '#aaa',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          borderBottom: '1px solid #eee',
          whiteSpace: 'nowrap',
        }}>Sur cette page:</p>
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
                    padding: '6px 12px',
                    fontSize: '0.82em',
                    fontFamily: 'inherit',
                    cursor: active ? 'pointer' : 'default',
                    color: active ? '#00A4E4' : '#ccc',
                    fontWeight: active ? '600' : '400',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (active) e.currentTarget.style.background = '#f0f8ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  title={!active ? "Générez d'abord les directives" : ''}
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
    </div>
  );
}