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
        const { sourceProjectKey, targetProjectKey, overwriteDuplicates } = this.config
        this.sourceProject = await LD.getProject(sourceProjectKey)
    
        let isDuplicate
        try {
            this.dvcProject = await DVC.getProject(targetProjectKey)
            isDuplicate = true
        } catch (e) {
            isDuplicate = false
        }
    
        const name = sourceProjectKey !== targetProjectKey && this.dvcProject?.name
            ? this.dvcProject.name
            : this.sourceProject.name
        const projectPayload = {
            name,
            key: targetProjectKey
        }
    
        if (!isDuplicate) {
            this.dvcProject = await DVC.createProject(projectPayload)
            console.log(`Creating project "${projectPayload.key}" in DevCycle`)
        } else if (overwriteDuplicates) {
            this.dvcProject = await DVC.updateProject(targetProjectKey, projectPayload)
            console.log(`Updating project "${targetProjectKey}" in DevCycle`)
        } else {
            console.log('Skipping project creation because it already exists')
        }
    
        return this.dvcProject
    }
}