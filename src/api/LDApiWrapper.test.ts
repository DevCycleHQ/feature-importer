import LDApiWrapper from './LDApiWrapper'
import { ProjectResponse } from '../types/LaunchDarkly'

// Mock fetch globally
global.fetch = jest.fn()

const fetchMock = global.fetch as jest.Mock

describe('LDApiWrapper', () => {
    let ldApi: LDApiWrapper
    const mockApiToken = 'test-api-token'
    const mockProjectKey = 'test-project'

    beforeEach(() => {
        ldApi = new LDApiWrapper(mockApiToken)
        jest.clearAllMocks()
    })

    describe('Environment Caching from getProject', () => {
        test('should cache environment keys from getProject call', async () => {
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 3,
                    items: [
                        { _id: 'env-1', key: 'development', name: 'Development', color: 'blue' },
                        { _id: 'env-2', key: 'staging', name: 'Staging', color: 'yellow' },
                        { _id: 'env-3', key: 'production', name: 'Production', color: 'green' }
                    ]
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            // Now call getFeatureFlagsForProject and verify cached environments are used
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            // Verify the second call (getFeatureFlagsForProject) used cached environments
            const featureFlagsCall = fetchMock.mock.calls[1]
            expect(featureFlagsCall[0]).toContain('env=development')
            expect(featureFlagsCall[0]).toContain('env=staging')
            expect(featureFlagsCall[0]).toContain('env=production')

            // Verify getEnvironments was NOT called (only 2 calls total: getProject + getFeatureFlags)
            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        test('should cache single environment from getProject', async () => {
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 1,
                    items: [
                        { _id: 'env-1', key: 'production', name: 'Production', color: 'green' }
                    ]
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            expect(featureFlagsCall[0]).toContain('env=production')
            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        test('should handle environment keys that need URL encoding', async () => {
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 2,
                    items: [
                        { _id: 'env-1', key: 'dev-env-1', name: 'Dev Env 1', color: 'blue' },
                        { _id: 'env-2', key: 'staging&test', name: 'Staging & Test', color: 'yellow' }
                    ]
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            expect(featureFlagsCall[0]).toContain('env=dev-env-1')
            expect(featureFlagsCall[0]).toContain('env=staging%26test') // & should be encoded as %26
        })
    })

    describe('Fallback to getEnvironments', () => {
        test('should fallback to getEnvironments when cachedEnvironments is undefined', async () => {
            const mockEnvironmentsResponse = {
                totalCount: 2,
                items: [
                    { _id: 'env-1', key: 'development', name: 'Development', color: 'blue' },
                    { _id: 'env-2', key: 'production', name: 'Production', color: 'green' }
                ]
            }

            // First call to getEnvironments (fallback)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockEnvironmentsResponse
            })

            // Second call to get feature flags
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            // Verify getEnvironments was called
            const getEnvironmentsCall = fetchMock.mock.calls[0]
            expect(getEnvironmentsCall[0]).toContain(`/projects/${mockProjectKey}/environments`)

            // Verify feature flags call includes cached environments
            const featureFlagsCall = fetchMock.mock.calls[1]
            expect(featureFlagsCall[0]).toContain('env=development')
            expect(featureFlagsCall[0]).toContain('env=production')

            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        test('should not call getEnvironments if cachedEnvironments is already set', async () => {
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 1,
                    items: [
                        { _id: 'env-1', key: 'production', name: 'Production', color: 'green' }
                    ]
                }
            }

            // Call getProject first to cache environments
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            // Now call getFeatureFlagsForProject
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            // Should only have 2 calls: getProject and getFeatureFlags, no getEnvironments
            expect(fetchMock).toHaveBeenCalledTimes(2)
            
            // Verify getEnvironments endpoint was never called
            const calls = fetchMock.mock.calls
            calls.forEach((call) => {
                expect(call[0]).not.toContain('/environments')
            })
        })

        test('should cache environments from getEnvironments fallback for subsequent calls', async () => {
            const mockEnvironmentsResponse = {
                totalCount: 1,
                items: [
                    { _id: 'env-1', key: 'development', name: 'Development', color: 'blue' }
                ]
            }

            // First getEnvironments call
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockEnvironmentsResponse
            })

            // First getFeatureFlags call
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            // Second getFeatureFlags call (should use cached environments, not call getEnvironments again)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            // Should be 3 calls total: getEnvironments once, getFeatureFlags twice
            expect(fetchMock).toHaveBeenCalledTimes(3)

            // Verify getEnvironments was only called once (in the first call)
            const environmentCalls = fetchMock.mock.calls.filter((call) =>
                call[0].includes('/environments') && !call[0].includes('/flags/')
            )
            expect(environmentCalls).toHaveLength(1)
        })

        test('should call getEnvironment when cached envs are for different project key', async () => {
            const mockProjectKey = 'test-project-1'
            const mockProjectKey2 = 'test-project-2'
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 1,
                    items: [
                        { _id: 'env-1', key: 'development', name: 'Development', color: 'blue' }
                    ]
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            const mockEnvironmentsResponse = {
                totalCount: 1,
                items: [
                    { _id: 'env-1', key: 'development', name: 'Development', color: 'blue' }
                ]
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => (mockEnvironmentsResponse)
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey2)

            expect(fetchMock).toHaveBeenCalledTimes(3)
            expect(fetchMock.mock.calls[1][0]).toContain(`/projects/${mockProjectKey2}/environments`)
            expect(fetchMock.mock.calls[2][0]).toContain(`/flags/${mockProjectKey2}?summary=0&env=development`)
        })
    })

    describe('URL Construction with Environment Parameters', () => {
        test('should construct URL with multiple environment parameters', async () => {
            const mockEnvironmentsResponse = {
                totalCount: 3,
                items: [
                    { _id: 'env-1', key: 'dev', name: 'Development', color: 'blue' },
                    { _id: 'env-2', key: 'staging', name: 'Staging', color: 'yellow' },
                    { _id: 'env-3', key: 'prod', name: 'Production', color: 'green' }
                ]
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockEnvironmentsResponse
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            const url = featureFlagsCall[0]

            expect(url).toContain('summary=0')
            expect(url).toContain('env=dev')
            expect(url).toContain('env=staging')
            expect(url).toContain('env=prod')
        })

        test('should construct URL with single environment parameter', async () => {
            const mockEnvironmentsResponse = {
                totalCount: 1,
                items: [
                    { _id: 'env-1', key: 'production', name: 'Production', color: 'green' }
                ]
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockEnvironmentsResponse
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            const url = featureFlagsCall[0]

            expect(url).toContain('summary=0')
            expect(url).toContain('&env=production')
        })

        test('should properly encode project key in URL', async () => {
            const specialProjectKey = 'project/with spaces'

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ totalCount: 0, items: [] })
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(specialProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            expect(featureFlagsCall[0]).toContain('project%2Fwith%20spaces')
        })

        test('should maintain correct URL structure with base URL and parameters', async () => {
            const mockEnvironmentsResponse = {
                totalCount: 1,
                items: [
                    { _id: 'env-1', key: 'dev', name: 'Development', color: 'blue' }
                ]
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockEnvironmentsResponse
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            const url = featureFlagsCall[0]

            expect(url).toMatch(/^https:\/\/app\.launchdarkly\.com\/api\/v2\/flags\/test-project\?summary=0&env=dev$/)
        })
    })

    describe('Edge Cases - Empty or Missing Environment Items', () => {
        test('should handle empty environments.items array', async () => {
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 0,
                    items: []
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            const url = featureFlagsCall[0]

            // Should only have summary parameter, no env parameters
            expect(url).toContain('summary=0')
            expect(url).not.toContain('&env=')
            expect(url).toMatch(/\?summary=0$/)
        })

        test('should handle undefined environments in project response', async () => {
            const mockProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: undefined
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            // Should fall back to getEnvironments
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ totalCount: 0, items: [] })
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            // Should have called getEnvironments as fallback
            expect(fetchMock).toHaveBeenCalledTimes(3)
            const getEnvironmentsCall = fetchMock.mock.calls[1]
            expect(getEnvironmentsCall[0]).toContain('/environments')
        })

        test('should handle null environments.items in project response', async () => {
            const mockProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 0,
                    items: null as any
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            // Should fall back to getEnvironments
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ totalCount: 0, items: [] })
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            expect(fetchMock).toHaveBeenCalledTimes(3)
        })

        test('should handle empty environments from getEnvironments fallback', async () => {
            const mockEnvironmentsResponse = {
                totalCount: 0,
                items: []
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockEnvironmentsResponse
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            const url = featureFlagsCall[0]

            // Should only have summary parameter, no env parameters
            expect(url).toContain('summary=0')
            expect(url).not.toContain('&env=')
        })

        test('should handle undefined items in getEnvironments response', async () => {
            const mockEnvironmentsResponse = {
                totalCount: 0,
                items: undefined
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockEnvironmentsResponse
            })

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            const featureFlagsCall = fetchMock.mock.calls[1]
            const url = featureFlagsCall[0]

            // Should handle gracefully without env parameters
            expect(url).toContain('summary=0')
            expect(url).not.toContain('&env=')
        })

        test('should handle getProject followed by empty getEnvironments fallback', async () => {
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 0,
                    items: []
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ items: [] })
            })

            await ldApi.getFeatureFlagsForProject(mockProjectKey)

            // Should not call getEnvironments since we already have empty cached environments
            expect(fetchMock).toHaveBeenCalledTimes(2)

            const featureFlagsCall = fetchMock.mock.calls[1]
            expect(featureFlagsCall[0]).not.toContain('&env=')
        })
    })

    describe('Headers and Error Handling', () => {
        test('should include correct headers in all API calls', async () => {
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 1,
                    items: [
                        { _id: 'env-1', key: 'production', name: 'Production', color: 'green' }
                    ]
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            const projectCall = fetchMock.mock.calls[0]
            const headers = projectCall[1].headers

            expect(headers.Authorization).toBe(mockApiToken)
            expect(headers['LD-API-Version']).toBe('20240415')
        })

        test('should handle API errors gracefully', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => ({ message: 'Project not found' })
            })

            await expect(ldApi.getProject(mockProjectKey)).rejects.toThrow()
        })
    })

    describe('Multiple Sequential Calls', () => {
        test('should maintain cached environments across multiple feature flag requests', async () => {
            const mockProjectResponse: ProjectResponse = {
                _id: 'proj-123',
                key: mockProjectKey,
                name: 'Test Project',
                tags: [],
                environments: {
                    totalCount: 2,
                    items: [
                        { _id: 'env-1', key: 'dev', name: 'Development', color: 'blue' },
                        { _id: 'env-2', key: 'prod', name: 'Production', color: 'green' }
                    ]
                }
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockProjectResponse
            })

            await ldApi.getProject(mockProjectKey)

            // Make multiple feature flag requests
            for (let i = 0; i < 3; i++) {
                fetchMock.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({ items: [] })
                })

                await ldApi.getFeatureFlagsForProject(mockProjectKey)
            }

            // Should be 4 calls total: 1 getProject + 3 getFeatureFlags
            expect(fetchMock).toHaveBeenCalledTimes(4)

            // Verify all feature flag calls used cached environments
            for (let i = 1; i <= 3; i++) {
                const call = fetchMock.mock.calls[i]
                expect(call[0]).toContain('env=dev')
                expect(call[0]).toContain('env=prod')
            }
        })
    })
})

