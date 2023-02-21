import { DVC, LD } from '../../api'
import { ParsedImporterConfig } from '../../configs'
import { AudiencePayload, AudienceResponse } from '../../types/DevCycle'
import { formatKey } from '../../utils/DevCycle'
import { mapSegmentToFilters } from '../../utils/LaunchDarkly/segments'

export class LDAudienceImporter {
    private config: ParsedImporterConfig

    public errors: Record<string, string> = {}
    public audiences: Record<string, AudienceResponse> = {}

    constructor(config: ParsedImporterConfig) {
        this.config = config
    }

    async import(environmentKeys: string[]): Promise<Record<string, AudienceResponse>> {
        const { sourceProjectKey, targetProjectKey, overwriteDuplicates, operationMap } = this.config

        this.audiences = await DVC.getAudiences(targetProjectKey).then((audiences) => (
            audiences.reduce((map: Record<string, AudienceResponse>, audience) => {
                if (audience.key) map[audience.key] = audience
                return map
            }, {})
        ))
        for (const environmentKey of environmentKeys) {
            const ldSegments = await LD.getSegments(sourceProjectKey, environmentKey)

            for (const segment of ldSegments.items) {
                const key = formatKey(`${segment.key}-${environmentKey}`)
                const isDuplicate = Boolean(this.audiences[key])
    
                let filters: AudiencePayload['filters']
                try {
                    filters = mapSegmentToFilters(segment, operationMap)
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Error creating segment filters'
                    this.errors[key] = `Error in segment ${segment.key}: ${errorMessage}`
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
                    this.audiences[key] = await DVC.createAudience(targetProjectKey, audiencePayload)
                } else if (overwriteDuplicates) {
                    console.log(`Updating audience "${key}" in DevCycle`)
                    this.audiences[key] = await DVC.updateAudience(targetProjectKey, key, audiencePayload)
                } else {
                    console.log(`Skipping audience "${key}" creation because it already exists`)
                }
            }
        }
    
        return this.audiences
    }
}