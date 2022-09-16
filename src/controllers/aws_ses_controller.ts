// Database Import
import { AppDataSource } from '../database/connection'

// Entity Import
import { User } from '../entities/User'

// Lib Import
import { sesClient } from './libs/ses_client'

// Modules Imports
import { SendEmailCommand, SendEmailCommandOutput } from '@aws-sdk/client-ses'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { EntityManager, QueryRunner } from 'typeorm'

// Configurate the location of the .env file
dotenv.config({ path: '.env' })

// Group of functions to control the email sending
export default class AmazonSESController {

    // Function to send the verification email to the registered email
    static sendVerifyEmail = async (email: string) => {

        // Error Handling
        try {

            // Use a Query Builder to get a user by its email
            const user: User | null = await AppDataSource
                .getRepository(User)
                .createQueryBuilder(`user`)
                .where(`user.email = :email`, { email: email })
                .getOne()
            
            // If it doesn't exist, then return an error message
            if (!user) throw new Error(`An error ocurred while creating the user`)

            // Take the id of the user to make a new reset token from JWT
            const id: string = user.id
            
            // Create a new jsonwebtoken to save into the database so the user can only change the password with that specific token
            const token: string = jwt.sign({ id: id }, process.env.JWT_SECRET_VALIDATE || '', {
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
                    .set({ validationToken: token })
                    .where(`id = :id`, { id: id })
                    .execute()

                // Commit the operations from the transaction into the database
                await queryRunner.commitTransaction()

                // Ends the connection made by the child source to the database
                await queryRunner.release()

            } catch (error) {

                // Undo the changes made by the transaction if an error happened
                await queryRunner.rollbackTransaction()
                
                // Ends the connection made by the child source to the database
                await queryRunner.release()

                const response: object = {
                    name: error.name,
                    message: error.message,
                    info: error.stack || `No additional info provided`
                }
                
                // Return an error message
                throw new Error()

            }

            // Create the verification URL using the environment variable for the URL and the ID of the user
            const verifyLink: string = `http://${process.env.API_WEBPAGE}/api/v1/verify-email/${token}`

            // Create the send command with the content of the email
            const data: SendEmailCommandOutput = await sesClient.send(new SendEmailCommand({

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
                        Data: `Confirm your account`
                    },

                    // Define the body of the message that can be set with raw text or using HTML
                    Body: {
                        Html: {
                            Charset: `UTF-8`,
                            Data: 
                                `<table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
                                    <tr>
                                        <td valign="middle" class="hero bg_white" style="padding: 2em 0 4em 0;">
                                            <table>
                                                <tr>
                                                    <td>
                                                        <div class="text" style="padding: 0 2.5em; text-align: center;">
                                                            <h2>Welcome to Dextra</h2>
                                                            <h3>Thanks for creating an account for the Dextra's platform. To verify your account, just click the following button:</h3>
                                                            <h3><a href="${verifyLink}" class="btn btn-primary">Verify your account</a></h3>
                                                            <h3>Or paste it in your browser:</h3>
                                                            <h3>${verifyLink}</h3>
                                                            <h3>If it wasn't you, you can safely ignore this message. Thank you.</h3>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>`
                        }
                    }
                },

                // Define the email of the sender
                Source: process.env.MAIL_TEST,

                // Define the emails that will receive a reply from the email (the sender is set by default)
                ReplyToAddresses: []

            }))

            // Info for test only
            console.log(`Success: ${ data.MessageId }`)
            
            // For unit tests
            return data

        } catch (error) {

            const response: object = {
                name: error.name,
                message: error.message,
                info: error.stack || `No additional info provided`
            }

            console.log(response)

            // Return void
            return

        }

    }

}