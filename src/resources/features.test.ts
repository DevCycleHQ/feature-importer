jest.mock('../api')

import { LD, DVC } from '../api'
import { importFeatures, prepareFeaturesToImport } from './features'
import { mapLDFeatureToDVCFeature } from '../utils/LaunchDarkly'
import { FeatureImportAction } from '../types'
import { mockConfig, mockDVCFeaturesResponse, mockLDFeaturesFlags } from '../api/__mocks__/MockResponses'

const mockLD = LD as jest.Mocked<typeof LD>
const mockDVC = DVC as jest.Mocked<typeof DVC>

describe('Feature Import', () => {
    describe('importProject', () => {
        const mockIncludeExcludeMap: Map<string, boolean> = new Map([
            ['feature-key', true]
        ])

        beforeEach(() => {
            jest.clearAllMocks()
        })

        test('all default config options', async () => {
            const config = { ...mockConfig }
            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const result = await prepareFeaturesToImport(config)

            expect(result).toEqual({
                featuresToImport: {
                    'feature-key': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[0]),
                        action: 'create'
                    },
                    'feature-key-2': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[1]),
                        action: 'create'
                    },
                    'duplicate-key': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[2]),
                        action: 'skip'
                    }
                },
                ldFeatures: mockLDFeaturesFlags.items,
            })
        })

        test('overwriteDuplicates true - updates duplicate features', async () => {
            const config = { ...mockConfig, overwriteDuplicates: true }
            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const result = await prepareFeaturesToImport(config)

            expect(result).toEqual({
                featuresToImport: {
                    'feature-key': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[0]),
                        action: 'create'
                    },
                    'feature-key-2': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[1]),
                        action: 'create'
                    },
                    'duplicate-key': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[2]),
                        action: 'update'
                    }
                },
                ldFeatures: mockLDFeaturesFlags.items,
            })
        })

        test('includeFeatures', async () => {
            const config = { ...mockConfig, includeFeatures: mockIncludeExcludeMap }

            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const result = await prepareFeaturesToImport(config)

            expect(result).toEqual({
                featuresToImport: {
                    'feature-key': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[0]),
                        action: 'create'
                    },
                    'feature-key-2': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[1]),
                        action: 'skip'
                    },
                    'duplicate-key': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[2]),
                        action: 'skip'
                    }
                },
                ldFeatures: mockLDFeaturesFlags.items,
            })
        })

        test('excludeFeatures', async () => {
            const config = { ...mockConfig, excludeFeatures: mockIncludeExcludeMap }

            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const result = await prepareFeaturesToImport(config)

            expect(result).toEqual({
                featuresToImport: {
                    'feature-key': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[0]),
                        action: 'skip'
                    },
                    'feature-key-2': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[1]),
                        action: 'create'
                    },
                    'duplicate-key': {
                        feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[2]),
                        action: 'skip'
                    }
                },
                ldFeatures: mockLDFeaturesFlags.items,
            })
        })
    })

    describe('importFeatures', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        test('skip - feature is not created or updated', async () => {
            const featuresToImport = {
                'feature-key': {
                    feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[0]),
                    action: FeatureImportAction.Skip
                },
            }

            const result = await importFeatures(mockConfig, featuresToImport)

            expect(result).toEqual({
                createdCount: 0,
                updatedCount: 0,
                skippedCount: 1,
                skipped: [featuresToImport['feature-key'].feature],
                errored: [],
            })
            expect(mockDVC.createFeature).not.toHaveBeenCalled()
            expect(mockDVC.updateFeature).not.toHaveBeenCalled()
        })

        test('create - feature is created', async () => {
            const featuresToImport = {
                'feature-key': {
                    feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[0]),
                    action: FeatureImportAction.Create
                },
            }

            const result = await importFeatures(mockConfig, featuresToImport)

            expect(result).toEqual({
                createdCount: 1,
                updatedCount: 0,
                skippedCount: 0,
                skipped: [],
                errored: [],
            })
            expect(mockDVC.createFeature).toHaveBeenCalledWith(
                mockConfig.projectKey,
                featuresToImport['feature-key'].feature
            )
            expect(mockDVC.updateFeature).not.toHaveBeenCalled()
        })

        test('update - feature is updated', async () => {
            const featuresToImport = {
                'feature-key': {
                    feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[0]),
                    action: FeatureImportAction.Update
                },
            }

            const result = await importFeatures(mockConfig, featuresToImport)

            expect(result).toEqual({
                createdCount: 0,
                updatedCount: 1,
                skippedCount: 0,
                skipped: [],
                errored: [],
            })
            expect(mockDVC.updateFeature).toHaveBeenCalledWith(
                mockConfig.projectKey,
                featuresToImport['feature-key'].feature
            )
            expect(mockDVC.createFeature).not.toHaveBeenCalled()
        })

        test('unsupported - feature is not created or updated', async () => {
            const featuresToImport = {
                'feature-key': {
                    feature: mapLDFeatureToDVCFeature(mockLDFeaturesFlags.items[0]),
                    action: FeatureImportAction.Unsupported
                },
            }

            const result = await importFeatures(mockConfig, featuresToImport)

            expect(result).toEqual({
                createdCount: 0,
                updatedCount: 0,
                skippedCount: 1,
                skipped: [featuresToImport['feature-key'].feature],
                errored: [],
            })
            expect(mockDVC.createFeature).not.toHaveBeenCalled()
            expect(mockDVC.updateFeature).not.toHaveBeenCalled()
        })
    })
})
