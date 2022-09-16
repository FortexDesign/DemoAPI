// Database Import
import { AppDataSource } from '../database/connection'

// Entities Imports
import { Person_Type as PersonType } from '../entities/Person_Type'
import { Person } from '../entities/Person'
import { Form } from '../entities/Form'
import { Form_Is_Type as FormIsType } from '../entities/Form_Is_Type'

// Modules Imports
import {
    Request,
    Response
} from 'express'
import {
    EntityManager,
    QueryRunner
} from 'typeorm'
import { validate } from 'uuid'

// Group of functions to control the CRUD requests for the person type entity
export default class PeopleTypeController {

    // Function to list the registered people types from the database
    static ListAllPeopleTypes = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the permissions attribute from the body of the request
            const { permissions } = req.body

            // Check if the logged user has the right permissions to list people types, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`read`, `Person Type`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to see a list with the people types`,
                    info: `No additional info provided`
                })

            // Create a Query Builder to get the people types stored into the database
            const peopleTypes: PersonType[] = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .leftJoinAndSelect('personType.formsAreTypesIds', `personTypeIsForm`)//,`form.id = formIsType.FORM_id`)
                .leftJoinAndSelect('personTypeIsForm.formId', `form`)//,`personType.id = formIsType.PERSON_TYPE_id`)
                .select([
                    `personType.id`,
                    `personType.name`,
                    `personType.description`,
                    `personType.status`,
                    `personTypeIsForm.id`,
                    `form.setting`
                ])
                .getMany()

            // Return the people types list in JSON format with the OK (200) status
            return res
                .status(200)
                .json(peopleTypes)

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

    // Function to list the registered people types from the database but paginated
    static ListPeopleTypesPaginated = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the page value from the URL
            const {
                page,
                itemsPerPage
            } = req.query

            // Get the permissions attribute from the body of the request
            const { permissions } = req.body

            // Check if the logged user has the right permissions to list people types, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`read`, `Person Type`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to see a list with the people types`,
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
            const peopleTypesCount: number = await AppDataSource
                .getRepository(PersonType)
                .count()

            // Create a Query Builder to get the people types stored into the database using pagination
            const peopleTypes: PersonType[] = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .leftJoinAndSelect('personType.formsAreTypesIds', 'personTypeIsForm')
                .leftJoinAndSelect('personTypeIsForm.formId', 'form')
                .select([
                    `personType.id`,
                    `personType.name`,
                    `personType.description`,
                    `personType.status`,
                    'personTypeIsForm.id',
                    `form.setting`
                ])
                .orderBy('personType.name', 'ASC')
                .skip(skipValue)
                .take(amountValues)
                .getMany()

            // Build a response that will be sent to the front page
            const response: object = {
                info: {
                    itemsCount: peopleTypes.length,
                    totalItemsCount: peopleTypesCount,
                    nextPage: parseInt(page) * amountValues >= peopleTypesCount,
                    previousPage: page
                },
                data: peopleTypes
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

    // Function to get a list with the names of the people types for the filter
    static ListPeopleTypesByName = async (req: Request, res: Response) => {

        // Error Handling
        try {

            // Get the permissions attribute from the body of the request
            const { permissions } = req.body

            // Check if the logged user has the right permissions to list people types, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`read`, `Person Type`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to see a list with the people types`,
                    info: `No additional info provided`
                })

            // Use a Query Builder to get the name of each person type
            const peopleTypesNames: PersonType[] = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .select(`personType.name`)
                .where(`personType.status = :status`, { status: true })
                .orderBy(`personType.name`, `ASC`)
                .getMany()

            // Return the names of the people types in JSON format with the OK (200) status
            return res
                .status(200)
                .json(peopleTypesNames)

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

    // Method to add a new person type within the platform
    static CreatePersonType = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the attributes for name, description, configuration and permissions from the body of the request
            const {
                name,
                description,
                configuration,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to create a person type, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`create`, `Person Type`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to create a person type`,
                    info: `No additional info provided`
                })

            // Check if there is a person type whose name is the one submitted within the form using a Query Builder
            const verifyPersonType: PersonType | null = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.name = :name`, { name: name })
                .getOne()

            // If the person type with the submitted name is already registered and it's not the same as the one being edited, then return a personalized error schema in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (verifyPersonType) return res
                .status(409)
                .json({
                    name: `PersonTypeNameAlreadyRegistered`,
                    message: `${name} is already registered as a person type`,
                    info: `No additional info provided`
                })

            // Create a child from the main database source
            const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

            // Initialize the database connection through the child source
            await queryRunner.connect()

            // Create a transaction that will be executed using the child source
            await queryRunner.startTransaction()

            // Watch over the transaction looking for any error that might appear
            try {

                // Set a manager to manage the transactions easier
                const databaseOperations: EntityManager = queryRunner.manager

                // Create an object to store the attributes of the person type
                const personType: PersonType = PersonType.create({
                    name: name,
                    description: description
                })

                // Save the formConfig as a JSON
                const formConfiguration: JSON = configuration as JSON

                // Create an object to store the attributes of the form
                const formSave: Form = Form.create({
                    setting: formConfiguration
                })

                // Insert the created form object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(Form)
                    .values(formSave)
                    .execute()

                // Insert the created person type object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(PersonType)
                    .values(personType)
                    .execute()

                // Create the formIsType object
                const formIsType: FormIsType = FormIsType.create({
                    formId: formSave,
                    personTypeId: personType
                })

                // Insert the created formIsType object into the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .insert()
                    .into(FormIsType)
                    .values(formIsType)
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a personalized success schema in JSON format with the CREATED (201) status - SUCCESS
                return res
                    .status(201)
                    .json({
                        name: `PersonTypeCreated`,
                        message: `The person type ${personType.name} was successfully created`,
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

    // Method to edit a person type within the platform
    static EditPersonType = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the id attribute from the query of the request
            const { id } = req.query

            // Get the attributes for name, description and permissions from the body of the request
            const {
                name,
                description,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to edit a person type, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`update`, `Person Type`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to edit a person type`,
                    info: `No additional info provided`
                })

            // Check if the id exists, and if it doesn't, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!id) return res
                .status(400)
                .json({
                    name: `IdNotSubmitted`,
                    message: `No ID was provided to check`,
                    info: `No additional info provided`
                })

            // Check if it's a valid id, and if it isn't, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (typeof id !== `string` || Array.isArray(id) || !validate(id)) return res
                .status(400)
                .json({
                    name: `IdNotValid`,
                    message: `The ID doesn't belong to any registered person type`,
                    info: `No additional info provided`
                })

            // Check if there is a person type with a certain ID registered within the platform using a Query Builder
            const personType: PersonType | null = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.id = :id`, { id: id })
                .getOne()

            // If it doesn't exist a person type with said ID, then return a personalized error schema in JSON format with the NOT FOUND (404) status - ERROR LEVEL 1
            if (!personType) return res
                .status(404)
                .json({
                    name: `PersonTypeDoesNotExist`,
                    message: `The person type with id '${id}' doesn't exist`,
                    info: `No additional info provided`
                })

            // Check if there is a person type whose name is the one submitted within the form using a Query Builder
            const verifyPersonType: PersonType | null = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.name = :name`, { name: name })
                .getOne()

            // If the person type with the submitted name is already registered and it's not the same as the one being edited, then return a personalized error schema in JSON format with the CONFLICT (409) status - ERROR LEVEL 1
            if (verifyPersonType && verifyPersonType.id !== id) return res
                .status(409)
                .json({
                    name: `PersonTypeNameAlreadyRegistered`,
                    message: `${name} is already registered as a person type`,
                    info: `No additional info provided`
                })

            // Update the attributes of the selected person type within the platform using a Query Builder
            await AppDataSource
                .createQueryBuilder()
                .update(PersonType)
                .set({ name: name, description: description })
                .where(`id = :id`, { id: id })
                .execute()

            // Return a personalized success schema in JSON format with the OK (200) status - SUCCESS
            return res
                .status(200)
                .json({
                    name: `PersonTypeSuccessfullyUpdated`,
                    message: `The person type was updated successfully`,
                    info: `No additional info provided`
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

    // Method to delete a person type within the platform
    static DeletePersonType = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the id attribute from the query of the request
            const { id } = req.query

            // Get the permissions attribute from the body of the request
            const { permissions } = req.body

            // Check if the logged user has the right permissions to delete a person type, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`delete`, `Person Type`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to delete a person type`,
                    info: `No additional info provided`
                })

            // Check if the id exists, and if it doesn't, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!id) return res
                .status(400)
                .json({
                    name: `IdNotSubmitted`,
                    message: `No ID was provided to check`,
                    info: `No additional info provided`
                })

            // Check if it's a valid id, and if it isn't, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (typeof id !== `string` || Array.isArray(id) || !validate(id)) return res
                .status(400)
                .json({
                    name: `IdNotValid`,
                    message: `The ID doesn't belong to any registered person type`,
                    info: `No additional info provided`
                })

            // Create a Query Builder to check if there is a person type with a certain ID
            const personType = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.id = :id`, { id: id })
                .getOne()

            // If it doesn't exist a person type with said ID, then return an error message in JSON format with the NOT FOUND (404) status
            if (!personType) return res
                .status(404)
                .json({ message: `The person type with id '${id}' doesn't exist` })

            // Create a Query Builder to check if the person type is assigned to a person
            const assignedPeople = await AppDataSource
                .getRepository(Person)
                .createQueryBuilder(`people`)
                .where(`people.personTypeId = :personType`, { personType: personType.id })
                .getCount()

            // If it's assigned to at least one person, then return an error message in JSON format with the CONFLICT (409) status
            if (assignedPeople) return res
                .status(409)
                .json({ message: `The person type ${personType.name} is being used by ${assignedPeople} ${assignedPeople == 1 ? `person` : `people`}` })

            // Create a child from the main database source
            const queryRunner: QueryRunner = AppDataSource.createQueryRunner()

            // Initialize the database connection through the child source
            await queryRunner.connect()

            // Create a transaction that will be executed using the child source
            await queryRunner.startTransaction()

            // Watch over the transaction looking for any error that might appear
            try {

                // Set a manager to manage the transactions easier
                const databaseOperations: EntityManager = queryRunner.manager
            
                // Delete a person type from the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .delete()
                    .from(FormIsType)
                    .where(`personTypeId = :id`, { id: id })
                    .execute()

                // Delete a person type from the database using a Query Builder
                await databaseOperations
                    .createQueryBuilder()
                    .delete()
                    .from(PersonType)
                    .where(`id = :id`, { id: id })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

                // Return a personalized success schema in JSON format with the OK (200) status - SUCCESS
                return res
                    .status(200)
                    .json({
                        name: `PersonTypeSuccessfullyDeleted`,
                        message: `The person type was deleted successfully`,
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

    // Method to assign a person type to a person
    static AssignTypeToPerson = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the values of personid and typeid from the body of the request
            const {
                personid,
                typename,
                permissions
            } = req.body

            // Check if the logged user has the right permissions to assign a person type, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`assign`, `Person Type`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to assign a person type`,
                    info: `No additional info provided`
                })

            // If a name wasn't submitted, then return an error message in JSON format with the BAD REQUEST (400) status
            if (!typename) return res
                .status(400)
                .json({ message: `The name field is required to edit a person type. It can't be empty` })

            // Create a Query Builder to check if there is a person type whose name is the one submitted within the form
            const verifyPersonType = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.Name = :name`, { name: typename })
                .getOne()
            //Verify that the person type query has something
            if (!verifyPersonType) return res
                .status(409)
                .json({ message: `The person type '${typename}' doesn't exist` })
            //Edits the person with a type
            await AppDataSource
                .createQueryBuilder()
                .update(Person)
                .set({ personTypeId: verifyPersonType })
                .where(`id = :id`, { id: personid })
                .execute()
            // Return ok message with the OK (201) status
            return res
                .status(200)
                .json("OK")

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

    // Method to change the status of a person type
    static ChangeStatus = async (req: Request, res: Response) => {

        // Error Handling for the method
        try {

            // Get the values of typeid from the query of the request
            const { typeid } = req.query

            // Get the permissions attribute from the body of the request
            const { permissions } = req.body

            // Check if the logged user has the right permissions to edit a person type, and if it hasn't them, then return a personalized error schema in JSON format with the FORBIDDEN (403) status - ERROR LEVEL 1
            if (!permissions.can(`update`, `Person Type`)) return res
                .status(403)
                .json({
                    name: `ForbiddenAccess`,
                    message: `You don't have the required permissions to edit a person type`,
                    info: `No additional info provided`
                })

            // Check if the id exists, and if it doesn't, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (!typeid) return res
                .status(400)
                .json({
                    name: `IdNotSubmitted`,
                    message: `No ID was provided to check`,
                    info: `No additional info provided`
                })

            // Check if it's a valid id, and if it isn't, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 1
            if (typeof typeid !== `string` || Array.isArray(typeid) || !validate(typeid)) return res
                .status(400)
                .json({
                    name: `IdNotValid`,
                    message: `The ID doesn't belong to any registered person type`,
                    info: `No additional info provided`
                })

            // Create a Query Builder to check if there is a person type whose name is the one submitted within the form
            const verifyPersonType = await AppDataSource
                .getRepository(PersonType)
                .createQueryBuilder(`personType`)
                .where(`personType.id = :id`, { id: typeid })
                .getOne()

            //verify if there is a person type
            if (!verifyPersonType) return res
                .status(409)
                .json({ message: `The person type '${verifyPersonType}' doesn't exist` })

            // Update the attributes of the selected person type into the database using a Query Builder
            await AppDataSource
                .createQueryBuilder()
                .update(PersonType)
                .set({ status: !verifyPersonType.status })
                .where(`id = :id`, { id: verifyPersonType.id })
                .execute()

            // Return the OK (200) status
            return res
                .status(200) 
                .json(`Ok`)

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