export type LDFeature = {
    name: string
    kind: 'string' | 'number' | 'boolean' | 'json'
    description: string
    key: string
    _version: number
    creationDate: number
    includeInSnippet: boolean
    clientSideAvailability: {
        usingEnvironmentIds: boolean
        usingMobileKey: boolean
    }
    variations: {
        _id: string
        value: boolean
    }[]
    temporary: boolean
    tags: string[]
    _links: {
        self: {
            href: string
            type: string
        }
    }
    maintainerId: string
}

export type LDEnvironment = {
    _id: string
    key: string
    name: string
    color: string
}

export type LDEnvironments = {
    totalCount: number
    items: LDEnvironment[]
}
