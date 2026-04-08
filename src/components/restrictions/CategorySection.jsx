import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CustomActionModal from './CustomActionModal';
import BloomCategoryInfoModal from './BloomCategoryInfoModal';

const COLUMN_STYLES = [
  { id: 'non', libelle: 'Non autorisée', color: '#E41E25', bg: '#fff4f4', border: '#E41E25', headerBg: '#E41E25' },
  { id: 'aar', libelle: 'Autorisée avec restrictions', color: '#b45309', bg: '#fffbeb', border: '#f59e0b', headerBg: '#f59e0b' },
  { id: 'asr', libelle: 'Autorisée sans restriction', color: '#15803d', bg: '#f0fdf4', border: '#22c55e', headerBg: '#22c55e' },
  { id: 'obl', libelle: 'Obligatoire', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6', headerBg: '#3b82f6' },
];

const COL_IDS = COLUMN_STYLES.map(c => c.id);

function ActionChip({ action, levelId, colIndex, onMoveTo, onRemove, dragHandleProps, isDragging, isCustom, onLabelChange, hasError, categoryColor }) {
  const col = COLUMN_STYLES.find(c => c.id === levelId) || COLUMN_STYLES[0];
  const label = action.libelle;
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
        borderRadius: 6, marginBottom: 4, fontSize: '0.82em', display: 'flex', alignItems: 'stretch',
        position: 'relative', boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none', userSelect: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setHoverZone(null); }}
    >
      <div
        style={{ width: '10%', minWidth: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: prevColId ? 'pointer' : 'default', borderRadius: '6px 0 0 6px', background: hoverZone === 'left' && prevColId ? 'rgba(0,0,0,0.06)' : 'transparent', transition: 'background 0.12s', flexShrink: 0 }}
        onClick={() => prevColId && onMoveTo(action.id, prevColId)}
        title={prevColId ? `Déplacer vers "${COLUMN_STYLES.find(c => c.id === prevColId)?.libelle}"` : ''}
      >
        {hoverZone === 'left' && prevColId && <span style={{ color: COLUMN_STYLES.find(c => c.id === prevColId)?.headerBg, fontWeight: 'bold', fontSize: '1em', lineHeight: 1 }}>◀</span>}
      </div>

      <div {...dragHandleProps} style={{ flex: 1, padding: '5px 4px', cursor: 'grab', display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
        {isCustom ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
            <span style={{ flex: 1, wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.3, fontStyle: 'italic', color: '#555' }}>{label}</span>
            <button type="button" title="Modifier" onClick={e => { e.stopPropagation(); setModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.85em', padding: '0 2px', flexShrink: 0 }}>✎</button>
            <CustomActionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialValue={label} onSave={newLabel => onLabelChange(action.id, newLabel)} categoryColor={categoryColor} />
          </div>
        ) : (
          <span style={{ flex: 1, wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.3 }}>{label}</span>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(action.id); }} title="Retirer" style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1em', lineHeight: 1, padding: '0 2px', flexShrink: 0, alignSelf: 'flex-start' }}>×</button>
      </div>

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
function makeCustomId(catId) {
  return `custom-${catId}-${++customCounter}-${Date.now()}`;
}

export default function CategorySection({
  category, mode, onModeChange, permissions, precisions,
  onPermissionChange, onPrecisionsChange, onStateChange, showErrors,
  initialColumnOrder, initialRemovedIds, initialCustomActions,
}) {
  const buildInitialOrder = useCallback(() => {
    if (initialColumnOrder && Object.keys(initialColumnOrder).length > 0) return initialColumnOrder;
    const order = {};
    COLUMN_STYLES.forEach(col => { order[col.id] = []; });
    return order;
  }, []);

  const [columnOrder, setColumnOrder] = useState(buildInitialOrder);
  const [removedIds, setRemovedIds] = useState(() => initialRemovedIds ?? category.actions.map(a => a.id));
  const [customActions, setCustomActions] = useState(initialCustomActions || {});
  const [pendingModal, setPendingModal] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [hiddenOpen, setHiddenOpen] = useState(false);

  useEffect(() => { setShowInfoModal(false); }, [mode]);

  function getActionById(id) {
    const base = category.actions.find(a => a.id === id);
    if (base) return { ...base, isCustom: false };
    const custom = customActions[id];
    if (custom) return { ...custom, isCustom: true };
    return null;
  }

  const emptyCustomIds = Object.values(customActions)
    .filter(a => !removedIds.includes(a.id) && !a.libelle.trim())
    .map(a => a.id);

  const totalInColumns = COL_IDS.reduce((sum, cid) => sum + (columnOrder[cid] || []).filter(id => !removedIds.includes(id) && !hiddenIds.includes(id)).length, 0);
  const hasNoActionInColumns = totalInColumns === 0;

  useEffect(() => {
    if (onStateChange) onStateChange(category.id, { columnOrder, removedIds, customActions, hasEmptyCustom: emptyCustomIds.length > 0, hasNoActionInColumns });
  }, [columnOrder, removedIds, customActions]);

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

  function handleHide(actionId) {
    setHiddenIds(prev => [...prev, actionId]);
    setRemovedIds(prev => prev.filter(id => id !== actionId));
  }

  function handleUnhide(actionId) {
    setHiddenIds(prev => prev.filter(id => id !== actionId));
    setRemovedIds(prev => [...prev, actionId]);
  }

  function handleAddCustom(colId) { setPendingModal({ colId }); }

  function handlePendingModalSave(label) {
    if (!label.trim()) { setPendingModal(null); return; }
    const colId = pendingModal.colId;
    const id = makeCustomId(category.id);
    const newAction = { id, libelle: label.trim(), colId };
    setCustomActions(prev => ({ ...prev, [id]: newAction }));
    setColumnOrder(prev => { const next = { ...prev }; next[colId] = [...(next[colId] || []), id]; return next; });
    onPermissionChange(id, colId);
    setPendingModal(null);
  }

  function handleCustomLabelChange(actionId, newLabel) {
    setCustomActions(prev => ({ ...prev, [actionId]: { ...prev[actionId], libelle: newLabel } }));
  }

  const REMOVED_ZONE = '__removed__';
  const HIDDEN_ZONE = '__hidden__';

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;

    if (dstCol === HIDDEN_ZONE) {
      if (srcCol === HIDDEN_ZONE) return;
      if (srcCol === REMOVED_ZONE) { handleHide(draggableId); }
      else { setHiddenIds(prev => [...prev, draggableId]); setColumnOrder(prev => { const next = { ...prev }; COL_IDS.forEach(cid => { next[cid] = (next[cid] || []).filter(id => id !== draggableId); }); return next; }); }
      return;
    }

    if (srcCol === HIDDEN_ZONE) {
      setHiddenIds(prev => prev.filter(id => id !== draggableId));
      if (dstCol === REMOVED_ZONE) { setRemovedIds(prev => [...prev, draggableId]); }
      else {
        setColumnOrder(prev => { const next = { ...prev }; const dstList = Array.from(next[dstCol] || []); dstList.splice(destination.index, 0, draggableId); next[dstCol] = dstList; return next; });
        onPermissionChange(draggableId, dstCol);
      }
      return;
    }

    if (dstCol === REMOVED_ZONE) {
      if (srcCol === REMOVED_ZONE) return;
      setRemovedIds(prev => [...prev, draggableId]);
      setColumnOrder(prev => { const next = { ...prev }; COL_IDS.forEach(cid => { next[cid] = (next[cid] || []).filter(id => id !== draggableId); }); return next; });
      return;
    }

    if (srcCol === REMOVED_ZONE) {
      setRemovedIds(prev => prev.filter(id => id !== draggableId));
      setColumnOrder(prev => { const next = { ...prev }; const dstList = Array.from(next[dstCol] || []); dstList.splice(destination.index, 0, draggableId); next[dstCol] = dstList; return next; });
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

  const visiblePoolActions = [
    ...category.actions.filter(a => removedIds.includes(a.id) && !hiddenIds.includes(a.id)),
    ...Object.values(customActions).filter(a => removedIds.includes(a.id) && !hiddenIds.includes(a.id)),
  ];

  const hiddenActions = [
    ...category.actions.filter(a => hiddenIds.includes(a.id)),
    ...Object.values(customActions).filter(a => hiddenIds.includes(a.id)),
  ];

  return (
    <div style={{ background: 'white', borderRadius: 8, border: `2px solid ${category.color}`, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ background: category.color, color: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 'bold', fontSize: '1em' }}>{category.libelle}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowInfoModal(true); }} title="Voir les définitions"
            style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '0.75em', fontWeight: 'bold', lineHeight: 1, flexShrink: 0 }}>?</button>
        </div>
        <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
          <button type="button" onClick={() => onModeChange(category.id, 'aucune')}
            style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: mode === 'aucune' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: mode === 'aucune' ? 'rgba(255,255,255,0.9)' : 'transparent', color: mode === 'aucune' ? category.color : 'white', transition: 'background 0.15s', borderRadius: '999px 0 0 999px' }}>
            Aucune restriction
          </button>
          <button type="button" onClick={() => onModeChange(category.id, 'restreindre')}
            style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: mode === 'restreindre' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: mode === 'restreindre' ? 'rgba(255,255,255,0.9)' : 'transparent', color: mode === 'restreindre' ? category.color : 'white', transition: 'background 0.15s', borderRadius: '0 999px 999px 0' }}>
            Restreindre l'usage des SIA
          </button>
        </div>
      </div>

      {showInfoModal && <BloomCategoryInfoModal categoryId={category.id} onClose={() => setShowInfoModal(false)} />}

      {mode === 'aucune' ? (
        <div style={{ padding: '10px 16px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>
          Aucune restriction appliquée pour cette catégorie. Les SIA sont autorisés sans restriction pour toutes les actions.
        </div>
      ) : (
        <div style={{ padding: '12px 14px' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={REMOVED_ZONE} direction="horizontal">
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  style={{ background: snapshot.isDraggingOver ? '#e8e8e8' : '#f5f5f5', border: snapshot.isDraggingOver ? '1px dashed #999' : '1px dashed #bbb', borderRadius: 6, padding: '8px 10px', minHeight: 38, transition: 'background 0.1s', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'bold' }}>
                    Actions suggérées {snapshot.isDraggingOver ? '(déposer ici pour retirer des colonnes)' : '— faites glisser vers une colonne :'}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {visiblePoolActions.map((action, idx) => (
                      <Draggable key={action.id} draggableId={action.id} index={idx}>
                        {(dragProvided, dragSnapshot) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: dragSnapshot.isDragging ? '#fff' : 'white', border: `1px solid ${category.color}`, borderRadius: 16, padding: '2px 4px 2px 8px', fontSize: '0.8em', cursor: 'grab', boxShadow: dragSnapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none', ...dragProvided.draggableProps.style }}>
                            <span style={{ color: category.color }}>{action.libelle || 'Action personnalisée'}</span>
                            <button type="button" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); handleHide(action.id); }} title="Masquer cette action"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '0.95em', lineHeight: 1, padding: '0 1px', flexShrink: 0 }}>×</button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>

                  {hiddenActions.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: '1px dashed #ccc', paddingTop: 6 }}>
                      <button type="button" onClick={() => setHiddenOpen(v => !v)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75em', color: '#999', display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'inherit' }}>
                        <span style={{ display: 'inline-block', transform: hiddenOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', fontSize: '0.85em' }}>▶</span>
                        {hiddenOpen ? 'Masquer les actions non utilisées' : `${hiddenActions.length} action${hiddenActions.length > 1 ? 's' : ''} masquée${hiddenActions.length > 1 ? 's' : ''} — cliquer pour afficher`}
                      </button>
                      {hiddenOpen && (
                        <Droppable droppableId={HIDDEN_ZONE} direction="horizontal">
                          {(hp, hs) => (
                            <div ref={hp.innerRef} {...hp.droppableProps}
                              style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, padding: '6px 8px', background: hs.isDraggingOver ? '#e0e0e0' : '#ececec', border: '1px dashed #bbb', borderRadius: 5, minHeight: 32, transition: 'background 0.1s' }}>
                              {hiddenActions.map((action, idx) => (
                                <Draggable key={action.id} draggableId={action.id} index={idx}>
                                  {(dp, ds) => (
                                    <div ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps}
                                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: `1px solid ${category.color}`, borderRadius: 16, padding: '2px 4px 2px 8px', fontSize: '0.78em', cursor: 'grab', opacity: 0.7, boxShadow: ds.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none', ...dp.draggableProps.style }}>
                                      <span style={{ color: category.color }}>{action.libelle || 'Action personnalisée'}</span>
                                      <button type="button" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); handleUnhide(action.id); }} title="Réactiver dans la liste"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a9', fontSize: '0.9em', lineHeight: 1, padding: '0 1px', flexShrink: 0, fontWeight: 'bold' }}>↩</button>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {hp.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Droppable>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
              {COLUMN_STYLES.map((col, colIndex) => {
                const orderedIds = (columnOrder[col.id] || []).filter(id => !removedIds.includes(id) && !hiddenIds.includes(id));
                return (
                  <div key={col.id} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: col.headerBg, color: 'white', padding: '4px 8px', fontSize: '0.75em', fontWeight: 'bold', textAlign: 'center' }}>{col.libelle}</div>
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          style={{ padding: '6px 6px', minHeight: 60, flex: 1, background: snapshot.isDraggingOver ? `${col.bg}` : 'transparent', transition: 'background 0.1s' }}>
                          {orderedIds.length === 0 && !snapshot.isDraggingOver && <p style={{ color: '#bbb', fontSize: '0.78em', fontStyle: 'italic', margin: '4px 0', textAlign: 'center' }}>—</p>}
                          {orderedIds.map((actionId, idx) => {
                            const action = getActionById(actionId);
                            if (!action) return null;
                            return (
                              <Draggable key={actionId} draggableId={actionId} index={idx}>
                                {(dragProvided, dragSnapshot) => (
                                  <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                                    <ActionChip action={action} levelId={col.id} colIndex={colIndex} onMoveTo={handleMove} onRemove={handleRemove}
                                      dragHandleProps={dragProvided.dragHandleProps} isDragging={dragSnapshot.isDragging} isCustom={!!action.isCustom}
                                      onLabelChange={handleCustomLabelChange} hasError={showErrors && !!action.isCustom && emptyCustomIds.includes(action.id)} categoryColor={category.color} />
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

          {pendingModal && <CustomActionModal isOpen={true} onClose={() => setPendingModal(null)} initialValue="" onSave={handlePendingModalSave} categoryColor={category.color} />}

          <div style={{ marginTop: 10 }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.85em', display: 'block', marginBottom: 4, color: '#444' }}>Précisions</label>
            <textarea value={precisions[category.id] || ''} onChange={e => onPrecisionsChange(category.id, e.target.value)}
              placeholder="Ajoutez ici des précisions pour cette catégorie…" rows={2}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontFamily: 'inherit', fontSize: '0.88em', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
        </div>
      )}
    </div>
  );
}