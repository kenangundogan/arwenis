import type { Endpoint } from 'payload'
import { chatEndpoint } from './assistant/chat'
import { exportEndpoint } from './assistant/export'
import { googleStartEndpoint, googleCallbackEndpoint } from './auth/google'
import { authProvidersEndpoint } from './auth/providers'

export const endpoints: Endpoint[] = [
    chatEndpoint,
    exportEndpoint,
    authProvidersEndpoint,
    googleStartEndpoint,
    googleCallbackEndpoint,
]
