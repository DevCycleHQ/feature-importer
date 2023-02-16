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

    test('catch errors thrown with invalid data', () => {
        expect(() => createUserFilter('country', 'or', ['usa'])).toThrow()
    })

    test('catch errors thrown with invalid data', () => {
        expect(() => createUserFilter('country', 'or', ['zz'])).toThrow()
    })

})

