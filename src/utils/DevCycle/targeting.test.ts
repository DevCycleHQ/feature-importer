import { createUserFilter } from './targeting'

jest.mock('../../api')

describe('createUserFilters', () => {
    test('should return an array of filters if a user is provided', () => {
        const result = createUserFilter('user_id', 'contains', ['email.com'])
        expect(result).toEqual({
            type: 'user',
            subType: 'user_id',
            comparator: 'contains',
            values: ['email.com']
        })
    })

    test('should return normalized value for lowercase countried', () => {
        const result = createUserFilter('country', 'and', ['us', 'ca'])
        expect(result).toEqual({
            type: 'user',
            subType: 'country',
            comparator: 'and',
            values: ['US', 'CA']
        })
    })

    test('should return normalized value for lowercase countried', () => {
        const result = createUserFilter('country', 'or', ['US', 'CA'])
        expect(result).toEqual({
            type: 'user',
            subType: 'country',
            comparator: 'or',
            values: ['US', 'CA']
        })
    })

    test.each([['usa'], ['zz'], ['111'], [111], [true]])('catch errors thrown with invalid data', (values) => {
        expect(() => createUserFilter('country', 'or', [values])).toThrow()
    })

    test.each([['country', 'ca'], ['user_id', 123], ['email', true]])
    ('values result should be string[] if subTypes are "country", "user_id", or "email"', (subType, value) => {
        const result = createUserFilter(subType, 'or', [value])
        expect(typeof result.values[0]).toBe('string')
    })
})