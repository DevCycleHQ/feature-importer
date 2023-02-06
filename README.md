# DevCycle Feature Importer

## Required Configs

    ldAccessToken: process.env.LD_ACCESS_TOKEN
    dvcClientId: process.env.DVC_CLIENT_ID
    dvcClientSecret: process.env.DVC_CLIENT_SECRET
    projectKey: process.env.PROJECT_KEY

## Optional Configs

    includeFeatures: process.env.INCLUDE_FEATURES
    excludeFeatures: process.env.EXCLUDE_FEATURES
    overwriteDuplicates: process.env.OVERWRITE_DUPLICATES

Configs can be added as part of .env file or if you would like to add them as a json file
you will have to provide the path to the file through CONFIG_FILE_PATH in your environments

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
