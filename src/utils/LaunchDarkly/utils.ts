import { Feature, Variation, Variable, VariableType } from "../../types/DevCycle"
import { LDFeature } from "../../types/LaunchDarkly"
import { kebabCase } from 'lodash'

export const mapLDFeatureToDVCFeature = (feature: LDFeature): Feature => {
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
