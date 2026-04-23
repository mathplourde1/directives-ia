import React, { useState } from 'react';

const EXEMPLES = [
  "En quoi l'utilisation d'un SIA a-t-elle soutenu ou limité votre réflexion personnelle dans cette évaluation?",
  "Comment avez-vous vérifié, critiqué ou adapté les contenus générés?",
  "Qu'avez-vous appris sur l'utilisation de ces SIA pour votre contexte disciplinaire?",
  "Quel effet l'utilisation de ces systèmes a-t-elle eu sur vos apprentissages?",
];

export default function QuestionsReflexivesModal({ isOpen, onClose, onAdd }) {
  const [texte, setTexte] = useState('');

  if (!isOpen) return null;

  function handleSave() {
    if (!texte.trim()) return;
    onAdd(texte.trim());
    setTexte('');
    onClose();
  }

  function handleExemple(q) {
    setTexte(q);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 10, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ background: '#444477', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1em' }}>Ajouter une question réflexive</span>
          <button onClick={() => { setTexte(''); onClose(); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.3em', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          <p style={{ margin: '0 0 14px', fontSize: '0.9em', color: '#444', lineHeight: 1.5 }}>
            Rédigez une question réflexive ou choisissez l'un des exemples à droite pour l'utiliser comme point de départ.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Left: saisie */}
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.88em', display: 'block', marginBottom: 5 }}>
                Question <span style={{ color: '#E41E25' }}>*</span>
              </label>
              <textarea
                value={texte}
                onChange={e => setTexte(e.target.value)}
                rows={5}
                placeholder="ex. Comment avez-vous validé les réponses générées par le SIA?"
                style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #aaa', borderRadius: 4, boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {/* Right: exemples */}
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.88em', display: 'block', marginBottom: 6, color: '#444477' }}>
                Exemples de questions
              </label>
              <div style={{ border: '1px solid #444477', borderRadius: 6, overflow: 'hidden' }}>
                {EXEMPLES.map((q, i) => (
                  <button key={i} type="button" onClick={() => handleExemple(q)}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 10px', fontSize: '0.83em', background: 'white', border: 'none', borderBottom: i < EXEMPLES.length - 1 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#333', lineHeight: 1.4 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#44447718'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    {q}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.78em', color: '#888', fontStyle: 'italic' }}>Cliquez sur une question pour la copier dans le champ.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={() => { setTexte(''); onClose(); }}
            style={{ padding: '7px 18px', borderRadius: 5, border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em' }}>
            Annuler
          </button>
          <button type="button" onClick={handleSave} disabled={!texte.trim()}
            style={{ padding: '7px 18px', borderRadius: 5, border: 'none', background: texte.trim() ? '#444477' : '#aaa', color: 'white', cursor: texte.trim() ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: 'bold' }}>
            Ajouter la question
          </button>
        </div>
      </div>
    </div>
  );
}