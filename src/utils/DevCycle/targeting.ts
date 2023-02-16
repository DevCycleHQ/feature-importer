import * as countries from 'i18n-iso-countries'
const countryCodes = countries.getAlpha2Codes()

export function createUserFilter(subType: string, comparator: string, values: string[]) {
    let normalizedValue = values
    if (subType === 'country') {
        if (values.some((value) => value.length !== 2 && countryCodes[(value.toUpperCase())] === undefined)) {
            throw new Error(`Country values should be 2-letter ISO codes: ${values.join(', ')}`)
        }
        normalizedValue = values.map((value) => value.toUpperCase())
    }
    return {
        type: 'user',
        subType,
        comparator,
        values: normalizedValue
    }
}

export function createAllUsersFilter() {
    return { type: 'all' }
}

export function createCustomDataFilter(dataKey: string, comparator: string, values: any[]) {
    return {
        type: 'user',
        subType: 'customData',
        dataKey,
        dataKeyType: getDataType(values),
        comparator,
        values
    }
}

export function createAudienceMatchFilter(comparator: string, audiences: string[]) {
    return {
        type: 'audienceMatch',
        comparator,
        _audiences: audiences
    }
}

export function getDataType(values: any[]) {
    const typeMap = {
        string: 'String',
        number: 'Number',
        boolean: 'Boolean',
    }
    const type = typeof values[0]
    if (
        !(type in typeMap) ||
        !values.every((value) => typeof value === type) // all values should be of the same type
    ) {
        throw new Error(`Unable to determine type of values: ${values.join(', ')}`)
    }
    return typeMap[type as keyof typeof typeMap] // we've already checked that type is a key of typeMap
}

export function getNegatedComparator(operator: string) {
    const negateComparatorMap = {
        '=': '!=',
        '!=': '=',
        '<': '>=',
        '>=': '<',
        '>': '<=',
        '<=': '>',
        'contain': '!contain',
        '!contain': 'contain',
        'exist': '!exist',
        '!exist': 'exist',
    }
    if (!(operator in negateComparatorMap)) {
        throw new Error(`Unsupported operator: ${operator}`)
    }
    return negateComparatorMap[operator as keyof typeof negateComparatorMap]
}
