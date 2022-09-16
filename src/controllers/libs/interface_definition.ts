import {
    Ability,
    AbilityTuple,
    MongoQuery,
    Subject
} from "@casl/ability"
import { AnyObject } from "@casl/ability/dist/types/types"

export interface PermissionsListQuery {
    personId: string,
    roleId: string,
    workspaceId: string
}

export interface PermissionsAssignationBodyRequest {
    newPermissionsList: string[],
    permissions: Ability<AbilityTuple<string, Subject>, MongoQuery<AnyObject>>
}

export interface PermissionsAssignationQueryRequest {
    personId: string,
    roleId: string
}