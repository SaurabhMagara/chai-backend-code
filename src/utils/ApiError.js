//Custom error class, standards using error class

class ApiError extends Error {
    constructor(
        statusCode,
        message = "something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.stack = stack;
        this.data = null;
        this.success = false;

        //for printing stackTree

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this,this.constructor);
        }
    }


}

export { ApiError };