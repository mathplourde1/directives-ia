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

export default function CustomActionModal({ isOpen, onClose, onSave, initialValue, categoryColor }) {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    if (isOpen) setValue(initialValue || '');
  }, [isOpen, initialValue]);

  function insertVerb(verb) {
    setValue(prev => prev ? prev : verb.toLowerCase() + ' ');
  }

  function handleApply() {
    onSave(value);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{
        maxWidth: 820, width: '95vw', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 24px'
      }}>
        <DialogHeader style={{ flexShrink: 0 }}>
          <DialogTitle style={{ fontSize: '1em' }}>Action personnalisée</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden', minHeight: 0, marginTop: 8 }}>

          {/* Left: text input */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 6, flexShrink: 0 }}>
              Rédigez le libellé de votre action personnalisée. Cliquez un verbe à droite pour commencer.
            </p>
            <textarea
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Ex. : analyser des sources primaires…"
              rows={5}
              style={{
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: 6,
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: '0.95em',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleApply}
                style={{ background: categoryColor || '#00A4E4', color: 'white', border: 'none', borderRadius: 5, padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}
              >
                Appliquer
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ background: '#6c757d', color: 'white', border: 'none', borderRadius: 5, padding: '8px 16px', cursor: 'pointer', fontSize: '0.9em' }}
              >
                Annuler
              </button>
            </div>
          </div>

          {/* Right: Bloom verbs */}
          <div style={{
            width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid #e5e7eb', paddingLeft: 16, overflow: 'hidden'
          }}>
            <p style={{ fontSize: '0.78em', color: '#666', marginBottom: 8, flexShrink: 0 }}>
              Cliquez un verbe pour l'insérer dans le champ.
            </p>
            <ScrollArea style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
                {BLOOM_LEVELS.map(level => (
                  <div key={level.id}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5
                    }}>
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
                          onClick={() => insertVerb(v)}
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
                ))}
              </div>
            </ScrollArea>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}