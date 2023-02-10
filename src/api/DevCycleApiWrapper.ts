import { handleErrors } from './utils'
import {
    AudiencePayload,
    AudienceResponse,
    EnvironmentPayload,
    EnvironmentResponse,
    Feature,
    ProjectPayload,
    ProjectResponse
} from '../types/DevCycle'

const DVC_BASE_URL = process.env.DVC_BASE_URL || "https://api.devcycle.com/v1"

type Options = {
    throwOnError: boolean
}

const defaultOptions = {
    throwOnError: true
}

export default class DevCycleApiWrapper {
    constructor(dvcClientId: string, dvcClientSecret: string) {
        this.dvcClientId = dvcClientId
        this.dvcClientSecret = dvcClientSecret
    }
    dvcClientId: string
    dvcClientSecret: string
    apiToken: string

    private async getApiToken(): Promise<string> {
        if (this.apiToken) return this.apiToken
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
        return data.access_token
    }

    private async getHeaders() {
        const token = await this.getApiToken()
        return {
            Authorization: token,
            'Content-Type': 'application/json'
        }
    }

    private async handleErrors(response: Response) {
        await handleErrors('Error calling DevCycle API', response)
    }

    async getProject(
        projectKey: string,
        options: Options = defaultOptions
    ): Promise<ProjectResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}`, {
            method: 'GET',
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async createProject(
        payload: ProjectPayload,
        options: Options = defaultOptions
    ): Promise<ProjectResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async updateProject(
        projectKey: string,
        payload: ProjectPayload,
        options: Options = defaultOptions
    ): Promise<ProjectResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async getAudiences(
        projectKey: string,
        options: Options = defaultOptions
    ): Promise<AudienceResponse[]> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/audiences`, {
            method: 'GET',
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async createAudience(
        projectKey: string,
        payload: AudiencePayload,
        options: Options = defaultOptions
    ): Promise<AudienceResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/audiences`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async updateAudience(
        projectKey: string,
        audienceKey: string,
        payload: AudiencePayload,
        options: Options = defaultOptions
    ): Promise<AudienceResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/audiences/${audienceKey}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async createFeature(projectKey: string, feature: Feature, options: Options = defaultOptions)  {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/features`, {
            method: 'POST',
            body: JSON.stringify(feature),
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return await response.json()
    }
    
    async updateFeature(projectKey: string, feature: Feature, options: Options = defaultOptions) {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/features/${feature.key}`, {
            method: 'PATCH',
            body: JSON.stringify(feature),
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return await response.json()
    }
    
    async getFeaturesForProject(projectKey: string, options: Options = defaultOptions) {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/features`, {
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return await response.json()
    }


    async getEnvironments(
        projectKey: string,
        options: Options = defaultOptions
    ): Promise<EnvironmentResponse[]> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/environments`, {
            method: "GET",
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async createEnvironment(
        projectKey: string,
        environment: EnvironmentPayload,
        options: Options = defaultOptions
    ): Promise<EnvironmentResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/environments`, {
            method: "POST",
            body: JSON.stringify(environment),
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

    async updateEnvironment(
        projectKey: string,
        environmentKey: string,
        environment: EnvironmentPayload,
        options: Options = defaultOptions
    ): Promise<EnvironmentResponse> {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}/environments/${environmentKey}`, {
            method: "PATCH",
            body: JSON.stringify(environment),
            headers,
        })
        if (options.throwOnError) await this.handleErrors(response)
        return response.json()
    }

}