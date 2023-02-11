import kebabCase from 'lodash/kebabCase'
import { Feature } from '../../types/LaunchDarkly'

export const getVariationKey = (feature: Feature, variationIndex: number) => {
    return kebabCase(getVariationName(feature, variationIndex))
}

export const getVariationName = (feature: Feature, variationIndex: number) => {
    const variation = feature.variations[variationIndex]
    return (variation.name || `Variation ${variationIndex + 1}`).trim()
}