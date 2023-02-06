const DVC_BASE_URL = "https://api.devcycle.com/v1";

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

export default { getApiToken }