import { getConfigs } from './configs'

const configs = getConfigs()

if (configs.ldAccessToken === '')
  throw Error("ldAccessToken cannot be empty")
if (configs.dvcClientId === '')
  throw Error("dvcClientId cannot be empty")
if (configs.dvcClientSecret === '')
  throw Error("dvcClientSecret cannot be empty")
if (configs.projectKey === '')
  throw Error("projectKey cannot be empty")


console.log(configs)
