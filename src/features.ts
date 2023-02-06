import { kebabCase } from 'lodash'
import { getConfigs } from './configs'
import { LD, DVC } from './api'

const config = getConfigs()

export type Feature = {
    _id?: string
    _project?: string
    name?: string
    description?: string
    key: string
    type?: 'release' | 'experiment' | 'permission' | 'ops'
    variations?: Variation[]
    variables?: Variable[]
}

export type Variable = {
    name?: string
    description?: string
    key: string
    _feature?: string
    type: 'String' | 'Number' | 'Boolean' | 'JSON'
    defaultValue?: object
}

export type Variation = {
    key: string
    name: string
    variables?: {
        [key: string]: string | number | boolean | object
    }
}

export type LDFeature = {
    name: string
    kind: 'string' | 'number' | 'boolean' | 'json'
    description: string
    key: string
    _version: number
    creationDate: number
    includeInSnippet: boolean
    clientSideAvailability: {
        usingEnvironmentIds: boolean
        usingMobileKey: boolean
    }
    variations: {
        _id: string
        value: boolean
    }[]
    temporary: boolean
    tags: string[]
    _links: {
        self: {
            href: string
            type: string
        }
    }
    maintainerId: string
}

enum VariableType {
    string = 'String',
    number = 'Number',
    boolean = 'Boolean',
    json = 'JSON',
}

const mapLDFeatureToDVCFeature = (feature: LDFeature): Feature => {
    const { name, description, key, kind, variations } = feature

    const dvcVariations: Variation[] = variations.map((variation: any, index: number) => {
        return {
            name: variation.name ? variation.name : `Variation ${index + 1}`,
            key: variation.name ? kebabCase(variation.name) : `variation-${index + 1}`,
            variables: {
                [key]: variation.value,
            }
        }
    })

    const dvcVariables: Variable[] = [{
        key,
        type: VariableType[kind],
    }]

    const dvcFeature: Feature = {
        name,
        description,
        key,
        variations: dvcVariations,
        variables: dvcVariables,
    }

    return dvcFeature
}

export const importFeatures = async () => {
    const { includeFeatures, excludeFeatures, overwriteDuplicates, projectKey } = config

    const existingFeatures = await DVC.getFeaturesForProject(projectKey)
    let { items: featuresToImport } = await LD.getFeatureFlagsForProject(projectKey)

    let featuresToCreate: Feature[] = []
    let featuresToUpdate: Feature[] = []
    const featuresToSkip: Feature[] = []

    const featureErrorList: Feature[] = []

    if (includeFeatures !== undefined && includeFeatures.length > 0) {
        featuresToImport = featuresToImport.filter((feature: LDFeature) => includeFeatures.includes(feature.key))
    }

    featuresToImport.filter((feature: LDFeature) => {
        const mappedFeature = mapLDFeatureToDVCFeature(feature)
        if (existingFeatures.find((existingFeature: Feature) => existingFeature.key === feature.key)) {
            if (overwriteDuplicates) {
                featuresToUpdate.push(mappedFeature)
            } else {
                featuresToSkip.push(mappedFeature)
            }
        } else {
            featuresToCreate.push(mappedFeature)
        }
    })

    if (excludeFeatures !== undefined && excludeFeatures.length > 0) {
        featuresToCreate = featuresToCreate.filter((feature) => !excludeFeatures.includes(feature.key))
        featuresToUpdate = featuresToUpdate.filter((feature) => !excludeFeatures.includes(feature.key))
    }

    let createdCount = 0
    let updatedCount = 0

    for (let feature of featuresToCreate) {
        const response = await DVC.createFeature(projectKey, feature)
        if (response?.statusCode) {
            featureErrorList.push(response)
        } else {
            createdCount += 1
        }
    }

    for (let feature of featuresToUpdate) {
        const response = await DVC.updateFeature(projectKey, feature)
        if (response?.statusCode) {
            featureErrorList.push(response)
        } else {
            updatedCount += 1
        }
    }

    return {
        createdCount,
        updatedCount,
        skipped: featuresToSkip,
        errored: featureErrorList,
    }
}
