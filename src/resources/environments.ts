import { DVC } from '../api'
import inquirer from 'inquirer'
import { EnvironmentResponse as DVCEnvironmentResponse, EnvironmentType as DVCEnvironmentType } from '../types/DevCycle'
import { Environment as LDEnvironment, Environments as LDEnvironments } from '../types/LaunchDarkly'
import { ParsedImporterConfig } from '../configs'

const promptToGetEnvironmentType = async (environmentKey: string) => {
    try {
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "type",
                message: `Please choose environment type for environment: ${environmentKey}`,
                choices: [
                    DVCEnvironmentType.Dev,
                    DVCEnvironmentType.Staging,
                    DVCEnvironmentType.Prod,
                    DVCEnvironmentType.Recovery
                ]
            }
        ])
        return answer.type
    } catch (error) {
        throw Error(`Error found in Inquirer prompt, ${error}`)
    }

}

const getEnvironmentPayload = async (environment: LDEnvironment) => {
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

export const importEnvironments = async (config: ParsedImporterConfig, environments: LDEnvironments) => {
    const projectKey = config.projectKey

    const environmentsByKey = await DVC.getEnvironments(projectKey).then((environments) => (
        environments.reduce((map: Record<string, DVCEnvironmentResponse>, environment: DVCEnvironmentResponse) => {
            map[environment.key] = environment
            return map
        }, {})
    ))

    for (const environment of environments.items) {
        const { key } = environment
        const isDuplicate = Boolean(environmentsByKey[key])

        if (!isDuplicate) {
            const environmentPayload = await getEnvironmentPayload(environment)

            environmentsByKey[key] = await DVC.createEnvironment(projectKey, environmentPayload)
            console.log(`Creating environment "${key}" in DevCycle`)
        } else if (config.overwriteDuplicates) {
            const environmentPayload = await getEnvironmentPayload(environment)

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