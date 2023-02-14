import inquirer from 'inquirer'
import { EnvironmentType as DVCEnvironmentType } from '../../types/DevCycle'

export const promptToGetEnvironmentType = async (environmentKey: string) => {
    try {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
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