import { FeatureKind } from '../../types/LaunchDarkly'

export const mockConfig = {
    ldAccessToken: '123',
    dvcClientId: 'dvcid',
    dvcClientSecret: 'dvcsecret',
    projectKey: 'project-key',
}

export const mockDVCFeaturesResponse = [{
    _id: '123',
    _project: 'project',
    name: 'duplicate feature name',
    description: 'duplicate feature description',
    key: 'duplicate-key',
    type: 'release',
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
