import React from 'react';
import ActionCard from './ActionCard';

export default function CategorySection({ category, activeActions, permissions, precisions, onPermissionChange, onPrecisionsChange, onRemoveAction }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      border: `2px solid ${category.color}`,
      marginBottom: 20,
      overflow: 'hidden'
    }}>
      <div style={{
        background: category.color,
        color: 'white',
        padding: '10px 16px',
        fontWeight: 'bold',
        fontSize: '1em'
      }}>
        {category.libelle}
      </div>
      <div style={{ padding: '12px 14px' }}>
        {activeActions.length === 0 ? (
          <p style={{ color: '#999', fontSize: '0.88em', fontStyle: 'italic', margin: 0 }}>
            Toutes les actions de cette catégorie ont été retirées.
          </p>
        ) : (
          activeActions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              permission={permissions[action.id] || 'non'}
              precisions={precisions[action.id] || ''}
              onPermissionChange={onPermissionChange}
              onPrecisionsChange={onPrecisionsChange}
              onRemove={onRemoveAction}
              categoryColor={category.color}
            />
          ))
        )}
      </div>
    </div>
  );
}