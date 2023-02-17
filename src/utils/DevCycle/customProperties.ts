import { CustomPropertyType } from '../../types/DevCycle'

export const convertDataKeyTypeToCustomPropertyType = (dataKeyType?: string): CustomPropertyType => {
    switch (dataKeyType) {
        case 'Boolean':
            return CustomPropertyType.Boolean
        case 'Number':
            return CustomPropertyType.Number
        default:
            return CustomPropertyType.String
    }
}