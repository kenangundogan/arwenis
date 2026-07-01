import { getWelcome, getMaxMessageChars } from '../_lib/persona'
import { getCurrentMember } from '@/utilities/getCurrentMember'
import ChatView from '../_components/ChatView'

export default async function ChatPage() {
    const [{ welcome, suggestions }, maxMessageChars, member] = await Promise.all([
        getWelcome(),
        getMaxMessageChars(),
        getCurrentMember(),
    ])
    return (
        <ChatView
            welcome={welcome}
            suggestions={suggestions}
            userName={member?.firstName ?? undefined}
            maxMessageChars={maxMessageChars}
        />
    )
}
