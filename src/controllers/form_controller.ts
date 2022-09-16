import { Request, Response } from 'express'
import dotenv from 'dotenv'
import { AppDataSource } from '../database/connection'
import { Form } from '../entities/Form'

export default class FormController {

    // Function to edit a person from the database
    static AutoSaveForm = async (req: Request, res: Response) => {

        // Error Handling
        try {
            //destructurize the formId and formConfig values from the body
            const {id,formconfig} = req.body
            //validate that both variables have values
            if (!formconfig || !id) return res
                .status(500)
                .json({ message: `Internal Server Error` })

            //save the formConfig as json
            const formConfiguration = formconfig as JSON
            //save the formid as string
            const formid = id
            // Create a Query Builder to check if there is a form with the same id
            const verifyForm = await AppDataSource
            .getRepository(Form)
            .createQueryBuilder(`form`)
            .where(`form.id = :id`, { id: formid })
            .getOne()

            // If the form with the submitted id is already registered
            if (verifyForm){
                // update the form object into the database using a Query Builder
                await AppDataSource
                .createQueryBuilder()
                .update(Form)
                .set({ setting: formConfiguration })
                .where(`id = :id`, { id: formid })
                .execute()

            }else{
                // Create an object to store the attributes of the form
                const formSave = Form.create({
                    id: formid,
                    setting: formConfiguration
                })

                // Insert the created form object into the database using a Query Builder
                await AppDataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Form)
                    .values(formSave)
                    .execute()
            }
            // Return the OK (200) status
            return res
                .status(200)
                .json("OK")


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
    static RetieveForm = async (req: Request, res: Response) => {

        // Error Handling
        try {
            //destructurize the formId value from the body
            const {id} = req.body
            //validate that both variables have values
            if (!id) return res
                .status(500)
                .json({ message: `Internal Server Error` })

            //save the formid as int
            const formid = parseInt(id)
            // Create a Query Builder to check if there is a form with the same id
            const verifyForm = await AppDataSource
            .getRepository(Form)
            .createQueryBuilder(`form`)
            .where(`form.id = :id`, { id: formid })
            .getOne()

            // If the form with the submitted id does not exist
            if (!verifyForm)
                return res
                .status(500)
                .json({ message: `Internal Server Error` })

            // Return the form configuration in JSON format with the OK (200) status
            return res
                .status(200)
                .json(verifyForm?.setting)


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