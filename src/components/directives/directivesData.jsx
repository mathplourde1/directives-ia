export const PHASES = [
  {
    id: 'preparation',
    libelle: 'Phase de préparation',
    color: '#4a90d9',
    actions: [
      { id: 'prep-1', libelle: 'Capter des notes de rencontre' },
      { id: 'prep-2', libelle: 'Expliquer un concept' },
      { id: 'prep-3', libelle: 'Répondre à des questions préparatoires' },
      { id: 'prep-4', libelle: 'Résumer une ressource ou un article' },
      { id: 'prep-5', libelle: 'Trouver des articles ou des sources' },
      { id: 'prep-6', libelle: 'Débattre des idées' },
      { id: 'prep-7', libelle: 'Suggérer des sujets' },
      { id: 'prep-8', libelle: 'Suggérer des hypothèses initiales' },
      { id: 'prep-9', libelle: 'Traduire du texte' },
      { id: 'prep-10', libelle: 'Rendre un contenu dans un format alternatif' },
      { id: 'prep-11', libelle: 'Étiqueter des données qualitatives' },
      { id: 'prep-12', libelle: 'Comparer des alternatives' },
      { id: 'prep-13', libelle: 'Estimer des coûts' },
      { id: 'prep-14', libelle: 'Élaborer un plan de travail' },
      { id: 'prep-15', libelle: 'Structurer des idées' },
      { id: 'prep-16', libelle: 'Proposer un échéancier' },
      { id: 'prep-17', libelle: "S'entrainer" },
      { id: 'prep-18', libelle: 'Proposer des exemples' },
      { id: 'prep-19', libelle: 'Classer des données' },
    ]
  },
  {
    id: 'production',
    libelle: 'Phase de production',
    color: '#e67e22',
    actions: [
      { id: 'prod-1', libelle: 'Générer une première version' },
      { id: 'prod-2', libelle: 'Générer une version entière du travail' },
      { id: 'prod-3', libelle: 'Compléter un travail' },
      { id: 'prod-4', libelle: 'Générer du code' },
      { id: 'prod-5', libelle: 'Déboguer du code' },
      { id: 'prod-6', libelle: 'Générer une image' },
      { id: 'prod-7', libelle: 'Générer un diagramme' },
      { id: 'prod-8', libelle: 'Générer une vidéo' },
      { id: 'prod-9', libelle: 'Générer une carte conceptuelle' },
      { id: 'prod-10', libelle: 'Générer un support de présentation' },
      { id: 'prod-11', libelle: 'Générer un modèle 3D' },
      { id: 'prod-12', libelle: "Répondre à des questions d'examen" },
      { id: 'prod-13', libelle: "Offrir un soutien pendant une évaluation" },
      { id: 'prod-14', libelle: 'Générer une modélisation' },
      { id: 'prod-15', libelle: 'Analyser des données' },
      { id: 'prod-16', libelle: "Émettre des conclusions pour un travail" },
      { id: 'prod-17', libelle: 'Porter un jugement critique' },
      { id: 'prod-18', libelle: 'Compléter un texte' },
      { id: 'prod-19', libelle: 'Produire un document' },
      { id: 'prod-20', libelle: 'Produire du son' },
      { id: 'prod-21', libelle: 'Faire une démonstration' },
      { id: 'prod-22', libelle: 'Résoudre un problème' },
    ]
  },
  {
    id: 'revision',
    libelle: 'Phase de révision',
    color: '#27ae60',
    actions: [
      { id: 'rev-1', libelle: 'Harmoniser la mise en forme' },
      { id: 'rev-2', libelle: "Réviser l'orthographe et la syntaxe" },
      { id: 'rev-3', libelle: 'Donner de la rétroaction' },
      { id: 'rev-4', libelle: 'Paraphraser une partie de texte' },
      { id: 'rev-5', libelle: 'Appliquer des conventions de citation et de référencement' },
      { id: 'rev-6', libelle: 'Effectuer une révision stylistique' },
    ]
  }
];

export const PERMISSION_LEVELS = [
  { id: 'non', libelle: 'Non autorisée', color: '#E41E25', bg: '#fff4f4', border: '#E41E25', headerBg: '#E41E25' },
  { id: 'aar', libelle: 'Autorisée avec restrictions', color: '#b45309', bg: '#fffbeb', border: '#f59e0b', headerBg: '#f59e0b' },
  { id: 'asr', libelle: 'Autorisée sans restrictions', color: '#15803d', bg: '#f0fdf4', border: '#22c55e', headerBg: '#22c55e' },
  { id: 'obl', libelle: 'Obligatoire', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6', headerBg: '#3b82f6' },
];

export default PHASES;