import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMN_STYLES = [
  { id: 'non', libelle: 'Non autorisée', color: '#E41E25', bg: '#fff4f4', border: '#E41E25', headerBg: '#E41E25' },
  { id: 'aar', libelle: 'Autorisée avec restrictions', color: '#b45309', bg: '#fffbeb', border: '#f59e0b', headerBg: '#f59e0b' },
  { id: 'asr', libelle: 'Autorisée sans restriction', color: '#15803d', bg: '#f0fdf4', border: '#22c55e', headerBg: '#22c55e' },
  { id: 'obl', libelle: 'Obligatoire', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6', headerBg: '#3b82f6' },
];

const COL_IDS = COLUMN_STYLES.map(c => c.id);

// ActionChip: drag handle in middle, arrows on hover at 20% edges
function ActionChip({ action, levelId, colIndex, onMoveTo, onRemove, dragHandleProps, isDragging, isCustom, onLabelChange }) {
  const col = COLUMN_STYLES.find(c => c.id === levelId) || COLUMN_STYLES[0];
  const label = action.libelle;
  const [hoverZone, setHoverZone] = useState(null); // 'left' | 'right' | null

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    if (x < w * 0.2) setHoverZone('left');
    else if (x > w * 0.8) setHoverZone('right');
    else setHoverZone(null);
  }

  const prevColId = COL_IDS[colIndex - 1];
  const nextColId = COL_IDS[colIndex + 1];

  return (
    <div
      style={{
        background: isDragging ? col.bg : 'white',
        border: `1px solid ${col.border}`,
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
      {/* Left arrow zone */}
      <div
        style={{
          width: '20%',
          minWidth: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: prevColId ? 'pointer' : 'default',
          borderRadius: '6px 0 0 6px',
          background: hoverZone === 'left' && prevColId ? 'rgba(0,0,0,0.06)' : 'transparent',
          transition: 'background 0.12s',
          flexShrink: 0,
        }}
        onClick={() => prevColId && onMoveTo(action.id, prevColId)}
        title={prevColId ? `Déplacer vers "${COLUMN_STYLES.find(c => c.id === prevColId)?.libelle}"` : ''}
      >
        {hoverZone === 'left' && prevColId && (
          <span style={{ color: COLUMN_STYLES.find(c => c.id === prevColId)?.headerBg, fontWeight: 'bold', fontSize: '1.1em', lineHeight: 1 }}>◀</span>
        )}
      </div>

      {/* Middle: drag handle + label */}
      <div
        {...dragHandleProps}
        style={{
          flex: 1,
          padding: '5px 4px',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
        }}
      >
        {isCustom ? (
          <input
            type="text"
            value={label}
            onChange={e => onLabelChange(action.id, e.target.value)}
            placeholder="Action personnalisée…"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '1em',
              background: 'transparent',
              cursor: 'text',
              minWidth: 0,
            }}
          />
        ) : (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(action.id); }}
          title="Retirer"
          style={{
            background: 'none',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: '1em',
            lineHeight: 1,
            padding: '0 2px',
            flexShrink: 0,
          }}
        >×</button>
      </div>

      {/* Right arrow zone */}
      <div
        style={{
          width: '20%',
          minWidth: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: nextColId ? 'pointer' : 'default',
          borderRadius: '0 6px 6px 0',
          background: hoverZone === 'right' && nextColId ? 'rgba(0,0,0,0.06)' : 'transparent',
          transition: 'background 0.12s',
          flexShrink: 0,
        }}
        onClick={() => nextColId && onMoveTo(action.id, nextColId)}
        title={nextColId ? `Déplacer vers "${COLUMN_STYLES.find(c => c.id === nextColId)?.libelle}"` : ''}
      >
        {hoverZone === 'right' && nextColId && (
          <span style={{ color: COLUMN_STYLES.find(c => c.id === nextColId)?.headerBg, fontWeight: 'bold', fontSize: '1.1em', lineHeight: 1 }}>▶</span>
        )}
      </div>
    </div>
  );
}

let customCounter = 0;
function makeCustomId(catId) {
  return `custom-${catId}-${++customCounter}-${Date.now()}`;
}

export default function CategorySection({
  category,
  mode,
  onModeChange,
  permissions,
  precisions,
  onPermissionChange,
  onPrecisionsChange,
  onStateChange,
}) {
  // columnOrder[colId] = array of action ids in display order
  const buildInitialOrder = useCallback(() => {
    const order = {};
    COLUMN_STYLES.forEach(col => { order[col.id] = []; });
    // All base actions start in 'non' column (sorted alphabetically = already sorted in data)
    order['non'] = category.actions.map(a => a.id);
    return order;
  }, [category]);

  const [columnOrder, setColumnOrder] = useState(buildInitialOrder);
  const [removedIds, setRemovedIds] = useState([]);
  const [customActions, setCustomActions] = useState({}); // id -> { id, libelle, colId }

  // Rebuild column order when permissions change from outside (initial sync done via columnOrder state)
  // We manage permissions locally here and propagate up

  // All actions available: base (non-removed) + custom
  function getAllActions() {
    const base = category.actions.filter(a => !removedIds.includes(a.id));
    const customs = Object.values(customActions);
    return [...base, ...customs];
  }

  function getActionById(id) {
    const base = category.actions.find(a => a.id === id);
    if (base) return { ...base, isCustom: false };
    const custom = customActions[id];
    if (custom) return { ...custom, isCustom: true };
    return null;
  }

  // Notify parent whenever local state changes
  useEffect(() => {
    if (onStateChange) onStateChange(category.id, { columnOrder, removedIds, customActions });
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
    setRemovedIds(prev => [...prev, actionId]);
    setColumnOrder(prev => {
      const next = { ...prev };
      COL_IDS.forEach(cid => { next[cid] = (next[cid] || []).filter(id => id !== actionId); });
      return next;
    });
  }

  function handleRestore(actionId) {
    setRemovedIds(prev => prev.filter(id => id !== actionId));
    setColumnOrder(prev => {
      const next = { ...prev };
      if (!next['non'].includes(actionId)) next['non'] = [...next['non'], actionId];
      return next;
    });
    onPermissionChange(actionId, 'non');
  }

  function handleAddCustom(colId) {
    const id = makeCustomId(category.id);
    const newAction = { id, libelle: '', colId };
    setCustomActions(prev => ({ ...prev, [id]: newAction }));
    setColumnOrder(prev => {
      const next = { ...prev };
      next[colId] = [...(next[colId] || []), id];
      return next;
    });
    onPermissionChange(id, colId);
  }

  function handleCustomLabelChange(actionId, newLabel) {
    setCustomActions(prev => ({ ...prev, [actionId]: { ...prev[actionId], libelle: newLabel } }));
  }

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;

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

  const removedActions = [
    ...category.actions.filter(a => removedIds.includes(a.id)),
    ...Object.values(customActions).filter(a => removedIds.includes(a.id)),
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      border: `2px solid ${category.color}`,
      marginBottom: 20,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ background: category.color, color: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 'bold', fontSize: '1em' }}>{category.libelle}</span>
        <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
          <button type="button"
            onClick={() => onModeChange(category.id, 'aucune')}
            style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: mode === 'aucune' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: mode === 'aucune' ? 'rgba(255,255,255,0.9)' : 'transparent', color: mode === 'aucune' ? category.color : 'white', transition: 'background 0.15s', borderRadius: '999px 0 0 999px' }}>
            Aucune restriction
          </button>
          <button type="button"
            onClick={() => onModeChange(category.id, 'restreindre')}
            style={{ padding: '4px 14px', fontSize: '0.82em', fontWeight: mode === 'restreindre' ? 'bold' : 'normal', border: 'none', cursor: 'pointer', background: mode === 'restreindre' ? 'rgba(255,255,255,0.9)' : 'transparent', color: mode === 'restreindre' ? category.color : 'white', transition: 'background 0.15s', borderRadius: '0 999px 999px 0' }}>
            Restreindre l'usage des SIA
          </button>
        </div>
      </div>

      {mode === 'aucune' ? (
        <div style={{ padding: '10px 16px', fontSize: '0.88em', color: '#555', fontStyle: 'italic' }}>
          Aucune restriction appliquée pour cette catégorie. Les SIA sont autorisés sans restriction pour toutes les actions.
        </div>
      ) : (
        <div style={{ padding: '12px 14px' }}>
          {/* 4 columns with DnD */}
          <DragDropContext onDragEnd={onDragEnd}>
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
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            padding: '6px 6px',
                            minHeight: 60,
                            flex: 1,
                            background: snapshot.isDraggingOver ? `${col.bg}` : 'transparent',
                            transition: 'background 0.1s',
                          }}
                        >
                          {orderedIds.length === 0 && !snapshot.isDraggingOver && (
                            <p style={{ color: '#bbb', fontSize: '0.78em', fontStyle: 'italic', margin: '4px 0', textAlign: 'center' }}>—</p>
                          )}
                          {orderedIds.map((actionId, idx) => {
                            const action = getActionById(actionId);
                            if (!action) return null;
                            return (
                              <Draggable key={actionId} draggableId={actionId} index={idx}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                  >
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
                    {/* Add custom action button */}
                    <div style={{ padding: '4px 6px 8px 6px' }}>
                      <button
                        type="button"
                        onClick={() => handleAddCustom(col.id)}
                        style={{
                          width: '100%',
                          background: 'none',
                          border: `1px dashed ${col.border}`,
                          borderRadius: 5,
                          color: col.color,
                          fontSize: '0.78em',
                          padding: '3px 6px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          opacity: 0.75,
                        }}
                      >
                        + action personnalisée
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </DragDropContext>

          {/* Précisions */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.85em', display: 'block', marginBottom: 4, color: '#444' }}>Précisions</label>
            <textarea
              value={precisions[category.id] || ''}
              onChange={e => onPrecisionsChange(category.id, e.target.value)}
              placeholder="Ajoutez ici des précisions pour cette catégorie…"
              rows={2}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontFamily: 'inherit', fontSize: '0.88em', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Removed items */}
          {removedActions.length > 0 && (
            <div style={{ background: '#f5f5f5', border: '1px dashed #bbb', borderRadius: 6, padding: '8px 10px' }}>
              <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'bold' }}>Actions retirées :</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {removedActions.map(action => (
                  <div key={action.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', border: `1px solid ${category.color}`, borderRadius: 16, padding: '2px 8px', fontSize: '0.8em' }}>
                    <span style={{ color: category.color }}>{action.libelle || 'Action personnalisée'}</span>
                    <button type="button" onClick={() => handleRestore(action.id)}
                      style={{ background: category.color, color: 'white', border: 'none', borderRadius: 10, padding: '0px 7px', cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold' }}>
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}