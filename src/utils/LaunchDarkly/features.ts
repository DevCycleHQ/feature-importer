import { Feature as DVCFeature, Variation, Variable, VariableType, FeatureType } from '../../types/DevCycle'
import { Feature as LDFeature } from '../../types/LaunchDarkly'
import { formatKey } from '../DevCycle'
import { getVariationKey, getVariationName } from './variation'

export const mapLDFeatureToDVCFeature = (feature: LDFeature): DVCFeature => {
    const { name, description, variations, tags, clientSideAvailability } = feature
    const key = formatKey(feature.key)

    const dvcVariations: Variation[] = variations.map((variation: any, index: number) => {
        const variationName = getVariationName(feature, index)

        return {
            name: variationName,
            key: getVariationKey(feature, index),
            variables: {
                [key]: variation.value,
            }
        }
    })

    const dvcVariables: Variable[] = [{
        key,
        type: getVariableType(variations),
    }]

    const dvcFeature: DVCFeature = {
        name,
        description,
        type: FeatureType.release,
        key,
        variations: dvcVariations,
        variables: dvcVariables,
        tags,
        sdkVisibility: mapSDKVisibility(clientSideAvailability)
    }

    return dvcFeature
}

const getVariableType = (variations: any[]) => {
    const types = variations.map((variation: any) => typeof variation.value)

    if (types.every((type) => type === 'string')) {
        return VariableType.string
    }

    if (types.every((type) => type === 'number')) {
        return VariableType.number
    }

    if (types.every((type) => type === 'boolean')) {
        return VariableType.boolean
    }

    return VariableType.json
}

const mapSDKVisibility = (clientSideAvailability: LDFeature['clientSideAvailability']) => {
    const sdkVisibility: DVCFeature['sdkVisibility'] = {
        mobile: clientSideAvailability?.usingMobileKey ?? true,
        client: clientSideAvailability?.usingEnvironmentIds ?? true,
        server: true,
    }

    return sdkVisibility
}