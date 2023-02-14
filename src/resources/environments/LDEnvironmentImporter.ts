import { DVC } from '../../api'
import { ParsedImporterConfig } from '../../configs'
import { EnvironmentResponse } from '../../types/DevCycle'
import { Environments as LDEnvironments, Environment as LDEnvironment } from '../../types/LaunchDarkly'
import { promptToGetEnvironmentType } from './utils'

export class LDEnvironmentImporter {
    private config: ParsedImporterConfig

    constructor(config: ParsedImporterConfig) {
        this.config = config
    }

    private async getEnvironmentPayload(environment: LDEnvironment) {
        const { key, name, color } = environment
        const type = await promptToGetEnvironmentType(key)
        const environmentPayload = {
            key,
            name,
            color: `#${color}`,
            type
        }
        return environmentPayload
    }

    async import(environments: LDEnvironments) {
        const { projectKey, overwriteDuplicates } = this.config
    
        const environmentsByKey = await DVC.getEnvironments(projectKey).then((environments) => (
            environments.reduce((map: Record<string, EnvironmentResponse>, environment) => {
                map[environment.key] = environment
                return map
            }, {})
        ))
    
        for (const environment of environments.items) {
            const { key } = environment
            const isDuplicate = Boolean(environmentsByKey[key])
    
            if (!isDuplicate) {
                const environmentPayload = await this.getEnvironmentPayload(environment)
    
                environmentsByKey[key] = await DVC.createEnvironment(projectKey, environmentPayload)
                console.log(`Creating environment "${key}" in DevCycle`)
            } else if (overwriteDuplicates) {
                const environmentPayload = await this.getEnvironmentPayload(environment)
    
                environmentsByKey[key] = await DVC.updateEnvironment(projectKey, key, environmentPayload)
                console.log(`Updating environment "${key}" in DevCycle`)
            } else {
                console.log(`Skipping environment "${key}" creation because it already exists`)
            }
        }
    
        return {
            environmentsByKey
        }
    
    }
}