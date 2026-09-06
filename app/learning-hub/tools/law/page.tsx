'use client'

import { useState } from 'react'
import Link from 'next/link'

const CASE_LAW = [
  {
    id: 'donoghue',
    title: 'Donoghue v Stevenson [1932]',
    court: 'House of Lords (UK)',
    area: 'Tort Law — Negligence',
    facts: 'Mrs Donoghue consumed ginger beer from an opaque bottle in a café. A decomposed snail was found in the bottle. She suffered gastroenteritis and shock. She sued the manufacturer, Stevenson, as she had no contract with him (her friend bought the drink).',
    issue: 'Does a manufacturer owe a duty of care to the ultimate consumer of their product even without a contractual relationship?',
    held: 'YES. The House of Lords held that Stevenson owed a duty of care to Mrs Donoghue. Lord Atkin established the "neighbour principle" — you must take reasonable care to avoid acts or omissions that you can reasonably foresee would be likely to injure your neighbour.',
    ratio: 'The "neighbour principle" — a person owes a duty of care to those they can reasonably foresee would be affected by their acts or omissions.',
    significance: 'This case established the modern law of negligence and the concept of "duty of care" in tort law.',
    color: '#7c3aed',
  },
  {
    id: 'carlill',
    title: 'Carlill v Carbolic Smoke Ball Co [1893]',
    court: 'Court of Appeal (UK)',
    area: 'Contract Law — Offer & Acceptance',
    facts: 'The Carbolic Smoke Ball Company advertised their product claiming it would prevent influenza. They promised to pay £100 to anyone who contracted influenza after using the ball as directed. Mrs Carlill used the ball and still got influenza. She claimed the £100.',
    issue: 'Was the advertisement a valid offer capable of acceptance? Was there a binding contract?',
    held: 'YES. The court held there was a binding contract. The advertisement was a unilateral offer to the world at large. Mrs Carlill accepted by performing the conditions — using the ball as directed. The deposit of £1,000 in the bank showed intention to be bound.',
    ratio: 'A unilateral offer made to the world can be accepted by anyone who performs the required conditions. Performance of conditions constitutes acceptance.',
    significance: 'Establishes the concept of unilateral contracts and that advertisements can constitute binding offers.',
    color: '#2563eb',
  },
  {
    id: 'r_v_brown',
    title: 'R v Brown [1993]',
    court: 'House of Lords (UK)',
    area: 'Criminal Law — Consent',
    facts: 'A group of homosexual men engaged in consensual sado-masochistic activities that caused actual bodily harm. None of the participants complained to police. The activities were consensual but caused harm.',
    issue: 'Can consent be a valid defence to charges of assault causing actual bodily harm?',
    held: 'NO (3:2 majority). The House of Lords held that consent is not a valid defence to charges of assault causing actual or grievous bodily harm for the purposes of pleasure. Public policy considerations override personal autonomy.',
    ratio: 'Consent is not a defence to assault causing actual bodily harm where the harm is inflicted for pleasure, as opposed to legitimate purposes such as surgery or sport.',
    significance: 'Important case on the limits of consent in criminal law and the tension between personal autonomy and public policy.',
    color: '#dc2626',
  },
  {
    id: 'fisher',
    title: 'Fisher v Bell [1961]',
    court: 'Queen\'s Bench Division',
    area: 'Contract Law — Invitation to Treat',
    facts: 'A shopkeeper displayed a flick knife in his shop window with a price tag. He was charged with "offering for sale" an offensive weapon contrary to the Restriction of Offensive Weapons Act 1959.',
    issue: 'Does displaying goods in a shop window with a price constitute an "offer for sale"?',
    held: 'NOT GUILTY. Display of goods in a shop window is merely an "invitation to treat" — an invitation for customers to make an offer. The shopkeeper had not "offered for sale" the knife within the meaning of the Act.',
    ratio: 'Display of goods in a shop window with a price tag is an invitation to treat, not an offer. The customer makes the offer at the till.',
    significance: 'Distinguishes between offers and invitations to treat — fundamental contract law concept.',
    color: '#16a34a',
  },
]

const LEGAL_PRINCIPLES = [
  { principle: 'Actus Reus', definition: 'The physical element of a crime — the guilty act', example: 'Pulling the trigger of a gun (in murder)' },
  { principle: 'Mens Rea', definition: 'The mental element of a crime — the guilty mind', example: 'Intention to kill or cause grievous bodily harm' },
  { principle: 'Ratio Decidendi', definition: 'The legal reason for the decision — the binding part of a case', example: 'The neighbour principle from Donoghue v Stevenson' },
  { principle: 'Obiter Dicta', definition: 'Things said "by the way" — persuasive but not binding', example: 'Hypothetical examples given by a judge' },
  { principle: 'Stare Decisis', definition: 'To stand by decisions — courts follow previous decisions', example: 'Lower courts must follow Supreme Court decisions' },
  { principle: 'Res Ipsa Loquitur', definition: '"The thing speaks for itself" — negligence is obvious', example: 'A surgical instrument left inside a patient' },
  { principle: 'Volenti Non Fit Injuria', definition: '"To a willing person no injury is done" — consent defence', example: 'Sports player injured during normal play' },
  { principle: 'Ex Post Facto', definition: 'Retrospective law — law applied to events before it existed', example: 'Making an act illegal after it was done' },
  { principle: 'Prima Facie', definition: 'On the face of it — sufficient evidence to proceed', example: 'A prima facie case of negligence exists' },
  { principle: 'Locus Standi', definition: 'The right to bring a case before a court', example: 'Only parties affected can sue' },
  { principle: 'Habeas Corpus', definition: '"Produce the body" — right not to be unlawfully detained', example: 'Challenging unlawful imprisonment' },
  { principle: 'Ultra Vires', definition: 'Beyond legal powers — acting outside authority', example: 'A company acting outside its memorandum of association' },
]

const MOOT_PROBLEMS = [
  {
    id: 1,
    title: 'Negligence — Duty of Care',
    scenario: 'Emeka, a software engineer, writes code for a hospital management system. Due to a bug in his code, a patient receives the wrong medication dosage and suffers serious harm. Emeka argues he had no direct relationship with the patient and therefore owes no duty of care.',
    parties: { appellant: 'The Patient (Plaintiff)', respondent: 'Emeka (Defendant)' },
    issues: ['Did Emeka owe a duty of care to the patient?', 'Was the harm reasonably foreseeable?', 'Was there sufficient proximity between the parties?'],
    hints: ['Consider Donoghue v Stevenson and the neighbour principle', 'Consider the Caparo three-part test', 'Consider whether economic loss applies'],
    color: '#7c3aed',
  },
  {
    id: 2,
    title: 'Contract Law — Offer and Acceptance',
    scenario: 'Adaeze posts on UniWeb\'s marketplace: "I will sell my laptop for ₦150,000 to the first person who transfers the money." Chukwudi immediately transfers the money. However, before Chukwudi\'s transfer is confirmed, Adaeze sells the laptop to Obinna who paid in cash. Chukwudi sues Adaeze for breach of contract.',
    parties: { appellant: 'Chukwudi (Plaintiff)', respondent: 'Adaeze (Defendant)' },
    issues: ['Was the post a valid offer or an invitation to treat?', 'When was the contract formed — transfer or confirmation?', 'Is there a binding contract with Chukwudi?'],
    hints: ['Consider Carlill v Carbolic Smoke Ball Co', 'Consider the postal rule and electronic communications', 'Consider whether it is a unilateral or bilateral contract'],
    color: '#2563eb',
  },
]

export default function LawStudies() {
  const [activeTab, setActiveTab] = useState<'cases' | 'principles' | 'moot' | 'quiz'>('cases')
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [selectedMoot, setSelectedMoot] = useState<any>(null)
  const [showHints, setShowHints] = useState(false)
  const [appellantArg, setAppellantArg] = useState('')
  const [respondentArg, setRespondentArg] = useState('')
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizOptions, setQuizOptions] = useState<string[]>([])

  const generateQuizQuestion = (index: number) => {
    if (index >= LEGAL_PRINCIPLES.length) return
    const correct = LEGAL_PRINCIPLES[index]
    const others = LEGAL_PRINCIPLES.filter((_, i) => i !== index)
      .sort(() => Math.random() - 0.5).slice(0, 3)
    setQuizOptions([correct.principle, ...others.map(o => o.principle)].sort(() => Math.random() - 0.5))
    setQuizAnswer(null)
  }

  const startQuiz = () => {
    setQuizIndex(0)
    setQuizScore(0)
    setQuizAnswer(null)
    generateQuizQuestion(0)
  }

  const answerQuiz = (answer: string) => {
    setQuizAnswer(answer)
    if (answer === LEGAL_PRINCIPLES[quizIndex].principle) setQuizScore(prev => prev + 1)
    setTimeout(() => {
      const next = quizIndex + 1
      setQuizIndex(next)
      if (next < LEGAL_PRINCIPLES.length) generateQuizQuestion(next)
    }, 1200)
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4338ca)', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4, marginTop: 12 }}>
            ⚖️ Law & Legal Studies Hub
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Case law, legal principles, moot court practice and Latin maxims
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'cases', label: '📚 Case Law' },
            { key: 'principles', label: '⚖️ Legal Principles' },
            { key: 'moot', label: '🏛️ Moot Court' },
            { key: 'quiz', label: '✅ Latin Quiz' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); if (tab.key === 'quiz') startQuiz() }} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? '#4338ca' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* CASE LAW */}
        {activeTab === 'cases' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedCase ? '1fr 1fr' : '1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CASE_LAW.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)}
                  style={{
                    background: selectedCase?.id === c.id ? c.color + '10' : 'white',
                    border: selectedCase?.id === c.id ? `2px solid ${c.color}` : '2px solid #f3f4f6',
                    borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1f2937', margin: 0 }}>{c.title}</h3>
                    <span style={{ background: c.color + '20', color: c.color, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 10 }}>
                      {c.court}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: c.color, fontWeight: 600, marginBottom: 6 }}>{c.area}</div>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
                    {c.facts.slice(0, 100)}...
                  </p>
                </div>
              ))}
            </div>

            {selectedCase && (
              <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', alignSelf: 'start', position: 'sticky', top: 80 }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ background: selectedCase.color + '20', color: selectedCase.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                    {selectedCase.area}
                  </span>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1f2937', margin: '8px 0 4px' }}>{selectedCase.title}</h2>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>{selectedCase.court}</p>
                </div>

                {[
                  { label: '📋 Facts', content: selectedCase.facts },
                  { label: '❓ Issue', content: selectedCase.issue },
                  { label: '⚖️ Held', content: selectedCase.held },
                  { label: '📐 Ratio Decidendi', content: selectedCase.ratio },
                  { label: '⭐ Significance', content: selectedCase.significance },
                ].map(section => (
                  <div key={section.label} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedCase.color, marginBottom: 4 }}>
                      {section.label}
                    </div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEGAL PRINCIPLES */}
        {activeTab === 'principles' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {LEGAL_PRINCIPLES.map((p, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#4338ca', marginBottom: 6, fontStyle: 'italic' }}>
                    {p.principle}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, lineHeight: 1.5 }}>
                    {p.definition}
                  </div>
                  <div style={{ background: '#eef2ff', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#4338ca' }}>
                    💡 <strong>Example:</strong> {p.example}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOOT COURT */}
        {activeTab === 'moot' && (
          <div>
            {!selectedMoot ? (
              <div>
                <div style={{ background: 'white', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>🏛️ What is Moot Court?</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 10 }}>
                    Moot court is a simulated court proceeding where law students argue both sides of a legal case. You will be given a scenario and must construct arguments for either the Appellant (person appealing) or the Respondent (person defending).
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { icon: '📝', label: 'Read the problem carefully', color: '#4338ca' },
                      { icon: '🔍', label: 'Identify the legal issues', color: '#4338ca' },
                      { icon: '📚', label: 'Find relevant cases and principles', color: '#4338ca' },
                      { icon: '🗣️', label: 'Construct your argument', color: '#4338ca' },
                    ].map(tip => (
                      <div key={tip.label} style={{ display: 'flex', gap: 10, padding: '10px', background: '#eef2ff', borderRadius: 8 }}>
                        <span style={{ fontSize: 18 }}>{tip.icon}</span>
                        <span style={{ fontSize: 13, color: '#4338ca', fontWeight: 500 }}>{tip.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Choose a Moot Problem:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {MOOT_PROBLEMS.map(problem => (
                    <div
                      key={problem.id}
                      onClick={() => { setSelectedMoot(problem); setAppellantArg(''); setRespondentArg(''); setShowHints(false) }}
                      style={{
                        background: 'white', borderRadius: 12, padding: '18px 20px',
                        border: `2px solid ${problem.color}30`, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: problem.color }}>
                          Problem {problem.id}: {problem.title}
                        </h3>
                        <span style={{ background: problem.color + '15', color: problem.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          Moot Problem
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                        {problem.scenario.slice(0, 150)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedMoot(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                  ← Back to Problems
                </button>

                {/* Problem */}
                <div style={{ background: 'white', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${selectedMoot.color}` }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: selectedMoot.color, marginBottom: 8 }}>
                    {selectedMoot.title}
                  </h2>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
                    {selectedMoot.scenario}
                  </p>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, background: '#fef2f2', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>APPELLANT</div>
                      <div style={{ fontSize: 13, color: '#374151' }}>{selectedMoot.parties.appellant}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>RESPONDENT</div>
                      <div style={{ fontSize: 13, color: '#374151' }}>{selectedMoot.parties.respondent}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Issues for Determination:</div>
                    {selectedMoot.issues.map((issue: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <span style={{ color: selectedMoot.color, fontWeight: 700, fontSize: 13 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, color: '#374151' }}>{issue}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowHints(!showHints)}
                    style={{ background: '#eef2ff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, color: '#4338ca', fontWeight: 600 }}
                  >
                    💡 {showHints ? 'Hide' : 'Show'} Case Hints
                  </button>
                  {showHints && (
                    <div style={{ marginTop: 10 }}>
                      {selectedMoot.hints.map((hint: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: '#4338ca', marginBottom: 4, display: 'flex', gap: 6 }}>
                          <span>→</span><span>{hint}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Argument builder */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                      Appellant's Argument
                    </h3>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                      Argue for: {selectedMoot.parties.appellant}
                    </p>
                    <textarea
                      placeholder={'Structure your argument:\n\n1. The applicable legal principle is...\n2. The relevant case law is...\n3. Applying the law to the facts...\n4. Therefore, the court should find...'}
                      value={appellantArg}
                      onChange={e => setAppellantArg(e.target.value)}
                      rows={12}
                      style={{ width: '100%', padding: '12px', border: '1.5px solid #fecaca', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: 1.7 }}
                    />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                      {appellantArg.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>
                      Respondent's Argument
                    </h3>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                      Argue for: {selectedMoot.parties.respondent}
                    </p>
                    <textarea
                      placeholder={'Structure your argument:\n\n1. The applicable legal principle is...\n2. The relevant case law is...\n3. Applying the law to the facts...\n4. Therefore, the court should find...'}
                      value={respondentArg}
                      onChange={e => setRespondentArg(e.target.value)}
                      rows={12}
                      style={{ width: '100%', padding: '12px', border: '1.5px solid #bbf7d0', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: 1.7 }}
                    />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                      {respondentArg.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LATIN QUIZ */}
        {activeTab === 'quiz' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {quizIndex >= LEGAL_PRINCIPLES.length ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>{quizScore >= LEGAL_PRINCIPLES.length * 0.8 ? '⚖️' : '📚'}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>Quiz Complete!</h3>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#4338ca', margin: '10px 0' }}>{quizScore}/{LEGAL_PRINCIPLES.length}</div>
                <p style={{ color: '#6b7280', marginBottom: 20 }}>{Math.round((quizScore / LEGAL_PRINCIPLES.length) * 100)}% correct</p>
                <button onClick={startQuiz} className="btn-primary" style={{ background: '#4338ca' }}>Try Again →</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Question {quizIndex + 1} of {LEGAL_PRINCIPLES.length}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4338ca' }}>Score: {quizScore}</span>
                </div>

                <div style={{ background: '#eef2ff', borderRadius: 12, padding: '20px 24px', marginBottom: 24, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Which Latin legal maxim means:</p>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', lineHeight: 1.5 }}>
                    "{LEGAL_PRINCIPLES[quizIndex]?.definition}"
                  </div>
                  <div style={{ fontSize: 13, color: '#4338ca', marginTop: 8, fontStyle: 'italic' }}>
                    Example: {LEGAL_PRINCIPLES[quizIndex]?.example}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {quizOptions.map(option => (
                    <button key={option} onClick={() => !quizAnswer && answerQuiz(option)} style={{
                      padding: '14px', borderRadius: 10,
                      background: !quizAnswer ? '#f9fafb'
                        : option === LEGAL_PRINCIPLES[quizIndex].principle ? '#eef2ff'
                        : quizAnswer === option ? '#fef2f2' : '#f9fafb',
                      color: !quizAnswer ? '#374151'
                        : option === LEGAL_PRINCIPLES[quizIndex].principle ? '#4338ca'
                        : quizAnswer === option ? '#ef4444' : '#9ca3af',
                      border: !quizAnswer ? '2px solid #e5e7eb'
                        : option === LEGAL_PRINCIPLES[quizIndex].principle ? '2px solid #4338ca'
                        : quizAnswer === option ? '2px solid #fecaca' : '2px solid transparent',
                      cursor: quizAnswer ? 'default' : 'pointer',
                      fontSize: 14, fontWeight: 700, fontStyle: 'italic',
                    }}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}