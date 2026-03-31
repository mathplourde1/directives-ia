import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Verbes de Bloom par niveau taxonomique (du plus complexe au plus simple)
const BLOOM_LEVELS = [
  {
    id: 'creer',
    libelle: 'Créer',
    color: '#27ae60',
    description: 'Former un tout cohérent et nouveau, générer de nouvelles idées, produire une œuvre originale.',
    verbes: ['Adapter', 'Agencer', 'Anticiper', 'Arranger', 'Assembler', 'Classer', 'Collecter', 'Combiner', 'Commenter', 'Composer', 'Concevoir', 'Constituer', 'Construire', 'Créer', 'Déduire', 'Dériver', 'Développer', 'Discuter', 'Écrire', 'Élaborer', 'Exposer', 'Formuler', 'Généraliser', 'Générer', 'Imaginer', 'Incorporer', 'Innover', 'Intégrer', 'Inventer', 'Mettre en place', 'Modifier', 'Organiser', 'Planifier', 'Préparer', 'Produire', 'Projeter', 'Proposer', 'Raconter', 'Rédiger', 'Relater', 'Réorganiser', 'Schématiser', 'Structurer', 'Substituer', 'Synthétiser', 'Transmettre'],
  },
  {
    id: 'evaluer',
    libelle: 'Évaluer',
    color: '#8e44ad',
    description: 'Porter un jugement critique fondé sur des critères. Valider des théories. Justifier des décisions.',
    verbes: ['Apprécier', 'Appuyer', 'Argumenter', 'Attaquer', 'Choisir', 'Classer', 'Comparer', 'Conclure', 'Considérer', 'Contraster', 'Contrôler', 'Convaincre', 'Critiquer', 'Décider', 'Déduire', 'Défendre', 'Déterminer', 'Estimer', 'Évaluer', 'Expliquer', 'Juger', 'Justifier', 'Mesurer', 'Noter', 'Persuader', 'Prédire', 'Produire', 'Recadrer', 'Recommander', 'Résumer', 'Sélectionner', 'Soupeser', 'Soutenir', 'Standardiser', 'Tester', 'Valider', 'Vérifier'],
  },
  {
    id: 'analyser',
    libelle: 'Analyser',
    color: '#e67e22',
    description: 'Résoudre des problèmes, repérer les éléments d\'une situation, interpréter des données.',
    verbes: ['Analyser', 'Arranger', 'Attribuer', 'Catégoriser', 'Choisir', 'Classer', 'Cibler', 'Comparer', 'Contraster', 'Corréler', 'Critiquer', 'Décomposer', 'Découper', 'Déduire', 'Délimiter', 'Détecter', 'Différencier', 'Discriminer', 'Disséquer', 'Distinguer', 'Diviser', 'Examiner', 'Expérimenter', 'Expliquer', 'Générer', 'Identifier', 'Inférer', 'Interpréter', 'Limiter', 'Mettre en priorité', 'Mettre en relation', 'Modéliser', 'Nuancer', 'Organiser', 'Opposer', 'Questionner', 'Rechercher', 'Relier', 'Séparer', 'Subdiviser', 'Tester'],
  },
  {
    id: 'appliquer',
    libelle: 'Appliquer',
    color: '#c0392b',
    description: 'Résoudre des problèmes en suivant une procédure établie, calculer, appliquer une méthode.',
    verbes: ['Acter', 'Adapter', 'Administrer', 'Appliquer', 'Assembler', 'Calculer', 'Choisir', 'Classer', 'Classifier', 'Compléter', 'Construire', 'Contrôler', 'Découvrir', 'Démontrer', 'Dessiner', 'Déterminer', 'Développer', 'Employer', 'Établir', 'Exécuter', 'Expérimenter', 'Formuler', 'Fournir', 'Généraliser', 'Gérer', 'Illustrer', 'Implanter', 'Informer', 'Interpréter', 'Manipuler', 'Mesurer', 'Modifier', 'Montrer', 'Opérer', 'Organiser', 'Planifier', 'Pratiquer', 'Préparer', 'Produire', 'Rédiger', 'Résoudre', 'Schématiser', 'Simuler', 'Traiter', 'Utiliser'],
  },
  {
    id: 'comprendre',
    libelle: 'Comprendre',
    color: '#2980b9',
    description: 'Interpréter ou décrire des informations, expliquer un concept, synthétiser un sujet.',
    verbes: ['Associer', 'Classer', 'Comparer', 'Compléter', 'Conclure', 'Contextualiser', 'Convertir', 'Décrire', 'Démontrer', 'Déterminer', 'Différencier', 'Discuter', 'Distinguer', 'Estimer', 'Établir', 'Expliquer', 'Exprimer', 'Extrapoler', 'Généraliser', 'Identifier', 'Illustrer', 'Inférer', 'Interpréter', 'Localiser', 'Ordonner', 'Paraphraser', 'Préciser', 'Prédire', 'Préparer', 'Rapporter', 'Reformuler', 'Regrouper', 'Réorganiser', 'Représenter', 'Résumer', 'Schématiser', 'Situer', 'Traduire'],
  },
  {
    id: 'connaitre',
    libelle: 'Connaître',
    color: '#7f8c8d',
    description: 'Restituer l\'information apprise, mémoriser, identifier, reconnaitre, discriminer.',
    verbes: ['Assigner', 'Associer', 'Caractériser', 'Cataloguer', 'Citer', 'Collecter', 'Décrire', 'Définir', 'Délimiter', 'Désigner', 'Déterminer', 'Enregistrer', 'Énumérer', 'Établir', 'Étiqueter', 'Examiner', 'Expérimenter', 'Identifier', 'Indiquer', 'Inventorier', 'Lister', 'Mémoriser', 'Montrer', 'Localiser', 'Nommer', 'Ordonner', 'Rappeler', 'Réciter', 'Répéter', 'Reconnaitre', 'Reproduire', 'Sélectionner', 'Situer'],
  },
];

// Mapping: categoryColor → Bloom level IDs considered "primary" for that category
// restrictionsData colors: connaitre=#4a90d9, analyser=#e67e22, creer=#27ae60
const CATEGORY_COLOR_TO_BLOOM = {
  '#4a90d9': ['connaitre', 'comprendre'],
  '#e67e22': ['analyser', 'appliquer'],
  '#27ae60': ['creer', 'evaluer'],
};

function getPrimaryBloomIds(categoryColor) {
  if (!categoryColor) return [];
  // Match by color string, case-insensitive
  const key = Object.keys(CATEGORY_COLOR_TO_BLOOM).find(
    k => k.toLowerCase() === categoryColor.toLowerCase()
  );
  return key ? CATEGORY_COLOR_TO_BLOOM[key] : [];
}

function VerbSection({ level, onInsert }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{
          background: level.color, color: 'white', borderRadius: 4,
          padding: '2px 8px', fontSize: '0.78em', fontWeight: 'bold', flexShrink: 0
        }}>
          {level.libelle}
        </span>
        <span style={{ fontSize: '0.72em', color: '#888', lineHeight: 1.3 }}>
          {level.description}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {level.verbes.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onInsert(v)}
            style={{
              background: 'white',
              border: `1px solid ${level.color}40`,
              borderRadius: 12,
              padding: '2px 9px',
              fontSize: '0.78em',
              cursor: 'pointer',
              color: level.color,
              fontFamily: 'inherit',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = level.color + '18'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomActionModal({ isOpen, onClose, onSave, initialValue, categoryColor }) {
  const [value, setValue] = useState(initialValue || '');
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || '');
      setOthersOpen(false);
    }
  }, [isOpen, initialValue]);

  const primaryIds = getPrimaryBloomIds(categoryColor);
  const primaryLevels = BLOOM_LEVELS.filter(l => primaryIds.includes(l.id));
  const otherLevels = BLOOM_LEVELS.filter(l => !primaryIds.includes(l.id));

  function insertVerb(verb) {
    setValue(prev => {
      if (!prev.trim()) {
        // Empty field → capitalize first letter
        return verb.charAt(0).toUpperCase() + verb.slice(1) + ' ';
      }
      // Non-empty → append lowercase
      const sep = prev.endsWith(' ') ? '' : ' ';
      return prev + sep + verb.toLowerCase() + ' ';
    });
  }

  function handleApply() {
    onSave(value.trim());
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{
        maxWidth: 860, width: '95vw', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 24px'
      }}>
        <DialogHeader style={{ flexShrink: 0 }}>
          <DialogTitle style={{ fontSize: '1em' }}>Action personnalisée — verbes de Bloom</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden', minHeight: 0, marginTop: 8 }}>

          {/* LEFT 70%: Bloom verbs */}
          <div style={{
            flex: 7, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0,
            borderRight: '1px solid #e5e7eb', paddingRight: 16,
          }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 8, flexShrink: 0 }}>
              Cliquez un verbe pour l'insérer. Les verbes correspondant à la catégorie active sont affichés en premier.
            </p>
            <ScrollArea style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 6 }}>

                {/* Primary levels */}
                {primaryLevels.length > 0 && primaryLevels.map(level => (
                  <VerbSection key={level.id} level={level} onInsert={insertVerb} />
                ))}

                {/* Divider + accordion for other levels */}
                {otherLevels.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setOthersOpen(o => !o)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px 0', width: '100%', color: '#555', fontSize: '0.82em',
                      }}
                    >
                      <span style={{
                        display: 'inline-block', transform: othersOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s', fontSize: '0.85em'
                      }}>▶</span>
                      <span style={{ borderTop: '1px dashed #ccc', flex: 1, marginLeft: 4 }} />
                      <span style={{ whiteSpace: 'nowrap', color: '#888' }}>
                        {othersOpen ? 'Masquer les autres niveaux' : 'Afficher les autres niveaux de Bloom'}
                      </span>
                      <span style={{ borderTop: '1px dashed #ccc', flex: 1, marginRight: 4 }} />
                    </button>

                    {othersOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
                        {otherLevels.map(level => (
                          <VerbSection key={level.id} level={level} onInsert={insertVerb} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </ScrollArea>
          </div>

          {/* RIGHT 30%: text input + buttons */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Libellé de l'action :
            </p>
            <textarea
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Ex. : Analyser des sources primaires…"
              rows={2}
              style={{
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: 6,
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: '0.9em',
                resize: 'vertical',
                minHeight: '3.5em',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  background: categoryColor || '#00A4E4', color: 'white',
                  border: 'none', borderRadius: 5, padding: '8px 12px',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '0.88em', width: '100%'
                }}
              >
                Appliquer
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#f1f1f1', color: '#555',
                  border: '1px solid #ccc', borderRadius: 5, padding: '7px 12px',
                  cursor: 'pointer', fontSize: '0.88em', width: '100%'
                }}
              >
                Annuler
              </button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}