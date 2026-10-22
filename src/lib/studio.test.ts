import { describe, expect, it } from 'vitest'
import { AREA_LIMIT, BUDGET_LIMIT, createDefaultStudio, DEFAULT_DESIGN, getAccessLayout, getAreas, loadStudio, saveStudio, STORAGE_KEY } from './studio'

describe('concept quantities', () => {
  it('counts the full frontage balcony and separate side landing', () => {
    const areas = getAreas(DEFAULT_DESIGN)
    expect(areas.enclosed).toBe(54)
    expect(areas.terrace).toBe(18)
    expect(areas.landing).toBeCloseTo(2.88)
    expect(areas.total).toBeCloseTo(74.88)
    expect(areas.total).toBeGreaterThan(AREA_LIMIT)
    expect(areas.estimatedNet).toBeLessThan(areas.enclosed)
    expect(areas.estimatedNet).toBeGreaterThan(45)
  })
  it('counts changed cabin and terrace dimensions together against the allowance', () => {
    const areas = getAreas({ ...DEFAULT_DESIGN, length: 10, terraceDepth: 3 })
    expect(areas.terrace).toBe(30)
    expect(areas.total).toBeCloseTo(92.88)
    expect(areas.total).toBeGreaterThan(AREA_LIMIT)
  })
  it('keeps the stairs outside the left wall and connects the landing to the balcony', () => {
    for (const length of [6, 9, 12]) {
      for (const terraceDepth of [1, 2, 3]) {
        const design = { ...DEFAULT_DESIGN, length, terraceDepth }
        const access = getAccessLayout(design)
        expect(access.balconyWidth).toBe(length)
        expect(access.landingCenterX + access.landingWidth / 2).toBeCloseTo(-length / 2)
        expect(access.landingBack).toBeLessThan(access.doorZ - 0.55)
        expect(access.landingFront).toBeGreaterThan(design.width / 2)
        expect(access.landingFront).toBeLessThanOrEqual(design.width / 2 + terraceDepth)
      }
    }
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
    expect(JSON.parse(data.get(STORAGE_KEY)!)).toHaveProperty('version', 2)
  })
  it('migrates a saved V1 partial terrace while retaining dimensions, budget and references', () => {
    const oldState = createDefaultStudio()
    oldState.design.length = 10
    oldState.design.finish = 'light'
    oldState.budget[0].amount = 9_500_000
    oldState.inspiration.push({ id: 'saved', name: 'Trees', category: 'Landscaping', note: 'Retain', image: 'data:image/png;base64,AA==' })
    const oldDesign = { ...oldState.design, terraceWidth: 3 }
    const migrated = loadStudio({ getItem: () => JSON.stringify({ version: 1, state: { ...oldState, design: oldDesign } }) })
    expect(migrated.design).toEqual(oldState.design)
    expect(migrated.design).not.toHaveProperty('terraceWidth')
    expect(getAreas(migrated.design).terrace).toBe(20)
    expect(migrated.budget).toEqual(oldState.budget)
    expect(migrated.inspiration).toEqual(oldState.inspiration)
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
