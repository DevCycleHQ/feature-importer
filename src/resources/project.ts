import { LD, DVC } from '../api'
import { ParsedImporterConfig } from '../configs'

export async function importProject(config: ParsedImporterConfig) {
    const ldProject = await LD.getProject(config.projectKey)
    const dvcProject = await DVC.getProject(config.projectKey, { throwOnError: false })

    const isDuplicate = Boolean(dvcProject._id)

    const projectPayload = {
        name: ldProject.name,
        key: ldProject.key
    }

    let response
    if (!isDuplicate) {
        response = await DVC.createProject(projectPayload)
        console.log(`Creating project "${projectPayload.key}" in DevCycle`)
    } else if (config.overwriteDuplicates) {
        response = await DVC.updateProject(config.projectKey, projectPayload)
        console.log(`Updating project "${config.projectKey}" in DevCycle`)
    } else {
        console.log('Skipping project creation because it already exists')
    }

    return {
        dvcProject: response,
        ldProject
    }
}