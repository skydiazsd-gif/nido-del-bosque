import type { BudgetItem, CabinDesign, Finish, InspirationItem, StudioState } from '../types'

export const AREA_LIMIT = 60
export const BUDGET_LIMIT = 80_000_000
export const STORAGE_KEY = 'nido-del-bosque:studio:v1'
export const DEFAULT_DESIGN: CabinDesign = {
  length: 9, width: 6, elevation: 2.6, roofPitch: 8,
  terraceWidth: 3, terraceDepth: 2, finish: 'natural',
}

export const FINISHES: { id: Finish; label: string; color: string; description: string }[] = [
  { id: 'natural', label: 'Natural timber', color: '#b68a5e', description: 'Warm timber · black metal' },
  { id: 'charcoal', label: 'Charcoal timber', color: '#394039', description: 'Dark cladding · warm wood' },
  { id: 'light', label: 'Light timber', color: '#dbc6a3', description: 'Pale timber · dark frames' },
  { id: 'mixed', label: 'Timber & concrete', color: '#99968b', description: 'Natural wood · mineral tones' },
]

export const DEFAULT_BUDGET: BudgetItem[] = [
  { id: 'site', label: 'Site preparation & foundations', amount: 8_000_000 },
  { id: 'structure', label: 'Structural frame & elevated platform', amount: 12_000_000 },
  { id: 'roof', label: 'Roof', amount: 6_000_000 },
  { id: 'walls', label: 'External walls & glazing', amount: 10_000_000 },
  { id: 'services', label: 'Electrical & plumbing', amount: 6_000_000 },
  { id: 'bathroom', label: 'Bathroom', amount: 4_000_000 },
  { id: 'kitchen', label: 'Kitchen', amount: 4_000_000 },
  { id: 'interiors', label: 'Interior finishes', amount: 4_000_000 },
  { id: 'furniture', label: 'Furniture & appliances', amount: 7_000_000 },
  { id: 'terrace', label: 'Terrace & staircase', amount: 4_000_000 },
  { id: 'parking', label: 'Parking', amount: 1_000_000 },
  { id: 'landscape', label: 'Landscaping', amount: 1_000_000 },
  { id: 'professional', label: 'Permits & professional services', amount: 5_000_000 },
  { id: 'contingency', label: 'Contingency', amount: 8_000_000 },
]

export function getAreas(design: CabinDesign) {
  const enclosed = design.length * design.width
  const terrace = design.terraceWidth * design.terraceDepth
  // 150 mm conceptual exterior walls plus indicative internal partitions.
  // Net area is an approximation, never a surveyed or engineered quantity.
  const insideLength = Math.max(0, design.length - 0.3)
  const insideWidth = Math.max(0, design.width - 0.3)
  const partitionArea = 0.15 * (insideWidth + insideLength / 3)
  return {
    enclosed, terrace, total: enclosed + terrace,
    estimatedNet: Math.max(0, insideLength * insideWidth - partitionArea),
  }
}

export const formatCOP = (amount: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(amount)

export function createDefaultStudio(): StudioState {
  return { design: { ...DEFAULT_DESIGN }, budget: DEFAULT_BUDGET.map(item => ({ ...item })), inspiration: [] }
}

type ReadStorage = Pick<Storage, 'getItem'>
type WriteStorage = Pick<Storage, 'setItem'>

function browserStorage(): Storage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage }
  catch { return undefined }
}

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

function isDesign(value: unknown): value is CabinDesign {
  if (!value || typeof value !== 'object') return false
  const d = value as CabinDesign
  return inRange(d.length, 6, 12) && inRange(d.width, 4, 8)
    && inRange(d.elevation, 2.2, 3.4) && inRange(d.roofPitch, 3, 18)
    && inRange(d.terraceWidth, 2, 6) && inRange(d.terraceDepth, 1, 3)
    && FINISHES.some(finish => finish.id === d.finish)
}

function isInspiration(value: unknown): value is InspirationItem {
  if (!value || typeof value !== 'object') return false
  const item = value as InspirationItem
  return typeof item.id === 'string' && typeof item.name === 'string'
    && typeof item.note === 'string' && item.note.length <= 10_000
    && ['Exterior', 'Interior', 'Landscaping', 'Amenities'].includes(item.category)
    && typeof item.image === 'string' && item.image.length <= 4_200_000
    && /^data:image\/(png|jpeg|webp|gif);base64,/.test(item.image)
}

export function loadStudio(storage: ReadStorage | undefined = browserStorage()): StudioState {
  const defaults = createDefaultStudio()
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const stored = JSON.parse(raw) as { version?: number; state?: Partial<StudioState> }
    if (stored.version !== 1 || !stored.state) return defaults
    const saved = stored.state
    if (isDesign(saved.design)) defaults.design = saved.design
    if (Array.isArray(saved.budget)) {
      defaults.budget = defaults.budget.map(base => {
        const savedItem = saved.budget!.find(item => item?.id === base.id)
        return savedItem && inRange(savedItem.amount, 0, 1_000_000_000_000)
          ? { ...base, amount: savedItem.amount } : base
      })
    }
    if (Array.isArray(saved.inspiration)) defaults.inspiration = saved.inspiration.filter(isInspiration).slice(0, 20)
    return defaults
  } catch { return defaults }
}

export function saveStudio(state: StudioState, storage: WriteStorage | undefined = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state }))
    return true
  } catch { return false }
}
