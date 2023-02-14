import { mockLDFeaturesFlags } from '../../api/__mocks__/MockResponses'
import { OperatorType } from '../../types/DevCycle'
import { buildTargetingRulesFromFallthrough } from './targeting'

describe('buildTargetingRulesFromFallthrough', () => {
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