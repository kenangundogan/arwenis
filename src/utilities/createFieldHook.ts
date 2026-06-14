import { generateSlug } from './slugify'
import type { PayloadRequest } from 'payload'

export type FieldSource = {
        field: string
        collection?: string
}

export type BuiltInTransform = 'slugify'

export type CustomTransform = (
    values: any[],
    context: {
        data: Record<string, any>
        operation: string
    }
) => any

export type TransformFunction = BuiltInTransform | CustomTransform

export type FieldHookConfig = {
        source: FieldSource[]
        target: string
        transform?: TransformFunction
        onlyOnCreate?: boolean
}

const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

const setNestedValue = (obj: Record<string, any>, path: string, value: any): void => {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {}
        return current[key]
    }, obj)
    target[lastKey] = value
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

const extractId = (value: any): string | null => {
    if (!value) return null

    if (typeof value === 'string') return value

    if (typeof value === 'object' && value.id) return value.id

    return null
}

const normalizeValue = (value: any): string | null => {
    if (!value) return null

    if (typeof value === 'string') {

        const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/)
        if (dateMatch) {
            return formatDate(value)
        }
        return value
    }

    if (typeof value === 'number') {
        return String(value)
    }

    if (Array.isArray(value)) {

        return value.map(normalizeValue).filter(Boolean).join(', ')
    }

    return null
}

const populateRelationship = async (
    data: Record<string, any>,
    config: FieldSource,
    req: any
): Promise<any> => {
    const { field: fieldName, collection: collectionSlug } = config

    if (!collectionSlug) return null

    const relationshipId = data[collectionSlug]

    if (!relationshipId) return null

    try {

        if (typeof relationshipId === 'string') {
            const relatedDoc = await req.payload.findByID({
                collection: collectionSlug,
                id: relationshipId,
                req,
            })

            return relatedDoc?.[fieldName]
        }
    } catch (_error) {

        return null
    }

    return null
}

const getFieldValue = async (
    data: Record<string, any>,
    config: FieldSource,
    req: any
): Promise<any> => {
    const { field: fieldName, collection } = config

    if (collection) {
        return await populateRelationship(data, config, req)
    }

    return getNestedValue(data, fieldName)
}

const applyBuiltInTransform = (
    transform: BuiltInTransform,
    values: string[]
): string => {
    const combined = values.join('-')
    return generateSlug(combined)
}

const applyCustomTransform = (
    transform: CustomTransform,
    values: any[],
    context: {
        data: Record<string, any>
        operation: string
    }
): any => {
    return transform(values, context)
}

export const createCollectionFieldHook = (config: FieldHookConfig) => {
    return async ({ data, req, operation }: { data?: any, req: PayloadRequest, operation: string }) => {
        if (!data || (operation !== 'create' && operation !== 'update')) {
            return data
        }

        const { source, target, transform, onlyOnCreate } = config

        if (onlyOnCreate && operation !== 'create') {
            return data
        }

        try {

            const existingTargetValue = getNestedValue(data, target)
            const isDuplicateOperation = operation === 'create' && existingTargetValue

            if (isDuplicateOperation && typeof existingTargetValue === 'string') {

                setNestedValue(data, target, existingTargetValue)

                data._status = 'draft'
                return data
            }

            const values: any[] = []

            for (const sourceConfig of source) {
                const fieldValue = await getFieldValue(data, sourceConfig, req)
                values.push(fieldValue)
            }

            const validValues = values.filter((v) => v !== null && v !== undefined)

            if (validValues.length === 0) {
                return data
            }

            let result: any

            if (!transform) {
                result = validValues.length === 1 ? validValues[0] : validValues

                const hasRelationshipSource = source.some(s => s.collection)

                if (hasRelationshipSource) {
                    if (Array.isArray(result)) {
                        result = result.map(extractId).filter(Boolean)
                        result = result.length === 1 ? result[0] : result
                    } else {
                        const extractedId = extractId(result)
                        if (extractedId) result = extractedId
                    }
                }
            } else if (typeof transform === 'string') {
                const normalizedValues = validValues.map(normalizeValue).filter(Boolean) as string[]
                result = applyBuiltInTransform(transform, normalizedValues)
            } else {
                result = applyCustomTransform(transform, validValues, {
                    data,
                    operation,
                })
            }

            setNestedValue(data, target, result)

            return data
        } catch (error) {
            console.error('[createCollectionFieldHook] Error:', error)
            return data
        }
    }
}
