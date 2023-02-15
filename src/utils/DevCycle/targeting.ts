export function createUserFilter(subType: string, comparator: string, values: string[]) {
    return {
        type: 'user',
        subType,
        comparator,
        values
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

export function getNegatedOperator(operator: string) {
    const operatorMap = {
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
        'true': 'false',
        'false': 'true',
    }
    if (!(operator in operatorMap)) {
        throw new Error(`Unsupported operator: ${operator}`)
    }
    return operatorMap[operator as keyof typeof operatorMap]
}
