import { LDAudienceImporter } from '../../resources/audiences'
import {
    AudiencePayload,
    CustomPropertyType,
    Filter,
    FilterOrOperator,
    OperatorType,
    TargetingRule
} from '../../types/DevCycle'
import { Clause, Fallthrough, Feature, Feature as LDFeature, Rollout, Rule, Target } from '../../types/LaunchDarkly'
import {
    createAllUsersFilter,
    createAudienceMatchFilter,
    createCustomDataFilter,
    createUserFilter,
    getNegatedOperator,
} from '../../utils/DevCycle/targeting'
import { getVariationKey } from './variation'
import { CustomPropertyFromFilter } from '../../resources/features/types'

export function mapClauseToFilter(clause: Clause, operationMap: { [key: string]: string } | undefined): Filter {
    const { attribute, values } = clause
    const attributeMap = {
        country: 'country',
        email: 'email',
        key: 'user_id',
    }
    const comparator = getComparator(clause, operationMap)

    return !(attribute in attributeMap)
        ? createCustomDataFilter(attribute, comparator, values)
        : createUserFilter(
            // we've already checked that attribute is a key of attributeMap
            attributeMap[attribute as keyof typeof attributeMap],
            comparator,
            values
        )
}

export function getComparator(clause: Clause, customOperationMap: { [key: string]: string } | undefined = {}): string {
    const { op, negate } = clause
    const operationMap = {
        in: (neg: boolean) => neg ? '!=' : '=',
        contains: (neg: boolean) => neg ? '!contain' : 'contain',
        lessThan: (neg: boolean) => '<',
        lessThanOrEqual: (neg: boolean) => '<=',
        greaterThan: (neg: boolean) => '>',
        greaterThanOrEqual: (neg: boolean) => '>=',
        segmentMatch: (neg: boolean) => neg ? '!=' : '=',
        before: () => '<',
        after: () => '>',
    }

    if (op in customOperationMap) {
        return negate ? getNegatedOperator(customOperationMap[op]) : customOperationMap[op]
    }

    if (!(op in operationMap)) {
        throw new Error(`Unsupported operation: ${op}`)
    }
    const opKey = op as keyof typeof operationMap // we've already checked that op is a key of operationMap
    return operationMap[opKey](negate)
}

function getDistribution(feature: Feature, variationIndex: number): TargetingRule['distribution'] {
    return [{
        _variation: getVariationKey(feature, variationIndex),
        percentage: 1
    }]
}

function getDistributionFromRollout(rollout: Rollout, feature: Feature): TargetingRule['distribution'] {
    return rollout.variations.map(({ variation, weight }) => ({
        _variation: getVariationKey(feature, variation),
        percentage: getPercentageFromWeight(weight)
    }))
}

function getPercentageFromWeight(weight: number) {
    return weight / 100000
}

function getAudience(
    name: string,
    filters: FilterOrOperator[],
    operator: OperatorType = OperatorType.and
): AudiencePayload {
    return {
        name,
        filters: { filters, operator }
    }
}

export function buildTargetingRules(
    feature: LDFeature,
    environmentKey: string,
    audienceImport: LDAudienceImporter,
    operationMap: { [key: string]: string } | undefined,
): { targetingRules: TargetingRule[], customPropertiesToImport: CustomPropertyFromFilter[] } {
    const targetingRules: TargetingRule[] = []
    const { targets = [], rules = [], fallthrough } = feature.environments[environmentKey]
    let customPropertiesToImport: CustomPropertyFromFilter[] = []

    for (const target of targets) {
        targetingRules.push(
            buildTargetingRuleFromTarget(target, feature)
        )
    }

    for (const rule of rules) {
        const {
            targetingRule, customPropertiesToImport: customPropertiesForTargeting
        } = buildTargetingRuleFromRule(rule, feature, environmentKey, audienceImport, operationMap)
        targetingRules.push(targetingRule)
        customPropertiesToImport = [...customPropertiesToImport, ...customPropertiesForTargeting]
    }

    if (fallthrough) {
        targetingRules.push(
            buildTargetingRulesFromFallthrough(fallthrough, feature)
        )
    }

    return { targetingRules, customPropertiesToImport }
}

export function buildTargetingRuleFromTarget(target: Target, feature: Feature): TargetingRule {
    const filters = [createUserFilter('user_id', '=', target.values)]
    const audience = getAudience('Imported Target', filters)
    const distribution = getDistribution(feature, target.variation)

    return { audience, distribution }
}

export function buildTargetingRuleFromRule(
    rule: Rule,
    feature: Feature,
    environmentKey: string,
    audienceImport: LDAudienceImporter,
    operationMap: { [key: string]: string } | undefined,
): { targetingRule: TargetingRule, customPropertiesToImport: CustomPropertyFromFilter[] } {
    let customProperties: CustomPropertyFromFilter[] = []
    const filters = rule.clauses.map((clause) => {
        if (clause.op === 'segmentMatch') {
            const audienceIds = clause.values.map((segKey) => {
                const audienceKey = `${segKey}-${environmentKey}`
                if (audienceImport.errors[audienceKey] || !audienceImport.audiences[audienceKey]) {
                    const errorMessage = audienceImport.errors[audienceKey] || 'unknown error'
                    throw new Error(errorMessage)
                } else {
                    return audienceImport.audiences[audienceKey]._id
                }
            })
            return createAudienceMatchFilter(
                getComparator(clause, operationMap),
                audienceIds
            )
        }
        return mapClauseToFilter(clause, operationMap)
    })
    const audience = getAudience('Imported Rule', filters)

    customProperties = filters.filter((filter: Filter) => filter?.subType === 'customData').map((filter: Filter) => {
        return {
            dataKey: filter.dataKey || '',
            dataKeyType: convertDataKeyTypeToCustomPropertyType(filter.dataKeyType)
        }
    })

    let distribution
    if (rule.variation !== undefined) {
        distribution = getDistribution(feature, rule.variation)
    } else if (rule.rollout) {
        distribution = getDistributionFromRollout(rule.rollout, feature)
    }
    if (!distribution) {
        throw new Error('Rule must have either a variation or rollout')
    }

    return { targetingRule: { audience, distribution }, customPropertiesToImport: customProperties }
}

export function buildTargetingRulesFromFallthrough(fallthrough: Fallthrough, feature: Feature): TargetingRule {
    const filters = [createAllUsersFilter()]
    const audience = getAudience('Imported Fallthrough', filters)

    let distribution
    if (fallthrough.variation !== undefined) {
        distribution = getDistribution(feature, fallthrough.variation)
    } else if (fallthrough.rollout) {
        distribution = getDistributionFromRollout(fallthrough.rollout, feature)
    }
    if (!distribution) {
        throw new Error('Fallthrough must have either a variation or rollout')
    }
    return { audience, distribution }
}

const convertDataKeyTypeToCustomPropertyType = (dataKeyType?: string): CustomPropertyType => {
    switch (dataKeyType) {
        case 'Boolean':
            return CustomPropertyType.Boolean
        case 'Number':
            return CustomPropertyType.Number
        default:
            return CustomPropertyType.String
    }
}
