import type { Endpoint } from 'payload'
import { chatEndpoint } from './assistant/chat'
import { authEndpoints } from './assistant/auth'

export const endpoints: Endpoint[] = [chatEndpoint, ...authEndpoints]
