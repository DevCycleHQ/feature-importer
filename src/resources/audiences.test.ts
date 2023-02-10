jest.mock('../api')

import { importAudiences, mapSegmentToFilters } from './audiences'
import { LD, DVC } from '../api'
import { Operator, OperatorType } from '../types/DevCycle'

const mockLD = LD as jest.Mocked<typeof LD>
const mockDVC = DVC as jest.Mocked<typeof DVC>

const mockConfig = {
    ldAccessToken: '123',
    dvcClientId: 'dvcid',
    dvcClientSecret: 'dvcsecret',
    projectKey: 'project-key',
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

const validSegment = {
    name: 'segment 1',
    key: 'seg-1',
    description: 'my segment',
    tags: ['tag1', 'tag2'],
    creationDate: 123456789,
    rules: []
}

describe('Audience Import', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("audience is created when it doesn't exist yet", async () => {
        const config = { ...mockConfig }
        const envKey = 'production'
        const ldSegment = { ...validSegment }
        const expectedFilters = {
            operator: OperatorType.or,
            filters: []
        }
        const createResponse = {
            ...mockDvcAudienceResponse,
            name: ldSegment.name,
            key: config.projectKey,
            filters: expectedFilters
        }
        mockLD.getSegments.mockResolvedValue({ items: [ldSegment] })
        mockDVC.getAudiences.mockResolvedValue([])
        mockDVC.createAudience.mockResolvedValue(createResponse)

        const result = await importAudiences(config, [envKey])
        expect(result).toEqual({
            audiencesByKey: {
                [`${ldSegment.key}-${envKey}`]: createResponse
            },
            unsupportedAudiencesByKey: {}
        })
        expect(mockDVC.createAudience).toHaveBeenCalledWith(
            config.projectKey,
            {
                name: ldSegment.name,
                key: `${ldSegment.key}-${envKey}`,
                description: ldSegment.description,
                tags: ldSegment.tags,
                filters: expectedFilters
            }
        )
        expect(mockDVC.updateAudience).not.toHaveBeenCalled()
    })

    test("audience is skipped if it already exists", async () => {
        const config = { ...mockConfig }
        const envKey = 'production'
        const ldSegment = { ...validSegment }
        const existingAudience = {
            ...mockDvcAudienceResponse,
            key: `${ldSegment.key}-${envKey}`
        }
        mockLD.getSegments.mockResolvedValue({ items: [ldSegment] })
        mockDVC.getAudiences.mockResolvedValue([existingAudience])

        const result = await importAudiences(config, [envKey])
        expect(result).toEqual({
            audiencesByKey: {
                [existingAudience.key]: existingAudience
            },
            unsupportedAudiencesByKey: {}
        })
        expect(mockDVC.createAudience).not.toHaveBeenCalled()
        expect(mockDVC.updateAudience).not.toHaveBeenCalled()
    })

    test("audience is updated if overwriteDuplicates is true", async () => {
        const config = { ...mockConfig, overwriteDuplicates: true }
        const envKey = 'production'
        const ldSegment = { ...validSegment }
        const existingAudience = {
            ...mockDvcAudienceResponse,
            key: `${ldSegment.key}-${envKey}`
        }
        const expectedFilters = {
            operator: OperatorType.or,
            filters: []
        }
        const updateResponse = {
            ...mockDvcAudienceResponse,
            name: ldSegment.name,
            key: config.projectKey,
            filters: expectedFilters
        }
        mockLD.getSegments.mockResolvedValue({ items: [ldSegment] })
        mockDVC.getAudiences.mockResolvedValue([existingAudience])
        mockDVC.updateAudience.mockResolvedValue(updateResponse)

        const result = await importAudiences(config, [envKey])
        expect(result).toEqual({
            audiencesByKey: {
                [`${ldSegment.key}-${envKey}`]: updateResponse
            },
            unsupportedAudiencesByKey: {}
        })
        expect(mockDVC.updateAudience).toHaveBeenCalledWith(
            config.projectKey,
            `${ldSegment.key}-${envKey}`,
            {
                name: ldSegment.name,
                key: `${ldSegment.key}-${envKey}`,
                description: ldSegment.description,
                tags: ldSegment.tags,
                filters: expectedFilters
            }
        )
        expect(mockDVC.createAudience).not.toHaveBeenCalled()
    })
})

describe('mapSegmentToFilters', () => {
    test('maps a segment containing included, excluded and rules', () => {
        const segment = {
            ...validSegment,
            included: ['include-key'],
            excluded: ['exclude-key'],
            rules: [{
                clauses: [
                    {
                        "attribute": "email",
                        "negate": false,
                        "op": "in",
                        "values": [
                            "email@email.com"
                        ]
                    }
                ]
            }]
        }
        const filters = mapSegmentToFilters(segment)
        expect(filters).toEqual({
            operator: OperatorType.and,
            filters: [
                {
                    type: 'user',
                    subType: 'user_id',
                    comparator: '!=',
                    values: ['exclude-key']
                },
                {
                    operator: OperatorType.or,
                    filters: [
                        {
                            type: 'user',
                            subType: 'user_id',
                            comparator: '=',
                            values: ['include-key']
                        },
                        {
                            type: 'user',
                            subType: 'email',
                            comparator: '=',
                            values: ['email@email.com']
                        }
                    ]
                }
            ]
        })
    })

    test('maps a segment containing multiple rules with multiple clauses', () => {
        const segment = {
            ...validSegment,
            rules: [
                {
                    clauses: [
                        {
                            "attribute": "email",
                            "negate": false,
                            "op": "in",
                            "values": [
                                "email@email.com"
                            ]
                        },
                        {
                            "attribute": "key",
                            "negate": true,
                            "op": "in",
                            "values": [
                                "user1"
                            ]
                        }
                    ]
                },
                {
                    clauses: [
                        {
                            "attribute": "name",
                            "negate": false,
                            "op": "contains",
                            "values": [
                                "jim"
                            ]
                        }
                    ]
                }
            ]
        }
        const filters = mapSegmentToFilters(segment)
        expect(filters).toEqual({
            operator: OperatorType.or,
            filters: [
                {
                    operator: OperatorType.and,
                    filters: [
                        {
                            type: 'user',
                            subType: 'email',
                            comparator: '=',
                            values: ['email@email.com']
                        },
                        {
                            type: 'user',
                            subType: 'user_id',
                            comparator: '!=',
                            values: ['user1']
                        }
                    ]
                },
                {
                    type: 'user',
                    subType: 'customData',
                    dataKey: 'name',
                    dataKeyType: 'String',
                    comparator: 'contain',
                    values: ['jim']
                }
            ]
        })
    })

    test('throws an error if segment contains a segmentMatch rule', () => {
        const segment = {
            ...validSegment,
            rules: [
                {
                    clauses: [
                        {
                            "attribute": "segmentMatch",
                            "negate": false,
                            "op": "in",
                            "values": [
                                "my-segment"
                            ]
                        }
                    ]
                }
            ]
        }
        expect(() => mapSegmentToFilters(segment)).toThrowError('Segment match rules are not supported in segments')
    })

    test('throws an error if segment contains a weighted rule', () => {
        const segment = {
            ...validSegment,
            rules: [
                {
                    clauses: [{
                        "attribute": "email",
                        "negate": false,
                        "op": "in",
                        "values": [
                            "email@email.com"
                        ]
                    }],
                    weight: 50000
                }
            ]
        }
        expect(() => mapSegmentToFilters(segment)).toThrowError('Weighted rules are not supported in segments')
    })
})