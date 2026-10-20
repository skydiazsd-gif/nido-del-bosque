import { describe, expect, it } from 'vitest'
import { AREA_LIMIT, BUDGET_LIMIT, createDefaultStudio, DEFAULT_DESIGN, getAreas, loadStudio, saveStudio, STORAGE_KEY } from './studio'

describe('concept quantities', () => {
  it('starts at 54 m² gross enclosed plus a 6 m² terrace', () => {
    const areas = getAreas(DEFAULT_DESIGN)
    expect(areas.enclosed).toBe(54)
    expect(areas.terrace).toBe(6)
    expect(areas.total).toBe(AREA_LIMIT)
    expect(areas.estimatedNet).toBeLessThan(areas.enclosed)
    expect(areas.estimatedNet).toBeGreaterThan(45)
  })
  it('counts changed cabin and terrace dimensions together against the allowance', () => {
    const areas = getAreas({ ...DEFAULT_DESIGN, length: 10, terraceDepth: 3 })
    expect(areas.total).toBe(69)
    expect(areas.total).toBeGreaterThan(AREA_LIMIT)
  })
  it('allocates the initial COP 80M reverse budget including contingency', () => {
    const { budget } = createDefaultStudio()
    expect(budget.reduce((sum, item) => sum + item.amount, 0)).toBe(BUDGET_LIMIT)
    expect(budget.find(item => item.id === 'contingency')?.amount).toBe(8_000_000)
  })
})

describe('saved studio', () => {
  it('round-trips a changed design, editable budget and inspiration image', () => {
    const data = new Map<string, string>()
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
    const state = createDefaultStudio()
    state.design.finish = 'charcoal'
    state.budget[0].amount = 12_000_000
    state.inspiration.push({ id: 'one', name: 'Timber reference', category: 'Exterior', note: 'Vertical cladding', image: 'data:image/png;base64,AA==' })
    expect(saveStudio(state, storage)).toBe(true)
    expect(loadStudio(storage)).toEqual(state)
    expect(JSON.parse(data.get(STORAGE_KEY)!)).toHaveProperty('version', 1)
  })
  it('recovers from malformed or inaccessible browser storage', () => {
    expect(loadStudio({ getItem: () => '{broken' })).toEqual(createDefaultStudio())
    expect(loadStudio({ getItem: () => { throw new Error('blocked') } })).toEqual(createDefaultStudio())
    expect(saveStudio(createDefaultStudio(), { setItem: () => { throw new Error('quota') } })).toBe(false)
  })
  it('rejects out-of-range dimensions, negative costs and unsafe image URLs', () => {
    const state = createDefaultStudio()
    state.design.length = -4
    state.budget[0].amount = -1
    state.inspiration.push({ id: 'bad', name: 'bad', category: 'Exterior', note: '', image: 'javascript:alert(1)' })
    const loaded = loadStudio({ getItem: () => JSON.stringify({ version: 1, state }) })
    expect(loaded.design).toEqual(DEFAULT_DESIGN)
    expect(loaded.budget[0].amount).toBe(8_000_000)
    expect(loaded.inspiration).toEqual([])
  })
})
