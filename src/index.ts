import { getConfigs } from './configs'
import DVCWrapper from './DevcycleApiWrapper'
import LDApiWrapper from './LDApiWrapper'

const configs = getConfigs()

if (configs.ldAccessToken === '')
    throw Error("ldAccessToken cannot be empty")
if (configs.dvcClientId === '')
    throw Error("dvcClientId cannot be empty")
if (configs.dvcClientSecret === '')
    throw Error("dvcClientSecret cannot be empty")
if (configs.projectKey === '')
    throw Error("projectKey cannot be empty")

let apiToken: string = '';



DVCWrapper.getApiToken(configs.dvcClientId, configs.dvcClientSecret).then((token: string) => {
    apiToken = token;
    console.log(apiToken);
}
);

LDApiWrapper.getProjects(configs.ldAccessToken).then((data: any) => {
    data.items.forEach((project: any) => {
        LDApiWrapper.getLDEnvironments(configs.ldAccessToken, project.key).then((data: any) => {
            console.log(data);
        }
        );
    });
}
);
