//Using promise chain
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler };

// Using Async await method
// const asyncHandler = (fun) => async(req, res,next)=>{
//     try {
//         await fun(req,res,next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             status:false,
//             message:error.message,
//         })
//     };
// }