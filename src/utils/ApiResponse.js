//This is for seting Standard response

//made an custom class for response every time in easy way instead of giving json

class ApiResponse {
    constructor(
        statusCode,
        message="success",
        data
    ){
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode<400;
    }
}

export { ApiResponse };