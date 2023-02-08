import { DVC } from '../api'
import inquirer from 'inquirer'
import { DVCEnvironmentResponse, EnvironmentType } from '../types/DevCycle'
import { LDEnvironment, LDEnvironments } from '../types/LaunchDarkly'
import { ParsedImporterConfig } from '../configs'

const promptToGetEnvironmentType = async (environmentKey: string) => {
    try {
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "type",
                message: `Please choose environment type for environment: ${environmentKey}`,
                choices: [
                    EnvironmentType.Dev,
                    EnvironmentType.Staging,
                    EnvironmentType.Prod,
                    EnvironmentType.Recovery
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

    const dvcEnvironments = await DVC.getEnvironments(projectKey)
    const dvcEnvironmentsKeys = dvcEnvironments.map(({ key }) => key)

    const createdEnvironments: DVCEnvironmentResponse[] = []
    const updatedEnvironments: DVCEnvironmentResponse[] = []

    for (const environment of environments.items) {
        const { key } = environment
        const isDuplicate = dvcEnvironmentsKeys.includes(key)

        if (!isDuplicate) {
            const environmentPayload = await getEnvironmentPayload(environment)

            const createdEnvironment = await DVC.createEnvironment(projectKey, environmentPayload)
            createdEnvironments.push(createdEnvironment)
            console.log(`Creating environment "${key}" in DevCycle`)
        } else if (config.overwriteDuplicates) {
            const environmentPayload = await getEnvironmentPayload(environment)

            const updatedEnvironment = await DVC.updateEnvironment(projectKey, key, environmentPayload)
            updatedEnvironments.push(updatedEnvironment)
            console.log(`Updating environment "${key}" in DevCycle`)
        } else {
            console.log(`Skipping environment "${key}" creation because it already exists`)
        }

    }

    return {
        createdEnvironments,
        updatedEnvironments
    }

}