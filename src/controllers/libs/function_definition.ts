import {
    EntityPermissions,
    WorkspacePermissions
} from './type_definition'

export const PermissionType = (permissionList: WorkspacePermissions | EntityPermissions[]): permissionList is WorkspacePermissions => {
    return (permissionList as WorkspacePermissions).workspaceId !== undefined
}



//this function sorts by ascending an associative array by an attribute
export const orderByAttribute = (a:any ,b: any)=> {
    if (a == b) {
      return 0;
    }
    if (a < b) {
      return -1;
    }
    return 1;
}

//this function sorts by descending an associative array by an attribute
export const orderByDescendingAttribute = (a:any ,b: any)=> {
    if (a == b) {
      return 0;
    }
    if (a > b) {
      return -1;
    }
    return 1;

}