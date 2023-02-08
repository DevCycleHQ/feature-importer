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
    rules: Rule[]
}

export type Rule = {
    _id?: string
    clauses: Clause[]
    weight?: number
}

export type Clause = {
    _id?: string
    attribute: string
    negate: boolean
    op: string
    values: any[]
}