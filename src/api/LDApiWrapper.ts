import { ProjectResponse, SegmentResponse } from '../types/LaunchDarkly'
import { handleErrors } from './utils'

const LD_BASE_URL = 'https://app.launchdarkly.com/api/v2'

export default class LDApiWrapper {
    constructor(apiToken: string) {
        this.apiToken = apiToken
    }
    apiToken: string

    private async getHeaders() {
        return {
            Authorization: this.apiToken,
        }
    }

    private async handleErrors(response: Response) {
        await handleErrors('Error calling LaunchDarkly API', response)
    }

    async getProject(projectKey: string): Promise<ProjectResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${LD_BASE_URL}/projects/${projectKey}?expand=environments`, {
            method: 'GET',
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async getSegments(
        projectKey: string,
        environmentKey: string
    ): Promise<SegmentResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${LD_BASE_URL}/segments/${projectKey}/${environmentKey}`, {
            method: 'GET',
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }
    
    async getFeatureFlagsForProject(projectKey: string) {
        const headers = await this.getHeaders()
        const response = await fetch(`${LD_BASE_URL}/flags/${projectKey}`, {
            method: 'GET',
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }
}
