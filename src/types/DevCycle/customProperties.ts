export type CustomProperties = {
    _id: string
    _project: string
    _createdBy: string
    name: string
    key: string
    type: CustomPropertyType
    propertyKey: string
    createdAt: string
    updatedAt: string
}

export type CustomPropertiesPayload = {
    name: string
    key: string
    type: CustomPropertyType
    propertyKey: string
}

export enum CustomPropertyType {
    Boolean = 'Boolean',
    Number = 'Number',
    String = 'String',
}