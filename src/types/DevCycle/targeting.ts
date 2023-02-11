import { AudiencePayload } from './audience'
import { Feature } from './feature'

export type TargetingRule = {
    _id?: string
    name?: string
    rollout?: {
        startPercentage: number
        type: string
        startDate: string
        stages: {
            percentage: number
            type: string
            date: string
        }[]
    }
    distribution: {
        percentage: number
        _variation: string
    }[]
    audience: AudiencePayload

}

export type FeatureConfiguration = {
    targets: TargetingRule[],
    status: 'active' | 'inactive' | 'archived'
}
