import { LD, DVC } from '../api'
import { DVCImporterConfigs } from '../configs'


export async function importAudiences(config: DVCImporterConfigs, environmentKeys: string[]) {
    const unsupportedAudiencesByKey: Record<string, string> = {};
    const audiencesByKey = await DVC.getAudiences(config.projectKey).then((audiences) => (
        audiences.reduce((map: Record<string, any>, audience: Record<string, any>) => {
            map[audience.key] = audience
            return map
        }, {})
    ))
    for (const environmentKey of environmentKeys) {
        const ldSegments = await LD.getSegments(config.projectKey, environmentKey)

        for (const segment of ldSegments.items) {
            const key = `${segment.key}-${environmentKey}`
            const isDuplicate = Boolean(audiencesByKey[key])

            const audiencePayload = {
                name: segment.name,
                key,
                description: segment.description,
                tags: segment.tags,
                filters: segment.rules.map(mapRuleToFilter)
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

function mapRuleToFilter(rule: Record<string, any>) {
    // TODO: map rules to filters
}