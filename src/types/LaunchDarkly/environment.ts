export type Environment = {
    _id: string
    key: string
    name: string
    color: string
}

export type Environments = {
    totalCount: number
    items: Environment[]
}