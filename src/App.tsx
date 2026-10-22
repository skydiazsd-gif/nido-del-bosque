import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, Check, ChevronRight, CircleHelp, Leaf, MapPin, RotateCcw, Trees } from 'lucide-react'
import CabinScene from './components/CabinScene'
import FloorPlan from './components/FloorPlan'
import BudgetPanel from './components/BudgetPanel'
import InspirationPanel from './components/InspirationPanel'
import { AREA_LIMIT, BUDGET_LIMIT, DEFAULT_DESIGN, FINISHES, formatCOP, getAreas, loadStudio, saveStudio } from './lib/studio'
import type { CabinDesign } from './types'

type Tab = 'studio' | 'budget' | 'inspiration'
const tabs: { id: Tab; label: string; number: string }[] = [{ id: 'studio', label: 'Design studio', number: '01' }, { id: 'budget', label: 'Budget', number: '02' }, { id: 'inspiration', label: 'Inspiration', number: '03' }]

function DimensionControl({ label, value, min, max, step, unit = 'm', onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }) {
  const id = label.toLowerCase().replaceAll(' ', '-')
  return <div className="dimension-control"><div className="control-heading"><label htmlFor={id}>{label}</label><output htmlFor={id}>{unit === '°' ? value.toFixed(0) : value.toFixed(1)} <span>{unit}</span></output></div><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><div className="range-limits"><span>{min} {unit}</span><span>{max} {unit}</span></div></div>
}

export default function App() {
  const [state, setState] = useState(loadStudio)
  const [activeTab, setActiveTab] = useState<Tab>('studio')
  const [storageError, setStorageError] = useState(false)
  const areas = getAreas(state.design)
  const totalBudget = state.budget.reduce((sum, item) => sum + item.amount, 0)
  const areaExceeded = areas.total > AREA_LIMIT
  useEffect(() => { setStorageError(!saveStudio(state)) }, [state])
  function changeDesign<K extends keyof CabinDesign>(key: K, value: CabinDesign[K]) {
    setState((current) => ({ ...current, design: { ...current.design, [key]: value } }))
  }
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#" aria-label="Nido del Bosque home" onClick={() => setActiveTab('studio')}><span className="brand-mark"><Trees size={25} strokeWidth={1.3} /></span><span>Nido del Bosque<small>AN ARCHITECTURAL EXPLORATION</small></span></a>
        <div className="header-location"><MapPin size={14} /><span>Santa Elena, Colombia</span></div>
        <span className="project-status"><span />Concept phase <span className="status-divider">/</span> 2027</span>
      </header>
      <main>
        <section className="intro-section">
          <div><div className="eyebrow intro-eyebrow"><span className="tiny-line" /> A FOREST RETREAT, TAKING SHAPE</div><h1>A little closer<br />to the <em>forest.</em></h1></div>
          <div className="intro-copy"><span className="intro-index">6.265737° N &nbsp; 75.504737° W</span><p>A place to disconnect.<br />A space to make your own.</p><span className="intro-caption">Explore the possibilities for a contemporary<br className="desktop-break" /> woodland cabin in Santa Elena.</span><a className="text-link" href="#workspace">Enter the studio <ArrowDown size={15} /></a></div>
        </section>
        <div className="project-strip"><div><Leaf size={16} /><span>CONTEMPORARY ELEVATED CABIN</span><span className="strip-dot">·</span><span>VERSION 02</span></div><span className="local-save"><span />{storageError ? 'Changes not saved' : 'Saved on this device'}</span></div>
        {storageError && <p role="alert" className="storage-error">Your browser could not save these changes. They are available in this session. Remove some inspiration images or allow browser storage to save them.</p>}
        <section id="workspace" className="workspace" aria-label="Design workspace">
          <nav className="studio-tabs" role="tablist" aria-label="Studio sections">{tabs.map((tab, index) => <button key={tab.id} id={`tab-${tab.id}`} role="tab" aria-label={tab.label} tabIndex={activeTab === tab.id ? 0 : -1} aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => setActiveTab(tab.id)} onKeyDown={(event) => { const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1; if (next >= 0) { event.preventDefault(); setActiveTab(tabs[next].id); document.getElementById(`tab-${tabs[next].id}`)?.focus() } }}><span>{tab.number}</span>{tab.label}{activeTab === tab.id && <span className="tab-current" />}</button>)}</nav>
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'studio' && <>
              <div className="studio-heading"><div><h2>Your cabin, your perspective.</h2><p>Start with a simple form. Explore what feels right.</p></div><button className="quiet-button" onClick={() => setState((current) => ({ ...current, design: { ...DEFAULT_DESIGN } }))}><RotateCcw size={14} />Reset design</button></div>
              <div className="studio-grid">
                <div className="model-panel"><div className="model-topline"><span><span className="model-status-dot" />LIVE CONCEPT MODEL</span><span>{areas.enclosed.toFixed(1)} m² ENCLOSED</span></div><div className="model-stage"><CabinScene design={state.design} /></div><div className="model-caption"><span>Contemporary Elevated Cabin — V2</span><span>Drag to rotate <span>·</span> Scroll to zoom</span></div></div>
                <aside className="configuration-panel" aria-label="Cabin configuration"><div className="config-heading"><span className="eyebrow">MAKE IT YOURS</span><h3>Explore the form</h3><p>Every adjustment updates the model.</p></div>
                  <div className="dimensions-grid"><DimensionControl label="Cabin length" value={state.design.length} min={6} max={12} step={0.5} onChange={(v) => changeDesign('length', v)} /><DimensionControl label="Cabin width" value={state.design.width} min={4} max={8} step={0.5} onChange={(v) => changeDesign('width', v)} /><DimensionControl label="Elevation" value={state.design.elevation} min={2.2} max={3.4} step={0.1} onChange={(v) => changeDesign('elevation', v)} /><DimensionControl label="Roof pitch" value={state.design.roofPitch} min={3} max={18} step={1} unit="°" onChange={(v) => changeDesign('roofPitch', v)} /><div className="dimension-control"><div className="control-heading"><label htmlFor="balcony-width">Balcony width</label><output id="balcony-width" aria-label="Balcony width">{state.design.length.toFixed(1)} <span>m</span></output></div><p className="fine-print">Spans the full cabin frontage</p></div><DimensionControl label="Balcony depth" value={state.design.terraceDepth} min={1} max={3} step={0.5} onChange={(v) => changeDesign('terraceDepth', v)} /></div>
                  <fieldset className="finish-fieldset"><legend>Exterior palette</legend><div className="finish-options">{FINISHES.map((finish) => <button key={finish.id} className={`finish-option ${state.design.finish === finish.id ? 'selected' : ''}`} aria-label={finish.label} aria-pressed={state.design.finish === finish.id} title={finish.description} onClick={() => changeDesign('finish', finish.id)}><span className="finish-swatch" style={{ background: finish.color }}>{state.design.finish === finish.id && <Check size={17} />}</span><span>{finish.label}</span></button>)}</div></fieldset>
                  <div className="area-indicator" data-over-limit={areaExceeded}><div><span>PROPOSED GROSS AREA</span><strong data-testid="total-area">{areas.total.toFixed(1)}<small> / {AREA_LIMIT} m²</small></strong></div><span className={`area-status ${areaExceeded ? 'exceeded' : ''}`}>{areaExceeded ? 'Over allowance' : 'Within allowance'}</span><div className="area-track"><span style={{ width: `${Math.min(areas.total / AREA_LIMIT * 100, 100)}%` }} /></div><p>{areas.enclosed.toFixed(1)} m² enclosed + {areas.terrace.toFixed(1)} m² balcony + {areas.landing.toFixed(1)} m² side landing</p>{areaExceeded && <p role="alert">The full-width balcony and side landing count toward this concept total. Reduce the footprint or balcony depth to fit the owner-reported allowance; stair classification still needs confirmation.</p>}</div>
                </aside>
              </div>
              <div className="concept-note"><CircleHelp size={17} /><p>A design exploration, ready for a professional conversation. Elevation, parking clearances, stairs, structure and area rules need verification. A rooftop terrace is excluded from this baseline and remains unapproved.</p></div>
              <FloorPlan design={state.design} />
            </>}
            {activeTab === 'budget' && <BudgetPanel items={state.budget} design={state.design} onChange={(budget) => setState((current) => ({ ...current, budget }))} />}
            {activeTab === 'inspiration' && <InspirationPanel items={state.inspiration} onChange={(inspiration) => setState((current) => ({ ...current, inspiration }))} />}
          </div>
        </section>
        <section className="next-chapter"><div><span className="eyebrow">THE NEXT CHAPTER</span><h2>Good ideas begin<br />with better questions.</h2></div><div className="next-step-list"><div><span>01</span><p>Understand the land<small>Survey, levels, access and existing trees.</small></p><ArrowUpRight size={17} /></div><div><span>02</span><p>Validate the possibilities<small>Written area rules and structural feasibility.</small></p><ArrowUpRight size={17} /></div><div><span>03</span><p>Bring the numbers into focus<small>Local itemised quotes against the {formatCOP(BUDGET_LIMIT)} ceiling.</small></p><ArrowUpRight size={17} /></div></div></section>
      </main>
      <footer className="site-footer"><div className="footer-brand"><Trees size={18} /><span>Nido del Bosque</span></div><span>Rooted in nature. Designed for possibility.</span><span>CONCEPT STUDIO <ChevronRight size={12} /> V0.1</span></footer>
      <div className="mobile-summary"><span>Proposed area <strong>{areas.total.toFixed(1)} m²</strong></span><span>Budget allocated <strong>{(totalBudget / BUDGET_LIMIT * 100).toFixed(0)}%</strong></span></div>
    </div>
  )
}
