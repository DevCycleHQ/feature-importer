import { AudiencePayload, FilterOrOperator, Operator, OperatorType } from '../../types/DevCycle'
import { Segment, SegmentRule } from '../../types/LaunchDarkly'
import { createUserFilter } from '../DevCycle'
import { mapClauseToFilter } from './targeting'

export function mapSegmentToFilters(
    segment: Segment,
    operationMap: { [key: string]: string } | undefined
): AudiencePayload['filters'] {
    const rulesFilters = segment.rules?.length
        ? segment.rules.map((rule) => mapSegmentRuleToFilter(rule, operationMap))
        : []

    if (segment.included?.length) {
        const includesFilter = createUserFilter('user_id', '=', segment.included)
        rulesFilters.unshift(includesFilter)
    }

    const filters: Operator = {
        operator: OperatorType.or,
        filters: rulesFilters
    }

    if (segment.excluded?.length) {
        const excludesFilter = createUserFilter('user_id', '!=', segment.excluded)
        return {
            operator: OperatorType.and,
            filters: [excludesFilter, filters]
        }
    }

    return filters
}

function mapSegmentRuleToFilter(
    rule: SegmentRule,
    operationMap: { [key: string]: string } | undefined
): FilterOrOperator {
    if (rule.weight) {
        throw new Error('Weighted rules are not supported in segments')
    }
    const filters = rule.clauses.map((clause) => {
        if (clause.attribute === 'segmentMatch') {
            throw new Error('Segment match rules are not supported in segments')
        }
        return mapClauseToFilter(clause, operationMap)
    })

    if (filters.length === 1) {
        return filters[0]
    }
    return {
        operator: OperatorType.and,
        filters
    }
}