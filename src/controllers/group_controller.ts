import { Request, Response } from 'express'
import { Workspace } from '../entities/Workspace'
import { AppDataSource } from '../database/connection'
import { Group } from '../entities/Group'
import { Organization } from '../entities/Organization'
import { CapitalizeString } from './libs/string_manipulation'
import { Role } from '../entities/Role'
import { EntityManager, QueryRunner } from 'typeorm'
import { User } from '../entities/User'
import { Person } from '../entities/Person'
import { Permission } from '../entities/Permission'
import { Group_Forms_Person as GroupFormsPerson, Group_Forms_Person } from '../entities/Group_Forms_Person'
import { PermissionRule } from './libs/type_definition'
import { orderByAttribute } from './libs/function_definition'
import { CustomError } from './libs/instance_definition'


export default class GroupController {

    // Function to get a list with the names of the group of a specific organization for the filter
    static ListGroupsByName = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the name of the organization from the value set on the filter
            const { organization } = req.body

            // Use a Query Builder to get the id of the submitted organization
            const organizationInfo: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .select(`organization.id`)
                .where(`organization.name = :name`, { name: organization })
                .getOne()

            // Verify if the organizationInfo object is empty, and if that's true, then return the NO CONTENT (204) status
            if (!organizationInfo) return res
                .sendStatus(400)


            // Use a Query Builder to get the name of each group
            const groupsNames: Group[] | undefined = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .select(`group.name`)
                .where(`group.organizationId = :organization`, { organization: organizationInfo.id })
                .orderBy(`group.name`, `ASC`)
                .getMany()

            // Return the names of the groups in JSON format with the OK (200) status
            if (typeof groupsNames !== `undefined` && groupsNames.length > 0) return res
                .status(200)
                .json(groupsNames)

            // Return the NO CONTENT (204) status
            return res
                .sendStatus(204)

        } catch (error) {

            // Return an error message in JSON format with the INTERNAL SERVER ERROR (500) status
            if (error instanceof Error) return res
                .status(500)
                .json({ message: error.message })

            // Return the INTERNAL SERVER ERROR (500) status
            return res
                .sendStatus(500)

        }

    }

    // Function to list the registered people types from the database but paginated
    static ListGroupsPaginated = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the page value from the URL
            const {
                page,
                itemsPerPage
            } = req.query

             //Get organization id of the user
             const { organizationId } = req.headers;

            // Validation to check if it isn't a valid page, and if it isn't valid, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!page || typeof page !== `string` || Array.isArray(page) || /[^0-9]/g.test(page)) return res
                .status(400)
                .json({ message: `The page number ${page} doesn't exist` })

            //Check if the page exists and if its not any onther value than a number
            if (!itemsPerPage || typeof itemsPerPage !== `string` || Array.isArray(itemsPerPage) || /[^0-9]/gi.test(itemsPerPage)) return res
                .status(400)
                .json({ message: `The page size ${itemsPerPage} doesn't exist` })

            const amountValues: number = parseInt(itemsPerPage)

            // Create a skipValue for the pagination
            const skipValue = parseInt(page) * amountValues - amountValues

            // Query to know the total amount of people types
            const GroupCount : number = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .leftJoinAndSelect(`group.organizationId`, `organization`)
                .where(`organization.id = :id`, { id: organizationId})
                .getCount()

             //Validate if the current session has the organizationId
             if(!organizationId){
                 throw new CustomError({
                     name:`Organization not found`,
                     message: `The user doesn't belong to any organization`,
                     statusCode: 404
                    })
             }


            //Get the groups of the organization

            //Due that it's needed to show the select options (person/roles), even if they are no related to the group.
            //The folowing query bring all roles, persons and groups of the users's organization, then for each group 
            //Te optinos are associated with the attribute 'active' to know if its related to the group

            const group = await AppDataSource
            .getRepository(Organization)
            .createQueryBuilder(`organization`)
            //Options
            .leftJoinAndSelect(`organization.rolesIds`, `roles`)
            .leftJoinAndSelect(`organization.peopleIds`, `people`)
            //groups info
            .leftJoinAndSelect(`organization.groupsIds`, `groups`)
            .leftJoinAndSelect(`groups.groupLinksRole`, `groupRoles`)
            .leftJoinAndSelect(`groups.groupFormsPerson`, `members`)
            .leftJoinAndSelect(`members.personId`, `persons`)
            .select(
                [
                    `organization.id`,
                    `roles.id`,
                    `roles.name`,
                    `roles.status`,
                    `people.id`,
                    `people.firstName`,
                    `people.lastName`,
                    `groups`,
                    `groupRoles`,
                    `members`,
                    `persons`
                ]
            )
            .where(`organization.id = :id`, { id: organizationId })
            .andWhere(`roles.status = :status`, { status: true })
            .skip(skipValue)
            .take(amountValues)
            .getOne()
            .then(data => {
                //Get the list of the groups from the profiels
                let groups: any[] = []

                data?.groupsIds.map(group => {
                    //Add element to the groups array
                    groups = [...groups,
                        {
                            id: group.id,
                            name: group.name,
                            description: group.description,
                            type: group.type,
                            roles: data?.rolesIds.map(roleItem => {
                                //Search for associated and available roles
                                return {
                                    id: roleItem.id,
                                    name: roleItem.name,
                                    //Validate if the group has the role
                                    active: group.groupLinksRole.some(groupItem => groupItem.id === roleItem.id)
                                }
                            }),
                            people: data?.peopleIds.map(personItem => {
                                //Search for associated and available roles
                                return {
                                    id: personItem.id,
                                    name: `${personItem.firstName} ${personItem.lastName}`,
                                    //status: personItem.status,
                                    //Validate if the group has the role
                                    active: group.groupFormsPerson.some(groupItem => groupItem.personIdRelation === personItem.id)
                                }
                            }),
                            members: data?.peopleIds.map(personItem =>{
                                return group.groupFormsPerson.some(groupItem => groupItem.personIdRelation === personItem.id)
                            }).filter((person:any) => person === true).length


                        } 
                    ]
                })

                //Sort alphabetically
                return groups.sort((a, b) => {
                    a = a.name.toLowerCase();
                    b = b.name.toLowerCase();
                    return orderByAttribute(a, b)
                })
            })


            // Build a response that will be sent to the front page
            const response: object = {
                info: {
                    itemsCount: group.length,
                    totalItemsCount: GroupCount,
                    nextPage: parseInt(page) * amountValues >= GroupCount,
                    previousPage: page
                },
                data: group
            }

            // Return the people types paginated list in JSON format with the OK (200) status
            return res
                .status(200)
                .json(response)

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

    // Function to create a new group
    static CreateNewGroup = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the name and the description of the group from the body
            const { name, description } = req.body

             //Get organization id of the user
             const {organizationId} = req.headers;

            const verifyOrganization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where(`organization.id = :id`, { id: organizationId })
                .getOne()

            if (!verifyOrganization) return res
                .status(404)
                .json({ message: `It doesn't exist an organization with the submitted name` })

            //Creane a new Group object
            const group = Group.create({
                name: name,
                description: description,
                organizationId: verifyOrganization
            })

            // Insert the created group object into the database
            await AppDataSource
                .createQueryBuilder()
                .insert()
                .into(Group)
                .values(group)
                .execute()
            //response with status 200
            return res
            .status(200)
            .json({message: 'Group created'})

        } catch (error) {

            // Return an error message in JSON format with the INTERNAL SERVER ERROR (500) status
            if (error instanceof Error) return res
                .status(500)
                .json({ message: error.message })

            // Return the INTERNAL SERVER ERROR (500) status
            return res
                .sendStatus(500)

        }
    }

    //function to update a group
    static UpdateGroup = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the value of the id from the parameter within the URL
            const {id} = req.query

            // Get the values of name and description from the body
            const {
                name,
                description
            } = req.body

            // If a name wasn't submitted, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!name) return res
                .status(400)
                .json({ message: `The name field is required to edit a group. It can't be empty` })

            // Create a Query Builder to check if there is a group whose id is the one submitted
            const verifyGroup = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .where(`group.id = :id`, { id: id as string })
                .getOne()

            // If it doesn't exist a group with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!verifyGroup) return res
                .status(404)
                .json({ message: `The group with id '${id}' doesn't exist` })

            // Update the attributes of the selected group into the database using a Query Builder
            await AppDataSource
                .createQueryBuilder()
                .update(Group)
                .set({ name: name, description: description })
                .where(`id = :id`, { id: verifyGroup.id })
                .execute()

            // Return the (200) status
            return res
                .status(200)
                .json({ message: `Updated correctly` })

        } catch (error) {
            // Return an error message in JSON format with the INTERNAL SERVER ERROR (500) status
            if (error instanceof Error) return res
               .status(500)
               .json({ message: error.message })
            // Return the INTERNAL SERVER ERROR (500) status
            return res
            .sendStatus(500)

        }
    }

    //Function to delete a group
    static DeleteGroup = async (req: Request, res: Response) => {
        // Error Handling
        try {
            //Get group id from the query params
            const {id} = req.query

            //Validate if the id const its not empty
            if(!id) return res.status(400).json({message: 'The id is required'})

            //Return the group from the database
            const group = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .where(`group.id = :id`, { id: id })
                .getOne()

            //if the group does not exist, then return the BAD REQUEST (400) status
            if(!group) return res.status(400).json({message: `The group with id ${id} does not exist`})

            //Check if the group is related with any workspace
            const groupWorkspace: Group | null = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .innerJoinAndSelect('group.groupSharesWorkspace', `groupWorkspace`)
                .select([
                    `group.id`,
                    `group.name`,
                    `groupWorkspace.id`,
                    `groupWorkspace.name`
                ])
                .where('group.id = :id', {id: id})
                .getOne()
            // if does have any relation with at least one workspace then return the (200) status for group that cannot be deleted
            if(groupWorkspace) return res
                .status(200).json({message: `The selected group cannot be deleted because it has been used in the ${groupWorkspace.groupSharesWorkspace[0].name} workspace`})

            //Delete group from data base
            await AppDataSource
            .createQueryBuilder()
            .delete()
            .from(GroupFormsPerson)
            .where(`groupId = :groupId`, { groupId: id })
            .execute()


            //Delete group from data base
            await AppDataSource
                .createQueryBuilder()
                .delete()
                .from(Group)
                .where(`id = :id`, { id: id })
                .execute()

            // Return the (200) status finished correclty
            return res
            .status(200)
            .json({message: 'The group has been successfully deleted'})

        } catch (error) {

            // Return an error message in JSON format with the INTERNAL SERVER ERROR (500) status
            if (error instanceof Error) return res.status(500).json({ message: error.message })

            // Return the INTERNAL SERVER ERROR (500) status
            return res.status(500).json({ message: "Unknow" })

        }
    }

    //Function to add or remove roles to a specific group
    static ManageRolesToGroup =async (req: Request, res: Response) => {
        try
        {
            //Get groupId and roloes
            const {groupId,oldValues, newValues} = req.body

            //Get organization id of the user
            const {organizationId} = req.headers;

            if(!organizationId){
                throw new CustomError({
                    name:`MISSING ORGANIZATION`,
                    message: `the current session has no organization`,
                    statusCode: 404
                   })
            }

            // Check if there is a group whose id is contained in the organization groups
            const verifyGroup: Group | null = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .where(`group.id = :id`, { id: groupId })
                .andWhere(`group.organizationId = :organization`, { organization: organizationId })
                .getOne()

            // If a group with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyGroup)
            {
                throw new CustomError({
                    name:`GROUP NOT FOUND`,
                    message: `The group  selected doesn't exist within the platform`,
                    statusCode: 400
                   })
            }

            //Delete roles related to the group

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

                //Get organization roles
                let rolesAdd : Role[] = []
                let rolesRemove : Role[] = []

                //Get as entities to use on the many to many table
                await AppDataSource
                    .getRepository(Role)
                    .createQueryBuilder(`roles`)
                    .where(`roles.organizationId = :organizationId`, { organizationId: organizationId })
                    .getMany()
                    .then(res =>{
                        res.map(role =>{

                            if(oldValues.includes(role.id))
                            {
                                rolesRemove = [...rolesRemove, role]
                            }

                            if(newValues.includes(role.id))
                            {
                                rolesAdd = [...rolesAdd, role]
                            }
                        })
                    })


                //Delete current assigned roles
                if (rolesRemove.length) {

                    await databaseOperations
                    .createQueryBuilder()
                    .relation(Group, `groupLinksRole`)
                    .of(verifyGroup)
                    .remove(rolesRemove)
                }

                //Add new roles selected by the user
                if (rolesAdd.length) {

                     await databaseOperations
                         .createQueryBuilder()
                         .relation(Group, `groupLinksRole`)
                         .of(verifyGroup)
                         .add(rolesAdd)
                 }

                 // Commit the operations from the transaction into the database
                 await queryRunner.commitTransaction()

                 // Ends the connection made by the child source to the database
                 await queryRunner.release()

                 // Return a success message in JSON format with the OK (200) status - SUCCESS

                 return res
                     .status(200)
                     .json({
                         name: `Successfully!`,
                         message: `Roles were updated on group ${verifyGroup.name}`,
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

        }
        catch (error){
             //If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - EXPECTED ERROR
             if (error instanceof Error) return res
             .status(error instanceof CustomError ? error.statusCode || 500 : 500)
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

    //Function to add or remove roles to a specific group
    static ManageMembersToGroup =async (req: Request, res: Response) => {
        try
        {
            //Get groupId and roloes
            const {groupId,oldValues, newValues} = req.body

            //Get organization id of the user
            const {organizationId} = req.headers;

            if(!organizationId){
                throw new CustomError({
                    name:`MISSING ORGANIZATION`,
                    message: `the current session has no organization`,
                    statusCode: 404
                   })
            }

            // Check if there is a group whose id is contained in the organization groups
            const verifyGroup: Group | null = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .where(`group.id = :id`, { id: groupId })
                .andWhere(`group.organizationId = :organization`, { organization: organizationId })
                .getOne()

            // If a group with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyGroup)
            {
                throw new CustomError({
                    name:`GROUP NOT FOUND`,
                    message: `The group  selected doesn't exist within the platform`,
                    statusCode: 400
                   })
            }

            //Delete roles related to the group

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

                //Get organization roles
                let membersAdd : Person[] = []
                let membersRemove : Person[] = []

                //Get as entities to use on the many to many table
                await AppDataSource
                    .getRepository(Person)
                    .createQueryBuilder(`person`)
                    .where(`person.organizationId = :organizationId`, { organizationId: organizationId })
                    .getMany()
                    .then(res =>{
                        res.map(role =>{

                            if(oldValues.includes(role.id))
                            {
                                membersRemove = [...membersRemove, role]
                            }

                            if(newValues.includes(role.id))
                            {
                                membersAdd = [...membersAdd, role]
                            }
                        })
                    })


                //Delete current assigned roles
                if (membersRemove.length) {

                    await databaseOperations
                        .createQueryBuilder()
                        .delete()
                        .from(Group_Forms_Person)
                        .where(`groupId.id = :groupId`, { groupId: verifyGroup.id })
                        .andWhere(`personId.id IN (:...personId)`, { personId: membersRemove.map(member => member.id) })
                        .execute()
                }

                //Add new roles selected by the user
                if (membersAdd.length) {

                    const rem:Group_Forms_Person[] = membersAdd.map((member) => {
                        return Group_Forms_Person.create({
                            groupId: verifyGroup,
                            personId: member
                        })
                    }) 

                    await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(Group_Forms_Person)
                    .values(rem)
                    .execute()
                 }

                 // Commit the operations from the transaction into the database
                 await queryRunner.commitTransaction()

                 // Ends the connection made by the child source to the database
                 await queryRunner.release()

                 // Return a success message in JSON format with the OK (200) status - SUCCESS

                 return res
                     .status(200)
                     .json({
                         name: `Successfully!`,
                         message: `Members were updated on group ${verifyGroup.name}`,
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

        }
        catch (error){
             //If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - EXPECTED ERROR
             if (error instanceof Error) return res
             .status(error instanceof CustomError ? error.statusCode || 500 : 500)
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
    
    //#region RoleAssignToGroup - RoleUnassignToGroup Maybe deprecated -JC
    // Function to assign a role to a group
    // static RoleAssignToGroup = async (req: Request, res: Response) => {

    //     // Error Handling for the method
    //     try {

    //         // Get the attributes for role and group from the body of the request
    //         const {
    //             role,
    //             group,
    //             organization
    //         } = req.body

    //         // Check if there is an organization whose name is the same as the one received using a Query Builder
    //         const verifyOrganization: Organization | null = await AppDataSource
    //             .getRepository(Organization)
    //             .createQueryBuilder(`organization`)
    //             .where(`organization.name = :organization`, { organization: organization })
    //             .getOne()

    //         // If an organization with that name doesn't exist, then return an error message in JSON format with the NOT FOUND (404) status
    //         if (!verifyOrganization) return res
    //             .status(404)
    //             .json({
    //                 name: `ORGANIZATION NOT FOUND`,
    //                 message: `The organization named ${organization} doesn't exist within the platform`,
    //                 info: `No additional info provided`
    //             })

    //         // Format the name of the role to match the required style
    //         const roleName: string = CapitalizeString(role.trim())

    //         // Check if there is a role whose name is the same as the one received using a Query Builder
    //         const verifyRole: Role | null = await AppDataSource
    //             .getRepository(Role)
    //             .createQueryBuilder(`role`)
    //             .where(`role.name = :name`, { name: roleName })
    //             .andWhere(`role.organizationId = :organization`, { organization: verifyOrganization.id })
    //             .getOne()

    //         // If a role with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
    //         if (!verifyRole) return res
    //             .status(400)
    //             .json({
    //                 name: `PROFILE NOT FOUND`,
    //                 message: `The role named ${roleName} doesn't exist within the platform`,
    //                 info: `No additional info provided`
    //             })

    //         // Format the name of the group to match the required style
    //         const groupName: string = CapitalizeString(group.trim())

    //         // Check if there is a group whose name is the same as the one received using a Query Builder
    //         const verifyGroup: Group | null = await AppDataSource
    //             .getRepository(Group)
    //             .createQueryBuilder(`group`)
    //             .where(`group.name = :name`, { name: groupName })
    //             .andWhere(`group.organizationId = :organization`, { organization: verifyOrganization.id })
    //             .getOne()

    //         // If a group with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
    //         if (!verifyGroup) return res
    //             .status(400)
    //             .json({
    //                 name: `GROUP NOT FOUND`,
    //                 message: `The group named ${groupName} doesn't exist within the platform`,
    //                 info: `No additional info provided`
    //             })

    //         // Check if the selected role and group are already linked within the platform using a Query Builder
    //         const checkExistingAssign: Group | null = await AppDataSource
    //             .getRepository(Group)
    //             .createQueryBuilder(`group`)
    //             .leftJoinAndSelect(`group.groupLinksRole`, `groupRole`)
    //             .where(`group.id = :groupId`, { groupId: verifyGroup.id })
    //             .andWhere(`groupRole.id = :roleId`, { roleId: verifyRole.id })
    //             .getOne()

    //         // If the role is already assigned to the group, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
    //         if (checkExistingAssign) return res
    //             .status(409)
    //             .json({
    //                 name: `GROUP AND PROFILE ARE ALREADY LINKED`,
    //                 message: `The selected group and role are already linked within the platform`,
    //                 info: `No additional info provided`
    //             })

    //         // Create a child from the main database source
    //         const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

    //         // Initialize the database connection through the child source
    //         await queryRunner.connect()

    //         // Create a transaction that will be executed using the child source
    //         await queryRunner.startTransaction()

    //         // Check if the transaction gets an error while processing data
    //         try {

    //             // Create a shortcut to call the operations from the child source
    //             const databaseOperations: EntityManager = queryRunner.manager

    //             // Insert the relation between the role and the group into the database using a Query Builder
    //             await databaseOperations
    //                 .createQueryBuilder()
    //                 .relation(Group, `groupLinksRole`)
    //                 .of(verifyGroup)
    //                 .add(verifyRole)

    //             // Commit the operations from the transaction into the database
    //             await queryRunner.commitTransaction()

    //             // Ends the connection made by the child source to the database
    //             await queryRunner.release()

    //             // Return a success message in JSON format with the CREATED (201) status - SUCCESS
    //             return res
    //                 .status(201)
    //                 .json({
    //                     name: `PROFILE ASSIGNED TO GROUP`,
    //                     message: `The ${verifyRole.name} role was assigned to the ${verifyGroup.name} group`,
    //                     info: `Not additional info provided`
    //                 })

    //         } catch (error) {

    //             // Undo the changes made by the transaction if an error happened
    //             await queryRunner.rollbackTransaction()

    //             // Ends the connection made by the child source to the database
    //             await queryRunner.release()

    //             // If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 2
    //             if (error instanceof Error) return res
    //                 .status(500)
    //                 .json({
    //                     name: error.name,
    //                     message: error.message,
    //                     info: error.stack || `No additional info provided`
    //                 })

    //             // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 3
    //             return res
    //                 .status(500)
    //                 .json({
    //                     name: `Unknown`,
    //                     message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
    //                     info: error
    //                 })

    //         }

    //     } catch (error) {

    //         // If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 2
    //         if (error instanceof Error) return res
    //             .status(500)
    //             .json({
    //                 name: error.name,
    //                 message: error.message,
    //                 info: error.stack || `No additional info provided`
    //             })

    //         // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 3
    //         return res
    //             .status(500)
    //             .json({
    //                 name: `Unknown`,
    //                 message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
    //                 info: error
    //             })

    //     }

    // }

    // Function to unassign a role from a group
    // static RoleUnassignToGroup = async (req: Request, res: Response) => {

    //     // Error Handling for the method
    //     try {

    //         // Get the attributes for role and group from the body of the request
    //         const {
    //             role,
    //             group,
    //             organization
    //         } = req.body

    //         // Check if there is an organization whose name is the same as the one received using a Query Builder
    //         const verifyOrganization: Organization | null = await AppDataSource
    //             .getRepository(Organization)
    //             .createQueryBuilder(`organization`)
    //             .where(`organization.name = :organization`, { organization: organization })
    //             .getOne()

    //         // If an organization with that name doesn't exist, then return an error message in JSON format with the NOT FOUND (404) status
    //         if (!verifyOrganization) return res
    //             .status(404)
    //             .json({
    //                 name: `ORGANIZATION NOT FOUND`,
    //                 message: `The organization named ${organization} doesn't exist within the platform`,
    //                 info: `No additional info provided`
    //             })

    //         // Format the name of the role to match the required style
    //         const roleName: string = CapitalizeString(role.trim())

    //         // Check if there is a role whose name is the same as the one received using a Query Builder
    //         const verifyRole: Role | null = await AppDataSource
    //             .getRepository(Role)
    //             .createQueryBuilder(`role`)
    //             .where(`role.name = :name`, { name: roleName })
    //             .andWhere(`role.organizationId = :organization`, { organization: verifyOrganization.id })
    //             .getOne()

    //         // If a role with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
    //         if (!verifyRole) return res
    //             .status(400)
    //             .json({
    //                 name: `PROFILE NOT FOUND`,
    //                 message: `The role named ${roleName} doesn't exist within the platform`,
    //                 info: `No additional info provided`
    //             })

    //         // Format the name of the group to match the required style
    //         const groupName: string = CapitalizeString(group.trim())

    //         // Check if there is a group whose name is the same as the one received using a Query Builder
    //         const verifyGroup: Group | null = await AppDataSource
    //             .getRepository(Group)
    //             .createQueryBuilder(`group`)
    //             .where(`group.name = :name`, { name: groupName })
    //             .andWhere(`group.organizationId = :organization`, { organization: verifyOrganization.id })
    //             .getOne()

    //         // If a group with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
    //         if (!verifyGroup) return res
    //             .status(400)
    //             .json({
    //                 name: `GROUP NOT FOUND`,
    //                 message: `The group named ${groupName} doesn't exist within the platform`,
    //                 info: `No additional info provided`
    //             })

    //         // Check if the selected role and group are already linked within the platform using a Query Builder
    //         const checkExistingAssign: Group | null = await AppDataSource
    //             .getRepository(Group)
    //             .createQueryBuilder(`group`)
    //             .leftJoinAndSelect(`group.groupLinksRole`, `groupRole`)
    //             .where(`group.id = :groupId`, { groupId: verifyGroup.id })
    //             .andWhere(`groupRole.id = :roleId`, { roleId: verifyRole.id })
    //             .getOne()

    //         // If the role is not assigned to the group, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
    //         if (!checkExistingAssign) return res
    //             .status(400)
    //             .json({
    //                 name: `GROUP AND PROFILE ARE NOT LINKED`,
    //                 message: `The selected group and role are not linked within the platform`,
    //                 info: `No additional info provided`
    //             })

    //         // Create a child from the main database source
    //         const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

    //         // Initialize the database connection through the child source
    //         await queryRunner.connect()

    //         // Create a transaction that will be executed using the child source
    //         await queryRunner.startTransaction()

    //         // Check if the transaction gets an error while processing data
    //         try {

    //             // Create a shortcut to call the operations from the child source
    //             const databaseOperations: EntityManager = queryRunner.manager

    //             // Delete the relation between the role and the group into the database using a Query Builder
    //             await databaseOperations
    //                 .createQueryBuilder()
    //                 .relation(Group, `groupLinksRole`)
    //                 .of(verifyGroup)
    //                 .remove(verifyRole)

    //             // Commit the operations from the transaction into the database
    //             await queryRunner.commitTransaction()

    //             // Ends the connection made by the child source to the database
    //             await queryRunner.release()

    //             // Return a success message in JSON format with the OK (200) status - SUCCESS
    //             return res
    //                 .status(200)
    //                 .json({
    //                     name: `PROFILE UNASSIGNED TO GROUP`,
    //                     message: `The ${verifyRole.name} role was unassigned of the ${verifyGroup.name} group`,
    //                     info: `No additional info provided`
    //                 })

    //         } catch (error) {

    //             // Undo the changes made by the transaction if an error happened
    //             await queryRunner.rollbackTransaction()

    //             // Ends the connection made by the child source to the database
    //             await queryRunner.release()

    //             // If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 2
    //             if (error instanceof Error) return res
    //                 .status(500)
    //                 .json({
    //                     name: error.name,
    //                     message: error.message,
    //                     info: error.stack || `No additional info provided`
    //                 })

    //             // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 3
    //             return res
    //                 .status(500)
    //                 .json({
    //                     name: `Unknown`,
    //                     message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
    //                     info: error
    //                 })

    //         }

    //     } catch (error) {

    //         // If the error is detected without any issues, then return a personalized error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 2
    //         if (error instanceof Error) return res
    //             .status(500)
    //             .json({
    //                 name: error.name,
    //                 message: error.message,
    //                 info: error.stack || `No additional info provided`
    //             })

    //         // Return a default error schema in JSON format with the INTERNAL SERVER ERROR (500) status - ERROR LEVEL 3
    //         return res
    //             .status(500)
    //             .json({
    //                 name: `Unknown`,
    //                 message: `An unexpected error was detected. Report it to the owner of the platform to solve it as soon as possible`,
    //                 info: error
    //             })

    //     }

    // }

    //#endregion

    // Function to assign a person to a group
    static PersonAssignToGroup = async (req: Request, res: Response) => {


        // Error Handling for the method
        try {

            // Get the attributes for user and group from the body of the request
            const {
                user,
                group
            } = req.body

            // Check if there is a person linked to a user with the same email submitted with the request using a Query Builder
            const verifyPerson: Person[] | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .where(`person.id IN (:...id)`, { id: user.flatMap((id: any) => {
                    return id
                }) })
                .getMany()


            // If a person linked to the user with that email doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (verifyPerson == null || verifyPerson.length == 0 || verifyPerson.length != user.length) return res
                .status(400)
                .json({
                    name: `PERSON NOT FOUND`,
                    message: `The person linked to the user with email ${user} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if there is a group whose name is the same as the one received using a Query Builder
            const verifyGroup: Group | null = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .where(`group.id = :id`, { id: group })
                .getOne()

            // If a group with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyGroup) return res
                .status(400)
                .json({
                    name: `GROUP NOT FOUND`,
                    message: `The group doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if the selected person and group are already linked within the platform using a Query Builder
            const checkExistingAssign: Group | null = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .leftJoinAndSelect(`group.groupFormsPerson`, `groupPerson`)
                .leftJoinAndSelect(`groupPerson.personId`, `person`)
                .where(`group.id = :groupId`, { groupId: verifyGroup.id })
                .andWhere(`person.id IN (:...personId)`, { personId: verifyPerson.flatMap((person: any) => {
                    return person.id
                }) })
                .getOne()



            // If the person is already assigned to the group, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (checkExistingAssign) return res
                .status(409)
                .json({
                    name: `GROUP AND PERSON ARE ALREADY LINKED`,
                    message: `The selected group and person are already linked within the platform`,
                    info: `No additional info provided`
                })
                console.log(verifyPerson);


                if (verifyPerson) {
                    for (let personitem = 0; personitem < verifyPerson.length; personitem++) {
                        // Create an object to relate a group with a person
                        const groupFormsPerson: GroupFormsPerson = GroupFormsPerson.create({
                            groupId: verifyGroup,
                            personId: verifyPerson[personitem]
                        })
                        // Store the relation into the database using a Query Builder
                        await AppDataSource
                            .createQueryBuilder()
                            .insert()
                            .into(GroupFormsPerson)
                            .values(groupFormsPerson)
                            .execute()
                    }
                }


                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `PERSON ASSIGNED TO GROUP`,
                        message: `The persons were assigned to the ${verifyGroup.name} group correcly`,
                        info: `Not additional info provided`
                    })


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

    // Function to unassign a person from a group
    static PersonUnassignToGroup = async (req: Request, res: Response) => {

        try {

            // Get the attributes for user and group from the body of the request
            const {
                userid,
                group,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to unassign a person to a group, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`assign`, `Person`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to unassign a person to a group`,
                    info: `No additional info provided`
                })

            // Check if there is a person linked to the found user using a Query Builder
            const verifyPerson: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .where(`person.id = :id`, { id: userid })
                .getOne()

            // If a person linked to the user doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyPerson) return res
                .status(400)
                .json({
                    name: `PERSON NOT FOUND`,
                    message: `The person linked to the user with email ${userid} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Format the name of the group to match the required style
            const groupName: string = CapitalizeString(group.trim())

            // Check if there is a group whose name is the same as the one received using a Query Builder
            const verifyGroup: Group | null = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .where(`group.id = :id`, { id: group })
                .getOne()

            // If a group with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyGroup) return res
                .status(400)
                .json({
                    name: `GROUP NOT FOUND`,
                    message: `The group named ${groupName} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if the selected person and group are already linked within the platform using a Query Builder
            const checkExistingAssign: Group | null = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .leftJoinAndSelect(`group.groupFormsPerson`, `groupPerson`)
                .leftJoinAndSelect(`groupPerson.personId`, `person`)
                .where(`group.id = :groupId`, { groupId: verifyGroup.id })
                .andWhere(`person.id = :personId`, { personId: verifyPerson.id })
                .getOne()

            // If the person is not assigned to the group, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!checkExistingAssign) return res
                .status(400)
                .json({
                    name: `GROUP AND PERSON ARE NOT LINKED`,
                    message: `The selected group and person are not linked within the platform`,
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

                // Delete the relation between the person and the group into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .delete()
                    .from(GroupFormsPerson)
                    .where(`groupId = :groupId`, { groupId: verifyGroup.id })
                    .andWhere(`personId = :personId`, { personId: verifyPerson.id })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a success message in JSON format with the OK (200) status - SUCCESS
                return res
                    .status(200)
                    .json({
                        name: `PERSON UNASSIGNED TO GROUP`,
                        message: `${verifyPerson.firstName} was unassigned of the ${verifyGroup.name} group`,
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

    // Get a list of the available permissions for the user
    static GetGroupsOfUser = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the user attribute from the body of the request
            const { user } = req.body

            // Format the email of the user to match the required style
            const userEmail: string = user.trim().toLowerCase()

            // Check if there is a person linked to the found user using a Query Builder
            const verifyPerson: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoin(`person.userId`, `user`)
                .where(`user.email = :email`, { email: userEmail })
                .getOne()

            // If a person linked to the user doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyPerson) return res
                .status(400)
                .json({
                    name: `PERSON NOT FOUND`,
                    message: `The person linked to the user with email ${user} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Get the list of permissions for that person using a Relational Query Builder
            const personPermissions: Permission[] = await AppDataSource
                .createQueryBuilder()
                .relation(Person, `personGetsPermission`)
                .of(verifyPerson)
                .loadMany()

            // Create a variable to store a list with the available permissions for the person
            let permissionsList: Permission[] = personPermissions

            // Get the roles assigned to that person using a Relational Query Builder
            const personRoles: Role[] = await AppDataSource
                .createQueryBuilder()
                .relation(Person, `personAppointsRole`)
                .of(verifyPerson)
                .loadMany()

            // Create a variable to store a list with the available roles for the person
            let rolesList: Role[] = personRoles

            // Get a list with the groups that the person belongs to using a Query Builder
            const personGroups: Group[] = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .leftJoin(`group.groupFormsPerson`, `groupPerson`)
                .leftJoin(`groupPerson.personId`, `person`)
                .where(`person.id = :id`, { id: verifyPerson.id })
                .andWhere(`groupPerson.status = :status`, { status: true })
                .getMany()

            // Check if any group linked to the person exists within the platform, and if that's true, then continue with the nested methods
            if (personGroups.length > 0) {

                // Get a list with the roles assigned to the filtered groups using a Query Builder
                const groupsRoles: Role[] = await AppDataSource
                    .getRepository(Role)
                    .createQueryBuilder(`role`)
                    .leftJoin(`role.groupLinksRole`, `groupRole`)
                    .where(`groupRole.id IN (:...groupId)`, { groupId: personGroups.flatMap((group) => {
                        return group.id
                    }) })
                    .getMany()

                // Add the group roles to the roles list, unless they are already added within that list
                groupsRoles.forEach((groupRole) => {
                    if (!rolesList.some((role) => role.id === groupRole.id)) rolesList = [...rolesList, groupRole]
                })

            }

            // Check if the list of roles is not empty, and if that's true, then continue with the nested methods
            if (rolesList.length > 0) {

                // Get the list of permissions for the filtered roles using a Query Builder
                const rolesPermissions: Permission[] = await AppDataSource
                    .getRepository(Permission)
                    .createQueryBuilder(`permission`)
                    .leftJoin(`permission.roleCombinesPermission`, `rolePermission`)
                    .where(`rolePermission.id IN (:...roleId)`, { roleId: rolesList.flatMap((role) => {
                        return role.id
                    }) })
                    .getMany()

                // Add the permissions from the roles to the permissions list, unless they are already added within that list
                rolesPermissions.forEach((rolePermission) => {
                    if (!permissionsList.some((permission) => permission.id === rolePermission.id)) permissionsList = [...permissionsList, rolePermission]
                })

            }

            // Store the permissions found within a constant with a defined type to contain only the required parameters for CASL
            const permissionsFormated: PermissionRule[] = permissionsList.map((permission: Permission) => {
                const permissionAttributes: PermissionRule = {
                    action: permission.action,
                    subject: permission.subject,
                    fields: permission.fields,
                    conditions: permission.conditions,
                    inverted: permission.inverted,
                    reason: permission.reason
                }
                return permissionAttributes
            })

            // Return a success message in JSON format with the OK (200) status - SUCCESS
            return res
                .status(200)
                .json({
                    person: verifyPerson,
                    groups: personGroups,
                    roles: rolesList,
                    permissions: permissionsFormated
                })

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
    // Function to list the registered persons in a group from the database but paginated
    static ListPersonInGroupPaginated = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the page value from the URL
            const { page ,id } = req.query

            // Validation to check if it isn't a valid page, and if it isn't valid, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!page || typeof page !== `string` || Array.isArray(page) || /[^0-9]/g.test(page)) return res
                .status(400)
                .json({ message: `The page ${page} doesn't exist` })


            if (!id || typeof id !== `string` || Array.isArray(id)) return res
            .status(400)
            .json({ message: `The group with ${id} doesn't exist` })

            // Query to know the total amount of people types
            const GroupCount: number = await AppDataSource
            .getRepository(Person)
            .createQueryBuilder(`person`)
            .leftJoinAndSelect(`person.groupFormsPerson`,`groupformsperson`)
            .where(`groupformsperson.groupId = :id`, { id: id })
            .getCount()

            // Create a Query Builder to get the people types stored into the database using pagination
            const person: Person[] = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.groupFormsPerson`,`groupformsperson`)
                .select([
                    `person.id`,
                    `person.firstName`,
                ])
                .where(`groupformsperson.groupId = :id`, { id: id })
                .orderBy('person.firstName', 'ASC')
                .skip(parseInt(page) * 10 - 10)
                .take(10)
                .getMany()

            console.log("hola");

            // Build a response that will be sent to the front page
            const response: object = {
                info: {
                    itemsCount: person.length,
                    totalItemsCount: GroupCount,
                    nextPage: parseInt(page) * 10 >= GroupCount ? true : false,
                    previousPage: page
                },
                data: person
            }

            // Return the people types paginated list in JSON format with the OK (200) status
            return res
                .status(200)
                .json(response)

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
    // Function to list the registered persons in a group from the database but paginated
    static ListPeopleNotInGroup = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the page value from the URL
            const { id } = req.query


            if (!id || typeof id !== `string` || Array.isArray(id)) return res
            .status(400)
            .json({ message: `The group with ${id} doesn't exist` })

            // Create a Query Builder to get the people types stored into the database using pagination
            const person: Person[] = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.groupFormsPerson`,`groupformsperson`)
                .select([
                    `person.id`,
                    `person.firstName`
                ])
                .where(`groupformsperson.groupId = :id`, { id: id })
                .orderBy('person.firstName', 'ASC')
                .getMany()

            let nequery = AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .select([
                    `person.id`,
                    `person.firstName`,
                    `person.lastName`
                ])
                console.log(person.length);

                if (person.length != 0) {
                    nequery .where(`person.id NOT IN (:...id)`, { id: person.flatMap((singlePerson) => {
                        return singlePerson.id
                    }) })
                }
                const personNotInvolved: Person[] = await nequery
                .orderBy('person.firstName', 'ASC')
                .getMany()

            // Return the people types paginated list in JSON format with the OK (200) status
            return res
                .status(200)
                .json(personNotInvolved)

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