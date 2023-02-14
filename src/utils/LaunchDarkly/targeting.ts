import { LDAudienceImporter } from '../../resources/audiences'
import { Filter, OperatorType, TargetingRule } from '../../types/DevCycle'
import { Clause, Fallthrough, Feature, Feature as LDFeature, Rule, Target } from '../../types/LaunchDarkly'
import {
    createAllUsersFilter,
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
        before: () => '<',
        after: () => '>',
    }
    if (!(op in operationMap)) {
        throw new Error(`Unsupported operation: ${op}`)
    }
    const opKey = op as keyof typeof operationMap // we've already checked that op is a key of operationMap
    return operationMap[opKey](negate)
}

export function getPercentageFromWeight(weight: number) {
    return weight / 100000
}

export function buildTargetingRules(
    feature: LDFeature,
    environmentKey: string,
    audienceImport: LDAudienceImporter
): TargetingRule[] {
    const targetingRules: TargetingRule[] = []
    const { targets = [], rules = [], fallthrough } = feature.environments[environmentKey]

    for (const target of targets) {
        targetingRules.push(
            buildTargetingRuleFromTarget(target, feature)
        )
    }

    for (const rule of rules) {
        targetingRules.push(
            buildTargetingRuleFromRule(rule, feature, environmentKey, audienceImport)
        )
    }

    if (fallthrough) {
        targetingRules.push(
            buildTargetingRulesFromFallthrough(fallthrough, feature)
        )
    }

    return targetingRules
}

function buildTargetingRuleFromTarget(target: Target, feature: Feature): TargetingRule {
    const audience = {
        name: 'Imported Target',
        filters: {
            filters: [createUserFilter('user_id', '=', target.values)],
            operator: OperatorType.and
        }
    }
    const distribution = [{
        _variation: getVariationKey(feature, target.variation),
        percentage: 1
    }]

    return { audience, distribution }
}

function buildTargetingRuleFromRule(
    rule: Rule,
    feature: Feature,
    environmentKey: string,
    audienceImport: LDAudienceImporter
): TargetingRule {
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
                getComparator(clause),
                audienceIds
            )
        }
        return mapClauseToFilter(clause)
    })
    const audience = {
        name: 'Imported Rule',
        filters: {
            filters,
            operator: OperatorType.and
        }
    }
    const distribution = [{
        _variation: getVariationKey(feature, rule.variation),
        percentage: 1
    }]

    return { audience, distribution }
}

export function buildTargetingRulesFromFallthrough(fallthrough: Fallthrough, feature: Feature): TargetingRule {
    const audience = {
        name: 'Imported Fallthrough',
        filters: {
            filters: [createAllUsersFilter()],
            operator: OperatorType.and
        }
    }
    let distribution
    if (fallthrough.variation !== undefined) {
        distribution = [{
            _variation: getVariationKey(feature, fallthrough.variation),
            percentage: 1
        }]
    } else if (fallthrough.rollout) {
        distribution = fallthrough.rollout.variations.map(({ variation, weight }) => ({
            _variation: getVariationKey(feature, variation),
            percentage: getPercentageFromWeight(weight)
        }))
    }
    if (!distribution) {
        throw new Error('Fallthrough must have either a variation or rollout')
    }
    return { audience, distribution }
}
