import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import exemplesDeclarations from '@/components/exemplesDeclarations';
import { ScrollArea } from '@/components/ui/scroll-area';

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
          const url = prompt("Entrez l'adresse URL du lien :");
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

const FIELD_LABELS = {
  iagraphie: 'Références et IAgraphie',
  traces: 'Conserver les traces suivantes',
  logique: "Expliquer la logique d'utilisation",
};

export default function ExigenceEditModal({
  isOpen, onClose, onSave, initialValue, exigenceType
}) {
  const [value, setValue] = useState(initialValue || '');
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const quillRef = useRef();

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || '');
    }
  }, [isOpen, initialValue]);

  const exemples = exemplesDeclarations
    .filter(e => e.code === exigenceType)
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
    quill.formatText(index, text.length, 'background', '#ffe066', 'api');
    setTimeout(() => {
      quill.formatText(index, text.length, 'background', false, 'api');
    }, 500);
  }

  function handleApply() {
    onSave(value);
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
        <style>{`
          .decl-quill { display: flex; flex-direction: column; flex: 1; min-height: 0; }
          .decl-quill .ql-toolbar { flex-shrink: 0; border-radius: 6px 6px 0 0; }
          .decl-quill .ql-container { flex: 1; overflow-y: auto; font-family: Arial, sans-serif; font-size: 0.9em; border-radius: 0 0 6px 6px; }
          .decl-quill .ql-editor { min-height: 180px; }
          .decl-quill .ql-editor a { color: #0056b3; text-decoration: underline; }
          .decl-quill .ql-tooltip::before { content: "Visiter l'URL :"; }
          .decl-quill .ql-tooltip a.ql-action::after { content: "Modifier"; }
          .decl-quill .ql-tooltip a.ql-remove::before { content: "Supprimer"; }
          .decl-quill .ql-tooltip.ql-editing a.ql-action::after { content: "Enregistrer"; }
          .decl-quill .ql-tooltip[data-mode=link]::before { content: "Entrez le lien :"; }
          .decl-quill .ql-editor ul { list-style-type: disc; padding-left: 20px; }
          .decl-quill .ql-editor li { display: list-item; }
          .decl-example-btn { transition: background 0.15s, border-color 0.15s !important; }
          .decl-example-btn:hover { background: #e8f4fd !important; border-color: #00A4E4 !important; }
        `}</style>

        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1.05em', fontWeight: 'bold', color: '#231F20' }}>
          {FIELD_LABELS[exigenceType] || 'Modifier'}
        </h3>

        <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left: RTE */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Rédigez ou modifiez le texte ci-dessous. Cliquez un exemple à droite pour l'insérer.
            </p>
            <ReactQuill
              ref={quillRef}
              className="decl-quill"
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
                style={{ background: '#444444', color: 'white', border: 'none', borderRadius: 5, padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#444444'; }}>
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

          {/* Right: Examples */}
          <div style={{
            width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid #e5e7eb', paddingLeft: 16, overflow: 'hidden'
          }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Survolez un exemple pour le voir en entier. Cliquez pour l'insérer.
            </p>
            {exemples.length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.9em' }}>Aucun exemple disponible.</p>
            ) : (
              <ScrollArea style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {exemples.map((ex, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="decl-example-btn"
                        onClick={() => insertExample(ex.exemple)}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        style={{
                          textAlign: 'left', padding: '7px 10px', border: '1px solid #ddd',
                          borderRadius: 5, cursor: 'pointer', background: 'white',
                          fontFamily: 'inherit', fontSize: '0.82em', lineHeight: 1.4,
                          color: '#231F20', width: '100%',
                        }}
                      >
                        {ex.court}…
                      </button>
                      {hoveredIdx === idx && (
                        <div style={{
                          position: 'absolute', right: '105%', top: 0, zIndex: 10000,
                          background: '#1a1a1a', color: 'white', borderRadius: 6,
                          padding: '8px 12px', fontSize: '0.82em', lineHeight: 1.6,
                          maxWidth: 340, whiteSpace: 'normal', wordBreak: 'break-word',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.3)', pointerEvents: 'none',
                        }}
                          dangerouslySetInnerHTML={{ __html: ex.exemple }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}