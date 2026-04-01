import React from 'react';

const BLOOM_DEFINITIONS = {
  connaitre: {
    libelle: 'Connaitre et comprendre',
    color: '#4a90d9',
    niveaux: [
      {
        nom: 'Connaitre',
        definition: "Restituer avec justesse l'information ou procédure apprise. Collecter de l'information, la mémoriser, l'identifier, la reconnaitre, la discriminer.",
      },
      {
        nom: 'Comprendre',
        definition: "Interpréter ou décrire des informations. Expliquer un concept de manière intelligible. Synthétiser un sujet. Expliciter un raisonnement. Illustrer des arguments.",
      },
    ],
  },
  analyser: {
    libelle: 'Analyser et appliquer',
    color: '#e67e22',
    niveaux: [
      {
        nom: 'Analyser',
        definition: "Résoudre des problèmes. Repérer les éléments d'une situation et comprendre leurs relations. Examiner des faits en isolant les causes. Interpréter des données. Percevoir des tendances.",
      },
      {
        nom: 'Appliquer',
        definition: "Résoudre des problèmes en suivant une procédure établie. Calculer. Appliquer une méthode. Accomplir une tâche selon des règles. Manifester une attitude adéquate.",
      },
    ],
  },
  creer: {
    libelle: 'Créer et évaluer',
    color: '#27ae60',
    niveaux: [
      {
        nom: 'Créer',
        definition: "Mobiliser ses apprentissages pour former un tout cohérent et nouveau. Générer de nouvelles idées. Produire une œuvre personnelle. Créer une production originale. Élaborer un plan d'action personnalisé.",
      },
      {
        nom: 'Évaluer',
        definition: "Porter un jugement critique personnel fondé sur des critères variés. Valider des théories. Analyser une situation afin de prendre des décisions et de les justifier.",
      },
    ],
  },
};

const PDF_URL = 'https://www.enseigner.ulaval.ca/system/files/public/pedagogie/preparer-votre-cours/taxonomie-de-bloom-revisee.pdf';

export default function BloomCategoryInfoModal({ categoryId, onClose }) {
  const data = BLOOM_DEFINITIONS[categoryId];
  if (!data) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 10, padding: '24px 28px', maxWidth: 560, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.05em', fontWeight: 'bold', color: data.color }}>{data.libelle}</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4em', color: '#888', lineHeight: 1 }}>×</button>
        </div>

        {/* Niveaux */}
        {data.niveaux.map((n, i) => (
          <div key={i} style={{ marginBottom: i < data.niveaux.length - 1 ? 18 : 0 }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.97em', color: data.color, borderLeft: `3px solid ${data.color}`, paddingLeft: 10, marginBottom: 6 }}>{n.nom}</div>
            <p style={{ margin: 0, fontSize: '0.88em', color: '#333', lineHeight: 1.55 }}>{n.definition}</p>
          </div>
        ))}

        {/* Lien source */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #eee', textAlign: 'right' }}>
          <a href={PDF_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.83em', color: '#0056b3', textDecoration: 'underline' }}>
            📄 Consulter la Taxonomie de Bloom révisée (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}