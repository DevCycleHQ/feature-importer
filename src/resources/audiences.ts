import { LD, DVC } from '../api'
import { ParsedImporterConfig } from '../configs'
import { AudiencePayload, AudienceResponse, FilterOrOperator, Operator, OperatorType } from '../types/DevCycle'
import { Rule, Segment } from '../types/LaunchDarkly'
import { mapClauseToFilter } from '../utils/LaunchDarkly'
import { createUserFilter } from '../utils/DevCycle'

export async function importAudiences(config: ParsedImporterConfig, environmentKeys: string[]) {
    const unsupportedAudiencesByKey: Record<string, string> = {}
    const audiencesByKey = await DVC.getAudiences(config.projectKey).then((audiences) => (
        audiences.reduce((map: Record<string, AudienceResponse>, audience: AudienceResponse) => {
            if (audience.key) map[audience.key] = audience
            return map
        }, {})
    ))
    for (const environmentKey of environmentKeys) {
        const ldSegments = await LD.getSegments(config.projectKey, environmentKey)

        for (const segment of ldSegments.items) {
            const key = `${segment.key}-${environmentKey}`
            const isDuplicate = Boolean(audiencesByKey[key])

            let filters: AudiencePayload['filters']
            try {
                filters = mapSegmentToFilters(segment)
            } catch (err) {
                unsupportedAudiencesByKey[key] = err instanceof Error ? err.message : 'Error creating segment filters'
                console.log(`Skipping audience "${key}" because it contains unsupported rules`)
                continue
            }

            const audiencePayload: AudiencePayload = {
                name: segment.name,
                key,
                description: segment.description,
                tags: segment.tags,
                filters
            }

            if (!isDuplicate) {
                console.log(`Creating audience "${key}" in DevCycle`)
                audiencesByKey[key] = await DVC.createAudience(config.projectKey, audiencePayload)
            } else if (config.overwriteDuplicates) {
                console.log(`Updating audience "${key}" in DevCycle`)
                audiencesByKey[key] = await DVC.updateAudience(config.projectKey, key, audiencePayload)
            } else {
                console.log('Skipping audience creation because it already exists')
            }
        }
    }

    return {
        audiencesByKey,
        unsupportedAudiencesByKey
    }
}

export function mapSegmentToFilters(segment: Segment): AudiencePayload['filters'] {
    const rulesFilters = segment.rules?.length
        ? segment.rules.map(mapSegmentRuleToFilter)
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

function mapSegmentRuleToFilter(rule: Rule): FilterOrOperator {
    if (rule.weight) {
        throw new Error('Weighted rules are not supported in segments')
    }
    const filters = rule.clauses.map((clause) => {
        if (clause.attribute === 'segmentMatch') {
            throw new Error('Segment match rules are not supported in segments')
        }
        return mapClauseToFilter(clause)
    })

    if (filters.length === 1) {
        return filters[0]
    }
    return {
        operator: OperatorType.and,
        filters
    }
}
