import { OperatorType } from '../../types/DevCycle'
import { mapSegmentToFilters } from './segments'

const validSegment = {
    name: 'segment 1',
    key: 'seg-1',
    description: 'my segment',
    tags: ['tag1', 'tag2'],
    creationDate: 123456789,
    rules: []
}

describe('mapSegmentToFilters', () => {
    test('maps a segment containing included, excluded and rules', () => {
        const segment = {
            ...validSegment,
            included: ['include-key'],
            excluded: ['exclude-key'],
            rules: [{
                clauses: [
                    {
                        'attribute': 'email',
                        'negate': false,
                        'op': 'in',
                        'values': [
                            'email@email.com'
                        ]
                    }
                ]
            }]
        }
        const filters = mapSegmentToFilters(segment, {})
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

    test('maps a segment containing a rule with an op overrided in operationMap', () => {
        const segment = {
            ...validSegment,
            rules: [{
                clauses: [
                    {
                        'attribute': 'email',
                        'negate': false,
                        'op': 'endsWith',
                        'values': [
                            'email.com'
                        ]
                    }
                ]
            }]
        }
        const operationMap = {
            'endsWith': 'contain'
        }
        const filters = mapSegmentToFilters(segment, operationMap)
        expect(filters).toEqual({
            operator: OperatorType.or,
            filters: [
                {
                    type: 'user',
                    subType: 'email',
                    comparator: 'contain',
                    values: ['email.com']
                },
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
                            'attribute': 'email',
                            'negate': false,
                            'op': 'in',
                            'values': [
                                'email@email.com'
                            ]
                        },
                        {
                            'attribute': 'key',
                            'negate': true,
                            'op': 'in',
                            'values': [
                                'user1'
                            ]
                        }
                    ]
                },
                {
                    clauses: [
                        {
                            'attribute': 'name',
                            'negate': false,
                            'op': 'contains',
                            'values': [
                                'jim'
                            ]
                        }
                    ]
                }
            ]
        }
        const filters = mapSegmentToFilters(segment, {})
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
                            'attribute': 'segmentMatch',
                            'negate': false,
                            'op': 'in',
                            'values': [
                                'my-segment'
                            ]
                        }
                    ]
                }
            ]
        }
        expect(() => mapSegmentToFilters(segment, {})).toThrowError('Segment match rules are not supported in segments')
    })

    test('throws an error if segment contains a weighted rule', () => {
        const segment = {
            ...validSegment,
            rules: [
                {
                    clauses: [{
                        'attribute': 'email',
                        'negate': false,
                        'op': 'in',
                        'values': [
                            'email@email.com'
                        ]
                    }],
                    weight: 50000
                }
            ]
        }
        expect(() => mapSegmentToFilters(segment, {})).toThrowError('Weighted rules are not supported in segments')
    })
})