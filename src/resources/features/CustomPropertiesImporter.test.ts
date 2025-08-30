jest.mock('../../api')

import { DVC } from '../../api'
import { CustomPropertiesImporter } from '.'
import { FeatureImportAction } from './types'
import {
    mockConfig,
    mockAudience
} from '../../api/__mocks__/MockResponses'
import {
    mockGetCustomProperties,
} from '../../api/__mocks__/targetingRules'
import { OperatorType } from '../../types/DevCycle'

const mockDVC = DVC as jest.Mocked<typeof DVC>

describe('CustomPropertiesImporter', () => {
    const mockFeature = { key: 'feature-1' }
    const mockCustomDataAudience = {
        filters: {
            operator: OperatorType.and,
            filters: [
                {
                    type: 'user',
                    subType: 'customData',
                    dataKey: 'customProp',
                    dataKeyType: 'String',
                    comparator: 'contain',
                    values: ['gmail']
                },
                {
                    type: 'user',
                    subType: 'customData',
                    dataKey: 'customProp2',
                    dataKeyType: 'Number',
                    comparator: '=',
                    values: [0]
                },
                {
                    type: 'user',
                    subType: 'customData',
                    dataKey: 'customProp3',
                    dataKeyType: 'Boolean',
                    comparator: '!=',
                    values: [false]
                }
            ]
        }
    }
    const mockTarget = {
        audience: mockCustomDataAudience,
        distribution: [{
            _variation: 'variation-1',
            percentage: 1,
        }]
    }
    const mockTargetingRules = {
        targets: [mockTarget],
        status: 'active' as const
    }
    const mockFeatureImportConfig = {
        environment: 'production',
        targetingRules: mockTargetingRules
    }
    const mockFeaturesToImport = {
        [mockFeature.key]: {
            action: FeatureImportAction.Create,
            feature: mockFeature,
            configs: [mockFeatureImportConfig]
        },
    }

    describe('importCustomProperties', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        test('create custom properties when they do not exist in the DevCycle Project', async () => {
            mockDVC.getCustomPropertiesForProject.mockResolvedValue([])

            const customPropertiesImporter = new CustomPropertiesImporter(mockConfig)
            await customPropertiesImporter.import(mockFeaturesToImport, [])

            expect(Object.values(customPropertiesImporter.propertiesToImport)).toHaveLength(3)

            expect(mockDVC.createCustomProperty).toHaveBeenCalledTimes(3)
            expect(mockDVC.updateCustomProperty).not.toHaveBeenCalled()
        })

        test('does not update custom properties if they already exists in the DevCycle Project when overwriteDuplicates=false', async () => {
            mockDVC.getCustomPropertiesForProject.mockResolvedValue(mockGetCustomProperties)

            const customPropertiesImporter = new CustomPropertiesImporter(mockConfig)
            await customPropertiesImporter.import(mockFeaturesToImport, [])

            expect(Object.values(customPropertiesImporter.propertiesToImport)).toHaveLength(3)

            expect(mockDVC.createCustomProperty).not.toHaveBeenCalled()
            expect(mockDVC.updateCustomProperty).not.toHaveBeenCalled()
        })

        test('update custom properties if they already exists in the DevCycle Project when overwriteDuplicates=true', async () => {
            mockDVC.getCustomPropertiesForProject.mockResolvedValue(mockGetCustomProperties)
  
            const customPropertiesImporter = new CustomPropertiesImporter({ ...mockConfig, overwriteDuplicates: true })
            await customPropertiesImporter.import(mockFeaturesToImport, [])

            expect(Object.values(customPropertiesImporter.propertiesToImport)).toHaveLength(3)

            expect(mockDVC.createCustomProperty).not.toHaveBeenCalled()
            expect(mockDVC.updateCustomProperty).toHaveBeenCalledTimes(3)
        })

        test('create missing custom properties if they don\'t exist in the DevCycle Project and not update any when overwriteDuplicates=false', async () => {
            mockDVC.getCustomPropertiesForProject.mockResolvedValue([mockGetCustomProperties[0]])

            const customPropertiesImporter = new CustomPropertiesImporter(mockConfig)
            await customPropertiesImporter.import(mockFeaturesToImport, [])

            expect(Object.values(customPropertiesImporter.propertiesToImport)).toHaveLength(3)

            expect(mockDVC.createCustomProperty).toHaveBeenCalledTimes(2)
            expect(mockDVC.updateCustomProperty).not.toHaveBeenCalled()
        })

        test('create missing custom properties if they don\'t exist in the DevCycle Project and not update any when overwriteDuplicates=true', async () => {
            mockDVC.getCustomPropertiesForProject.mockResolvedValue([mockGetCustomProperties[0]])

            const customPropertiesImporter = new CustomPropertiesImporter({ ...mockConfig, overwriteDuplicates: true })
            await customPropertiesImporter.import(mockFeaturesToImport, [])

            expect(Object.values(customPropertiesImporter.propertiesToImport)).toHaveLength(3)

            expect(mockDVC.createCustomProperty).toHaveBeenCalledTimes(2)
            expect(mockDVC.updateCustomProperty).toHaveBeenCalledTimes(1)
        })

        test('create custom properties from audiences', async () => {
            mockDVC.getCustomPropertiesForProject.mockResolvedValue([])

            const audience = {
                ...mockAudience,
                ...mockCustomDataAudience
            }

            const customPropertiesImporter = new CustomPropertiesImporter(mockConfig)
            await customPropertiesImporter.import({}, [audience])

            expect(Object.values(customPropertiesImporter.propertiesToImport)).toHaveLength(3)

            expect(mockDVC.createCustomProperty).toHaveBeenCalledTimes(3)
            expect(mockDVC.updateCustomProperty).not.toHaveBeenCalled()
        })

        test('creates custom property only once when multiple rules contain the same custom data', async () => {
            mockDVC.getCustomPropertiesForProject.mockResolvedValue([])

            const audience = {
                ...mockAudience,
                ...mockCustomDataAudience
            }

            const customPropertiesImporter = new CustomPropertiesImporter(mockConfig)
            await customPropertiesImporter.import(mockFeaturesToImport, [audience])

            expect(Object.values(customPropertiesImporter.propertiesToImport)).toHaveLength(3)

            expect(mockDVC.createCustomProperty).toHaveBeenCalledTimes(3)
            expect(mockDVC.updateCustomProperty).not.toHaveBeenCalled()
        })
    })
})
