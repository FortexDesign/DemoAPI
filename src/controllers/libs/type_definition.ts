export type ActionsList = `create` | `read` | `update` | `delete` | `manage`

export type PermissionRule = {
    action: string | string[]
    subject?: string | string[]
    /** an array of fields to which user has (or not) access */
    fields?: string[]
    /** an object of conditions which restricts the rule scope */
    conditions?: any
    /** indicates whether rule allows or forbids something */
    inverted?: Boolean
    /** message which explains why rule is forbidden */
    reason?: string
}

export type AvailableEntitiesRole = {
    id: string,
    name: string,
    entity: string
}

export type OrganizationBasicInfo = {
    organizationId: string,
    organizationName: string
}

export type PermissionFormat = {
    permissionId: string,
    permissionKey: string,
    permissionName: string,
    permissionActive: boolean
}

export type CategoryPermissions = {
    permissionCategoryId: string,
    permissionCategoryName: string,
    permissionCategoryPermissions: PermissionFormat[]
}

export type EntitiesAvailable = "Organization" | "Workspace"

export type EntityPermissions = {
    entityId: string,
    entityName: string,
    entityType: EntitiesAvailable,
    entityPermissionsCategories: CategoryPermissions[]
}

export type WorkspacePermissions = {
    workspaceId: string,
    workspaceName: string,
    workspacePermissionsCategories: CategoryPermissions[]
}