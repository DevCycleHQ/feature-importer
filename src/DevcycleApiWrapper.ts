const getProjects = async (access_token: string) => {
    const response = await fetch("https://api.devcycle.com/v1/projects", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    const data = await response.json();
    return data;

}

const getApiToken = async (dvcClientId: string, dvcClientSecret: string): Promise<string> => {
    const response = await fetch("https://auth.devcycle.com/oauth/token", {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            audience: "https://api.devcycle.com/",
            client_id: dvcClientId,
            client_secret: dvcClientSecret,
        }
        ),
    });
    const data = await response.json();
    return data.access_token;
};

const getProjectKey = async (access_token: string, dvcProjectKey: string) => {
    const response = await fetch(`https://api.devcycle.com/v1/projects/${dvcProjectKey}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    const data = await response.json();
    return data;
}

export default { getProjects, getApiToken, getProjectKey }