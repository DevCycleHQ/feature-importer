import { CustomProperties, CustomPropertyType, FeatureConfiguration, OperatorType } from '../../types/DevCycle'
import { FeatureKind } from '../../types/LaunchDarkly'

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

export const featureConfigResponse: FeatureConfiguration = {
    targets: [],
    status: 'active'
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

export const mockGetCustomProperties: CustomProperties[] = [
    {
        _id: 'test',
        _project: 'project_123',
        key: 'custom-prop',
        type: CustomPropertyType.String,
        name: 'customProp',
        propertyKey: 'customProp',
        _createdBy: 'user_123',
        createdAt: 'test-created-at-date',
        updatedAt: 'test-updated-at-date',
    },
    {
        _id: 'test2',
        _project: 'project_123',
        key: 'custom-prop-2',
        type: CustomPropertyType.Number,
        name: 'customProp2',
        propertyKey: 'customProp2',
        _createdBy: 'user_123',
        createdAt: 'test-created-at-date',
        updatedAt: 'test-updated-at-date',
    },
    {
        _id: 'test3',
        _project: 'project_123',
        key: 'custom-prop-3',
        type: CustomPropertyType.Boolean,
        name: 'customProp3',
        propertyKey: 'customProp3',
        _createdBy: 'user_123',
        createdAt: 'test-created-at-date',
        updatedAt: 'test-updated-at-date',
    },

]