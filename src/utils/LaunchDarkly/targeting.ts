import { AudienceOutput } from '../../resources/audiences'
import { Filter, OperatorType, TargetingRule } from '../../types/DevCycle'
import { Clause, Feature as LDFeature } from '../../types/LaunchDarkly'
import {
    createAudienceMatchFilter,
    createCustomDataFilter,
    createUserFilter,
} from '../../utils/DevCycle/targeting'
import { getVariationKey } from './variation'

export function mapClauseToFilter(clause: Clause): Filter {
    const { attribute, values } = clause
    const attributeMap = {
        country: 'country',
        email: 'email',
        key: 'user_id',
    }
    const comparator = getComparator(clause)

    return !(attribute in attributeMap)
        ? createCustomDataFilter(attribute, comparator, values)
        : createUserFilter(
            attributeMap[attribute as keyof typeof attributeMap], // we've already checked that attribute is a key of attributeMap
            comparator,
            values
        )
}

export function getComparator(clause: Clause) {
    const { op, negate } = clause
    const operationMap = {
        in: (neg: boolean) => neg ? '!=' : '=',
        contains: (neg: boolean) => neg ? '!contain' : 'contain',
        lessThan: (neg: boolean) => '<',
        lessThanOrEqual: (neg: boolean) => '<=',
        greaterThan: (neg: boolean) => '>',
        greaterThanOrEqual: (neg: boolean) => '>=',
        segmentMatch: (neg: boolean) => neg ? '!=' : '=',
    }
    if (!(op in operationMap)) {
        throw new Error(`Unsupported operation: ${op}`)
    }
    const opKey = op as keyof typeof operationMap // we've already checked that op is a key of operationMap
    return operationMap[opKey](negate)
}

export function buildTargetingRules (
    feature: LDFeature,
    environmentKey: string,
    audiences: AudienceOutput
): TargetingRule[] {
    const targetingRules: TargetingRule[] = []
    const { targets, rules } = feature.environments[environmentKey]

    for (const target of targets) {
        const audience = {
            name: 'imported-target',
            filters: {
                filters: [createUserFilter('user_id', '=', target.values)],
                operator: OperatorType.and
            }
        }
        const distribution = [{
            _variation: getVariationKey(feature, target.variation),
            percentage: 1
        }]

        targetingRules.push({ audience, distribution })
    }

    for (const rule of rules) {
        const filters = rule.clauses.map((clause) => {
            if (clause.op === 'segmentMatch') {
                const audienceIds = clause.values.map((segKey) => {
                    const audienceKey = `${segKey}-${environmentKey}`
                    if (audiences.errorsByKey[audienceKey] || !audiences.audiencesByKey[audienceKey]) {
                        const errorMessage = audiences.errorsByKey[audienceKey] || 'unknown error'
                        throw new Error(errorMessage)
                    } else {
                        return audiences.audiencesByKey[audienceKey]._id
                    }
                })
                return createAudienceMatchFilter(
                    getComparator(clause),
                    audienceIds
                )
            }
            return mapClauseToFilter(clause)
        })
        const audience = {
            name: 'imported-rule',
            filters: {
                filters,
                operator: OperatorType.and
            }
        }
        const distribution = [{
            _variation: getVariationKey(feature, rule.variation),
            percentage: 1
        }]
        targetingRules.push({
            audience,
            distribution
        })
    }

    return targetingRules
}
