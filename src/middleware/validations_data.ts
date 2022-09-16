import {
    NextFunction,
    Request,
    RequestHandler,
    Response
} from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import {
    PermissionsAssignationBodyRequest,
    PermissionsAssignationQueryRequest
} from '../controllers/libs/interface_definition'
import {
    AnyObjectSchema,
    array,
    boolean,
    object,
    string
} from 'yup'

export const Validate = (schema: AnyObjectSchema) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        try {

            // Get the result of the validations from the data received
            /* const data =  */await schema.validate(req.body)

            // For testing
            /* console.log(`Data: `, data) */

            // Continue to the next function if the validations were successful
            return next()

        } catch (error) {

            // If the error is detected without any issues, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 2
            if (error instanceof Error) return res
                .status(400)
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

export const ValidatePermitAssignation = (schema: AnyObjectSchema) => {

    return async (req: Request<ParamsDictionary, unknown, PermissionsAssignationBodyRequest, PermissionsAssignationQueryRequest, Record<string, any>>, res: Response<unknown, Record<string, any>>, next: NextFunction) => {

        try {

            // Get the result of the validations from the data received
            /* const data =  */await schema.validate(req.body)

            // For testing
            /* console.log(`Data: `, data) */

            // Continue to the next function if the validations were successful
            return next()

        } catch (error) {

            // If the error is detected without any issues, then return a personalized error schema in JSON format with the BAD REQUEST (400) status - ERROR LEVEL 2
            if (error instanceof Error) return res
                .status(400)
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

export const RegisterUserValidation = {
    data: object().shape({
        firstName: 
            string()
            .required(`The first name is mandatory to create a user`)
            .min(3, `The first name must have a minimum length of three (3) characters`)
            .max(20, `The first name must have a maximum length of twenty (20) characters`),
        lastName: 
            string()
            .required(`The last name is mandatory to create a user`)
            .min(3, `The last name must have a minimum length of three (3) characters`)
            .max(20, `The last name must have a maximum length of twenty (20) characters`),
        organization: 
            string()
            .max(20, `The organization must have a maximum length of twenty (20) characters`),
        email: 
            string()
            .email(`The value set on the email field is not a valid email`)
            .required(`The email is mandatory to create a user`)
            .max(120, `The email must have a maximum length of one hundred twenty (120) characters`),
        password: 
            string()
            .required(`The password is mandatory to create a user`)
            .min(8, `The password must have a minimum length of eight (8) characters`)
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\{\}\(\)\[\]#:;^,.?!|&_\`~@$%/\\=+\-*\"\'>< ])[A-Za-z0-9\{\}\(\)\[\]#:;^,.?!|&_\`~@$%/\\=+\-*\"\'>< ]{8,}$/g,
                `The password must contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9) and one special character from the ones shown in this list: 
                {}()[]#:;^,.?!|&_\`~@$%/\\=+-*"'>< `)
    })
}

export const LoginUserValidation = {
    data: object().shape({
        email: 
            string()
            .email(`The value set on the email field is not a valid email`)
            .required(`The email of the user is mandatory to access the platform`)
            .max(120, `The email must have a maximum length of one hundred twenty (120) characters`),
        password: 
            string()
            .required(`The password of the user is mandatory to access the platform`)
            .min(8, `The password must have a minimum length of eight (8) characters`)
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\{\}\(\)\[\]#:;^,.?!|&_\`~@$%/\\=+\-*\"\'>< ])[A-Za-z0-9\{\}\(\)\[\]#:;^,.?!|&_\`~@$%/\\=+\-*\"\'>< ]{8,}$/g,
                `The password must contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9) and one special character from the ones shown in this list: 
                {}()[]#:;^,.?!|&_\`~@$%/\\=+-*"'>< `)
    })
}

export const SendRecoveryEmailValidation = {
    data: object().shape({
        email: 
            string()
            .email(`The value set on the email field is not a valid email`)
            .required(`The email is mandatory to access the platform`)
            .max(120, `The email must have a maximum length of one hundred twenty (120) characters`)
    })
}

export const NewPasswordValidation = {
    data: object().shape({
        newPassword: 
            string()
            .required(`The password is mandatory to access the platform`)
            .min(8, `The password must have a minimum length of eight (8) characters`)
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\{\}\(\)\[\]#:;^,.?!|&_\`~@$%/\\=+\-*\"\'>< ])[A-Za-z0-9\{\}\(\)\[\]#:;^,.?!|&_\`~@$%/\\=+\-*\"\'>< ]{8,}$/g,
                `The password must contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9) and one special character from the ones shown in this list: 
                {}()[]#:;^,.?!|&_\`~@$%/\\=+-*"'>< `)
    })
}

export const UpdateUserInfoValidation = {
    data: object().shape({
        firstName: 
            string()
            .required(`The first name is mandatory to create a user`)
            .min(3, `The first name must have a minimum length of three (3) characters`)
            .max(20, `The first name must have a maximum length of twenty (20) characters`),
        lastName: 
            string()
            .required(`The last name is mandatory to create a user`)
            .min(3, `The last name must have a minimum length of three (3) characters`)
            .max(20, `The last name must have a maximum length of twenty (20) characters`),
        userColor: 
            string()
            .max(7, `The value for the color is not valid`)
    })
}

export const UpdateUserPasswordValidation = {
    data: object().shape({
        password: 
            string()
            .required(`The password is mandatory to access the platform`)
            .min(8, `The password must have a minimum length of eight (8) characters`)
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\{\}\(\)\[\]#:;^,.?!|&_\`~@$%/\\=+\-*\"\'>< ])[A-Za-z0-9\{\}\(\)\[\]#:;^,.?!|&_\`~@$%/\\=+\-*\"\'>< ]{8,}$/g,
                `The password must contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9) and one special character from the ones shown in this list: 
                {}()[]#:;^,.?!|&_\`~@$%/\\=+-*"'>< `)
    })
}

export const UpdateUserImageValidation = {
    data: object().shape({
        base64file: string()
    })
}

export const CreatePersonTypeValidation = {
    data: object().shape({
        name: 
            string()
            .required(`The permission has to have a name`)
            .max(20, `The name of the person type must have a maximum length of twenty (20) characters`),
        description:
            string(),
        configuration:
            object()
            .json()
            .required(`The configuration for the form linked to the person type is mandatory`)
    })
}

export const EditPersonTypeValidation = {
    data: object().shape({
        name: string().required().max(20),
        description: string(),
        configuration: string()
    })
}

export const CreatePersonValidation = {
    data: object().shape({
        firstName: 
            string()
            .required(`The first name is mandatory to create a user`)
            .min(3, `The first name must have a minimum length of three (3) characters`)
            .max(20, `The first name must have a maximum length of twenty (20) characters`),
        lastName: 
            string()
            .required(`The last name is mandatory to create a user`)
            .min(3, `The last name must have a minimum length of three (3) characters`)
            .max(20, `The last name must have a maximum length of twenty (20) characters`),
        user: 
            string()
            .email(`The value set on the email field is not a valid email`)
            .required(`The email is mandatory to access the platform`)
            .max(120, `The email must have a maximum length of one hundred twenty (120) characters`),
        personType: string().required().max(20),
        emails: array(),
        telephones:
            array()
            .of(
                object()
                .json()
            ),
        additionalInfo: object().json()
    })
}

export const EditPersonValidation = {
    data: object().shape({
        firstName: 
            string()
            .required(`The first name is mandatory to create a user`)
            .min(3, `The first name must have a minimum length of three (3) characters`)
            .max(20, `The first name must have a maximum length of twenty (20) characters`),
        lastName: 
            string()
            .required(`The last name is mandatory to create a user`)
            .min(3, `The last name must have a minimum length of three (3) characters`)
            .max(20, `The last name must have a maximum length of twenty (20) characters`),
        personType: string().required().max(20),
        emails: array(),
        telephones: object().json(),
        additionalInfo: object().json()
    })
}

export const CreateRoleValidation = {
    data: object().shape({
        name:
            string()
            .required(`The name of the role is mandatory to create a role`)
            .max(20, `The name of the role must have a maximum length of twenty (20) characters`),
        description:
            string()
            .max(200, `The description of the role must have a maximum length of two hundred (200) characters`),
        organization:
            string()
            .required(`The name of the organization is mandatroy to create a role`)
            .max(20, `The name of the organization must have a maximum length of twenty (20) characters`)
    })
}

export const CreatePermissionCategoryValidation = {
    data: object().shape({
        name:
            string()
            .required(`The category has to have a name`)
            .max(30, `The name of the category must have a maximum length of thirty (30) characters`)
    })
}

export const CreatePermissionValidation = {
    data: object().shape({
        name:
            string()
            .required(`The permission has to have a name`)
            .max(30, `The name of the permission must have a maximum length of thirty (30) characters`),
        isForWorkspace:
            boolean(),
        action:
            array()
            .required(`The permission has to have an action`)
            .of(
                string()
                .oneOf([`create`, `read`, `update`, `assign`, `delete`, `manage`], `The specified action doesn't exist`)
                .max(6, `The specified action must have a maximum length of six (6) characters`)
            ),
        subject:
            array()
            .required(`The permission has to have a subject`)
            .of(
                string()
                .max(30, `The specified subject must have a maximum length of thirty (30) characters`)
            ),
        fields:
            array(),
        conditions:
            object().json(),
        inverted:
            boolean(),
        reason:
            string()
            .max(60, `The specified reason must have a maximum length of sixty (60) characters`),
        category:
            string()
            .required(`The permiision has to belong to a category`)
            .max(30, `The name of the category must have a maximum length of thirty (30) characters`)
    })
}

export const ManagePermissionToPersonValidation = {
    data: object().shape({
        permission:
            string()
            .required(`The permission has to be defined in order to link it to a person`)
            .max(30, `The name of the permission must have a maximum length of thirty (30) characters`),
        user:
            string()
            .email(`The email of the user is not valid`)
            .required(`The email of the user has to be defined to be able to receive a new permission`)
            .max(120, `The email of the user must have a maximum length of one hundred twenty (120) characters`)
    })
}

export const ManagePermissionActivation = {
    data: object().shape({
        newPermissionsList:
            array()
            .required(`The list with the id of the active permissions is required`)
            .of(
                string()
                .uuid(`All of the elements within the array must have a valid format (UUID)`)
            )
    })
}