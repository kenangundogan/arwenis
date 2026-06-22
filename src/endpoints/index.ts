import type { Endpoint } from 'payload'
import { chatEndpoint } from './assistant/chat'
import { googleStartEndpoint, googleCallbackEndpoint } from './auth/google'
import { authProvidersEndpoint } from './auth/providers'

export const endpoints: Endpoint[] = [
    chatEndpoint,
    authProvidersEndpoint,
    googleStartEndpoint,
    googleCallbackEndpoint,
]
