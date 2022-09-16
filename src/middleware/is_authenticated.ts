import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../entities/User'
import { promisify } from 'util'
import dotenv from 'dotenv'
import { AppDataSource } from '../database/connection'
import { Person } from '../entities/Person'
import { Permission } from '../entities/Permission'
import { PermissionRule } from '../controllers/libs/type_definition'
import { Role } from '../entities/Role'
import { Group } from '../entities/Group'
import { Ability } from '@casl/ability'

dotenv.config({ path: '.env'})

export const IsAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    console.log("/------------------------------------------>");
    
    if (req.headers.authorization) {
        try {
            
            //const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
            const jwtPayload: string = jwt.verify(req.headers.authorization as string,process.env.JWT_SECRET || "") as string
            const jsonString: string = JSON.stringify(jwtPayload)
            const idParsed = JSON.parse(jsonString)
            const user = await User.findOneBy({ id: idParsed.id }) 
            if (!user){return next()}   //this should be changet to return an error so the user cant use the page if does not have a sessiona active
            req.headers.userauth = user.id
            req.headers.organizationId = idParsed.organizationId
            // Format the email of the user to match the required style

            const userEmail: string = user.email.trim().toLowerCase()

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
                
            // Create a variable to store a list with the available permissions for the person based on its roles
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

            // Store the permissions found within an attribute of the body from the request with a defined type to contain only the required parameters for CASL
            const permissionsFormat: PermissionRule[] = permissionsList.map((permission: Permission) => {
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
            
            req.body.permissions = new Ability(permissionsFormat as any[])
            const test = new Ability(permissionsFormat as any[])

            // Proceed with the next method
            return next()

        } catch (error) {
            console.log(error)
            return next()
        }
    } else {
        res.redirect('/login')
    }
    return
}