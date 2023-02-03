export const configs: DVCImporterConfigs = {
  // LaunchDarkly access token, used for pulling feature flags
  ldAccessToken: "",

  // DevCycle client ID and secret, used for fetching API credentials
  dvcClientId: "",
  dvcClientSecret: "",

  // DevCycle project key, features will be created within this project
  dvcProjectKey: "",

}

type DVCImporterConfigs = {
  // LaunchDarkly access token, used for pulling feature flags
  ldAccessToken: string,

  // DevCycle client ID and secret, used for fetching API credentials
  dvcClientId: string,
  dvcClientSecret: string,

  // DevCycle project key, features will be created within this project
  dvcProjectKey: string,

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