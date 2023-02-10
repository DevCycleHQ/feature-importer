jest.mock('../api')

import { importProject } from './project'
import { LD, DVC } from '../api'

const mockLD = LD as jest.Mocked<typeof LD>
const mockDVC = DVC as jest.Mocked<typeof DVC>

const mockConfig = {
    ldAccessToken: '123',
    dvcClientId: 'dvcid',
    dvcClientSecret: 'dvcsecret',
    projectKey: 'project-key',
}

const mockDvcProjectResponse = {
    _id: '123',
    _organization: 'org',
    _createdBy: 'user',
    name: 'some name',
    key: 'some key',
    createdAt: 'datestring',
    updatedAt: 'datestring',
    hasJiraIntegration: false
}


describe('Project Import', () => {
    const ldProject = {
        _id: 'abc',
        name: 'project name',
        key: 'project-key',
        tags: [],
        environments: {
            totalCount: 0,
            items: []
        }
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("project is created when it doesn't exist yet", async () => {
        const config = { ...mockConfig }
        const dvcResponse = {
            ...mockDvcProjectResponse,
            _id: '123',
            name: 'project name',
            key: ldProject.key
        }
        mockLD.getProject.mockResolvedValue(ldProject)
        mockDVC.getProject.mockRejectedValue(new Error('Not found'))
        mockDVC.createProject.mockResolvedValue(dvcResponse)

        const result = await importProject(config)
        expect(result).toEqual({
            dvcProject: expect.objectContaining(dvcResponse),
            ldProject
        })
        expect(mockDVC.createProject).toHaveBeenCalledWith({
            name: ldProject.name,
            key: ldProject.key
        })
        expect(mockDVC.updateProject).not.toHaveBeenCalled()
    })

    test("project is skipped when it already exists", async () => {
        const config = { ...mockConfig }
        const dvcResponse = {
            ...mockDvcProjectResponse,
            _id: '123',
            name: 'a different project name',
            key: ldProject.key
        }
        mockLD.getProject.mockResolvedValue(ldProject)
        mockDVC.getProject.mockResolvedValue(dvcResponse)

        const result = await importProject(config)
        expect(mockDVC.createProject).not.toHaveBeenCalled()
        expect(mockDVC.updateProject).not.toHaveBeenCalled()
        expect(result).toEqual({
            dvcProject: expect.objectContaining(dvcResponse),
            ldProject
        })
    })

    test("project is updated when overwriteDuplicates is true", async () => {
        const config = { ...mockConfig, overwriteDuplicates: true }
        const dvcResponse = {
            ...mockDvcProjectResponse,
            _id: '123',
            name: 'different project name',
            key: ldProject.key
        }
        const updatedDvcResponse = {
            ...mockDvcProjectResponse,
            _id: dvcResponse._id,
            name: ldProject.name,
            key: ldProject.key,
        }
        mockLD.getProject.mockResolvedValue(ldProject)
        mockDVC.getProject.mockResolvedValue(dvcResponse)
        mockDVC.updateProject.mockResolvedValue(updatedDvcResponse)

        const result = await importProject(config)
        expect(result).toEqual({
            dvcProject: expect.objectContaining(updatedDvcResponse),
            ldProject
        })
        expect(mockDVC.updateProject).toHaveBeenCalledWith(
            ldProject.key,
            {
                name: ldProject.name,
                key: ldProject.key
            }
        )
        expect(mockDVC.createProject).not.toHaveBeenCalled()
    })
})