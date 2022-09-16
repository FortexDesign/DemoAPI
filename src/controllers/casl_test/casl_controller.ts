import { Ability, AbilityBuilder, ForbiddenError } from '@casl/ability'
import { Request, Response } from 'express'

import { Person_Type as PersonType } from '../../entities/Person_Type'

const defineAbility = () => {

    const { can: allow, cannot: forbid, build } = new AbilityBuilder(Ability)

    // allow('manage', 'all')
    allow(['manage', 'create', 'delete'], 'personType')
    allow('read', 'personType')
    //allow('update', 'Post', ['content'], { authorId: user.id })

    return build()

}

class Post {

    authorId: number
    content: string
    isPublished: boolean

    constructor(authorId: number) {

        this.authorId = authorId
        this.content = ``
        this.isPublished = false

    }

}

export const caslTest = (req: Request, res: Response) => {

    const personType = PersonType.create({
        name: `Admin`,
        description: `This is an admin`
    })

    const user = {
        id: 5,
        isAdmin: false
    }

    const ability = defineAbility()

    /* try {
        ForbiddenError.from(ability).throwUnlessCan('delete', personType)
        return 'Ok'
    } catch (error) {
        return error.message
    } */

    return res
        .status(200)
        .json({ info: ability.can(`update`, `personType`) })

}

// https://www.youtube.com/watch?v=YLihWZwLaGU&ab_channel=PedroTech

// https://www.youtube.com/watch?v=qMU9c-0UHwM&ab_channel=MariusEspejo ☺ 14:25