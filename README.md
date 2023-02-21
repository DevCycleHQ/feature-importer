# DevCycle Feature Importer

DevCycle's Feature Importer is designed to import resources from other feature flag providers. 
The importer is intended to be run on a single project and will create or update a project with the same key containing Environments, Features, and Variables. 

## Table of Contents
- [Setup](#setup)
- [Configuration](#configuration)
  - [Required](#required)
  - [Optional](#optional)
- [Code Migration](#code-migration)

## Setup
1. Run `yarn` to install dependencies
2. Setup [configuration file](#configuration)
3. Run `yarn start` to start import

## Configuration
The feature importer can be configured using environment variables or a JSON config file. 
By default the config is read from `config.json` in the project root, this can be overwritten using `CONFIG_FILE_PATH`.
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
- <b>sourceProjectKey</b>: <i>string</i>
  - LaunchDarkly's project key, resources will be pulled from this project
  - Equivalent env var: SOURCE_PROJECT_KEY

### Optional
- <b>targetProjectKey</b>: <i>string</i>
  - A DevCycle project key, resources will be created within this project. A project will be created with this key if it does not already exist.
  - If not specified, the target project key will be used
  - Equivalent env var: TARGET_PROJECT_KEY
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
  - DevCycle operations: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contain`, `!contain`, `exist`, `!exist`
  - Equivalent env var: OPERATION_MAP

Sample config.json

```json
{
  "ldAccessToken": "api-key",
  "dvcClientId": "clientId",
  "dvcClientSecret": "clientSecret",
  "sourceProjectKey": "project-key",
  "includeFeatures": ["feat-1", "feat-2"],
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
SOURCE_PROJECT_KEY="project-key"
INCLUDE_FEATURES=[feat-1,feat-2]
EXCLUDE_FEATURES=[]
OVERWRITE_DUPLICATES=false
OPERATION_MAP='{"endsWith":"contain","startsWith":"contain"}'
```

## Code Migration
### Migrating Code from LaunchDarkly
- In LD the primary identifier is `key`, in DVC the equivalent value should be passed as `user_id`
- DVC supports the following top-level properties on the user object: see [DVC User Object](https://docs.devcycle.com/docs/sdk/client-side-sdks/javascript#dvc-user-object).
  Any other properties used for targeting should be passed within the `customData` map.
- If you are passing a date to be used with LD's before/after operators, the value should to be converted to a long when passed to DVC. The importer will convert `before` & `after` operators to `<` & `>` in DVC.
- DVC doesn't support targeting by the top-level `isAnonymous` property. If you are using LD's targeting with the `anonymous` attribute, make sure to include an `anonymous` property in the user's `customData`