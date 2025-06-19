import { ProjectResponse, SegmentResponse } from "../types/LaunchDarkly";
import { handleErrors } from "./utils";

const LD_BASE_URL = "https://app.launchdarkly.com/api/v2";
const LD_API_VERSION = "20240415"; // Latest API version as of April 2024

export default class LDApiWrapper {
  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }
  apiToken: string;

  private async getHeaders() {
    return {
      Authorization: this.apiToken,
      "LD-API-Version": LD_API_VERSION,
    };
  }

  private async handleErrors(response: Response) {
    await handleErrors("Error calling LaunchDarkly API", response);
  }

  async getProject(projectKey: string): Promise<ProjectResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${LD_BASE_URL}/projects/${projectKey}?expand=environments`,
      {
        method: "GET",
        headers,
      }
    );
    await this.handleErrors(response);
    return response.json();
  }

  async getSegments(
    projectKey: string,
    environmentKey: string,
    limit = 20,
    offset = 0
  ): Promise<SegmentResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${LD_BASE_URL}/segments/${projectKey}/${environmentKey}?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers,
      }
    );
    await this.handleErrors(response);
    return response.json();
  }

  async getAllSegments(
    projectKey: string,
    environmentKey: string
  ): Promise<SegmentResponse> {
    const allSegments: any[] = [];
    let offset = 0;
    const limit = 20;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getSegments(
        projectKey,
        environmentKey,
        limit,
        offset
      );
      allSegments.push(...response.items);

      // Check if there are more segments to fetch
      hasMore = response.items.length === limit;
      offset += limit;
    }

    return {
      items: allSegments,
    };
  }

  async getFeatureFlagsForProject(projectKey: string, limit = 20, offset = 0) {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${LD_BASE_URL}/flags/${projectKey}?summary=false&limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers,
      }
    );
    await this.handleErrors(response);
    return response.json();
  }

  async getAllFeatureFlagsForProject(projectKey: string) {
    const allFlags: any[] = [];
    let offset = 0;
    const limit = 20;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getFeatureFlagsForProject(
        projectKey,
        limit,
        offset
      );
      allFlags.push(...response.items);

      // Check if there are more flags to fetch
      hasMore = response.items.length === limit;
      offset += limit;
    }

    return {
      items: allFlags,
    };
  }
}
