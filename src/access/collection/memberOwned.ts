import type { Access, FieldAccess, Where } from 'payload'
import { isMember } from '../utils'
import { canReadSecure } from './canReadSecure'
import { canDelete, canUpdate } from './withPermission'

const ownWhere = (id: string | number): Where => ({ member: { equals: id } })

// Read: member → only own records; otherwise fall back to admin permission logic.
export const memberOwnedRead = (resource: string): Access => async (args) =>
    isMember(args.req.user) ? ownWhere(args.req.user!.id) : canReadSecure(resource)(args)

// Delete: member → only own records; otherwise admin permission logic.
export const memberOwnedDelete = (resource: string): Access => async (args) =>
    isMember(args.req.user) ? ownWhere(args.req.user!.id) : canDelete(resource)(args)

// Create: members only (ownership is forced server-side via a beforeValidate hook).
export const memberCreate: Access = ({ req }) => isMember(req.user)

// Update: member → only own records; non-members blocked (server writes use overrideAccess).
export const memberOwnedUpdate: Access = ({ req }) =>
    isMember(req.user) ? ownWhere(req.user!.id) : false

export const memberSelfUpdate = (resource: string): Access => async (args) =>
    isMember(args.req.user) ? { id: { equals: args.req.user!.id } } : canUpdate(resource)(args)

export const memberSelfRead = (resource: string): Access => async (args) =>
    isMember(args.req.user) ? { id: { equals: args.req.user!.id } } : canReadSecure(resource)(args)

// Field-level: block members from writing server-managed fields.
export const notMemberField: FieldAccess = ({ req }) => !isMember(req.user)
