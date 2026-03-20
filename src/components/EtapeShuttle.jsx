import React from 'react';
import ETAPES from '@/components/etapesData';

function getStatutIA(ia) {
  if (!ia) return 'non-mentionnee';
  const v = ia.toLowerCase();
  if (v.includes('obligatoire')) return 'obligatoire';
  if (v.includes('interdit') || v.includes('non autoris')) return 'interdite';
  if (v.includes('sans restriction')) return 'sans-restriction';
  if (v.includes('restriction') || v.includes('restreint')) return 'avec-restriction';
  return 'sans-restriction';
}

const STATUT_CONFIG = {
  'obligatoire':      { label: 'Obligatoire',        color: '#155724', bg: '#d4edda', order: 0 },
  'sans-restriction': { label: 'Sans restrictions',    color: '#0c5460', bg: '#d1ecf1', order: 1 },
  'avec-restriction': { label: 'Avec restrictions',   color: '#856404', bg: '#fff3cd', order: 2 },
  'non-mentionnee':   { label: 'Non mentionnée',      color: '#6c757d', bg: '#e2e3e5', order: 3 },
  'interdite':        { label: 'Non autorisée',        color: '#721c24', bg: '#f8d7da', order: 4 },
};

function EtapeItem({ etape, onClick, actionLabel, actionColor }) {
  const statut = STATUT_CONFIG[etape.statut];
  return (
    <div
      onClick={onClick}
      title={etape.parenthese || undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px', borderRadius: 5,
        background: 'white', border: '1px solid #e0e0e0',
        marginBottom: 4, cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 1px 5px rgba(0,0,0,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <span style={{
        fontSize: '0.73em', padding: '2px 7px', borderRadius: 99,
        background: statut.bg, color: statut.color,
        fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0
      }}>
        {statut.label}
      </span>
      <span style={{ fontSize: '0.88em', flex: 1, lineHeight: 1.3 }}>{etape.libelle}</span>
      <span style={{ fontSize: '1em', color: actionColor, fontWeight: 'bold', flexShrink: 0 }}>{actionLabel}</span>
    </div>
  );
}

export default function EtapeShuttle({ dataEtapes, selectedIds, onChange, hasError }) {
  // Build full étape list with statut
  const allEtapes = [];

  dataEtapes.forEach(etape => {
    allEtapes.push({
      id: etape.etapeInfo.id,
      libelle: etape.etapeInfo.libelle,
      parenthese: etape.etapeInfo.parenthese,
      statut: getStatutIA(etape.ia),
    });
  });

  // Add non-mentioned étapes from master list
  ETAPES.forEach(e => {
    if (e.id === 'autres') return;
    if (!allEtapes.find(a => a.id === e.id)) {
      allEtapes.push({
        id: e.id,
        libelle: e.libelle,
        parenthese: e.parenthese,
        statut: 'non-mentionnee',
      });
    }
  });

  // Sort by statut order
  allEtapes.sort((a, b) => STATUT_CONFIG[a.statut].order - STATUT_CONFIG[b.statut].order);

  const selected = allEtapes.filter(e => selectedIds.includes(e.id));
  const available = allEtapes.filter(e => !selectedIds.includes(e.id));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Left: selected */}
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.85em', marginBottom: 6, color: '#231F20' }}>
            ✅ Étapes sélectionnées ({selected.length})
          </div>
          <div style={{
            background: hasError ? '#fff4f4' : '#f0fdf4',
            border: hasError ? '2px solid #E41E25' : '1px solid #b7e0c0',
            borderRadius: 6, padding: 8, minHeight: 90
          }}>
            {selected.length === 0
              ? <p style={{ color: '#999', fontSize: '0.82em', margin: 0, fontStyle: 'italic', textAlign: 'center', paddingTop: 22 }}>
                  Cliquez sur une étape à droite pour l'ajouter.
                </p>
              : selected.map(e => (
                  <EtapeItem key={e.id} etape={e} onClick={() => onChange(selectedIds.filter(id => id !== e.id))} actionLabel="✕" actionColor="#E41E25" />
                ))
            }
          </div>
        </div>

        {/* Right: available */}
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.85em', marginBottom: 6, color: '#231F20' }}>
            Étapes disponibles ({available.length})
          </div>
          <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6, padding: 8, minHeight: 90 }}>
            {available.length === 0
              ? <p style={{ color: '#999', fontSize: '0.82em', margin: 0, fontStyle: 'italic', textAlign: 'center', paddingTop: 22 }}>
                  Toutes les étapes ont été sélectionnées.
                </p>
              : available.map(e => (
                  <EtapeItem key={e.id} etape={e} onClick={() => onChange([...selectedIds, e.id])} actionLabel="+" actionColor="#00A4E4" />
                ))
            }
          </div>
        </div>
      </div>
      {hasError && <span style={{ color: '#E41E25', fontSize: '0.82em', display: 'block', marginTop: 4 }}>⚠ Sélectionnez au moins une étape</span>}
    </div>
  );
}