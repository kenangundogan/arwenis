import type { Endpoint } from 'payload'
import { chatEndpoint } from './assistant/chat'
import { exportEndpoint } from './assistant/export'
import { googleStartEndpoint, googleCallbackEndpoint } from './auth/google'
import { authProvidersEndpoint } from './auth/providers'
import { deleteAccountEndpoint } from './auth/deleteAccount'

export const endpoints: Endpoint[] = [
    chatEndpoint,
    exportEndpoint,
    authProvidersEndpoint,
    googleStartEndpoint,
    googleCallbackEndpoint,
    deleteAccountEndpoint,
]
