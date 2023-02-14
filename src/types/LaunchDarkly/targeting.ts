export type Clause = {
    _id?: string
    attribute: string
    negate: boolean
    op: string
    values: any[]
}

export type Rule = {
    _id: string
    clauses: Clause[]
    description?: string
    variation?: number
}

export type Target = {
    values: string[]
    variation: number
}
