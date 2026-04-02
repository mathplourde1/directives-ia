import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CustomActionModal({ isOpen, onClose, onSave, initialValue, categoryColor }) {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    if (isOpen) setValue(initialValue || '');
  }, [isOpen, initialValue]);

  function handleApply() {
    onSave(value.trim());
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: 480, width: '95vw', padding: '20px 24px' }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: '1em' }}>Action personnalisée</DialogTitle>
        </DialogHeader>

        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: '0.82em', color: '#555', marginBottom: 10, lineHeight: 1.5 }}>
            Décrivez l'action en utilisant minimalement un <strong>verbe</strong> et un <strong>objet</strong>, et ajoutez un <strong>contexte</strong> ou un <strong>qualificatif</strong> si nécessaire.<br />
            <span style={{ color: '#888', fontStyle: 'italic' }}>Ex. : Générer une première version intégrale du premier chapitre.</span>
          </p>
          <textarea
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Verbe + objet [+ contexte / qualificatif]…"
            rows={3}
            style={{
              width: '100%',
              border: '1px solid #ccc',
              borderRadius: 6,
              padding: '8px 10px',
              fontFamily: 'inherit',
              fontSize: '0.9em',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleApply}
              style={{
                flex: 1, background: categoryColor || '#00A4E4', color: 'white',
                border: 'none', borderRadius: 5, padding: '8px 12px',
                cursor: 'pointer', fontWeight: 'bold', fontSize: '0.88em',
              }}
            >
              Appliquer
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, background: '#f1f1f1', color: '#555',
                border: '1px solid #ccc', borderRadius: 5, padding: '8px 12px',
                cursor: 'pointer', fontSize: '0.88em',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}