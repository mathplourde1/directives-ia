import React from 'react';

const BLOOM_DEFINITIONS = {
  connaitre: {
    libelle: 'Connaitre et comprendre',
    color: '#4a90d9',
    niveaux: [
      {
        nom: 'Connaitre',
        definition: "Restituer avec justesse l'information ou procédure apprise. Collecter de l'information, la mémoriser, l'identifier, la reconnaitre, la discriminer.",
        verbes: 'Assigner, associer, caractériser, cataloguer, citer, collecter, décrire, définir, délimiter, désigner, déterminer, enregistrer, énumérer, établir, étiqueter, examiner, expérimenter, identifier, indiquer, inventorier, lister, mémoriser, montrer, localiser, nommer, ordonner, rappeler, réciter, répéter, reconnaitre, reproduire, sélectionner, situer…',
      },
      {
        nom: 'Comprendre',
        definition: "Interpréter ou décrire des informations. Expliquer un concept de manière intelligible. Synthétiser un sujet. Expliciter un raisonnement. Illustrer des arguments.",
        verbes: "Associer, classer, comparer, compléter, conclure, contextualiser, convertir, décrire, démontrer, déterminer, différencier, dire dans ses mots, discuter, distinguer, estimer, établir, expliquer, exprimer, extrapoler, faire une analogie, généraliser, identifier, illustrer, inférer, interpréter, localiser, ordonner, paraphraser, préciser, prédire, préparer, rapporter, reformuler, résumer, traduire…",
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
        verbes: 'Analyser, arranger, attribuer, catégoriser, choisir, classer, comparer, contraster, corréler, critiquer, décomposer, déduire, différencier, discriminer, distinguer, diviser, examiner, expérimenter, expliquer, identifier, inférer, interpréter, mettre en priorité, mettre en relation, modéliser, nuancer, organiser, questionner, rechercher, relier, séparer, subdiviser, tester…',
      },
      {
        nom: 'Appliquer',
        definition: "Résoudre des problèmes en suivant une procédure établie. Calculer. Appliquer une méthode. Accomplir une tâche selon des règles. Manifester une attitude adéquate.",
        verbes: "Acter, adapter, administrer, appliquer, assembler, calculer, choisir, classer, compléter, construire, contrôler, démontrer, déterminer, développer, employer, établir, exécuter, expérimenter, formuler, gérer, illustrer, implanter, interpréter, manipuler, mesurer, mettre en pratique, modifier, organiser, planifier, pratiquer, produire, résoudre, simuler, utiliser…",
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
        verbes: "Adapter, agencer, anticiper, arranger, assembler, classer, collecter, combiner, commenter, composer, concevoir, construire, créer, déduire, développer, élaborer, exposer, formuler, générer, imaginer, incorporer, innover, intégrer, inventer, organiser, planifier, préparer, produire, proposer, rédiger, réorganiser, schématiser, structurer, synthétiser…",
      },
      {
        nom: 'Évaluer',
        definition: "Porter un jugement critique personnel fondé sur des critères variés. Valider des théories. Analyser une situation afin de prendre des décisions et de les justifier.",
        verbes: "Apprécier, appuyer, argumenter, attaquer, choisir, classer, comparer, conclure, contrôler, convaincre, critiquer, décider, défendre, déterminer, estimer, évaluer, expliquer, juger, justifier, mesurer, noter, persuader, prédire, recommander, résumer, sélectionner, soupeser, soutenir, tester, valider, vérifier…",
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
            <p style={{ margin: '0 0 6px 0', fontSize: '0.88em', color: '#333', lineHeight: 1.55 }}>{n.definition}</p>
            <p style={{ margin: 0, fontSize: '0.82em', color: '#666', fontStyle: 'italic', lineHeight: 1.5 }}><strong style={{ fontStyle: 'normal', color: '#555' }}>Exemples de verbes :</strong> {n.verbes}</p>
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