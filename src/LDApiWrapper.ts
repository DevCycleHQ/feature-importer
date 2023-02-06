const LD_BASE_URL = "https://app.launchdarkly.com/api/v2";


const getFeatureFlagsForProject = async (access_token: string, project_key: string,) => {
    const response = await fetch(`${LD_BASE_URL}/flags/${project_key}`, {
        method: "GET",
        headers: {
            Authorization: `${access_token}`,
        },
    });
    const data = await response.json();
    return data;
}

export default { getFeatureFlagsForProject };