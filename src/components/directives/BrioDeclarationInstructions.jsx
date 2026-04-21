import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const INSTRUCTIONS_PAR_ETAPE = '<p><strong>⚠️ Consultez les directives concernant l\'utilisation autorisée des SIA dans la section <i>Utilisation de l\'intelligence artificielle</i> (la suivante) avant de débuter votre travail !</strong></p><p>Pour compléter votre déclaration d\'utilisation des SIA, suivez ces étapes :</p><ol><li>Accédez à l\'outil de déclaration : <a href="https://directives-ia.base44.app/Declaration" target="_blank">Déclaration d\'utilisation des SIA.</a></li><li>Importez le <strong>fichier de sauvegarde</strong> fourni par votre personne enseignante.</li><li>Remplissez les champs de déclaration pour chaque étape concernée.</li><li>Générez votre déclaration et téléchargez-la en format Word ou PDF.</li><li>Transmettez le fichier généré à votre personne enseignante dans la boite de dépôt dédiée de cette évaluation.</li></ol>';
const INSTRUCTIONS_PAR_OUTIL = '<p><strong>⚠️ Consultez les directives concernant l\'utilisation autorisée des SIA dans la section <i>Utilisation de l\'intelligence artificielle</i> (la suivante) avant de débuter votre travail !</strong></p><p>Pour compléter votre déclaration d\'utilisation des SIA, suivez ces étapes :</p><ol><li>Accédez à l\'outil de déclaration par outil : <a href="https://directives-ia.base44.app/Declaration-outil" target="_blank">Déclaration d\'utilisation des SIA (par outil).</a></li><li>Importez le <strong>fichier de sauvegarde</strong> fourni par votre personne enseignante.</li><li>Remplissez les champs de déclaration pour chaque outil utilisé.</li><li>Générez votre déclaration et téléchargez-la en format Word ou PDF.</li><li>Transmettez le fichier généré à votre personne enseignante dans la boite de dépôt dédiée de cette évaluation.</li></ol>';

export default function BrioDeclarationInstructions({ onSave }) {
  const [declarationTitle, setDeclarationTitle] = useState("Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA)");
  const [instructorInstructions, setInstructorInstructions] = useState(INSTRUCTIONS_PAR_OUTIL);
  const [declarationFieldDescription, setDeclarationFieldDescription] = useState("Fichier à utiliser dans l'outil de déclaration.");
  const [copyTitleOk, setCopyTitleOk] = useState(false);
  const [copyDescriptionOk, setCopyDescriptionOk] = useState(false);
  const [copyFileDescOk, setCopyFileDescOk] = useState(false);

  async function handleCopyText(text, setCopyOk) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1800);
    } catch { alert('Erreur lors de la copie. Essayez manuellement.'); }
  }

  async function handleCopyRich(html, setCopyOk) {
    const plain = html.replace(/<[^>]+>/g, '');
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([plain], { type: 'text/plain' });
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1800);
    } catch { alert('Erreur lors de la copie. Essayez manuellement.'); }
  }

  const borderColor = '#b3d9f7';
  const bgColor = '#f7fbff';

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid #e0e0e0', paddingTop: 20 }}>
      <div style={{ padding: '16px 20px', border: `1px solid ${borderColor}`, borderRadius: 8, background: bgColor }}>
        <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: '1.05em', fontWeight: 'bold', color: '#231F20' }}>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a839e74b536a607f6d9cc8/43d3bfa87_logo-brio.png" alt="Logo Brio" style={{ float: 'right', width: 70, marginLeft: 12, marginBottom: 4 }} />
          ✅ Option B : formulaire interactif en ligne (Brio)
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.95em', lineHeight: 1.6 }}>
          Nous vous encourageons à ajouter un item de type <a href="https://aide.brioeducation.ca/enseignant/evaluations/creer-parametrer-les-evaluations/gerer-la-description-dune-evaluation/" target="_blank" className="text-blue-800 underline">Fichier</a> juste au dessus de la section <i>Utilisation de l'intelligence artificielle</i> dans les instructions de votre évaluation. Téléchargez et partagez le fichier de sauvegarde de la section précédente.
        </p>



        {/* Titre */}
        <div style={{ marginTop: 14, padding: '14px 18px', background: '#fff', border: '1px solid #ccc', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.93em' }}>À copier dans le champ Titre de la liste :</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" className="btn-primary" onClick={() => handleCopyText(declarationTitle, setCopyTitleOk)} style={{ fontSize: '0.85em', padding: '6px 12px' }}>
                Copier pour coller en ligne (Brio)
              </button>
              {copyTitleOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
            </div>
          </div>
          <input type="text" value={declarationTitle} onChange={e => setDeclarationTitle(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', fontFamily: 'inherit', fontSize: '0.9em', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box', backgroundColor: 'white' }} />
        </div>

        {/* Bouton sauvegarde */}
        {onSave && (
          <div style={{ marginTop: 14 }}>
            <button type="button" className="btn-primary" onClick={onSave}>
              💾 Télécharger le fichier de sauvegarde
            </button>
          </div>
        )}

        {/* Description */}
        <div style={{ marginTop: 14, padding: '14px 18px', background: '#fff', border: '1px solid #ccc', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.93em' }}>À copier dans la section Description :</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" className="btn-primary" onClick={() => handleCopyRich(instructorInstructions, setCopyDescriptionOk)} style={{ fontSize: '0.85em', padding: '6px 12px' }}>
                Copier pour coller en ligne (Brio)
              </button>
              {copyDescriptionOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
            </div>
          </div>
          <ReactQuill
            value={instructorInstructions}
            onChange={setInstructorInstructions}
            modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']] }}
            placeholder="Écrivez des instructions supplémentaires pour les personnes étudiantes..."
            style={{ fontSize: '0.9em', backgroundColor: 'white', borderRadius: 4, minHeight: 120 }}
            theme="snow" />
        </div>

        {/* Description du fichier */}
        <div style={{ marginTop: 14, padding: '14px 18px', background: '#fff', border: '1px solid #ccc', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.93em' }}>À copier dans le champ Description du fichier :</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" className="btn-primary" onClick={() => handleCopyText(declarationFieldDescription, setCopyFileDescOk)} style={{ fontSize: '0.85em', padding: '6px 12px' }}>
                Copier pour coller en ligne (Brio)
              </button>
              {copyFileDescOk && <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>Copié !</span>}
            </div>
          </div>
          <textarea value={declarationFieldDescription} onChange={e => setDeclarationFieldDescription(e.target.value)} rows={1}
            style={{ width: '100%', padding: '8px 10px', fontFamily: 'inherit', fontSize: '0.9em', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box', backgroundColor: 'white', resize: 'none' }} />
        </div>
      </div>
    </div>
  );
}