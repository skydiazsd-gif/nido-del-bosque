export type Finish = 'natural' | 'charcoal' | 'light' | 'mixed'

export interface CabinDesign {
  length: number
  width: number
  elevation: number
  roofPitch: number
  terraceWidth: number
  terraceDepth: number
  finish: Finish
}

export interface BudgetItem {
  id: string
  label: string
  amount: number
}

export interface InspirationItem {
  id: string
  name: string
  category: 'Exterior' | 'Interior' | 'Landscaping' | 'Amenities'
  note: string
  image: string
}

export interface StudioState {
  design: CabinDesign
  budget: BudgetItem[]
  inspiration: InspirationItem[]
}
