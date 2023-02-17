jest.mock('../../api')

import { LD, DVC } from '../../api'
import { LDFeatureImporter } from '.'
import { FeatureImportAction, FeaturesToImport } from './types'
import {
    mockConfig,
    mockDVCFeaturesResponse,
    mockLDFeaturesFlags,
    mockLDFeaturesMappedToDVC
} from '../../api/__mocks__/MockResponses'
import { LDAudienceImporter } from '../audiences'
import {
    featureConfigResponse,
    mockAudience,
    mockFeature
} from '../../api/__mocks__/targetingRules'
import { mapLDFeatureToDVCFeature } from '../../utils/LaunchDarkly'

const mockLD = LD as jest.Mocked<typeof LD>
const mockDVC = DVC as jest.Mocked<typeof DVC>

const audienceImport = new LDAudienceImporter(mockConfig)

describe('LDFeatureImporter', () => {
    describe('getFeaturesToImport', () => {
        const mockIncludeExcludeMap: Map<string, boolean> = new Map([
            ['feature-key', true]
        ])
        beforeEach(() => {
            jest.clearAllMocks()
        })

        test('with default config options', async () => {
            const config = { ...mockConfig }
            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const featureImporter = new LDFeatureImporter(config, audienceImport)
            await featureImporter['getFeaturesToImport']()

            expect(featureImporter.featuresToImport).toEqual({
                'feature-key': {
                    feature: mockLDFeaturesMappedToDVC[0],
                    action: 'create'
                },
                'feature-key-2': {
                    feature: mockLDFeaturesMappedToDVC[1],
                    action: 'create'
                },
                'duplicate-key': {
                    feature: mockLDFeaturesMappedToDVC[2],
                    action: 'skip'
                }
            })
            expect(featureImporter.sourceFeatures).toEqual(mockLDFeaturesFlags.items)
        })

        test('with overwriteDuplicates=true - updates duplicate features', async () => {
            const config = { ...mockConfig, overwriteDuplicates: true }
            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const featureImporter = new LDFeatureImporter(config, audienceImport)
            await featureImporter['getFeaturesToImport']()

            expect(featureImporter.featuresToImport).toEqual({
                'feature-key': {
                    feature: mockLDFeaturesMappedToDVC[0],
                    action: 'create'
                },
                'feature-key-2': {
                    feature: mockLDFeaturesMappedToDVC[1],
                    action: 'create'
                },
                'duplicate-key': {
                    feature: mockLDFeaturesMappedToDVC[2],
                    action: 'update'
                }
            })
            expect(featureImporter.sourceFeatures).toEqual(mockLDFeaturesFlags.items)
        })

        test('with an includeFeatures array', async () => {
            const config = { ...mockConfig, includeFeatures: mockIncludeExcludeMap }

            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const featureImporter = new LDFeatureImporter(config, audienceImport)
            await featureImporter['getFeaturesToImport']()

            expect(featureImporter.featuresToImport).toEqual({
                'feature-key': {
                    feature: mockLDFeaturesMappedToDVC[0],
                    action: 'create'
                },
                'feature-key-2': {
                    feature: mockLDFeaturesMappedToDVC[1],
                    action: 'skip'
                },
                'duplicate-key': {
                    feature: mockLDFeaturesMappedToDVC[2],
                    action: 'skip'
                }
            })
            expect(featureImporter.sourceFeatures).toEqual(mockLDFeaturesFlags.items)
        })

        test('with an excludeFeatures array', async () => {
            const config = { ...mockConfig, excludeFeatures: mockIncludeExcludeMap }

            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const featureImporter = new LDFeatureImporter(config, audienceImport)
            await featureImporter['getFeaturesToImport']()

            expect(featureImporter.featuresToImport).toEqual({
                'feature-key': {
                    feature: mockLDFeaturesMappedToDVC[0],
                    action: 'skip'
                },
                'feature-key-2': {
                    feature: mockLDFeaturesMappedToDVC[1],
                    action: 'create'
                },
                'duplicate-key': {
                    feature: mockLDFeaturesMappedToDVC[2],
                    action: 'skip'
                }
            })
            expect(featureImporter.sourceFeatures).toEqual(mockLDFeaturesFlags.items)
        })
    })

    describe('importFeatures', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        test('feature is not created or updated when action=skip', async () => {
            const featuresToImport = {
                'feature-key': {
                    feature: mockLDFeaturesMappedToDVC[0],
                    action: FeatureImportAction.Skip
                },
            }

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = featuresToImport
            const result = await featureImporter['importFeatures']()

            expect(result).toEqual({
                createdCount: 0,
                updatedCount: 0,
                skippedCount: 1,
                errored: {},
            })
            expect(mockDVC.createFeature).not.toHaveBeenCalled()
            expect(mockDVC.updateFeature).not.toHaveBeenCalled()
        })

        test('feature is created when action=create', async () => {
            const featuresToImport = {
                'feature-key': {
                    feature: mockLDFeaturesMappedToDVC[0],
                    action: FeatureImportAction.Create
                },
            }

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = featuresToImport
            const result = await featureImporter['importFeatures']()

            expect(result).toEqual({
                createdCount: 1,
                updatedCount: 0,
                skippedCount: 0,
                errored: {},
            })
            expect(mockDVC.createFeature).toHaveBeenCalledWith(
                mockConfig.projectKey,
                featuresToImport['feature-key'].feature
            )
            expect(mockDVC.updateFeature).not.toHaveBeenCalled()
        })

        test('feature is updated when action=update', async () => {
            const featuresToImport = {
                'feature-key': {
                    feature: mockLDFeaturesMappedToDVC[0],
                    action: FeatureImportAction.Update
                },
            }

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = featuresToImport
            const result = await featureImporter['importFeatures']()

            expect(result).toEqual({
                createdCount: 0,
                updatedCount: 1,
                skippedCount: 0,
                errored: {},
            })
            expect(mockDVC.updateFeature).toHaveBeenCalledWith(
                mockConfig.projectKey,
                featuresToImport['feature-key'].feature
            )
            expect(mockDVC.createFeature).not.toHaveBeenCalled()
        })

        test('feature is not created or updated when action=unsupported', async () => {
            const featuresToImport = {
                'feature-key': {
                    feature: mockLDFeaturesMappedToDVC[0],
                    action: FeatureImportAction.Unsupported
                },
            }

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = featuresToImport
            const result = await featureImporter['importFeatures']()

            expect(result).toEqual({
                createdCount: 0,
                updatedCount: 0,
                skippedCount: 1,
                errored: {},
            })
            expect(mockDVC.createFeature).not.toHaveBeenCalled()
            expect(mockDVC.updateFeature).not.toHaveBeenCalled()
        })
    })

    describe('getFeatureConfigsToImport', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        test('target rules created for feature with target', async () => {
            const envKey = 'production'
            const featureTarget = {
                'values': [
                    'patel',
                    'jamie'
                ],
                'variation': 0
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [],
                        'targets': [featureTarget],
                    },
                }
            }

            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Create,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }

            const mockLdFeatures = [createFeature]

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures

            const result = await featureImporter['getFeatureConfigsToImport']()
            const { configs } = result[createFeature.key]
            expect(configs).toEqual(
                [{
                    environment: envKey,
                    targetingRules: {
                        status: 'active',
                        targets: [{
                            audience: {
                                filters: {
                                    filters: [{
                                        comparator: '=',
                                        subType: 'user_id',
                                        type: 'user',
                                        values:
                                            featureTarget.values
                                    }],
                                    operator: 'and'
                                },
                                name: 'Imported Target'
                            }, distribution:
                                [{
                                    _variation: `variation-${featureTarget.variation + 1}`,
                                    percentage: 1
                                }]
                        }]
                    }
                }]
            )
        })

        test('target rules created for feature with rule', async () => {
            const envKey = 'production'
            const featureRule = {
                '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'description': 'gmail',
                'clauses': [
                    {
                        '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                        'attribute': 'email',
                        'negate': false,
                        'op': 'contains',
                        'values': [
                            'gmail'
                        ]
                    },
                ],
                'variation': 0,
                trackEvents: false
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [featureRule],
                        'targets': [],
                    },

                }

            }

            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Create,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }
            const mockLdFeatures = [createFeature]

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures

            const result = await featureImporter['getFeatureConfigsToImport']()
            const { configs } = result[createFeature.key]
            expect(configs).toEqual(
                [{
                    environment: envKey,
                    targetingRules: {
                        status: 'active',
                        targets: [{
                            audience: {
                                filters: {
                                    filters: [{
                                        comparator: 'contain',
                                        subType: featureRule.clauses[0].attribute,
                                        type: 'user',
                                        values:
                                            featureRule.clauses[0].values
                                    }],
                                    operator: 'and'
                                },
                                name: 'Imported Rule'
                            }, distribution:
                                [{
                                    _variation: 'variation-1',
                                    percentage: 1
                                }]
                        }]
                    }
                }]
            )
        })

        test('target rules created for feature with segmentMatch', async () => {
            const envKey = 'production'
            const featureRule = {
                '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'description': 'canadian',
                'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'clauses': [
                    {
                        '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                        'attribute': 'segmentMatch',
                        'negate': false,
                        'op': 'segmentMatch',
                        'values': [
                            'seg-1'
                        ]
                    }
                ],
                'trackEvents': false,
                'variation': 0
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [featureRule],
                        'targets': [],
                    },

                }

            }
            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Create,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }
            const mockLdFeatures = [createFeature]

            audienceImport.audiences = mockAudience

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures

            const result = await featureImporter['getFeatureConfigsToImport']()

            const { configs } = result[createFeature.key]
            expect(configs).toEqual(
                [{
                    environment: envKey,
                    targetingRules: {
                        status: 'active',
                        targets: [{
                            audience: {
                                filters: {
                                    filters: [{
                                        comparator: '=',
                                        type: 'audienceMatch',
                                        _audiences: [
                                            mockAudience['seg-1-production']._id
                                        ]
                                    }],
                                    operator: 'and'
                                },
                                name: 'Imported Rule'
                            }, distribution:
                                [{
                                    _variation: 'variation-1',
                                    percentage: 1
                                }]
                        }]
                    }
                }]
            )
        })

        test('target rules not created for feature to skip', async () => {
            const envKey = 'production'
            const featureRule = {
                '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'description': 'gmail',
                'clauses': [
                    {
                        '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                        'attribute': 'email',
                        'negate': false,
                        'op': 'contains',
                        'values': [
                            'gmail'
                        ]
                    },
                ],
                'variation': 0,
                trackEvents: false
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [featureRule],
                        'targets': [],
                    },

                }

            }

            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Skip,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }
            const mockLdFeatures = [createFeature]

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures

            const result = await featureImporter['getFeatureConfigsToImport']()
            expect(result[createFeature.key].configs).toBeUndefined()
        })

        test('target rule empty for feature with unsupported feature (semVerEqual)', async () => {

            const envKey = 'production'
            const featureRule = {
                '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'description': 'canadian',
                'ref': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                'clauses': [
                    {
                        '_id': '5f9b0b0e-3b1f-4b0f-8c1f-1c1f1c1f1c1f',
                        'attribute': 'segmentMatch',
                        'negate': false,
                        'op': 'semVerEqual',
                        'values': [
                            '2.0.2'
                        ]
                    }
                ],
                'trackEvents': false,
                'variation': 0
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [featureRule],
                        'targets': [],
                    },

                }

            }

            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Update,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }
            const mockLdFeatures = [createFeature]

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures

            const result = await featureImporter['getFeatureConfigsToImport']()
            expect(result[createFeature.key].action).toBe(FeatureImportAction.Unsupported)
            expect(result[createFeature.key].configs).toHaveLength(0)
        })

    })

    describe('importFeatureConfigs', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })
        test('create a feature config for create feature', async () => {
            const envKey = 'production'
            const featureTarget = {
                'values': [
                    'patel',
                    'jamie'
                ],
                'variation': 0
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [],
                        'targets': [featureTarget],
                    },
                }
            }

            mockDVC.updateFeatureConfigurations.mockResolvedValue(featureConfigResponse)

            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Create,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }
            const mockLdFeatures = [createFeature]

            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures
            await featureImporter['getFeatureConfigsToImport']()
            await featureImporter['importFeatureConfigs']()

            expect(mockDVC.updateFeatureConfigurations).toHaveBeenCalledTimes(1)
        })

        test('do not create feature config for update with default configs overwriteDuplicates=false', async () => {
            const envKey = 'production'
            const featureTarget = {
                'values': [
                    'patel',
                    'jamie'
                ],
                'variation': 0
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [],
                        'targets': [featureTarget],
                    },
                }
            }

            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Update,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }
            const mockLdFeatures = [createFeature]
            const featureImporter = new LDFeatureImporter(mockConfig, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures
            await featureImporter['getFeatureConfigsToImport']()
            await featureImporter['importFeatureConfigs']()

            expect(mockDVC.updateFeatureConfigurations).toHaveBeenCalledTimes(0)

        })

        test('do not create feature config for skip feature', async () => {
            const envKey = 'production'
            const featureTarget = {
                'values': [
                    'patel',
                    'jamie'
                ],
                'variation': 0
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [],
                        'targets': [featureTarget],
                    },
                }
            }

            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Skip,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }
            const mockLdFeatures = [createFeature]
            const featureImporter = new LDFeatureImporter({ ...mockConfig, overwriteDuplicates: true }, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures
            await featureImporter['getFeatureConfigsToImport']()
            await featureImporter['importFeatureConfigs']()

            expect(mockDVC.updateFeatureConfigurations).toHaveBeenCalledTimes(0)
        })

        test('do not create feature config for unsupported feature', async () => {
            const envKey = 'production'
            const featureTarget = {
                'values': [
                    'patel',
                    'jamie'
                ],
                'variation': 0
            }

            const createFeature = {
                ...mockFeature,
                environments: {
                    [envKey]: {
                        'on': true,
                        'rules': [],
                        'targets': [featureTarget],
                    },
                }
            }

            const mockFeaturesToImport: FeaturesToImport = {
                [createFeature.key]: {
                    action: FeatureImportAction.Unsupported,
                    feature: mapLDFeatureToDVCFeature(createFeature),
                },
            }
            const mockLdFeatures = [createFeature]
            const featureImporter = new LDFeatureImporter({ ...mockConfig, overwriteDuplicates: true }, audienceImport)
            featureImporter.featuresToImport = mockFeaturesToImport
            featureImporter.sourceFeatures = mockLdFeatures
            await featureImporter['getFeatureConfigsToImport']()
            await featureImporter['importFeatureConfigs']()

            expect(mockDVC.updateFeatureConfigurations).toHaveBeenCalledTimes(0)
        })
    })
})
