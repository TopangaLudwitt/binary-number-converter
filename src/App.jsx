import React, { useState, useCallback } from 'react'

const BASES = [
  { key: 'dec', label: 'Decimal', base: 10, prefix: '', placeholder: '0-255' },
  { key: 'bin', label: 'Binary', base: 2, prefix: '0b', placeholder: '00000000-11111111' },
  { key: 'oct', label: 'Octal', base: 8, prefix: '0o', placeholder: '0-377' },
  { key: 'hex', label: 'Hexadecimal', base: 16, prefix: '0x', placeholder: '00-FF' },
]

function validate(value, base) {
  if (!value.trim()) return { valid: false, error: null, num: null }
  const clean = value.trim().toLowerCase()
    .replace(/^0b/, '').replace(/^0o/, '').replace(/^0x/, '')
  if (!clean) return { valid: false, error: 'Enter a value', num: null }

  const num = parseInt(clean, base)
  if (isNaN(num)) {
    const chars = base === 2 ? '0-1' : base === 8 ? '0-7' : base === 10 ? '0-9' : '0-9, A-F'
    return { valid: false, error: `Invalid characters for base ${base}. Use: ${chars}`, num: null }
  }
  if (num < 0) return { valid: false, error: 'Value must be non-negative', num: null }
  if (num > 255) return { valid: false, error: 'Value must be 0-255 (8-bit range)', num: null }
  // Verify round-trip
  if (parseInt(clean, base).toString(base) !== clean.replace(/^0+/, '') && clean !== '0') {
    // Allow leading zeros
    if (parseInt(clean, base) !== num) {
      return { valid: false, error: 'Invalid number format', num: null }
    }
  }
  return { valid: true, error: null, num }
}

function toBinary8(n) {
  return n.toString(2).padStart(8, '0')
}

function decToBinarySteps(n) {
  if (n === 0) return [{ text: '0 in decimal is 0 in binary', quotient: 0, remainder: 0 }]
  const steps = []
  let current = n
  while (current > 0) {
    const q = Math.floor(current / 2)
    const r = current % 2
    steps.push({
      text: `${current} ÷ 2 = ${q} remainder ${r}`,
      quotient: q,
      remainder: r,
    })
    current = q
  }
  return steps
}

function decToOctalSteps(n) {
  if (n === 0) return [{ text: '0 in decimal is 0 in octal' }]
  const steps = []
  let current = n
  while (current > 0) {
    const q = Math.floor(current / 8)
    const r = current % 8
    steps.push({ text: `${current} ÷ 8 = ${q} remainder ${r}` })
    current = q
  }
  return steps
}

function decToHexSteps(n) {
  if (n === 0) return [{ text: '0 in decimal is 0 in hexadecimal' }]
  const steps = []
  let current = n
  while (current > 0) {
    const q = Math.floor(current / 16)
    const r = current % 16
    const rChar = r.toString(16).toUpperCase()
    steps.push({ text: `${current} ÷ 16 = ${q} remainder ${r} (${rChar})` })
    current = q
  }
  return steps
}

function binaryToDecSteps(binary) {
  const bits = binary.split('')
  return bits.map((bit, i) => {
    const power = bits.length - 1 - i
    const value = parseInt(bit) * Math.pow(2, power)
    return { text: `Bit ${i}: ${bit} × 2^${power} = ${value}` }
  })
}

export default function App() {
  const [inputBase, setInputBase] = useState('dec')
  const [inputValue, setInputValue] = useState('42')
  const [error, setError] = useState(null)
  const [showSteps, setShowSteps] = useState('dec-to-bin')
  const [reverseBase, setReverseBase] = useState('bin')
  const [reverseValue, setReverseValue] = useState('')
  const [reverseResult, setReverseResult] = useState(null)
  const [reverseError, setReverseError] = useState(null)

  const baseInfo = BASES.find(b => b.key === inputBase)
  const { valid, error: valError, num } = validate(inputValue, baseInfo.base)
  const currentNum = valid ? num : null

  const handleInput = (val) => {
    setInputValue(val)
    const { error: e } = validate(val, baseInfo.base)
    setError(e)
  }

  const handleBaseChange = (key) => {
    if (currentNum !== null) {
      const newBase = BASES.find(b => b.key === key)
      setInputValue(currentNum.toString(newBase.base).toUpperCase())
    } else {
      setInputValue('')
    }
    setInputBase(key)
    setError(null)
  }

  const toggleBit = useCallback((bitIndex) => {
    const n = currentNum ?? 0
    const toggled = n ^ (1 << (7 - bitIndex))
    if (toggled > 255 || toggled < 0) return
    const newBase = BASES.find(b => b.key === inputBase)
    setInputValue(toggled.toString(newBase.base).toUpperCase())
  }, [currentNum, inputBase])

  const handleReverse = () => {
    const rBase = BASES.find(b => b.key === reverseBase)
    const { valid: rv, error: re, num: rn } = validate(reverseValue, rBase.base)
    if (!rv) {
      setReverseError(re || 'Enter a valid number')
      setReverseResult(null)
      return
    }
    setReverseError(null)
    setReverseResult(rn)
  }

  const bits = currentNum !== null ? toBinary8(currentNum) : '00000000'

  const getSteps = () => {
    if (currentNum === null) return []
    switch (showSteps) {
      case 'dec-to-bin': return decToBinarySteps(currentNum)
      case 'dec-to-oct': return decToOctalSteps(currentNum)
      case 'dec-to-hex': return decToHexSteps(currentNum)
      case 'bin-to-dec': return binaryToDecSteps(toBinary8(currentNum))
      default: return []
    }
  }

  return (
    <div className="app">
      <header>
        <h1>⚡ Binary Number Converter</h1>
        <p>Convert between decimal, binary, octal & hexadecimal (0–255)</p>
      </header>

      {/* Input */}
      <div className="panel">
        <h2>Input</h2>
        <div className="input-row">
          <div className="input-group" style={{ maxWidth: '140px' }}>
            <label>Base</label>
            <select value={inputBase} onChange={e => handleBaseChange(e.target.value)}>
              {BASES.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Value ({baseInfo.label})</label>
            <input
              type="text"
              value={inputValue}
              onChange={e => handleInput(e.target.value)}
              placeholder={baseInfo.placeholder}
              spellCheck={false}
            />
            {error && <div className="error-msg">⚠ {error}</div>}
          </div>
        </div>
      </div>

      {/* Bit Pattern */}
      <div className="panel">
        <h2>8-Bit Pattern {currentNum !== null && `(${currentNum}₁₀)`}</h2>
        <div className="bits-container">
          {bits.split('').map((bit, i) => (
            <div
              key={i}
              className={`bit ${bit === '1' ? 'on' : 'off'}`}
              onClick={() => toggleBit(i)}
              title={`Bit ${i}: 2^${7 - i} = ${Math.pow(2, 7 - i)}. Click to toggle.`}
            >
              {bit}
            </div>
          ))}
        </div>
        <div className="bit-labels">
          {[128, 64, 32, 16, 8, 4, 2, 1].map((v, i) => (
            <div key={i} className="bit-label">2^{7 - i}</div>
          ))}
        </div>
      </div>

      {/* Conversions */}
      <div className="panel">
        <h2>Conversions</h2>
        <div className="results">
          {BASES.map(b => {
            const val = currentNum !== null
              ? (b.base === 16 ? currentNum.toString(16).toUpperCase() : currentNum.toString(b.base))
              : '—'
            return (
              <div key={b.key} className={`result-card ${b.key === inputBase ? 'active' : ''}`}
                onClick={() => handleBaseChange(b.key)}>
                <div className="base-label">{b.label} (base {b.base})</div>
                <div className="value">{b.prefix}{val}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step-by-Step */}
      <div className="panel">
        <h2>Step-by-Step Conversion</h2>
        <div className="tabs">
          {[
            { key: 'dec-to-bin', label: 'Dec → Bin' },
            { key: 'dec-to-oct', label: 'Dec → Oct' },
            { key: 'dec-to-hex', label: 'Dec → Hex' },
            { key: 'bin-to-dec', label: 'Bin → Dec' },
          ].map(t => (
            <button key={t.key} className={`tab ${showSteps === t.key ? 'active' : ''}`}
              onClick={() => setShowSteps(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        {currentNum !== null ? (
          <div className="steps">
            {getSteps().map((s, i) => (
              <div key={i} className="step">
                <span className="step-num">{i + 1}.</span>
                <span className="step-text">{s.text}</span>
              </div>
            ))}
            {showSteps === 'dec-to-bin' && (
              <div className="step" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span className="step-num">→</span>
                <span className="step-text">
                  Read remainders bottom-to-top: <span className="highlight">{currentNum.toString(2)}</span>
                  {' '}= {toBinary8(currentNum)} (8-bit padded)
                </span>
              </div>
            )}
            {showSteps === 'dec-to-oct' && (
              <div className="step" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span className="step-num">→</span>
                <span className="step-text">
                  Read remainders bottom-to-top: <span className="highlight">{currentNum.toString(8)}</span>
                </span>
              </div>
            )}
            {showSteps === 'dec-to-hex' && (
              <div className="step" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span className="step-num">→</span>
                <span className="step-text">
                  Read remainders bottom-to-top: <span className="highlight">{currentNum.toString(16).toUpperCase()}</span>
                </span>
              </div>
            )}
            {showSteps === 'bin-to-dec' && (
              <div className="step" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span className="step-num">→</span>
                <span className="step-text">
                  Sum all values: <span className="highlight">{currentNum}</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>
            Enter a valid number to see step-by-step conversion
          </div>
        )}
      </div>

      {/* Reverse Conversion */}
      <div className="panel">
        <h2>Reverse Conversion → Decimal</h2>
        <div className="reverse-row">
          <div className="input-group" style={{ maxWidth: '140px' }}>
            <label>From Base</label>
            <select value={reverseBase} onChange={e => { setReverseBase(e.target.value); setReverseResult(null); setReverseError(null) }}>
              {BASES.filter(b => b.key !== 'dec').map(b => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Value</label>
            <input
              type="text"
              value={reverseValue}
              onChange={e => { setReverseValue(e.target.value); setReverseResult(null); setReverseError(null) }}
              placeholder={`Enter ${BASES.find(b => b.key === reverseBase).label.toLowerCase()} value...`}
              onKeyDown={e => e.key === 'Enter' && handleReverse()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleReverse} style={{ marginBottom: '1rem' }}>Convert</button>
        </div>
        {reverseError && <div className="error-msg">⚠ {reverseError}</div>}
        {reverseResult !== null && (
          <div className="results" style={{ marginTop: '0.5rem' }}>
            {BASES.map(b => (
              <div key={b.key} className="result-card">
                <div className="base-label">{b.label}</div>
                <div className="value">{b.prefix}{b.base === 16 ? reverseResult.toString(b.base).toUpperCase() : reverseResult.toString(b.base)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="credit">
        Built by <a href="https://topanga.ludwitt.com">Topanga</a> for{' '}
        <a href="https://opensource.ludwitt.com">Ludwitt University</a>
        {' '}· ALC Path · Course 1: Introduction to Computer Science
      </div>
    </div>
  )
}
