import { FeatureType } from '../../types/DevCycle'

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
