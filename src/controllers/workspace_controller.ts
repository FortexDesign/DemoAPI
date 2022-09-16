import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { Person } from '../entities/Person'
import { AppDataSource } from '../database/connection'
import { Workspace } from '../entities/Workspace'


export default class WorkspaceController { 

    //function to create a new workspace
    static CreateWorkspace = async (req: Request, res: Response) => {
        // Error Handling
        try {
            // Get the values of name and description from the body
            const  {name, description} = req.body
            
            // If a name wasn't submitted, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!name) return res
            .status(400)
            .json({ message: `The name field is required` })

            //bring from the database a workspace with that name
            const verifyWorkspace = await AppDataSource
            .getRepository(Workspace)
            .createQueryBuilder(`workspace`)
            .where(`workspace.name = :name`, { name: name })
            .getOne()

            //verify if said workspace exists and if it does return an error
            if (verifyWorkspace) return res
            .status(409)
            .json({ message: `The workspace '${name}' exists already` })

            //Creane a new Workspace object
            const workspaceSave = Workspace.create({
                name: name,
                description: description,
                status: 1,
                color: "indigo-600",
                icon: "icon-presentation-chart-bar"
            })

            // Insert the created workspace object into the database
            await AppDataSource
                .createQueryBuilder()
                .insert()
                .into(Workspace)
                .values(workspaceSave)
                .execute()
            //response with status 200 and a message
                return res
                .status(201)
                .json({ message: `You have been successfully registered a new workspace!` })

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
    //function to list all the workspaces
    static ListWorkspaces = async (req: Request, res: Response) => {
        // Error Handling
        try {

            // Create a Query Builder to get all the Workspaces stored into the database
            const workspaceData = await AppDataSource
                .getRepository(Workspace)
                .createQueryBuilder(`workspace`)
                .orderBy(`workspace.name`,`ASC`)
                .getMany()

            //Response with status 200 and all the workspaces
            return res
            .status(200)
            .json(workspaceData)

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
    //Function to delete a workspace from the database
    static DeleteWorkspace = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the value of the id from the parameter within the URL
            const { id } = req.query

            // Create a Query Builder to check if there is a workspace with a the ID guiven
            const workspaceInfo = await AppDataSource
                .getRepository(Workspace)
                .createQueryBuilder(`workspace`)
                .where(`workspace.id = :id`, { id: id as string})
                .getOne()

            // If it doesn't exist a workspace with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!workspaceInfo) return res
                .status(404)
                .json({ message: `The workspace with id '${id}' doesn't exist`})

            // Create a Query Builder to check if the workspace has groups
            const workspaceHasGroupsCheck = await AppDataSource
            .getRepository(Workspace)
            .createQueryBuilder(`workspace`)
            .innerJoinAndSelect('workspace.groupSharesWorkspace', 'groupWorkspace')
            .where(`workspace.id = :id`, { id: workspaceInfo.id })
            .select([
                `workspace.id`,
                `groupWorkspace.name`
            ])
            .getCount()

            // If it has at least one group, then return an error message in JSON format with the CONFLICT (409) status
            if (workspaceHasGroupsCheck) return res
                .status(409)
                .json({ message: `The workspace ${workspaceInfo.name} is being used by ${workspaceHasGroupsCheck} ${workspaceHasGroupsCheck == 1 ? `group` : `Groups`}` })

            // Delete a workspace from the database using a Query Builder
            await AppDataSource
                .createQueryBuilder()
                .delete()
                .from(Workspace)
                .where(`id = :id`, { id: workspaceInfo.id })
                .execute()

            // Return the (204) status
            return res
                .status(200)
                .json({ message: `Ok` })

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
    //Function to edit a workspace
    static EditWorkspace = async (req: Request, res: Response)=>{
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
                .json({ message: `The name field is required to edit a workspace. It can't be empty` })

            // Create a Query Builder to check if there is a workspace whose id exists
            const verifyWorkspace = await AppDataSource
                .getRepository(Workspace)
                .createQueryBuilder(`workspace`)
                .where(`workspace.id = :id`, { id: id as string})
                .getOne()

            // If it doesn't exist a workspace with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!verifyWorkspace) return res
                .status(404)
                .json({ message: `The workspace with id '${id}' doesn't exist` })

            // Update the attributes of the selected workspace into the database using a Query Builder
            await AppDataSource
                .createQueryBuilder()
                .update(Workspace)
                .set({ name: name, description: description })
                .where(`id = :id`, { id: verifyWorkspace.id })
                .execute()

            // Return the (200) status with a message
            return res
                .status(200)
                .json({ message: `Updated correcly` })

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
    //Function to edit a workspace
    static ChangeColorAndIcon = async (req: Request, res: Response)=>{
        // Error Handling
        try {

            // Get the value of the id from the parameter within the URL
            const {id} = req.query

            // Get the values of name and description from the body
            const {
                color,
                icon
            } = req.body

            // If a name wasn't submitted, then return an error message in JSON format with the BAD REQUEST (400) status
            if (![color,icon].every(Boolean)) return res
                .status(400)
                .json({ message: `The color and icon fields are required to edit a workspace. It can't be empty` })

            // Create a Query Builder to check if there is a workspace with the id given exists
            const verifyWorkspace = await AppDataSource
                .getRepository(Workspace)
                .createQueryBuilder(`workspace`)
                .where(`workspace.id = :id`, { id: id as string})
                .getOne()

            // If it doesn't exist a workspace with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!verifyWorkspace) return res
                .status(404)
                .json({ message: `The workspace with id '${id}' doesn't exist` })

            // Update the attributes of the selected workspace into the database using a Query Builder
            await AppDataSource
                .createQueryBuilder()
                .update(Workspace)
                .set({ icon: icon, color: color })
                .where(`id = :id`, { id: id })
                .execute()

            // Return the (200) status with a message
            return res
                .status(200)
                .json({ message: `Updated correcly` })
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
    //Function to list a single workspace
    static WorkspaceInfo = async (req: Request, res: Response)=>{
        // Error Handling
        try {

            // Get the value of the id from the parameter within the URL
            const {id} = req.query

            // Create a Query Builder to check if there is a workspace whose id exists
            const workspaceInfo = await AppDataSource
                .getRepository(Workspace)
                .createQueryBuilder(`workspace`)
                .where(`workspace.id = :id`, { id: id as string})
                .getOne()

            // If it doesn't exist a workspace with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!workspaceInfo) return res
                .status(404)
                .json({ message: `The workspace with id '${id}' doesn't exist` })

            // Return the (200) status with a message
            return res
                .status(200)
                .json(workspaceInfo)
                
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
    //Function to list a single workspace
    static ChangeStatus = async (req: Request, res: Response)=>{
        // Error Handling
        try {

            // Get the value of the id from the parameter within the URL
            const {id} = req.query

            const {status} = req.body
            console.log(status);
            

            // Create a Query Builder to check if there is a workspace whose id exists
            const workspaceInfo = await AppDataSource
                .getRepository(Workspace)
                .createQueryBuilder(`workspace`)
                .where(`workspace.id = :id`, { id: id as string})
                .getOne()

            // If it doesn't exist a workspace with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!workspaceInfo) return res
                .status(404)
                .json({ message: `The workspace with id '${id}' doesn't exist` })

                // Update the attributes of the selected workspace into the database using a Query Builder
            await AppDataSource
            .createQueryBuilder()
            .update(Workspace)
            .set({ status: status})
            .where(`id = :id`, { id: workspaceInfo.id })
            .execute()

            // Return the (200) status with a message
            return res
                .status(200)
                .json({message: "ok"})
                
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
    // Function to list the persons not in a group
    static ListPersonsNotInGroup = async (req: Request, res: Response) => {

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

            // Return an error message in JSON format with the INTERNAL SERVER ERROR (500) status
            if (error instanceof Error) return res
                .status(500)
                .json({ message: error })

            // Return the INTERNAL SERVER ERROR (500) status
            return res
                .sendStatus(500)

        }

    }
}