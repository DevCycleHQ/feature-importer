import * as dotenv from "dotenv";
import fs from "fs";


export const getConfigs = (): DVCImporterConfigs => {

  dotenv.config();
  const defaultConfigsFilePath = "./configs.json";
  const configFilePath = process.env.CONFIG_FILE_PATH || defaultConfigsFilePath;
  let configs: DVCImporterConfigs = {
    ldAccessToken: "",
    dvcClientId: "",
    dvcClientSecret: "",
    projectKey: "",
  };

  if (fs.existsSync(configFilePath)) {
    const fileConfigs = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
    configs = {
      ldAccessToken: fileConfigs.ldAccessToken,
      dvcClientId: fileConfigs.dvcClientId,
      dvcClientSecret: fileConfigs.dvcClientSecret,
      projectKey: fileConfigs.projectKey,
      includeFeatures: fileConfigs.includeFeatures,
      excludeFeatures: fileConfigs.excludeFeatures,
      overwriteDuplicates: fileConfigs.overwriteDuplicates,
    }
  }

  configs = overWriteConfigsWithEnvVars(configs);

  // validateConfigs(configs);

  return configs
}

const validateConfigs = (configs: DVCImporterConfigs) => {
  if (configs.ldAccessToken === '' || configs.ldAccessToken === undefined)
    throw Error("ldAccessToken cannot be empty")
  if (configs.dvcClientId === '' || configs.dvcClientId === undefined)
    throw Error("dvcClientId cannot be empty")
  if (configs.dvcClientSecret === '' || configs.dvcClientSecret === undefined)
    throw Error("dvcClientSecret cannot be empty")
  if (configs.projectKey === '' || configs.projectKey === undefined)
    throw Error("projectKey cannot be empty")
}


const overWriteConfigsWithEnvVars = (configs: DVCImporterConfigs): DVCImporterConfigs => {
  return {
    ldAccessToken: process.env.LD_ACCESS_TOKEN || configs.ldAccessToken,
    dvcClientId: process.env.DVC_CLIENT_ID || configs.dvcClientId,
    dvcClientSecret: process.env.DVC_CLIENT_SECRET || configs.dvcClientSecret,
    projectKey: process.env.PROJECT_KEY || configs.projectKey,
    includeFeatures: process.env.INCLUDE_FEATURES ? getOptionalArray(process.env.INCLUDE_FEATURES) : configs.includeFeatures,
    excludeFeatures: process.env.EXCLUDE_FEATURES ? getOptionalArray(process.env.EXCLUDE_FEATURES) : configs.excludeFeatures,
    overwriteDuplicates: process.env.OVERWRITE_DUPLICATES ? getOptionalBoolean(process.env.OVERWRITE_DUPLICATES) : configs.overwriteDuplicates,
  }
}

const getOptionalArray = (value: string | undefined): string[] => {
  if (value === "" || value === undefined) {
    return [];
  }
  return JSON.parse(value);
};

const getOptionalBoolean = (value: string | undefined): boolean => {
  if (value === "" || value === undefined) {
    return false;
  }
  return JSON.parse(value);
};


type DVCImporterConfigs = {
  // LaunchDarkly access token, used for pulling feature flags
  ldAccessToken: string,

  // DevCycle client ID and secret, used for fetching API credentials
  dvcClientId: string,
  dvcClientSecret: string,

  // DevCycle project key, features will be created within this project
  projectKey: string,

  // [Optional] An array of LD feature flag keys to be imported
  // By default, the importer will attempt to migrate all features
  includeFeatures?: string[],

  // [Optional] An array of LD feature flag keys to be skipped when importing
  excludeFeatures?: string[],

  // [Optional] If true, when the importer encounters a duplicate feature
  // it will be overwritten
  // By default, the importer will skip duplicates
  overwriteDuplicates?: boolean,

}