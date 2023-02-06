import { getConfigs } from './configs'
import DVCWrapper from './DevcycleApiWrapper'
import LDApiWrapper from './LDApiWrapper'

const configs = getConfigs()
if (configs.ldAccessToken === '')
    throw Error("ldAccessToken cannot be empty")
if (configs.dvcClientId === '')
    throw Error("dvcClientId cannot be empty")
if (configs.dvcClientSecret === '')
    throw Error('dvcClientSecret cannot be empty')
if (configs.projectKey === '')
    throw Error('projectKey cannot be empty')

let apiToken: string = '';



DVCWrapper.getApiToken(configs.dvcClientId, configs.dvcClientSecret).then((token: string) => {
    apiToken = token;
});

