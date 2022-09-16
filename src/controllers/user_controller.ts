import { NextFunction, Request, Response } from 'express'
import { User } from '../entities/User'
import mime from 'mime';
import * as AWS from "@aws-sdk/client-s3"
import { AWSS3Client } from './libs/s3_client'
import dotenv from 'dotenv'
import { AppDataSource } from '../database/connection';
import { Person as People, Person } from '../entities/Person';
import bcryptjs from 'bcryptjs'
import { Permission } from '../entities/Permission';
import { CapitalizeString } from './libs/string_manipulation';
import { EntityManager, QueryRunner } from 'typeorm';
import { PermissionRule } from './libs/type_definition';

dotenv.config({ path: '.env' })
const s3 = new AWS.S3(AWSS3Client)

class UserController {

    //function to use the user image
    static UseUserImage = async (req: Request, res: Response) => {
        // Error Handling
        try {
            //request userauth from body
            const userauth = req.headers.userauth
            //search user by id
            const user = await User.findOneBy({ id: userauth as string })
            //validate if user its empty (if found any values with that id)
            if (!user) {
                return res.status(400).json({ message: 'Server err' })
            }
            let image = ""

            if (user.image != null && user.image != "null") {
                //build the url to use the image
                image = `https://` + process.env.BUCKET_LINK + user.image
            } else {
                //response that indicates that the user does not have any image
                image = `NoImage`
            }


            return res.status(200).json(image);
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
    //function to list the user info
    static ListUserInfo = async (req: Request, res: Response) => {
        // Error Handling
        try {

            //request userauth from body
            const userauth = req.headers.userauth

            //search user by id
            const user = await User.findOneBy({ id: userauth as string })
            //validate if user its empty (if found any values with that id)
            if (!user) {
                return res.status(400).json({ message: 'Server err' })
            }

            // Create a Query Builder to check if the submitted user is already linked with other person from the platform
            const person = await AppDataSource
                .getRepository(People)
                .createQueryBuilder(`person`)
                .where(`person.userId = :user`, { user: user.id })
                .getOne()

            //validate if person its empty (if found any values with that email)
            if (!person) {
                return res.status(400).json({ message: 'Server err' })
            }
            // Return the user info list in JSON format with the OK (200) status
            const jsonresponse = {
                id: user.id,
                firstName: person.firstName,
                lastName: person.lastName,
                color: user.color
            }
            return res
                .status(200)
                .json(jsonresponse)

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
    //function to list the user info
    static ListLessUserInfo = async (req: Request, res: Response) => {
        // Error Handling
        try {

            //request userauth from body
            const userauth = req.headers.userauth

            //search user by id
            const user = await User.findOneBy({ id: userauth as string })
            //validate if user its empty (if found any values with that id)
            if (!user) {
                return res.status(400).json({ message: 'Server err' })
            }

            // Create a Query Builder to check if the submitted user is already linked with other person from the platform
            const person = await AppDataSource
                .getRepository(People)
                .createQueryBuilder(`person`)
                .where(`person.userId = :user`, { user: user.id })
                .getOne()

            //validate if person its empty (if found any values with that email)
            if (!person) {
                return res.status(400).json({ message: 'Server err' })
            }
            // Return the user info list in JSON format with the OK (200) status
            const jsonresponse = {
                user:{
                    id: user.id,
                    name: person.firstName
                }
            }
            return res
                .status(200)
                .json(jsonresponse)

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
    //function to change the user info
    static ChangeUserInfo = async (req: Request, res: Response) => {
        // Error Handling
        try {
            //request firstName, lastName  and userColor from body
            const { firstName, lastName, userColor } = req.body

            //request userauth from body
            const userauth = req.headers.userauth

            //validate if any field its empty
            if (![firstName, lastName, userColor].every(Boolean)) {
                return res.status(400).json({ message: 'all the fields need to be filled' })
            }
            if (firstName.length > 20 || lastName.length > 20) {
                return res.status(400).json({ message: 'First Name or Last Name too long' })
            }

            //search user by id
            const user = await User.findOneBy({ id: userauth as string })
            //validate if user its empty (if found any values with that id)
            if (!user) {
                return res.status(400).json({ message: 'Server err' })
            }

            // Create a Query Builder to check if the submitted user is already linked with other person from the platform
            const person = await AppDataSource
                .getRepository(People)
                .createQueryBuilder(`person`)
                .where(`person.userId = :user`, { user: user.id })
                .getOne()

            //validate if person its empty (if found any values with that email)
            if (!person) {
                return res.status(400).json({ message: 'Server err' })
            }

            //set values for the user in hte database
            console.log(userColor);
            
            user.color = userColor.slice(1)
            person.lastName = lastName
            person.firstName = firstName

            //save in the database
            user.save()
            person.save()

            return res.status(200).json("OK");
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
    //function to change the user image
    static ChangeUserImage = async (req: Request, res: Response) => {

        //request body from the page
        const { base64file } = req.body

        //request userauth from body
        const userauth = req.headers.userauth

        console.log(userauth)
        
        //search user by id
        const user = await User.findOneBy({ id: userauth as string })

        //validate if user its empty (if found any values with that id)
        if (!user) {
            return res.status(400).json({ message: 'Server err' })
        }
        //save the base 64 in a variable
        let compareBase = base64file as string
        //save the regex in a variable
        let expression = /^data:([A-Za-z-+/]+);base64,(.+)$/
        //compare that the base 64 file matches a base 64 Syntaxis and exploding it in 3 items
        let matches = compareBase.match(expression)
        //validate that the mariable matches its not empty
        if (!matches) {
            return res.status(400).json({ message: 'Server err' })
            //check if the variable matches does not match the regex
        } else if (matches.length !== 3) {
            return new Error('Invalid input string');
        }
        //Order the items inside the match array (the buffer its about raw binary data,act like arrays of integers, but are not resizable)
        let decodedImg = { type: matches[1], data: Buffer.from(matches[2], 'base64') };
        //Take the extension code and transforms it into a normal myme type
        let extension = mime.extension(decodedImg.type);
        //Save the file name with a date because maazon replaces images with the same name
        let fileName = `userimage${Date.now()}.` + extension;
        try {
            //Create the new file in amazon S3 
            const result = await s3.putObject({
                Bucket: process.env.BUCKET_NAME as string,
                Key: "Images/" + fileName,
                Body: decodedImg.data,
                ContentType: mime.lookup(fileName)
            })
            //save the name in the user database so we can use it later
            user.image = fileName;
            //save the user changes in the database
            user.save()
        } catch (error) {

            // Return an error message in JSON format with the INTERNAL SERVER ERROR (500) status
            if (error instanceof Error) return res
                .status(500)
                .json({ message: error.message })

            // Return the INTERNAL SERVER ERROR (500) status
            return res
                .sendStatus(500)

        }

        return res.status(200).json("OK");
    }
    //function to change the user password inside the manage user interface
    static CreateNewPassword = async (req: Request, res: Response) => {
        try{
            //request body from the page
            const {newPassword} = req.body

            if (!newPassword) {
                return res.status(400).json({ message: 'all the fields need to be filled' })
            }
            //request userauth from body
            const userauth = req.headers.userauth
            
            const user = await User.findOneBy({ id: userauth as string })
            //validate if user its empty (if found any values with that id)
            if (!user) {
                return res.status(400).json({ message: 'Server err' })
            }

            //encrypt the new passwotd
            let passHash = await bcryptjs.hash(newPassword, 10)
            //update the user with the new encrypted password with query builder
            await User
                .createQueryBuilder()
                .update(User)
                .set({ password: passHash})
                .where("id = :id", { id: user.id })
                .execute()

            return res.sendStatus(200)
        } catch (error) {
            console.log(error);
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

export default UserController
