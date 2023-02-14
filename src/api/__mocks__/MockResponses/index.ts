import { Operator, OperatorType } from '../../../types/DevCycle'

export * from './DevCycleMockResponses'
export * from './LDMockResponses'

export const mockConfig = {
    ldAccessToken: '123',
    dvcClientId: 'dvcid',
    dvcClientSecret: 'dvcsecret',
    projectKey: 'project-key',
    overwriteDuplicates: false,
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