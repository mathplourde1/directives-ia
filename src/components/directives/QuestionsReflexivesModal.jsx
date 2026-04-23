import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { ScrollArea } from '@/components/ui/scroll-area';

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic'],
    [{ list: 'bullet' }, { list: 'ordered' }],
    ['link'],
    ['clean'],
  ],
};
const QUILL_FORMATS = ['bold', 'italic', 'list', 'bullet', 'link'];

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

export default function QuestionsReflexivesModal({ isOpen, onClose, onAdd, initialValue = null }) {
  const [texte, setTexte] = useState('');
  const [obligatoire, setObligatoire] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen) {
      if (initialValue && typeof initialValue === 'object') {
        setTexte(initialValue.texte || '');
        setObligatoire(initialValue.obligatoire || false);
      } else {
        setTexte('');
        setObligatoire(false);
      }
    }
  }, [isOpen, initialValue]);

  function handleInsert(exemple) {
    setTexte(prev => {
      const stripped = prev.replace(/<(.|\n)*?>/g, '').trim();
      return stripped ? prev.replace(/<\/p>$/, '') + `<br/>${exemple}</p>` : `<p>${exemple}</p>`;
    });
  }

  const texteStripped = texte.replace(/<(.|\n)*?>/g, '').trim();

  function handleSave() {
    if (!texteStripped) return;
    onAdd({ texte, obligatoire });
    setTexte('');
    setObligatoire(false);
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
          {initialValue ? 'Modifier la question réflexive' : 'Ajouter une question réflexive'}
        </h3>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid #ccc', overflow: 'hidden', background: '#f0f0f0' }}>
            <button type="button" onClick={() => setObligatoire(false)}
              style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: !obligatoire ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: !obligatoire ? 'white' : 'transparent', color: !obligatoire ? '#333' : '#888', transition: 'background 0.15s', borderRadius: '999px 0 0 999px', boxShadow: !obligatoire ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>
              Facultative
            </button>
            <button type="button" onClick={() => setObligatoire(true)}
              style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: obligatoire ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: obligatoire ? '#E41E25' : 'transparent', color: obligatoire ? 'white' : '#888', transition: 'background 0.15s', borderRadius: '0 999px 999px 0', boxShadow: obligatoire ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>
              Obligatoire
            </button>
          </div>
          <span style={{ fontSize: '0.82em', color: '#888' }}>{obligatoire ? 'La personne étudiante doit y répondre.' : 'La personne étudiante peut y répondre librement.'}</span>
        </div>

        <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left: editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Rédigez une question réflexive ci-dessous. Cliquez un exemple à droite pour l'insérer.
            </p>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <ReactQuill
                value={texte}
                onChange={setTexte}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="ex. Comment avez-vous validé les réponses générées par le SIA?"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', fontSize: '0.9em' }}
                theme="snow"
              />
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={!texteStripped}
                style={{ background: texteStripped ? '#444477' : '#aaa', color: 'white', border: 'none', borderRadius: 5, padding: '8px 20px', cursor: texteStripped ? 'pointer' : 'default', fontWeight: 'bold', fontSize: '0.9em', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (texteStripped) e.currentTarget.style.background = '#333355'; }}
                onMouseLeave={e => { if (texteStripped) e.currentTarget.style.background = '#444477'; }}>
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