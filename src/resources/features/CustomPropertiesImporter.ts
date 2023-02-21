import { kebabCase } from 'lodash'
import { DVC } from '../../api'
import { ParsedImporterConfig } from '../../configs'
import { AudienceResponse, CustomProperties, FilterOrOperator } from '../../types/DevCycle'
import { convertDataKeyTypeToCustomPropertyType } from '../../utils/DevCycle'
import { CustomPropertyFromFilter, FeatureImportAction, FeaturesToImport } from './types'

export class CustomPropertiesImporter {
    private config: ParsedImporterConfig
    propertiesToImport: Record<string, CustomPropertyFromFilter> = {}

    constructor(config: ParsedImporterConfig) {
        this.config = config
    }

    private getPropertiesToImport(featuresToImport: FeaturesToImport, audiences: AudienceResponse[]) {
        const getPropertiesFromFilters = (filters: FilterOrOperator[]) => {
            filters.forEach((filter) => {
                if ('filters' in filter) {
                    getPropertiesFromFilters(filter.filters)
                } else if (filter.subType === 'customData' && filter.dataKey) {
                    this.propertiesToImport[filter.dataKey] = {
                        dataKey: filter.dataKey || '',
                        dataKeyType: convertDataKeyTypeToCustomPropertyType(filter.dataKeyType)
                    }
                }
            })
        }

        // Features
        Object.values(featuresToImport).forEach(({ configs, action }) => {
            if (action !== FeatureImportAction.Create && action !== FeatureImportAction.Update) return

            configs?.forEach(({ targetingRules }) => {
                targetingRules.targets.forEach((target) => {
                    getPropertiesFromFilters(target.audience?.filters?.filters)
                })
            })
        })

        // Reusable Audiences
        audiences.forEach((audience) => {
            getPropertiesFromFilters(audience.filters?.filters)
        })
    }

    private async importCustomProperties() {
        const { overwriteDuplicates, targetProjectKey } = this.config
        const existingCustomPropertiesMap = await DVC.getCustomPropertiesForProject(targetProjectKey)
            .then((existingCustomProperties) => existingCustomProperties.reduce((map: Record<string, CustomProperties>, cp) => {
                map[cp.propertyKey] = cp
                return map
            }, {}))
        for (const customProperty of Object.values(this.propertiesToImport)) {
            const customPropertyToCreate = {
                key: kebabCase(customProperty.dataKey),
                name: customProperty.dataKey,
                type: customProperty.dataKeyType,
                propertyKey: customProperty.dataKey,
            }
            const isDuplicate = existingCustomPropertiesMap[customPropertyToCreate.propertyKey] !== undefined
            try {
                if (!isDuplicate) {
                    await DVC.createCustomProperty(targetProjectKey, customPropertyToCreate)
                    console.log(`Creating custom property "${customPropertyToCreate.propertyKey}"`)
                } else if (overwriteDuplicates) {
                    await DVC.updateCustomProperty(targetProjectKey, customPropertyToCreate)
                    console.log(`Updating custom property "${customPropertyToCreate.propertyKey}"`)
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'unknown error'
                console.log(`Error Importing Custom Property "${customPropertyToCreate.propertyKey}": ${errorMessage}`)
            }
        }
    }

    async import(featuresToImport: FeaturesToImport, audiences: AudienceResponse[]) {
        this.getPropertiesToImport(featuresToImport, audiences)
        await this.importCustomProperties()
    }
}