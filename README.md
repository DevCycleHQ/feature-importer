# DevCycle Feature Importer

DevCycle's Feature Importer is designed to import resources from other feature flag providers. 
The importer is intended to be run on a single project and will create or update a project with the same key containing Environments, Features, and Variables. 

## Table of Contents
- [Setup](#setup)
- [Configuration](#configuration)
  - [Required](#required)
  - [Optional](#optional)
- [Changes Necessary when Migrating Code](#changes-necessary-when-migrating-code)

## Setup
1. Run `yarn` to install dependencies
2. Setup [configuration file](#configuration)
3. Run `yarn start` to start import

## Configuration
The feature importer can be configured using environment variables or a JSON config file. 
By default the config is read from `configs.json` in the project root, this can be overwritten using `CONFIG_FILE_PATH`.
### Required

- <b>ldAccessToken</b>: <i>string</i>
  - LaunchDarkly access token, used for pulling feature flags
  - Equivalent env var: LD_ACCESS_TOKEN
- <b>dvcClientId</b>: <i>string</i>
  - DevCycle client ID, used for fetching API credentials
  - Equivalent env var: DVC_CLIENT_ID
- <b>dvcClientSecret</b>: <i>string</i>
  - DevCycle client secret, used for fetching API credentials
  - Equivalent env var: DVC_CLIENT_SECRET
- <b>projectKey</b>: <i>string</i>
  - LaunchDarkly's project key, a project will be created with the same details in DevCycle
  - Equivalent env var: PROJECT_KEY

### Optional

- <b>includeFeatures</b>: <i>string[]</i>
  - An array of LD feature flag keys to be imported. By default, the importer will attempt to migrate all features.
  - Equivalent env var: INCLUDE_FEATURES
- <b>excludeFeatures</b>: <i>string[]</i>
  - An array of LD feature flag keys to be skipped when importing.
  - Equivalent env var: EXCLUDE_FEATURES
- <b>overwriteDuplicates</b>: <i>boolean</i>
  - If true, when the importer encounters a duplicate resource it will be overwritten. By default, duplicates will be skipped.
  - Equivalent env var: OVERWRITE_DUPLICATES
- <b>operationMap</b>: <i>Map<string, string></i>
  - A map of LD operations to map to DevCycle operations
  - DevCycle operations: `=`, `!=`, `>`, `<`, `>=`, `<=`, `true`, `false`, `contain`, `!contain`, `exist`, `!exist`
  - Equivalent env var: OPERATION_MAP

Sample configs.json

```json
{
  "ldAccessToken": "api-key",
  "dvcClientId": "clientId",
  "dvcClientSecret": "clientSecret",
  "projectKey": "project-key",
  "includeFeatures": ["feat-1"],
  "excludeFeatures": [],
  "overwriteDuplicates": false,
  "operationMap": {
		"startsWith": "contain",
		"endsWith": "contain"
	}
}
```

Sample .env file

```bash
LD_ACCESS_TOKEN="api-key"
DVC_CLIENT_ID="clientId"
DVC_CLIENT_SECRET="clientSecret"
PROJECT_KEY="project-key"
INCLUDE_FEATURES=["feat-1"]
EXCLUDE_FEATURES=[]
OVERWRITE_DUPLICATES=false
OPERATION_MAP='{"endsWith":"contain","startsWith":"contain"}'
```

## Changes Necessary when Migrating Code
- For rules where the attribute is a date and using the before/after operators, the value needs to be converted to a long instead of sending as a date.
