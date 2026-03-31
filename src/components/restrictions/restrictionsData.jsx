const BLOOM_CATEGORIES = [
  {
    id: 'connaitre',
    libelle: 'Connaitre et comprendre',
    color: '#4a90d9',
    actions: [
      { id: 'connaitre-1', libelle: 'Capturer des notes de réunion' },
      { id: 'connaitre-6', libelle: 'Confronter des idées' },
      { id: 'connaitre-2', libelle: 'Expliquer un concept' },
      { id: 'connaitre-3', libelle: 'Répondre à des questions préparatoires' },
      { id: 'connaitre-4', libelle: 'Résumer une ressource ou un article' },
      { id: 'connaitre-8', libelle: 'Suggérer des hypothèses initiales' },
      { id: 'connaitre-7', libelle: 'Suggérer des sujets' },
      { id: 'connaitre-10', libelle: 'Transformer du contenu dans un format alternatif' },
      { id: 'connaitre-9', libelle: 'Traduire du texte' },
      { id: 'connaitre-5', libelle: 'Trouver des articles ou des sources' },
      { id: 'connaitre-11', libelle: 'Étiqueter des données qualitatives' },
    ]
  },
  {
    id: 'analyser',
    libelle: 'Analyser et appliquer',
    color: '#e67e22',
    actions: [
      { id: 'analyser-9', libelle: 'Appliquer les standards de citation' },
      { id: 'analyser-4', libelle: 'Calculer une réponse' },
      { id: 'analyser-8', libelle: 'Catégoriser des données' },
      { id: 'analyser-6', libelle: 'Déboguer du code' },
      { id: 'analyser-5', libelle: 'Générer des étapes de résolution' },
      { id: 'analyser-10', libelle: 'Prioriser des approches' },
      { id: 'analyser-1', libelle: 'Proposer une structure de travail' },
      { id: 'analyser-2', libelle: 'Proposer une méthode de résolution' },
      { id: 'analyser-7', libelle: "Proposer des pistes d'argumentation" },
      { id: 'analyser-3', libelle: 'Résoudre un problème' },
    ]
  },
  {
    id: 'creer',
    libelle: 'Créer et évaluer',
    color: '#27ae60',
    actions: [
      { id: 'creer-17', libelle: 'Comparer des alternatives' },
      { id: 'creer-21', libelle: 'Critiquer une position' },
      { id: 'creer-6', libelle: 'Commenter du code' },
      { id: 'creer-14', libelle: 'Donner de la rétroaction' },
      { id: 'creer-18', libelle: 'Estimer des coûts' },
      { id: 'creer-19', libelle: 'Effectuer des recommandations' },
      { id: 'creer-16', libelle: "Élaborer un plan d'action" },
      { id: 'creer-1', libelle: 'Générer une version du travail' },
      { id: 'creer-2', libelle: 'Générer un paragraphe' },
      { id: 'creer-3', libelle: 'Mettre en page le travail' },
      { id: 'creer-15', libelle: 'Paraphraser une partie de texte' },
      { id: 'creer-20', libelle: 'Porter un jugement critique' },
      { id: 'creer-12', libelle: 'Répondre à des questions' },
      { id: 'creer-4', libelle: "Réviser l'orthographe et la syntaxe" },
      { id: 'creer-5', libelle: 'Créer du code' },
      { id: 'creer-7', libelle: 'Créer une image' },
      { id: 'creer-8', libelle: 'Créer un diagramme' },
      { id: 'creer-9', libelle: 'Créer une vidéo' },
      { id: 'creer-10', libelle: 'Créer une carte conceptuelle' },
      { id: 'creer-11', libelle: 'Créer un support de présentation' },
      { id: 'creer-13', libelle: "Suggérer des pistes durant une situation d'évaluation" },
    ]
  }
];

export const PERMISSION_LEVELS = [
  { id: 'non', libelle: 'Non autorisée', color: '#E41E25', bg: '#fff4f4', border: '#E41E25' },
  { id: 'aar', libelle: 'Autorisée avec restrictions', color: '#b45309', bg: '#fffbeb', border: '#f59e0b' },
  { id: 'asr', libelle: 'Autorisée sans restriction', color: '#15803d', bg: '#f0fdf4', border: '#22c55e' },
  { id: 'obl', libelle: 'Obligatoire', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6' },
];

export default BLOOM_CATEGORIES;