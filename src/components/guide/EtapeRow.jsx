import React from 'react';

const IA_OPTIONS = ['Non autorisée', 'Autorisée avec restrictions', 'Autorisée sans restrictions', 'Obligatoire'];

const errorStyle = { color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' };

export default function EtapeRow({
  etape, i, pos, etapesOrderLength,
  r, err, collapsed,
  provided, snapshot,
  onCheckbox, onCollapseRow, onRestoreRow, onIaChange,
  onOpenDirectiveModal, onToggleVierge,
  onUpdateRow, onOpenDeclModal,
  onMoveEtape,
}) {
  const disabled = !r.checked;

  // ── COLLAPSED (mise de côté) ──────────────────────────────────────────────
  if (collapsed) {
    return (
      <tr
        ref={provided.innerRef}
        {...provided.draggableProps}
        style={{ ...provided.draggableProps.style, background: '#f5f5f5' }}
      >
        <td colSpan={4} style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Drag + reorder */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span {...provided.dragHandleProps} title="Glisser pour réordonner"
                style={{ cursor: 'grab', color: '#ccc', fontSize: '1.1em', padding: '2px 4px', userSelect: 'none' }}>⠿</span>
              <button type="button" title="En haut" onClick={() => onMoveEtape(pos, 0)} disabled={pos === 0}
                style={{ background: 'none', border: 'none', cursor: pos === 0 ? 'default' : 'pointer', fontSize: '0.85em', opacity: pos === 0 ? 0.25 : 1 }}>⏫</button>
              <button type="button" title="Vers le haut" onClick={() => onMoveEtape(pos, pos - 1)} disabled={pos === 0}
                style={{ background: 'none', border: 'none', cursor: pos === 0 ? 'default' : 'pointer', fontSize: '0.85em', opacity: pos === 0 ? 0.25 : 1 }}>🔼</button>
              <button type="button" title="Vers le bas" onClick={() => onMoveEtape(pos, pos + 1)} disabled={pos === etapesOrderLength - 1}
                style={{ background: 'none', border: 'none', cursor: pos === etapesOrderLength - 1 ? 'default' : 'pointer', fontSize: '0.85em', opacity: pos === etapesOrderLength - 1 ? 0.25 : 1 }}>🔽</button>
              <button type="button" title="En bas" onClick={() => onMoveEtape(pos, etapesOrderLength - 1)} disabled={pos === etapesOrderLength - 1}
                style={{ background: 'none', border: 'none', cursor: pos === etapesOrderLength - 1 ? 'default' : 'pointer', fontSize: '0.85em', opacity: pos === etapesOrderLength - 1 ? 0.25 : 1 }}>⏬</button>
            </div>
            <span style={{ color: '#999', fontStyle: 'italic', fontSize: '0.85em' }}>✕ Ne s'applique pas</span>
            <span style={{ fontWeight: 'bold', color: '#aaa', fontSize: '0.95em' }}>
              {etape.libelle}
              {etape.parenthese && <span style={{ fontWeight: 'normal', fontSize: '0.88em' }}> ({etape.parenthese})</span>}
            </span>
            <button type="button" onClick={() => onRestoreRow(i)}
              style={{ fontSize: '0.78em', padding: '3px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginLeft: 'auto' }}>
              ↺ Rétablir
            </button>
          </div>
        </td>
      </tr>
    );
  }

  // ── NOT YET CHECKED — wide banner row ────────────────────────────────────
  if (!r.checked) {
    return (
      <tr
        ref={provided.innerRef}
        {...provided.draggableProps}
        style={{ ...provided.draggableProps.style, background: snapshot.isDragging ? '#e0f3fc' : '#fafafa' }}
      >
        <td
          colSpan={4}
          style={{ padding: '10px 14px', cursor: 'pointer', transition: 'background 0.15s', verticalAlign: 'middle' }}
          onClick={() => onCheckbox(i, true)}
          onMouseEnter={(e) => { if (!snapshot.isDragging) e.currentTarget.style.background = '#eaf6fd'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = snapshot.isDragging ? '#e0f3fc' : '#fafafa'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Drag + reorder */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={(e) => e.stopPropagation()}>
              <span {...provided.dragHandleProps} title="Glisser pour réordonner"
                style={{ cursor: 'grab', color: '#aaa', fontSize: '1.1em', padding: '2px 4px', userSelect: 'none' }}>⠿</span>
              <button type="button" title="En haut" onClick={() => onMoveEtape(pos, 0)} disabled={pos === 0}
                style={{ background: 'none', border: 'none', cursor: pos === 0 ? 'default' : 'pointer', fontSize: '0.85em', opacity: pos === 0 ? 0.25 : 1 }}>⏫</button>
              <button type="button" title="Vers le haut" onClick={() => onMoveEtape(pos, pos - 1)} disabled={pos === 0}
                style={{ background: 'none', border: 'none', cursor: pos === 0 ? 'default' : 'pointer', fontSize: '0.85em', opacity: pos === 0 ? 0.25 : 1 }}>🔼</button>
              <button type="button" title="Vers le bas" onClick={() => onMoveEtape(pos, pos + 1)} disabled={pos === etapesOrderLength - 1}
                style={{ background: 'none', border: 'none', cursor: pos === etapesOrderLength - 1 ? 'default' : 'pointer', fontSize: '0.85em', opacity: pos === etapesOrderLength - 1 ? 0.25 : 1 }}>🔽</button>
              <button type="button" title="En bas" onClick={() => onMoveEtape(pos, etapesOrderLength - 1)} disabled={pos === etapesOrderLength - 1}
                style={{ background: 'none', border: 'none', cursor: pos === etapesOrderLength - 1 ? 'default' : 'pointer', fontSize: '0.85em', opacity: pos === etapesOrderLength - 1 ? 0.25 : 1 }}>⏬</button>
            </div>

            {/* Checkbox */}
            <input
              type="checkbox"
              id={`etape_${i}`}
              checked={false}
              onChange={(e) => { e.stopPropagation(); onCheckbox(i, e.target.checked); }}
              style={{ width: 18, height: 18, minWidth: 18, accentColor: '#00A4E4', cursor: 'pointer', flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Label — bigger */}
            <label htmlFor={`etape_${i}`} style={{ cursor: 'pointer', margin: 0, fontWeight: 'bold', fontSize: '1.05em', color: '#231F20' }}
              onClick={(e) => e.stopPropagation()}>
              {etape.libelle}
              {etape.parenthese && <span style={{ fontWeight: 'normal', color: '#555', fontSize: '0.9em' }}> ({etape.parenthese})</span>}
            </label>

            {/* "Ne s'applique pas" */}
            <div style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => onCollapseRow(i)}
                style={{ fontSize: '0.75em', padding: '3px 10px', background: '#888', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                title="Masquer cette étape — ne s'applique pas à cette évaluation">
                ✕ Ne s'applique pas
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // ── CHECKED — full 4-column layout ───────────────────────────────────────
  return (
    <tr
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{ ...provided.draggableProps.style, background: snapshot.isDragging ? '#e0f3fc' : '' }}
    >
      {/* Col 1: Étape */}
      <td style={{ verticalAlign: 'top' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }} onClick={(e) => e.stopPropagation()}>
          <span {...provided.dragHandleProps} title="Glisser pour réordonner"
            style={{ cursor: 'grab', color: '#aaa', fontSize: '1.1em', padding: '2px 4px', userSelect: 'none', lineHeight: 1 }}>⠿</span>
          <button type="button" title="En haut" onClick={() => onMoveEtape(pos, 0)} disabled={pos === 0}
            style={{ background: 'none', border: 'none', cursor: pos === 0 ? 'default' : 'pointer', fontSize: '0.9em', padding: '1px 3px', opacity: pos === 0 ? 0.25 : 1 }}>⏫</button>
          <button type="button" title="Vers le haut" onClick={() => onMoveEtape(pos, pos - 1)} disabled={pos === 0}
            style={{ background: 'none', border: 'none', cursor: pos === 0 ? 'default' : 'pointer', fontSize: '0.9em', padding: '1px 3px', opacity: pos === 0 ? 0.25 : 1 }}>🔼</button>
          <button type="button" title="Vers le bas" onClick={() => onMoveEtape(pos, pos + 1)} disabled={pos === etapesOrderLength - 1}
            style={{ background: 'none', border: 'none', cursor: pos === etapesOrderLength - 1 ? 'default' : 'pointer', fontSize: '0.9em', padding: '1px 3px', opacity: pos === etapesOrderLength - 1 ? 0.25 : 1 }}>🔽</button>
          <button type="button" title="En bas" onClick={() => onMoveEtape(pos, etapesOrderLength - 1)} disabled={pos === etapesOrderLength - 1}
            style={{ background: 'none', border: 'none', cursor: pos === etapesOrderLength - 1 ? 'default' : 'pointer', fontSize: '0.9em', padding: '1px 3px', opacity: pos === etapesOrderLength - 1 ? 0.25 : 1 }}>⏬</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id={`etape_${i}`}
            checked={r.checked}
            onChange={(e) => { e.stopPropagation(); onCheckbox(i, e.target.checked); }}
            style={{ width: 18, height: 18, minWidth: 18, accentColor: '#00A4E4', cursor: 'pointer', flexShrink: 0 }} />
          <label htmlFor={`etape_${i}`} style={{ cursor: 'pointer', margin: 0, fontWeight: 'bold' }}>
            {etape.libelle}
            {etape.parenthese && <span style={{ fontWeight: 'normal', color: '#555', fontSize: '0.88em' }}> ({etape.parenthese})</span>}
          </label>
        </div>

        {etape.id === 'autres' &&
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 2 }}>
                Libellé <span style={{ color: '#E41E25' }}>*</span>
              </label>
              <input type="text" value={r.libelle_custom}
                onChange={(e) => onUpdateRow(i, 'libelle_custom', e.target.value)}
                placeholder="Nom de l'étape personnalisée"
                style={{ width: '95%', padding: '5px 8px', fontFamily: 'inherit', border: err.libelle_custom ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: err.libelle_custom ? '#fff4f4' : 'white' }} />
              {err.libelle_custom && <span style={errorStyle}>⚠ Ce champ est requis</span>}
            </div>
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 2 }}>
                Exemples <span style={{ color: '#E41E25' }}>*</span>
              </label>
              <textarea rows={3} value={r.exemples}
                onChange={(e) => onUpdateRow(i, 'exemples', e.target.value)}
                placeholder="Décrivez des exemples d'utilisation"
                style={{ width: '95%', padding: '5px 8px', fontFamily: 'inherit', border: err.exemples ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: err.exemples ? '#fff4f4' : 'white' }} />
              {err.exemples && <span style={errorStyle}>⚠ Ce champ est requis</span>}
            </div>
          </div>
        }

        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <button type="button" onClick={() => onCollapseRow(i)}
            style={{ fontSize: '0.75em', padding: '3px 10px', background: '#888', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            title="Masquer cette étape — ne s'applique pas à cette évaluation">
            ✕ Ne s'applique pas
          </button>
        </div>
      </td>

      {/* Col 2: IA options */}
      <td style={{ verticalAlign: 'top' }}>
        {IA_OPTIONS.map((opt, j) =>
          <div key={j}>
            <input type="radio" id={`radio_${i}_${j}`} name={`ia_${i}`} value={opt}
              checked={r.ia === opt} onChange={() => onIaChange(i, opt)} />
            <label htmlFor={`radio_${i}_${j}`} style={{ marginLeft: 4 }}>{opt}</label>
          </div>
        )}
        {err.ia && <span style={errorStyle}>⚠ Sélection requise</span>}
      </td>

      {/* Col 3: Justification */}
      <td style={{ verticalAlign: 'top' }}>
        {r.ia && <>
          {r.justification_vierge
            ? <div style={{ width: '95%', minHeight: 48, marginTop: 4, padding: '6px 8px', fontFamily: 'inherit', fontSize: '0.9em', color: '#aaa', border: '1px solid #ccc', background: '#f0f0f0', borderRadius: 4, cursor: 'text', fontStyle: 'italic' }}
                onClick={() => onOpenDirectiveModal(i)}>
                Directives vierges — cliquez pour modifier
              </div>
            : r.justification
              ? <div dangerouslySetInnerHTML={{ __html: r.justification }}
                  style={{ width: '95%', minHeight: 48, marginTop: 4, padding: '6px 8px', fontFamily: 'inherit', fontSize: '0.9em', lineHeight: 1.5, border: err.justification ? '2px solid #E41E25' : '1px solid #ccc', background: err.justification ? '#fff4f4' : '#fafafa', borderRadius: 4, cursor: 'text' }}
                  onClick={() => onOpenDirectiveModal(i)} />
              : <div style={{ width: '95%', minHeight: 48, marginTop: 4, padding: '6px 8px', fontFamily: 'inherit', fontSize: '0.9em', color: '#aaa', border: err.justification ? '2px solid #E41E25' : '1px solid #ccc', background: err.justification ? '#fff4f4' : '#fafafa', borderRadius: 4, cursor: 'text' }}
                  onClick={() => onOpenDirectiveModal(i)}>
                  Cliquez pour rédiger…
                </div>
          }
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => onOpenDirectiveModal(i)}
              style={{ fontSize: '0.78em', padding: '3px 10px', background: '#00A4E4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              ✏ Modifier / insérer un exemple
            </button>
            <button type="button" onClick={() => onToggleVierge(i)}
              style={{ fontSize: '0.78em', padding: '3px 10px', border: 'none', borderRadius: 999, cursor: 'pointer', background: r.justification_vierge ? '#6c757d' : '#e0e0e0', color: r.justification_vierge ? 'white' : '#555', fontWeight: r.justification_vierge ? 'bold' : 'normal' }}>
              {r.justification_vierge ? '○ Directives vierges' : '○ Laisser vierge'}
            </button>
          </div>
        </>}
        {!r.ia && <span style={{ color: '#999', fontSize: '0.9em' }}>Sélectionnez une option IA d'abord.</span>}
        {err.justification && <span style={errorStyle}>⚠ Ce champ est requis</span>}
      </td>

      {/* Col 4: Exigences de déclaration */}
      <td style={{ verticalAlign: 'top' }}>
        {disabled
          ? <span style={{ color: '#999', fontSize: '0.9em' }}>—</span>
          : <>
            <div>
              <input type="radio" id={`decl_aucune_${i}`} name={`decl_${i}`} value="aucune"
                checked={r.declaration === 'aucune'} onChange={() => onUpdateRow(i, 'declaration', 'aucune')} />
              <label htmlFor={`decl_aucune_${i}`} style={{ marginLeft: 4 }}>Aucune exigence</label>
            </div>
            <div>
              <input type="radio" id={`decl_requise_${i}`} name={`decl_${i}`} value="requise"
                checked={r.declaration === 'requise'} onChange={() => onUpdateRow(i, 'declaration', 'requise')} />
              <label htmlFor={`decl_requise_${i}`} style={{ marginLeft: 4 }}>Exigence(s) requise(s)</label>
            </div>
            {err.declaration && <span style={errorStyle}>⚠ Sélection requise</span>}

            {r.declaration === 'requise' &&
              <div className="decl-sub">
                {/* Iagraphie */}
                <div>
                  <input type="checkbox" id={`iagraphie_${i}`} checked={r.decl_iagraphie}
                    onChange={(e) => onUpdateRow(i, 'decl_iagraphie', e.target.checked)} />
                  <label htmlFor={`iagraphie_${i}`} style={{ marginLeft: 4 }}>Références et IAgraphie</label>
                  {r.decl_iagraphie && <>
                    <div dangerouslySetInnerHTML={{ __html: r.decl_iagraphie_text || '<span style="color:#aaa">Cliquez pour rédiger…</span>' }}
                      onClick={() => onOpenDeclModal(i, 'iagraphie')}
                      style={{ width: '95%', minHeight: 36, marginTop: 4, padding: '5px 7px', fontFamily: 'inherit', fontSize: '0.88em', lineHeight: 1.5, border: err.decl_iagraphie_text ? '2px solid #E41E25' : '1px solid #ccc', background: err.decl_iagraphie_text ? '#fff4f4' : '#fafafa', borderRadius: 4, cursor: 'text' }} />
                    <button type="button" onClick={() => onOpenDeclModal(i, 'iagraphie')} style={{ marginTop: 3, fontSize: '0.75em', padding: '2px 8px', background: '#00A4E4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✏ Modifier / insérer un exemple</button>
                    {err.decl_iagraphie_text && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                  </>}
                </div>
                {/* Traces */}
                <div style={{ marginTop: 6 }}>
                  <input type="checkbox" id={`traces_${i}`} checked={r.decl_traces}
                    onChange={(e) => onUpdateRow(i, 'decl_traces', e.target.checked)} />
                  <label htmlFor={`traces_${i}`} style={{ marginLeft: 4 }}>Conserver les traces suivantes :</label>
                  {r.decl_traces && <>
                    <div dangerouslySetInnerHTML={{ __html: r.decl_traces_text || '<span style="color:#aaa">Cliquez pour rédiger…</span>' }}
                      onClick={() => onOpenDeclModal(i, 'traces')}
                      style={{ width: '95%', minHeight: 36, marginTop: 4, padding: '5px 7px', fontFamily: 'inherit', fontSize: '0.88em', lineHeight: 1.5, border: err.decl_traces_text ? '2px solid #E41E25' : '1px solid #ccc', background: err.decl_traces_text ? '#fff4f4' : '#fafafa', borderRadius: 4, cursor: 'text' }} />
                    <button type="button" onClick={() => onOpenDeclModal(i, 'traces')} style={{ marginTop: 3, fontSize: '0.75em', padding: '2px 8px', background: '#00A4E4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✏ Modifier / insérer un exemple</button>
                    {err.decl_traces_text && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                  </>}
                </div>
                {/* Logique */}
                <div style={{ marginTop: 6 }}>
                  <input type="checkbox" id={`logique_${i}`} checked={r.decl_logique}
                    onChange={(e) => onUpdateRow(i, 'decl_logique', e.target.checked)} />
                  <label htmlFor={`logique_${i}`} style={{ marginLeft: 4 }}>Expliquer la logique d'utilisation :</label>
                  {r.decl_logique && <>
                    <div dangerouslySetInnerHTML={{ __html: r.decl_logique_text || '<span style="color:#aaa">Cliquez pour rédiger…</span>' }}
                      onClick={() => onOpenDeclModal(i, 'logique')}
                      style={{ width: '95%', minHeight: 36, marginTop: 4, padding: '5px 7px', fontFamily: 'inherit', fontSize: '0.88em', lineHeight: 1.5, border: err.decl_logique_text ? '2px solid #E41E25' : '1px solid #ccc', background: err.decl_logique_text ? '#fff4f4' : '#fafafa', borderRadius: 4, cursor: 'text' }} />
                    <button type="button" onClick={() => onOpenDeclModal(i, 'logique')} style={{ marginTop: 3, fontSize: '0.75em', padding: '2px 8px', background: '#00A4E4', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✏ Modifier / insérer un exemple</button>
                    {err.decl_logique_text && <span style={errorStyle}>⚠ Ce champ est requis</span>}
                  </>}
                </div>
                {err.declaration_checkbox && <span style={errorStyle}>⚠ Au moins une exigence doit être sélectionnée</span>}
              </div>
            }
          </>
        }
      </td>
    </tr>
  );
}