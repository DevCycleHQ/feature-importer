jest.mock('../../api')

import { LDEnvironmentImporter } from '.'
import { DVC } from '../../api'
import { mockConfig } from '../../api/__mocks__/MockResponses'
import { EnvironmentResponse as DVCEnvironmentResponse, EnvironmentType as DVCEnvironmentType } from '../../types/DevCycle'
import { ProjectResponse as LDProjectResponse } from '../../types/LaunchDarkly/project'
import { promptToGetEnvironmentType } from './utils'

const mockDVC = DVC as jest.Mocked<typeof DVC>
const mockPromptToGetEnvironmentType = promptToGetEnvironmentType as jest.MockedFunction<typeof promptToGetEnvironmentType>

jest.mock('./utils', () => ({
    promptToGetEnvironmentType: jest.fn()
}))

const mockDvcEnvironmentResponse: DVCEnvironmentResponse = {
    _id: 'id_123',
    _project: 'project_123',
    name: 'env name',
    key: 'env-key',
    type: 'staging',
    color: '000000',
    _createdBy: 'user01',
    createdAt: '2023-02-23T20:23:02.191Z',
    updatedAt: '2023-02-23T20:23:02.191Z',
    sdkKeys: {}
}

const mockLDEnvironment: LDProjectResponse['environments'] = {
    totalCount: 1,
    items: [
        {
            _id: 'env01',
            key: 'test01',
            name: 'testing',
            color: '000000',
        }
    ]
}

const config = { ...mockConfig }

const importEnvironment = async () => {
    const environmentImporter = new LDEnvironmentImporter(config)
    await environmentImporter.import(mockLDEnvironment)
}

describe('LDEnvironmentImporter', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockDVC.getEnvironments.mockResolvedValue([mockDvcEnvironmentResponse])
    })

    test("environment is created when it doesn't exist yet", async () => {
        mockPromptToGetEnvironmentType.mockResolvedValue(DVCEnvironmentType.Dev)
        await importEnvironment()

        const { key, name, color } = mockLDEnvironment.items[0]
        expect(mockDVC.createEnvironment).toHaveBeenCalledWith(
            config.projectKey,
            {
                key,
                name,
                color: `#${color}`,
                type: DVCEnvironmentType.Dev
            }
        )
        expect(mockDVC.updateEnvironment).not.toHaveBeenCalled()
    })

    test("environment is updated if it already exists and overwriteDuplicates is true", async () => {
        mockLDEnvironment.items[0].key = mockDvcEnvironmentResponse.key
        config.overwriteDuplicates = true
        mockPromptToGetEnvironmentType.mockResolvedValue(DVCEnvironmentType.Dev)
        await importEnvironment()

        const { key, name, color } = mockLDEnvironment.items[0]
        expect(mockDVC.updateEnvironment).toHaveBeenCalledWith(
            config.projectKey,
            key,
            {
                key,
                name,
                color: `#${color}`,
                type: DVCEnvironmentType.Dev
            }
        )
        expect(mockDVC.createEnvironment).not.toHaveBeenCalled()
    })

    test("environment is skipped if it already exists and overwriteDuplicates is false", async () => {
        mockLDEnvironment.items[0].key = mockDvcEnvironmentResponse.key
        config.overwriteDuplicates = false
        await importEnvironment()

        expect(mockDVC.createEnvironment).not.toHaveBeenCalled()
        expect(mockDVC.updateEnvironment).not.toHaveBeenCalled()
    })
})
