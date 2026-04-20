import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import exemplesDirectives from './exemplesDirectives.json';
import ETAPES from './etapesData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

const NIVEAU_MAP = {
  'Non autorisée': 'non',
  'Autorisée avec restrictions': 'aar',
  'Autorisée sans restrictions': 'asr',
  'Obligatoire': 'obl',
};

const NIVEAU_LABELS = {
  non: 'Non autorisée',
  aar: 'Autorisée avec restrictions',
  asr: 'Autorisée sans restrictions',
  obl: 'Obligatoire',
};

const NIVEAU_COLORS = {
  non: { bg: '#fde8e8', color: '#7b1d1d', border: '#f5c6cb' },
  aar: { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
  asr: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
  obl: { bg: '#cce5ff', color: '#004085', border: '#b8daff' },
};

const HIERARCHY = ['non', 'aar', 'asr', 'obl'];

const QUILL_MODULES = {
  toolbar: {
    container: [
      ['bold', 'italic'],
      [{ list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
    handlers: {
      link: function(value) {
        const quill = this.quill;
        if (value) {
          const url = prompt('Entrez l\'adresse URL du lien :');
          if (url) {
            const selection = quill.getSelection(true);
            if (selection && selection.length > 0) {
              quill.format('link', url);
            } else {
              const index = selection ? selection.index : quill.getLength() - 1;
              quill.insertText(index, url, 'link', url);
              quill.setSelection(index + url.length);
            }
          }
        } else {
          quill.format('link', false);
        }
      }
    }
  },
};
const QUILL_FORMATS = ['bold', 'italic', 'link', 'list', 'bullet', 'background'];

export default function DirectiveSelectionModal({
  isOpen, onClose, onSave, initialValue, currentEtapeId, currentIaOption
}) {
  const currentNiveau = NIVEAU_MAP[currentIaOption] || null;
  const [value, setValue] = useState(initialValue || '');
  const [openAccordions, setOpenAccordions] = useState(currentNiveau ? [currentNiveau] : []);
  const [highlightRange, setHighlightRange] = useState(null);
  const quillRef = useRef();

  const currentEtape = ETAPES.find(e => e.id === currentEtapeId);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || '');
      setOpenAccordions(currentNiveau ? [currentNiveau] : []);
    }
  }, [isOpen, initialValue, currentNiveau]);

  const availableNiveaux = HIERARCHY.filter(n =>
    exemplesDirectives.some(d => d.parent === currentEtapeId && d.niveau === n)
  );

  const getDirectives = (niveau) =>
    exemplesDirectives
      .filter(d => d.parent === currentEtapeId && d.niveau === niveau)
      .sort((a, b) => a.sequence - b.sequence);

  function insertExample(text) {
    const quill = quillRef.current?.getEditor();
    if (!quill) {
      setValue(prev => prev ? prev + '\n' + text : text);
      return;
    }
    const selection = quill.getSelection(true);
    const index = selection ? selection.index : quill.getLength() - 1;
    quill.insertText(index, text, 'user');
    quill.setSelection(index + text.length);

    // Highlight the inserted range with yellow, then fade out
    quill.formatText(index, text.length, 'background', '#ffe066', 'api');
    setTimeout(() => {
      quill.formatText(index, text.length, 'background', false, 'api');
    }, 500);
  }

  function handleApply() {
    onSave(value);
    onClose();
  }

  const niveauColor = currentNiveau ? NIVEAU_COLORS[currentNiveau] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{
        maxWidth: 980, width: '95vw', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 24px'
      }}>
        <style>{`
          .directive-quill { display: flex; flex-direction: column; flex: 1; min-height: 0; }
          .directive-quill .ql-toolbar { flex-shrink: 0; border-radius: 6px 6px 0 0; }
          .directive-quill .ql-container { flex: 1; overflow-y: auto; font-family: Arial, sans-serif; font-size: 0.9em; border-radius: 0 0 6px 6px; }
          .directive-quill .ql-editor { min-height: 220px; }
          .directive-quill .ql-editor a { color: #0056b3; text-decoration: underline; }
          .directive-quill .ql-tooltip::before { content: "Visiter l'URL :"; }
          .directive-quill .ql-tooltip a.ql-action::after { content: "Modifier"; }
          .directive-quill .ql-tooltip a.ql-remove::before { content: "Supprimer"; }
          .directive-quill .ql-tooltip.ql-editing a.ql-action::after { content: "Enregistrer"; }
          .directive-quill .ql-tooltip[data-mode=link]::before { content: "Entrez le lien :"; }
          .directive-quill .ql-editor ul { list-style-type: disc; padding-left: 20px; }
          .directive-quill .ql-editor li { display: list-item; }
          .example-btn { transition: background 0.15s, border-color 0.15s !important; }
          .example-btn:hover { background: #e8f4fd !important; border-color: #00A4E4 !important; }
          @keyframes highlight-fade {
            0% { background-color: #ffe066; }
            100% { background-color: transparent; }
          }
          .ql-editor .inserted-highlight {
            animation: highlight-fade 0.5s ease-out forwards;
          }
        `}</style>

        <DialogHeader style={{ flexShrink: 0 }}>
          <DialogTitle style={{ color: '#231F20', fontSize: '1em' }}>
            Personnaliser les directives
          </DialogTitle>
          {/* Context badge */}
          {(currentEtape || currentNiveau) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {currentEtape && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <span
                    style={{
                      fontSize: '0.78em', padding: '3px 10px', borderRadius: 20,
                      background: '#f0f0f0', color: '#444', border: '1px solid #ddd', fontWeight: 'bold',
                      cursor: currentEtape.parenthese ? 'help' : 'default'
                    }}
                    onMouseEnter={() => currentEtape.parenthese && setHoveredKey('etape-badge')}
                    onMouseLeave={() => setHoveredKey(null)}
                  >
                    📋 {currentEtape.libelle}
                  </span>
                  {hoveredKey === 'etape-badge' && currentEtape.parenthese && (
                    <div style={{
                      position: 'absolute', top: '110%', left: 0, zIndex: 10000,
                      background: '#1a1a1a', color: 'white', borderRadius: 6,
                      padding: '8px 12px', fontSize: '0.82em', lineHeight: 1.6,
                      maxWidth: 340, whiteSpace: 'normal', wordBreak: 'break-word',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)', pointerEvents: 'none',
                    }}>
                      {currentEtape.parenthese}
                    </div>
                  )}
                </div>
              )}
              {currentNiveau && niveauColor && (
                <span style={{
                  fontSize: '0.78em', padding: '3px 10px', borderRadius: 20,
                  background: niveauColor.bg, color: niveauColor.color,
                  border: `1px solid ${niveauColor.border}`, fontWeight: 'bold'
                }}>
                  {NIVEAU_LABELS[currentNiveau]}
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden', minHeight: 0, marginTop: 8 }}>

          {/* ── Left column: RTE ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Rédigez ou modifiez vos directives ci-dessous. Cliquez un exemple à droite pour l'insérer au curseur.
            </p>
            <ReactQuill
              ref={quillRef}
              className="directive-quill"
              value={value}
              onChange={setValue}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              theme="snow"
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  background: '#00A4E4', color: 'white', border: 'none',
                  borderRadius: 5, padding: '8px 20px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '0.9em',
                  transition: 'background 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0084b0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#00A4E4'; }}>
                Appliquer
                </button>
                <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#6c757d', color: 'white', border: 'none',
                  borderRadius: 5, padding: '8px 16px', cursor: 'pointer', fontSize: '0.9em',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#545b62'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#6c757d'; }}>
                Annuler
              </button>
            </div>
          </div>

          {/* ── Right column: Accordion examples ── */}
          <div style={{
            width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid #e5e7eb', paddingLeft: 16, overflow: 'hidden'
          }}>

            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Survolez un exemple pour le voir en entier. Cliquez pour l'insérer.
              {currentNiveau && <> <strong>★</strong> = niveau actuel.</>}
            </p>

            {availableNiveaux.length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.9em' }}>Aucun exemple disponible pour cette étape.</p>
            ) : (
              <ScrollArea style={{ flex: 1, paddingLeft: 8, marginLeft: -8, overflow: 'visible' }}>
                <Accordion
                  type="multiple"
                  value={openAccordions}
                  onValueChange={setOpenAccordions}
                >
                  {availableNiveaux.map(n => (
                    <AccordionItem key={n} value={n} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <AccordionTrigger style={{ fontSize: '0.82em', padding: '8px 4px', fontWeight: n === currentNiveau ? 'bold' : 'normal' }}>
                        {n === currentNiveau ? '★ ' : ''}{NIVEAU_LABELS[n]}
                      </AccordionTrigger>
                      <AccordionContent style={{ padding: '4px 0 8px 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {getDirectives(n).map((d, i) => {
                            const key = `${n}-${i}`;
                            return (
                              <div key={i}>
                                <button
                                  type="button"
                                  className="example-btn"
                                  onClick={() => insertExample(d.exemple)}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltipPos({ top: rect.top, right: window.innerWidth - rect.left + 8 });
                                    setHoveredKey(key);
                                  }}
                                  onMouseLeave={() => setHoveredKey(null)}
                                  style={{
                                    textAlign: 'left',
                                    padding: '7px 10px',
                                    border: '1px solid #ddd',
                                    borderRadius: 5,
                                    cursor: 'pointer',
                                    background: 'white',
                                    fontFamily: 'inherit',
                                    fontSize: '0.82em',
                                    lineHeight: 1.4,
                                    color: '#231F20',
                                    width: '100%',
                                  }}
                                >
                                  {d.court}…
                                </button>
                                {hoveredKey === key && (
                                  <div style={{
                                    position: 'fixed', right: tooltipPos.right, top: tooltipPos.top, zIndex: 99999,
                                    background: '#1a1a1a', color: 'white', borderRadius: 6,
                                    padding: '8px 12px', fontSize: '0.82em', lineHeight: 1.6,
                                    maxWidth: 360, whiteSpace: 'normal', wordBreak: 'break-word',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)', pointerEvents: 'none',
                                  }}
                                    dangerouslySetInnerHTML={{ __html: d.exemple }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}