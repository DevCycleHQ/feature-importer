import { configs } from './configs'


if (configs.ldAccessToken === '')
    throw Error("ldAccessToken cannot be empty")
if (configs.dvcClientId === '')
    throw Error("dvcClientId cannot be empty")
if (configs.dvcClientSecret === '')
    throw Error("dvcClientSecret cannot be empty")
if (configs.dvcProjectKey === '')
    throw Error("dvcProjectKey cannot be empty")


console.log(configs)
