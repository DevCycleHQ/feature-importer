import { Clause } from './targeting'

export type SegmentResponse = {
    items: Segment[]
}

export type Segment = {
    name: string
    description?: string
    tags: string[]
    creationDate: number
    key: string
    included?: string[]
    excluded?: string[]
    rules: SegmentRule[]
}

export type SegmentRule = {
    _id?: string
    clauses: Clause[]
    weight?: number
}