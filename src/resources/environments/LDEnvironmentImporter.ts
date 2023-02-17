import { DVC } from '../../api'
import { ParsedImporterConfig } from '../../configs'
import { EnvironmentPayload, EnvironmentResponse, EnvironmentType } from '../../types/DevCycle'
import { Environments as LDEnvironments, Environment as LDEnvironment } from '../../types/LaunchDarkly'
import { promptToGetEnvironmentType } from './utils'

export class LDEnvironmentImporter {
    private config: ParsedImporterConfig
    environmentsByKey: Record<string, EnvironmentResponse> = {}

    constructor(config: ParsedImporterConfig) {
        this.config = config
    }

    private async getExistingEnvironmentByKey(projectKey: string) {
        this.environmentsByKey = await DVC.getEnvironments(projectKey).then((environments) => (
            environments.reduce((map: Record<string, EnvironmentResponse>, environment) => {
                map[environment.key] = environment
                return map
            }, {})
        ))
    }

    private async getEnvironmentPayload(environment: LDEnvironment): Promise<EnvironmentPayload> {
        const { key, name, color } = environment
        let type
        if (this.environmentsByKey[key]) {
            type = this.environmentsByKey[key].type
        } else if ((<any>Object).values(EnvironmentType).includes(key)) {
            type = key
        } else {
            type = await promptToGetEnvironmentType(key)
        }
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
        await this.getExistingEnvironmentByKey(projectKey)
    
        for (const environment of environments.items) {
            const { key } = environment
            const isDuplicate = Boolean(this.environmentsByKey[key])
    
            if (!isDuplicate) {
                const environmentPayload = await this.getEnvironmentPayload(environment)
    
                this.environmentsByKey[key] = await DVC.createEnvironment(projectKey, environmentPayload)
                console.log(`Creating environment "${key}" in DevCycle`)
            } else if (overwriteDuplicates) {
                const environmentPayload = await this.getEnvironmentPayload(environment)
    
                this.environmentsByKey[key] = await DVC.updateEnvironment(projectKey, key, environmentPayload)
                console.log(`Updating environment "${key}" in DevCycle`)
            } else {
                console.log(`Skipping environment "${key}" creation because it already exists`)
            }
        }
    
        return this.environmentsByKey
    }
}