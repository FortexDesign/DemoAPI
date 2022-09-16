// Database Import
import { AppDataSource } from '../database/connection'

// Entities Import
import { Email } from '../entities/Email'
import { Group } from '../entities/Group'
import { Group_Forms_Person as GroupFormsPerson } from '../entities/Group_Forms_Person'
import { Invited } from '../entities/Invited'
import { Organization } from '../entities/Organization'
import { Permission } from '../entities/Permission'
import { Person } from '../entities/Person'
import { Person_Type as PersonType } from '../entities/Person_Type'
import { Role } from '../entities/Role'
import { User } from '../entities/User'
import { Telephone } from '../entities/Telephone'

// Lib Import
import { CapitalizeString } from './libs/string_manipulation'

// Modules Import
import AmazonSESController from './aws_ses_controller'
import bcryptjs from 'bcryptjs'
import {
    Request,
    Response
} from 'express'
import {
    EntityManager,
    QueryRunner
} from 'typeorm'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { Person_Interacts_Task } from '../entities/Person_Interacts_Task'
import { Project } from '../entities/Project'
import { stringify } from 'querystring'

export default class PeopleController {

    // Function to list the registered people from the database
    /*
    static ListPeopleAllAttributes = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get a list with the ID of the people registered in the database
            const idList = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .select(`person.id`)
                .getMany()

            // Initialize a variable to store the attributes of each person inside an array
            let peopleInfo: Array<any> = []

            // Loop through each person ID stored
            for (let cont = 0; cont < idList.length; cont++) {

                // Create a Query Builder to get all the attributes related to a person using its ID
                const person = await AppDataSource
                    .getRepository(Person)
                    .createQueryBuilder(`person`)
                    .leftJoinAndSelect(`person.userId`, `user`)
                    .leftJoinAndSelect(`person.personTypeId`, `personType`)
                    .leftJoinAndSelect(`person.emailsIds`, `email`)
                    .leftJoinAndSelect(`person.telephonesIds`, `telephone`)
                    .select([
                        `person.firstName`,
                        `person.lastName`,
                        `user.email`,
                        `user.image`,
                        `user.color`,
                        `personType.name`,
                        `email.email`,
                        `telephone.extension`,
                        `telephone.number`,
                        `person.id`,
                        `person.data`,
                        `user.createdAt`,
                        `user.lastUpdate`
                    ])
                    .where(`person.id = :id`, { id: idList[cont].id })
                    .getOne()

                // Add the person Object to the array
                peopleInfo.push(person)
                
            }

            // Return the people list with their attributes in JSON format with the OK (200) status
            return res
                .status(200)
                .json(peopleInfo)
                
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
    */

    // Function to list people using pagination and filters, if applicable
    static ListPeoplePaginated = async (req: Request, res: Response) => {
        
        // Error Handling
        try {

            // Get the values from the query that it's stored by the request
            const {
                page,
                itemsPerPage,
                userStatus,
                personType,
                organization,
                organizationGroup,
                groupStatus,
                groupRole
            } = req.query

            let keyChain: boolean = true

            //Check if the page exists and if its not any onther value than a number
            if (!page || typeof page !== `string` || Array.isArray(page) || /[^0-9]/gi.test(page)) return res
                .status(400)
                .json({ message: `The page number ${page} doesn't exist` })

            //Check if the page exists and if its not any onther value than a number
            if (!itemsPerPage || typeof itemsPerPage !== `string` || Array.isArray(itemsPerPage) || /[^0-9]/gi.test(itemsPerPage)) return res
                .status(400)
                .json({ message: `The page size ${itemsPerPage} doesn't exist` })

            //first set the initial query
            const filterQuery = AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.userId`, `user`)
                .leftJoinAndSelect(`person.personTypeId`, `personType`)
                .leftJoinAndSelect(`person.emailsIds`, `email`)
                .leftJoinAndSelect(`person.telephonesIds`, `telephone`)
                .leftJoinAndSelect(`person.groupFormsPerson`, `groupPerson`)
                .leftJoinAndSelect(`person.personAppointsRole`, `personRole`)
                .leftJoinAndSelect(`person.organizationId`, `organization`)
                .loadRelationCountAndMap(`person.personInteractsTask`, `person.personInteractsTask`)
                .select([
                    `person.firstName`,
                    `person.lastName`,
                    `user.email`,
                    `user.image`,
                    `user.color`,
                    `user.isActive`,
                    `personType.name`,
                    `email.email`,
                    `telephone.extension`,
                    `telephone.number`,
                    `person.data`,
                    `person.id`,
                    `user.createdAt`,
                    `user.lastUpdate`,
                    `organization.name`
                ])
                
            let filteredPeople: Person[] = []

            //Check if there is a user status filter value
            if (userStatus && keyChain) {

                //Validate that the status userStatus only entes with this options
                if (userStatus === `Active` || userStatus === `active` || userStatus === `Inactive` || userStatus === `inactive`) {
                    
                    //filter the ammount of users with the active filter
                    const getUsersInfo: User[] | null = await AppDataSource
                        .getRepository(User)
                        .createQueryBuilder(`user`)
                        .where(`user.isActive = :status`, { status: userStatus === `Active` || userStatus === `active` })
                        .getMany()

                    //Check that there is at least one
                    if (getUsersInfo && getUsersInfo.length > 0) {

                        //Filter perople by status
                        const filteredPeopleByUserStatus: Person[] | null = await filterQuery
                            .where(`person.userId IN (:...user)`, { user: getUsersInfo.flatMap((user) => user.id) })
                            .getMany()

                        //Check if the filter brings anything
                        if (filteredPeopleByUserStatus && filteredPeopleByUserStatus.length > 0) {
                            filteredPeople = filteredPeople.length === 0
                                ? Array.from(filteredPeopleByUserStatus)
                                : filteredPeople.filter((personGlobal) => filteredPeopleByUserStatus.some((personLocal) => personGlobal.id === personLocal.id))
                        }

                    } else keyChain = false

                } else keyChain = false

            }

            //Check if there is a person type filter value
            if (personType && keyChain) {

                //Query the PersonType
                const getPersonTypeInfo: PersonType | null = await AppDataSource
                    .getRepository(PersonType)
                    .createQueryBuilder(`personType`)
                    .where(`personType.name = :name`, { name: personType })
                    .getOne()

                //Check that exists at least one
                if (getPersonTypeInfo) {

                    //Filter perople by personType
                    const filteredPeopleByPersonType: Person[] | null = await filterQuery
                        .where(`person.personTypeId = :personType`, { personType: getPersonTypeInfo.id })
                        .getMany()

                    //Check if the filter brings anything
                    if (filteredPeopleByPersonType && filteredPeopleByPersonType.length > 0)
                        filteredPeople = filteredPeople.length === 0
                            ? Array.from(filteredPeopleByPersonType)
                            : filteredPeople.filter((personGlobal) => filteredPeopleByPersonType.some((personLocal) => personGlobal.id === personLocal.id))

                } else keyChain = false

            }

            //Check if there is a organization filter value
            if (organization && keyChain) {

                //Query the Organization
                const getOrganizationInfo: Organization | null = await AppDataSource
                    .getRepository(Organization)
                    .createQueryBuilder(`organization`)
                    .where(`organization.name = :name`, { name: organization })
                    .getOne()

                // Check that the organization exists
                if (getOrganizationInfo) {

                    // Query the Groups from the organization
                    const getGroupsFromOrganization: Group[] | null = await AppDataSource
                        .getRepository(Group)
                        .createQueryBuilder(`group`)
                        .where(`group.organizationId = :organization`, { organization: getOrganizationInfo.id })
                        .getMany()

                    //Check that exists at least one group for the organization
                    if (getGroupsFromOrganization && getGroupsFromOrganization.length > 0) {

                        //Check if organizationGroup exists and if its name matches one from the GroupsFromOrganization list
                        if (organizationGroup && getGroupsFromOrganization.some((group) => group.name === organizationGroup)) {

                            // Get the group that matches the name received through the query
                            const filteredGroup: Group | undefined = getGroupsFromOrganization.find((group) => group.name === organizationGroup)
                            console.log(filteredGroup);
                            
                            // Verify that the group exists
                            if (typeof filteredGroup !== `undefined`) {

                                // Check if groupStatus and groupRole are not empty
                                if (groupStatus || groupRole) {

                                    // Check if groupStatus exists and keyChain is true
                                    if (groupStatus && keyChain) {
    
                                        // Verify if groupStatus matches one of these strings
                                        if (groupStatus === `Active` || groupStatus === `active` || groupStatus === `Inactive` || groupStatus === `inactive`) {

                                            // Get the people that belong to a specific group and have a specific status within that group
                                            const filteredPeopleByGroupStatus: Person[] | null = await filterQuery
                                                .where(`groupPerson.groupIdRelation = :group`, { group: filteredGroup.id })
                                                .andWhere(`groupPerson.status = :status`, { status: groupStatus === `Active` || groupStatus === `active` })
                                                .getMany()
                    
                                            // Check if any matches were found. If that's the case, then either store an array with the results if it hasn't been applied another filter or get the commmon results with the global filter list if a filter has been applied before 
                                            if (filteredPeopleByGroupStatus && filteredPeopleByGroupStatus.length > 0)
                                                filteredPeople = filteredPeople.length === 0
                                                    ? Array.from(filteredPeopleByGroupStatus)
                                                    : filteredPeople.filter((personGlobal) => filteredPeopleByGroupStatus.some((personLocal) => personGlobal.id === personLocal.id))

                                        } else keyChain = false
    
                                    }
    
                                    // Check if groupRole exists and keyChain is true
                                    if (groupRole && keyChain) {
    
                                        // Look out for the role sent with the query and that belongs to the organization
                                        const getRoleFromOrganization: Role | null = await AppDataSource
                                            .getRepository(Role)
                                            .createQueryBuilder(`role`)
                                            .where(`role.organizationId = :organization`, { organization: getOrganizationInfo.id })
                                            .andWhere(`role.name = :role`, { role: groupRole })
                                            .getOne()
    
                                        // Check if that role exists
                                        if (getRoleFromOrganization) {
                        
                                            // Get the roles that belong to the group sent by the query
                                            const getRolesLinkedGroup: Role[] | null = await AppDataSource
                                                .createQueryBuilder()
                                                .relation(Group, `groupLinksRole`)
                                                .of(filteredGroup)
                                                .loadMany()
                                            
                                            // Check if the groupRole is found within the groupRoles
                                            if (getRolesLinkedGroup && getRolesLinkedGroup.some((role) => role.name === groupRole)) {
                    
                                                // Get the people that belong to the group and have the same role as the one from the query value
                                                const filteredPeopleByGroupRole: Person[] | null = await filterQuery
                                                    .where(`groupPerson.groupIdRelation = :group`, { group: filteredGroup.id })
                                                    .andWhere(`personRole.name = :role`, { role: groupRole })
                                                    .getMany()
                    
                                                // Check if any matches were found. If that's the case, then either store an array with the results if it hasn't been applied another filter or get the commmon results with the global filter list if a filter has been applied before
                                                if (filteredPeopleByGroupRole && filteredPeopleByGroupRole.length > 0)
                                                    filteredPeople = filteredPeople.length === 0
                                                        ? Array.from(filteredPeopleByGroupRole)
                                                        : filteredPeople.filter((personGlobal) => filteredPeopleByGroupRole.some((personLocal) => personGlobal.id === personLocal.id))
                    
                                            } else keyChain = false
                    
                                        } else keyChain = false
    
                                    }
    
                                } else {
    
                                    // Get the people that belong to the group from the query that belongs to a specific organization
                                    const filteredPeopleByGroup: Person[] | null = await filterQuery
                                        .where(`groupPerson.groupIdRelation = :group`, { group: filteredGroup.id })
                                        .getMany()
    
                                    // Check if any matches were found. If that's the case, then either store an array with the results if it hasn't been applied another filter or get the commmon results with the global filter list if a filter has been applied before 
                                    if (filteredPeopleByGroup && filteredPeopleByGroup.length > 0)
                                        filteredPeople = filteredPeople.length === 0
                                            ? Array.from(filteredPeopleByGroup)
                                            : filteredPeople.filter((personGlobal) => filteredPeopleByGroup.some((personLocal) => personGlobal.id === personLocal.id))
    
                                }

                            } else keyChain = false
    
                        } else {
    
                            // Get the people that belong to a specific organization
                            const filteredPeopleByOrganization: Person[] | null = await filterQuery
                                .where(`groupPerson.groupIdRelation IN (:...group)`, { group: getGroupsFromOrganization.flatMap((group) => group.id) })
                                .getMany()

                            // Check if any matches were found. If that's the case, then either store an array with the results if it hasn't been applied another filter or get the commmon results with the global filter list if a filter has been applied before 
                            if (filteredPeopleByOrganization && filteredPeopleByOrganization.length > 0)
                                filteredPeople = filteredPeople.length === 0
                                    ? Array.from(filteredPeopleByOrganization)
                                    : filteredPeople.filter((personGlobal) => filteredPeopleByOrganization.some((personLocal) => personGlobal.id === personLocal.id))
    
                        }
                        
                    } else keyChain = false

                } else keyChain = false

            }

            const amountValues: number = parseInt(itemsPerPage)

            // Create a skipValue for the pagination
            const skipValue = parseInt(page) * amountValues - amountValues

            // Get the number of people to show in the list, based on if it was filtered or not
            const peopleCount: number = !keyChain ? 0 : filteredPeople.length > 0
                ? filteredPeople.length
                : await AppDataSource
                    .getRepository(Person)
                    .count()

            // Create a Query Builder to get all the attributes related to a person using its ID if it was filtered
            const people: Person[] | null = !keyChain ? [] : filteredPeople.length > 0
                ? await filterQuery
                    .where('person.id IN (:...id)', { id: filteredPeople.flatMap((person) => person.id) })
                    .orderBy('person.firstName', 'ASC')
                    .skip(skipValue)
                    .take(amountValues)
                    .getMany()
                : await filterQuery
                    .orderBy('person.firstName', 'ASC')
                    .skip(skipValue)
                    .take(amountValues)
                    .getMany()
            
            let orderedData: object[] = [];
            
            for (let num = 0; num < people.length; num++) {
                const countProjectPerson = await AppDataSource
                    .getRepository(Project)
                    .createQueryBuilder(`project`)
                    .leftJoinAndSelect(`project.tasksIds`, `tasks`)
                    .leftJoinAndSelect(`tasks.personInteractsTask`, `persontask`)
                    .where('persontask.personIdRelation = :id', { id: people[num].id })
                    .getCount()
                const singlePersonIteration = {
                    id: people[num].id,
                    firstName: people[num].firstName,
                    lastName: people[num].lastName,
                    data: people[num].data,
                    userId: people[num].userId,
                    personTypeId: people[num].personTypeId,
                    organizationId: people[num].organizationId,
                    emailsIds: people[num].emailsIds,
                    telephonesIds: people[num].telephonesIds,
                    countTasks: people[num].personInteractsTask,
                    countProjects: countProjectPerson
                }
                orderedData = [...orderedData, singlePersonIteration]
            }
            
            // Create a response variable to store the data obtained
            const response = {
                info: {
                    itemsCount: people.length,
                    totalItemsCount: peopleCount,
                    nextPage: parseInt(page) * amountValues >= peopleCount,
                    previousPage: page
                },
                data: orderedData
            }

            // Return the people list with their attributes in JSON format with the OK (200) status
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

    // Get Info from a Single Person based on its ID
    static GetPersonInfo = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the value of the id from the query of the request
            const { id } = req.query

            // Get the permissions attribute from the body of the request
            const { permissions } = req.body

            // Check if the logged user has the right permissions to list people, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`read`, `Person`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to see a list with the people`,
                    info: `No additional info provided`
                })

            // Create a Query Builder to get all the attributes related to a person using its ID to identify it
            const person = AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.userId`, `user`)
                .leftJoinAndSelect(`person.personTypeId`, `personType`)
                .leftJoinAndSelect(`person.emailsIds`, `email`)
                .leftJoinAndSelect(`person.telephonesIds`, `telephone`)
                .leftJoinAndSelect(`person.groupFormsPerson`, `groupPerson`)
                .leftJoinAndSelect(`person.personAppointsRole`, `personRole`)
                .select([
                    `person.firstName`,
                    `person.lastName`,
                    `user.email`,
                    `user.image`,
                    `user.color`,
                    `personType.name`,
                    `email.email`,
                    `telephone.extension`,
                    `telephone.number`,
                    `person.data`,
                    `person.id`,
                    `user.createdAt`,
                    `user.lastUpdate`
                ])
                .where(`person.id = :id`, { id: id })
                .getOne()

            // Verify if a match wasn't found to throw a NOT FOUND (404) status
            if (!person) return res
                .status(404)
                .json({ message: `Person Not Found` })

            // Create a response variable to store the data obtained
            const response = {
                data: person
            }

            // Return the response variable in JSON format with a OK (200) status
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

    // Function to add a person into the database
    static CreatePerson = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the values of user, person type, one or more emails, one or more telephones and additional info from the Create Person form
            const {
                firstName,
                lastName,
                user,
                personType,
                emails,
                telephones,
                additionalInfo,
                permissions,
                organization
            } = req.body
            
            // Check if the logged user has the right permissions to create a person, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`create`, `Person`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to create a person`,
                    info: `No additional info provided`
                })

            // Create a variable to store a default value
            const defaultValue: string = `Default`
            
            // If firstName doesn't have a value, then return an error message with the BAD REQUEST (400) status
            if (!firstName) return res
                .status(400)
                .json({ message: `A first name is required to create a person` })
            
            // If lastName doesn't have a value, then return an error message with the BAD REQUEST (400) status
            if (!lastName) return res
                .status(400)
                .json({ message: `A lastName is required to create a person` })
            
            // If user doesn't have a value, then return an error message with the BAD REQUEST (400) status
            if (!user) return res
                .status(400)
                .json({ message: `A user email is required to create a person` })
            
            // If personType doesn't have a value, then return an error message with the BAD REQUEST (400) status
            if (!personType) return res
                .status(400)
                .json({ message: `A person type is required to create a person` })

            // Create a Query Builder to check if there is a person type whose name is the one submitted within the form
            const verifyPersonType = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.name = :name`, { name: personType })
                .getOne()

            // If the person type with the submitted name doesn't exist, then return an error message in JSON format with the CONFLICT (409) status
            if (!verifyPersonType) return res
                .status(409)
                .json({ message: `The person type '${ personType }' doesn't exist` })

            // Generate a password for the new person
            const password: string = `F_${user}_${firstName}_46253`
            
            // Encrypt the generated password through bcryptjs
            const passHash: string = await bcryptjs.hash(password, 10)

            // Create a child from the main database source
            const queryRunner = AppDataSource.createQueryRunner()

            // Initialize the database connection through the child source
            await queryRunner.connect()

            // Create a transaction that will be executed using the child source
            await queryRunner.startTransaction()

            // Check if the transaction gets an error while processing data
            try {

                // Create a shortcut to call the operations from the child source
                const databaseOperations = queryRunner.manager

                // Create an object to store the attributes of the user
                const newUser = User.create({
                    email: user,
                    password: passHash
                })

                // Insert the created user object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(newUser)
                    .execute()

                // Create a Query Builder to check if the submitted user is already linked with another person from the platform
                const verifyPerson = await databaseOperations
                    .getRepository(Person)
                    .createQueryBuilder(`person`)
                    .where(`person.userId = :user`, { user: newUser.id })
                    .getOne()

                // If the user is already linked to other person, then return an error message in JSON format with the CONFLICT (409) status
                if (verifyPerson) {
                    await queryRunner.rollbackTransaction()
                    return res
                        .status(500)
                        .json({ message: `The user with email '${ user }' is already linked to other person` })
                }
                
                // Create an object to store the attributes of the person
                const person = Person.create({
                    userId: newUser,
                    personTypeId: verifyPersonType,
                    firstName: firstName,
                    lastName: lastName,
                    data: additionalInfo
                })

                // Insert the created person object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(Person)
                    .values(person)
                    .execute()
                

                // Check if the emails array has at least one email defined
                if (emails) {

                    // Set an array to store each submitted email as an Email object
                    let addEmail: QueryDeepPartialEntity<Email> | QueryDeepPartialEntity<Email>[] = []

                    // Loop through each submitted email
                    for (let cont = 0; cont < emails.length; cont++) {

                        // Verify if there is at least one email stored in the array, and if that's not true, check if that email is already registered into the Email object array
                        if (addEmail.length == 0 || addEmail.every((obj) => obj.email != emails[cont])) {
                            
                            // Add a new Email object to the Email object array that will contain the attributes from the initial array and the newly created person
                            addEmail.push(Email.create({
                                email: emails[cont],
                                personId: person
                            }))
                            
                        }

                    }

                    // Insert the Email objects from the addEmail array into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(Email)
                        .values(addEmail)
                        .execute()

                }

                // Check if the telephones array has at least one telephone defined
                if (telephones) {

                    // Set an array to store each submitted telephone as a Telephone object
                    let addTelephone: QueryDeepPartialEntity<Telephone> | QueryDeepPartialEntity<Telephone>[] = []

                    // Loop through each submitted telephone
                    for (let cont = 0; cont < telephones.length; cont++) {

                        // Verify if there is at least one telephone stored in the array, and if that's not true, check if that telephone is already registered into the Telephone object array
                        if (addTelephone.length == 0 || addTelephone.every((obj) => obj.number != telephones[cont].number || obj.extension != telephones[cont].extension)) {
                            
                            // Add a new Telephone object to the Telephone object array that will contain the attributes from the initial array and the newly created person
                            addTelephone.push(Telephone.create({
                                number: telephones[cont].number,
                                extension: telephones[cont].extension,
                                personId: person
                            }))

                        }

                    }

                    // Insert the Telephone objects from the addTelephone array into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(Telephone)
                        .values(addTelephone)
                        .execute()

                }
                let checkOrganization: Organization | null = null;

                if(!organization){
                // Set the name of the organization
                const organizationName: string = defaultValue

                // Set the domain of the organization
                const organizationDomain: string = `${defaultValue.toLowerCase()}.com`

                // Check if an organization with that name already exists
                checkOrganization = await databaseOperations
                    .getRepository(Organization)
                    .createQueryBuilder(`organization`)
                    .where(`organization.name = :name`, { name: organizationName })
                    .getOne()

                // If it doesn't exist, then continue with the next step
                if (!checkOrganization) {
                
                    // Check if an organization with that name already exists
                    checkOrganization = await databaseOperations
                        .getRepository(Organization)
                        .createQueryBuilder(`organization`)
                        .where(`organization.domain = :domain`, { domain: organizationDomain })
                        .getOne()

                }

                // If it doesn't exist, then continue with the next step
                if (!checkOrganization) {

                    // Create an object to store the attributes of the organization
                    checkOrganization = Organization.create({
                        name: organizationName,
                        domain: organizationDomain,
                        official: false
                    })

                    // Store the created organization into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(Organization)
                        .values(checkOrganization)
                        .execute()

                }
                }else{
                    // Check if an organization with that name already exists
                    checkOrganization = await databaseOperations
                    .getRepository(Organization)
                    .createQueryBuilder(`organization`)
                    .where(`organization.id = :id`, { id: organization })
                    .getOne()

                    
                }
                if (!checkOrganization) {
                    return res
                    .status(500)
                    .json({ message: `The organization does not exist` })
                }
                // Store the relation between person and group using a Relational Query Builder
                await databaseOperations
                .createQueryBuilder()
                .relation(Person, `organizationId`)
                .of(person)
                .set(checkOrganization)

                
                // Check if a group that belongs to the organization and has a specific name exists
                let group: Group | null = await databaseOperations
                    .getRepository(Group)
                    .createQueryBuilder(`group`)
                    .where(`group.organizationId = :organizationId`, { organizationId: checkOrganization.id })
                    .andWhere(`group.name = :name`, { name: defaultValue })
                    .getOne()

                let isNew: boolean = false
                
                // If it doesn't exist, then continue with the next step
                if (!group) {

                    // Create a group object with the required attributes
                    group = Group.create({
                        organizationId: checkOrganization,
                        name: defaultValue,
                        description: `This is a default group. Use it only to accept new members for your organization.`
                    })
                    
                    // Store the new group into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(Group)
                        .values(group)
                        .execute()

                    isNew = true

                }

                // Create an object to relate a group with a person
                const groupFormsPerson: GroupFormsPerson = GroupFormsPerson.create({
                    groupId: group,
                    personId: person
                })

                // Store the relation into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(GroupFormsPerson)
                    .values(groupFormsPerson)
                    .execute()

                // Check if a role with a specific name that belongs to a specific organization exists
                let role: Role | null = await databaseOperations
                    .getRepository(Role)
                    .createQueryBuilder(`role`)
                    .where(`role.organizationId = :organizationId`, { organizationId: checkOrganization.id })
                    .andWhere(`role.name = :name`, { name: defaultValue })
                    .getOne()

                // If it doesn't exist, then continue with the next step
                if (!role) {
                    
                    // Create an object to store the attributes for a role
                    role = Role.create({
                        organizationId: checkOrganization,
                        name: defaultValue,
                        description: `This is a default role. It doesn't have any permission.`
                    })
        
                    // Store the new role into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(Role)
                        .values(role)
                        .execute()

                    isNew = true

                }
                
                // Store the relation betweeen group and role using a Query Builder if one of them was created
                if (isNew) await databaseOperations
                    .createQueryBuilder()
                    .relation(Group, `groupLinksRole`)
                    .of(group)
                    .add(role)

                // Store the relation between person and role using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Person, `personAppointsRole`)
                    .of(person)
                    .add(role)
                
                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Send the verification email
                AmazonSESController.sendVerifyEmail(user)
                
                // Return the attributes of the new person in JSON format with the CREATED (201) status
                return res
                    .status(201)
                    .json({ message: `Successfully created!` })

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

    // Function to edit a person from the database
    static EditPerson = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the value of the id from the parameter within the URL
            const { id } = req.query

            // Get the values of user, person type, one or more emails, one or more telephones and additional info from the Edit Person form
            const {
                firstName,
                lastName,
                personType,
                emails,
                telephones,
                additionalInfo,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to edit a person, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`update`, `Person`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to edit a person`,
                    info: `No additional info provided`
                })

            //Check if the page exists and if its not any onther value than a number
            if (!id || typeof id !== `string` || Array.isArray(id)) return res
                .status(400)
                .json({ message: `The id ${ id } doesn't exist` })

            // If firstName doesn't have a value, then return an error message with the BAD REQUEST (400) status
            if (!firstName) return res
                .status(400)
                .json({ message: `A first name is required to edit a person` })
            
            // If lastName doesn't have a value, then return an error message with the BAD REQUEST (400) status
            if (!lastName) return res
                .status(400)
                .json({ message: `A lastName is required to edit a person` })
            
            // If person type doesn't have a value, then return an error message with the BAD REQUEST (400) status
            if (!personType) return res
                .status(400)
                .json({ message: `A person type is required to edit a person` })
            
            // Create a Query Builder to check if there is a person type whose name is the one submitted within the form
            const verifyPersonType = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.name = :name`, { name: personType })
                .getOne()

            // If the person type with the submitted name is not registered yet, and it isn't the one already assigned either, then return an error message in JSON format with the CONFLICT (409) status
            if (!verifyPersonType && personType) return res
                .status(409)
                .json({ message: `The person type '${ personType }' doesn't exist` })

            // Create a Query Builder to check if there is a person type with a certain ID
            const person = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .where(`person.id = :id`, { id: id })
                .getOne()
                
            // If it doesn't exist a person type with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!person) return res
                .status(404)
                .json({ message: `The person with id '${ id }' doesn't exist` })

            // Create a child from the main database source
            const queryRunner = AppDataSource.createQueryRunner()

            // Initialize the database connection through the child source
            await queryRunner.connect()

            // Create a transaction that will be executed using the child source
            await queryRunner.startTransaction()

            // Check if the transaction gets an error while processing data
            try {

                // Create a shortcut to call the operations from the child source
                const databaseOperations = queryRunner.manager

                // Update the attributes of the selected person into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .update(Person)
                    .set({ firstName: firstName, lastName: lastName, personTypeId: personType || person.personTypeId, data: additionalInfo })
                    .where(`id = :id`, { id: id })
                    .execute()

                // Get the emails that are linked to the person from the database
                const storedEmails = await databaseOperations
                    .getRepository(Email)
                    .createQueryBuilder(`email`)
                    .where(`email.personId = :id`, { id: person.id })
                    .getMany()

                // Check if the emails array has at least one email defined
                if (emails) {

                    // Set an array to store each submitted email as an Email object
                    let addEmail: QueryDeepPartialEntity<Email> | QueryDeepPartialEntity<Email>[] = []

                    // Check if there is any stored email in the database
                    if (storedEmails) {

                        // Loop through each submitted email
                        for (let cont = 0; cont < emails.length; cont++) {

                            // Verify if the email is not registered into the database yet, and if that's true, verify if there is at least one email stored in the array or if that email is already registered into the Email object array
                            if ((!storedEmails.some((obj) => obj.email == emails[cont])) && (addEmail.length == 0 || addEmail.every((obj) => obj.email != emails[cont]))) {
                                
                                // Add a new Email object to the Email object array that will contain the attributes from the initial array and the edited person
                                addEmail.push(Email.create({
                                    email: emails[cont],
                                    personId: person
                                }))

                            }
                            
                        }

                        // Loop through each stored email from the database
                        for (let cont = 0; cont < storedEmails.length; cont++) {

                            // Verify if the emails array contains the emails from the database
                            if (!emails.includes(storedEmails[cont].email)) {

                                // Remove the stored email if it doesn't appear in the emails array
                                await databaseOperations
                                    .createQueryBuilder()
                                    .delete()
                                    .from(Email)
                                    .where(`email = :email`, { email: storedEmails[cont].email })
                                    .andWhere(`personId = :id`, { id: person.id })
                                    .execute()

                            }

                        }

                    // Do this if there's no emails stored in the database
                    } else {

                        // Loop through each submitted email
                        for (let cont = 0; cont < emails.length; cont++) {

                            // Verify if there is at least one email stored in the array or if that email is already registered into the Email object array
                            if (addEmail.length == 0 || addEmail.every((obj) => obj.email != emails[cont])) {

                                // Add a new Email object to the Email object array that will contain the attributes from the initial array and the edited person
                                addEmail.push(Email.create({
                                    email: emails[cont],
                                    personId: person
                                }))

                            }

                        }

                    }

                    // Insert the Email objects from the addEmail array into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(Email)
                        .values(addEmail)
                        .execute()
                }

                // Get the phones that are linked to the person from the database
                const storedPhones = await databaseOperations
                    .getRepository(Telephone)
                    .createQueryBuilder(`telephone`)
                    .where(`telephone.personId = :id`, { id: person.id })
                    .getMany()

                // Check if the telephones array has at least one telephone defined
                if (telephones) {

                    // Set an array to store each submitted telephone as a Telephone object
                    let addTelephone: QueryDeepPartialEntity<Telephone> | QueryDeepPartialEntity<Telephone>[] = []

                    // Check if there is any stored phones in the database
                    if (storedPhones) {

                        // Loop through each submitted telephone
                        for (let cont = 0; cont < telephones.length; cont++) {

                            // Verify if the phone is not registered into the database yet, and if that's true, verify if there is at least one phone stored in the array or if that phone is already registered into the Phone object array
                            if ((!storedPhones.some((obj) => obj.number == telephones[cont].number && obj.extension == telephones[cont].extension)) && (addTelephone.length == 0 || addTelephone.every((obj) => obj.number != telephones[cont].number || obj.extension != telephones[cont].extension))) {
                                
                                // Add a new Telephone object to the Telephone object array that will contain the attributes from the initial array and the edited person
                                addTelephone.push(Telephone.create({
                                    number: telephones[cont].number,
                                    extension: telephones[cont].extension,
                                    personId: person
                                }))

                            }

                        }

                        // Loop through each stored phone from the database
                        for (let cont = 0; cont < storedPhones.length; cont++) {

                            // Verify if the telephones array contains the numbers and its extensions from the database
                            if (!telephones.some((obj: { number: Number; extension: Number }) => obj.number == storedPhones[cont].number && obj.extension == storedPhones[cont].extension)) {
                                
                                // Remove the stored phone if it doesn't appear in the telephones array
                                await databaseOperations
                                    .createQueryBuilder()
                                    .delete()
                                    .from(Telephone)
                                    .where(`number = :number`, { number: storedPhones[cont].number })
                                    .andWhere(`extension = :ext`, { ext: storedPhones[cont].extension })
                                    .andWhere(`personId = :id`, { id: person.id })
                                    .execute()

                            }

                        }

                    // Do this if there's no telephones stored in the database
                    } else {

                        // Loop through each submitted phone
                        for (let cont = 0; cont < telephones.length; cont++) {

                            // Verify if there is at least one phone stored in the array or if that phone is already registered into the Telephone object array
                            if (addTelephone.length == 0 || addTelephone.every((obj) => obj.number != telephones[cont].number || obj.extension != telephones[cont].extension)) {

                                // Add a new Telephone object to the Telephone object array that will contain the attributes from the initial array and the edited person
                                addTelephone.push(Telephone.create({
                                    number: telephones[cont].number,
                                    extension: telephones[cont].extension,
                                    personId: person
                                }))

                            }

                        }

                    }

                    // Insert the Telephone objects from the addTelephone array into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(Telephone)
                        .values(addTelephone)
                        .execute()
                }

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return the NO CONTENT (204) status
                return res
                    .status(200)
                    .json({ message: `Successfully edited` })

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

    // Modify the person type assigned to a person
    static ModifyPersonType = async (req: Request, res: Response) => {
        
        // Error Handling
        try {

            // Get the value of the id from the parameter within the URL
            const id = req.params.id

            // Get the value of the person type from the Assign Person Type option
            const {
                personType,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to edit a person, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`update`, `Person`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to edit a person`,
                    info: `No additional info provided`
                })
            
            // If person type doesn't have a value, then return an error message with the BAD REQUEST (400) status
            if (!personType) return res
                .status(400)
                .json({ message: `A person type needs to be declared before assigning it` })

            // Create a Query Builder to check if there is a person type whose name is the one submitted within the form
            const verifyPersonType = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.name = :name`, { name: personType })
                .getOne()

            // If the person type with the submitted name is not registered yet, and it isn't the one already assigned either, then return an error message in JSON format with the CONFLICT (409) status
            if (!verifyPersonType && personType) return res
                .status(409)
                .json({ message: `The person type '${ personType }' doesn't exist` })
            
            // Create a Query Builder to check if there is a person type with a certain ID
            const person = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .where(`person.id = :id`, { id: id })
                .getOne()
                
            // If it doesn't exist a person type with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!person) return res
                .status(404)
                .json({ message: `The person with id '${ id }' doesn't exist` })
            
            // Create a child from the main database source
            const queryRunner = AppDataSource.createQueryRunner()

            // Initialize the database connection through the child source
            await queryRunner.connect()

            // Create a transaction that will be executed using the child source
            await queryRunner.startTransaction()

            // Check if the transaction gets an error while processing data
            try {

                // Create a shortcut to call the operations from the child source
                const databaseOperations = queryRunner.manager

                // Update the person type of the selected person into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .update(Person)
                    .set({ personTypeId: personType || person.personTypeId })
                    .where(`id = :id`, { id: id })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a successfull message in JSON format with the OK (200) status
                return res
                    .status(200)
                    .json({ message: `Successfully edited` })

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
    
    // Function to list invited people using pagination
    static ListInvitedPeoplePaginated = async (req: Request, res: Response) => {
    
        // Error Handling
        try {

            // Get the page value from the URL
            const {
                page,
                itemsPerPage
            } = req.query

            // Get the permissions attribute from the body of the request
            const { permissions } = req.body

            // Check if the logged user has the right permissions to list people, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`read`, `Person`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to see a list of people`,
                    info: `No additional info provided`
                })

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
            const invitedDataCount: number = await AppDataSource
                .getRepository(Invited)
                .count()

            // Create a Query Builder to get the people types stored into the database using pagination
            const invitedData: Invited[] = await AppDataSource
                .getRepository(Invited)
                .createQueryBuilder(`invited`)
                .orderBy('invited.firstName', 'ASC')
                .skip(skipValue)
                .take(amountValues)
                .getMany()
            
            // Build a response that will be sent to the front page
            const response: object = {
                info: {
                    itemsCount: invitedData.length,
                    totalItemsCount: invitedDataCount,
                    nextPage: parseInt(page) * amountValues >= invitedDataCount,
                    previousPage: page
                },
                data: invitedData
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

    // Function to assign a permission to a person
    static PermissionAssignToPerson = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the attributes for permission and user from the body of the request
            const {
                permission,
                user,
                permissions
            } = req.body
            
            // Check if the logged user has the right permissions to assign a permission to a person, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`assign`, `Permission`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to assign a permission to a person`,
                    info: `No additional info provided`
                })

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

            // Format the email of the user to match the required style
            const userEmail: string = user.trim().toLowerCase()

            // Check if there is a person linked to a user with the same email submitted with the request using a Query Builder
            const verifyPerson: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.userId`, `user`)
                .where(`user.email = :email`, { email: userEmail })
                .getOne()

            // If a person linked to the user with that email doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyPerson) return res
                .status(400)
                .json({
                    name: `PERSON NOT FOUND`,
                    message: `The person linked to the user with email ${user} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if the selected permission is assigned to the person within the platform using a Query Builder
            const checkExistingAssign: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.personGetsPermission`, `personPermission`)
                .where(`person.id = :personId`, { personId: verifyPerson.id })
                .andWhere(`personPermission.id = :permissionId`, { permissionId: verifyPermission.id })
                .getOne()

            // If the permission is already assigned to the person, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (checkExistingAssign) return res
                .status(409)
                .json({
                    name: `PERSON AND PERMISSION ARE ALREADY LINKED`,
                    message: `The selected person and permission are already linked within the platform`,
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

                // Insert the relation between the permission and the user into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Person, `personGetsPermission`)
                    .of(verifyPerson)
                    .add(verifyPermission)

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `PERMISSION ASSIGNED TO PERSON`,
                        message: `The ${permissionName} permission was assigned to ${verifyPerson.firstName} (${userEmail})`,
                        info: `Not additional info provided`
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

    // Function to unassign a permission to a person
    static PermissionUnassignToPerson = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the attributes for permission and user from the body of the request
            const {
                permission,
                user,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to unassign a permission to a person, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`assign`, `Permission`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to unassign a permission to a person`,
                    info: `No additional info provided`
                })

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

            // Format the email of the user to match the required style
            const userEmail: string = user.trim().toLowerCase()

            // Check if there is a person linked to a user with the same email submitted with the request using a Query Builder
            const verifyPerson: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.userId`, `user`)
                .where(`user.email = :email`, { email: userEmail })
                .getOne()

            // If a person linked to the user with that email doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyPerson) return res
                .status(400)
                .json({
                    name: `PERSON NOT FOUND`,
                    message: `The person linked to the user with email ${user} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if the selected permission is assigned to the person within the platform using a Query Builder
            const checkExistingAssign: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.personGetsPermission`, `personPermission`)
                .where(`person.id = :personId`, { personId: verifyPerson.id })
                .andWhere(`personPermission.id = :permissionId`, { permissionId: verifyPermission.id })
                .getOne()

            // If the permission is not assigned to the person, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!checkExistingAssign) return res
                .status(400)
                .json({
                    name: `PERSON AND PERMISSION ARE NOT LINKED`,
                    message: `The selected person and permission are not linked within the platform`,
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

                // Remove the relation between the permission and the user into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Person, `personGetsPermission`)
                    .of(verifyPerson)
                    .remove(verifyPermission)

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `PERMISSION REVOKED FROM PERSON`,
                        message: `The ${permissionName} permission was revoked from ${verifyPerson.firstName} (${userEmail})`,
                        info: `Not additional info provided`
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
    
    // Function to assign a role to a person
    static RoleAssignToPerson = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the attributes for role and user from the body of the request
            const {
                role,
                user,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to assign a role to a person, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`assign`, `Role`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to assign a role to a person`,
                    info: `No additional info provided`
                })

            // Format the email of the user to match the required style
            const userEmail: string = user.trim().toLowerCase()

            // Check if there is a user whose email is the same as the one received using a Query Builder
            const verifyUser: User | null = await AppDataSource
                .getRepository(User)
                .createQueryBuilder(`user`)
                .where(`user.email = :email`, { email: userEmail })
                .getOne()

            // If a user with that email doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyUser) return res
                .status(400)
                .json({
                    name: `USER NOT FOUND`,
                    message: `The user with email ${user} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if there is a person linked to the found user using a Query Builder
            const verifyPerson: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.organizationId`, `organization`)
                .where(`person.userId = :user`, { user: verifyUser.id })
                .getOne()

            // If a person linked to the user doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyPerson) return res
                .status(400)
                .json({
                    name: `PERSON NOT FOUND`,
                    message: `The person linked to the user with email ${user} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Format the name of the role to match the required style
            const roleName: string = CapitalizeString(role.trim())

            // Check if there is a role whose name is the same as the one received using a Query Builder
            const verifyRole: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .where(`role.name = :name`, { name: roleName })
                .andWhere(`role.organizationId = :organization`, { organization: verifyPerson.organizationId.id })
                .getOne()

            // If a role with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyRole) return res
                .status(400)
                .json({
                    name: `PROFILE NOT FOUND`,
                    message: `The role named ${roleName} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if the selected role and person are already linked within the platform using a Query Builder
            const checkExistingAssign: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .innerJoinAndSelect(`person.personAppointsRole`, `personRole`)
                .where(`person.id = :personId`, { personId: verifyPerson.id })
                .andWhere(`personRole.id = :roleId`, { roleId: verifyRole.id })
                .getOne()

            // If the role is already assigned to the person, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (checkExistingAssign) return res
                .status(409)
                .json({
                    name: `PERSON AND PROFILE ARE ALREADY LINKED`,
                    message: `The selected person and role are already linked within the platform`,
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

                // Insert the relation between the role and the person into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Person, `personAppointsRole`)
                    .of(verifyPerson)
                    .add(verifyRole)

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()
                
                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `PROFILE ASSIGNED TO PERSON`,
                        message: `The ${verifyRole.name} role was assigned to ${verifyPerson.firstName} (${userEmail})`,
                        info: `Not additional info provided`
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

    // Function to unassign a role from a group
    static RoleUnassignFromPerson= async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the attributes for role and group from the body of the request
            const {
                role,
                user,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to unassign a role to a person, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`assign`, `Role`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to unassign a role to a person`,
                    info: `No additional info provided`
                })

            // Format the email of the user to match the required style
            const userEmail: string = user.trim().toLowerCase()

            // Check if there is a user whose email is the same as the one received using a Query Builder
            const verifyUser: User | null = await AppDataSource
                .getRepository(User)
                .createQueryBuilder(`user`)
                .where(`user.email = :email`, { email: userEmail })
                .getOne()

            // If a user with that email doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyUser) return res
                .status(400)
                .json({
                    name: `USER NOT FOUND`,
                    message: `The user with email ${user} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if there is a person linked to the found user and retrieve the information about its organization using a Query Builder
            const verifyPerson: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .innerJoinAndSelect(`person.organizationId`, `organization`)
                .where(`person.userId = :user`, { user: verifyUser.id })
                .getOne()

            // If a person linked to the user doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyPerson) return res
                .status(400)
                .json({
                    name: `PERSON NOT FOUND`,
                    message: `The person linked to the user with email ${user} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Format the name of the role to match the required style
            const roleName: string = CapitalizeString(role.trim())

            // Check if there is a role whose name is the same as the one received using a Query Builder and it's from the same organization as the person
            const verifyRole: Role | null = await AppDataSource
                .getRepository(Role)
                .createQueryBuilder(`role`)
                .where(`role.name = :name`, { name: roleName })
                .andWhere(`role.organizationId = :organization`, { organization: verifyPerson.organizationId.id })
                .getOne()

            // If a role with that name doesn't exist within the platform, then return an error message in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!verifyRole) return res
                .status(400)
                .json({
                    name: `PROFILE NOT FOUND`,
                    message: `The role named ${roleName} doesn't exist within the platform`,
                    info: `No additional info provided`
                })

            // Check if the selected role and person are already linked within the platform using a Query Builder
            const checkExistingAssign: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.personAppointsRole`, `personRole`)
                .where(`person.id = :personId`, { personId: verifyPerson.id })
                .andWhere(`personRole.id = :roleId`, { roleId: verifyRole.id })
                .getOne()

            // If the role is not assigned to the person, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (!checkExistingAssign) return res
                .status(409)
                .json({
                    name: `PERSON AND PROFILE ARE NOT LINKED`,
                    message: `The selected person and role are not linked within the platform`,
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

                // Delete the relation between the role and the group into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Person, `personAppointsRole`)
                    .of(verifyPerson)
                    .remove(verifyRole)

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()
                
                // Return a success message in JSON format with the OK (200) status - SUCCESS
                return res
                    .status(200)
                    .json({
                        name: `PROFILE UNASSIGNED TO PERSON`,
                        message: `The ${verifyRole.name} role was unassigned from ${verifyPerson.firstName} (${userEmail})`,
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

}