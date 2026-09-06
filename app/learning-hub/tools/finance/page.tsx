'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function FinancialCalculator() {
  const [activeCalc, setActiveCalc] = useState<'interest' | 'loan' | 'profit' | 'investment' | 'breakeven'>('interest')

  // Simple Interest
  const [siPrincipal, setSiPrincipal] = useState('')
  const [siRate, setSiRate] = useState('')
  const [siTime, setSiTime] = useState('')
  const [siResult, setSiResult] = useState<any>(null)

  // Compound Interest
  const [ciPrincipal, setCiPrincipal] = useState('')
  const [ciRate, setCiRate] = useState('')
  const [ciTime, setCiTime] = useState('')
  const [ciN, setCiN] = useState('12')
  const [ciResult, setCiResult] = useState<any>(null)

  // Loan / EMI
  const [loanAmount, setLoanAmount] = useState('')
  const [loanRate, setLoanRate] = useState('')
  const [loanMonths, setLoanMonths] = useState('')
  const [loanResult, setLoanResult] = useState<any>(null)

  // Profit & Loss
  const [costPrice, setCostPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [profitResult, setProfitResult] = useState<any>(null)

  // Break-even
  const [fixedCosts, setFixedCosts] = useState('')
  const [variableCost, setVariableCost] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [breakevenResult, setBreakevenResult] = useState<any>(null)

  // Investment ROI
  const [investAmount, setInvestAmount] = useState('')
  const [returnAmount, setReturnAmount] = useState('')
  const [investYears, setInvestYears] = useState('')
  const [roiResult, setRoiResult] = useState<any>(null)

  const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const calcSimpleInterest = () => {
    const P = parseFloat(siPrincipal)
    const R = parseFloat(siRate) / 100
    const T = parseFloat(siTime)
    if (isNaN(P) || isNaN(R) || isNaN(T)) return
    const I = P * R * T
    const A = P + I
    setSiResult({ I, A, P, R: parseFloat(siRate), T })
  }

  const calcCompoundInterest = () => {
    const P = parseFloat(ciPrincipal)
    const R = parseFloat(ciRate) / 100
    const T = parseFloat(ciTime)
    const n = parseFloat(ciN)
    if (isNaN(P) || isNaN(R) || isNaN(T) || isNaN(n)) return
    const A = P * Math.pow(1 + R / n, n * T)
    const I = A - P
    setCiResult({ A, I, P, growth: ((A - P) / P * 100).toFixed(2) })
  }

  const calcLoan = () => {
    const P = parseFloat(loanAmount)
    const R = parseFloat(loanRate) / 100 / 12
    const N = parseFloat(loanMonths)
    if (isNaN(P) || isNaN(R) || isNaN(N)) return
    const EMI = R === 0 ? P / N : P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1)
    const total = EMI * N
    const interest = total - P
    setLoanResult({ EMI, total, interest, P })
  }

  const calcProfit = () => {
    const CP = parseFloat(costPrice)
    const SP = parseFloat(sellingPrice)
    if (isNaN(CP) || isNaN(SP)) return
    const profit = SP - CP
    const profitPct = (profit / CP) * 100
    setProfitResult({ profit, profitPct, CP, SP, isLoss: profit < 0 })
  }

  const calcBreakeven = () => {
    const FC = parseFloat(fixedCosts)
    const VC = parseFloat(variableCost)
    const P = parseFloat(pricePerUnit)
    if (isNaN(FC) || isNaN(VC) || isNaN(P)) return
    const contributionMargin = P - VC
    const units = FC / contributionMargin
    const revenue = units * P
    setBreakevenResult({ units: Math.ceil(units), revenue, contributionMargin, FC })
  }

  const calcROI = () => {
    const invest = parseFloat(investAmount)
    const ret = parseFloat(returnAmount)
    const years = parseFloat(investYears)
    if (isNaN(invest) || isNaN(ret)) return
    const roi = ((ret - invest) / invest) * 100
    const annualROI = years ? roi / years : roi
    setRoiResult({ roi, annualROI, gain: ret - invest, invest })
  }

  const ResultCard = ({ label, value, color = '#16a34a', prefix = '₦' }: any) => (
    <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{typeof value === 'number' ? `${prefix}${fmt(value)}` : value}</div>
    </div>
  )

  const calcs = [
    { key: 'interest', label: '📈 Simple Interest' },
    { key: 'loan', label: '🏦 Loan/EMI' },
    { key: 'profit', label: '💰 Profit & Loss' },
    { key: 'investment', label: '📊 ROI' },
    { key: 'breakeven', label: '⚖️ Break-even' },
  ]

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ background: 'linear-gradient(135deg, #92400e, #d97706)', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4, marginTop: 12 }}>
            💰 Financial Calculator
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Business and economics calculations for students
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Calculator tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {calcs.map(c => (
            <button key={c.key} onClick={() => setActiveCalc(c.key as any)} style={{
              flex: 1, padding: '10px 6px', borderRadius: 10, border: 'none',
              background: activeCalc === c.key ? '#d97706' : 'transparent',
              color: activeCalc === c.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

          {/* SIMPLE INTEREST */}
          {activeCalc === 'interest' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📈 Simple & Compound Interest</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                Formula: <code>I = PRT</code> | A = P + I
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Simple */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#16a34a' }}>Simple Interest</h4>
                  <label>Principal (₦)</label>
                  <input type="number" placeholder="e.g. 50000" value={siPrincipal} onChange={e => setSiPrincipal(e.target.value)} />
                  <label>Rate (% per year)</label>
                  <input type="number" placeholder="e.g. 10" value={siRate} onChange={e => setSiRate(e.target.value)} />
                  <label>Time (years)</label>
                  <input type="number" placeholder="e.g. 3" value={siTime} onChange={e => setSiTime(e.target.value)} />
                  <button onClick={calcSimpleInterest} className="btn-primary" style={{ background: '#16a34a', marginTop: 8 }}>Calculate →</button>
                  {siResult && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                      <ResultCard label="Interest (I)" value={siResult.I} />
                      <ResultCard label="Total Amount" value={siResult.A} color="#16a34a" />
                    </div>
                  )}
                </div>
                {/* Compound */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#2563eb' }}>Compound Interest</h4>
                  <label>Principal (₦)</label>
                  <input type="number" placeholder="e.g. 50000" value={ciPrincipal} onChange={e => setCiPrincipal(e.target.value)} />
                  <label>Rate (% per year)</label>
                  <input type="number" placeholder="e.g. 12" value={ciRate} onChange={e => setCiRate(e.target.value)} />
                  <label>Time (years)</label>
                  <input type="number" placeholder="e.g. 5" value={ciTime} onChange={e => setCiTime(e.target.value)} />
                  <label>Compounding</label>
                  <select value={ciN} onChange={e => setCiN(e.target.value)}>
                    <option value="1">Annually</option>
                    <option value="2">Semi-annually</option>
                    <option value="4">Quarterly</option>
                    <option value="12">Monthly</option>
                    <option value="365">Daily</option>
                  </select>
                  <button onClick={calcCompoundInterest} className="btn-primary" style={{ background: '#2563eb', marginTop: 8 }}>Calculate →</button>
                  {ciResult && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                      <ResultCard label="Interest Earned" value={ciResult.I} color="#2563eb" />
                      <ResultCard label="Final Amount" value={ciResult.A} color="#2563eb" />
                      <div style={{ gridColumn: '1 / -1', background: '#eff6ff', borderRadius: 8, padding: '10px', textAlign: 'center', fontSize: 13, color: '#2563eb', fontWeight: 700 }}>
                        Growth: {ciResult.growth}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LOAN */}
          {activeCalc === 'loan' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🏦 Loan & EMI Calculator</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Calculate monthly loan repayments</p>
              <label>Loan Amount (₦)</label>
              <input type="number" placeholder="e.g. 1000000" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
              <label>Annual Interest Rate (%)</label>
              <input type="number" placeholder="e.g. 18" value={loanRate} onChange={e => setLoanRate(e.target.value)} />
              <label>Loan Duration (months)</label>
              <input type="number" placeholder="e.g. 24" value={loanMonths} onChange={e => setLoanMonths(e.target.value)} />
              <button onClick={calcLoan} className="btn-primary" style={{ marginTop: 8 }}>Calculate →</button>
              {loanResult && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <ResultCard label="Monthly Payment" value={loanResult.EMI} color="#d97706" />
                    <ResultCard label="Total Payment" value={loanResult.total} />
                    <ResultCard label="Total Interest" value={loanResult.interest} color="#dc2626" />
                  </div>
                  <div style={{ marginTop: 12, background: '#fffbeb', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#78350f' }}>
                    💡 You will pay <strong>₦{fmt(loanResult.interest)}</strong> in interest over the loan period.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROFIT & LOSS */}
          {activeCalc === 'profit' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>💰 Profit & Loss Calculator</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Calculate profit, loss and percentage</p>
              <label>Cost Price (₦)</label>
              <input type="number" placeholder="Amount you paid" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
              <label>Selling Price (₦)</label>
              <input type="number" placeholder="Amount you sold for" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
              <button onClick={calcProfit} className="btn-primary" style={{ marginTop: 8, background: profitResult?.isLoss ? '#dc2626' : '#16a34a' }}>Calculate →</button>
              {profitResult && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <ResultCard
                      label={profitResult.isLoss ? 'Loss' : 'Profit'}
                      value={Math.abs(profitResult.profit)}
                      color={profitResult.isLoss ? '#dc2626' : '#16a34a'}
                    />
                    <ResultCard
                      label={profitResult.isLoss ? 'Loss %' : 'Profit %'}
                      value={`${Math.abs(profitResult.profitPct).toFixed(2)}%`}
                      prefix=""
                      color={profitResult.isLoss ? '#dc2626' : '#16a34a'}
                    />
                  </div>
                  <div style={{ marginTop: 10, background: profitResult.isLoss ? '#fef2f2' : '#f0fdf4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: profitResult.isLoss ? '#dc2626' : '#16a34a', fontWeight: 600, textAlign: 'center' }}>
                    {profitResult.isLoss ? `❌ Loss of ₦${fmt(Math.abs(profitResult.profit))} (${Math.abs(profitResult.profitPct).toFixed(2)}% loss)` : `✅ Profit of ₦${fmt(profitResult.profit)} (${profitResult.profitPct.toFixed(2)}% profit)`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROI */}
          {activeCalc === 'investment' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📊 Return on Investment (ROI)</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Measure the profitability of an investment</p>
              <label>Initial Investment (₦)</label>
              <input type="number" placeholder="Amount invested" value={investAmount} onChange={e => setInvestAmount(e.target.value)} />
              <label>Total Return (₦)</label>
              <input type="number" placeholder="Amount returned" value={returnAmount} onChange={e => setReturnAmount(e.target.value)} />
              <label>Investment Period (years, optional)</label>
              <input type="number" placeholder="e.g. 3" value={investYears} onChange={e => setInvestYears(e.target.value)} />
              <button onClick={calcROI} className="btn-primary" style={{ background: '#7c3aed', marginTop: 8 }}>Calculate →</button>
              {roiResult && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <ResultCard label="Net Gain" value={roiResult.gain} color="#7c3aed" />
                    <ResultCard label="ROI %" value={`${roiResult.roi.toFixed(2)}%`} prefix="" color="#7c3aed" />
                    {investYears && <ResultCard label="Annual ROI" value={`${roiResult.annualROI.toFixed(2)}%`} prefix="" color="#7c3aed" />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BREAK-EVEN */}
          {activeCalc === 'breakeven' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>⚖️ Break-even Analysis</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Find the point where total revenue equals total costs</p>
              <label>Fixed Costs (₦)</label>
              <input type="number" placeholder="e.g. Rent, salaries (500000)" value={fixedCosts} onChange={e => setFixedCosts(e.target.value)} />
              <label>Variable Cost per Unit (₦)</label>
              <input type="number" placeholder="e.g. Raw materials per unit (200)" value={variableCost} onChange={e => setVariableCost(e.target.value)} />
              <label>Selling Price per Unit (₦)</label>
              <input type="number" placeholder="e.g. Price you sell at (500)" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} />
              <button onClick={calcBreakeven} className="btn-primary" style={{ background: '#0891b2', marginTop: 8 }}>Calculate →</button>
              {breakevenResult && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                    <ResultCard label="Break-even Units" value={`${breakevenResult.units} units`} prefix="" color="#0891b2" />
                    <ResultCard label="Break-even Revenue" value={breakevenResult.revenue} color="#0891b2" />
                    <ResultCard label="Contribution Margin" value={breakevenResult.contributionMargin} color="#16a34a" />
                  </div>
                  <div style={{ background: '#ecfeff', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#0891b2' }}>
                    💡 You need to sell <strong>{breakevenResult.units} units</strong> to cover all costs. Every unit sold beyond this is <strong>profit</strong>.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formulas reference */}
        <div style={{ background: 'white', borderRadius: 14, padding: 20, marginTop: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📐 Key Formulas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { label: 'Simple Interest', formula: 'I = PRT' },
              { label: 'Compound Interest', formula: 'A = P(1 + r/n)^(nt)' },
              { label: 'EMI', formula: 'EMI = P·r·(1+r)^n / ((1+r)^n - 1)' },
              { label: 'Profit %', formula: '(SP - CP) / CP × 100' },
              { label: 'ROI', formula: '(Return - Cost) / Cost × 100' },
              { label: 'Break-even', formula: 'FC / (P - VC)' },
            ].map(f => (
              <div key={f.label} style={{ background: '#fffbeb', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, marginBottom: 4 }}>{f.label}</div>
                <code style={{ fontSize: 13, color: '#374151' }}>{f.formula}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}