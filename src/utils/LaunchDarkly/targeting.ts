import { Filter } from '../../types/DevCycle'
import { Clause } from '../../types/LaunchDarkly/segments'
import { createCustomDataFilter, createUserFilter } from '../DevCycle/targeting'

export function mapClauseToFilter(clause: Clause): Filter {
    const { attribute, values } = clause
    const attributeMap = {
        country: 'country',
        email: 'email',
        ip: 'ip',
        key: 'user_id',
    }
    const comparator = getComparator(clause)

    return !(attribute in attributeMap)
        ? createCustomDataFilter(attribute, comparator, values)
        : createUserFilter(
            attributeMap[attribute as keyof typeof attributeMap], // we've already checked that attribute is a key of attributeMap
            comparator,
            values
        )
}

export function getComparator(clause: Clause) {
    const { op, negate } = clause
    const operationMap = {
        in: (neg: boolean) => neg ? '!=' : '=',
        contains: (neg: boolean) => neg ? '!contain' : 'contain',
        lessThan: (neg: boolean) => '<',
        lessThanOrEqual: (neg: boolean) => '<=',
        greaterThan: (neg: boolean) => '>',
        greaterThanOrEqual: (neg: boolean) => '>=',
    }
    if (!(op in operationMap)) {
        throw new Error(`Unsupported operation: ${op}`)
    }
    const opKey = op as keyof typeof operationMap // we've already checked that op is a key of operationMap
    return operationMap[opKey](negate)
}