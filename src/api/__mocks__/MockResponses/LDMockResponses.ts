import { FeatureType, VariableType } from '../../../types/DevCycle'
import { FeatureKind } from '../../../types/LaunchDarkly'

export const mockLDFeaturesFlags = {
    items: [
        {
            key: 'feature-key',
            name: 'feature name',
            description: 'feature description',
            tags: [],
            on: true,
            offVariation: 0,
            variations: [
                {
                    _id: '123',
                    value: false,
                },

                {
                    _id: '456',
                    value: true,
                }
            ],
            fallthrough: {
                variation: 1
            },
            targets: [],
            kind: FeatureKind.boolean,
            _version: 1,
            creationDate: 1,
            includeInSnippet: true,
            maintainerId: '123',
            environments: {
                '123': {
                    on: true,
                    targets: [],
                    rules: []
                }
            },
            clientSideAvailability: {
                usingEnvironmentIds: true,
                usingMobileKey: false
            }
        },
        {
            key: 'feature-key-2',
            name: 'feature name 2',
            description: 'feature description 2',
            tags: [],
            on: true,
            offVariation: 0,
            variations: [
                {
                    _id: '123',
                    value: 'off',
                },
                {
                    _id: '456',
                    value: 'on',
                }
            ],
            fallthrough: {
                variation: 1
            },
            targets: [],
            kind: FeatureKind.multivariate,
            _version: 1,
            creationDate: 1,
            maintainerId: '123',
            environments: {
                '123': {
                    on: true,
                    targets: [],
                    rules: []
                }
            }
        },
        {
            key: 'duplicate-key',
            name: 'duplicate feature name',
            description: 'duplicate feature description',
            tags: [],
            on: true,
            offVariation: 0,
            variations: [
                {
                    _id: '123',
                    value: false,
                },
                {
                    _id: '456',
                    value: true,
                }
            ],
            fallthrough: {
                variation: 1
            },
            targets: [],
            kind: FeatureKind.boolean,
            _version: 1,
            creationDate: 1,
            maintainerId: '123',
            environments: {
                '123': {
                    on: true,
                    targets: [],
                    rules: []
                }
            }
        }
    ]
}

export const mockLDFeaturesMappedToDVC = [
    {
        'name': 'feature name',
        'description': 'feature description',
        'type': FeatureType.release,
        'key': 'feature-key',
        'variations': [
            {
                'name': 'Variation 1',
                'key': 'variation-1',
                'variables': {
                    'feature-key': false
                }
            },
            {
                'name': 'Variation 2',
                'key': 'variation-2',
                'variables': {
                    'feature-key': true
                }
            }
        ],
        'variables': [
            {
                'key': 'feature-key',
                'type': VariableType.boolean
            }
        ],
        'tags': [],
        'sdkVisibility': {
            'mobile': false,
            'client': true,
            'server': true
        }
    },
    {
        'name': 'feature name 2',
        'description': 'feature description 2',
        'type': FeatureType.release,
        'key': 'feature-key-2',
        'variations': [
            {
                'name': 'Variation 1',
                'key': 'variation-1',
                'variables': {
                    'feature-key-2': 'off'
                }
            },
            {
                'name': 'Variation 2',
                'key': 'variation-2',
                'variables': {
                    'feature-key-2': 'on'
                }
            }
        ],
        'variables': [
            {
                'key': 'feature-key-2',
                'type': VariableType.string
            }
        ],
        'tags': [],
        'sdkVisibility': {
            'mobile': true,
            'client': true,
            'server': true
        }
    },
    {
        'name': 'duplicate feature name',
        'description': 'duplicate feature description',
        'type': FeatureType.release,
        'key': 'duplicate-key',
        'variations': [
            {
                'name': 'Variation 1',
                'key': 'variation-1',
                'variables': {
                    'duplicate-key': false
                }
            },
            {
                'name': 'Variation 2',
                'key': 'variation-2',
                'variables': {
                    'duplicate-key': true
                }
            }
        ],
        'variables': [
            {
                'key': 'duplicate-key',
                'type': VariableType.boolean
            }
        ],
        'tags': [],
        'sdkVisibility': {
            'mobile': true,
            'client': true,
            'server': true
        }
    }
]
