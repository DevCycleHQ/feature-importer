jest.mock('../api')

import { LD, DVC } from '../api'
import { importFeatures, prepareFeaturesToImport } from './features'
import { FeatureImportAction } from '../types'
import { 
    mockConfig,
    mockDVCFeaturesResponse,
    mockLDFeaturesFlags,
    mockLDFeaturesMappedToDVC
} from '../api/__mocks__/MockResponses'

const mockLD = LD as jest.Mocked<typeof LD>
const mockDVC = DVC as jest.Mocked<typeof DVC>

describe('Feature Import', () => {
    describe('prepareFeaturesToImport', () => {
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

            const result = await prepareFeaturesToImport(config)

            expect(result).toEqual({
                featuresToImport: {
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
                },
                ldFeatures: mockLDFeaturesFlags.items,
            })
        })

        test('with overwriteDuplicates=true - updates duplicate features', async () => {
            const config = { ...mockConfig, overwriteDuplicates: true }
            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const result = await prepareFeaturesToImport(config)

            expect(result).toEqual({
                featuresToImport: {
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
                },
                ldFeatures: mockLDFeaturesFlags.items,
            })
        })

        test('with an includeFeatures array', async () => {
            const config = { ...mockConfig, includeFeatures: mockIncludeExcludeMap }

            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const result = await prepareFeaturesToImport(config)

            expect(result).toEqual({
                featuresToImport: {
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
                },
                ldFeatures: mockLDFeaturesFlags.items,
            })
        })

        test('with an excludeFeatures array', async () => {
            const config = { ...mockConfig, excludeFeatures: mockIncludeExcludeMap }

            mockLD.getFeatureFlagsForProject.mockResolvedValue(mockLDFeaturesFlags)
            mockDVC.getFeaturesForProject.mockResolvedValue(mockDVCFeaturesResponse)

            const result = await prepareFeaturesToImport(config)

            expect(result).toEqual({
                featuresToImport: {
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
                },
                ldFeatures: mockLDFeaturesFlags.items,
            })
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

            const result = await importFeatures(mockConfig, featuresToImport)

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

            const result = await importFeatures(mockConfig, featuresToImport)

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

            const result = await importFeatures(mockConfig, featuresToImport)

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

            const result = await importFeatures(mockConfig, featuresToImport)

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
})
