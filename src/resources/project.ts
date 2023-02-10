import { LD, DVC } from '../api'
import { ParsedImporterConfig } from '../configs'

export async function importProject(config: ParsedImporterConfig) {
    const ldProject = await LD.getProject(config.projectKey)

    let dvcProject, isDuplicate
    try {
        dvcProject = await DVC.getProject(config.projectKey)
        isDuplicate = true
    } catch (e) {
        isDuplicate = false
    }

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
        response = dvcProject
        console.log('Skipping project creation because it already exists')
    }

    return {
        dvcProject: response,
        ldProject
    }
}