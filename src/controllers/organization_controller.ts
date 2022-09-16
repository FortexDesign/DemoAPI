import { Request, Response } from 'express'
import { AppDataSource } from '../database/connection'
import { Organization } from '../entities/Organization'

export default class OrganizationController {

    // Function to get a list with the names of the organizations for the filter
    static ListOrganizationsByName = async (req: Request, res: Response) => {

        try {

            // Use a Query Builder to get the name of each organization
            const organizationsNames: Organization[] | undefined = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .select(`organization.name`)
                .orderBy(`organization.name`, `ASC`)
                .getMany()

            // Return the names of the organizations in JSON format with the OK (200) status
            if (typeof organizationsNames !== `undefined` && organizationsNames.length > 0) return res
                .status(200)
                .json(organizationsNames)

            // Return the NO CONTENT (204) status
            return res
                .sendStatus(200)

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
    // Function to list the info of the organization the user belongs to
    static ListOrganizationInfo = async(req: Request, res: Response)=>{
        try {

            //request organizationId from headers
            const organizationId = req.headers.organizationId
            
            // Use a Query Builder to get the organization
            const organization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where('organization.id = :id',{id: organizationId})
                .orderBy(`organization.name`, `ASC`)
                .getOne()

            // Return the info of the organization in JSON format with the OK (200) status
            if (typeof organization != null) return res
                .status(200)
                .json(organization)
            //return error ORGANIZATION NOT FOUND
            return res
                .sendStatus(400)
                .json({
                    name: `ORGANIZATION NOT FOUND`,
                    message: `The organization searched doesn't exist within the platform`,
                    info: `No additional info provided`
                })

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
    //Function to update the data of the organization
    static UpdateOrganization = async(req: Request, res: Response)=>{
        try {            
            //request organization id from headers
            const organizationId = req.headers.organizationId
            //request organization info from body
            const {
                name,
                domain,
                naics,
                description,
                phones,
                locations,
                url
            } = req.body
            
            // Use a Query Builder to get the organization
            const organization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where('organization.id = :id',{id: organizationId})
                .orderBy(`organization.name`, `ASC`)
                .getOne()

            // Return the info of the organization in JSON format with the OK (200) status
            if (organization === null) return res
                .sendStatus(400)
                .json({
                    name: `ORGANIZATION NOT FOUND`,
                    message: `The organization searched doesn't exist within the platform`,
                    info: `No additional info provided`
                })
            
            
            // Update the attributes of the selected organization using a Query Builder
            await AppDataSource
            .createQueryBuilder()
            .update(Organization)
            .set({
                name: name,
                description: description,
                domain: domain,
                naics: naics,
                phones: phones,
                locations: locations,
                url: url
            })
            .where(`id = :id`, { id: organization.id })
            .execute()
            //return ok message
            return res
                .status(200)
                .json({
                    name: `Ok`,
                    message: `Ok`,
                    info: `No additional info provided`
                })

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
    // Function to create a new suboganization
    static CreateNewOrganization = async(req:Request, res: Response)=>{
        try{

            //request organization id from headers
            const organizationId = req.headers.organizationId

            //request organization info from body
            const {
                name,
                domain,
                naics,
                description,
                phones,
                locations,
                url,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to create an Organization, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`create`, `Organization`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to create a Organization`,
                    info: `No additional info provided`
                })
            
            // Use a Query Builder to get the organization
            const organization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where('organization.id = :id',{id: organizationId})
                .orderBy(`organization.name`, `ASC`)
                .getOne()

            // Return the info of the organization in JSON format with the OK (200) status
            if (organization === null) return res
            .sendStatus(400)
            .json({
                name: `ORGANIZATION NOT FOUND`,
                message: `The organization searched doesn't exist within the platform`,
                info: `No additional info provided`
            })
            
            // Validate that the user have both fields filled. If that's not the case, return an error message in JSON format with the BAD REQUEST (404) status
            if (![name, domain,phones].every(Boolean)) return res
                .status(400)
                .json({ message: "Missing Information" })
            
            const date = Date() as string;
            // Create an object to store the attributes of the user
            const newOrganization = Organization.create({
                name: name,
                domain: domain,
                phones: phones,
                organizationId: organization,
            })

            
            // Insert the created user object into the database using a Query Builder
            await AppDataSource
                .createQueryBuilder()
                .insert()
                .into(Organization)
                .values(newOrganization)
                .execute()

            return res
                    .status(200)
                    .json({ message: `Successfully Created` })

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
    // Function to get a list with the names of the sub-organizations
    static ListSubOrganizationsPaginated = async (req: Request, res: Response) => {

        try {
            // Get the page value from the URL
            const {page} = req.query
            // Validation to check if it isn't a valid page, and if it isn't valid, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!page || typeof page !== `string` || Array.isArray(page) || /[^0-9]/g.test(page)) return res
                .status(400)
                .json({ message: `The page ${page} doesn't exist` })
            //request organization id from headers
            const organizationId = req.headers.organizationId
            //request organization info from body
            const {
                permissions
            } = req.body

            // Check if the logged user has the right permissions to create an Organization, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`create`, `Organization`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to create a Organization`,
                    info: `No additional info provided`
                })
            
            // Use a Query Builder to get the organization
            const organization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where('organization.id = :id',{id: organizationId})
                .orderBy(`organization.name`, `ASC`)
                .getOne()

            // Return the info of the organization in JSON format with the OK (200) status
            if (organization === null) return res
            .sendStatus(400)
            .json({
                name: `ORGANIZATION NOT FOUND`,
                message: `The organization searched doesn't exist within the platform`,
                info: `No additional info provided`
            })

            // Use a Query Builder to get the name of each organization
            const organizationsNames: Organization[] | undefined = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where('organization.organizationId = :id',{id: organization.id})
                .orderBy(`organization.name`, `ASC`)
                .skip(parseInt(page) * 10 - 10)
                .take(10)
                .getMany()

                // Use a Query Builder to get the name of each organization
            const organizationsCount = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where('organization.organizationId = :id',{id: organization.id})
                .orderBy(`organization.name`, `ASC`)
                .getCount()
            
             // Build a response that will be sent to the front page
             const response: object = {
                info: {
                    itemsCount: organizationsNames.length,
                    totalItemsCount: organizationsCount,
                    nextPage: parseInt(page) * 10 >= organizationsCount ? true : false,
                    previousPage: page
                },
                data: organizationsNames
            }

            // Return the names of the organizations in JSON format with the OK (200) status
            if (typeof organizationsNames !== `undefined` && organizationsNames.length > 0) return res
                .status(200)
                .json(response)

            // Return the NO CONTENT (204) status
            return res
                .sendStatus(200)

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
    // Function to get a list with the names of the organizations and the domain of the main organization
    static ListSubOrganizationsAndOrganizationDomain = async (req: Request, res: Response) => {

        try {
            //request organization id from headers
            const organizationId = req.headers.organizationId
            //request organization info from body
            const {
                permissions
            } = req.body

            // Check if the logged user has the right permissions to create an Organization, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`create`, `Organization`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to create a Organization`,
                    info: `No additional info provided`
                })
            
            // Use a Query Builder to get the organization
            const organization: Organization | null = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where('organization.id = :id',{id: organizationId})
                .orderBy(`organization.name`, `ASC`)
                .getOne()

            // Return the info of the organization in JSON format with the OK (200) status
            if (organization === null) return res
            .sendStatus(400)
            .json({
                name: `ORGANIZATION NOT FOUND`,
                message: `The organization searched doesn't exist within the platform`,
                info: `No additional info provided`
            })

            // Use a Query Builder to get the name of each organization
            const organizationsNames: Organization[] | undefined = await AppDataSource
                .getRepository(Organization)
                .createQueryBuilder(`organization`)
                .where('organization.organizationId = :id',{id: organization.id})
                .orderBy(`organization.name`, `ASC`)
                .getMany()

            
             // Build a response that will be sent to the front page
             const response: object = {
                info: {
                    domain: organization.domain,
                    id: organization.id,
                },
                data: organizationsNames
            }

            // Return the names of the organizations in JSON format with the OK (200) status
            if (typeof organizationsNames !== `undefined` && organizationsNames.length > 0) return res
                .status(200)
                .json(response)

            // Return the NO CONTENT (204) status
            return res
                .sendStatus(200)

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

}