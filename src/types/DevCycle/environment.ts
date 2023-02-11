export type EnvironmentPayload = {
    name: string
    key: string
    type: string
    description?: string
    color?: string
}

export type EnvironmentResponse = {
    _id: string
    _project: string
    name: string
    key: string
    type: string
    color: string
    _createdBy: string
    createdAt: string
    updatedAt: string
    sdkKeys: Record<string, unknown>
}

export enum EnvironmentType {
    Dev = 'development',
    Staging = 'staging',
    Prod = 'production',
    Recovery = 'disaster_recovery'
}