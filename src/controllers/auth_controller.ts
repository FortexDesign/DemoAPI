// Controller Import
import AmazonSESController from './aws_ses_controller'

// Database Import
import { AppDataSource } from '../database/connection'

// Entities Imports
import { Group } from '../entities/Group'
import { Group_Forms_Person as GroupFormsPerson } from '../entities/Group_Forms_Person'
import { Organization } from '../entities/Organization'
import { Permission } from '../entities/Permission'
import { Person } from '../entities/Person'
import { Person_Type as PersonType } from '../entities/Person_Type'
import { Role } from '../entities/Role'
import { User } from '../entities/User'

// Libs Imports
import { CapitalizeString } from './libs/string_manipulation'
import { domainList } from './libs/email_domain'
import { sesClient } from './libs/ses_client'
import { PermissionRule } from './libs/type_definition'

// Modules Imports
import * as AWS from '@aws-sdk/client-ses'
import bcryptjs from 'bcryptjs'
import {
    Request,
    Response
} from 'express'
import jwt from 'jsonwebtoken'
import {
    EntityManager,
    QueryRunner
} from 'typeorm'

// Group of methods to control the Authentication functionality of the application
export default class AuthController {

    // Method to register a user into the database
    static RegisterUser = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the attributes for first name, last name, organization, email and password from the registration form
            const {
                firstName,
                lastName,
                organization,
                email,
                password
            } = req.body

            // Set a constant that has the value of a string that will be used by default
            const defaultValue: `Default` = `Default`

            // Format the email of the new user to match the required style
            const userEmail: string = email.trim().toLowerCase()

            // Verify if the submitted email address is not linked to an account yet
            const checkEmail: User | null = await AppDataSource
                .getRepository(User)
                .createQueryBuilder(`user`)
                .where(`user.email = :email`, { email: userEmail })
                .getOne()

            // If the submitted email address is already registered with a user, then return an error message in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (checkEmail) return res
                .status(409)
                .json({
                    name: `EmailAlreadyRegistered`,
                    message: `The email ${ email } is already linked to a registered user`,
                    info: `No additional info provided`
                })
            
            // Encrypt the password using the bcryptjs dependency
            const passHash: string = await bcryptjs.hash(password, 10)

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

                // Create an object to store the attributes of the user
                const user: User = User.create({
                    email: userEmail,
                    password: passHash
                })

                // Insert the created user object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user)
                    .execute()

                // Check if a person type with the default value as the name already exists
                let personType: PersonType | null = await databaseOperations
                    .getRepository(PersonType)
                    .createQueryBuilder(`personType`)
                    .where(`personType.name = :name`, { name: defaultValue })
                    .getOne()

                // Verify if it found any matches for the person type, and if it didn't find any, then continue with the nested methods
                if (!personType) {

                    // Create an object to store the attributes of the person type
                    personType = PersonType.create({
                        name: defaultValue,
                        description: `This is a default person type. We suggest you to change it as soon as possible`
                    })

                    // Store the new person type object into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(PersonType)
                        .values(personType)
                        .execute()

                }

                // Create an object to store the attributes of the person
                const person: Person = Person.create({
                    userId: user,
                    personTypeId: personType,
                    firstName: CapitalizeString(firstName.trim()),
                    lastName: CapitalizeString(lastName.trim())
                })

                // Store the new person into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(Person)
                    .values(person)
                    .execute()

                // Assign the domain of the submitted email address to the emailDomain variable
                const emailDomain: string = userEmail.split(`@`)[1]

                // Verify if the domain of the submitted email address belongs to a personal or corporate email address
                const hasCorpDomain: boolean = !domainList.includes(emailDomain)

                // Assign the domain of the organization or a default domain based on the result of the ternary condition
                const organizationDomain: string = organization && hasCorpDomain ? emailDomain : `${defaultValue.toLowerCase()}.com`
                
                // Assign the name of the organization or assign it a default name
                const organizationName: string = organization && organizationDomain !== `${defaultValue.toLowerCase()}.com` ? organization : defaultValue
 
                // Check if an organization with that name already exists using a Query Builder
                let checkOrganization: Organization | null = await databaseOperations
                    .getRepository(Organization)
                    .createQueryBuilder(`organization`)
                    .where(`organization.name = :name`, { name: organizationName })
                    .andWhere(`organization.domain = :domain`, { domain: organizationDomain })
                    .getOne()

                // If the organization doesn't exist, then continue with the nested conditional
                if (!checkOrganization) {

                    // Create an object to store the attributes of the organization
                    checkOrganization = Organization.create({
                        name: organizationName,
                        domain: organizationDomain,
                        official: organizationName !== defaultValue
                    })

                    // Store the created organization into the database using a Query Builder
                    await databaseOperations
                        .createQueryBuilder()
                        .insert()
                        .into(Organization)
                        .values(checkOrganization)
                        .execute()

                }

                // Check if a group that belongs to the organization and has a specific name exists using a Query Builder
                let group: Group | null = await databaseOperations
                    .getRepository(Group)
                    .createQueryBuilder(`group`)
                    .where(`group.organizationId = :organizationId`, { organizationId: checkOrganization.id })
                    .andWhere(`group.name = :name`, { name: defaultValue })
                    .getOne()

                // Create a boolean variable to check if a group or a role are new or they already exist within the platform
                let isNew: boolean = false

                // If the group doesn't exist, then continue with the next methods
                if (!group) {

                    // Create an object to store the attributes of the group
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

                    // Change the value of the boolean variable to know that a group was created
                    isNew = true

                }

                // Create an object to add the created person into the group
                const groupFormsPerson: GroupFormsPerson = GroupFormsPerson.create({
                    groupId: group,
                    personId: person
                })

                // Store the relation into the database using a Relational Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(GroupFormsPerson)
                    .values(groupFormsPerson)
                    .execute()

                // Check if a role with a specific name that belongs to a specific organization exists using a Query Builder
                let role: Role | null = await databaseOperations
                    .getRepository(Role)
                    .createQueryBuilder(`role`)
                    .where(`role.organizationId = :organizationId`, { organizationId: checkOrganization.id })
                    .andWhere(`role.name = :name`, { name: defaultValue })
                    .getOne()

                // If the role doesn't exist, then continue with the next methods
                if (!role) {
                    
                    // Create an object to store the attributes of the role
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

                    // Change the value of the boolean variable to know that a role was created
                    isNew = true

                }
                
                // Store the relation betweeen group and role using a Query Builder if one of them was created using a Relational Query Builder
                if (isNew) await databaseOperations
                    .createQueryBuilder()
                    .relation(Group, `groupLinksRole`)
                    .of(group)
                    .add(role)

                // Store the relation between person and group using a Relational Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Person, `organizationId`)
                    .of(person)
                    .set(checkOrganization)

                // Store the relation between person and role using a Relational Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .relation(Person, `personAppointsRole`)
                    .of(person)
                    .add(role)

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()
                
                // Ends the connection made by the child source to the database
                await queryRunner.release()

                /* // Send the account verification email to the registered email
                AmazonSESController.sendVerifyEmail(email) */

                // Return a success message in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `AccountSuccessfullyCreated`,
                        message: `You have been successfully registered. Check your email to validate your account`,
                        info: person
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

    // Method to verify a new user
    static VerifyAccount = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Assign the id attribute from the params of the request to the token constant
            const token: string = req.params.id

            // Look into the database for a user with that validation token using a Query Builder
            const user: User | null = await AppDataSource
                .getRepository(User)
                .createQueryBuilder(`user`)
                .where(`user.validationToken = :token`, { token: token })
                .getOne()

            // If the user doesn't exist, then return an error message in JSON format with the NOT FOUND (404) status
            if (!user) return res
                .status(404)
                .json({ message: `You're not authorized to be here. Go back to the login page` })

            // Verify if that user has already verified its account and if it's true, return an error message in JSON format with the BAD REQUEST (400) status
            if (user.isVerified) return res
                .status(400)
                .json({ message: `This account is already verified` })

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

                // Update the verified property to true into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .update(User)
                    .set({
                        isVerified: true,
                        validationToken: ``
                    })
                    .where(`id = :id`, { id: user.id })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

            } catch (error) {

                // Undo the changes made by the transaction if an error happened
                await queryRunner.rollbackTransaction()

            } finally {

                // Ends the connection made by the child source to the database
                await queryRunner.release()

            }

            // Return a success message in JSON format with the OK (200) status
            return res
                .status(200)
                .json({ message: `You have been successfully verified. Go to the login page and enter your credentials to access the platform` })

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

    // Method to login the account within the platform
    static LoginUser = async (req: Request, res: Response) => {
        // Error Handling
        try {
            console.log(req.body);
            // Request body from the page
            const {
                email,
                password
            } = req.body
            
            // Validate that the user have both fields filled. If that's not the case, return an error message in JSON format with the BAD REQUEST (404) status
            if (![email, password].every(Boolean)) return res
                .status(400)
                .json({ message: "Missing Credentials" })

            // Look into the database for a user with the same email from the body using a Query Builder
            const user: User | null = await AppDataSource
                .getRepository(User)
                .createQueryBuilder(`user`)
                .where(`user.email = :email`, { email: email })
                .getOne()

            // If the user doesn't exist, then return an error message in JSON format with the NOT FOUND (404) status
            if (!user) return res
                .status(404)
                .json({ message: `The input email is not registered into the platform` })

            // If the input password doesn't match the one stored into the database, then return an error message in JSON format with the UNAUTHORIZED (401) status
            if (!(await bcryptjs.compare(password, user.password))) return res
                .status(401)
                .json({ message: `The input password is not correct` })

            // If the user hasn't verified its account yet, then return an error message in JSON format with the FORBIDDEN (403) status
            if (!user.isVerified) return res
                .status(403)
                .json({ message: `You haven't verified your account yet. It's mandatory to do it to be able to log into the platform` })

            // Create a Query Builder to check if the submitted user is already linked with other person from the platform
            const person: Person | null = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`person`)
                .leftJoinAndSelect(`person.organizationId`, `organizationId`)
                .where(`person.userId = :user`, { user: user.id })
                .getOne()

            // If the user is not linked to any person, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!person) return res
                .status(400)
                .json({ message: `The person linked to the user ${ user.email } doesn't exist` })

            // Get the roles that belong to that user using a Relational Query Builder
            const userRoles: Role[] = await AppDataSource
                .createQueryBuilder()
                .relation(Person, `personAppointsRole`)
                .of(person)
                .loadMany()

            // Create a variable to store a list with the available roles for the user
            let rolesList: Role[] = userRoles
            
            // Get a list with the ID of the groups that the user belongs to using a Query Builder
            const userGroups: string[] = await AppDataSource
                .getRepository(Group)
                .createQueryBuilder(`group`)
                .leftJoinAndSelect(`group.groupFormsPerson`, `groupPerson`)
                .leftJoinAndSelect(`groupPerson.personId`, `person`)
                .where(`person.id = :id`, { id: person.id })
                .getMany()
                .then((groups) => {
                    return groups.flatMap((group) => {
                        return group.id
                    })
                })

            // Get a list with the roles assigned to the filtered groups using a Query Builder
            const groupsRoles: Role[] = userGroups.length > 0
                ? await AppDataSource
                    .getRepository(Role)
                    .createQueryBuilder(`role`)
                    .leftJoinAndSelect(`role.groupLinksRole`, `groupRole`)
                    .select([
                        `role.id`,
                        `role.name`,
                        `role.description`,
                        `role.status`
                    ])
                    .where(`groupRole.id IN (:...id)`, { id: userGroups })
                    .getMany()
                : []

            // Add the group roles to the roles list, unless they are already inside it as a role for the user
            groupsRoles.forEach((groupRole) => {
                if (!rolesList.some((role) => role.id === groupRole.id)) rolesList = [...rolesList, groupRole]
            })

            // Get the list of permissions for that user using a Relational Query Builder
            const userPermissions: Permission[] = await AppDataSource
                .createQueryBuilder()
                .relation(Person, `personGetsPermission`)
                .of(person)
                .loadMany()
                
            // Create a variable to store a list with the available permissions for the user based on its roles
            let permissionsList: Permission[] = userPermissions

            // Check if the list of roles is not empty, and if that's true, then continue with the methods inside the conditional
            if (rolesList.length > 0) {
                
                // Get the list of permissions for the filtered roles using a Query Builder
                const rolesPermissions: Permission[] = await AppDataSource
                    .getRepository(Permission)
                    .createQueryBuilder(`permission`)
                    .leftJoinAndSelect(`permission.roleCombinesPermission`, `rolePermission`)
                    .select([
                        `permission.id`,
                        `permission.key`,
                        `permission.name`,
                        `permission.action`,
                        `permission.subject`,
                        `permission.fields`,
                        `permission.conditions`,
                        `permission.inverted`,
                        `permission.reason`
                    ])
                    .where(`rolePermission.id IN (:...id)`, { id: rolesList.flatMap((role) => {
                        return role.id
                    }) })
                    .getMany()
    
                // Add the permissions from the roles, unless they are already stored as a permission for the user
                rolesPermissions.forEach((rolePermission) => {
                    if (!permissionsList.some((permission) => permission.id === rolePermission.id)) permissionsList = [...permissionsList, rolePermission]
                })

            }

            // Take the id of the user to make a new token from JWT
            const id: string = user.id

            const permitFile: PermissionRule[] = permissionsList.map((permission: Permission) => {
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

            // Create a JWT token for the user and store it inside the token constant
            const token: string = jwt.sign({ id: id, mail: user.email, name: person.firstName, organizationId: person.organizationId.id, permissions: permitFile }, process.env.JWT_SECRET || '', {
                expiresIn: process.env.JWT_EXPIRE_TIME
            })

            /* // Create a new cookie (temporary not implemented)
            const cookieOptions = {
                expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES || '0') * 24 * 60 * 60 * 1000),
                httpOnly: true
            }
            res.cookie('jwt', token, cookieOptions) */

            // The created token is shown in the console of the API
            console.log("🚀 ~ file: auth_controller.ts ~ line 369 ~ AuthController ~ LoginUser= ~ token", token)
            
            // Return the created token in JSON format with the OK (200) status
            return res
                .status(200)
                .json({
                    token: token,
                    user:
                    {
                        email: user.email
                        ,name: person.firstName
                        ,id: id
                    } 
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

    // Method to send the recovery email to the user
    static ResetPassword = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Generic message stored in a constant if the email is sent
            const message: string = "Check your mail for a link to reset your password"

            // Request body from the page
            const { email } = req.body

            // If the value of the email is undefined, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!email) return res
                .status(400)
                .json({ message: "Please fill the mail box" })
            
            // Look into the database for a user with the same email from the body using a Query Builder
            const user: User | null = await AppDataSource
                .getRepository(User)
                .createQueryBuilder(`user`)
                .where(`user.email = :email`, { email: email })
                .getOne()

            // If the user doesn't exist, then return an error message in JSON format with the NOT FOUND (404) status
            if (!user) return res
                .status(404)
                .json({ message: `Your email is not registered into the platform` })

            // Take the id of the user to make a new reset token from JWT
            const id: string = user.id
            
            // Create a new jsonwebtoken to save into the database so the user can only change the password with that specific token
            const token: string = jwt.sign({ id: id }, process.env.JWT_SECRET_RESET || '', {
                expiresIn: process.env.JWT_EXPIRE_TIME
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

                // Update the reset token of the user using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .update(User)
                    .set({ resetToken: token })
                    .where(`id = :id`, { id: id })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

            } catch (error) {

                // Undo the changes made by the transaction if an error happened
                await queryRunner.rollbackTransaction()

            } finally {

                // Ends the connection made by the child source to the database
                await queryRunner.release()

            }

            // Link that its going to be sent to the email
            const verificationLink: string = `http://${process.env.URL_WEBPAGE}/new-password/${token}`

            // Build the email
            try {

                // Create a constant to hold the required parameters for the email
                const params: AWS.SendEmailCommandInput = {

                    // Set the emails of the recipients and the emails that will receive a copy of the message
                    Destination: {
                        ToAddresses: [
                            email
                        ],
                        CcAddresses: []
                    },

                    // Create the message that will be sent with the email
                    Message: {

                        // Define the subject of the message
                        Subject: {
                            Charset: `UTF-8`,
                            Data: "Reset password Dextra app"
                        },

                        // Define the body of the message that can be set with raw text or using HTML
                        Body: {
                            Text: {
                                Data: 'FROM EMANUEL'
                            },
                            Html:{
                                Data:
                                    `<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;">
                                        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"style="margin: auto;">
                                            <tr>
                                                <td valign="middle" class="hero bg_white" style="padding: 2em 0 4em 0;">
                                                    <table>
                                                        <tr>
                                                            <td>
                                                                <div class="text" style="padding: 0 2.5em; text-align: center;">
                                                                    <h2>Reset your password</h2>
                                                                    <h3>A request to reset the password for your account has been made at Dextra app</h3>
                                                                    <p><a href="${verificationLink}" class="btn btn-primary">Reset password</a></p>
                                                                    <h3>if you didn't request this let us know</h3>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr><!-- end tr -->
                                            <!-- 1 Column Text + Button : END -->
                                        </table>
                                    </body>`
                            }
                        }
                    },

                    //use the source in the env file to send the email
                    Source: process.env.MAIL_TEST,

                    // Define the emails that will receive a reply from the email (the sender is set by default)
                    ReplyToAddresses: []
                }

                //send the email to the mail registered
                const data: AWS.SendEmailCommandOutput = await sesClient.send(new AWS.SendEmailCommand(params))

                // For testing only
                console.log(data)

            } catch (error) {

                // Return an error message in JSON format with the INTERNAL SERVER ERROR (500) status
                if (error instanceof Error) return res
                    .status(500)
                    .json({ message: error.message })
    
                // Return the INTERNAL SERVER ERROR (500) status
                return res
                    .sendStatus(500)

            }
            
            // Return a success message in JSON format with the OK (200) status
            return res
                .status(200)
                .json({ message: message })

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

    // Method to change the password through a recovery link
    static CreateNewPassword = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Request body from the page
            const { newPassword } = req.body

            // Request the token from the header
            const resetToken: string = req.body.reset

            // If any of the required fields is empty, then return an error message in JSON format with the BAD REQUEST (400) status
            if (![newPassword, resetToken].every(Boolean)) return res
                .status(400)
                .json({ message: 'Every field has to be filled' })

            // Check if the user exists, or else return an error
            try {

                // Find the user linked to the reset token from the database
                const user: User = await User.findOneByOrFail({ resetToken: resetToken })

                // Show the email of the user on the API's console
                console.log(user.email)

            } catch (error) {

                // Return an error message in JSON format with the NOT FOUND (404) status
                return res
                    .status(404)
                    .json({ message: "The user that requires a new password wasn't found. Contact technical service to solve your issue" })

            }

            // Encrypt the new passwotd
            let passHash = await bcryptjs.hash(newPassword, 10)

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

                // Update the user with the new encrypted password and remove the reset token using a query builder 
                await databaseOperations
                    .createQueryBuilder()
                    .update(User)
                    .set({ password: passHash, resetToken: ""})
                    .where("resetToken = :reset", { reset: resetToken })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

            } catch (error) {

                // Undo the changes made by the transaction if an error happened
                await queryRunner.rollbackTransaction()

            } finally {

                // Ends the connection made by the child source to the database
                await queryRunner.release()

            }

            // It works, but we didn't know how at the time
            /* await User
                .createQueryBuilder()
                .update(User)
                .set({ password: passHash, resetToken: ""})
                .where("resetToken = :reset", { reset: resetToken })
                .execute() */

            // Return a success message in JSON format with the OK (200) status
            return res
                .status(200)
                .json({ message: `The password was changed successfully` })

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

    // Method to logout the account from the platform
    static Logout = async (req: Request, res: Response) => {

        /* // Clear the cookie with the token (Temporary disabled)
        res.clearCookie('jwt') */

        // Return a success message in JSON format with the OK (200) status
        return res
            .status(200)
            .json({ message: "You logged out successfully" })

    }

}