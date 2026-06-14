import type { Endpoint } from 'payload'
import { chatEndpoint } from './assistant/chat'
import { conversationEndpoints } from './assistant/conversations'
import { memoryEndpoints } from './assistant/memory'
import { folderEndpoints } from './assistant/folders'
import { authEndpoints } from './assistant/auth'

export const endpoints: Endpoint[] = [
    chatEndpoint,
    ...conversationEndpoints,
    ...memoryEndpoints,
    ...folderEndpoints,
    ...authEndpoints,
]
