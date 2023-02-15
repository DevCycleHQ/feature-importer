import { FeatureConfiguration, OperatorType } from '../../types/DevCycle'
import { Feature, FeatureKind } from '../../types/LaunchDarkly'

export const mockFeature = {
    'description': '',
    'kind': FeatureKind.boolean,
    _version: 123,
    creationDate: 123,
    includeInSnippet: true,
    clientSideAvailability: {
        usingEnvironmentIds: true,
        usingMobileKey: true
    },
    temporary: true,
    _links: {
        self: {
            href: 'string',
            type: 'string'
        }
    },
    maintainerId: 'string',
    'key': 'mock-feature',
    'name': 'flag 123',
    'tags': [],
    'variations': [
        {
            '_id': '5750426e-32c3-4496-b80e-970ff42b3d1b',
            'value': true
        },
        {
            '_id': 'c24ce765-b79f-4f75-bf88-c940957d657e',
            'value': false
        }
    ],
}

const environmentWithTarget = {
    'production': {
        'on': true,
        'rules': [],
        'targets': [
            {
                'values': [
                    'patel',
                    'jamie'
                ],
                'variation': 0
            }
        ],
    },

}

const environmentWithRule = {
    'production': {
        'on': true,
        'rules': [
            {
                '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'description': 'gmail',
                'clauses': [
                    {
                        '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                        'attribute': 'email',
                        'negate': false,
                        'op': 'contains',
                        'values': [
                            'gmail'
                        ]
                    },
                ],
                'variation': 0,
                trackEvents: false
            },
        ],
        'targets': [],
    },
}

const environmentWithSegmentMatch = {
    'production': {
        'on': true,
        'rules': [
            {
                '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'description': 'canadian',
                'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'clauses': [
                    {
                        '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                        'attribute': 'segmentMatch',
                        'negate': false,
                        'op': 'segmentMatch',
                        'values': [
                            'seg-1'
                        ]
                    }
                ],
                'trackEvents': false,
                'variation': 0
            }
        ],
        'targets': [],
    },
}

const environmentWithSemVerEqual = {
    'production': {
        'on': true,
        'rules': [
            {
                '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'description': 'canadian',
                'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'clauses': [
                    {
                        '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                        'attribute': 'segmentMatch',
                        'negate': false,
                        'op': 'semVerEqual',
                        'values': [
                            '2.0.2'
                        ]
                    }
                ],
                'trackEvents': false,
                'variation': 0
            }
        ],
        'targets': [
            {
                'values': [
                    'patel',
                    'jamie'
                ],
                'variation': 1
            }
        ],
    },
}

export const createFeatureWithTarget: Feature = {
    ...mockFeature,
    'environments': environmentWithTarget,
}

export const createFeatureWithRule: Feature = {
    ...createFeatureWithTarget,
    environments: environmentWithRule
}

export const createFeatureWithSegmentMatch: Feature = {
    ...createFeatureWithTarget,
    environments: environmentWithSegmentMatch
}

export const updateFeature: Feature = {
    ...mockFeature,
    'key': 'update-feature',
    'environments': environmentWithTarget,
}

export const featureConfigResponse: FeatureConfiguration = {
    targets: [],
    status: 'active'
}

export const updateFeatureWithUnsupportedRule: Feature = {
    ...mockFeature,
    'environments': environmentWithSemVerEqual,
    'key': 'update-feature',
}
export const skipFeature: Feature = {
    ...mockFeature,
    'key': 'skip-feature',
    'environments': environmentWithRule,
}

export const mockAudience = {
    'seg-1-production': {
        _id: 'id_123',
        _project: 'project_123',
        name: 'segment 1',
        key: 'project-key',
        description: 'audience description',
        filters: { operator: OperatorType.or, filters: [] }
    }
}
