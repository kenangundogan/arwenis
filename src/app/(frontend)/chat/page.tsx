import { getWelcome } from '../_lib/persona'
import { getCurrentMember } from '@/utilities/getCurrentMember'
import ChatView from '../_components/ChatView'

export default async function ChatPage() {
    const { welcome, suggestions } = await getWelcome()
    const member = await getCurrentMember()
    return <ChatView welcome={welcome} suggestions={suggestions} userName={member?.firstName ?? undefined} />
}
