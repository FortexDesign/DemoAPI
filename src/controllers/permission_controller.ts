// Database Import
import { AppDataSource } from '../database/connection'

// Entities Import
import { Permission } from '../entities/Permission'
import { Permission_Category as PermissionCategory } from '../entities/Permission_Category'
import { Person } from '../entities/Person'
import { Person_Type as PersonType } from '../entities/Person_Type'
import { Role } from '../entities/Role'
import { Workspace } from '../entities/Workspace'

// Libs Import
import { CustomError } from './libs/instance_definition'
import {
    PermissionsAssignationBodyRequest,
    PermissionsAssignationQueryRequest,
    PermissionsListQuery
} from './libs/interface_definition'
import {
    CapitalizeString,
    KeyGenerator
} from './libs/string_manipulation'
import {
    CategoryPermissions,
    EntitiesAvailable,
    EntityPermissions,
    OrganizationBasicInfo
} from './libs/type_definition'

// Modules Import
import {
    Ability,
    subject
} from '@casl/ability'
import {
    Request,
    RequestHandler,
    Response
} from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import {
    EntityManager,
    QueryRunner
} from 'typeorm'
import { validate } from 'uuid'

export default class PermissionController {

    // Method to get a list with the permissions and its categories
    static ListPermissionsGroupedByCategory: RequestHandler<ParamsDictionary, unknown, unknown, PermissionsListQuery> = async (req, res) => {

        // Error Handling for the method
        try {

            // Get the attributes for personId, roleId and workspaceId from the query of the request
            const {
                personId,
                roleId,
                workspaceId
            }: PermissionsListQuery = req.query

            // Check if the personId or the roleId were submitted, and if they didn't, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (!personId && !roleId) throw new CustomError({
                name: `TargetIdNotSubmitted`,
                message: `Neither the id of the person or the id of the role weren't provided with the request`,
                statusCode: 400
            })

            // Check if the personId and the roleId were both submitted, and if they did, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (personId && roleId) throw new CustomError({
                name: `TargetNotIdentified`,
                message: `The target for the method was not identified because both types of ids were submitted and only one of them was expected`,
                statusCode: 400
            })

            // Check if the roleId and the workspaceId were both submitted, and if they did, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (roleId && workspaceId) throw new CustomError({
                name: `TargetNotCompatibleWithWorkspaceRequest`,
                message: `The id of the workspace only has to be provided when the target from the permissions list is a person`,
                statusCode: 400
            })

            // Check if the id of the person has the right format, and if that's not true, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (personId && !validate(personId)) throw new CustomError({
                name: `PersonIdNotValid`,
                message: `The submitted id of the person has an invalid format`,
                statusCode: 400
            })

            // Check if the id of the role has the right format, and if that's not true, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (roleId && !validate(roleId)) throw new CustomError({
                name: `RoleIdNotValid`,
                message: `The submitted id of the role has an invalid format`,
                statusCode: 400
            })
            
            // Get basic information about the information of the organization that the person or the role are linked to using a Query Builder
            const organization: OrganizationBasicInfo = await AppDataSource
                .getRepository(personId ? Person : Role)
                .createQueryBuilder(`target`)
                .leftJoinAndSelect(`target.organizationId`, `organization`)
                .where(`target.id = :id`, { id: personId ? personId : roleId })
                .getOne()

                // Assign the result of the Query Builder to the target parameter
                .then((target: Person | Role | null) => {

                    // Check if the result of the Query Builder is empty, and if that's true, then call the catch method using the CustomError class with its arguments defined to fill the response
                    if (!target) throw new CustomError({
                        name: `${personId ? `Person` : `Role`}NotFound`,
                        message: `A ${personId ? `person`: `role`} with the id ${personId ? personId : roleId} does not exist within the platform`,
                        statusCode: 404
                    })

                    // Assign to the organization constant an object with the id and name of the organization that was found
                    return {

                        "organizationId": target.organizationId.id,
                        "organizationName": target.organizationId.name

                    }

                })

            // Create a constant to store the permissions list that will be different depending on the value of certain conditions
            const permissionsData: EntityPermissions[] | EntityPermissions | null = !workspaceId

                // Execute this condition if a workspaceId wasn't provided with the request
                ? !!personId

                    // Execute this Query Builder if a personId was provided with the request
                    ? await AppDataSource
                        .getRepository(PermissionCategory)
                        .createQueryBuilder(`category`)
                        .leftJoin(`category.permissionsIds`, `organizationalPermission`)
                        .leftJoin(`organizationalPermission.permissionCategoryId`, `organizationalCategory`)
                        .leftJoin(`organizationalPermission.workspaceId`, `workspace`)
                        .leftJoin(`organizationalPermission.personGetsPermission`, `userOrganizationalPermissions`)
                        .leftJoin(`workspace.permissionsIds`, `workspacePermission`)
                        .leftJoin(`workspacePermission.permissionCategoryId`, `workspaceCategory`)
                        .leftJoin(`workspacePermission.personGetsPermission`, `userWorkspacePermissions`)
                        .select([
                            `category.id`,
                            `category.name`,
                            `organizationalPermission.id`,
                            `organizationalPermission.key`,
                            `organizationalPermission.name`,
                            `organizationalCategory.id`,
                            `organizationalCategory.name`,
                            `userOrganizationalPermissions.id`,
                            `workspace.id`,
                            `workspace.name`,
                            `workspacePermission.id`,
                            `workspacePermission.key`,
                            `workspacePermission.name`,
                            `workspaceCategory.id`,
                            `workspaceCategory.name`,
                            `userWorkspacePermissions.id`
                        ])
                        .where(`category.name NOT IN (:...name)`, { name: [`General`] })
                        .getMany()

                        // Assign the result of the Query Builder to the permissionsList argument
                        .then(async (permissionsList: PermissionCategory[]) => {

                            // Create a constant that will hold the permissions categories that doesn't have permissions related to the workspaces
                            const organizationPermissionsCategories: PermissionCategory[] = permissionsList.filter((category: PermissionCategory) => category.permissionsIds.some((permission: Permission) => !permission.workspaceId))

                            // Create a constant that will hold the permissions categories that have permissions related to the workspaces
                            const workspacePermissionsCategories: PermissionCategory[] = permissionsList.filter((category: PermissionCategory) => category.permissionsIds.some((permission: Permission) => permission.workspaceId))

                            /* // Get the workspaces that are linked to the person that has the submitted id using a Query Builder
                            const personWorkspaces: Workspace[] = await AppDataSource
                                .getRepository(Workspace)
                                .createQueryBuilder(`workspace`)
                                .leftJoinAndSelect(`workspace.workspaceInvolvesPerson`, `person`)
                                .where(`person.id = :id`, { id: personId })
                                .getMany() */

                            // Create an empty variable that will store a list with the workspaces related to the permissions
                            let workspaceList: Workspace[] = []

                            // Loop over each permission category with permissions related to the workspaces
                            workspacePermissionsCategories.forEach((category: PermissionCategory) => {

                                // Loop over each permission that belongs to a specific permission category
                                category.permissionsIds.forEach((permission: Permission) => {

                                    // Check if the workspace that it's linked to the permission has not been added to the workspaceList variable and that the workspace is assigned to the person, and if that's true, add the workspace object as the last element of the existing array
                                    if (!workspaceList.some((workspace: Workspace) => workspace.id === permission.workspaceId.id)/*  && personWorkspaces.some((workspace: Workspace) => workspace.id === permission.workspaceId.id) */) workspaceList = [...workspaceList, permission.workspaceId]

                                })

                            })

                            // Assign an array of EntityPermissions objects to the permissionsData constant
                            return [

                                // This object will be the first element of the array and it will contain the attributes of the organization
                                {

                                    "entityId": organization.organizationId,
                                    "entityName": organization.organizationName,
                                    "entityType": `Organization` as EntitiesAvailable,

                                    // This attribute will contain an array with the permission categories from the permissions that are unrelated to any workspace
                                    "entityPermissionsCategories": organizationPermissionsCategories.map((category: PermissionCategory) => {

                                        // This object will contain the attributes of the selected permission category
                                        return {

                                            "permissionCategoryId": category.id,
                                            "permissionCategoryName": category.name,

                                            // This attribute will contain an array with the permissions from the selected category that are unrelated to any workspace
                                            "permissionCategoryPermissions": category.permissionsIds.filter((permission: Permission) => !permission.workspaceId).map((permission: Permission) => {

                                                // This object will contain the attributes of the selected permission
                                                return {

                                                    "permissionId": permission.id,
                                                    "permissionKey": permission.key,
                                                    "permissionName": permission.name,

                                                    // This attribute will contain a boolean value that will be true if the permission is active for that person
                                                    "permissionActive": permission.personGetsPermission.some((person: Person) => person.id === personId)

                                                }

                                            })

                                        }

                                    })

                                },

                                // This property applied to the workspaceList will return a set of objects, whose amount will be defined by the amount of workspaces that were found
                                workspaceList.map((workspace: Workspace) => {

                                    // Create an empty variable that will store the categories that have permissions related to a specific workspace
                                    let workspaceCategories: PermissionCategory[] = []

                                    // Loop over each permission related to a specific workspace
                                    workspace.permissionsIds.forEach((permission: Permission) => {

                                        // Check if the permission category that contains the permission has not been added to the workspaceCategories variable, and if that's true, add the permission category object as the last element of the existing array
                                        if (!workspaceCategories.some((category: PermissionCategory) => category.id === permission.permissionCategoryId.id)) workspaceCategories = [...workspaceCategories, permission.permissionCategoryId]

                                    })

                                    // This object will contain the attributes of the selected workspace
                                    return {

                                        "entityId": workspace.id,
                                        "entityName": workspace.name,
                                        "entityType": `Workspace` as EntitiesAvailable,

                                        // This attribute will contain an array with the permission categories from the permissions that are related to the selected workspace
                                        "entityPermissionsCategories": workspaceCategories.map((category: PermissionCategory) => {

                                            // This object will contain the attributes of the selected permission category
                                            return {

                                                "permissionCategoryId": category.id,
                                                "permissionCategoryName": category.name,

                                                // This attribute will contain an array with the permissions from the selected category that are related to the selected workspace
                                                "permissionCategoryPermissions": workspace.permissionsIds.filter((permission: Permission) => permission.permissionCategoryId.id === category.id).map((permission: Permission) => {

                                                    // This object will contain the attributes of the selected permission
                                                    return {

                                                        "permissionId": permission.id,
                                                        "permissionKey": permission.key,
                                                        "permissionName": permission.name,

                                                        // This attribute will contain a boolean value that will be true if the permission is active for that person
                                                        "permissionActive": permission.personGetsPermission.some((person: Person) => person.id === personId)

                                                    }

                                                })

                                            }

                                        })

                                    }

                                })

                            ].flat()

                        })

                    // Execute this Query Builder if a roleId was provided with the request
                    : await AppDataSource
                        .getRepository(PermissionCategory)
                        .createQueryBuilder(`category`)
                        .leftJoin(`category.permissionsIds`, `organizationalPermission`)
                        .leftJoin(`organizationalPermission.permissionCategoryId`, `organizationalCategory`)
                        .leftJoin(`organizationalPermission.workspaceId`, `workspace`)
                        .leftJoin(`organizationalPermission.roleCombinesPermission`, `roleOrganizationalPermissions`)
                        .leftJoin(`workspace.permissionsIds`, `workspacePermission`)
                        .leftJoin(`workspacePermission.permissionCategoryId`, `workspaceCategory`)
                        .leftJoin(`workspacePermission.roleCombinesPermission`, `roleWorkspacePermissions`)
                        .select([
                            `category.id`,
                            `category.name`,
                            `organizationalPermission.id`,
                            `organizationalPermission.key`,
                            `organizationalPermission.name`,
                            `organizationalCategory.id`,
                            `organizationalCategory.name`,
                            `roleOrganizationalPermissions.id`,
                            `workspace.id`,
                            `workspace.name`,
                            `workspacePermission.id`,
                            `workspacePermission.key`,
                            `workspacePermission.name`,
                            `workspaceCategory.id`,
                            `workspaceCategory.name`,
                            `roleWorkspacePermissions.id`
                        ])
                        .where(`category.name NOT IN (:...name)`, { name: [`General`] })
                        .getMany()

                        // Assign the result of the Query Builder to the permissionsList argument
                        .then((permissionsList: PermissionCategory[]) => {

                            // Create a constant that will hold the permissions categories that doesn't have permissions related to the workspaces
                            const organizationPermissionsCategories: PermissionCategory[] = permissionsList.filter((category: PermissionCategory) => category.permissionsIds.some((permission: Permission) => !permission.workspaceId))

                            // Create a constant that will hold the permissions categories that have permissions related to the workspaces
                            const workspacePermissionsCategories: PermissionCategory[] = permissionsList.filter((category: PermissionCategory) => category.permissionsIds.some((permission: Permission) => permission.workspaceId))

                            // Create an empty variable that will store a list with the workspaces related to the permissions
                            let workspaceList: Workspace[] = []

                            // Loop over each permission category with permissions related to the workspaces
                            workspacePermissionsCategories.forEach((category: PermissionCategory) => {

                                // Loop over each permission that belongs to a specific permission category
                                category.permissionsIds.forEach((permission: Permission) => {

                                    // Check if the workspace that it's linked to the permission has not been added to the workspaceList variable, and if that's true, add the workspace object as the last element of the existing array
                                    if (!workspaceList.some((workspace: Workspace) => workspace.id === permission.workspaceId.id)) workspaceList = [...workspaceList, permission.workspaceId]

                                })

                            })

                            // Assign an array of EntityPermissions objects to the permissionsData constant
                            return [

                                // This object will be the first element of the array and it will contain the attributes of the organization
                                {

                                    "entityId": organization.organizationId,
                                    "entityName": organization.organizationName,
                                    "entityType": `Organization` as EntitiesAvailable,

                                    // This attribute will contain an array with the permission categories from the permissions that are unrelated to any workspace
                                    "entityPermissionsCategories": organizationPermissionsCategories.map((category: PermissionCategory) => {

                                        // This object will contain the attributes of the selected permission category
                                        return {

                                            "permissionCategoryId": category.id,
                                            "permissionCategoryName": category.name,

                                            // This attribute will contain an array with the permissions from the selected category that are unrelated to any workspace
                                            "permissionCategoryPermissions": category.permissionsIds.filter((permission: Permission) => !permission.workspaceId).map((permission: Permission) => {

                                                // This object will contain the attributes of the selected permission
                                                return {

                                                    "permissionId": permission.id,
                                                    "permissionKey": permission.key,
                                                    "permissionName": permission.name,

                                                    // This attribute will contain a boolean value that will be true if the permission is active for that role
                                                    "permissionActive": permission.roleCombinesPermission.some((role: Role) => role.id === roleId)

                                                }

                                            })

                                        }

                                    })

                                },

                                // This property applied to the workspaceList will return a set of objects, whose amount will be defined by the amount of workspaces that were found
                                workspaceList.map((workspace: Workspace) => {

                                    // Create an empty variable that will store the categories that have permissions related to a specific workspace
                                    let workspaceCategories: PermissionCategory[] = []

                                    // Loop over each permission related to a specific workspace
                                    workspace.permissionsIds.forEach((permission: Permission) => {

                                        // Check if the permission category that contains the permission has not been added to the workspaceCategories variable, and if that's true, add the permission category object as the last element of the existing array
                                        if (!workspaceCategories.some((category: PermissionCategory) => category.id === permission.permissionCategoryId.id)) workspaceCategories = [...workspaceCategories, permission.permissionCategoryId]

                                    })

                                    // This object will contain the attributes of the selected workspace
                                    return {

                                        "entityId": workspace.id,
                                        "entityName": workspace.name,
                                        "entityType": `Workspace` as EntitiesAvailable,

                                        // This attribute will contain an array with the permission categories from the permissions that are related to the selected workspace
                                        "entityPermissionsCategories": workspaceCategories.map((category: PermissionCategory) => {

                                            // This object will contain the attributes of the selected permission category
                                            return {

                                                "permissionCategoryId": category.id,
                                                "permissionCategoryName": category.name,

                                                // This attribute will contain an array with the permissions from the selected category that are related to the selected workspace
                                                "permissionCategoryPermissions": workspace.permissionsIds.filter((permission: Permission) => permission.permissionCategoryId.id === category.id).map((permission: Permission) => {

                                                    // This object will contain the attributes of the selected permission
                                                    return {

                                                        "permissionId": permission.id,
                                                        "permissionKey": permission.key,
                                                        "permissionName": permission.name,

                                                        // This attribute will contain a boolean value that will be true if the permission is active for that role
                                                        "permissionActive": permission.roleCombinesPermission.some((role: Role) => role.id === roleId)

                                                    }

                                                })

                                            }

                                        })

                                    }

                                })

                            ].flat()

                        })

                // Execute this conditional if a workspaceId was provided with the request, which will check if it's not a valid workspace
                : Array.isArray(workspaceId) || typeof workspaceId !== `string` || !validate(workspaceId)

                    // If it's not a valid workspace, then it will assign a null value to the permissionsData constant
                    ? null

                    // If it's a valid workspace, then it will execute this Query Builder
                    : await AppDataSource
                        .getRepository(Workspace)
                        .createQueryBuilder(`workspace`)
                        .leftJoin(`workspace.permissionsIds`, `permission`)
                        .leftJoin(`permission.permissionCategoryId`, `category`)
                        .leftJoin(`permission.personGetsPermission`, `personPermissions`)
                        .leftJoin(`workspace.workspaceInvolvesPerson`, `personWorkspace`)
                        .select([
                            `workspace.id`,
                            `workspace.name`,
                            `permission.id`,
                            `permission.key`,
                            `permission.name`,
                            `category.id`,
                            `category.name`,
                            `personPermissions.id`,
                            `personWorkspace.id`
                        ])
                        .where(`workspace.id = :workspaceId`, { workspaceId: workspaceId })
                        .getOne()

                        // Assign the result of the Query Builder to the workspace argument
                        .then((workspace: Workspace | null) => {

                            // Check if the result of the Query Builder is empty, and if that's true, then call the catch method using the CustomError class with its arguments defined to fill the response
                            if (!workspace) throw new CustomError({
                                name: `WorkspaceNotFound`,
                                message: `A workspace with the id ${workspaceId} was not found within the platform`,
                                statusCode: 404
                            })

                            // Check if the submitted person belongs to the workspace that was found with the Query Builder, and if that's not true, then call the catch method using the CustomError class with its arguments defined to fill the response
                            if (!workspace.workspaceInvolvesPerson.some((person: Person) => person.id === personId)) throw new CustomError({
                                name: `PersonNotRelatedToWorkspace`,
                                message: `The person with id ${personId} is not related to the workspace with id ${workspaceId}`,
                                statusCode: 403
                            })

                            // Create an empty variable that will store the categories that have permissions related to a specific workspace
                            let workspaceCategories: PermissionCategory[] = []

                            // Loop over each permission related to a specific workspace
                            workspace.permissionsIds.forEach((permission: Permission) => {

                                // Check if the permission category that contains the permission has not been added to the workspaceCategories variable, and if that's true, add the permission category object as the last element of the existing array
                                if (!workspaceCategories.some((category: PermissionCategory) => category.id === permission.permissionCategoryId.id)) workspaceCategories = [...workspaceCategories, permission.permissionCategoryId]

                            })

                            // This object will contain the attributes of the selected workspace
                            return {

                                "entityId": workspace.id,
                                "entityName": workspace.name,
                                "entityType": `Workspace` as EntitiesAvailable,

                                // This attribute will contain an array with the permission categories from the permissions that are related to the selected workspace
                                "entityPermissionsCategories": workspaceCategories.map((category: PermissionCategory) => {

                                    // This object will contain the attributes of the selected permission category
                                    return {

                                        "permissionCategoryId": category.id,
                                        "permissionCategoryName": category.name,

                                        // This attribute will contain an array with the permissions from the selected category that are related to the selected workspace
                                        "permissionCategoryPermissions": workspace.permissionsIds.filter((permission: Permission) => permission.permissionCategoryId.id === category.id).map((permission: Permission) => {

                                            // This object will contain the attributes of the selected permission
                                            return {

                                                "permissionId": permission.id,
                                                "permissionKey": permission.key,
                                                "permissionName": permission.name,

                                                // This attribute will contain a boolean value that will be true if the permission is active for that person
                                                "permissionActive": permission.personGetsPermission.some((person: Person) => person.id === personId)

                                            }

                                        })

                                    }

                                })

                            }

                        })

            // Check if the value of the permissionsData constant is empty, and if that's true, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (!permissionsData) throw new CustomError({
                name: `WorkspaceIdNotValid`,
                message: `${workspaceId} is not valid as an id for the workspace`,
                statusCode: 400
            })

            // Create a function that return the amount of permissions found for the list within the People interface
            const permissionsListPeoplePage = (permissions: EntityPermissions[]): number => {

                // Create a variable to store the amount of permissions found
                let permissionsAmount: number = 0

                // Loop over each EntityPermissions object within the permissions array, which will be used to loop over each CategoryPermissions object from the EntityPermissions object, which will be used to request the amount of permissions from each CategoryPermissions object that it has to be added to the permissionsAmount variable
                permissions.forEach((permissionEntity: EntityPermissions) => permissionEntity.entityPermissionsCategories.forEach((category: CategoryPermissions) => permissionsAmount += category.permissionCategoryPermissions.length))
                
                // Return the amount of permissions found
                return permissionsAmount

            }

            // Create a function that return the amount of permissions found for the list within the Workspace interface
            const permissionsListWorkspacePage = (permissions: EntityPermissions): number => {

                // Create a variable to store the amount of permissions found
                let permissionsAmount: number = 0

                // Loop over each CategoryPermissions object within the permissions object, which will be used to request the amount of permissions from each CategoryPermissions object that it has to be added to the permissionsAmount variable
                permissions.entityPermissionsCategories.forEach((category: CategoryPermissions) => permissionsAmount += category.permissionCategoryPermissions.length)
                
                // Return the amount of permissions found
                return permissionsAmount

            }

            // Create a variable to store the amount of permissions that will be retrieved, whose value will change if the permissionsData variable is an array or not
            const permissionsListLength: number = Array.isArray(permissionsData)

                // Execute the permissionsListPeoplePage function if permissionsData is an array
                ? permissionsListPeoplePage(permissionsData)

                // Execute the permissionsListWorkspacePage function if permissionsData is not an array
                : permissionsListWorkspacePage(permissionsData)

            // Return a list with the found permissions in JSON format with the OK (200) status - SUCCESS
            return res
                .status(200)
                .json({
                    name: `PermissionsList`,
                    message: `The list returned a total of ${permissionsListLength} permissions`,
                    info: permissionsData
                })

        } catch (error) {

            // If the error is detected without any issues, then return a personalized error schema in JSON format with the status code received, or the default one if the code was not provided - EXPECTED ERROR
            if (error instanceof Error) return res
                .status(error instanceof CustomError ? error.statusCode || 500 : 500)
                .json({
                    name: error.name,
                    message: error.message,
                    info: error.stack || `No additional info provided`
                })

            // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - UNEXPECTED ERROR
            return res
                .status(500)
                .json({
                    name: `Unknown`,
                    message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
                    info: error
                })

        }

    }
    
    // Function to create a new category for the permissions
    static CreatePermissionCategory = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the name attribute from the body of the request
            const { name } = req.body

            // Format the input name to match the required style
            const categoryName: string = CapitalizeString(name.trim())

            // Check if there is a category whose name is the one submitted within the form using a Query Builder
            const verifyCategory: PermissionCategory | null = await AppDataSource
                .getRepository(PermissionCategory)
                .createQueryBuilder(`category`)
                .where(`category.name = :name`, { name: categoryName })
                .getOne()

            // If a category with the input name already exists within the platform, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (verifyCategory) return res
                .status(409)
                .json({
                    name: `CATEGORY ALREADY EXISTS`,
                    message: `The ${categoryName} category already exists within the platform`,
                    info: `No additional info required`
                })

            // Create a child from the main database source
            const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

            // Initialize the database connection through the child source
            await queryRunner.connect()

            // Create a transaction that will be executed using the child source
            await queryRunner.startTransaction()

            // Check if the transaction gets an error while processing data
            try {

                // Create a shortcut to call the operations from the child source
                const databaseOperations: EntityManager = queryRunner.manager

                // Create the object that will hold the category's attributes
                const category: PermissionCategory = PermissionCategory.create({
                    name: categoryName
                })

                // Insert the created category object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(PermissionCategory)
                    .values(category)
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `CATEGORY CREATED`,
                        message: `The ${categoryName} category was successfully created`,
                        info: category
                    })

            } catch (error) {

                // Undo the changes made by the transaction if an error happened
                await queryRunner.rollbackTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 2
                if (error instanceof Error) return res
                    .status(500)
                    .json({
                        name: error.name,
                        message: error.message,
                        info: error.stack || `No additional info provided`
                    })

                // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 3
                return res
                    .status(500)
                    .json({
                        name: `Unknown`,
                        message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
                        info: error
                    })

            }

        } catch (error) {

            // If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 2
            if (error instanceof Error) return res
                .status(500)
                .json({
                    name: error.name,
                    message: error.message,
                    info: error.stack || `No additional info provided`
                })

            // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 3
            return res
                .status(500)
                .json({
                    name: `Unknown`,
                    message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
                    info: error
                })

        }

    }

    // Function to create a new permission
    static CreatePermission = async (req: Request, res: Response) => {
        
        // Error Handling for the method
        try {

            // Get the attributes for name, action, subject, fields, conditions, inverted, reason and category from the body of the request
            const {
                name,
                action,
                subject,
                fields,
                conditions,
                inverted,
                reason,
                category,
                workspace
            } = req.body

            // Format the input name to match the required style
            const permissionName: string = CapitalizeString(name.trim())

            // Format the input category to match the required style
            const permissionCategory: string = CapitalizeString(category.trim())

            // Check if there is a category whose name is the one submitted within the form using a Query Builder
            const verifyPermissionCategory: PermissionCategory | null = await AppDataSource
                .getRepository(PermissionCategory)
                .createQueryBuilder(`category`)
                .where(`category.name = :name`, { name: permissionCategory })
                .getOne()

            // If the submitted category doesn't exist within the platform, then return a personalized error schema in JSON format with the NOT FOUND (404) status - ERROR LEVEL 1
            if (!verifyPermissionCategory) return res
                .status(404)
                .json({
                    name: `CategoryNotValid`,
                    message: `The ${permissionCategory} category doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            let verifyWorkspace: Workspace | null = null
            
            if (workspace) {
            
                // Check if there is a workspace whose id is the same as the one submitted with the request using a Query Builder
                verifyWorkspace = await AppDataSource
                    .getRepository(Workspace)
                    .createQueryBuilder(`workspace`)
                    .where(`workspace.id = :id`, { id: workspace })
                    .getOne()

                // If a workspace with the submitted id doesn't exist within the platform, then return a personalized error schema in JSON format with the NOT FOUND (404) status - ERROR LEVEL 1
                if (!verifyWorkspace) return res
                    .status(404)
                    .json({
                        name: `WorkspaceNotFound`,
                        message: `The workspace with id ${workspace} doesn't exist within the platform`,
                        info: `No additional info provided`
                    })

            }

            // Create a key for the permission using its name
            const permissionKey: string = KeyGenerator(permissionName, verifyWorkspace?.name)

            // Check if there is a permission whose key is the same as the created one using a Query Builder
            const verifyPermissionByKey: Permission | null = await AppDataSource
                .getRepository(Permission)
                .createQueryBuilder(`permission`)
                .where(`permission.key = :key`, { key: permissionKey })
                .getOne()

            // If a permission with the created key already exists within the platform, then return a personalized error schema in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (verifyPermissionByKey) return res
                .status(409)
                .json({
                    name: `PermissionKeyAlreadyExists`,
                    message: `The permission with key ${permissionKey} already exists within the platform`,
                    info: `No additional info provided`
                })

            // Create a child from the main database source
            const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

            // Initialize the database connection through the child source
            await queryRunner.connect()

            // Create a transaction that will be executed using the child source
            await queryRunner.startTransaction()

            // Check if the transaction gets an error while processing data
            try {

                // Create a shortcut to call the operations from the child source
                const databaseOperations: EntityManager = queryRunner.manager

                // Create the object that will hold the permission's attributes
                const permission: Permission = Permission.create({
                    key: permissionKey,
                    name: permissionName,
                    action: action,
                    subject: subject,
                    fields: fields,
                    conditions: conditions,
                    inverted: inverted,
                    reason: reason,
                    permissionCategoryId: verifyPermissionCategory,
                    workspaceId: workspace
                })

                // Insert the created permission object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(Permission)
                    .values(permission)
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a personalized success schema in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `PERMISSION CREATED`,
                        message: `The ${permissionName} permission was successfully created`,
                        info: permission
                    })

            } catch (error) {

                // Undo the changes made by the transaction if an error happened
                await queryRunner.rollbackTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 2
                if (error instanceof Error) return res
                    .status(500)
                    .json({
                        name: error.name,
                        message: error.message,
                        info: error.stack || `No additional info provided`
                    })

                // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 3
                return res
                    .status(500)
                    .json({
                        name: `Unknown`,
                        message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
                        info: error
                    })

            }

        } catch (error) {

            // If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 2
            if (error instanceof Error) return res
                .status(500)
                .json({
                    name: error.name,
                    message: error.message,
                    info: error.stack || `No additional info provided`
                })

            // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 3
            return res
                .status(500)
                .json({
                    name: `Unknown`,
                    message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
                    info: error
                })

        }

    }

    // Method to assign a set of permissions to a person
    static PermitAssignation: RequestHandler<ParamsDictionary, unknown, PermissionsAssignationBodyRequest, PermissionsAssignationQueryRequest> = async (req, res) => {

        // Error Handling for the method
        try {

            // Get the attributes for personId and roleId from the query of the request
            const {
                personId,
                roleId
            }: PermissionsAssignationQueryRequest = req.query

            // Get the attributes for newPermissionsList and permissions from the body of the request
            const {
                newPermissionsList,
                permissions
            }: PermissionsAssignationBodyRequest = req.body

            // Check if the personId or the roleId were submitted, and if they didn't, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (!personId && !roleId) throw new CustomError({
                name: `TargetIdNotSubmitted`,
                message: `Neither the id of the person or the id of the role weren't provided with the request`,
                statusCode: 400
            })

            // Check if the personId and the roleId were both submitted, and if they did, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (personId && roleId) throw new CustomError({
                name: `TargetNotIdentified`,
                message: `The target for the method was not identified because both types of ids were submitted and only one of them was expected`,
                statusCode: 400
            })

            // Check if the id of the person has the right format, and if that's not true, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (personId && !validate(personId)) throw new CustomError({
                name: `PersonIdNotValid`,
                message: `The submitted id of the person has an invalid format`,
                statusCode: 400
            })

            // Check if the id of the role has the right format, and if that's not true, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (roleId && !validate(roleId)) throw new CustomError({
                name: `RoleIdNotValid`,
                message: `The submitted id of the role has an invalid format`,
                statusCode: 400
            })

            // Check if the logged user has the right permissions to assign permissions to a person or a role, and if it hasn't them, then call the catch method using the CustomError class with its arguments defined to fill the response
            if (!permissions.can(`assign`, `Permission`)) throw new CustomError({
                name: `ForbiddenAccess`,
                message: `You don't have the required permissions to assign or revoke permissions from a target`,
                statusCode: 403
            })

            // Check if there is a person linked to a user with the same id as the one submitted with the query using a Query Builder
            const verifyTarget: Person | Role | null = personId
                
                // Execute this Query Builder if a personId was provided with the request
                ? await AppDataSource
                    .getRepository(Person)
                    .createQueryBuilder(`person`)
                    .leftJoinAndSelect(`person.userId`, `user`)
                    .where(`person.id = :id`, { id: personId })
                    .getOne()

                // Execute this Query Builder if a roleId was provided with the request
                : await AppDataSource
                    .getRepository(Role)
                    .createQueryBuilder(`role`)
                    .where(`role.id = :id`, { id: roleId })
                    .getOne()

            // If the target for the permissions wasn't found within the platform, then return a personalized error schema in JSON format with the NOT FOUND (404) status - ERROR LEVEL 1
            if (!verifyTarget) throw new CustomError({
                name: `${personId ? `Person` : `Role`}NotFound`,
                message: `The target for the permissions was not found within the platform`,
                statusCode: 404
            })

            // Get a list with the permissions that are currently assigned to the target using a Query Builder
            const actualPermissionsList: Permission[] = await AppDataSource
                .createQueryBuilder()
                .relation(verifyTarget instanceof Person ? Person : Role, verifyTarget instanceof Person ? `personGetsPermission` : `roleCombinesPermission`)
                .of(verifyTarget)
                .loadMany()

            // Create a child from the main database source
            const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

            // Initialize the database connection through the child source
            await queryRunner.connect()

            // Create a transaction that will be executed using the child source
            await queryRunner.startTransaction()

            // Check if the transaction gets an error while processing data
            try {

                // Create a shortcut to call the operations from the child source
                const databaseOperations: EntityManager = queryRunner.manager

                // Check if the actualPermissionsList is not empty, and if that's true, then delete all the permissions from the target using a Query Builder
                if (actualPermissionsList.length > 0) await databaseOperations
                    .createQueryBuilder()
                    .relation(verifyTarget instanceof Person ? Person : Role, verifyTarget instanceof Person ? `personGetsPermission` : `roleCombinesPermission`)
                    .of(verifyTarget)
                    .remove(actualPermissionsList)

                // Create a constant to store the new permissions list that will be different depending on the value of the amount of permissions ids that has the newPermissionsList
                const verifyPermissionList: Permission[] = newPermissionsList.length > 0
                    
                    // Execute this Query Builder to get a list with the permissions to be added and assign it to the constant
                    ? await databaseOperations
                        .getRepository(Permission)
                        .createQueryBuilder(`permission`)
                        .leftJoinAndSelect(`permission.${verifyTarget instanceof Person ? `personGetsPermission` : `roleCombinesPermission`}`, `target`)
                        .where(`permission.id IN (:...id)`, { id: newPermissionsList })
                        .getMany()

                    // Execute this statement to assign an empty array to the constant
                    : []

                // Check if the verifyPermissionList is not empty, and if that's true, then assign the permissions within the array to the target using a Query Builder
                if (verifyPermissionList.length > 0) await databaseOperations
                    .createQueryBuilder()
                    .relation(verifyTarget instanceof Person ? Person : Role, verifyTarget instanceof Person ? `personGetsPermission` : `roleCombinesPermission`)
                    .of(verifyTarget)
                    .add(verifyPermissionList)

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()
                
                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `AllowedPermissionsChangedFor${verifyTarget instanceof Person ? `Person` : `Role`}`,
                        message: `The allowed permissions from ${verifyTarget instanceof Person ? `${verifyTarget.firstName} (${verifyTarget.userId.email})` : `the ${verifyTarget.name} role`} were modified`,
                        info: `No additional info provided`
                    })

            } catch (error) {

                // Undo the changes made by the transaction if an error happened
                await queryRunner.rollbackTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Call the catch method with the error object
                throw error

            }

        } catch (error) {

            // If the error is detected without any issues, then return a personalized error schema in JSON format with the status code received, or the default one if the code was not provided - EXPECTED ERROR
            if (error instanceof Error) return res
                .status(error instanceof CustomError ? error.statusCode || 500 : 500)
                .json({
                    name: error.name,
                    message: error.message,
                    info: error.stack || `No additional info provided`
                })

            // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - UNEXPECTED ERROR
            return res
                .status(500)
                .json({
                    name: `Unknown`,
                    message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
                    info: error
                })

        }

    }

    static CheckPermission = (req: Request, res: Response) => {

        const { permissions } = req.body

        if (!permissions) return res
            .status(403)
            .json({
                name: `FORBIDDEN ACCESS`,
                message: `You don't have the required permissions to access this method`,
                info: `Not additional info provided`
            })

        const permissionChecker = new Ability(permissions)

        const personType: PersonType = PersonType.create({
            name: `Counter`,
            description: `This is a counter`
        })

        const isAllowed: Boolean = permissionChecker.can(`Update`, subject('Person Type', personType))

        return res
            .status(200)
            .json({
                name: `PERMISSIONS LIST`,
                message: `The permissions list returned ${permissions.length} element${permissions.length === 1 ? `` : `s`}`,
                info: permissions,
                result: isAllowed
            })

    }

}