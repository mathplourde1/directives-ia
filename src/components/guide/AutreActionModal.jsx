import React, { useState, useEffect } from 'react';
import PHASES from '@/components/directives/directivesData';

export default function AutreActionModal({ isOpen, onClose, onSave, initialValues }) {
  const [selectedPhaseId, setSelectedPhaseId] = useState(PHASES[0]?.id || '');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPhaseId(initialValues?.phaseId || PHASES[0]?.id || '');
      setLabel(initialValues?.libelle || '');
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const selectedPhase = PHASES.find(p => p.id === selectedPhaseId) || PHASES[0];

  function handleSave() {
    if (!label.trim()) return;
    onSave({ libelle: label.trim(), phaseId: selectedPhaseId, phaseLibelle: selectedPhase?.libelle, phaseColor: selectedPhase?.color });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 10, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ background: '#1895FD', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1em' }}>{initialValues ? "Modifier l'action personnalisée" : "Ajouter une action personnalisée"}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.3em', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Instructions */}
          <p style={{ margin: '0 0 14px', fontSize: '0.9em', color: '#444', lineHeight: 1.5 }}>
            Décrivez une action que le SIA a effectuée pour vous et qui ne figure pas dans la liste. Choisissez d'abord la phase de production correspondante, puis inspirez-vous des exemples à droite.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Left: phase + saisie */}
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.88em', display: 'block', marginBottom: 6 }}>Phase de production</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {PHASES.map(p => (
                  <button key={p.id} type="button" onClick={() => setSelectedPhaseId(p.id)}
                    style={{ textAlign: 'left', padding: '7px 12px', borderRadius: 6, border: selectedPhaseId === p.id ? `2px solid ${p.color}` : '1px solid #ddd', background: selectedPhaseId === p.id ? `${p.color}18` : 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88em', fontWeight: selectedPhaseId === p.id ? 'bold' : 'normal', color: selectedPhaseId === p.id ? p.color : '#333' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: p.color, marginRight: 7, flexShrink: 0 }} />
                    {p.libelle}
                  </button>
                ))}
              </div>

              <label style={{ fontWeight: 'bold', fontSize: '0.88em', display: 'block', marginBottom: 5 }}>
                Description de l'action <span style={{ color: '#E41E25' }}>*</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="ex. Générer des exemples de code…"
                autoFocus
                style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #aaa', borderRadius: 4, boxSizing: 'border-box' }}
              />
            </div>

            {/* Right: ideas from full phase list */}
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.88em', display: 'block', marginBottom: 6, color: selectedPhase?.color }}>
                Idées — {selectedPhase?.libelle}
              </label>
              <div style={{ border: `1px solid ${selectedPhase?.color || '#ddd'}`, borderRadius: 6, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                {selectedPhase?.actions.map(a => (
                  <button key={a.id} type="button" onClick={() => setLabel(a.libelle)}
                    style={{ width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: '0.83em', background: 'white', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontFamily: 'inherit', color: '#333', lineHeight: 1.4 }}
                    onMouseEnter={e => e.currentTarget.style.background = `${selectedPhase.color}12`}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    {a.libelle}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.78em', color: '#888', fontStyle: 'italic' }}>Cliquez sur une idée pour la copier dans le champ.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose}
            style={{ padding: '7px 18px', borderRadius: 5, border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em' }}>
            Annuler
          </button>
          <button type="button" onClick={handleSave} disabled={!label.trim()}
            style={{ padding: '7px 18px', borderRadius: 5, border: 'none', background: label.trim() ? '#1895FD' : '#aaa', color: 'white', cursor: label.trim() ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: 'bold' }}>
            {initialValues ? 'Enregistrer les modifications' : 'Ajouter l\'action'}
          </button>
        </div>
      </div>
    </div>
  );
}