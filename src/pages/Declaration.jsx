import React, { useState, useRef } from 'react';
import ETAPES from '@/components/etapesData';

const ETAPE_IDS = ETAPES.map((e) => e.id);

function parseXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) return { error: 'parse', raw: xmlText };

  const root = doc.querySelector('guide-ia');
  if (!root) return { error: 'structure', raw: xmlText };

  try {
    const getI = (node, tag) => node?.querySelector(tag)?.textContent ?? '';
    const identNode = root.querySelector('identification');
    const identification = {
      cours: getI(identNode, 'cours'),
      session: getI(identNode, 'session'),
      enseignants: getI(identNode, 'enseignants'),
      evaluation: getI(identNode, 'evaluation')
    };

    // Build order array from <ordre> element (list of ids)
    const ordreNode = root.querySelector('ordre');
    const ordreIds = ordreNode ? ordreNode.textContent.split(',').map(s => s.trim()).filter(Boolean) : null;

    // Parse etape nodes into a map keyed by id
    const etapeNodes = doc.querySelectorAll('etape');
    const etapeMap = {};
    etapeNodes.forEach((node) => {
      const id = node.getAttribute('id');
      if (id) etapeMap[id] = node;
    });

    // Determine the ordered list of ids to process
    const orderedIds = ordreIds || Object.keys(etapeMap);

    const etapes = [];
    orderedIds.forEach((id) => {
      const node = etapeMap[id];
      if (!node) return;

      const checked = node.querySelector('checked')?.textContent === 'true';
      if (!checked) return;

      const get = (tag) => node.querySelector(tag)?.textContent ?? '';

      // Determine etape info by id
      let etapeInfo;
      const found = ETAPES.find(e => e.id === id);
      if (found && id !== 'autres') {
        etapeInfo = { ...found };
      } else {
        const libelleCustom = get('libelle_custom');
        const exemples = get('exemples');
        etapeInfo = {
          id: 'autres',
          libelle: libelleCustom || (found ? found.libelle : id),
          parenthese: exemples || (found ? found.parenthese : '')
        };
      }

      etapes.push({
        etapeInfo,
        ia: get('ia'),
        justification: get('justification'),
        declaration: get('declaration'),
        decl_iagraphie: get('decl_iagraphie') === 'true',
        decl_iagraphie_text: get('decl_iagraphie_text'),
        decl_traces: get('decl_traces') === 'true',
        decl_traces_text: get('decl_traces_text'),
        decl_logique: get('decl_logique') === 'true',
        decl_logique_text: get('decl_logique_text')
      });
    });

    return { ok: true, identification, etapes };
  } catch {
    return { error: 'structure', raw: xmlText };
  }
}

function defaultStudentState() {
  return {
    // aucune exigence checkbox
    aucune_conforme: false,
    // iagraphie
    iagraphie_conforme: false,
    // traces
    traces_reponse: '',
    traces_conforme: false,
    // logique
    logique_reponse: '',
    logique_conforme: false
  };
}

export default function Declaration() {
  const [data, setData] = useState(null); // null | { error, raw } | { ok, identification, etapes }
  const [studentStates, setStudentStates] = useState([]);
  const [studentNom, setStudentNom] = useState('');
  const [studentGroupe, setStudentGroupe] = useState('');
  const [nomError, setNomError] = useState(false);
  const fileInputRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseXML(ev.target.result);
      setData(result);
      if (result.ok) {
        setStudentStates(result.etapes.map(() => defaultStudentState()));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function updateStudent(i, field, value) {
    setStudentStates((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  const errorStyle = { color: '#E41E25', fontSize: '0.82em', marginTop: 4 };

  return (
    <div style={{ background: '#F2F2F2', color: '#231F20', margin: 0, padding: 20, minHeight: '100vh' }}>
      <style>{`
        :root { --rouge: #E41E25; --bleu-ul: #00A4E4; }
        h1 { color: #E41E25; text-align: center; }
        table.decl-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table.decl-table th, table.decl-table td { border: 1px solid #ccc; padding: 10px; text-align: left; vertical-align: top; }
        table.decl-table th { background-color: #F2F2F2; }
        .btn-primary { background-color: #00A4E4; color: white; border: none; padding: 10px 20px; margin: 6px 4px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
        .btn-primary:hover { background-color: #0084b0; }
        .locked-field { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 8px; font-size: 0.9em; line-height: 1.5; color: #333; }
        .locked-field a { color: #0056b3; text-decoration: underline; }
        .student-input { width: 95%; padding: 6px 8px; border: 1px solid #aaa; border-radius: 4px; font-family: inherit; font-size: 0.9em; margin-top: 6px; }
        .conforme-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 0.88em; }
        .section-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .raw-box { background: #fff8e1; border: 1px solid #f0c040; border-radius: 6px; padding: 14px; margin-top: 12px; font-size: 0.82em; white-space: pre-wrap; overflow-x: auto; font-family: monospace; max-height: 300px; overflow-y: auto; }
      `}</style>

      <h1 className="mb-4 text-2xl font-semibold">Déclaration d'utilisation de systèmes d'intelligence artificielle (SIA) dans le cadre d'une évaluation</h1>

      {/* Upload zone */}
      {!data?.ok &&
      <div className="section-box" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16, fontSize: '1em' }}>
            Importez le fichier de sauvegarde XML fourni par votre personne enseignante pour afficher les directives d'utilisation des SIA pour cette évaluation.
          </p>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            📂 Importer le fichier XML
          </button>
          <input ref={fileInputRef} type="file" accept=".xml" style={{ display: 'none' }} onChange={handleFile} />

          <div style={{ marginTop: 12 }}>
            <a href="#" style={{ fontSize: '0.85em', color: '#666', textDecoration: 'underline' }}
              onClick={e => { e.preventDefault(); setData({ error: 'manual' }); }}>
              Je n'ai pas de fichier XML — accéder au mode manuel
            </a>
          </div>

          {/* Error state */}
          {data?.error &&
        <div style={{ marginTop: 20, textAlign: 'left' }}>
              {data.error === 'manual' ? (
                <div style={{ color: '#555', marginBottom: 8, fontSize: '0.9em', background: '#f0f4f8', border: '1px solid #ccc', borderRadius: 6, padding: '10px 14px' }}>
                  En mode manuel, remplissez le formulaire sans fichier XML. Aucune directive n'est pré-remplie.
                </div>
              ) : (
                <>
                  <div style={{ color: '#E41E25', fontWeight: 'bold', marginBottom: 8 }}>
                    ⚠ Ce fichier XML n'est pas conforme au format attendu.
                  </div>
                  <p style={{ fontSize: '0.9em', marginBottom: 8 }}>
                    Le fichier ne peut pas être interprété automatiquement. Vous pouvez sauvegarder le contenu brut ci-dessous et remplir vos déclarations en mode <strong>manuel</strong>.
                  </p>
                </>
              )}
              {data.error !== 'manual' && <>
                <button className="btn-primary" onClick={() => {
              const blob = new Blob([data.raw], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;a.download = 'contenu-brut.txt';a.click();
              URL.revokeObjectURL(url);
            }}>
                  💾 Sauvegarder la version brute
                </button>
                <div className="raw-box">{data.raw}</div>
              </>}
            </div>
        }
        </div>
      }

      {/* Main content after successful load */}
      {data?.ok &&
      <>
          {/* Identification */}
          <div className="section-box">
            <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 10 }}>Évaluation ciblée</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '0.95em' }}>
              {data.identification.cours && <div><strong>Cours :</strong> {data.identification.cours}</div>}
              {data.identification.session && <div><strong>Session :</strong> {data.identification.session}</div>}
              {data.identification.evaluation && <div><strong>Évaluation :</strong> {data.identification.evaluation}</div>}
              {data.identification.enseignants && <div><strong>Personne(s) enseignante(s) :</strong> {data.identification.enseignants}</div>}
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn-primary" style={{ background: '#6c757d' }} onClick={() => {setData(null);setStudentStates([]);}}>
                🔄 Charger un autre fichier
              </button>
            </div>
          </div>

          {/* Student identity */}
          <div className="section-box">
            <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 10 }}>Identification</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                  Nom complet <span style={{ color: '#E41E25' }}>*</span>
                </label>
                <input
                type="text"
                value={studentNom}
                onChange={(e) => {setStudentNom(e.target.value);setNomError(false);}}
                placeholder="ex. Marie Tremblay"
                style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: nomError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: nomError ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />

                {nomError && <span style={{ color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' }}>⚠ Ce champ est requis</span>}
              </div>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                  Numéro de groupe ou de section
                </label>
                <input
                type="text"
                value={studentGroupe}
                onChange={(e) => setStudentGroupe(e.target.value)}
                placeholder="ex. Groupe 02"
                style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />

              </div>
            </div>
          </div>

          {/* Declaration table */}
          <div className="section-box" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="decl-table">
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '32%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Étape</th>
                  <th>L'utilisation des SIA est…</th>
                  <th>Directives de l'enseignant·e</th>
                  <th>Votre déclaration</th>
                </tr>
              </thead>
              <tbody>
                {data.etapes.map((etape, i) => {
                const s = studentStates[i] || defaultStudentState();
                const hasTraces = etape.decl_traces;
                const hasLogique = etape.decl_logique;
                const hasIagraphie = etape.decl_iagraphie;
                const isAucune = etape.declaration === 'aucune';

                return (
                  <tr key={i}>
                      {/* Col 1: Étape */}
                      <td>
                        <strong>{etape.etapeInfo.libelle}</strong>
                        {etape.etapeInfo.parenthese &&
                      <span style={{ display: 'block', fontWeight: 'normal', color: '#555', fontSize: '0.88em', marginTop: 3 }}>
                            ({etape.etapeInfo.parenthese})
                          </span>
                      }
                      </td>

                      {/* Col 2: IA level */}
                      <td><strong>{etape.ia}</strong></td>

                      {/* Col 3: Directives (locked) */}
                      <td>
                        <div className="locked-field" dangerouslySetInnerHTML={{ __html: etape.justification }} />
                      </td>

                      {/* Col 4: Student declaration */}
                      <td>
                        {isAucune &&
                      <div className="conforme-row">
                            <input type="checkbox" id={`aucune_${i}`} checked={s.aucune_conforme}
                        onChange={(e) => updateStudent(i, 'aucune_conforme', e.target.checked)} />
                            <label htmlFor={`aucune_${i}`}>Aucune exigence — je confirme avoir pris connaissance de cette directive.</label>
                          </div>
                      }

                        {!isAucune &&
                      <div>
                            {hasIagraphie &&
                        <div style={{ marginBottom: 12 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.88em', marginBottom: 4 }}>Références et IAgraphie</div>
                                <div className="locked-field" style={{ fontSize: '0.85em' }} dangerouslySetInnerHTML={{ __html: etape.decl_iagraphie_text }} />
                                <div className="conforme-row">
                                  <input type="checkbox" id={`iag_${i}`} checked={s.iagraphie_conforme}
                            onChange={(e) => updateStudent(i, 'iagraphie_conforme', e.target.checked)} />
                                  <label htmlFor={`iag_${i}`}>Je confirme avoir respecté cette exigence.</label>
                                </div>
                              </div>
                        }

                            {hasTraces &&
                        <div style={{ marginBottom: 12 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.88em', marginBottom: 4 }}>Conserver les traces suivantes</div>
                                <div className="locked-field" style={{ fontSize: '0.85em' }} dangerouslySetInnerHTML={{ __html: etape.decl_traces_text }} />
                                <textarea
                            className="student-input"
                            rows={3}
                            placeholder="Décrivez les traces que vous avez conservées…"
                            value={s.traces_reponse}
                            onChange={(e) => updateStudent(i, 'traces_reponse', e.target.value)} />

                                <div className="conforme-row">
                                  <input type="checkbox" id={`traces_${i}`} checked={s.traces_conforme}
                            onChange={(e) => updateStudent(i, 'traces_conforme', e.target.checked)} />
                                  <label htmlFor={`traces_${i}`}>Je confirme avoir conservé les traces requises.</label>
                                </div>
                              </div>
                        }

                            {hasLogique &&
                        <div style={{ marginBottom: 4 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.88em', marginBottom: 4 }}>Expliquer la logique d'utilisation</div>
                                <div className="locked-field" style={{ fontSize: '0.85em' }} dangerouslySetInnerHTML={{ __html: etape.decl_logique_text }} />
                                <textarea
                            className="student-input"
                            rows={3}
                            placeholder="Expliquez votre logique d'utilisation de l'IA…"
                            value={s.logique_reponse}
                            onChange={(e) => updateStudent(i, 'logique_reponse', e.target.value)} />

                                <div className="conforme-row">
                                  <input type="checkbox" id={`logique_${i}`} checked={s.logique_conforme}
                            onChange={(e) => updateStudent(i, 'logique_conforme', e.target.checked)} />
                                  <label htmlFor={`logique_${i}`}>Je confirme avoir expliqué ma logique d'utilisation.</label>
                                </div>
                              </div>
                        }
                          </div>
                      }
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        </>
      }
    </div>);

}