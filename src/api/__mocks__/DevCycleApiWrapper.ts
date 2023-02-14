export default class DevCycleApiWrapper {
    getProject = jest.fn()
    createProject = jest.fn()
    updateProject = jest.fn()

    getAudiences = jest.fn()
    createAudience = jest.fn()
    updateAudience = jest.fn()

    createFeature = jest.fn()
    updateFeature = jest.fn()
    getFeaturesForProject = jest.fn()

    getEnvironments = jest.fn()
    createEnvironment = jest.fn()
    updateEnvironment = jest.fn()

    updateFeatureConfigurations = jest.fn()
}