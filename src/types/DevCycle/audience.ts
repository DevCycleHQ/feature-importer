export type AudienceResponse = {
    _id: string
    _project: string
    name?: string
    key?: string
    description?: string
    filters: {
        filters: FilterOrOperator[]
        operator: 'or' | 'and'
    }
    tags?: string[]
}

export type AudiencePayload = {
    name?: string
    key?: string
    description?: string
    filters: {
        filters: FilterOrOperator[]
        operator: 'or' | 'and'
    }
    tags?: string[]
}

export type FilterOrOperator = Filter | Operator

export type Filter = {
    type: string
    subType?: string
    comparator?: string
    values?: any[]
    _audiences?: string[]
}

export type Operator = {
    operator: 'or' | 'and'
    filters: FilterOrOperator[]
}