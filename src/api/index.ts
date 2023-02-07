import { getConfigs } from '../configs'
import DVCApiWrapper from './DevcycleApiWrapper'
import LDApiWrapper from './LDApiWrapper'

const config = getConfigs()
export const LD = new LDApiWrapper(config.ldAccessToken)
export const DVC = new DVCApiWrapper(config.dvcClientId, config.dvcClientSecret)