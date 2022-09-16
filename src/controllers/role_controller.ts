// Database Import
import { AppDataSource } from '../database/connection'

// Entities Import
import { Group } from '../entities/Group'
import { Organization } from '../entities/Organization'
import { Permission } from '../entities/Permission'
import { Person } from '../entities/Person'
import { Role } from '../entities/Role'

// Libs Import
import { CapitalizeString } from './libs/string_manipulation'
import { AvailableEntitiesRole } from './libs/type_definition'

// Modules Import
import {
    Request,
    Response
} from 'express'
import {
    EntityManager,
    QueryRunner
} from 'typeorm'
import { validate } from 'uuid'
import { CustomError } from './libs/instance_definition'
import { orderByAttribute } from './libs/function_definition'

export default class RoleController {

    // Function to get a list with the names of the roles filtered by organization
    static ListRolesByName = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {
            
            // Get a list with the registered roles sorted by their name using a Query Builder
            const roles: Role[] = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .leftJoinAndSelect(`role.organizationId`, `organization`)
                .orderBy(`role.name`, `ASC`)
                .getMany()

            // Return an OK (200) status with a JSON object that has the information about the roles
            return res
                .status(200)
                .json({
                    name: `RolesListFound`,
                    message: `A total of ${roles.length} role${roles.length !== 1 ? `s were` : ` was`} found within the platform`,
                    data: roles
                })

        } catch (error) {

            // Return an error message in JSON format with the INTERNAL SERVER ERROR (500) status
            if (error instanceof Error) return res
                .status(500)
                .json({ message: error })

            // Return the INTERNAL SERVER ERROR (500) status
            return res
                .sendStatus(500)

        }

    }

    // Function to create a new role
    static CreateRole = async (req: Request, res: Response) => { 

        // Error Handling for the method
        try {

            // Get the values of the attributes for name, description and organization from the body of the request
            const {
                name,
                description,
                organization
            } = req.body

            // Check if there is an organization whose name is the one submitted within the form using a Query Builder
            const verifyOrganization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where(`organization.name = :name`, { name: organization })
                .getOne()

            // If an organization with the submitted name doesn't exist within the platform, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (!verifyOrganization) return res
                .status(400)
                .json({
                    name: `ORGANIZATION NOT FOUND`,
                    message: `The ${organization} organization doesn't exist within the platform`,
                    info: `No additional info required`
                })

            // Format the input name to match the required style
            const roleName: string = CapitalizeString(name.trim())

            // Check if there is a role whose name is the one submitted within the form using a Query Builder
            const verifyRole: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .leftJoinAndSelect(`role.organizationId`, `organization`)
                .where(`role.name = :name`, { name: roleName })
                .andWhere(`organization.id = :organization`, { organization: verifyOrganization.id })
                .getOne()

            // If a role with the input name already exists within the platform, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (verifyRole) return res
                .status(409)
                .json({
                    name: `ROLE ALREADY EXISTS`,
                    message: `The ${roleName} role already exists within the platform`,
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

                // Create the object that will hold the role's attributes
                const role: Role = Role.create({
                    name: roleName,
                    description: description,
                    organizationId: verifyOrganization
                })

                // Insert the created category object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(Role)
                    .values(role)
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `ROLE CREATED`,
                        message: `The ${roleName} role was successfully created`,
                        info: role
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

    // Function to edit a role
    static EditRole = async (req: Request, res: Response) => {

        // Error Handling for the Method
        try {

            // Get the value of the id from the query of the request
            const { id } = req.query

            // Validation to check if it isn't a valid page, and if it isn't valid, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!id || typeof id !== `string` || Array.isArray(id) || !validate(id)) return res
                .status(400)
                .json({ message: `The id is not valid` })
            
            // Get the values of the attributes for name and description from the body of the request
            const {
                name,
                description
            } = req.body
            
            // Check if there is a role whose name is the one submitted within the form using a Query Builder
            const verifyRole: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .leftJoinAndSelect(`role.organizationId`, `organization`)
                .where(`role.id = :id`, { id: id })
                .getOne()
            
            // If a role with the received id doesn't exist within the platform, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (!verifyRole) return res
                .status(409)
                .json({
                    name: `ROLE DOESN'T EXISTS`,
                    message: `The role with id ${id} doesn't exist within the platform`,
                    info: `No additional info required`
                })

            // Format the input name to match the required style
            const roleName: string = CapitalizeString(name.trim())

            // Check if there is any role within the organization with the same name submitted using a Query Builder
            const verifyRoleName: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .where(`role.name = :name`, { name: roleName })
                .andWhere(`role.organizationId = :organization`, { organization: verifyRole.organizationId.id })
                .getOne()

            // If a role with the input name already exists within the platform and it's different from the one being edited, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (verifyRoleName && verifyRole.id !== verifyRoleName.id) return res
                .status(409)
                .json({
                    name: `ROLE ALREADY EXISTS`,
                    message: `The ${roleName} role already exists within the platform`,
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

                // Update the selected role into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .update(Role)
                    .set({ name: name, description: description })
                    .where(`id = :id`, { id: id })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a success message in JSON format with the OK (200) status - SUCCESS
                return res
                    .status(200)
                    .json({
                        name: `ROLE UPDATED`,
                        message: `The ${roleName} role was successfully updated`,
                        info: `No additional info provided`
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

    // Function to delete a role
    static DeleteRole = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the values of the id attribute from the body of the request
            const { id } = req.query

            // Check if the id was provided, and if it wasn't, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!id) return res
                .status(400)
                .json({
                    name: `NO ROLE SELECTED`,
                    message: `No ID was provided of the soon-to-delete role`,
                    info: `No additional info provided`
                })
            
            // Check if the id has a valid format, and if it didn't have, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!validate(id as string)) return res
                .status(400)
                .json({
                    name: `ROLE NOT FOUND`,
                    message: `The received id is not valid`,
                    info: `No additional info provided`
                })

            // Check if there is a role whose id is the one submitted within the form using a Query Builder
            const verifyRole: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .where(`role.id = :id`, { id: id })
                .getOne()

            // If a role with the input name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyRole) return res
                .status(400)
                .json({
                    name: `ROLE NOT FOUND`,
                    message: `A role with the specified id is not registered within the platform`,
                    info: `No additional info provided`
                })

            // Create a Query Builder to check which people are assigned to the role
            const peopleUsingRole: Person[] = await AppDataSource
                .createQueryBuilder()
                .relation(Role, `groupLinksRole`)
                .of(verifyRole)
                .loadMany()

            // If it's assigned to at least one person, then return an error message in JSON format with the CONFLICT (409) status
            if (peopleUsingRole) return res
                .status(409)
                .json({
                    name: `ROLE STILL ASSIGNED`,
                    message: `The ${verifyRole.name} role is being used by ${peopleUsingRole.length} ${peopleUsingRole.length === 1 ? `person` : `people`}`,
                    info: `No additional info provided`
                })

            // Create a Query Builder to check which groups are assigned to the role
            const groupUsingRole: Group[] = await AppDataSource
                .createQueryBuilder()
                .relation(Role, `groupLinksRole`)
                .of(verifyRole)
                .loadMany()

            // If it's assigned to at least one group, then return an error message in JSON format with the CONFLICT (409) status
            if (groupUsingRole) return res
                .status(409)
                .json({
                    name: `ROLE STILL ASSIGNED`,
                    message: `The ${verifyRole.name} role is being used by ${groupUsingRole.length} ${groupUsingRole.length === 1 ? `group` : `groups`}`,
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

                // Delete a role from the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .delete()
                    .from(Role)
                    .where(`id = :id`, { id: id })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `ROLE DELETED`,
                        message: `The selected role was successfully deleted`,
                        info: `No additional info provided`
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

    // Function to assign a permission to a role
    static AddPermissionToRole = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the attributes for permission, role and organization from the body of the request
            const {
                permission,
                role,
                organization
            } = req.body

            // Format the submitted permission name to match the required style
            const permissionName: string = CapitalizeString(permission.trim())
            
            // Check if there is a permission whose name is the same as the one received using a Query Builder
            const verifyPermission: Permission | null = await AppDataSource
                .getRepository(Permission)
                .createQueryBuilder(`permission`)
                .where(`permission.name = :name`, { name: permissionName })
                .getOne()

            // If a permission with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyPermission) return res
                .status(400)
                .json({
                    name: `PERMISSION NOT FOUND`,
                    message: `The permission ${permission} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if there is an organization whose name is the same as the one received using a Query Builder
            const verifyOrganization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where(`organization.name = :organization`, { organization: organization })
                .getOne()

            // If an organization with that name doesn't exist, then return an error message in JSON format with the NOT FOUND (404) status
            if (!verifyOrganization) return res
                .status(404)
                .json({
                    name: `ORGANIZATION NOT FOUND`,
                    message: `The organization named ${organization} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Format the name of the role to match the required style
            const roleName: string = CapitalizeString(role.trim())

            // Check if there is a role whose name is the same as the one received using a Query Builder
            const verifyRole: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .where(`role.name = :name`, { name: roleName })
                .andWhere(`role.organizationId = :organization`, { organization: verifyOrganization.id })
                .getOne()

            // If a role with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyRole) return res
                .status(400)
                .json({
                    name: `ROLE NOT FOUND`,
                    message: `The role named ${roleName} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if the selected permission and role are already linked within the platform using a Query Builder
            const checkExistingAssign: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .leftJoinAndSelect(`role.roleCombinesPermission`, `rolePermission`)
                .where(`role.id = :roleId`, { roleId: verifyRole.id })
                .andWhere(`rolePermission.id = :permissionId`, { permissionId: verifyPermission.id })
                .getOne()

            // If a permission is already assigned to a role, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (checkExistingAssign) return res
                .status(409)
                .json({
                    name: `ROLE AND PERMISSION ARE ALREADY LINKED`,
                    message: `The selected role and permission are already linked within the platform`,
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

                // Insert the relation between the permission and the role into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Role, `roleCombinesPermission`)
                    .of(verifyRole)
                    .add(verifyPermission)

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()
                
                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `PERMISSION ASSIGNED TO ROLE`,
                        message: `The ${permissionName} permission was assigned to the ${verifyRole.name} role`,
                        info: `No additional info provided`
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

    // Function to revoke a permission from a role
    static RevokePermissionToRole = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the attributes for permission, role and organization from the body of the request
            const {
                permission,
                role,
                organization
            } = req.body

            // Format the submitted permission name to match the required style
            const permissionName: string = CapitalizeString(permission.trim())
            
            // Check if there is a permission whose name is the same as the one received using a Query Builder
            const verifyPermission: Permission | null = await AppDataSource
                .getRepository(Permission)
                .createQueryBuilder(`permission`)
                .where(`permission.name = :name`, { name: permissionName })
                .getOne()

            // If a permission with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyPermission) return res
                .status(400)
                .json({
                    name: `PERMISSION NOT FOUND`,
                    message: `The permission ${permission} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if there is an organization whose name is the same as the one received using a Query Builder
            const verifyOrganization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where(`organization.name = :organization`, { organization: organization })
                .getOne()

            // If an organization with that name doesn't exist, then return an error message in JSON format with the NOT FOUND (404) status
            if (!verifyOrganization) return res
                .status(404)
                .json({
                    name: `ORGANIZATION NOT FOUND`,
                    message: `The organization named ${organization} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Format the name of the role to match the required style
            const roleName: string = CapitalizeString(role.trim())

            // Check if there is a role whose name is the same as the one received using a Query Builder
            const verifyRole: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .where(`role.name = :name`, { name: roleName })
                .andWhere(`role.organizationId = :organization`, { organization: verifyOrganization.id })
                .getOne()

            // If a role with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyRole) return res
                .status(400)
                .json({
                    name: `ROLE NOT FOUND`,
                    message: `The role named ${roleName} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if the selected permission and role are linked within the platform using a Query Builder
            const checkExistingAssign: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .leftJoinAndSelect(`role.roleCombinesPermission`, `rolePermission`)
                .where(`role.id = :roleId`, { roleId: verifyRole.id })
                .andWhere(`rolePermission.id = :permissionId`, { permissionId: verifyPermission.id })
                .getOne()

            // If the permission is not assigned to the role, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!checkExistingAssign) return res
                .status(400)
                .json({
                    name: `ROLE AND PERMISSION ARE NOT LINKED`,
                    message: `The selected role and permission are not linked within the platform`,
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

                // Remove the relation between the permission and the role into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Role, `roleCombinesPermission`)
                    .of(verifyRole)
                    .remove(verifyPermission)

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()
                
                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `PERMISSION REVOKED TO ROLE`,
                        message: `The ${permissionName} permission was revoked from the ${verifyRole.name} role`,
                        info: `No additional info provided`
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

    // Method to get a list of the available people and groups that could be assigned to a role
    static GetPossibleAssignsForRole = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the value of the roleId attribute from the body of the request
            const { roleId } = req.body

            // Check if the id received has an UUID format, and if that's not true, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!validate(roleId)) return res
                .status(400)
                .json({
                    name: `IdNotValid`,
                    message: `The submitted id is not valid as UUID`,
                    info: `No additional info provided`
                })

            // Create a variable to store the id of the organization owning the role assigning it an empty value
            let organizationRole: string = ``

            // Check if there is a role with the same ID as the one submitted using a Query Builder
            const entitiesFromRole: string[] | Response<any, Record<string, any>> = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .innerJoinAndSelect(`role.organizationId`, `organization`)
                .leftJoinAndSelect(`role.personAppointsRole`, `personRole`)
                .leftJoinAndSelect(`role.groupLinksRole`, `groupRole`)
                .where(`role.id = :id`, { id: roleId })
                .getOne()
                // If a role was found, then continue with the nested then methods
                .then((role) => {

                    // Check if the role is empty, and if that's true, then call an error to go to the catch method
                    if (!role) throw new Error()

                    // Assign the id of the organization owner of the role to the organizationRole variable
                    organizationRole = role.organizationId.id

                    // Assign the ids of the people and groups linked to the role to the constant entitiesFromRole as an array of strings
                    return role.personAppointsRole.flatMap((person) => {
                        return person.id
                    }).concat(role.groupLinksRole.flatMap((group) => {
                        return group.id
                    }))

                })
                // If a role was not found, then continue with the nested catch methods
                .catch(() => {

                    // Return a personalized error schema in JSON format with the NOT FOUND (404) status - ERROR LEVEL 1
                    return res
                        .status(404)
                        .json({
                            name: `RoleNotFound`,
                            message: `A role with id ${roleId} was not found within the platform`,
                            info: `No additional info provided`
                        })

                })

            // Check if the value of the entitiesFromRole constant is an array, and if that's true, then continue with the nested if methods
            if (Array.isArray(entitiesFromRole)) {

                // Create a queriedEntities constant that will store an array of ids taking in account the length of the entitiesFromRole constant
                const queriedEntities: string[] = entitiesFromRole.length > 0 ? entitiesFromRole : [roleId]

                // Get a list with the people that can be added to the role using a Query Builder
                const peopleOutsideRole: AvailableEntitiesRole[] = await AppDataSource
                    .getRepository(Person)
                    .createQueryBuilder(`person`)
                    .select([
                        `person.id`,
                        `person.firstName`,
                        `person.lastName`
                    ])
                    .where(`person.id NOT IN (:...id)`, { id: queriedEntities })
                    .andWhere(`person.organizationId = :organization`, { organization: organizationRole })
                    .getMany()
                    // After the results were found, continue with the nested then methods afterwards
                    .then((peopleList) => peopleList.flatMap((person) => {

                        // Assign the new object with id, name and entity from each person to the peopleOutsideRole constant as an array of AvailableEntitiesRole objects
                        return {
                            id: person.id,
                            name: `${person.firstName} ${person.lastName}`,
                            entity: `Person`
                        }

                    }))

                // Get a list with the groups that can be added to the role using a Query Builder
                const groupOutsideRole: AvailableEntitiesRole[] = await AppDataSource
                    .getRepository(Group)
                    .createQueryBuilder(`group`)
                    .select([
                        `group.id`,
                        `group.name`
                    ])
                    .where(`group.id NOT IN (:...id)`, { id: queriedEntities })
                    .andWhere(`group.organizationId = :organization`, { organization: organizationRole })
                    .getMany()
                    // After the results were found, then add the property entity to each object to match the AvailableEntitiesRole type
                    .then((groupList) => groupList.flatMap((group) => Object.assign(group, { entity: `Group` })))

                // Create a roleAvailableAdditions constant and assign it the values from the people and groups that can be added to the role
                const roleAvailableAdditions: AvailableEntitiesRole[] = peopleOutsideRole.concat(groupOutsideRole)

                // Return a personalized success schema in JSON format with the OK (200) status - SUCCESS
                return res
                    .status(200)
                    .json({
                        name: `ListSuccessfullyRetrieved`,
                        message: `The list of the people and groups available to be added to the role was retrieved successfully`,
                        info: roleAvailableAdditions
                    })

            }

            // Return statement that will be executed after an error was detected while finding a role
            return

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
}