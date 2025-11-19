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
            'LD-API-Version': '20220603',
        }
    }

    private async handleErrors(response: Response) {
        await handleErrors('Error calling LaunchDarkly API', response)
    }

    async getProject(projectKey: string): Promise<ProjectResponse> {
        const headers = await this.getHeaders()
        const encodedProjectKey = encodeURIComponent(projectKey)
        const response = await fetch(
            `${LD_BASE_URL}/projects/${encodedProjectKey}?expand=environments`,
            {
                method: 'GET',
                headers,
            }
        )
        await this.handleErrors(response)
        return response.json()
    }

    async getSegments(
        projectKey: string,
        environmentKey: string
    ): Promise<SegmentResponse> {
        const headers = await this.getHeaders()
        const encodedProjectKey = encodeURIComponent(projectKey)
        const encodedEnvironmentKey = encodeURIComponent(environmentKey)
        const response = await fetch(
            `${LD_BASE_URL}/segments/${encodedProjectKey}/${encodedEnvironmentKey}`,
            {
                method: 'GET',
                headers,
            }
        )
        await this.handleErrors(response)
        return response.json()
    }

    async getFeatureFlagsForProject(projectKey: string) {
        const headers = await this.getHeaders()
        const encodedProjectKey = encodeURIComponent(projectKey)
        const response = await fetch(
            `${LD_BASE_URL}/flags/${encodedProjectKey}?summary=0`,
            {
                method: 'GET',
                headers,
            }
        )
        await this.handleErrors(response)
        return response.json()
    }
}
