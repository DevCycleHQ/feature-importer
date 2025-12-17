import { ProjectResponse, SegmentResponse } from '../types/LaunchDarkly'
import { handleErrors } from './utils'

const LD_BASE_URL = 'https://app.launchdarkly.com/api/v2'
const LD_API_VERSION = '20240415'
export default class LDApiWrapper {
    constructor(apiToken: string) {
        this.apiToken = apiToken
    }
    apiToken: string
    private cachedEnvironments: string[]

    private async getHeaders() {
        return {
            Authorization: this.apiToken,
            'LD-API-Version': LD_API_VERSION,
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
        const project = await response.json()
        
        // Cache environment keys for use in feature flag requests
        if (project.environments?.items) {
            this.cachedEnvironments = project.environments.items.map(
                (env: { key: string }) => env.key
            )
        }
        
        return project
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
    
    private async getEnvironments(projectKey: string) {
        const headers = await this.getHeaders()
        const encodedProjectKey = encodeURIComponent(projectKey)
        const response = await fetch(
            `${LD_BASE_URL}/projects/${encodedProjectKey}/environments`,
            {
                method: 'GET',
                headers,
            }
        )
        await this.handleErrors(response)
        const environmentResponse = await response.json()
        this.cachedEnvironments = environmentResponse?.items?.map((env: { key: string }) => env.key)
    }

    async getFeatureFlagsForProject(projectKey: string) {
        const headers = await this.getHeaders()
        const encodedProjectKey = encodeURIComponent(projectKey)
        let url = `${LD_BASE_URL}/flags/${encodedProjectKey}?summary=0`
        
        if (!this.cachedEnvironments) {
            await this.getEnvironments(projectKey)
        }
        
        if (this.cachedEnvironments && this.cachedEnvironments.length > 0) {
            const envParams = this.cachedEnvironments
                .map((key) => `env=${encodeURIComponent(key)}`)
                .join('&')
            url += `&${envParams}`
        } 
        
        const response = await fetch(url, {
            method: 'GET',
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }
}
