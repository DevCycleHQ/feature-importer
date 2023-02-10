export type ProjectResponse = {
    _id: string
    _organization: string
    _createdBy: string
    name: string
    key: string
    description?: string
    color?: string
    createdAt: string
    updatedAt: string
    hasJiraIntegration: boolean
}

export type ProjectPayload = {
    name: string
    key: string
    description?: string
    color?: string
}