import type { Field } from 'payload'
import { globalActionsField } from '@/fields/permission'
import { globals } from '@/globals'

export const globalsGroup: Field[] = globals.map((global) => ({
    label: global.label || global.slug,
    type: 'collapsible',
    fields: [
        {
            name: global.slug,
            type: 'group',
            fields: [
                globalActionsField,
            ],
        },
    ],
    admin: {
        initCollapsed: true,
    },
}))

