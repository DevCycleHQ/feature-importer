const DVC_BASE_URL = "https://api.devcycle.com/v1";

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
        const response = await fetch("https://auth.devcycle.com/oauth/token", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                audience: "https://api.devcycle.com/",
                client_id: this.dvcClientId,
                client_secret: this.dvcClientSecret,
            }
            ),
        });
        const data = await response.json();
        return data.access_token;
    };

    private async getHeaders() {
        const token = await this.getApiToken()
        return {
            Authorization: token,
            'Content-Type': 'application/json'
        }
    }

    async getProject(projectKey: string) {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}`, {
            method: "GET",
            headers,
        });
        return response.json();
    }

    async createProject(payload: Record<string, string>) {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers,
        });
        return response.json();
    }

    async updateProject (projectKey: string, payload: Record<string, string>) {
        const headers = await this.getHeaders()
        const response = await fetch(`${DVC_BASE_URL}/projects/${projectKey}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
            headers,
        });
        return response.json();
    }
}