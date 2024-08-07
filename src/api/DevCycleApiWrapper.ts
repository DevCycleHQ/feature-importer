import { handleErrors } from './utils'
import {
    AudiencePayload,
    AudienceResponse,
    CustomProperties,
    CustomPropertiesPayload,
    EnvironmentPayload,
    EnvironmentResponse,
    Feature,
    ProjectPayload,
    ProjectResponse
} from '../types/DevCycle'
import { FeatureConfiguration } from '../types/DevCycle/targeting'

const DVC_BASE_URL = process.env.DVC_BASE_URL || 'https://api.devcycle.com/v1'

export default class DevCycleApiWrapper {
    constructor(dvcClientId: string, dvcClientSecret: string, provider?: string) {
        this.dvcClientId = dvcClientId
        this.dvcClientSecret = dvcClientSecret
        this.provider = provider ?? 'launchdarkly'
    }
    dvcClientId: string
    dvcClientSecret: string
    apiToken: string
    provider: string 

    private async getApiToken(): Promise<string> {
        if (this.apiToken) return this.apiToken
        console.log('Fetching DevCycle API token')
        const response = await fetch('https://auth.devcycle.com/oauth/token', {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                audience: 'https://api.devcycle.com/',
                client_id: this.dvcClientId,
                client_secret: this.dvcClientSecret,
            }
            ),
        })
        const data = await response.json()
        this.apiToken = data.access_token
        return this.apiToken
    }

    private async getHeaders() {
        const token = await this.getApiToken()
        return {
            Authorization: token,
            'Content-Type': 'application/json',
            'dvc-referrer': 'importer',
            'X-Requested-With': 'DevCycle-Feature-Importer',
            'dvc-referrer-metadata': JSON.stringify({
                provider: this.provider,
            }),
        }
    }

    private async handleErrors(response: Response) {
        await handleErrors('Error calling DevCycle API', response)
    }

    async getProject(projectKey: string): Promise<ProjectResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}`, {
            method: 'GET',
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async createProject(payload: ProjectPayload): Promise<ProjectResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async updateProject(
        projectKey: string,
        payload: ProjectPayload
    ): Promise<ProjectResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async getAudiences(
        projectKey: string
    ): Promise<AudienceResponse[]> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/audiences?perPage=1000`, {
            method: 'GET',
            headers,
        })
        return response.json()
    }

    async createAudience(
        projectKey: string,
        payload: AudiencePayload
    ): Promise<AudienceResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/audiences`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async updateAudience(
        projectKey: string,
        audienceKey: string,
        payload: AudiencePayload
    ): Promise<AudienceResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/audiences/${audienceKey}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async createFeature(projectKey: string, feature: Feature): Promise<Feature> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/features`, {
            method: 'POST',
            body: JSON.stringify(feature),
            headers,
        })
        await this.handleErrors(response)
        return await response.json()
    }

    async updateFeature(projectKey: string, feature: Feature): Promise<Feature> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/features/${feature.key}`, {
            method: 'PATCH',
            body: JSON.stringify(feature),
            headers,
        })
        await this.handleErrors(response)
        return await response.json()
    }

    async getFeaturesForProject(projectKey: string): Promise<Feature[]> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/features?perPage=1000`, {
            headers,
        })
        await this.handleErrors(response)
        return await response.json()
    }

    async getEnvironments(projectKey: string): Promise<EnvironmentResponse[]> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/environments`, {
            method: 'GET',
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async createEnvironment(
        projectKey: string,
        environment: EnvironmentPayload
    ): Promise<EnvironmentResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/environments`, {
            method: 'POST',
            body: JSON.stringify(environment),
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async updateEnvironment(
        projectKey: string,
        environmentKey: string,
        environment: EnvironmentPayload
    ): Promise<EnvironmentResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/environments/${environmentKey}`, {
            method: 'PATCH',
            body: JSON.stringify(environment),
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async updateFeatureConfigurations(
        projectKey: string,
        featureKey: string,
        environment: string,
        configurations: FeatureConfiguration,
        options: { throwOnError: boolean } = { throwOnError: true }
    ): Promise<FeatureConfiguration> {
        const headers = await this.getHeaders()
        const response = await fetch(
            `${DVC_BASE_URL}/projects/${projectKey}/features/${featureKey}/configurations?environment=${environment}`,
            {
                method: 'PATCH',
                body: JSON.stringify(configurations),
                headers,
            })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async createCustomProperty(
        projectKey: string,
        customProperty: CustomPropertiesPayload
    ): Promise<CustomProperties> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/customProperties`, {
            method: 'POST',
            body: JSON.stringify(customProperty),
            headers,
        })
        await this.handleErrors(response)
        return response.json()
    }

    async getCustomPropertiesForProject(projectKey: string): Promise<CustomProperties[]> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/customProperties?perPage=1000`, {
            headers,
        })
        await this.handleErrors(response)
        return await response.json()
    }

    async updateCustomProperty(projectKey: string, customProperty: CustomPropertiesPayload): Promise<CustomProperties> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/customProperties/${customProperty.key}`, {
            method: 'PATCH',
            body: JSON.stringify(customProperty),
            headers,
        })
        await this.handleErrors(response)
        return await response.json()
    }
}
