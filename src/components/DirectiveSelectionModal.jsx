import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import exemplesDirectives from './exemplesDirectives.json';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const HIERARCHY = ['non', 'aar', 'asr', 'obl'];

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic'],
    ['link'],
    ['clean'],
  ],
};
const QUILL_FORMATS = ['bold', 'italic', 'link'];

export default function DirectiveSelectionModal({
  isOpen, onClose, onSave, initialValue, currentEtapeId, currentIaOption
}) {
  const currentNiveau = NIVEAU_MAP[currentIaOption] || null;
  const [value, setValue] = useState(initialValue || '');
  const [openAccordions, setOpenAccordions] = useState(currentNiveau ? [currentNiveau] : []);
  const quillRef = useRef();

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
  }

  function handleApply() {
    onSave(value);
    onClose();
  }

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
        `}</style>

        <DialogHeader style={{ flexShrink: 0 }}>
          <DialogTitle style={{ color: '#231F20', fontSize: '1em' }}>
            Personnaliser les directives
          </DialogTitle>
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
                  fontWeight: 'bold', fontSize: '0.9em'
                }}>
                Appliquer
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#6c757d', color: 'white', border: 'none',
                  borderRadius: 5, padding: '8px 16px', cursor: 'pointer', fontSize: '0.9em'
                }}>
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
              <ScrollArea style={{ flex: 1 }}>
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
                          <TooltipProvider delayDuration={300}>
                            {getDirectives(n).map((d, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => insertExample(d.exemple)}
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
                                      transition: 'background 0.15s, border-color 0.15s',
                                      width: '100%',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#e8f4fd'; e.currentTarget.style.borderColor = '#00A4E4'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#ddd'; }}
                                  >
                                    {d.court}…
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  style={{
                                    maxWidth: 360,
                                    fontSize: '0.85em',
                                    lineHeight: 1.6,
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  <p>{d.exemple}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </TooltipProvider>
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