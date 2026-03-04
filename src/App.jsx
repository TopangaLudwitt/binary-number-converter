import React, { useState, useCallback } from 'react'

const BASES = [
  { key: 'bin', label: 'Binary', base: 2, prefix: '0b', placeholder: '1010', valid: /^[01]*$/ },
  { key: 'oct', label: 'Octal', base: 8, prefix: '0o', placeholder: '12', valid: /^[0-7]*$/ },
  { key: 'dec', label: 'Decimal', base: 10, prefix: '', placeholder: '10', valid: /^-?[0-9]*$/ },
  { key: 'hex', label: 'Hexadecimal', base: 16, prefix: '0x', placeholder: 'A', valid: /^[0-9a-fA-F]*$/ },
]

function toBitGroups(bin) {
  const padded = bin.padStart(Math.ceil(bin.length / 4) * 4, '0')
  return padded.match(/.{4}/g) || []
}

function toAscii(dec) {
  if (dec >= 32 && dec <= 126) return String.fromCharCode(dec)
  if (dec === 0) return 'NUL'
  if (dec === 10) return 'LF'
  if (dec === 13) return 'CR'
  if (dec === 9) return 'TAB'
  if (dec === 32) return 'SP'
  return '—'
}

function StepByStep({ value, fromBase, toBase }) {
  if (!value || value === '0') return null

  const dec = parseInt(value, fromBase)
  if (isNaN(dec) || dec < 0) return null

  // Show conversion steps from decimal to target base
  if (toBase === 10 || dec === 0) return null

  const steps = []
  let n = dec
  const digits = []

  while (n > 0) {
    const remainder = n % toBase
    const quotient = Math.floor(n / toBase)
    steps.push({ n, quotient, remainder, digit: remainder.toString(toBase).toUpperCase() })
    digits.unshift(remainder.toString(toBase).toUpperCase())
    n = quotient
  }

  const baseLabel = BASES.find(b => b.base === toBase)?.label || `Base ${toBase}`

  return (
    <div style={styles.steps}>
      <h3 style={styles.stepsTitle}>Step-by-step: {dec}₁₀ → {baseLabel}</h3>
      <div style={styles.stepsBody}>
        <p style={styles.stepDesc}>Repeatedly divide by {toBase} and collect remainders:</p>
        <table style={styles.stepsTable}>
          <thead>
            <tr>
              <th style={styles.th}>Dividend</th>
              <th style={styles.th}>÷ {toBase}</th>
              <th style={styles.th}>Quotient</th>
              <th style={styles.th}>Remainder</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s, i) => (
              <tr key={i}>
                <td style={styles.td}>{s.n}</td>
                <td style={styles.td}>÷ {toBase}</td>
                <td style={styles.td}>{s.quotient}</td>
                <td style={{ ...styles.td, color: '#22d3ee', fontWeight: 700 }}>{s.digit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={styles.stepResult}>
          Read remainders bottom→top: <strong style={{ color: '#22d3ee' }}>{digits.join('')}</strong>
        </p>
      </div>
    </div>
  )
}

function BitVisualizer({ binary }) {
  if (!binary) return null
  const groups = toBitGroups(binary)

  return (
    <div style={styles.bitViz}>
      <h3 style={styles.stepsTitle}>Bit Layout</h3>
      <div style={styles.bitGrid}>
        {groups.map((group, gi) => (
          <div key={gi} style={styles.bitGroup}>
            {group.split('').map((bit, bi) => (
              <div key={bi} style={{
                ...styles.bit,
                background: bit === '1' ? '#3b82f6' : '#1e293b',
                color: bit === '1' ? '#fff' : '#64748b',
                borderColor: bit === '1' ? '#60a5fa' : '#334155',
              }}>
                {bit}
              </div>
            ))}
            <div style={styles.bitLabel}>{parseInt(group, 2).toString(16).toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={styles.bitPositions}>
        {binary.padStart(groups.length * 4, '0').split('').map((_, i, arr) => (
          <span key={i} style={styles.posLabel}>2<sup>{arr.length - 1 - i}</sup></span>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [activeBase, setActiveBase] = useState('dec')
  const [inputValue, setInputValue] = useState('42')
  const [showSteps, setShowSteps] = useState(true)
  const [stepTarget, setStepTarget] = useState('bin')
  const [history, setHistory] = useState([])

  const currentBase = BASES.find(b => b.key === activeBase)
  const decValue = inputValue ? parseInt(inputValue, currentBase.base) : NaN

  const handleInput = useCallback((val) => {
    if (!currentBase.valid.test(val)) return
    setInputValue(val)
  }, [currentBase])

  const handleBaseSwitch = useCallback((key) => {
    if (isNaN(decValue)) {
      setActiveBase(key)
      setInputValue('')
      return
    }
    const newBase = BASES.find(b => b.key === key)
    setActiveBase(key)
    setInputValue(decValue.toString(newBase.base).toUpperCase())
  }, [decValue])

  const addToHistory = useCallback(() => {
    if (isNaN(decValue)) return
    setHistory(prev => {
      const entry = {
        input: inputValue,
        base: activeBase,
        decimal: decValue,
        time: new Date().toLocaleTimeString(),
      }
      return [entry, ...prev].slice(0, 20)
    })
  }, [decValue, inputValue, activeBase])

  const conversions = BASES.map(b => ({
    ...b,
    value: isNaN(decValue) ? '—' : (b.base === 10 ? decValue.toString() : decValue.toString(b.base).toUpperCase()),
    isActive: b.key === activeBase,
  }))

  const binary = isNaN(decValue) ? '' : decValue.toString(2)
  const ascii = !isNaN(decValue) ? toAscii(decValue) : '—'

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>🔢 Binary Number Converter</h1>
        <p style={styles.subtitle}>Convert between binary, octal, decimal, and hexadecimal with step-by-step explanations</p>
      </header>

      {/* Base selector */}
      <div style={styles.baseTabs}>
        {BASES.map(b => (
          <button
            key={b.key}
            onClick={() => handleBaseSwitch(b.key)}
            style={{
              ...styles.tab,
              ...(b.key === activeBase ? styles.tabActive : {}),
            }}
          >
            {b.label}
            <span style={styles.tabBase}>Base {b.base}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={styles.inputSection}>
        <div style={styles.inputRow}>
          <span style={styles.prefix}>{currentBase.prefix}</span>
          <input
            style={styles.input}
            value={inputValue}
            onChange={e => handleInput(e.target.value)}
            placeholder={currentBase.placeholder}
            spellCheck={false}
          />
          <button style={styles.saveBtn} onClick={addToHistory} title="Save to history">📌</button>
        </div>
        {!isNaN(decValue) && <div style={styles.inputHint}>= {decValue.toLocaleString()} in decimal{ascii !== '—' ? ` • ASCII: '${ascii}'` : ''}</div>}
        {isNaN(decValue) && inputValue && <div style={{ ...styles.inputHint, color: '#f87171' }}>Invalid {currentBase.label.toLowerCase()} number</div>}
      </div>

      {/* Results grid */}
      <div style={styles.resultsGrid}>
        {conversions.map(c => (
          <div
            key={c.key}
            style={{ ...styles.resultCard, ...(c.isActive ? styles.resultActive : {}) }}
            onClick={() => handleBaseSwitch(c.key)}
          >
            <div style={styles.resultLabel}>{c.label} <span style={styles.resultBase}>(base {c.base})</span></div>
            <div style={styles.resultValue}>{c.prefix}{c.value}</div>
          </div>
        ))}
      </div>

      {/* Bit visualizer */}
      {!isNaN(decValue) && decValue >= 0 && decValue <= 65535 && (
        <BitVisualizer binary={binary} />
      )}

      {/* Step-by-step toggle */}
      <div style={styles.stepControls}>
        <label style={styles.toggle}>
          <input type="checkbox" checked={showSteps} onChange={e => setShowSteps(e.target.checked)} />
          <span style={{ marginLeft: 6 }}>Show step-by-step</span>
        </label>
        {showSteps && (
          <select style={styles.select} value={stepTarget} onChange={e => setStepTarget(e.target.value)}>
            {BASES.filter(b => b.key !== 'dec').map(b => (
              <option key={b.key} value={b.key}>→ {b.label}</option>
            ))}
          </select>
        )}
      </div>

      {showSteps && !isNaN(decValue) && decValue >= 0 && (
        <StepByStep value={inputValue} fromBase={currentBase.base} toBase={BASES.find(b => b.key === stepTarget).base} />
      )}

      {/* Quick examples */}
      <div style={styles.examples}>
        <h3 style={styles.stepsTitle}>Quick Examples</h3>
        <div style={styles.exampleGrid}>
          {[42, 255, 1024, 127, 65535, 3735928559].map(n => (
            <button
              key={n}
              style={styles.exBtn}
              onClick={() => { setActiveBase('dec'); setInputValue(n.toString()) }}
            >
              {n.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={styles.history}>
          <h3 style={styles.stepsTitle}>History</h3>
          {history.map((h, i) => (
            <div
              key={i}
              style={styles.historyItem}
              onClick={() => { setActiveBase(h.base); setInputValue(h.input) }}
            >
              <span>{h.input} ({BASES.find(b => b.key === h.base)?.label})</span>
              <span style={{ color: '#64748b' }}>{h.time}</span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.credit}>
        Built by <a href="https://topanga.ludwitt.com" style={styles.link}>Topanga</a> for{' '}
        <a href="https://opensource.ludwitt.com" style={styles.link}>Ludwitt University</a>
        {' '}· ALC Path · Intro to CS · Deliverable 1
      </div>
    </div>
  )
}

const styles = {
  app: { maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: "'Inter', -apple-system, sans-serif", background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' },
  header: { textAlign: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.8rem', background: 'linear-gradient(135deg, #3b82f6, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 },
  subtitle: { color: '#94a3b8', fontSize: '0.85rem' },
  baseTabs: { display: 'flex', gap: 6, marginBottom: '1rem' },
  tab: { flex: 1, padding: '0.6rem 0.4rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 2 },
  tabActive: { borderColor: '#3b82f6', color: '#fff', background: '#1e3a5f' },
  tabBase: { fontSize: '0.65rem', opacity: 0.6 },
  inputSection: { marginBottom: '1rem' },
  inputRow: { display: 'flex', gap: 8, alignItems: 'center' },
  prefix: { color: '#64748b', fontFamily: 'monospace', fontSize: '1.1rem', minWidth: 24 },
  input: { flex: 1, padding: '0.8rem', background: '#1e293b', border: '2px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: '1.4rem', fontFamily: 'monospace', outline: 'none' },
  saveBtn: { padding: '0.7rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', fontSize: '1.1rem' },
  inputHint: { marginTop: 6, fontSize: '0.8rem', color: '#94a3b8' },
  resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: '1.5rem' },
  resultCard: { padding: '0.8rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' },
  resultActive: { borderColor: '#3b82f6', background: '#1e3a5f' },
  resultLabel: { fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 },
  resultBase: { fontSize: '0.65rem' },
  resultValue: { fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' },
  bitViz: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '1rem', marginBottom: '1rem' },
  bitGrid: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  bitGroup: { display: 'flex', gap: 3, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  bit: { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' },
  bitLabel: { fontSize: '0.65rem', color: '#64748b', marginLeft: 4, fontFamily: 'monospace' },
  bitPositions: { display: 'flex', gap: 3, justifyContent: 'center', marginTop: 4, flexWrap: 'wrap' },
  posLabel: { fontSize: '0.55rem', color: '#475569', minWidth: 28, textAlign: 'center', fontFamily: 'monospace' },
  stepControls: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: '0.5rem' },
  toggle: { display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer' },
  select: { padding: '0.3rem 0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: '0.8rem' },
  steps: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '1rem', marginBottom: '1rem' },
  stepsTitle: { fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  stepsBody: {},
  stepDesc: { fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8 },
  stepsTable: { width: '100%', borderCollapse: 'collapse', marginBottom: 8 },
  th: { padding: '0.4rem 0.6rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', borderBottom: '1px solid #334155' },
  td: { padding: '0.4rem 0.6rem', fontSize: '0.9rem', fontFamily: 'monospace', borderBottom: '1px solid #1e293b' },
  stepResult: { fontSize: '0.9rem', color: '#94a3b8' },
  examples: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '1rem', marginBottom: '1rem' },
  exampleGrid: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  exBtn: { padding: '0.4rem 0.8rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem' },
  history: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '1rem', marginBottom: '1rem' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem', fontFamily: 'monospace', cursor: 'pointer', borderBottom: '1px solid #0f172a' },
  credit: { textAlign: 'center', marginTop: '2rem', padding: '1rem', color: '#64748b', fontSize: '0.75rem', borderTop: '1px solid #334155' },
  link: { color: '#3b82f6', textDecoration: 'none' },
}
