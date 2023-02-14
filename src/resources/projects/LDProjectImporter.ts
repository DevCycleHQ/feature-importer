import { ProjectResponse as DVCProject } from '../../types/DevCycle'
import { ProjectResponse as LDProject } from '../../types/LaunchDarkly'
import { LD, DVC } from '../../api'
import { ParsedImporterConfig } from '../../configs'

export class LDProjectImporter {
    private config: ParsedImporterConfig
    public sourceProject: LDProject
    public dvcProject: DVCProject

    constructor(config: ParsedImporterConfig) {
        this.config = config
    }

    async import() {
        const { projectKey, overwriteDuplicates } = this.config
        const ldProject = await LD.getProject(projectKey)
    
        let isDuplicate
        try {
            this.dvcProject = await DVC.getProject(projectKey)
            isDuplicate = true
        } catch (e) {
            isDuplicate = false
        }
    
        const projectPayload = {
            name: ldProject.name,
            key: ldProject.key
        }
    
        if (!isDuplicate) {
            this.dvcProject = await DVC.createProject(projectPayload)
            console.log(`Creating project "${projectPayload.key}" in DevCycle`)
        } else if (overwriteDuplicates) {
            this.dvcProject = await DVC.updateProject(projectKey, projectPayload)
            console.log(`Updating project "${projectKey}" in DevCycle`)
        } else {
            console.log('Skipping project creation because it already exists')
        }

        this.sourceProject = ldProject
    
        return this.dvcProject
    }
}