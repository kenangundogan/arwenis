import { getWelcome } from '../_lib/persona'
import ChatView from '../_components/ChatView'

export default async function ChatPage() {
    const { welcome, suggestions } = await getWelcome()
    return <ChatView welcome={welcome} suggestions={suggestions} />
}
