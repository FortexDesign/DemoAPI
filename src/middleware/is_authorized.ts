import { Ability } from '@casl/ability'
import { NextFunction, Request, Response } from 'express'

export const defineAbilityFor = async (req: Request, res: Response, next: NextFunction) => {

    const { permissions } = req.body

    // Check if the permissions constant is empty, and if that's true, then return an error message in JSON format with the FORBIDDEN (403) status
    if (!permissions) return res
        .status(403)
        .json({
            name: `ForbiddenAccess`,
            message: `You don't have any permissions assigned`,
            info: `No additional info provided`
        })

    // Store the Ability object with the permissions for the user within the permissions attribute from the body of the request
    req.body.permissions = new Ability(permissions)

    // Proceed with the next method
    return next()

}