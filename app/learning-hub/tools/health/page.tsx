'use client'

import { useState } from 'react'
import Link from 'next/link'

// ===== PATIENT CASES =====
const PATIENT_CASES = [
  {
    id: 1,
    title: 'Case 1: Chest Pain',
    specialty: 'Cardiology',
    color: '#dc2626',
    emoji: '❤️',
    presenting: 'A 55-year-old male presents with crushing chest pain radiating to the left arm, diaphoresis and shortness of breath. Pain started 2 hours ago at rest. He is hypertensive and smokes 20 cigarettes per day.',
    vitals: { BP: '160/95 mmHg', HR: '110 bpm', RR: '22/min', Temp: '37.2°C', O2Sat: '94%' },
    history: 'Hypertension for 10 years, Type 2 diabetes, heavy smoker (20 pack-years). No previous cardiac history.',
    examination: 'Pale, sweaty, distressed. Heart sounds S1 S2 normal. Lungs: mild basal crepitations. Peripheral pulses present.',
    investigations: [
      { test: 'ECG', result: 'ST elevation in leads V1-V4', abnormal: true },
      { test: 'Troponin I', result: '2.8 ng/mL (elevated — normal < 0.04)', abnormal: true },
      { test: 'CXR', result: 'Mild cardiomegaly', abnormal: true },
      { test: 'FBC', result: 'WBC 12.0, Hb 14.2, Platelets 210', abnormal: false },
    ],
    diagnosis: 'ST-Elevation Myocardial Infarction (STEMI) — anterior',
    management: ['Aspirin 300mg stat', 'Clopidogrel 300mg loading dose', 'Morphine 5mg IV for pain', 'GTN spray sublingual', 'Urgent PCI', 'O2 if sat < 94%', 'Continuous cardiac monitoring'],
    differentials: ['NSTEMI', 'Unstable angina', 'Aortic dissection', 'Pulmonary embolism', 'Oesophageal spasm'],
    keyLearning: 'STEMI is a time-critical emergency. Door-to-balloon time should be < 90 minutes. The mnemonic MONA (Morphine, Oxygen, Nitrates, Aspirin) helps remember initial management.',
  },
  {
    id: 2,
    title: 'Case 2: Fever & Headache',
    specialty: 'Infectious Disease',
    color: '#d97706',
    emoji: '🧠',
    presenting: 'A 22-year-old female student presents with severe headache, high fever (39.5°C), neck stiffness and photophobia for 12 hours. A roommate recently had a similar illness.',
    vitals: { BP: '110/70 mmHg', HR: '118 bpm', RR: '20/min', Temp: '39.5°C', O2Sat: '98%' },
    history: 'No significant PMH. Lives in university accommodation. Meningococcal vaccine not given.',
    examination: 'Febrile, ill-appearing. Neck rigidity. Kernig\'s sign positive. Non-blanching petechial rash on trunk.',
    investigations: [
      { test: 'LP — CSF', result: 'Cloudy, WBC 2000 (neutrophils), high protein, low glucose', abnormal: true },
      { test: 'CSF Culture', result: 'Neisseria meningitidis (pending)', abnormal: true },
      { test: 'CT Head', result: 'No space-occupying lesion', abnormal: false },
      { test: 'Blood Culture', result: 'Pending', abnormal: false },
    ],
    diagnosis: 'Bacterial Meningitis — Neisseria meningitidis',
    management: ['IV Ceftriaxone 2g IMMEDIATELY', 'IV Dexamethasone 0.15mg/kg QDS', 'Isolate patient', 'Notify public health', 'Contact tracing + Rifampicin prophylaxis', 'IV fluids + analgesia'],
    differentials: ['Viral meningitis', 'Subarachnoid haemorrhage', 'Cerebral abscess', 'Encephalitis'],
    keyLearning: 'Do NOT delay antibiotics for LP if meningitis is suspected. A non-blanching rash in a febrile patient is meningococcal septicaemia until proven otherwise — treat immediately.',
  },
  {
    id: 3,
    title: 'Case 3: Abdominal Pain',
    specialty: 'Surgery',
    color: '#7c3aed',
    emoji: '🔪',
    presenting: 'A 28-year-old male with severe periumbilical pain migrating to right iliac fossa over 24 hours. Nausea, one vomiting episode, low-grade fever, loss of appetite.',
    vitals: { BP: '118/76 mmHg', HR: '96 bpm', RR: '18/min', Temp: '38.1°C', O2Sat: '99%' },
    history: 'No significant PMH. No previous abdominal surgeries.',
    examination: 'Tenderness at McBurney\'s point. Rovsing\'s sign positive. Rebound tenderness present.',
    investigations: [
      { test: 'WBC', result: '14.5 × 10⁹/L (elevated)', abnormal: true },
      { test: 'CRP', result: '85 mg/L (elevated)', abnormal: true },
      { test: 'USS Abdomen', result: 'Non-compressible appendix 9mm', abnormal: true },
      { test: 'Urinalysis', result: 'Normal', abnormal: false },
    ],
    diagnosis: 'Acute Appendicitis',
    management: ['IV fluids + analgesia', 'NBM (nil by mouth)', 'IV antibiotics (Cefuroxime + Metronidazole)', 'Urgent laparoscopic appendicectomy', 'Post-op monitoring'],
    differentials: ['Mesenteric adenitis', 'Ovarian cyst/torsion', 'Ectopic pregnancy', 'Crohn\'s disease', 'Renal colic'],
    keyLearning: 'The Alvarado score helps predict appendicitis: Migration of pain + Anorexia + Nausea/vomiting + RIF tenderness + Rebound + Elevated temp + Leukocytosis + Left shift. Score ≥7 = likely appendicitis.',
  },
  {
    id: 4,
    title: 'Case 4: Shortness of Breath',
    specialty: 'Respiratory Medicine',
    color: '#2563eb',
    emoji: '🫁',
    presenting: 'A 45-year-old female with progressive shortness of breath over 3 days, productive cough with yellow-green sputum, and fever. She is a non-smoker. Works as a teacher.',
    vitals: { BP: '130/80 mmHg', HR: '102 bpm', RR: '28/min', Temp: '38.8°C', O2Sat: '91%' },
    history: 'Asthma as a child. No current medications. No recent travel. No sick contacts reported.',
    examination: 'Tachypnoeic, using accessory muscles. Dull percussion right lower zone. Reduced breath sounds right base. Increased tactile vocal fremitus.',
    investigations: [
      { test: 'CXR', result: 'Right lower lobe consolidation', abnormal: true },
      { test: 'WBC', result: '18.2 × 10⁹/L (elevated)', abnormal: true },
      { test: 'CRP', result: '220 mg/L (markedly elevated)', abnormal: true },
      { test: 'Sputum Culture', result: 'Streptococcus pneumoniae', abnormal: true },
    ],
    diagnosis: 'Community-Acquired Pneumonia (CAP) — right lower lobe',
    management: ['Supplemental O2 to maintain sat >94%', 'Amoxicillin 500mg TDS + Clarithromycin 500mg BD', 'IV fluids if unable to drink', 'Chest physiotherapy', 'Monitor with CURB-65 score', 'Repeat CXR in 6 weeks'],
    differentials: ['Pulmonary embolism', 'Lung cancer', 'Pulmonary oedema', 'Pleural effusion', 'COVID-19'],
    keyLearning: 'CURB-65 score predicts severity of CAP: Confusion + Urea >7 + RR ≥30 + BP <90/60 + Age ≥65. Score 0-1: home treatment. Score 2: hospital. Score 3+: ICU consideration.',
  },
  {
    id: 5,
    title: 'Case 5: Diabetic Emergency',
    specialty: 'Endocrinology',
    color: '#16a34a',
    emoji: '💉',
    presenting: 'A 19-year-old Type 1 diabetic male brought in by friends. He is drowsy, confused, breathing deeply and rapidly. His breath smells of acetone. He ran out of insulin 3 days ago.',
    vitals: { BP: '95/60 mmHg', HR: '126 bpm', RR: '32/min (Kussmaul)', Temp: '37.8°C', O2Sat: '97%' },
    history: 'Type 1 DM diagnosed at age 12. Usually on insulin glargine + lispro. Ran out of insulin 3 days ago.',
    examination: 'Drowsy, GCS 12/15. Dry mucous membranes. Reduced skin turgor. Deep sighing respirations. Fruity breath.',
    investigations: [
      { test: 'Blood Glucose', result: '32 mmol/L (markedly elevated)', abnormal: true },
      { test: 'Blood Ketones', result: '5.2 mmol/L (severe)', abnormal: true },
      { test: 'pH (ABG)', result: '7.12 (severe acidosis)', abnormal: true },
      { test: 'Potassium', result: '5.8 mmol/L (initially elevated)', abnormal: true },
    ],
    diagnosis: 'Diabetic Ketoacidosis (DKA)',
    management: ['IV fluid resuscitation (0.9% NaCl)', 'Fixed rate insulin infusion (0.1 units/kg/hr)', 'Potassium replacement (K+ will drop with insulin)', 'Monitor glucose hourly', 'Monitor ketones 2-hourly', 'Identify precipitating cause', 'HDU/ICU monitoring'],
    differentials: ['Hyperosmolar hyperglycaemic state (HHS)', 'Hypoglycaemia', 'Sepsis', 'Alcoholic ketoacidosis'],
    keyLearning: 'DKA triad: Hyperglycaemia + Ketosis + Acidosis. Kussmaul breathing is a compensatory mechanism — deep rapid breathing to blow off CO2 and correct acidosis. Potassium drops significantly with insulin treatment — always replace.',
  },
  {
    id: 6,
    title: 'Case 6: Stroke',
    specialty: 'Neurology',
    color: '#be185d',
    emoji: '🧠',
    presenting: 'A 68-year-old hypertensive female brought in by her daughter. Sudden onset right-sided weakness and inability to speak 1 hour ago. No headache. No loss of consciousness.',
    vitals: { BP: '185/100 mmHg', HR: '88 bpm', RR: '18/min', Temp: '37.1°C', O2Sat: '97%' },
    history: 'Hypertension on amlodipine. Atrial fibrillation — not on anticoagulation. Type 2 DM.',
    examination: 'Alert but aphasic. Right facial droop. Right arm power 1/5. Right leg power 2/5. Right plantar extensor (Babinski positive).',
    investigations: [
      { test: 'CT Head (non-contrast)', result: 'No haemorrhage seen — hyperdense MCA sign', abnormal: true },
      { test: 'Blood Glucose', result: '9.2 mmol/L', abnormal: true },
      { test: 'ECG', result: 'Atrial fibrillation', abnormal: true },
      { test: 'INR', result: '1.1 (not anticoagulated)', abnormal: false },
    ],
    diagnosis: 'Ischaemic Stroke — left MCA territory',
    management: ['FAST assessment (Face, Arms, Speech, Time)', 'CT scan urgently to exclude haemorrhage', 'Thrombolysis (tPA) if within 4.5hrs of onset and no contraindications', 'Aspirin 300mg (if haemorrhage excluded)', 'Stroke unit admission', 'Anticoagulation for AF after 2 weeks'],
    differentials: ['Haemorrhagic stroke', 'TIA', 'Todd\'s paresis', 'Hypoglycaemia', 'Brain tumour'],
    keyLearning: 'FAST: Face drooping + Arm weakness + Speech difficulty + Time to call emergency. Time is brain — 1.9 million neurons die every minute in a stroke. The goal is rapid thrombolysis or thrombectomy.',
  },
]

// ===== PERIODIC TABLE =====
const PERIODIC_ELEMENTS = [
  { symbol: 'H', name: 'Hydrogen', number: 1, mass: '1.008', group: 'Nonmetal', color: '#ef4444', medUse: 'Water (H₂O) — essential for all biological processes' },
  { symbol: 'C', name: 'Carbon', number: 6, mass: '12.011', group: 'Nonmetal', color: '#374151', medUse: 'Backbone of all organic molecules — proteins, DNA, lipids' },
  { symbol: 'N', name: 'Nitrogen', number: 7, mass: '14.007', group: 'Nonmetal', color: '#2563eb', medUse: 'Essential in amino acids, DNA and haemoglobin' },
  { symbol: 'O', name: 'Oxygen', number: 8, mass: '15.999', group: 'Nonmetal', color: '#dc2626', medUse: 'Cellular respiration — ATP production in mitochondria' },
  { symbol: 'Na', name: 'Sodium', number: 11, mass: '22.990', group: 'Alkali Metal', color: '#d97706', medUse: 'Nerve impulses, fluid balance. Hyponatraemia → seizures' },
  { symbol: 'Mg', name: 'Magnesium', number: 12, mass: '24.305', group: 'Alkaline Earth', color: '#16a34a', medUse: 'Enzyme cofactor. Used IV in eclampsia and arrhythmias' },
  { symbol: 'P', name: 'Phosphorus', number: 15, mass: '30.974', group: 'Nonmetal', color: '#7c3aed', medUse: 'ATP (energy), DNA backbone, bone mineralisation' },
  { symbol: 'S', name: 'Sulfur', number: 16, mass: '32.06', group: 'Nonmetal', color: '#eab308', medUse: 'Amino acids (cysteine, methionine), insulin structure' },
  { symbol: 'Cl', name: 'Chlorine', number: 17, mass: '35.45', group: 'Halogen', color: '#0891b2', medUse: 'Hydrochloric acid in stomach, fluid balance' },
  { symbol: 'K', name: 'Potassium', number: 19, mass: '39.098', group: 'Alkali Metal', color: '#d97706', medUse: 'Cardiac rhythm, muscle contraction. Low K+ → arrhythmias' },
  { symbol: 'Ca', name: 'Calcium', number: 20, mass: '40.078', group: 'Alkaline Earth', color: '#16a34a', medUse: 'Bone/teeth, muscle contraction, blood clotting, nerve signals' },
  { symbol: 'Fe', name: 'Iron', number: 26, mass: '55.845', group: 'Transition Metal', color: '#b45309', medUse: 'Haemoglobin (O2 transport). Deficiency → anaemia' },
  { symbol: 'Cu', name: 'Copper', number: 29, mass: '63.546', group: 'Transition Metal', color: '#92400e', medUse: 'Enzyme cofactor. Wilson\'s disease = copper accumulation' },
  { symbol: 'Zn', name: 'Zinc', number: 30, mass: '65.38', group: 'Transition Metal', color: '#6b7280', medUse: 'Immune function, wound healing, insulin storage' },
  { symbol: 'I', name: 'Iodine', number: 53, mass: '126.90', group: 'Halogen', color: '#7c3aed', medUse: 'Thyroid hormones (T3/T4). Deficiency → goitre, hypothyroidism' },
]

// ===== ANATOMY SYSTEMS =====
const ANATOMY_SYSTEMS = [
  {
    system: 'Cardiovascular',
    icon: '❤️',
    color: '#dc2626',
    structures: ['Heart (4 chambers)', 'Aorta', 'Pulmonary artery/vein', 'Superior/Inferior vena cava', 'Coronary arteries', 'Sinoatrial (SA) node', 'Atrioventricular (AV) node', 'Bundle of His'],
    functions: ['Pump blood around the body', 'Deliver O2 and nutrients to tissues', 'Remove waste products (CO2, urea)', 'Regulate blood pressure and temperature'],
    keyFacts: ['Heart beats 60-100 bpm at rest', 'Cardiac output = HR × Stroke volume (normally ~5L/min)', 'Normal BP: 120/80 mmHg', 'SA node is the natural pacemaker (60-100 bpm)', 'Left ventricle wall is thicker — pumps to systemic circulation'],
    clinicalPearl: 'The heart has its own blood supply via coronary arteries. Blockage = MI. Left anterior descending (LAD) = "widow maker" — supplies most of left ventricle.',
  },
  {
    system: 'Respiratory',
    icon: '🫁',
    color: '#2563eb',
    structures: ['Nasal cavity', 'Pharynx', 'Larynx', 'Trachea', 'Bronchi (left & right)', 'Bronchioles', 'Alveoli', 'Pleura', 'Diaphragm'],
    functions: ['Gas exchange (O2 in, CO2 out)', 'Regulation of blood pH', 'Voice production', 'Protection via cough and mucociliary escalator'],
    keyFacts: ['Normal RR: 12-20 breaths/min', 'Tidal volume: ~500mL per breath', 'Total lung capacity: ~6L', '~300 million alveoli in each lung', 'Respiratory centre: Medulla oblongata'],
    clinicalPearl: 'Pulse oximetry measures O2 saturation. Normal >95%. In COPD patients, high O2 can suppress their hypoxic drive — be careful giving O2.',
  },
  {
    system: 'Nervous',
    icon: '🧠',
    color: '#7c3aed',
    structures: ['Cerebrum (4 lobes)', 'Cerebellum', 'Brainstem (midbrain, pons, medulla)', 'Spinal cord', '12 Cranial nerves', 'Peripheral nerves', 'Autonomic NS (sympathetic/parasympathetic)'],
    functions: ['Control of voluntary movement', 'Processing sensory information', 'Memory, cognition, emotion', 'Control of autonomic functions (HR, BP, digestion)'],
    keyFacts: ['Brain weighs ~1.4kg', '86 billion neurons', 'Resting membrane potential: -70mV', 'Blood-brain barrier protects CNS', 'GCS: Eyes(4) + Verbal(5) + Motor(6) = 15 max'],
    clinicalPearl: 'The 12 cranial nerves: "On Old Olympus Towering Top A Finn And German Viewed Some Hops" (Olfactory, Optic, Oculomotor, Trochlear, Trigeminal, Abducens, Facial, Auditory, Glossopharyngeal, Vagus, Spinal Accessory, Hypoglossal).',
  },
  {
    system: 'Renal',
    icon: '🫘',
    color: '#16a34a',
    structures: ['Kidneys (x2)', 'Renal cortex + medulla', 'Nephron (1 million per kidney)', 'Glomerulus', 'Bowman\'s capsule', 'Loop of Henle', 'Ureters', 'Bladder', 'Urethra'],
    functions: ['Filter blood (180L/day)', 'Produce urine (~1.5L/day)', 'Regulate blood pressure (RAAS)', 'Control fluid and electrolyte balance', 'Produce erythropoietin (EPO) and active Vitamin D'],
    keyFacts: ['GFR normal: >90 mL/min/1.73m²', 'Creatinine: normal 60-120 µmol/L', 'Each kidney has ~1 million nephrons', 'Blood filtered 400x per day', 'Renin → Angiotensin → Aldosterone axis controls BP'],
    clinicalPearl: 'ACE inhibitors are renoprotective in diabetic nephropathy but can cause hyperkalaemia and acute kidney injury in dehydration or bilateral renal artery stenosis.',
  },
  {
    system: 'Endocrine',
    icon: '⚗️',
    color: '#d97706',
    structures: ['Hypothalamus', 'Pituitary gland (anterior + posterior)', 'Thyroid gland', 'Parathyroid glands (x4)', 'Adrenal glands', 'Pancreas (islets of Langerhans)', 'Gonads (testes/ovaries)'],
    functions: ['Hormone production and regulation', 'Control of metabolism', 'Growth and development', 'Reproduction', 'Stress response (cortisol, adrenaline)'],
    keyFacts: ['Hypothalamus is the master controller', 'Pituitary = "master gland" — controls other glands', 'Insulin lowers glucose; Glucagon raises it', 'T3/T4 regulate metabolism', 'Cortisol = stress hormone from adrenal cortex'],
    clinicalPearl: 'The HPA axis: Hypothalamus (CRH) → Pituitary (ACTH) → Adrenal cortex (Cortisol). Long-term steroid use suppresses this axis — never stop steroids suddenly (Addisonian crisis risk).',
  },
]

// ===== DRUG CLASSES =====
const DRUG_CLASSES = [
  { class: 'Beta Blockers (-olol)', examples: 'Atenolol, Metoprolol, Propranolol, Carvedilol', mechanism: 'Block β1/β2-adrenergic receptors → ↓ HR, ↓ contractility, ↓ BP, ↓ cardiac workload', uses: 'Hypertension, angina, heart failure, arrhythmias, post-MI, anxiety', sideEffects: 'Bradycardia, bronchospasm (avoid in asthma), fatigue, cold extremities, masking hypoglycaemia', color: '#dc2626', mnemonic: 'B Blockers = Bradycardia + Bronchospasm' },
  { class: 'ACE Inhibitors (-pril)', examples: 'Lisinopril, Ramipril, Enalapril, Perindopril', mechanism: 'Inhibit ACE → ↓ angiotensin II → vasodilation + ↓ aldosterone → ↓ BP', uses: 'Hypertension, heart failure, post-MI, diabetic nephropathy, CKD proteinuria', sideEffects: 'Dry cough (bradykinin accumulation), hyperkalaemia, angioedema (rare but dangerous), renal impairment', color: '#2563eb', mnemonic: 'ACE = Angioedema + Cough + Elevated K+' },
  { class: 'Antibiotics — Penicillins', examples: 'Amoxicillin, Flucloxacillin, Piperacillin, Co-amoxiclav', mechanism: 'Beta-lactam ring inhibits bacterial cell wall synthesis (transpeptidase inhibition)', uses: 'Respiratory, urinary, skin infections; endocarditis prophylaxis', sideEffects: 'Allergy/anaphylaxis, diarrhoea, rash, C. difficile colitis', color: '#16a34a', mnemonic: 'Penicillins = Prevent cell wall synthesis' },
  { class: 'NSAIDs', examples: 'Ibuprofen, Diclofenac, Naproxen, Indomethacin, Ketorolac', mechanism: 'Inhibit COX-1 and COX-2 → ↓ prostaglandin synthesis → ↓ inflammation, pain, fever', uses: 'Pain, inflammation, fever, dysmenorrhoea, gout', sideEffects: 'GI ulceration (inhibit protective PG), renal impairment, fluid retention, increased CVD risk, bronchospasm', color: '#d97706', mnemonic: 'NSAIDs: Never in renal failure, Stomach ulcers, Asthmatics, Increases CV risk, Diuretics interact' },
  { class: 'Statins (-statin)', examples: 'Atorvastatin, Simvastatin, Rosuvastatin, Pravastatin', mechanism: 'Inhibit HMG-CoA reductase → ↓ cholesterol synthesis in liver → ↑ LDL receptors', uses: 'Hypercholesterolaemia, CVD prevention (primary + secondary), post-MI', sideEffects: 'Myopathy (muscle pain), rhabdomyolysis (rare), hepatotoxicity, diabetes risk', color: '#7c3aed', mnemonic: 'Statins = Stop cholesterol synthesis' },
  { class: 'Opioids', examples: 'Morphine, Codeine, Tramadol, Fentanyl, Oxycodone', mechanism: 'Bind μ (mu), κ (kappa), δ (delta) opioid receptors in CNS → ↓ pain transmission + sedation', uses: 'Severe pain, palliative care, acute MI pain, cough suppression (codeine)', sideEffects: 'Respiratory depression (life-threatening), constipation, nausea, sedation, dependence, tolerance', color: '#be185d', mnemonic: 'OPIOIDS: Over-sedation, Pinpoint pupils, Impaired breathing, Opioid antagonist (Naloxone), Itching, Dependence, Slow gut' },
  { class: 'Diuretics', examples: 'Furosemide (loop), Spironolactone (K-sparing), Bendroflumethiazide (thiazide)', mechanism: 'Furosemide: Inhibit Na/K/2Cl transporter in loop of Henle → massive diuresis', uses: 'Heart failure, hypertension, oedema, hypercalcaemia (furosemide)', sideEffects: 'Hypokalaemia (loop + thiazide), hyperkalaemia (K-sparing), dehydration, hyponatraemia', color: '#0891b2', mnemonic: 'Loop diuretics: Lose K+. K-sparing: Keep K+' },
  { class: 'Anticoagulants', examples: 'Warfarin, Heparin (IV/SC), Rivaroxaban, Apixaban, Dabigatran', mechanism: 'Warfarin: Inhibit Vitamin K → ↓ factors II,VII,IX,X. Heparin: Activate antithrombin III', uses: 'DVT/PE treatment + prevention, AF (stroke prevention), mechanical heart valves', sideEffects: 'Bleeding (major risk), warfarin interactions (many drugs + foods), heparin-induced thrombocytopenia (HIT)', color: '#b45309', mnemonic: 'Warfarin: Watch INR. Heparin: Hospital only. NOACs: New oral anticoagulants — no monitoring needed' },
]

// ===== CLINICAL SKILLS =====
const CLINICAL_SKILLS = [
  {
    skill: 'ABCDE Assessment',
    icon: '🚨',
    color: '#dc2626',
    description: 'Systematic approach to any acutely unwell patient',
    steps: [
      { letter: 'A', title: 'Airway', action: 'Is the airway patent? Look for obstruction, stridor, gurgling', intervention: 'Head-tilt chin-lift, jaw thrust, suction, airway adjunct (NPA/OPA), intubation' },
      { letter: 'B', title: 'Breathing', action: 'RR, O2 saturation, chest expansion, percussion, auscultation', intervention: 'O2 therapy, nebulisers, chest drain, positive pressure ventilation' },
      { letter: 'C', title: 'Circulation', action: 'HR, BP, capillary refill time (<2s), skin colour/temperature', intervention: 'IV access × 2, fluid resuscitation, blood transfusion, vasopressors' },
      { letter: 'D', title: 'Disability', action: 'GCS, pupils (size, reaction), blood glucose, temperature', intervention: 'Glucose if hypoglycaemic, treat seizures, CT head if indicated' },
      { letter: 'E', title: 'Exposure', action: 'Expose patient fully, look for rashes, wounds, swelling', intervention: 'Treat injuries, prevent hypothermia, get full history' },
    ],
  },
  {
    skill: 'SBAR Communication',
    icon: '💬',
    color: '#2563eb',
    description: 'Structured handover and referral communication tool',
    steps: [
      { letter: 'S', title: 'Situation', action: 'Who are you? Who is the patient? What is happening NOW?', intervention: '"I\'m Dr Adaeze calling about Mrs Obi in ward 3B — she has acute shortness of breath"' },
      { letter: 'B', title: 'Background', action: 'Relevant past medical history, reason for admission, medications', intervention: '"She\'s a 65yr old admitted 2 days ago for pneumonia, on IV antibiotics"' },
      { letter: 'A', title: 'Assessment', action: 'What do you think is happening? Your clinical impression', intervention: '"I think she may be developing sepsis or pulmonary embolism"' },
      { letter: 'R', title: 'Recommendation', action: 'What do you want? Be specific.', intervention: '"I\'d like you to review her urgently and consider CT pulmonary angiography"' },
    ],
  },
  {
    skill: 'History Taking (SOCRATES)',
    icon: '📋',
    color: '#16a34a',
    description: 'Systematic pain history taking framework',
    steps: [
      { letter: 'S', title: 'Site', action: 'Where is the pain? Can you point to it?', intervention: 'Chest, abdomen, back, radiating?' },
      { letter: 'O', title: 'Onset', action: 'When did it start? Sudden or gradual?', intervention: 'Sudden onset chest pain → dissection/MI/PE' },
      { letter: 'C', title: 'Character', action: 'What does it feel like? Sharp, dull, crushing, burning?', intervention: 'Crushing = MI, Tearing = dissection, Burning = GORD' },
      { letter: 'R', title: 'Radiation', action: 'Does it spread anywhere?', intervention: 'Left arm/jaw = MI, Back = dissection/pancreatitis' },
      { letter: 'A', title: 'Associations', action: 'Any other symptoms? Nausea, sweating, SOB?', intervention: 'Associated symptoms help narrow diagnosis' },
      { letter: 'T', title: 'Time course', action: 'Constant or intermittent? Getting better or worse?', intervention: 'Duration and pattern matters' },
      { letter: 'E', title: 'Exacerbating/Relieving', action: 'What makes it better or worse?', intervention: 'GTN relieves angina, food worsens pancreatitis' },
      { letter: 'S', title: 'Severity', action: 'Score 0-10. How bad is it?', intervention: 'Guides analgesia and urgency' },
    ],
  },
]

export default function HealthSciencesHub() {
  const [activeTab, setActiveTab] = useState<'cases' | 'anatomy' | 'drugs' | 'vitals' | 'periodic' | 'skills'>('cases')
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [selectedSystem, setSelectedSystem] = useState<any>(null)
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [selectedSkill, setSelectedSkill] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<'presenting' | 'vitals' | 'history' | 'exam' | 'investigations' | 'diagnosis'>('presenting')
  const [userDiagnosis, setUserDiagnosis] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedDrug, setSelectedDrug] = useState<any>(null)

  // Vitals checker
  const [hrValue, setHrValue] = useState('')
  const [bpSys, setBpSys] = useState('')
  const [bpDia, setBpDia] = useState('')
  const [tempValue, setTempValue] = useState('')
  const [rrValue, setRrValue] = useState('')
  const [o2Value, setO2Value] = useState('')
  const [gcsValue, setGcsValue] = useState('')

  const checkVital = (value: number, min: number, max: number) => {
    if (value < min) return { status: 'low', color: '#2563eb', label: 'LOW ↓', bg: '#eff6ff' }
    if (value > max) return { status: 'high', color: '#dc2626', label: 'HIGH ↑', bg: '#fef2f2' }
    return { status: 'normal', color: '#16a34a', label: 'NORMAL ✓', bg: '#f0fdf4' }
  }

  const VitalResult = ({ label, value, min, max, unit, advice }: any) => {
    const num = parseFloat(value)
    if (!value || isNaN(num)) return null
    const result = checkVital(num, min, max)
    return (
      <div style={{ background: result.bg, border: `1px solid ${result.color}30`, borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{label}</span>
          <span style={{ background: result.color, color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            {result.label}
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: result.color, marginBottom: 4 }}>
          {value} {unit}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>Normal range: {min}–{max} {unit}</div>
        {result.status !== 'normal' && advice && (
          <div style={{ fontSize: 12, color: result.color, marginTop: 6, fontWeight: 500 }}>
            ⚠️ {advice}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4, marginTop: 12 }}>
            🏥 Health Sciences Hub
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Clinical cases, anatomy, pharmacology, periodic table, vital signs and clinical skills
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'cases', label: '🩺 Patient Cases' },
            { key: 'anatomy', label: '🫀 Anatomy' },
            { key: 'drugs', label: '💊 Pharmacology' },
            { key: 'periodic', label: '⚗️ Elements' },
            { key: 'skills', label: '🚨 Clinical Skills' },
            { key: 'vitals', label: '📊 Vitals Checker' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); setSelectedCase(null); setSelectedSystem(null); setSelectedSkill(null) }} style={{
              flex: 1, padding: '10px 6px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? '#1e3a5f' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
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
                  💡 <strong>How to use:</strong> Read the presenting complaint, examine the vitals and history, form your own diagnosis before revealing the answer. Try to identify differentials too.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {PATIENT_CASES.map(c => (
                    <div key={c.id} onClick={() => { setSelectedCase(c); setActiveSection('presenting'); setUserDiagnosis(''); setShowAnswer(false) }} style={{
                      background: 'white', borderRadius: 14, overflow: 'hidden',
                      border: `1px solid ${c.color}20`, cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${c.color}20` }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                      <div style={{ background: c.color, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 20 }}>{c.emoji}</div>
                          <div style={{ color: 'white', fontWeight: 800, fontSize: 14, marginTop: 4 }}>{c.title}</div>
                        </div>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          {c.specialty}
                        </span>
                      </div>
                      <div style={{ padding: '12px 18px' }}>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                          {c.presenting.slice(0, 120)}...
                        </p>
                        <div style={{ marginTop: 10, fontSize: 12, color: c.color, fontWeight: 600 }}>
                          Click to open case →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedCase(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                  ← Back to Cases
                </button>

                <div style={{ background: selectedCase.color, borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedCase.title}</h2>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '4px 0 0' }}>{selectedCase.specialty}</p>
                    </div>
                    <span style={{ fontSize: 36 }}>{selectedCase.emoji}</span>
                  </div>
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
                      padding: '7px 14px', borderRadius: 8, border: 'none',
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                        {Object.entries(selectedCase.vitals).map(([key, val]) => (
                          <div key={key} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>{key}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: selectedCase.color }}>{val as string}</div>
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
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', background: inv.abnormal ? '#fef2f2' : '#f0fdf4',
                            borderRadius: 8, border: `1px solid ${inv.abnormal ? '#fecaca' : '#bbf7d0'}`,
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{inv.test}</span>
                            <span style={{ fontSize: 13, color: inv.abnormal ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{inv.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeSection === 'diagnosis' && (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedCase.color, marginBottom: 12 }}>What is your diagnosis?</h3>
                      <input placeholder="Type your diagnosis before revealing the answer..." value={userDiagnosis} onChange={e => setUserDiagnosis(e.target.value)} style={{ marginBottom: 12 }} />
                      <button onClick={() => setShowAnswer(!showAnswer)} style={{
                        background: showAnswer ? '#f0fdf4' : selectedCase.color, color: showAnswer ? '#16a34a' : 'white',
                        border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 16,
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
                              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 13, color: '#374151' }}>
                                <span style={{ color: selectedCase.color, fontWeight: 700 }}>→</span><span>{m}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔄 Differential Diagnoses:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {selectedCase.differentials.map((d: string) => (
                                <span key={d} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>{d}</span>
                              ))}
                            </div>
                          </div>

                          <div style={{ background: selectedCase.color + '10', border: `1px solid ${selectedCase.color}30`, borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: selectedCase.color, marginBottom: 6 }}>🔑 KEY LEARNING POINT</div>
                            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{selectedCase.keyLearning}</p>
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
            {!selectedSystem ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {ANATOMY_SYSTEMS.map(system => (
                  <div key={system.system} onClick={() => setSelectedSystem(system)} style={{
                    background: 'white', borderRadius: 14, padding: '20px',
                    border: `2px solid ${system.color}20`, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.15s', textAlign: 'center',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.border = `2px solid ${system.color}`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.border = `2px solid ${system.color}20`; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 10 }}>{system.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: system.color }}>{system.system}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{system.structures.length} structures</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedSystem(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                  ← Back
                </button>
                <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <span style={{ fontSize: 48 }}>{selectedSystem.icon}</span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: selectedSystem.color, margin: 0 }}>{selectedSystem.system} System</h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Key Structures</h3>
                      {selectedSystem.structures.map((s: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedSystem.color, flexShrink: 0, marginTop: 5 }} />{s}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Functions</h3>
                      {selectedSystem.functions.map((f: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                          <span style={{ color: selectedSystem.color, fontWeight: 700 }}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: selectedSystem.color + '10', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: `1px solid ${selectedSystem.color}30` }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: selectedSystem.color, marginBottom: 10 }}>📊 Key Facts</h3>
                    {selectedSystem.keyFacts.map((fact: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 5, display: 'flex', gap: 8 }}>
                        <span style={{ color: selectedSystem.color, fontWeight: 700 }}>•</span><span>{fact}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fffbeb', borderRadius: 10, padding: '14px 16px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>⭐ CLINICAL PEARL</div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{selectedSystem.clinicalPearl}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHARMACOLOGY */}
        {activeTab === 'drugs' && (
          <div>
            {!selectedDrug ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {DRUG_CLASSES.map(drug => (
                  <div key={drug.class} onClick={() => setSelectedDrug(drug)} style={{
                    background: 'white', borderRadius: 14, overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ background: drug.color, padding: '14px 18px' }}>
                      <h3 style={{ color: 'white', fontSize: 14, fontWeight: 800, margin: 0 }}>{drug.class}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '4px 0 0' }}>{drug.examples.split(',')[0]}...</p>
                    </div>
                    <div style={{ padding: '12px 18px' }}>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{drug.mechanism.slice(0, 80)}...</p>
                      <div style={{ marginTop: 8, fontSize: 11, color: drug.color, fontWeight: 600 }}>Click to learn more →</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedDrug(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                  ← Back to Drug Classes
                </button>
                <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ background: selectedDrug.color, padding: '20px 24px' }}>
                    <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>{selectedDrug.class}</h2>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    {[
                      { label: '💊 Examples', value: selectedDrug.examples },
                      { label: '⚙️ Mechanism', value: selectedDrug.mechanism },
                      { label: '✅ Uses', value: selectedDrug.uses },
                      { label: '⚠️ Side Effects', value: selectedDrug.sideEffects },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: 16, padding: '14px 16px', background: '#f9fafb', borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: selectedDrug.color, marginBottom: 6 }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{item.value}</div>
                      </div>
                    ))}
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>🧠 MNEMONIC</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{selectedDrug.mnemonic}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PERIODIC TABLE — Medical Elements */}
        {activeTab === 'periodic' && (
          <div>
            <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 12, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: '#0891b2' }}>
              ⚗️ <strong>Medical Chemistry:</strong> These are the most important elements in human biology and medicine. Understanding their roles helps you understand disease and treatment.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedElement ? '1fr 1fr' : 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, alignContent: 'start' }}>
                {PERIODIC_ELEMENTS.map(el => (
                  <div key={el.symbol} onClick={() => setSelectedElement(selectedElement?.symbol === el.symbol ? null : el)} style={{
                    background: selectedElement?.symbol === el.symbol ? el.color : 'white',
                    border: `2px solid ${el.color}`,
                    borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 10, color: selectedElement?.symbol === el.symbol ? 'rgba(255,255,255,0.7)' : '#9ca3af', fontWeight: 600 }}>{el.number}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: selectedElement?.symbol === el.symbol ? 'white' : el.color, lineHeight: 1 }}>{el.symbol}</div>
                    <div style={{ fontSize: 10, color: selectedElement?.symbol === el.symbol ? 'rgba(255,255,255,0.8)' : '#6b7280', marginTop: 3 }}>{el.name}</div>
                    <div style={{ fontSize: 9, color: selectedElement?.symbol === el.symbol ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}>{el.mass}</div>
                  </div>
                ))}
              </div>

              {selectedElement && (
                <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', alignSelf: 'start', position: 'sticky', top: 80 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: 14,
                      background: selectedElement.color, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{selectedElement.number}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>{selectedElement.symbol}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>{selectedElement.mass}</div>
                    </div>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', margin: 0 }}>{selectedElement.name}</h2>
                      <div style={{ fontSize: 13, color: selectedElement.color, fontWeight: 600, marginTop: 4 }}>{selectedElement.group}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Atomic number: {selectedElement.number} | Mass: {selectedElement.mass}</div>
                    </div>
                  </div>

                  <div style={{ background: selectedElement.color + '10', border: `1px solid ${selectedElement.color}30`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedElement.color, marginBottom: 8 }}>🏥 MEDICAL/BIOLOGICAL ROLE</div>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{selectedElement.medUse}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLINICAL SKILLS */}
        {activeTab === 'skills' && (
          <div>
            {!selectedSkill ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {CLINICAL_SKILLS.map(skill => (
                  <div key={skill.skill} onClick={() => setSelectedSkill(skill)} style={{
                    background: 'white', borderRadius: 14, padding: '20px',
                    border: `2px solid ${skill.color}20`, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.border = `2px solid ${skill.color}`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.border = `2px solid ${skill.color}20`; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{skill.icon}</div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: skill.color, marginBottom: 6 }}>{skill.skill}</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>{skill.description}</p>
                    <div style={{ fontSize: 12, color: skill.color, fontWeight: 600 }}>{skill.steps.length} steps → Click to learn</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedSkill(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                  ← Back to Skills
                </button>
                <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                    <span style={{ fontSize: 40 }}>{selectedSkill.icon}</span>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: selectedSkill.color, margin: 0 }}>{selectedSkill.skill}</h2>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{selectedSkill.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                    {selectedSkill.steps.map((step: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 18px', background: selectedSkill.color + '08', borderRadius: 12, border: `1px solid ${selectedSkill.color}20` }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: selectedSkill.color, color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: 18, flexShrink: 0,
                        }}>
                          {step.letter}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: selectedSkill.color, marginBottom: 4 }}>{step.title}</div>
                          <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>{step.action}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', background: 'white', padding: '6px 10px', borderRadius: 6 }}>
                            💡 {step.intervention}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VITALS CHECKER */}
        {activeTab === 'vitals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📊 Vital Signs Checker</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Enter patient vitals to assess if they are normal</p>

              <label>Heart Rate (bpm)</label>
              <input type="number" placeholder="e.g. 88" value={hrValue} onChange={e => setHrValue(e.target.value)} />
              <label>Systolic BP (mmHg)</label>
              <input type="number" placeholder="e.g. 120" value={bpSys} onChange={e => setBpSys(e.target.value)} />
              <label>Diastolic BP (mmHg)</label>
              <input type="number" placeholder="e.g. 80" value={bpDia} onChange={e => setBpDia(e.target.value)} />
              <label>Temperature (°C)</label>
              <input type="number" placeholder="e.g. 37.2" value={tempValue} onChange={e => setTempValue(e.target.value)} step="0.1" />
              <label>Respiratory Rate (breaths/min)</label>
              <input type="number" placeholder="e.g. 16" value={rrValue} onChange={e => setRrValue(e.target.value)} />
              <label>O2 Saturation (%)</label>
              <input type="number" placeholder="e.g. 98" value={o2Value} onChange={e => setO2Value(e.target.value)} />
              <label>GCS Score (3-15)</label>
              <input type="number" placeholder="e.g. 15" value={gcsValue} onChange={e => setGcsValue(e.target.value)} min="3" max="15" />
            </div>

            <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Results</h3>

              <VitalResult label="Heart Rate" value={hrValue} min={60} max={100} unit="bpm" advice="Tachycardia (>100) or bradycardia (<60) — assess clinically" />
              <VitalResult label="Systolic BP" value={bpSys} min={90} max={140} unit="mmHg" advice="Consider hypertensive urgency if >180 or shock if <90" />
              <VitalResult label="Diastolic BP" value={bpDia} min={60} max={90} unit="mmHg" advice="Diastolic >90 = hypertension. <60 = hypotension" />
              <VitalResult label="Temperature" value={tempValue} min={36.1} max={37.9} unit="°C" advice="Fever >38°C = infection likely. Hypothermia <35°C is dangerous" />
              <VitalResult label="Respiratory Rate" value={rrValue} min={12} max={20} unit="breaths/min" advice="Tachypnoea >20 is an early sign of deterioration — take seriously" />
              <VitalResult label="O2 Saturation" value={o2Value} min={95} max={100} unit="%" advice="<94% requires O2 supplementation. <90% is a medical emergency" />
              <VitalResult label="GCS Score" value={gcsValue} min={15} max={15} unit="/15" advice="GCS <8 = intubate (airway at risk). GCS <14 = significant concern" />

              <div style={{ marginTop: 16, background: '#f0f9ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>📋 Normal Adult Ranges:</div>
                {[
                  { label: 'HR', range: '60–100 bpm' },
                  { label: 'BP', range: '90–140 / 60–90 mmHg' },
                  { label: 'Temperature', range: '36.1–37.9°C' },
                  { label: 'RR', range: '12–20 breaths/min' },
                  { label: 'O2 Sat', range: '≥95% (>94% in COPD)' },
                  { label: 'GCS', range: '15 = fully conscious' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{r.label}</span><span>{r.range}</span>
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