/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateSlug } from './slugify'
import type { PayloadRequest } from 'payload'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Field source configuration
 */
export type FieldSource = {
    /** Field name to read from */
    field: string
    /** Collection slug if reading from a relationship */
    collection?: string
}

/**
 * Built-in transform types
 */
export type BuiltInTransform = 'slugify'

/**
 * Custom transform function
 * @param values - Array of source field values
 * @param context - Additional context (data, operation)
 */
export type CustomTransform = (
    values: any[],
    context: {
        data: Record<string, any>
        operation: string
    }
) => any

/**
 * Transform function type
 */
export type TransformFunction = BuiltInTransform | CustomTransform

/**
 * Field hook configuration
 */
export type FieldHookConfig = {
    /** Source fields to read from */
    source: FieldSource[]
    /** Target field to write to (supports nested: 'meta.title') */
    target: string
    /** Transform function to apply */
    transform?: TransformFunction
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get nested field value
 * @example getNestedValue({ meta: { title: 'Hello' } }, 'meta.title') => 'Hello'
 */
const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Set nested field value
 * @example setNestedValue({}, 'meta.title', 'Hello') => { meta: { title: 'Hello' } }
 */
const setNestedValue = (obj: Record<string, any>, path: string, value: any): void => {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {}
        return current[key]
    }, obj)
    target[lastKey] = value
}

/**
 * Format date to dd-mm-yyyy
 */
const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

/**
 * Extract ID from a value (handles both ID strings and populated objects)
 */
const extractId = (value: any): string | null => {
    if (!value) return null

    // If it's already a string ID, return it
    if (typeof value === 'string') return value

    // If it's a populated object with id field, return the id
    if (typeof value === 'object' && value.id) return value.id

    return null
}

/**
 * Normalize value to string for slug generation
 */
const normalizeValue = (value: any): string | null => {
    if (!value) return null

    if (typeof value === 'string') {
        // Check if it's a date string
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
        // For arrays, join with comma
        return value.map(normalizeValue).filter(Boolean).join(', ')
    }

    return null
}

/**
 * Populate relationship field value
 */
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
        // Handle simple relationship (just an ID string)
        if (typeof relationshipId === 'string') {
            const relatedDoc = await req.payload.findByID({
                collection: collectionSlug,
                id: relationshipId,
                req,
            })

            return relatedDoc?.[fieldName]
        }
    } catch (_error) {
        // Silently fail if relationship cannot be populated
        return null
    }

    return null
}

/**
 * Get field value from source configuration
 */
const getFieldValue = async (
    data: Record<string, any>,
    config: FieldSource,
    req: any
): Promise<any> => {
    const { field: fieldName, collection } = config

    // If collection is specified, this is a relationship field
    if (collection) {
        return await populateRelationship(data, config, req)
    }

    // Simple field - support nested paths
    return getNestedValue(data, fieldName)
}

/**
 * Apply built-in transform
 */
const applyBuiltInTransform = (
    transform: BuiltInTransform,
    values: string[]
): string => {
    const combined = values.join('-')
    return generateSlug(combined)
}

/**
 * Apply custom transform
 */
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

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Create a collection-level beforeValidate hook from field hook config
 *
 * @example
 * // Simple slug from title
 * createCollectionFieldHook({
 *   source: [{ field: 'title' }],
 *   target: 'slug',
 *   transform: 'slugify'
 * })
 *
 * @example
 * // Slug from relationship + date
 * createCollectionFieldHook({
 *   source: [
 *     { field: 'title', collection: 'programs' },
 *     { field: 'date' }
 *   ],
 *   target: 'slug',
 *   transform: 'slugify'
 * })
 *
 * @example
 * // Meta title with custom transform
 * createCollectionFieldHook({
 *   source: [{ field: 'title', collection: 'programs' }, { field: 'date' }],
 *   target: 'meta.title',
 *   transform: (values) => {
 *     const [title, date] = values
 *     const formattedDate = new Date(date as string).toLocaleDateString('tr-TR')
 *     return `${title} - ${formattedDate}`
 *   }
 * })
 *
 * @example
 * // Copy field value
 * createCollectionFieldHook({
 *   source: [{ field: 'images' }],
 *   target: 'meta.image'
 * })
 */
export const createCollectionFieldHook = (config: FieldHookConfig) => {
    return async ({ data, req, operation }: { data?: any, req: PayloadRequest, operation: string }) => {
        if (!data || (operation !== 'create' && operation !== 'update')) {
            return data
        }

        const { source, target, transform } = config

        try {
            // Check if this is a duplicate operation
            // Duplicate operation: create mode + target field already has a value
            const existingTargetValue = getNestedValue(data, target)
            const isDuplicateOperation = operation === 'create' && existingTargetValue

            // If it's a duplicate operation, add timestamp to existing slug
            if (isDuplicateOperation && typeof existingTargetValue === 'string') {
                // const timestamp = Date.now()
                // const newSlug = `${existingTargetValue}---copy-${timestamp}`
                setNestedValue(data, target, existingTargetValue)
                // Set duplicate as draft
                data._status = 'draft'
                return data
            }

            // Collect values from source fields
            const values: any[] = []

            for (const sourceConfig of source) {
                const fieldValue = await getFieldValue(data, sourceConfig, req)
                values.push(fieldValue)
            }

            // Filter out null/undefined values
            const validValues = values.filter((v) => v !== null && v !== undefined)

            if (validValues.length === 0) {
                return data
            }

            // Apply transform if specified
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

            // Set the result to target field
            setNestedValue(data, target, result)

            return data
        } catch (error) {
            console.error('[createCollectionFieldHook] Error:', error)
            return data
        }
    }
}
