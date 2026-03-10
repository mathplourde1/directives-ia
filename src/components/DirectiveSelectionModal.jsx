import React, { useState, useEffect } from 'react';
import exemplesDirectives from './exemplesDirectives.json';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

const NIVEAU_MAP = {
  'Non autorisée': 'non',
  'Autorisée avec restrictions': 'aar',
  'Autorisée sans restrictions': 'asr',
  'Obligatoire': 'obl',
};

const NIVEAU_LABELS = {
  non: 'Non autorisée',
  aar: 'Autorisée avec restrictions',
  asr: 'Autorisée sans restrictions',
  obl: 'Obligatoire',
};

const HIERARCHY = ['non', 'aar', 'asr', 'obl'];

export default function DirectiveSelectionModal({ isOpen, onClose, onSelectDirective, currentEtapeId, currentIaOption }) {
  const currentNiveau = NIVEAU_MAP[currentIaOption] || null;
  const [activeTab, setActiveTab] = useState(currentNiveau || 'non');

  useEffect(() => {
    if (isOpen) setActiveTab(currentNiveau || 'non');
  }, [isOpen, currentNiveau]);

  const availableNiveaux = HIERARCHY.filter(n =>
    exemplesDirectives.some(d => d.parent === currentEtapeId && d.niveau === n)
  );

  const getDirectives = (niveau) =>
    exemplesDirectives
      .filter(d => d.parent === currentEtapeId && d.niveau === niveau)
      .sort((a, b) => a.sequence - b.sequence);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: 680, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#231F20', fontSize: '1em' }}>Insérer un exemple de directive</DialogTitle>
        </DialogHeader>

        {availableNiveaux.length === 0 ? (
          <p style={{ color: '#999', fontSize: '0.9em' }}>Aucun exemple disponible pour cette étape.</p>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TabsList style={{ flexShrink: 0, height: 'auto', flexWrap: 'wrap', gap: 2 }}>
              {availableNiveaux.map(n => (
                <TabsTrigger key={n} value={n} style={{ fontSize: '0.78em', padding: '4px 10px' }}>
                  {n === currentNiveau ? '★ ' : ''}{NIVEAU_LABELS[n]}
                </TabsTrigger>
              ))}
            </TabsList>

            {availableNiveaux.map(n => (
              <TabsContent key={n} value={n} style={{ flex: 1, overflow: 'hidden', marginTop: 8 }}>
                <p style={{ fontSize: '0.8em', color: '#666', marginBottom: 8 }}>
                  Survolez un exemple pour voir le texte complet. Cliquez pour l'insérer dans la zone de texte.
                </p>
                <ScrollArea style={{ height: 380 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 8 }}>
                    <TooltipProvider delayDuration={300}>
                      {getDirectives(n).map((d, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => { onSelectDirective(d.exemple); onClose(); }}
                              style={{
                                textAlign: 'left',
                                padding: '9px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                cursor: 'pointer',
                                background: 'white',
                                fontFamily: 'inherit',
                                fontSize: '0.88em',
                                lineHeight: 1.4,
                                color: '#231F20',
                                transition: 'background 0.15s, border-color 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#e8f4fd'; e.currentTarget.style.borderColor = '#00A4E4'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#ddd'; }}
                            >
                              {d.court}…
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" style={{ maxWidth: 340, fontSize: '0.85em', lineHeight: 1.5, whiteSpace: 'normal' }}>
                            <p>{d.exemple}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}