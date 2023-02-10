import { Environment } from './environment'

export type ProjectResponse = {
    _id: string
    key: string
    name: string
    tags: string[]
    environments: {
        totalCount: number
        items: Environment[]
    }
}