import * as dotenv from 'dotenv'
import fs from 'fs'

export const getConfigs = (): ParsedImporterConfig => {
    dotenv.config()

    const defaultConfigsFilePath = './config.json'
    const configFilePath = process.env.CONFIG_FILE_PATH || defaultConfigsFilePath
    const configs = fs.existsSync(configFilePath)
        ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
        : {}
    
    if (configs.includeFeatures) configs.includeFeatures = parseMapFromArray(configs.includeFeatures)
    if (configs.excludeFeatures) configs.excludeFeatures = parseMapFromArray(configs.excludeFeatures)

    if (process.env.LD_ACCESS_TOKEN) configs.ldAccessToken = process.env.LD_ACCESS_TOKEN
    if (process.env.DVC_CLIENT_ID) configs.dvcClientId = process.env.DVC_CLIENT_ID
    if (process.env.DVC_CLIENT_SECRET) configs.dvcClientSecret = process.env.DVC_CLIENT_SECRET
    if (process.env.SOURCE_PROJECT_KEY) configs.sourceProjectKey = process.env.SOURCE_PROJECT_KEY
    if (process.env.TARGET_PROJECT_KEY) configs.targetProjectKey = process.env.TARGET_PROJECT_KEY
    if (process.env.INCLUDE_FEATURES) configs.includeFeatures = parseMapFromArray(process.env.INCLUDE_FEATURES)
    if (process.env.EXCLUDE_FEATURES) configs.excludeFeatures = parseMapFromArray(process.env.EXCLUDE_FEATURES)
    if (process.env.OVERWRITE_DUPLICATES)
        configs.overwriteDuplicates = getOptionalBoolean(process.env.OVERWRITE_DUPLICATES)
    if (process.env.OPERATION_MAP) configs.operationMap = JSON.parse(process.env.OPERATION_MAP)

    if (!configs.targetProjectKey) configs.targetProjectKey = configs.sourceProjectKey

    if (process.env.PROVIDER) configs.provider = process.env.PROVIDER

    validateConfigs(configs)

    return configs
}

/**
 * Validates a key to prevent injection attacks in URL construction
 * Keys should only contain alphanumeric characters, hyphens, underscores, and periods
 */
const validateKey = (key: string, keyName: string): void => {
    if (!key || typeof key !== 'string') {
        throw Error(`${keyName} must be a non-empty string`)
    }
    
    // Pattern for safe keys: alphanumeric, hyphens, underscores, periods
    const validKeyPattern = /^[a-zA-Z0-9._-]+$/
    
    if (!validKeyPattern.test(key)) {
        throw Error(
            `${keyName} contains invalid characters. Only alphanumeric characters, ` +
            'hyphens, underscores, and periods are allowed. This prevents injection attacks.'
        )
    }
}

const validateConfigs = (configs: ParsedImporterConfig) => {
    if (configs.ldAccessToken === '' || configs.ldAccessToken === undefined)
        throw Error('ldAccessToken cannot be empty')
    if (configs.dvcClientId === '' || configs.dvcClientId === undefined)
        throw Error('dvcClientId cannot be empty')
    if (configs.dvcClientSecret === '' || configs.dvcClientSecret === undefined)
        throw Error('dvcClientSecret cannot be empty')
    if (configs.sourceProjectKey === '' || configs.sourceProjectKey === undefined)
        throw Error('sourceProjectKey cannot be empty')
    
    // Validate project keys to prevent security issues with file data in network requests
    validateKey(configs.sourceProjectKey, 'sourceProjectKey')
    if (configs.targetProjectKey) {
        validateKey(configs.targetProjectKey, 'targetProjectKey')
    }
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

    // Source project key, features will be pulled from this project
    sourceProjectKey: string,

    // [Optional] DevCycle project key, features will be created within this project
    // By default, the source project key will be used
    targetProjectKey: string,

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

    // [Optional] the provider to get the features from 
    // By default, this will be launchdarkly
    // TODO: add other providers when they are supported as a union type
    provider?: 'launchdarkly',
}
