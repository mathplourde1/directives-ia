import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PHASES, { PERMISSION_LEVELS } from './directivesData';
import CustomActionModal from '@/components/restrictions/CustomActionModal';

const COLUMN_STYLES = [
  { id: 'non', libelle: 'Non autorisée', color: '#E41E25', bg: '#fff4f4', border: '#E41E25', headerBg: '#E41E25' },
  { id: 'aar', libelle: 'Autorisée avec restrictions', color: '#b45309', bg: '#fffbeb', border: '#f59e0b', headerBg: '#f59e0b' },
  { id: 'asr', libelle: 'Autorisée sans restriction', color: '#15803d', bg: '#f0fdf4', border: '#22c55e', headerBg: '#22c55e' },
  { id: 'obl', libelle: 'Obligatoire', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6', headerBg: '#3b82f6' },
];

const COL_IDS = COLUMN_STYLES.map(c => c.id);
const ALL_ACTIONS = PHASES.flatMap(p => p.actions.map(a => ({ ...a, phaseId: p.id })));

// Map phaseId -> phase info
const PHASE_MAP = {};
PHASES.forEach(p => { PHASE_MAP[p.id] = p; });

function getPhaseForAction(actionId) {
  for (const p of PHASES) {
    if (p.actions.find(a => a.id === actionId)) return p;
  }
  return null;
}

function ActionChip({ action, levelId, colIndex, onMoveTo, onRemove, dragHandleProps, isDragging, isCustom, onLabelChange, hasError }) {
  const col = COLUMN_STYLES.find(c => c.id === levelId) || COLUMN_STYLES[0];
  const phase = getPhaseForAction(action.id);
  const chipColor = isCustom ? '#888' : (phase?.color || '#888');
  const [hoverZone, setHoverZone] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    if (x < w * 0.1) setHoverZone('left');
    else if (x > w * 0.9) setHoverZone('right');
    else setHoverZone(null);
  }

  const prevColId = COL_IDS[colIndex - 1];
  const nextColId = COL_IDS[colIndex + 1];

  return (
    <div
      style={{
        background: isCustom ? (isDragging ? col.bg : '#fffdf0') : (isDragging ? col.bg : 'white'),
        border: hasError ? '2px solid #E41E25' : (isCustom ? `1px dashed ${col.border}` : `1px solid ${col.border}`),
        borderRadius: 6,
        marginBottom: 4,
        fontSize: '0.82em',
        display: 'flex',
        alignItems: 'stretch',
        position: 'relative',
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
        userSelect: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverZone(null)}
    >
      {/* Left arrow */}
      <div
        style={{ width: '10%', minWidth: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: prevColId ? 'pointer' : 'default', borderRadius: '6px 0 0 6px', background: hoverZone === 'left' && prevColId ? 'rgba(0,0,0,0.06)' : 'transparent', transition: 'background 0.12s', flexShrink: 0 }}
        onClick={() => prevColId && onMoveTo(action.id, prevColId)}
        title={prevColId ? `Déplacer vers "${COLUMN_STYLES.find(c => c.id === prevColId)?.libelle}"` : ''}
      >
        {hoverZone === 'left' && prevColId && <span style={{ color: COLUMN_STYLES.find(c => c.id === prevColId)?.headerBg, fontWeight: 'bold', fontSize: '1em', lineHeight: 1 }}>◀</span>}
      </div>

      {/* Middle: drag + label */}
      <div {...dragHandleProps} style={{ flex: 1, padding: '5px 4px', cursor: 'grab', display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
        {/* Phase color dot */}
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: chipColor, flexShrink: 0, marginTop: 4, marginRight: 5 }} title={phase?.libelle} />
        {isCustom ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
            <span style={{ flex: 1, wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.3, fontStyle: 'italic', color: '#555' }}>{action.libelle}</span>
            <button type="button" onClick={e => { e.stopPropagation(); setModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.85em', padding: '0 2px', flexShrink: 0 }}>✎</button>
            <CustomActionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialValue={action.libelle} onSave={newLabel => onLabelChange(action.id, newLabel)} categoryColor="#888" />
          </div>
        ) : (
          <span style={{ flex: 1, wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.3 }}>{action.libelle}</span>
        )}
        <button type="button" onClick={e => { e.stopPropagation(); onRemove(action.id); }} title="Retirer" style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1em', lineHeight: 1, padding: '0 2px', flexShrink: 0, alignSelf: 'flex-start' }}>×</button>
      </div>

      {/* Right arrow */}
      <div
        style={{ width: '10%', minWidth: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: nextColId ? 'pointer' : 'default', borderRadius: '0 6px 6px 0', background: hoverZone === 'right' && nextColId ? 'rgba(0,0,0,0.06)' : 'transparent', transition: 'background 0.12s', flexShrink: 0 }}
        onClick={() => nextColId && onMoveTo(action.id, nextColId)}
        title={nextColId ? `Déplacer vers "${COLUMN_STYLES.find(c => c.id === nextColId)?.libelle}"` : ''}
      >
        {hoverZone === 'right' && nextColId && <span style={{ color: COLUMN_STYLES.find(c => c.id === nextColId)?.headerBg, fontWeight: 'bold', fontSize: '1em', lineHeight: 1 }}>▶</span>}
      </div>
    </div>
  );
}

let customCounter = 0;
function makeCustomId() {
  return `custom-dir-${++customCounter}-${Date.now()}`;
}

export default function DirectivesSection({
  permissions,
  onPermissionChange,
  onStateChange,
  showErrors,
  initialMode,
  initialPrecisions,
  initialColumnOrder,
  initialRemovedIds,
  initialCustomActions,
}) {
  const [mode, setMode] = useState(initialMode || 'aucune');
  const [precisions, setPrecisions] = useState(initialPrecisions || '');

  const buildInitialOrder = useCallback(() => {
    if (initialColumnOrder && Object.keys(initialColumnOrder).length > 0) return initialColumnOrder;
    const order = {};
    COLUMN_STYLES.forEach(col => { order[col.id] = []; });
    return order;
  }, []);

  const [columnOrder, setColumnOrder] = useState(buildInitialOrder);
  const [removedIds, setRemovedIds] = useState(() => initialRemovedIds ?? ALL_ACTIONS.map(a => a.id));
  const [customActions, setCustomActions] = useState(initialCustomActions || {});
  const [pendingModal, setPendingModal] = useState(null);


  function getAllActions() {
    const base = ALL_ACTIONS.filter(a => !removedIds.includes(a.id));
    const customs = Object.values(customActions).filter(a => !removedIds.includes(a.id));
    return [...base, ...customs];
  }

  function getActionById(id) {
    const base = ALL_ACTIONS.find(a => a.id === id);
    if (base) return { ...base, isCustom: false };
    const custom = customActions[id];
    if (custom) return { ...custom, isCustom: true };
    return null;
  }

  const emptyCustomIds = Object.values(customActions)
    .filter(a => !removedIds.includes(a.id) && !a.libelle.trim())
    .map(a => a.id);

  const totalInColumns = COL_IDS.reduce((sum, cid) => sum + (columnOrder[cid] || []).filter(id => !removedIds.includes(id)).length, 0);
  const hasNoActionInColumns = totalInColumns === 0;

  useEffect(() => {
    if (onStateChange) onStateChange({ columnOrder, removedIds, customActions, hasEmptyCustom: emptyCustomIds.length > 0, hasNoActionInColumns, precisions, mode });
  }, [columnOrder, removedIds, customActions, precisions, mode]);

  function handleMove(actionId, newColId) {
    setColumnOrder(prev => {
      const next = { ...prev };
      COL_IDS.forEach(cid => { next[cid] = (next[cid] || []).filter(id => id !== actionId); });
      next[newColId] = [...(next[newColId] || []), actionId];
      return next;
    });
    onPermissionChange(actionId, newColId);
  }

  function handleRemove(actionId) {
    if (customActions[actionId]) {
      setCustomActions(prev => { const next = { ...prev }; delete next[actionId]; return next; });
      setColumnOrder(prev => { const next = { ...prev }; COL_IDS.forEach(cid => { next[cid] = (next[cid] || []).filter(id => id !== actionId); }); return next; });
      return;
    }
    setRemovedIds(prev => [...prev, actionId]);
    setColumnOrder(prev => { const next = { ...prev }; COL_IDS.forEach(cid => { next[cid] = (next[cid] || []).filter(id => id !== actionId); }); return next; });
  }

  function handleAddCustom(colId) { setPendingModal({ colId }); }

  function handlePendingModalSave(label) {
    if (!label.trim()) { setPendingModal(null); return; }
    const colId = pendingModal.colId;
    const id = makeCustomId();
    const newAction = { id, libelle: label.trim(), colId, phaseId: null };
    setCustomActions(prev => ({ ...prev, [id]: newAction }));
    setColumnOrder(prev => { const next = { ...prev }; next[colId] = [...(next[colId] || []), id]; return next; });
    onPermissionChange(id, colId);
    setPendingModal(null);
  }

  function handleCustomLabelChange(actionId, newLabel) {
    setCustomActions(prev => ({ ...prev, [actionId]: { ...prev[actionId], libelle: newLabel } }));
  }

  const REMOVED_ZONE = '__removed__';

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;

    if (dstCol === REMOVED_ZONE) {
      if (srcCol === REMOVED_ZONE) return;
      setRemovedIds(prev => [...prev, draggableId]);
      setColumnOrder(prev => { const next = { ...prev }; COL_IDS.forEach(cid => { next[cid] = (next[cid] || []).filter(id => id !== draggableId); }); return next; });
      return;
    }

    if (srcCol === REMOVED_ZONE) {
      setRemovedIds(prev => prev.filter(id => id !== draggableId));
      setColumnOrder(prev => {
        const next = { ...prev };
        const dstList = Array.from(next[dstCol] || []);
        dstList.splice(destination.index, 0, draggableId);
        next[dstCol] = dstList;
        return next;
      });
      onPermissionChange(draggableId, dstCol);
      return;
    }

    setColumnOrder(prev => {
      const next = { ...prev };
      if (srcCol === dstCol) {
        const list = Array.from(next[srcCol] || []);
        const [removed] = list.splice(source.index, 1);
        list.splice(destination.index, 0, removed);
        next[srcCol] = list;
      } else {
        const srcList = Array.from(next[srcCol] || []);
        const [removed] = srcList.splice(source.index, 1);
        next[srcCol] = srcList;
        const dstList = Array.from(next[dstCol] || []);
        dstList.splice(destination.index, 0, removed);
        next[dstCol] = dstList;
        onPermissionChange(draggableId, dstCol);
      }
      return next;
    });
  }

  // Group removed actions by phase for the 3-column pool
  const removedByPhase = PHASES.map(p => ({
    phase: p,
    actions: [
      ...p.actions.filter(a => removedIds.includes(a.id)),
      ...Object.values(customActions).filter(a => removedIds.includes(a.id) && a.phaseId === p.id),
    ]
  }));
  const removedCustomNoPhase = Object.values(customActions).filter(a => removedIds.includes(a.id) && !a.phaseId);
  // All removed for DnD (flat list indexed)
  const allRemovedActions = [
    ...PHASES.flatMap(p => p.actions.filter(a => removedIds.includes(a.id))),
    ...Object.values(customActions).filter(a => removedIds.includes(a.id)),
  ];

  return (
    <div style={{ background: 'white', borderRadius: 8, border: '2px solid #1895FD', marginBottom: 20, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#1895FD', color: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 'bold', fontSize: '1em' }}>Directives à l'intention des personnes étudiantes</span>
        <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
          <button type="button"
            onClick={() => setMode('aucune')}
            style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: mode === 'aucune' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: mode === 'aucune' ? 'rgba(255,255,255,0.9)' : 'transparent', color: mode === 'aucune' ? '#1895FD' : 'white', transition: 'background 0.15s', borderRadius: '999px 0 0 999px' }}>
            Aucune restriction
          </button>
          <button type="button"
            onClick={() => setMode('restreindre')}
            style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: mode === 'restreindre' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: mode === 'restreindre' ? 'rgba(255,255,255,0.9)' : 'transparent', color: mode === 'restreindre' ? '#1895FD' : 'white', transition: 'background 0.15s', borderRadius: '0 999px 999px 0' }}>
            Restreindre l'usage des SIA
          </button>
        </div>
      </div>

      {mode === 'aucune' ? (
        <div style={{ padding: '10px 16px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>
          Aucune restriction appliquée. Les SIA sont autorisés sans restriction pour toutes les actions.
        </div>
      ) : (
      <div style={{ padding: '12px 14px' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Suggested actions pool — 3 columns by phase */}
          <Droppable droppableId={REMOVED_ZONE} direction="horizontal">
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                style={{ background: snapshot.isDraggingOver ? '#e8e8e8' : '#f5f5f5', border: snapshot.isDraggingOver ? '1px dashed #999' : '1px dashed #bbb', borderRadius: 6, padding: '8px 10px', marginBottom: 12, transition: 'background 0.1s' }}>
                <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
                  Actions suggérées d'un SIA {snapshot.isDraggingOver ? '(déposer ici pour retirer des colonnes)' : '— faites glisser vers une colonne de permission :'}
                </span>
                {/* 3-column layout by phase */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PHASES.map(phase => {
                    const phaseRemoved = phase.actions.filter(a => removedIds.includes(a.id));
                    return (
                      <div key={phase.id}>
                        <div style={{ fontSize: '0.75em', fontWeight: 'bold', color: phase.color, marginBottom: 4, borderBottom: `1px solid ${phase.color}`, paddingBottom: 2 }}>{phase.libelle}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {phaseRemoved.map((action) => {
                            const globalIdx = allRemovedActions.findIndex(a => a.id === action.id);
                            return (
                              <Draggable key={action.id} draggableId={action.id} index={globalIdx < 0 ? 0 : globalIdx}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 5,
                                      background: dragSnapshot.isDragging ? '#fff' : 'white',
                                      border: `1px solid ${phase.color}`,
                                      borderRadius: 14, padding: '2px 8px', fontSize: '0.78em', cursor: 'grab',
                                      boxShadow: dragSnapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                      ...dragProvided.draggableProps.style,
                                    }}
                                  >
                                    <span style={{ color: phase.color }}>{action.libelle}</span>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Custom no-phase removed actions */}
                {removedCustomNoPhase.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {removedCustomNoPhase.map(action => {
                      const globalIdx = allRemovedActions.findIndex(a => a.id === action.id);
                      return (
                        <Draggable key={action.id} draggableId={action.id} index={globalIdx < 0 ? 0 : globalIdx}>
                          {(dragProvided, dragSnapshot) => (
                            <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                              style={{ display: 'flex', alignItems: 'center', background: dragSnapshot.isDragging ? '#fff' : 'white', border: '1px dashed #888', borderRadius: 14, padding: '2px 8px', fontSize: '0.78em', cursor: 'grab', boxShadow: dragSnapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none', ...dragProvided.draggableProps.style }}>
                              <span style={{ color: '#888', fontStyle: 'italic' }}>{action.libelle}</span>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* 4 permission columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {COLUMN_STYLES.map((col, colIndex) => {
              const orderedIds = (columnOrder[col.id] || []).filter(id => !removedIds.includes(id));
              return (
                <div key={col.id} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: col.headerBg, color: 'white', padding: '4px 8px', fontSize: '0.75em', fontWeight: 'bold', textAlign: 'center' }}>
                    {col.libelle}
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        style={{ padding: '6px 6px', minHeight: 60, flex: 1, background: snapshot.isDraggingOver ? col.bg : 'transparent', transition: 'background 0.1s' }}>
                        {orderedIds.length === 0 && !snapshot.isDraggingOver && (
                          <p style={{ color: '#bbb', fontSize: '0.78em', fontStyle: 'italic', margin: '4px 0', textAlign: 'center' }}>—</p>
                        )}
                        {orderedIds.map((actionId, idx) => {
                          const action = getActionById(actionId);
                          if (!action) return null;
                          return (
                            <Draggable key={actionId} draggableId={actionId} index={idx}>
                              {(dragProvided, dragSnapshot) => (
                                <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                                  <ActionChip
                                    action={action}
                                    levelId={col.id}
                                    colIndex={colIndex}
                                    onMoveTo={handleMove}
                                    onRemove={handleRemove}
                                    dragHandleProps={dragProvided.dragHandleProps}
                                    isDragging={dragSnapshot.isDragging}
                                    isCustom={!!action.isCustom}
                                    onLabelChange={handleCustomLabelChange}
                                    hasError={showErrors && !!action.isCustom && emptyCustomIds.includes(action.id)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  <div style={{ padding: '4px 6px 8px 6px' }}>
                    <button type="button" onClick={() => handleAddCustom(col.id)}
                      style={{ width: '100%', background: 'none', border: `1px dashed ${col.border}`, borderRadius: 5, color: col.color, fontSize: '0.78em', padding: '3px 6px', cursor: 'pointer', textAlign: 'left', opacity: 0.75 }}>
                      + action personnalisée
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {pendingModal && (
          <CustomActionModal isOpen={true} onClose={() => setPendingModal(null)} initialValue="" onSave={handlePendingModalSave} categoryColor="#1895FD" />
        )}

        {/* Précisions */}
        <div style={{ marginTop: 10 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85em', display: 'block', marginBottom: 4, color: '#444' }}>Précisions</label>
          <textarea
            value={precisions}
            onChange={e => setPrecisions(e.target.value)}
            placeholder="Ajoutez ici des précisions sur l'utilisation des SIA pour cette évaluation…"
            rows={2}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontFamily: 'inherit', fontSize: '0.88em', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>
      </div>
      )}
    </div>
  );
}