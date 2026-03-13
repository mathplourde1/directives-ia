import React from 'react';

const NIVEAUX_BRIO = {
  obl: {
    libelle: 'Obligatoire',
    raison: "Au moins l'une de vos étapes indique une utilisation obligatoire. Vos personnes étudiantes ont donc obligatoirement à utiliser au moins un SIA dans le cadre de cette évaluation."
  },
  asr: {
    libelle: 'Autorisée sans restrictions',
    raison: "Sans exception, toutes vos étapes indiquent une autorisation sans restriction. Vos personnes étudiantes ont donc la liberté d'utiliser un SIA dans le cadre de l'évaluation, mais pas une obligation."
  },
  aar: {
    libelle: 'Autorisée avec restrictions',
    raison: "Au moins l'une de vos étapes indique une autorisation avec restrictions (sans obligation d'utilisation d'un SIA). Vos personnes étudiantes ont donc une liberté balisée d'utiliser un SIA dans le cadre de l'évaluation, mais pas une obligation."
  },
  non: {
    libelle: 'Non autorisée',
    raison: "Sans exception, toutes vos étapes indiquent que les SIA ne sont pas autorisés. Vos personnes étudiantes n'ont donc aucun droit d'utiliser un SIA dans le cadre de l'évaluation."
  }
};

const IA_TO_CODE = {
  'Obligatoire': 'obl',
  'Autorisée sans restrictions': 'asr',
  'Autorisée avec restrictions': 'aar',
  'Non autorisée': 'non'
};

function computeNiveau(selections) {
  const codes = selections.map((s) => IA_TO_CODE[s.ia]).filter(Boolean);
  if (codes.length === 0) return null;
  if (codes.includes('obl')) return 'obl';
  if (codes.every((c) => c === 'asr')) return 'asr';
  if (codes.includes('aar') || codes.includes('asr') && codes.includes('non')) return 'aar';
  if (codes.every((c) => c === 'non')) return 'non';
  return 'aar';
}

export default function BrioSection({ selections }) {
  const niveauCode = computeNiveau(selections);
  const niveau = niveauCode ? NIVEAUX_BRIO[niveauCode] : null;

  return (
    <div className="synthese-section" style={{ borderColor: '#1895FD', background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 className="my-2 text-lg font-semibold">Utilisation de l'intelligence artificielle dans Brio</h2>
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a839e74b536a607f6d9cc8/119270fd2_logo-brio.png" alt="Logo Brio" style={{ height: 30 }} />
      </div>
      {niveau &&
      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.95em', lineHeight: 1.7 }}>
          <p className="mb-1">
            Si vous utilisez Brio pour un cours crédité, en considérant les étapes sélectionnées et les niveaux de permission choisis, le{' '}
            <a
            href="https://aide.brioeducation.ca/enseignant/evaluations/creer-parametrer-les-evaluations/ajouter-des-instructions-sur-lutilisation-de-lintelligence-artificielle-ia-dans-une-evaluation/"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#0056b3', textDecoration: 'underline' }}>

              niveau de permission
            </a>
            {' '}qui semble le plus logique à choisir pour l'évaluation est le suivant:
          </p>
          <p style={{ marginLeft: 20 }}>
            <strong className="text-base font-bold text-left">{niveau.libelle}</strong>
          </p>
          <p style={{ marginTop: 12 }} className="mb-1">Pourquoi cette option?</p>
          <p style={{ marginLeft: 20 }}>{niveau.raison}</p>
          <p style={{ marginTop: 12 }} className="mb-1">Utilisez la fonction <strong>Copier pour coller en ligne (Brio)</strong> de l'une des synthèses ci-dessous dans la section <strong>Précisions sur le niveau sélectionné</strong>.</p>
        </div>
      }
    </div>);

}