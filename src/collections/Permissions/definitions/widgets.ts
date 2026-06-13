import type { Field } from 'payload'

// Dashboard widget'ları için yetkilendirme tanımları
export const dashboardWidgets = [
    {
        slug: 'banner-widget',
        label: 'Banner Widget',
    },
    {
        slug: 'stats-widget',
        label: 'İstatistik Widget',
    },
    {
        slug: 'recent-activity-widget',
        label: 'Son Aktiviteler Widget',
    },
]

export const widgetsGroup: Field[] = [
    {
        label: 'Dashboard Widget\'ları',
        type: 'collapsible',
        fields: [
            {
                name: 'widgets',
                label: 'Görünür Widget\'lar',
                type: 'select',
                hasMany: true,
                options: dashboardWidgets.map((widget) => ({
                    label: widget.label,
                    value: widget.slug,
                })),
                admin: {
                    description: 'Kullanıcının dashboard\'da görebileceği widget\'lar. Seçilmezse hiçbir widget görünmez. Admin kullanıcılar her zaman tüm widget\'ları görür.',
                },
            },
        ],
        admin: {
            initCollapsed: true,
        },
    },
]
