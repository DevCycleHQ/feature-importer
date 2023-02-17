import { FeatureType, OperatorType } from '../../../types/DevCycle'

export const mockDVCFeaturesResponse = [{
    _id: '123',
    _project: 'project',
    name: 'duplicate feature name',
    description: 'duplicate feature description',
    key: 'duplicate-key',
    type: FeatureType.release,
    variations: [
        {
            key: 'off',
            name: 'off variation',
            variables: {}
        },
        {
            key: 'on',
            name: 'on variation',
            variables: {}
        }
    ],
    variables: [],
    tags: []
}]

export const mockAudience = {
    _id: '123',
    _project: 'project',
    name: 'audience 1',
    key: 'aud-1',
    description: 'a new audience',
    filters: {
        filters: [],
        operator: OperatorType.and
    },
    tags: ['tag1']
}
