import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentMember } from '@/utilities/getCurrentMember'
import { getWelcome } from '../../_lib/persona'
import ChatView from '../../_components/ChatView'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const member = await getCurrentMember()
    if (!member) notFound()

    const payload = await getPayload({ config })
    const found = await payload.find({
        collection: 'conversations',
        where: { id: { equals: id } },
        limit: 1,
        depth: 0,
        overrideAccess: false,
        user: member,
    })
    if (found.docs.length === 0) notFound()

    const { welcome, suggestions } = await getWelcome()
    return <ChatView conversationId={id} welcome={welcome} suggestions={suggestions} userName={member.firstName ?? undefined} />
}
