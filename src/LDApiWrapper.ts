const getLDEnvironments = async (access_token: string, projectKey: string) => {
    const response = await fetch(`https://app.launchdarkly.com/api/v2/projects/${projectKey}/environments`, {
        method: "GET",
        headers: {
            Authorization: `${access_token}`,
        },
    });
    const data = await response.json();
    return data;
};

const getFeatureFlags = async (access_token: string) => {
    const response = await fetch("https://app.launchdarkly.com/api/v2/flags", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    const data = await response.json();
    return data;
};

const getFeatureFlag = async (key: string, access_token: string) => {
    const response = await fetch(`https://app.launchdarkly.com/api/v2/flags/${key}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    const data = await response.json();
    return data;
}

const getFeatureFlagsForProject = async (projectKey: string, access_token: string) => {
    const response = await fetch(`https://app.launchdarkly.com/api/v2/flags/${projectKey}`, {
        method: "GET",
        headers: {
            Authorization: `${access_token}`,
        },
    });
    const data = await response.json();
    return data;
}

const getProjects = async (access_token: string) => {
    const response = await fetch(
        `https://app.launchdarkly.com/api/v2/projects`,
        {
            method: 'GET',
            headers: {
                Authorization: access_token
            }
        }
    );

    const data = await response.json();
    return data;
}


export default { getLDEnvironments, getFeatureFlags, getFeatureFlag, getProjects, getFeatureFlagsForProject };