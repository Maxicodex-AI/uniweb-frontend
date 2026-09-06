'use client'

import { useState } from 'react'
import Link from 'next/link'

const PATIENT_CASES = [
  {
    id: 1,
    title: 'Case 1: Chest Pain',
    specialty: 'Cardiology',
    color: '#dc2626',
    presenting: 'A 55-year-old male presents with crushing chest pain radiating to the left arm, diaphoresis (sweating), and shortness of breath. Pain started 2 hours ago at rest. He is hypertensive and smokes 20 cigarettes per day.',
    vitals: { BP: '160/95 mmHg', HR: '110 bpm', RR: '22/min', Temp: '37.2°C', O2Sat: '94%' },
    history: 'History of hypertension for 10 years, Type 2 diabetes, heavy smoker (20 pack-years), no previous cardiac history.',
    examination: 'Pale, sweaty, distressed. Heart sounds S1 S2 normal, no murmurs. Lungs: mild basal crepitations. Peripheral pulses present.',
    investigations: [
      { test: 'ECG', result: 'ST elevation in leads V1-V4' },
      { test: 'Troponin I', result: '2.8 ng/mL (elevated — normal < 0.04)' },
      { test: 'CXR', result: 'Mild cardiomegaly' },
      { test: 'FBC', result: 'WBC 12.0, Hb 14.2, Platelets 210' },
    ],
    diagnosis: 'ST-Elevation Myocardial Infarction (STEMI) — anterior',
    management: ['Aspirin 300mg stat', 'Clopidogrel 300mg loading dose', 'Morphine 5mg IV for pain', 'GTN spray sublingual', 'Urgent PCI (percutaneous coronary intervention)', 'Oxygen if O2Sat < 94%', 'IV access and bloods', 'Continuous cardiac monitoring'],
    differentials: ['NSTEMI', 'Unstable angina', 'Aortic dissection', 'Pulmonary embolism', 'Oesophageal spasm'],
  },
  {
    id: 2,
    title: 'Case 2: Fever and Headache',
    specialty: 'Infectious Disease / Neurology',
    color: '#d97706',
    presenting: 'A 22-year-old female university student presents with severe headache, high fever (39.5°C), neck stiffness, and photophobia for 12 hours. She mentions one of her roommates recently had a similar illness.',
    vitals: { BP: '110/70 mmHg', HR: '118 bpm', RR: '20/min', Temp: '39.5°C', O2Sat: '98%' },
    history: 'No significant past medical history. Lives in university accommodation. Vaccinations up to date except meningococcal vaccine.',
    examination: 'Ill-appearing, febrile. Neck rigidity present. Kernig\'s sign positive. Brudzinski\'s sign positive. Non-blanching petechial rash on trunk and limbs. No papilloedema.',
    investigations: [
      { test: 'LP (Lumbar Puncture)', result: 'Cloudy CSF, WBC 2000 (predominantly neutrophils), protein elevated, glucose low' },
      { test: 'CSF Culture', result: 'Neisseria meningitidis (pending)' },
      { test: 'Blood Culture', result: 'Pending' },
      { test: 'CT Head', result: 'No space-occupying lesion' },
    ],
    diagnosis: 'Bacterial Meningitis (Neisseria meningitidis — meningococcal)',
    management: ['Immediate IV Ceftriaxone 2g (do NOT delay for LP)', 'IV Dexamethasone 0.15mg/kg QDS', 'Isolate patient', 'Notify public health department', 'Contact tracing and prophylaxis for close contacts (Rifampicin)', 'Supportive care — IV fluids, analgesia', 'Monitor ICP'],
    differentials: ['Viral meningitis', 'Subarachnoid haemorrhage', 'Cerebral abscess', 'Encephalitis', 'Severe migraine'],
  },
  {
    id: 3,
    title: 'Case 3: Abdominal Pain',
    specialty: 'Surgery / Emergency Medicine',
    color: '#7c3aed',
    presenting: 'A 28-year-old male presents with severe periumbilical pain that has migrated to the right iliac fossa over 24 hours. He has nausea, one episode of vomiting, and low-grade fever. He has lost his appetite.',
    vitals: { BP: '118/76 mmHg', HR: '96 bpm', RR: '18/min', Temp: '38.1°C', O2Sat: '99%' },
    history: 'No significant past medical history. No previous abdominal surgeries. No similar episodes before.',
    examination: 'Tenderness and guarding at McBurney\'s point. Rovsing\'s sign positive. Psoas sign positive. Rebound tenderness present.',
    investigations: [
      { test: 'WBC', result: '14.5 × 10⁹/L (elevated)' },
      { test: 'CRP', result: '85 mg/L (elevated)' },
      { test: 'Urinalysis', result: 'Normal' },
      { test: 'USS Abdomen', result: 'Non-compressible appendix 9mm diameter' },
    ],
    diagnosis: 'Acute Appendicitis',
    management: ['IV fluids and analgesia', 'NBM (nil by mouth)', 'IV Cefuroxime and Metronidazole', 'Urgent laparoscopic appendicectomy', 'If perforation — open surgery and washout', 'Post-op monitoring'],
    differentials: ['Mesenteric adenitis', 'Meckel\'s diverticulum', 'Ovarian cyst/torsion (female)', 'Ectopic pregnancy (female)', 'Crohn\'s disease', 'Right-sided renal colic'],
  },
]

const ANATOMY_SYSTEMS = [
  {
    system: 'Cardiovascular',
    icon: '❤️',
    color: '#dc2626',
    structures: ['Heart (4 chambers)', 'Aorta', 'Pulmonary artery/vein', 'Superior/Inferior vena cava', 'Coronary arteries', 'Sinoatrial node', 'Atrioventricular node'],
    functions: ['Pump blood around the body', 'Deliver oxygen and nutrients', 'Remove waste products', 'Regulate blood pressure'],
    keyFacts: ['Heart beats 60-100 times per minute', 'Cardiac output = HR × Stroke volume', 'Normal BP: 120/80 mmHg', 'SA node is the heart\'s natural pacemaker'],
  },
  {
    system: 'Respiratory',
    icon: '🫁',
    color: '#2563eb',
    structures: ['Trachea', 'Bronchi (left & right)', 'Bronchioles', 'Alveoli', 'Pleura', 'Diaphragm', 'Intercostal muscles'],
    functions: ['Gas exchange (O2 in, CO2 out)', 'Regulation of blood pH', 'Voice production', 'Cough reflex (protection)'],
    keyFacts: ['Normal RR: 12-20 breaths/min', 'Tidal volume: ~500mL', 'Total lung capacity: ~6L', 'Alveoli number ~300 million'],
  },
  {
    system: 'Nervous',
    icon: '🧠',
    color: '#7c3aed',
    structures: ['Brain (cerebrum, cerebellum, brainstem)', 'Spinal cord', 'Peripheral nerves', 'Autonomic nervous system', '12 Cranial nerves', 'Neuromuscular junction'],
    functions: ['Control of body functions', 'Processing sensory information', 'Voluntary movement', 'Memory and cognition'],
    keyFacts: ['Brain weighs ~1.4kg', '86 billion neurons', 'Action potential: -70mV to +40mV', 'CNS = Brain + Spinal cord'],
  },
]

const DRUG_CLASSES = [
  { class: 'Beta Blockers', examples: 'Atenolol, Metoprolol, Propranolol', mechanism: 'Block β-adrenergic receptors → ↓ HR, ↓ BP, ↓ cardiac workload', uses: 'Hypertension, angina, heart failure, arrhythmias', sideEffects: 'Bradycardia, bronchospasm, fatigue, cold extremities', color: '#dc2626' },
  { class: 'ACE Inhibitors', examples: 'Lisinopril, Ramipril, Enalapril', mechanism: 'Inhibit angiotensin-converting enzyme → ↓ angiotensin II → vasodilation', uses: 'Hypertension, heart failure, diabetic nephropathy', sideEffects: 'Dry cough, hyperkalaemia, angioedema', color: '#2563eb' },
  { class: 'Antibiotics — Penicillins', examples: 'Amoxicillin, Flucloxacillin, Co-amoxiclav', mechanism: 'Inhibit bacterial cell wall synthesis (beta-lactam ring)', uses: 'Bacterial infections — respiratory, urinary, skin', sideEffects: 'Allergy/anaphylaxis, diarrhoea, rash', color: '#16a34a' },
  { class: 'NSAIDs', examples: 'Ibuprofen, Diclofenac, Naproxen', mechanism: 'Inhibit COX-1 and COX-2 enzymes → ↓ prostaglandin synthesis', uses: 'Pain, inflammation, fever', sideEffects: 'GI upset, peptic ulcer, renal impairment, increased bleeding risk', color: '#d97706' },
  { class: 'Statins', examples: 'Atorvastatin, Simvastatin, Rosuvastatin', mechanism: 'Inhibit HMG-CoA reductase → ↓ cholesterol synthesis', uses: 'High cholesterol, cardiovascular disease prevention', sideEffects: 'Myopathy, hepatotoxicity, rhabdomyolysis (rare)', color: '#7c3aed' },
]

export default function HealthSciencesHub() {
  const [activeTab, setActiveTab] = useState<'cases' | 'anatomy' | 'drugs' | 'vitals'>('cases')
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [selectedSystem, setSelectedSystem] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<'presenting' | 'vitals' | 'history' | 'exam' | 'investigations' | 'diagnosis'>('presenting')
  const [userDiagnosis, setUserDiagnosis] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)

  // Vitals checker
  const [hrValue, setHrValue] = useState('')
  const [bpSys, setBpSys] = useState('')
  const [bpDia, setBpDia] = useState('')
  const [tempValue, setTempValue] = useState('')
  const [rrValue, setRrValue] = useState('')
  const [o2Value, setO2Value] = useState('')

  const checkVital = (value: number, min: number, max: number) => {
    if (value < min) return { status: 'low', color: '#2563eb', label: 'LOW' }
    if (value > max) return { status: 'high', color: '#dc2626', label: 'HIGH' }
    return { status: 'normal', color: '#16a34a', label: 'NORMAL' }
  }

  const VitalResult = ({ label, value, min, max, unit }: any) => {
    const num = parseFloat(value)
    if (!value || isNaN(num)) return null
    const result = checkVital(num, min, max)
    return (
      <div style={{ background: result.color + '10', border: `1px solid ${result.color}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}: {value} {unit}</span>
          <span style={{ background: result.color, color: 'white', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
            {result.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Normal: {min}–{max} {unit}</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4, marginTop: 12 }}>
            🏥 Health Sciences Hub
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Clinical cases, anatomy, pharmacology and vital signs — for medicine, nursing, pharmacy and allied health
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'cases', label: '🩺 Patient Cases' },
            { key: 'anatomy', label: '🫀 Anatomy' },
            { key: 'drugs', label: '💊 Pharmacology' },
            { key: 'vitals', label: '📊 Vitals Checker' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); setSelectedCase(null); setSelectedSystem(null) }} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? '#1e3a5f' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* PATIENT CASES */}
        {activeTab === 'cases' && (
          <div>
            {!selectedCase ? (
              <div>
                <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '14px 18px', marginBottom: 16, border: '1px solid #bae6fd', fontSize: 13, color: '#0369a1' }}>
                  💡 <strong>How to use:</strong> Read the presenting complaint, examine the vitals and history, then try to form your own diagnosis before revealing the answer.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PATIENT_CASES.map(c => (
                    <div key={c.id} onClick={() => { setSelectedCase(c); setActiveSection('presenting'); setUserDiagnosis(''); setShowAnswer(false) }} style={{
                      background: 'white', borderRadius: 12, padding: '18px 20px',
                      border: `2px solid ${c.color}30`, cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: c.color }}>{c.title}</h3>
                        <span style={{ background: c.color + '15', color: c.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          {c.specialty}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                        {c.presenting.slice(0, 140)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedCase(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                  ← Back to Cases
                </button>

                {/* Case header */}
                <div style={{ background: selectedCase.color, borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
                  <h2 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedCase.title}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '4px 0 0' }}>{selectedCase.specialty}</p>
                </div>

                {/* Section tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                  {[
                    { key: 'presenting', label: '🗣️ Presenting' },
                    { key: 'vitals', label: '📊 Vitals' },
                    { key: 'history', label: '📋 History' },
                    { key: 'exam', label: '🔍 Examination' },
                    { key: 'investigations', label: '🧪 Investigations' },
                    { key: 'diagnosis', label: '✅ Diagnosis' },
                  ].map(s => (
                    <button key={s.key} onClick={() => setActiveSection(s.key as any)} style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none',
                      background: activeSection === s.key ? selectedCase.color : 'white',
                      color: activeSection === s.key ? 'white' : '#6b7280',
                      cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>

                <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  {activeSection === 'presenting' && (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedCase.color, marginBottom: 12 }}>Presenting Complaint</h3>
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{selectedCase.presenting}</p>
                    </div>
                  )}

                  {activeSection === 'vitals' && (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedCase.color, marginBottom: 12 }}>Vital Signs</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                        {Object.entries(selectedCase.vitals).map(([key, val]) => (
                          <div key={key} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>{key}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: selectedCase.color }}>{val as string}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'history' && (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedCase.color, marginBottom: 12 }}>Medical History</h3>
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{selectedCase.history}</p>
                    </div>
                  )}

                  {activeSection === 'exam' && (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedCase.color, marginBottom: 12 }}>Physical Examination</h3>
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{selectedCase.examination}</p>
                    </div>
                  )}

                  {activeSection === 'investigations' && (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedCase.color, marginBottom: 12 }}>Investigations</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedCase.investigations.map((inv: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{inv.test}</span>
                            <span style={{ fontSize: 13, color: selectedCase.color, fontWeight: 600 }}>{inv.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'diagnosis' && (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedCase.color, marginBottom: 12 }}>What is your diagnosis?</h3>
                      <input
                        placeholder="Type your diagnosis here before revealing the answer..."
                        value={userDiagnosis}
                        onChange={e => setUserDiagnosis(e.target.value)}
                        style={{ marginBottom: 12 }}
                      />
                      <button onClick={() => setShowAnswer(!showAnswer)} style={{
                        background: showAnswer ? '#f0fdf4' : selectedCase.color,
                        color: showAnswer ? '#16a34a' : 'white',
                        border: 'none', borderRadius: 8, padding: '10px 20px',
                        cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 16,
                      }}>
                        {showAnswer ? '✅ Answer revealed' : '🔍 Reveal Diagnosis'}
                      </button>

                      {showAnswer && (
                        <div>
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', marginBottom: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>DIAGNOSIS</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#1f2937' }}>{selectedCase.diagnosis}</div>
                          </div>

                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📋 Management:</div>
                            {selectedCase.management.map((m: string, i: number) => (
                              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                                <span style={{ color: selectedCase.color, fontWeight: 700 }}>→</span>
                                <span style={{ fontSize: 13, color: '#374151' }}>{m}</span>
                              </div>
                            ))}
                          </div>

                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔄 Differential Diagnoses:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {selectedCase.differentials.map((d: string) => (
                                <span key={d} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>{d}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANATOMY */}
        {activeTab === 'anatomy' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: selectedSystem ? '200px 1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: selectedSystem ? 'column' : 'contents' as any, gap: 10 }}>
                {ANATOMY_SYSTEMS.map(system => (
                  <div key={system.system} onClick={() => setSelectedSystem(selectedSystem?.system === system.system ? null : system)} style={{
                    background: selectedSystem?.system === system.system ? system.color + '15' : 'white',
                    border: selectedSystem?.system === system.system ? `2px solid ${system.color}` : '2px solid #f3f4f6',
                    borderRadius: 12, padding: '16px', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{system.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: system.color }}>{system.system}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {system.structures.length} structures
                    </div>
                  </div>
                ))}
              </div>

              {selectedSystem && (
                <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 40 }}>{selectedSystem.icon}</span>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: selectedSystem.color, margin: 0 }}>
                      {selectedSystem.system} System
                    </h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Key Structures
                      </h3>
                      {selectedSystem.structures.map((s: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedSystem.color, flexShrink: 0, marginTop: 5 }} />
                          <span style={{ fontSize: 13, color: '#374151' }}>{s}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Functions
                      </h3>
                      {selectedSystem.functions.map((f: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                          <span style={{ color: selectedSystem.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: selectedSystem.color + '10', borderRadius: 10, padding: '14px 16px', border: `1px solid ${selectedSystem.color}30` }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: selectedSystem.color, marginBottom: 8 }}>📊 Key Facts</h3>
                    {selectedSystem.keyFacts.map((fact: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 4, display: 'flex', gap: 8 }}>
                        <span style={{ color: selectedSystem.color, fontWeight: 700 }}>•</span>
                        <span>{fact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHARMACOLOGY */}
        {activeTab === 'drugs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DRUG_CLASSES.map(drug => (
              <div key={drug.class} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ background: drug.color, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: 0 }}>{drug.class}</h3>
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                    {drug.examples.split(', ').length} drugs
                  </span>
                </div>
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {[
                    { label: '💊 Examples', value: drug.examples },
                    { label: '⚙️ Mechanism', value: drug.mechanism },
                    { label: '✅ Uses', value: drug.uses },
                    { label: '⚠️ Side Effects', value: drug.sideEffects },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: drug.color, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VITALS CHECKER */}
        {activeTab === 'vitals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📊 Vital Signs Checker</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Enter a patient's vitals to check if they are normal</p>

              <label>Heart Rate (bpm)</label>
              <input type="number" placeholder="e.g. 88" value={hrValue} onChange={e => setHrValue(e.target.value)} />
              <label>Blood Pressure Systolic (mmHg)</label>
              <input type="number" placeholder="e.g. 120" value={bpSys} onChange={e => setBpSys(e.target.value)} />
              <label>Blood Pressure Diastolic (mmHg)</label>
              <input type="number" placeholder="e.g. 80" value={bpDia} onChange={e => setBpDia(e.target.value)} />
              <label>Temperature (°C)</label>
              <input type="number" placeholder="e.g. 37.2" value={tempValue} onChange={e => setTempValue(e.target.value)} step="0.1" />
              <label>Respiratory Rate (breaths/min)</label>
              <input type="number" placeholder="e.g. 16" value={rrValue} onChange={e => setRrValue(e.target.value)} />
              <label>O2 Saturation (%)</label>
              <input type="number" placeholder="e.g. 98" value={o2Value} onChange={e => setO2Value(e.target.value)} />
            </div>

            <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Results</h3>
              <VitalResult label="Heart Rate" value={hrValue} min={60} max={100} unit="bpm" />
              <VitalResult label="Systolic BP" value={bpSys} min={90} max={140} unit="mmHg" />
              <VitalResult label="Diastolic BP" value={bpDia} min={60} max={90} unit="mmHg" />
              <VitalResult label="Temperature" value={tempValue} min={36.1} max={37.9} unit="°C" />
              <VitalResult label="Respiratory Rate" value={rrValue} min={12} max={20} unit="breaths/min" />
              <VitalResult label="O2 Saturation" value={o2Value} min={95} max={100} unit="%" />

              {/* Normal ranges reference */}
              <div style={{ marginTop: 16, background: '#f0f9ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>📋 Normal Adult Ranges:</div>
                {[
                  { label: 'HR', range: '60–100 bpm' },
                  { label: 'BP', range: '90–140 / 60–90 mmHg' },
                  { label: 'Temp', range: '36.1–37.9°C' },
                  { label: 'RR', range: '12–20 breaths/min' },
                  { label: 'O2 Sat', range: '≥95%' },
                  { label: 'GCS', range: '15 (normal)' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{r.label}</span>
                    <span>{r.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}