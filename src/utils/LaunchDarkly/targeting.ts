import { kebabCase } from 'lodash'
import { AudiencePayload, Filter, OperatorType, TargetingRule as DVCTargetingRule } from '../../types/DevCycle'
import { Feature, Clause } from '../../types/LaunchDarkly'
import {
    createCustomDataFilter,
    createUserFilter,
} from '../../utils/DevCycle/targeting'
import { getVariationKey } from './variation'

export function mapClauseToFilter(clause: Clause): Filter {
    const { attribute, values } = clause
    const attributeMap = {
        country: 'country',
        email: 'email',
        ip: 'ip',
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
    }
    if (!(op in operationMap)) {
        throw new Error(`Unsupported operation: ${op}`)
    }
    const opKey = op as keyof typeof operationMap // we've already checked that op is a key of operationMap
    return operationMap[opKey](negate)
}
export const mapLDTargetToDVCTarget =
    (feature: Feature, environment: string): {
        audience: AudiencePayload,
        distribution: DVCTargetingRule['distribution']
    }[] => {
        const targetRulesForEnvironment = []
        const { targets, rules } = feature.environments[environment]

        for (const target of targets) {
            const audience: AudiencePayload = {
                name: 'imported-target',
                filters: {
                    filters: [],
                    operator: OperatorType.and
                }
            }
            const distribution: DVCTargetingRule['distribution'] = []
            audience.filters.filters.push({
                type: 'user',
                subType: 'user_id',
                comparator: '=',
                values: target.values
            })
            distribution.push({
                _variation: getVariationKey(feature, target.variation),
                percentage: 1
            })
            targetRulesForEnvironment.push({
                audience,
                distribution
            })
        }
        for (const rule of rules) {
            const audience: AudiencePayload = {
                name: 'imported-rule',
                filters: {
                    filters: [],
                    operator: OperatorType.and
                }
            }
            const distribution: DVCTargetingRule['distribution'] = []
            for (const clause of rule.clauses) {
                audience.filters.filters.push(mapClauseToFilter(clause))
            }
            distribution.push({
                _variation: getVariationKey(feature, rule.variation),
                percentage: 1
            })
            targetRulesForEnvironment.push({
                audience,
                distribution
            })
        }

        return targetRulesForEnvironment
    }
