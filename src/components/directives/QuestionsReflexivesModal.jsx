import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const EXEMPLES = [
  {
    court: "Impact sur la réflexion personnelle",
    exemple: "En quoi l'utilisation d'un SIA a-t-elle soutenu ou limité votre réflexion personnelle dans cette évaluation?"
  },
  {
    court: "Vérification et adaptation du contenu",
    exemple: "Comment avez-vous vérifié, critiqué ou adapté les contenus générés par le SIA? Donnez des exemples concrets."
  },
  {
    court: "Apprentissages sur les SIA",
    exemple: "Qu'avez-vous appris sur l'utilisation de ces SIA pour votre contexte disciplinaire? Qu'est-ce qui vous a surpris?"
  },
  {
    court: "Effet sur les apprentissages",
    exemple: "Quel effet l'utilisation de ces systèmes a-t-elle eu sur vos apprentissages? Quelles compétences ont été développées ou au contraire peu sollicitées?"
  },
  {
    court: "Démarche de validation",
    exemple: "Décrivez comment vous avez validé les informations fournies par le SIA. Quelles sources avez-vous consultées pour vérifier l'exactitude des contenus générés?"
  },
  {
    court: "Forces et limites observées",
    exemple: "Identifiez au moins deux forces et deux limites du SIA que vous avez observées dans le cadre de ce travail. Appuyez vos observations sur des exemples concrets."
  },
  {
    court: "Part de contribution humaine",
    exemple: "Expliquez quelles modifications vous avez apportées aux résultats générés par le SIA et pourquoi. Précisez la part de contribution humaine dans le produit final remis."
  },
];

export default function QuestionsReflexivesModal({ isOpen, onClose, onAdd }) {
  const [texte, setTexte] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen) setTexte('');
  }, [isOpen]);

  function handleInsert(exemple) {
    setTexte(prev => prev ? prev + '\n' + exemple : exemple);
  }

  function handleSave() {
    if (!texte.trim()) return;
    onAdd(texte.trim());
    setTexte('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'white',
        borderRadius: 10,
        padding: '20px 24px',
        maxWidth: 900,
        width: '95vw',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1.05em', fontWeight: 'bold', color: '#231F20' }}>
          Questions réflexives
        </h3>

        <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left: textarea */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Rédigez une question réflexive ci-dessous. Cliquez un exemple à droite pour l'insérer.
            </p>
            <textarea
              value={texte}
              onChange={e => setTexte(e.target.value)}
              placeholder="ex. Comment avez-vous validé les réponses générées par le SIA?"
              style={{
                flex: 1, minHeight: 180, width: '100%', padding: '8px 10px',
                fontFamily: 'inherit', fontSize: '0.9em', border: '1px solid #ccc',
                borderRadius: 6, boxSizing: 'border-box', resize: 'none', lineHeight: 1.5
              }}
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={!texte.trim()}
                style={{ background: texte.trim() ? '#444477' : '#aaa', color: 'white', border: 'none', borderRadius: 5, padding: '8px 20px', cursor: texte.trim() ? 'pointer' : 'default', fontWeight: 'bold', fontSize: '0.9em' }}
                onMouseEnter={e => { if (texte.trim()) e.currentTarget.style.background = '#333355'; }}
                onMouseLeave={e => { if (texte.trim()) e.currentTarget.style.background = '#444477'; }}>
                Enregistrer
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ background: '#6c757d', color: 'white', border: 'none', borderRadius: 5, padding: '8px 16px', cursor: 'pointer', fontSize: '0.9em' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#545b62'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#6c757d'; }}>
                Annuler
              </button>
            </div>
          </div>

          {/* Right: exemples */}
          <div style={{
            width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid #e5e7eb', paddingLeft: 16, overflow: 'hidden'
          }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Survolez un exemple pour le voir en entier. Cliquez pour l'insérer.
            </p>
            <ScrollArea style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {EXEMPLES.map((ex, idx) => (
                  <div key={idx}>
                    <button
                      type="button"
                      onClick={() => handleInsert(ex.exemple)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPos({ top: rect.top, right: window.innerWidth - rect.left + 8 });
                        setHoveredIdx(idx);
                      }}
                      onMouseLeave={() => setHoveredIdx(null)}
                      style={{
                        textAlign: 'left', padding: '7px 10px', border: '1px solid #ddd',
                        borderRadius: 5, cursor: 'pointer', background: 'white',
                        fontFamily: 'inherit', fontSize: '0.82em', lineHeight: 1.4,
                        color: '#231F20', width: '100%',
                        transition: 'background 0.15s, border-color 0.15s'
                      }}
                      onFocus={e => { e.currentTarget.style.background = '#eeeef8'; e.currentTarget.style.borderColor = '#444477'; }}
                      onBlur={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#ddd'; }}
                    >
                      {ex.court}…
                    </button>
                    {hoveredIdx === idx && (
                      <div style={{
                        position: 'fixed', right: tooltipPos.right, top: tooltipPos.top, zIndex: 99999,
                        background: '#1a1a1a', color: 'white', borderRadius: 6,
                        padding: '8px 12px', fontSize: '0.82em', lineHeight: 1.6,
                        maxWidth: 340, whiteSpace: 'normal', wordBreak: 'break-word',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)', pointerEvents: 'none',
                      }}>
                        {ex.exemple}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}