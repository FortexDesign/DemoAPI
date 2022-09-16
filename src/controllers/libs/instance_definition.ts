export class CustomError extends Error {

    constructor({ name, message, statusCode }: {name: string, message: string, statusCode?: number}) {
        
        super(message)
        this.name = name
        this.statusCode = statusCode

    }

    name: string
    message: string
    stack?: string | undefined
    statusCode?: number | undefined
    
}

/* interface StatusError extends Error {

    statusCode: number

} */