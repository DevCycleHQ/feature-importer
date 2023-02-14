import { FeatureConfiguration, Operator, OperatorType } from '../../types/DevCycle'
import { Feature, FeatureKind } from '../../types/LaunchDarkly'
import { mockConfig } from './MockResponses'

export const updateFeatureWithUnsupportedRule: Feature = {
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
    'environments': {
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
    },
    'key': 'update-feature',
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
    ]
}
export const skipFeature: Feature = {
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
    'environments': {
        'production': {
            'on': false,
            'rules': [],
            'targets': [],
        },
        'test': {
            'on': true,
            'rules': [
                {
                    '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                    'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                    'clauses': [
                        {
                            '_id': 'asdfasd',
                            'attribute': 'country',
                            'negate': false,
                            'op': 'in',
                            'values': [
                                'CA',
                                'US'
                            ]
                        }
                    ],
                    'description': 'isCanada',
                    'trackEvents': false,
                    'variation': 0
                },
                {
                    '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                    'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                    'clauses': [
                        {
                            '_id': 'asdfasd',
                            'attribute': 'anonymous',
                            'negate': false,
                            'op': 'in',
                            'values': [
                                'true'
                            ]
                        }
                    ],
                    'description': 'isAnon',
                    'trackEvents': false,
                    'variation': 0
                }
            ],
            'targets': [],
        }
    },
    'key': 'skip-feature',
    'name': 'str-flag',
    'tags': [],
    'variations': [
        {
            '_id': '694a88a4-f043-4dfa-8e30-e24437d86635',
            'name': 'on ',
            'value': true
        },
        {
            '_id': '32208ca0-d0c7-4a82-b032-bf0c6126432e',
            'name': 'off',
            'value': false
        }
    ]

}

const environmentWithTarget = {
    'production': {
        'on': true,
        'rules': [
        ],
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

export const createFeatureWithTarget: Feature = {
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
    'environments': environmentWithTarget,
    'key': 'create-feature',
    'name': 'flag 123',
    'tags': [],
    'variations': [
        {
            '_id': '5750426e-32c3-4496-b80e-970ff42b3d1b',
            'value': true
        }
    ]
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
    'environments': {
        'production': {
            'on': true,
            'rules': [],
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
        'test': {
            'on': true,
            'rules': [
                {
                    '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                    'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                    'description': 'canadian',
                    'clauses': [
                        {
                            '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                            'attribute': 'country',
                            'negate': false,
                            'op': 'in',
                            'values': [
                                'CA',
                                'US'
                            ]
                        },
                        {
                            '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                            'attribute': 'email',
                            'negate': false,
                            'op': 'contains',
                            'values': [
                                'gmail'
                            ]
                        },
                        {
                            '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                            'attribute': 'key',
                            'negate': false,
                            'op': 'in',
                            'values': [
                                'blah',
                                'burp',
                                'bork'
                            ]
                        }
                    ],
                    'variation': 0,
                    trackEvents: false
                },
                {
                    '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                    'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                    'clauses': [
                        {
                            '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                            'attribute': 'anonymous',
                            'negate': false,
                            'op': 'in',
                            'values': [
                                'true'
                            ]
                        }
                    ],
                    'description': 'age',
                    'variation': 1,
                    trackEvents: false
                }
            ],
            'targets': [
                {
                    'values': [
                        'jamie',
                        'patel'
                    ],
                    'variation': 1
                }
            ],
        }
    },
    'key': 'update-feature',
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
    ]
}

export const featureConfigResponse: FeatureConfiguration = {
    targets: [],
    status: 'active'
}

const mockDvcAudienceResponse = {
    _id: 'id_123',
    _project: 'project_123',
    name: 'audience name',
    key: 'audience-key',
    description: 'audience description',
    filters: {
        filters: [],
        operator: 'and' as Operator['operator']
    },
}

const ldSegment = {
    name: 'segment 1',
    key: 'seg-1',
    description: 'my segment',
    tags: ['tag1', 'tag2'],
    creationDate: 123456789,
    rules: []
}

const expectedFilters = {
    operator: OperatorType.or,
    filters: []
}

const createResponse = {
    ...mockDvcAudienceResponse,
    name: ldSegment.name,
    key: mockConfig.projectKey,
    filters: expectedFilters,
}

export const mockAudienceResponse = {
    audiencesByKey: {
        [`${ldSegment.key}-production`]: createResponse
    },
    errorsByKey: {}
}