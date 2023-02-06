# DevCycle Feature Importer

## Required Configs

- <String>LaunchDarkly access token, used for pulling feature flags
  - ldAccessToken
  - process.env.LD_ACCESS_TOKEN
- <String> DevCycle client ID and secret, used for fetching API credentials
  - dvcClientId
  - dvcClientSecret
  - process.env.DVC_CLIENT_ID
  - process.env.DVC_CLIENT_SECRET
- <String> LaunchDarkly's project key, a project will be created with the same details in DevCycle
  - projectKey
  - process.env.PROJECT_KEY

## Optional Configs

- <Array<String>> An array of LD feature flag keys to be imported
  **Default : []**
  By default, the importer will attempt to migrate all features
  - includeFeatures
  - process.env.INCLUDE_FEATURES
- <Array<String>> An array of LD feature flag keys to be skipped when importing
  **Default :[]**
  - excludeFeatures
  - process.env.EXCLUDE_FEATURES
- <Boolean> If true, when the importer encounters a duplicate feature it will be overwritten
  **Default :false**
  By default, the importer will skip duplicates
  - overwriteDuplicates
  - process.env.OVERWRITE_DUPLICATES

Configs can be added as part of .env file or if you would like to add them as a json
default config file path is `./configs.json` use CONFIG_FILE_PATH in your .env file to overwrite the default path

sample configs.json

```json
{
  "ldAccessToken": "api-key",
  "dvcClientId": "clientId",
  "dvcClientSecret": "clientSecret",
  "projectKey": "project-key",
  "includeFeatures": [],
  "excludeFeatures": [],
  "overwriteDuplicates": false
}
```

sample .env file using a json file

```bash
CONFIG_FILE_PATH="./configs.json"
```

sample .env file not using a json file

```bash
LD_ACCESS_TOKEN="api-key"
DVC_CLIENT_ID="clientId"
DVC_CLIENT_SECRET="clientSecret"
PROJECT_KEY="project-key"
INCLUDE_FEATURES=[]
EXCLUDE_FEATURES=[]
OVERWRITE_DUPLICATES=false
```
