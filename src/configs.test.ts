import { validateKey } from './configs'

describe('validateKey', () => {
    describe('Valid Keys', () => {
        test('should accept lowercase alphanumeric keys', () => {
            expect(() => validateKey('myprojectkey', 'testKey')).not.toThrow()
            expect(() => validateKey('project123', 'testKey')).not.toThrow()
            expect(() => validateKey('abc123xyz', 'testKey')).not.toThrow()
        })

        test('should accept uppercase alphanumeric keys', () => {
            expect(() => validateKey('MYPROJECTKEY', 'testKey', true)).not.toThrow()
            expect(() => validateKey('PROJECT123', 'testKey', true)).not.toThrow()
            expect(() => validateKey('ABC123XYZ', 'testKey', false)).toThrow()
        })

        test('should accept mixed case alphanumeric keys', () => {
            expect(() => validateKey('MyProjectKey', 'testKey', true)).not.toThrow()
            expect(() => validateKey('Project123', 'testKey', true)).not.toThrow()
            expect(() => validateKey('aBc123XyZ', 'testKey', false)).toThrow()
            expect(() => validateKey('CamelCaseKey', 'testKey', false)).toThrow()
        })

        test('should accept keys with hyphens', () => {
            expect(() => validateKey('my-project-key', 'testKey')).not.toThrow()
            expect(() => validateKey('test-123-key', 'testKey')).not.toThrow()
            expect(() => validateKey('My-Project-Key', 'testKey', true)).not.toThrow()
            expect(() => validateKey('UPPER-CASE-KEY', 'testKey')).toThrow()
        })

        test('should accept keys with underscores', () => {
            expect(() => validateKey('my_project_key', 'testKey')).not.toThrow()
            expect(() => validateKey('test_123_key', 'testKey')).not.toThrow()
            expect(() => validateKey('My_Project_Key', 'testKey', false)).toThrow()
            expect(() => validateKey('UPPER_CASE_KEY', 'testKey', true)).not.toThrow()
        })

        test('should accept keys with periods', () => {
            expect(() => validateKey('my.project.key', 'testKey')).not.toThrow()
            expect(() => validateKey('test.123.key', 'testKey')).not.toThrow()
            expect(() => validateKey('My.Project.Key', 'testKey', false)).toThrow()
            expect(() => validateKey('UPPER.CASE.KEY', 'testKey', true)).not.toThrow()
        })

        test('should accept keys with mixed valid special characters', () => {
            expect(() => validateKey('my-project_key.v1', 'testKey')).not.toThrow()
            expect(() => validateKey('test_123-key.prod', 'testKey')).not.toThrow()
            expect(() => validateKey('My-Project_Key.V1', 'testKey', false)).toThrow()
            expect(() => validateKey('UPPER-CASE_KEY.V2', 'testKey', true)).not.toThrow()
        })

        test('should accept single character keys', () => {
            expect(() => validateKey('a', 'testKey')).not.toThrow()
            expect(() => validateKey('A', 'testKey', true)).not.toThrow()
            expect(() => validateKey('1', 'testKey')).not.toThrow()
            expect(() => validateKey('_', 'testKey')).not.toThrow()
            expect(() => validateKey('-', 'testKey')).not.toThrow()
            expect(() => validateKey('.', 'testKey')).not.toThrow()
        })

        test('should accept keys with all valid character types', () => {
            expect(() => validateKey('aA1-_.', 'testKey')).toThrow()
            expect(() => validateKey('Project-Key_2024.v1', 'testKey', false)).toThrow()
            expect(() => validateKey('Project-Key_2024.v1', 'testKey', true)).not.toThrow()
        })
    })

    describe('Invalid Keys', () => {
        test('should reject empty string', () => {
            expect(() => validateKey('', 'testKey')).toThrow(
                'testKey must be a non-empty string'
            )
        })

        test('should reject non-string values', () => {
            expect(() => validateKey(null as any, 'testKey')).toThrow(
                'testKey must be a non-empty string'
            )
            expect(() => validateKey(undefined as any, 'testKey')).toThrow(
                'testKey must be a non-empty string'
            )
            expect(() => validateKey(123 as any, 'testKey')).toThrow(
                'testKey must be a non-empty string'
            )
            expect(() => validateKey({} as any, 'testKey')).toThrow(
                'testKey must be a non-empty string'
            )
            expect(() => validateKey([] as any, 'testKey')).toThrow(
                'testKey must be a non-empty string'
            )
        })

        test('should reject keys with spaces', () => {
            expect(() => validateKey('my project', 'testKey')).toThrow(
                'testKey contains invalid characters. Only alphanumeric characters (uppercase or lowercase), ' +
                'hyphens, underscores, and periods are allowed.'
            )
            expect(() => validateKey('test key', 'testKey')).toThrow()
            expect(() => validateKey(' mykey', 'testKey')).toThrow()
            expect(() => validateKey('mykey ', 'testKey')).toThrow()
        })

        test('should reject keys with special characters', () => {
            expect(() => validateKey('my@project', 'testKey')).toThrow(
                'testKey contains invalid characters. Only alphanumeric characters (uppercase or lowercase), ' +
                'hyphens, underscores, and periods are allowed.'
            )
            expect(() => validateKey('project#123', 'testKey')).toThrow()
            expect(() => validateKey('key$value', 'testKey')).toThrow()
            expect(() => validateKey('test%key', 'testKey')).toThrow()
            expect(() => validateKey('my&project', 'testKey')).toThrow()
            expect(() => validateKey('test*key', 'testKey')).toThrow()
        })

        test('should reject keys with forward slashes', () => {
            expect(() => validateKey('my/project', 'testKey')).toThrow()
            expect(() => validateKey('project/key/123', 'testKey')).toThrow()
        })

        test('should reject keys with backslashes', () => {
            expect(() => validateKey('my\\project', 'testKey')).toThrow()
            expect(() => validateKey('project\\key\\123', 'testKey')).toThrow()
        })

        test('should reject keys with parentheses', () => {
            expect(() => validateKey('my(project)', 'testKey')).toThrow()
            expect(() => validateKey('test[key]', 'testKey')).toThrow()
            expect(() => validateKey('{project}', 'testKey')).toThrow()
        })

        test('should reject keys with quotes', () => {
            expect(() => validateKey('my\'project', 'testKey')).toThrow()
            expect(() => validateKey('my"project', 'testKey')).toThrow()
            expect(() => validateKey('my`project', 'testKey')).toThrow()
        })

        test('should reject keys with semicolons and colons', () => {
            expect(() => validateKey('my;project', 'testKey')).toThrow()
            expect(() => validateKey('my:project', 'testKey')).toThrow()
        })

        test('should reject keys with URL-unsafe characters', () => {
            expect(() => validateKey('my+project', 'testKey')).toThrow()
            expect(() => validateKey('test=key', 'testKey')).toThrow()
            expect(() => validateKey('key?value', 'testKey')).toThrow()
        })

        test('should reject keys with newlines and tabs', () => {
            expect(() => validateKey('my\nproject', 'testKey')).toThrow()
            expect(() => validateKey('my\tproject', 'testKey')).toThrow()
            expect(() => validateKey('my\rproject', 'testKey')).toThrow()
        })

        test('should reject keys with unicode characters', () => {
            expect(() => validateKey('my-project-😀', 'testKey')).toThrow()
            expect(() => validateKey('проект', 'testKey')).toThrow()
            expect(() => validateKey('项目', 'testKey')).toThrow()
        })
    })

    describe('Error Messages', () => {
        test('should include the key name in error message for empty strings', () => {
            expect(() => validateKey('', 'sourceProjectKey')).toThrow(
                'sourceProjectKey must be a non-empty string'
            )
            expect(() => validateKey('', 'targetProjectKey')).toThrow(
                'targetProjectKey must be a non-empty string'
            )
        })

        test('should include the key name in error message for invalid characters', () => {
            expect(() => validateKey('invalid key!', 'sourceProjectKey')).toThrow(
                'sourceProjectKey contains invalid characters'
            )
            expect(() => validateKey('invalid@key', 'targetProjectKey')).toThrow(
                'targetProjectKey contains invalid characters'
            )
        })
    })

    describe('Real-world Examples', () => {
        test('should accept typical project key formats', () => {
            expect(() => validateKey('production', 'projectKey')).not.toThrow()
            expect(() => validateKey('dev-environment', 'projectKey')).not.toThrow()
            expect(() => validateKey('staging_env', 'projectKey')).not.toThrow()
            expect(() => validateKey('test.v1', 'projectKey')).not.toThrow()
            expect(() => validateKey('my-app-prod-2024', 'projectKey')).not.toThrow()
            expect(() => validateKey('TEST-PROJECT-KEY', 'projectKey', true)).not.toThrow()
        })

        test('should accept keys with version numbers', () => {
            expect(() => validateKey('project-v1', 'projectKey')).not.toThrow()
            expect(() => validateKey('app_v2.0', 'projectKey')).not.toThrow()
            expect(() => validateKey('service-1.2.3', 'projectKey')).not.toThrow()
        })

        test('should accept environment-like keys', () => {
            expect(() => validateKey('development', 'envKey')).not.toThrow()
            expect(() => validateKey('staging', 'envKey')).not.toThrow()
            expect(() => validateKey('production', 'envKey')).not.toThrow()
            expect(() => validateKey('dev-us-east-1', 'envKey')).not.toThrow()
        })

        test('should accept mixed case real-world examples', () => {
            expect(() => validateKey('MyCompany-Production', 'projectKey', true)).not.toThrow()
            expect(() => validateKey('TestEnv_2024', 'projectKey', false)).toThrow()
            expect(() => validateKey('TestEnv_2024', 'projectKey', true)).not.toThrow()
            expect(() => validateKey('App.v1.Release', 'projectKey', false)).toThrow()
            expect(() => validateKey('App.v1.Release', 'projectKey', true)).not.toThrow()
        })
    })
})

