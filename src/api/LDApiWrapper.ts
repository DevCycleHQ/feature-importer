const LD_BASE_URL = "https://app.launchdarkly.com/api/v2";

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


    async getProject(project_key: string) {
        const headers = await this.getHeaders()
        const response = await fetch(`${LD_BASE_URL}/projects/${project_key}`, {
            method: "GET",
            headers,
        });
        const data = await response.json();
        return data;
    }
    
    async getFeatureFlagsForProject(project_key: string) {
        const headers = await this.getHeaders()
        const response = await fetch(`${LD_BASE_URL}/flags/${project_key}`, {
            method: "GET",
            headers
        });
        const data = await response.json();
        return data;
    }
}