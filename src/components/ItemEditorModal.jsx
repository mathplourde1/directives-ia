import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ETAPES_DEFAULT from '@/components/etapesData';

const ETAPE_IDS = ETAPES_DEFAULT.map(e => e.id);
const NIVEAUX = ['non', 'aar', 'asr', 'obl'];
const CODES_DECL = ['iagraphie', 'traces', 'logique'];

const QUILL_MODULES = {
  toolbar: {
    container: [
      ['bold', 'italic'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
    handlers: {
      link: function(value) {
        const quill = this.quill;
        if (value) {
          const url = prompt("Entrez l'adresse URL du lien :");
          if (url) {
            const sel = quill.getSelection(true);
            if (sel && sel.length > 0) {
              quill.format('link', url);
            } else {
              const idx = sel ? sel.index : quill.getLength() - 1;
              quill.insertText(idx, url, 'link', url);
              quill.setSelection(idx + url.length);
            }
          }
        } else {
          quill.format('link', false);
        }
      }
    }
  },
};
const QUILL_FORMATS = ['bold', 'italic', 'link', 'list', 'bullet'];

function computeNextSeq(allItems, contentType, formData) {
  let siblings;
  if (contentType === 'directives') {
    siblings = allItems.filter(i => i.parent === formData.parent && i.niveau === formData.niveau);
  } else if (contentType === 'declarations') {
    siblings = allItems.filter(i => i.code === formData.code);
  } else {
    siblings = allItems;
  }
  return siblings.length ? Math.max(...siblings.map(i => i.sequence || 0)) + 1 : 1;
}

export default function ItemEditorModal({ isOpen, onClose, onSave, item, contentType, allItems, isNew }) {
  const [formData, setFormData] = useState({});
  const quillRef = useRef();

  useEffect(() => {
    if (isOpen && item) setFormData({ ...item });
  }, [isOpen, item]);

  if (!item) return null;

  const set = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const handleGroupChange = (key, val) => {
    const updated = { ...formData, [key]: val };
    if (isNew) updated.sequence = computeNextSeq(allItems, contentType, updated);
    setFormData(updated);
  };

  const inp = { width: '100%', padding: '5px 8px', border: '1px solid #aaa', borderRadius: 4, fontFamily: 'inherit', fontSize: '0.9em', boxSizing: 'border-box' };
  const lbl = { fontSize: '0.82em', fontWeight: 'bold', color: '#444', marginBottom: 3, display: 'block' };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{
        maxWidth: 680, width: '95vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 24px'
      }}>
        <style>{`
          .item-quill .ql-toolbar { border-radius: 6px 6px 0 0; }
          .item-quill .ql-container { font-family: inherit; font-size: 0.9em; border-radius: 0 0 6px 6px; }
          .item-quill .ql-editor { min-height: 120px; max-height: 240px; overflow-y: auto; }
          .item-quill .ql-editor a { color: #0056b3; text-decoration: underline; }
          .item-quill .ql-tooltip::before { content: "Visiter l'URL :"; }
          .item-quill .ql-tooltip a.ql-action::after { content: "Modifier"; }
          .item-quill .ql-tooltip a.ql-remove::before { content: "Supprimer"; }
          .item-quill .ql-tooltip.ql-editing a.ql-action::after { content: "Enregistrer"; }
          .item-quill .ql-tooltip[data-mode=link]::before { content: "Entrez le lien :"; }
          .item-quill .ql-editor ul { list-style-type: disc; padding-left: 20px; }
          .item-quill .ql-editor ol { list-style-type: decimal; padding-left: 20px; }
          .item-quill .ql-editor li { display: list-item; }
        `}</style>

        <DialogHeader style={{ flexShrink: 0, marginBottom: 10 }}>
          <DialogTitle style={{ fontSize: '1em', color: '#231F20' }}>
            {isNew ? 'Ajouter un item' : 'Modifier un item'}
          </DialogTitle>
        </DialogHeader>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>

          {contentType === 'etapes' && <>
            <div>
              <label style={lbl}>
                ID{' '}
                {!isNew && <span style={{ color: '#999', fontWeight: 'normal' }}>(non modifiable)</span>}
              </label>
              {isNew
                ? <input value={formData.id || ''} onChange={e => set('id', e.target.value)} style={inp} placeholder="ex: monEtape" />
                : <span style={{ background: '#e8f4fd', color: '#0056b3', padding: '3px 10px', borderRadius: 10, fontSize: '0.85em', fontWeight: 'bold' }}>{formData.id}</span>
              }
            </div>
            <div>
              <label style={lbl}>Séquence</label>
              <input type="number" value={formData.sequence || ''} onChange={e => set('sequence', parseInt(e.target.value) || 0)} style={{ ...inp, width: 80 }} />
            </div>
            <div>
              <label style={lbl}>Libellé</label>
              <input value={formData.libelle || ''} onChange={e => set('libelle', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Parenthèse</label>
              <textarea value={formData.parenthese || ''} onChange={e => set('parenthese', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
            </div>
          </>}

          {contentType === 'directives' && <>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Étape (parent)</label>
                <select value={formData.parent || ''} onChange={e => handleGroupChange('parent', e.target.value)} style={inp}>
                  {ETAPE_IDS.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Niveau</label>
                <select value={formData.niveau || ''} onChange={e => handleGroupChange('niveau', e.target.value)} style={inp}>
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ width: 80 }}>
                <label style={lbl}>Séquence</label>
                <input type="number" value={formData.sequence || ''} onChange={e => set('sequence', parseInt(e.target.value) || 0)} style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Court (aperçu bouton)</label>
              <input value={formData.court || ''} onChange={e => set('court', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Exemple (texte complet)</label>
              <ReactQuill ref={quillRef} className="item-quill" value={formData.exemple || ''} onChange={val => set('exemple', val)} modules={QUILL_MODULES} formats={QUILL_FORMATS} theme="snow" />
            </div>
          </>}

          {contentType === 'declarations' && <>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Code</label>
                <select value={formData.code || ''} onChange={e => handleGroupChange('code', e.target.value)} style={inp}>
                  {CODES_DECL.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ width: 80 }}>
                <label style={lbl}>Séquence</label>
                <input type="number" value={formData.sequence || ''} onChange={e => set('sequence', parseInt(e.target.value) || 0)} style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Court (aperçu bouton)</label>
              <input value={formData.court || ''} onChange={e => set('court', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Exemple (texte complet)</label>
              <ReactQuill ref={quillRef} className="item-quill" value={formData.exemple || ''} onChange={val => set('exemple', val)} modules={QUILL_MODULES} formats={QUILL_FORMATS} theme="snow" />
            </div>
          </>}

        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexShrink: 0, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <button type="button" onClick={() => onSave(formData)}
            style={{ background: '#00A4E4', color: 'white', border: 'none', borderRadius: 5, padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0084b0'}
            onMouseLeave={e => e.currentTarget.style.background = '#00A4E4'}>
            {isNew ? 'Ajouter' : 'Enregistrer'}
          </button>
          <button type="button" onClick={onClose}
            style={{ background: '#6c757d', color: 'white', border: 'none', borderRadius: 5, padding: '8px 16px', cursor: 'pointer', fontSize: '0.9em' }}
            onMouseEnter={e => e.currentTarget.style.background = '#545b62'}
            onMouseLeave={e => e.currentTarget.style.background = '#6c757d'}>
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}