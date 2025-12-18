import { ProjectResponse, SegmentResponse } from '../types/LaunchDarkly'
import { handleErrors } from './utils'

const LD_BASE_URL = 'https://app.launchdarkly.com/api/v2'
const LD_API_VERSION = '20240415'
export default class LDApiWrapper {
    constructor(apiToken: string) {
        this.apiToken = apiToken
        this.cachedEnvironments = {}
    }
    apiToken: string
    private cachedEnvironments: Record<string, string[]>

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
            this.cachedEnvironments[projectKey] = project.environments?.items.map(
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
        this.cachedEnvironments[projectKey] = environmentResponse?.items?.map((env: { key: string }) => env.key)
    }

    async getFeatureFlagsForProject(projectKey: string) {
        const headers = await this.getHeaders()
        const encodedProjectKey = encodeURIComponent(projectKey)
        const url = `${LD_BASE_URL}/flags/${encodedProjectKey}?summary=0`
        
        if (!this.cachedEnvironments[projectKey]) {
            await this.getEnvironments(projectKey)
        }
        
        const environments = this.cachedEnvironments[projectKey] || []
        
        if (environments.length === 0) {
            return []
        }
        
        const chunkSize = 3
        const environmentChunks: string[][] = []
        for (let i = 0; i < environments.length; i += chunkSize) {
            environmentChunks.push(environments.slice(i, i + chunkSize))
        }
        
        const responses = []
        for (let i = 0; i < environmentChunks.length; i++) {
            const envChunk = environmentChunks[i]
            const envParams = envChunk
                .map((key) => `env=${encodeURIComponent(key)}`)
                .join('&')
            const urlWithEnvParams = `${url}&${envParams}`
            const response = await fetch(urlWithEnvParams, {
                method: 'GET',
                headers,
            })
            await this.handleErrors(response)
            const data = await response.json()
            responses.push(data)
            
            if (i < environmentChunks.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 150))
            }
        }
        
        const mergedItems = responses.flatMap((response) => response.items || [])
        
        return mergedItems
    }
}
