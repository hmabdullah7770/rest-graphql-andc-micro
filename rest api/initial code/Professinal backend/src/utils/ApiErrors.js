class ApiError extends Error {

    constructor(
        statusCode,
        messege = "Something went  wrong",
        error = [],
        stack

    ) {

        super(messege)
        this.statusCode = statusCode
        this.messege = messege
        this.error = error
        this.data = null
        this.success = false

        if (stack) {
            this.stack
        }
        else {
            stack = Error.captureStackTrace(this, this.constructor)
        }


    }
}

export { ApiError }