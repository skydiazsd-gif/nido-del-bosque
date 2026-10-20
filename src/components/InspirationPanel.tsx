import { useRef, useState } from 'react'
import { ImagePlus, Leaf, Trash2, Upload } from 'lucide-react'
import type { InspirationItem } from '../types'

interface InspirationPanelProps {
  items: InspirationItem[]
  onChange: (items: InspirationItem[]) => void
}

const categories: InspirationItem['category'][] = ['Exterior', 'Interior', 'Landscaping', 'Amenities']
const maxFileBytes = 3 * 1024 * 1024
const maxInspirationItems = 20

function ConceptCue({ variant }: { variant: 'architecture' | 'interior' | 'landscape' }) {
  if (variant === 'architecture') return (
    <svg viewBox="0 0 400 260" role="img" aria-label="Original illustration of a timber cabin among trees">
      <rect width="400" height="260" fill="#e7e6da" /><path d="M0 203 124 190l276 32v38H0" fill="#c3c8b4" />
      <path d="m62 47-28 118h56L62 47m258-24-40 151h80L320 23" fill="#93a18a" /><path d="M62 150v71m258-63v75" stroke="#64715d" strokeWidth="5" />
      <path d="m104 108 154-15 48 36-151 19Z" fill="#313e36" /><path d="m112 112 146-14v79l-146 15Z" fill="#ac8158" /><path d="m258 98 40 31v76l-40-28Z" fill="#896744" />
      <path d="m126 128 48-4v52l-48 5Zm58-5 59-6v52l-59 6Z" fill="#6c8177" /><path d="m134 133 30-3m26 1 44-4" stroke="#b0c2b5" strokeWidth="2" />
      <path d="M126 190v38m116-51v38m43-15v34" stroke="#404c40" strokeWidth="6" /><path d="m104 194 145-15 18 13-145 16Z" fill="#b9a085" />
    </svg>
  )
  if (variant === 'interior') return (
    <svg viewBox="0 0 400 260" role="img" aria-label="Original illustration of a warm wood interior">
      <rect width="400" height="260" fill="#e8dfcf" /><path d="m0 186 204-26 196 26v74H0Z" fill="#bc9b77" /><path d="M234 0h166v186l-166-25Z" fill="#b0baaa" />
      <path d="M234 0v161m80-161v174m85-174v187" stroke="#3d4d40" strokeWidth="7" /><path d="m253 121 35-65 35 66m-20-5 35-75 35 88" fill="#7c907c" />
      <rect x="41" y="122" width="131" height="66" rx="9" fill="#b4b29b" /><rect x="54" y="112" width="50" height="48" rx="6" fill="#ceccb9" /><rect x="110" y="112" width="49" height="48" rx="6" fill="#d7d0bb" />
      <ellipse cx="222" cy="206" rx="71" ry="12" fill="#a78866" /><ellipse cx="222" cy="192" rx="45" ry="15" fill="#d6bc96" /><path d="M193 199v23m58-23v23" stroke="#6c6650" strokeWidth="5" />
      <path d="M105 18v51m-18 0h36l12 24H75Z" fill="#bd9b69" stroke="#bd9b69" strokeWidth="3" />
    </svg>
  )
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label="Original illustration of a woodland garden and path">
      <rect width="400" height="260" fill="#dce2d5" /><path d="M0 180q100-38 201 0t199-8v88H0Z" fill="#a2b398" /><path d="M184 260q-22-50 31-85t-14-50h23q69 26 24 63t31 72" fill="#d3c6ad" />
      <path d="m66 23-43 151h86L66 23m79 37-35 132h70L145 60m184-43-42 157h84L329 17" fill="#647c63" /><path d="M66 160v64m79-43v42m184-66v62" stroke="#6b7157" strokeWidth="6" />
      <ellipse cx="315" cy="222" rx="35" ry="10" fill="#7d8d70" /><path d="m287 204 27-6 27 6v9h-54Z" fill="#ad8b60" /><path d="M294 211v15m40-15v15" stroke="#6c6851" strokeWidth="5" />
      <circle cx="34" cy="232" r="14" fill="#829571" /><circle cx="108" cy="242" r="19" fill="#8e9f7b" />
    </svg>
  )
}

export default function InspirationPanel({ items, onChange }: InspirationPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function addImage(file: File | undefined) {
    if (!file) return
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    if (items.length >= maxInspirationItems) {
      setError('Your board has reached 20 images. Remove a reference before adding another.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG or WebP image. SVG files are not supported.')
      return
    }
    if (file.size > maxFileBytes) {
      setError('Choose an image smaller than 3 MB to keep your local board lightweight.')
      return
    }
    setLoading(true)
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image could not be read'))
        reader.onerror = () => reject(new Error('Image could not be read'))
        reader.onabort = () => reject(new Error('Image reading was interrupted'))
        reader.readAsDataURL(file)
      })
      onChange([...items, { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ''), category: 'Exterior', note: '', image }])
    } catch {
      setError('This image could not be read. Please try another file.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function updateItem(id: string, patch: Partial<InspirationItem>) {
    onChange(items.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  return (
    <section className="inspiration-panel" aria-labelledby="inspiration-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A shared visual language</p>
          <h2 id="inspiration-heading">Collect what feels like home.</h2>
          <p className="muted">Keep textures, spaces and little details that bring your forest retreat to life.</p>
        </div>
        <button className="button button-primary" onClick={() => inputRef.current?.click()} disabled={loading}><ImagePlus size={17} /> {loading ? 'Adding image…' : 'Add inspiration'}</button>
        <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload inspiration image" onChange={(event) => { void addImage(event.target.files?.[0]) }} />
      </div>
      <p className="inspiration-storage-note"><Upload size={14} /> JPEG, PNG or WebP · up to 3 MB each · {items.length} of 20 references · saved only in this browser</p>
      {error && <p className="notice" role="alert">{error}</p>}

      {items.length > 0 ? <div className="inspiration-grid">
        {items.map((item) => <article className="inspiration-card" key={item.id}>
          <div className="inspiration-image"><img src={item.image} alt={item.name} loading="lazy" /><button className="icon-button remove-inspiration" aria-label={`Remove ${item.name}`} title="Remove image" onClick={() => onChange(items.filter((image) => image.id !== item.id))}><Trash2 size={17} /></button></div>
          <div className="inspiration-card-body">
            <label className="field-label" htmlFor={`name-${item.id}`}>Reference title</label>
            <input id={`name-${item.id}`} className="text-input" value={item.name} maxLength={120} onChange={(event) => updateItem(item.id, { name: event.target.value })} />
            <label className="field-label" htmlFor={`category-${item.id}`}>Category</label>
            <select id={`category-${item.id}`} className="text-input" value={item.category} onChange={(event) => updateItem(item.id, { category: event.target.value as InspirationItem['category'] })}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
            <label className="field-label" htmlFor={`note-${item.id}`}>What do you love about it?</label>
            <textarea id={`note-${item.id}`} className="text-input" rows={3} value={item.note} maxLength={1000} placeholder="A texture, a feeling, a clever little detail…" onChange={(event) => updateItem(item.id, { note: event.target.value })} />
          </div>
        </article>)}
      </div> : <>
        <div className="inspiration-empty"><Leaf size={22} /><p>Your board begins with a feeling.</p><span>Add your own references above. These original illustrations are just starting cues.</span></div>
        <div className="inspiration-grid concept-grid">
          {[
            { variant: 'architecture' as const, name: 'A lighter footprint', category: 'Exterior', description: 'Simple timber forms, dark details and a quiet place among the trees.' },
            { variant: 'interior' as const, name: 'Warmth from within', category: 'Interior', description: 'Natural textures, soft light and a generous connection to the woodland.' },
            { variant: 'landscape' as const, name: 'Let the forest lead', category: 'Landscaping', description: 'Gentle paths, private corners and landscape that belongs to its setting.' },
          ].map((cue) => <article key={cue.variant} className="inspiration-card concept-card"><ConceptCue variant={cue.variant} /><div className="inspiration-card-body"><span className="eyebrow">{cue.category} · original concept cue</span><h3>{cue.name}</h3><p>{cue.description}</p></div></article>)}
        </div>
      </>}
      <p className="panel-footnote">Your images stay on this device. Clearing browser data removes the board; keep original files somewhere safe.</p>
    </section>
  )
}
