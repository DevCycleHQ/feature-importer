import * as dotenv from "dotenv";
import fs from "fs";


export const getConfigs = (): DVCImporterConfigs => {

  dotenv.config();
  const configFilePath = process.env.CONFIG_FILE_PATH || "";

  if (fs.existsSync(configFilePath)) {
    const fileConfigs = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
    return {
      ldAccessToken: fileConfigs.ldAccessToken || process.env.LD_ACCESS_TOKEN,
      dvcClientId: fileConfigs.dvcClientId || process.env.DVC_CLIENT_ID,
      dvcClientSecret: fileConfigs.dvcClientSecret || process.env.DVC_CLIENT_SECRET,
      projectKey: fileConfigs.projectKey || process.env.PROJECT_KEY,
      includeFeatures: fileConfigs.includeFeatures || (process.env.INCLUDE_FEATURES ? JSON.parse(process.env.INCLUDE_FEATURES) : []),
      excludeFeatures: fileConfigs.excludeFeatures || (process.env.EXCLUDE_FEATURES ? JSON.parse(process.env.EXCLUDE_FEATURES) : []),
      overwriteDuplicates: fileConfigs.overwriteDuplicates || (process.env.OVERWRITE_DUPLICATES ? JSON.parse(process.env.OVERWRITE_DUPLICATES) : false),
    }
  }
  return {
    ldAccessToken: process.env.LD_ACCESS_TOKEN || "",
    dvcClientId: process.env.DVC_CLIENT_ID || "",
    dvcClientSecret: process.env.DVC_CLIENT_SECRET || "",
    projectKey: process.env.PROJECT_KEY || "",
    includeFeatures: process.env.INCLUDE_FEATURES ? JSON.parse(process.env.INCLUDE_FEATURES) : [],
    excludeFeatures: process.env.EXCLUDE_FEATURES ? JSON.parse(process.env.EXCLUDE_FEATURES) : [],
    overwriteDuplicates: process.env.OVERWRITE_DUPLICATES ? JSON.parse(process.env.OVERWRITE_DUPLICATES) : false,
  }
}

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
  includeFeatures?: [],

  // [Optional] An array of LD feature flag keys to be skipped when importing
  excludeFeatures?: [],

  // [Optional] If true, when the importer encounters a duplicate feature
  // it will be overwritten
  // By default, the importer will skip duplicates
  overwriteDuplicates?: boolean,

}