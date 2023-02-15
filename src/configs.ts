import * as dotenv from 'dotenv'
import fs from 'fs'

export const getConfigs = (): ParsedImporterConfig => {

    dotenv.config()
    const defaultConfigsFilePath = './configs.json'
    const configFilePath = process.env.CONFIG_FILE_PATH || defaultConfigsFilePath
    const configs = fs.existsSync(configFilePath)
        ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
        : {}
    
    if (configs.includeFeatures) configs.includeFeatures = parseMapFromArray(configs.includeFeatures)
    if (configs.excludeFeatures) configs.excludeFeatures = parseMapFromArray(configs.excludeFeatures)

    if (process.env.LD_ACCESS_TOKEN) configs.ldAccessToken = process.env.LD_ACCESS_TOKEN
    if (process.env.DVC_CLIENT_ID) configs.dvcClientId = process.env.DVC_CLIENT_ID
    if (process.env.DVC_CLIENT_SECRET) configs.dvcClientSecret = process.env.DVC_CLIENT_SECRET
    if (process.env.PROJECT_KEY) configs.projectKey = process.env.PROJECT_KEY
    if (process.env.INCLUDE_FEATURES) configs.includeFeatures = parseMapFromArray(process.env.INCLUDE_FEATURES)
    if (process.env.EXCLUDE_FEATURES) configs.excludeFeatures = parseMapFromArray(process.env.EXCLUDE_FEATURES)
    if (process.env.OVERWRITE_DUPLICATES)
        configs.overwriteDuplicates = getOptionalBoolean(process.env.OVERWRITE_DUPLICATES)
    if (process.env.OPERATION_MAP) configs.operationMap = JSON.parse(process.env.OPERATION_MAP)

    validateConfigs(configs)

    return configs
}

const validateConfigs = (configs: ParsedImporterConfig) => {
    if (configs.ldAccessToken === '' || configs.ldAccessToken === undefined)
        throw Error('ldAccessToken cannot be empty')
    if (configs.dvcClientId === '' || configs.dvcClientId === undefined)
        throw Error('dvcClientId cannot be empty')
    if (configs.dvcClientSecret === '' || configs.dvcClientSecret === undefined)
        throw Error('dvcClientSecret cannot be empty')
    if (configs.projectKey === '' || configs.projectKey === undefined)
        throw Error('projectKey cannot be empty')
}

const parseMapFromArray = (value: string | string[] | undefined): Map<string, boolean> | undefined => {
    if (value === '' || value === undefined) {
        return undefined
    }

    let keyArray: string[] = []
    if (!Array.isArray(value)) {
        keyArray = value.replace(/[\[\]]/g, '').split(',')
    } else {
        keyArray = value
    }

    const parsedMap = keyArray.reduce((map: Map<string, boolean>, key: string) => {
        map.set(key, true)
        return map
    }, new Map<string, boolean>())
    return parsedMap
}

const getOptionalBoolean = (value: string | undefined): boolean => {
    if (value === '' || value === undefined) {
        return false
    }
    return JSON.parse(value)
}

export type ParsedImporterConfig = {
    // LaunchDarkly access token, used for pulling feature flags
    ldAccessToken: string,

    // DevCycle client ID and secret, used for fetching API credentials
    dvcClientId: string,
    dvcClientSecret: string,

    // DevCycle project key, features will be created within this project
    projectKey: string,

    // [Optional] A map of LD feature flag keys to be imported
    // By default, the importer will attempt to migrate all features
    includeFeatures?: Map<string, boolean>,

    // [Optional] A map of LD feature flag keys to be skipped when importing
    excludeFeatures?: Map<string, boolean>,

    // [Optional] If true, when the importer encounters a duplicate feature
    // it will be overwritten
    // By default, the importer will skip duplicates
    overwriteDuplicates?: boolean,

    // [Optional] A map of LD operations to map to DevCycle operations
    // By default, the importer will skip unsupported operations
    operationMap?: { [key: string]: string },
}
