jest.mock('../../api')

import { mockLDFeaturesFlags, mockConfig } from '../../api/__mocks__/MockResponses'
import { LDAudienceImporter } from '../../resources/audiences'
import { OperatorType } from '../../types/DevCycle'
import { getDataType } from '../DevCycle'
import {
    buildTargetingRuleFromRule,
    buildTargetingRuleFromTarget,
    buildTargetingRulesFromFallthrough
} from './targeting'

const mockFeature = mockLDFeaturesFlags.items[0]
mockFeature.variations = [
    {
        _id: 'variation-1',
        value: false,
    },

    {
        _id: 'variation-2',
        value: true,
    }
]

const mockRule = {
    _id: '123',
    clauses: [
        {
            _id: 'abc',
            attribute: 'email',
            negate: false,
            op: 'in',
            values: ['email@email.com']
        }
    ],
    variation: 1
}

const mockRuleWithCustomProperty = {
    ...mockRule,
    clauses: [
        {
            _id: 'abc',
            attribute: 'customProperty',
            negate: false,
            op: 'in',
            values: ['email@email.com']
        }
    ],
}

describe('buildTargetingRuleFromTarget', () => {
    test('builds targeting rule from targets', () => {
        const target = {
            variation: 1,
            values: ['user-1', 'user-2'],
        }

        const result = buildTargetingRuleFromTarget(target, mockFeature)
        expect(result).toEqual({
            audience: {
                name: 'Imported Target',
                filters: {
                    filters: [{
                        type: 'user',
                        subType: 'user_id',
                        comparator: '=',
                        values: target.values
                    }],
                    operator: OperatorType.and
                }
            },
            distribution: [{
                _variation: 'variation-2',
                percentage: 1
            }]
        })

    })
})

describe('buildTargetingRuleFromRule', () => {
    test('builds targeting rule from a simple rule', () => {
        const audienceImport = new LDAudienceImporter(mockConfig)

        const result = buildTargetingRuleFromRule(mockRule, mockFeature, 'prod', audienceImport)
        expect(result).toEqual({
            customPropertiesToImport: [],
            targetingRule: {
                audience: {
                    name: 'Imported Rule',
                    filters: {
                        filters: [expect.objectContaining({})],
                        operator: OperatorType.and
                    }
                },
                distribution: [{
                    _variation: 'variation-2',
                    percentage: 1
                }]
            }
        })
    })

    test('builds targeting rule with custom property', () => {
        const audienceImport = new LDAudienceImporter(mockConfig)

        const result = buildTargetingRuleFromRule(mockRuleWithCustomProperty, mockFeature, 'prod', audienceImport)
        expect(result).toEqual({
            customPropertiesToImport: [{
                dataKey: mockRuleWithCustomProperty.clauses[0].attribute,
                dataKeyType: getDataType(mockRuleWithCustomProperty.clauses[0].values)
            }],
            targetingRule: {
                audience: {
                    name: 'Imported Rule',
                    filters: {
                        filters: [expect.objectContaining({})],
                        operator: OperatorType.and
                    }
                },
                distribution: [{
                    _variation: 'variation-2',
                    percentage: 1
                }]
            }
        })
    })

    test('builds targeting rule from a rule with rollout', () => {
        const audienceImport = new LDAudienceImporter(mockConfig)
        const rule = {
            ...mockRule,
            variation: undefined,
            rollout: {
                variations: [
                    {
                        variation: 0,
                        weight: 20000
                    },
                    {
                        variation: 1,
                        weight: 80000
                    }
                ]
            }
        }

        const result = buildTargetingRuleFromRule(rule, mockFeature, 'prod', audienceImport)
        expect(result).toEqual({
            customPropertiesToImport: [],
            targetingRule: {
                audience: {
                    name: 'Imported Rule',
                    filters: {
                        filters: [expect.objectContaining({})],
                        operator: OperatorType.and
                    }
                },
                distribution: [
                    {
                        _variation: 'variation-1',
                        percentage: 0.2
                    },
                    {
                        _variation: 'variation-2',
                        percentage: 0.8
                    }
                ]
            }
        })

    })

    test('builds targeting rule from a segment match rule', () => {
        const audienceImport = new LDAudienceImporter(mockConfig)
        audienceImport.audiences = {
            'seg-1-prod': {
                _id: 'audienceId',
                _project: 'project',
                filters: { filters: [], operator: OperatorType.and }
            }
        }
        const rule = {
            _id: '123',
            clauses: [
                {
                    _id: 'abc',
                    attribute: 'segmentMatch',
                    negate: false,
                    op: 'segmentMatch',
                    values: ['seg-1']
                }
            ],
            variation: 0
        }

        const result = buildTargetingRuleFromRule(rule, mockFeature, 'prod', audienceImport)
        expect(result).toEqual({
            customPropertiesToImport: [],
            targetingRule: {
                audience: {
                    name: 'Imported Rule',
                    filters: {
                        filters: [{
                            type: 'audienceMatch',
                            comparator: '=',
                            _audiences: ['audienceId']
                        }],
                        operator: OperatorType.and
                    }
                },
                distribution: [{
                    _variation: 'variation-1',
                    percentage: 1
                }]
            }
        })
    })

    test('throws error if an error occured while creating audience', () => {
        const audienceImport = new LDAudienceImporter(mockConfig)
        audienceImport.errors = {
            'seg-1-prod': 'an error occured'
        }
        const rule = {
            _id: '123',
            clauses: [
                {
                    _id: 'abc',
                    attribute: 'segmentMatch',
                    negate: false,
                    op: 'segmentMatch',
                    values: ['seg-1']
                }
            ],
            variation: 0
        }

        const methodCall = () => buildTargetingRuleFromRule(rule, mockFeature, 'prod', audienceImport)
        expect(methodCall).toThrowError('an error occured')
    })
})

describe('buildTargetingRulesFromFallthrough', () => {
    test('builds targeting rule with variation', () => {
        const fallthrough = {
            variation: 1
        }

        const result = buildTargetingRulesFromFallthrough(fallthrough, mockFeature)
        expect(result).toEqual({
            audience: {
                name: 'Imported Fallthrough',
                filters: {
                    filters: [{ type: 'all' }],
                    operator: OperatorType.and
                }
            },
            distribution: [{
                _variation: 'variation-2',
                percentage: 1
            }]
        })

    })

    test('builds targeting rule with rollout', () => {
        const fallthrough = {
            rollout: {
                variations: [
                    {
                        variation: 0,
                        weight: 10000
                    },
                    {
                        variation: 1,
                        weight: 90000
                    }
                ]
            }
        }

        const result = buildTargetingRulesFromFallthrough(fallthrough, mockFeature)
        expect(result).toEqual({
            audience: {
                name: 'Imported Fallthrough',
                filters: {
                    filters: [{ type: 'all' }],
                    operator: OperatorType.and
                }
            },
            distribution: [
                {
                    _variation: 'variation-1',
                    percentage: 0.1
                },
                {
                    _variation: 'variation-2',
                    percentage: 0.9
                }
            ]
        })
    })
})