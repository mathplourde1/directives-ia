import React, { useState, useRef, useEffect } from 'react';
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
  const [isEquipe, setIsEquipe] = useState(false);
  const [nomEquipe, setNomEquipe] = useState('');
  const [equipiers, setEquipiers] = useState(['']);
  const [apercu, setApercu] = useState(null); // null | snapshot
  const [commentaires, setCommentaires] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null); // null | {ok:true,time} | {ok:false}
  const [fieldErrors, setFieldErrors] = useState([]); // per-etape: {traces_reponse, logique_reponse}
  const [confirmDialog, setConfirmDialog] = useState(null); // null | {uncheckedItems:[]}
  const [, forceUpdate] = useState(0);
  const fileInputRef = useRef();
  const apercuRef = useRef();

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

  // Tick every minute to keep elapsed time fresh
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  function buildUncheckedItems(states) {
    const items = [];
    data.etapes.forEach((etape, i) => {
      const s = states[i] || defaultStudentState();
      const isAucune = etape.declaration === 'aucune';
      const label = etape.etapeInfo.libelle;
      if (isAucune && !s.aucune_conforme) {
        items.push({ etape: label, exigence: 'Aucune exigence', field: `aucune_${i}` });
      } else {
        if (etape.decl_iagraphie && !s.iagraphie_conforme) items.push({ etape: label, exigence: 'Références et IAgraphie', field: `iag_${i}` });
        if (etape.decl_traces && !s.traces_conforme) items.push({ etape: label, exigence: 'Conserver les traces suivantes', field: `traces_${i}` });
        if (etape.decl_logique && !s.logique_conforme) items.push({ etape: label, exigence: 'Expliquer la logique d\'utilisation', field: `logique_${i}` });
      }
    });
    return items;
  }

  function doGenerate(forcedCommentaires) {
    const finalCommentaires = forcedCommentaires !== undefined ? forcedCommentaires : commentaires;
    setApercu({
      identification: data.identification,
      studentNom, studentGroupe, isEquipe, nomEquipe,
      equipiers: isEquipe ? [studentNom, ...equipiers] : [studentNom],
      etapes: data.etapes,
      states: studentStates,
      commentaires: finalCommentaires
    });
    setCommentaires(finalCommentaires);
    setSubmitStatus({ ok: true, time: new Date() });
    setTimeout(() => apercuRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function handleSoumettre() {
    // Validate nom
    if (!studentNom.trim()) { setNomError(true); setSubmitStatus({ ok: false }); return; }

    // Validate text fields (traces & logique must have text)
    const newFieldErrors = data.etapes.map((etape, i) => {
      const s = studentStates[i] || defaultStudentState();
      return {
        traces_reponse: etape.decl_traces && !s.traces_reponse.trim(),
        logique_reponse: etape.decl_logique && !s.logique_reponse.trim()
      };
    });
    const hasFieldErrors = newFieldErrors.some(e => e.traces_reponse || e.logique_reponse);
    setFieldErrors(newFieldErrors);
    if (hasFieldErrors) { setSubmitStatus({ ok: false }); return; }

    // Check unchecked confirmations
    const unchecked = buildUncheckedItems(studentStates);
    if (unchecked.length > 0) {
      setConfirmDialog({ uncheckedItems: unchecked });
      return;
    }

    setSubmitStatus({ ok: true, time: new Date() });
    doGenerate();
  }

  function handleGenerateAnyway() {
    // Add auto-comments for unchecked items
    const unchecked = confirmDialog?.uncheckedItems || [];
    const autoLines = unchecked.map(u => `• ${u.etape} — ${u.exigence} : Cette confirmation n'a pas été cochée : Expliquez pourquoi.`).join('\n');
    const merged = commentaires.trim() ? commentaires + '\n\n' + autoLines : autoLines;
    setConfirmDialog(null);
    doGenerate(merged);
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

            {/* Team toggle row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 14, alignItems: 'center' }}>
              <div>
                <button
                  type="button"
                  onClick={() => setIsEquipe(v => !v)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9em', fontWeight: 'bold', transition: 'background 0.2s',
                    background: isEquipe ? '#00A4E4' : '#e0e0e0', color: isEquipe ? 'white' : '#555'
                  }}>
                  <span style={{ width: 32, height: 18, borderRadius: 999, background: isEquipe ? 'rgba(255,255,255,0.4)' : '#bbb', display: 'inline-block', position: 'relative', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: isEquipe ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                  </span>
                  Ceci est un travail en équipe
                </button>
              </div>
              {isEquipe && (
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>Nom ou numéro d'équipe</label>
                  <input type="text" value={nomEquipe} onChange={e => setNomEquipe(e.target.value)}
                    placeholder="ex. Équipe A ou Équipe 03"
                    style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            {/* Names left column, groupe right column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {/* Left column: all teammate names stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Personne 1 (main student) */}
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                    {isEquipe ? 'Personne équipière 1' : 'Nom complet'} <span style={{ color: '#E41E25' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentNom}
                    onChange={(e) => {setStudentNom(e.target.value);setNomError(false);}}
                    placeholder="ex. Marie Tremblay"
                    style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: nomError ? '2px solid #E41E25' : '1px solid #ccc', borderRadius: 4, background: nomError ? '#fff4f4' : 'white', boxSizing: 'border-box' }} />
                  {nomError && <span style={{ color: '#E41E25', fontSize: '0.82em', marginTop: 4, display: 'block' }}>⚠ Ce champ est requis</span>}
                </div>

                {/* Additional teammates */}
                {isEquipe && equipiers.map((nom, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                        Personne équipière {idx + 2}
                      </label>
                      <input type="text" value={nom} onChange={e => setEquipiers(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                        placeholder="ex. Jean Dupont"
                        style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
                    </div>
                    {equipiers.length > 1 && (
                      <button type="button" onClick={() => setEquipiers(prev => prev.filter((_, i) => i !== idx))}
                        style={{ marginBottom: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#E41E25', fontSize: '1.1em' }} title="Retirer">✕</button>
                    )}
                  </div>
                ))}

                {isEquipe && (
                  <div>
                    <button type="button" onClick={() => setEquipiers(prev => [...prev, ''])}
                      style={{ background: 'none', border: '1px dashed #00A4E4', color: '#00A4E4', borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontSize: '0.88em', fontFamily: 'inherit' }}>
                      + Ajouter une personne équipière
                    </button>
                  </div>
                )}
              </div>

              {/* Right column: groupe */}
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginBottom: 3 }}>
                  Numéro de groupe ou de section
                </label>
                <input
                  type="text"
                  value={studentGroupe}
                  onChange={(e) => setStudentGroupe(e.target.value)}
                  placeholder="ex. 65100"
                  style={{ width: '100%', padding: '5px 8px', fontFamily: 'inherit', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Declaration table */}
          <div className="section-box" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="decl-table" style={{ fontSize: '0.93em' }}>
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
                  <th>Directives de la personne enseignante</th>
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
                            style={{ border: fieldErrors[i]?.traces_reponse ? '2px solid #E41E25' : undefined, background: fieldErrors[i]?.traces_reponse ? '#fff4f4' : undefined }}
                            onChange={(e) => { updateStudent(i, 'traces_reponse', e.target.value); setFieldErrors(prev => prev.map((fe, fi) => fi === i ? { ...fe, traces_reponse: false } : fe)); }} />
                               {fieldErrors[i]?.traces_reponse && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ Ce champ est requis</span>}

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
                            style={{ border: fieldErrors[i]?.logique_reponse ? '2px solid #E41E25' : undefined, background: fieldErrors[i]?.logique_reponse ? '#fff4f4' : undefined }}
                            onChange={(e) => { updateStudent(i, 'logique_reponse', e.target.value); setFieldErrors(prev => prev.map((fe, fi) => fi === i ? { ...fe, logique_reponse: false } : fe)); }} />
                                {fieldErrors[i]?.logique_reponse && <span style={{ color: '#E41E25', fontSize: '0.82em' }}>⚠ Ce champ est requis</span>}

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

          {/* Commentaires */}
          <div className="section-box">
            <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 8 }}>Commentaires, exceptions et précisions</h2>
            <textarea
              rows={4}
              value={commentaires}
              onChange={e => setCommentaires(e.target.value)}
              placeholder="Ajoutez ici tout commentaire, exception ou précision que vous souhaitez transmettre à votre personne enseignante…"
              style={{ width: '100%', padding: '7px 10px', fontFamily: 'inherit', fontSize: '0.93em', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          {/* Submit button */}
          <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '1em', padding: '11px 28px' }} onClick={handleSoumettre}>
              Générer la déclaration
            </button>
            {submitStatus && (submitStatus.ok ? (() => {
              const diffMs = new Date() - submitStatus.time;
              const diffMin = Math.floor(diffMs / 60000);
              const diffH = Math.floor(diffMin / 60);
              const elapsed = diffH > 0 ? `il y a ${diffH} heure${diffH > 1 ? 's' : ''}` : diffMin <= 0 ? "à l'instant" : `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
              return <span style={{ background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>✔️ Déclaration générée avec succès {elapsed}.</span>;
            })() :
              <span style={{ background: '#fde8e8', color: '#7b1d1d', padding: '6px 14px', borderRadius: 5, fontSize: '0.9em' }}>⚠ Certains champs obligatoires ne sont pas remplis correctement.</span>
            )}
          </div>

          {/* Preview */}
          {apercu && (
            <div ref={apercuRef} className="section-box" style={{ borderTop: '4px solid #00A4E4' }}>
              <h2 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '1.05em', marginBottom: 12, color: '#231F20' }}>
                Aperçu de la déclaration soumise
              </h2>

              {/* Identity recap */}
              <div style={{ background: '#f5f9ff', border: '1px solid #c8e0f4', borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: '0.92em', lineHeight: 1.8 }}>
                {apercu.identification.cours && <div><strong>Cours :</strong> {apercu.identification.cours}</div>}
                {apercu.identification.evaluation && <div><strong>Évaluation :</strong> {apercu.identification.evaluation}</div>}
                {apercu.identification.session && <div><strong>Session :</strong> {apercu.identification.session}</div>}
                {apercu.identification.enseignants && <div><strong>Personne(s) enseignante(s) :</strong> {apercu.identification.enseignants}</div>}
                {apercu.isEquipe && apercu.nomEquipe && <div><strong>Équipe :</strong> {apercu.nomEquipe}</div>}
                {apercu.isEquipe
                  ? apercu.equipiers.map((n, i) => n.trim() && <div key={i}><strong>Personne équipière {i + 1} :</strong> {n}</div>)
                  : <div><strong>Nom :</strong> {apercu.studentNom}</div>
                }
                {apercu.studentGroupe && <div><strong>Groupe :</strong> {apercu.studentGroupe}</div>}
              </div>

              {/* Commentaires in apercu */}
              {apercu.commentaires && (
                <div style={{ background: '#fffbea', border: '1px solid #e5c040', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: '0.92em' }}>
                  <strong>Commentaires, exceptions et précisions :</strong>
                  <pre style={{ margin: '6px 0 0', fontFamily: 'inherit', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{apercu.commentaires}</pre>
                </div>
              )}

              {/* Declaration summary table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', width: '18%' }}>Étape</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#F2F2F2', width: '16%' }}>Utilisation SIA</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#e8f4fd', width: '33%' }}>Directives (instructions)</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 10px', background: '#edfbf0', width: '33%' }}>Votre déclaration (réponses)</th>
                  </tr>
                </thead>
                <tbody>
                  {apercu.etapes.map((etape, i) => {
                    const s = apercu.states[i] || defaultStudentState();
                    const isAucune = etape.declaration === 'aucune';
                    return (
                      <tr key={i}>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}>
                          <strong>{etape.etapeInfo.libelle}</strong>
                          {etape.etapeInfo.parenthese && <span style={{ display: 'block', color: '#555', fontSize: '0.87em' }}>({etape.etapeInfo.parenthese})</span>}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top' }}>{etape.ia}</td>
                        {/* Instructions column — blue tint */}
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top', background: '#f0f7ff' }}>
                          {isAucune
                            ? <em style={{ color: '#555' }}>Aucune exigence</em>
                            : <div style={{ fontSize: '0.88em', lineHeight: 1.5 }}>
                                {etape.decl_iagraphie && <div style={{ marginBottom: 6 }}><strong>IAgraphie :</strong> <span dangerouslySetInnerHTML={{ __html: etape.decl_iagraphie_text }} /></div>}
                                {etape.decl_traces && <div style={{ marginBottom: 6 }}><strong>Traces :</strong> <span dangerouslySetInnerHTML={{ __html: etape.decl_traces_text }} /></div>}
                                {etape.decl_logique && <div><strong>Logique :</strong> <span dangerouslySetInnerHTML={{ __html: etape.decl_logique_text }} /></div>}
                              </div>
                          }
                        </td>
                        {/* Student answers column — green tint */}
                        <td style={{ border: '1px solid #ccc', padding: '8px 10px', verticalAlign: 'top', background: '#f2fbf4' }}>
                          {isAucune
                            ? <span style={{ color: s.aucune_conforme ? '#1a7a36' : '#c0392b', fontWeight: 'bold' }}>
                                {s.aucune_conforme ? '✔ Pris connaissance' : '✘ Non confirmé'}
                              </span>
                            : <div style={{ fontSize: '0.88em', lineHeight: 1.6 }}>
                                {etape.decl_iagraphie && <div style={{ marginBottom: 6 }}>
                                  <strong>IAgraphie :</strong> <span style={{ color: s.iagraphie_conforme ? '#1a7a36' : '#c0392b' }}>{s.iagraphie_conforme ? '✔ Confirmé' : '✘ Non confirmé'}</span>
                                </div>}
                                {etape.decl_traces && <div style={{ marginBottom: 6 }}>
                                  <strong>Traces :</strong> {s.traces_reponse ? <span style={{ color: '#333' }}>{s.traces_reponse}</span> : <em style={{ color: '#999' }}>Aucune réponse</em>}
                                  <span style={{ marginLeft: 6, color: s.traces_conforme ? '#1a7a36' : '#c0392b' }}>{s.traces_conforme ? '✔' : '✘'}</span>
                                </div>}
                                {etape.decl_logique && <div>
                                  <strong>Logique :</strong> {s.logique_reponse ? <span style={{ color: '#333' }}>{s.logique_reponse}</span> : <em style={{ color: '#999' }}>Aucune réponse</em>}
                                  <span style={{ marginLeft: 6, color: s.logique_conforme ? '#1a7a36' : '#c0392b' }}>{s.logique_conforme ? '✔' : '✘'}</span>
                                </div>}
                              </div>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      }
      {/* ===== CONFIRM DIALOG for unchecked items ===== */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, padding: '28px 32px', maxWidth: 560, width: '92%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ marginTop: 0, color: '#E41E25', fontSize: '1em' }}>⚠ Confirmations manquantes</h3>
            <p style={{ fontSize: '0.9em', marginBottom: 10, lineHeight: 1.6 }}>
              Les cases suivantes n'ont pas été cochées. Voulez-vous retourner dans le formulaire pour les cocher, ou générer la déclaration quand même ?
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: 20, fontSize: '0.88em', marginBottom: 18, lineHeight: 1.8 }}>
              {confirmDialog.uncheckedItems.map((u, i) => (
                <li key={i}><strong>{u.etape}</strong> — {u.exigence}</li>
              ))}
            </ul>
            <p style={{ fontSize: '0.85em', color: '#555', marginBottom: 18, lineHeight: 1.5 }}>
              Si vous choisissez de générer quand même, un commentaire sera automatiquement ajouté dans la section Commentaires pour chaque case non cochée.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary"
                style={{ background: '#6c757d', flex: 1 }}
                onClick={() => setConfirmDialog(null)}>
                ← Retourner dans le formulaire
              </button>
              <button type="button" className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleGenerateAnyway}>
                Générer quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </div>);

}