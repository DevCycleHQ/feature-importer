import { Feature as DVCFeature, Variation, Variable, VariableType } from '../../types/DevCycle'
import { Feature as LDFeature } from '../../types/LaunchDarkly'
import { kebabCase } from 'lodash'

export const mapLDFeatureToDVCFeature = (feature: LDFeature): DVCFeature => {
    const { name, description, key, kind, variations, tags } = feature

    const dvcVariations: Variation[] = variations.map((variation: any, index: number) => {
        const variationName = variation.name || `Variation ${index + 1}`

        return {
            name: variationName,
            key: kebabCase(variationName),
            variables: {
                [key]: variation.value,
            }
        }
    })

    const dvcVariables: Variable[] = [{
        key,
        type: VariableType[kind],
    }]

    const dvcFeature: DVCFeature = {
        name,
        description,
        key,
        variations: dvcVariations,
        variables: dvcVariables,
        tags,
    }

    return dvcFeature
}
