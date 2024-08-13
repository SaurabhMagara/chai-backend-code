import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshTokens = async (userId) => {
    try {

        const user = await User.findById(userId);
        const accesstoken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // console.log(accesstoken);
        // console.log(refreshToken);

        return { accesstoken, refreshToken };

    } catch (error) {

        throw new ApiError(500, "Something went wrong while generating Access or Refresh Tokens.");
    }
}

const registerUser = asyncHandler(async (req, res) => {

    //-----------------Steps for registering user----------------

    //get user details from frontend
    //validate details
    //check user is existing on db or not
    //if exists throw err
    //check for images, avatar
    //upload them to cloudinary
    //check if its uploaded or not
    //create user object in db
    //chek user is ceated or not
    //remove password and refreshtoken from response
    //return response

    //extract required fields from request body

    const { username, email, fullName, password } = req.body;

    // checking that all field are filled

    if (
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // if(username === "" && email==="" && fullName==="" && password===""){
    //     throw new ApiError(400, "All fields are required");
    // }


    // console.log(req.files);

    //Checking if user is already exists in db //checking with $or operator

    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    );

    if (existedUser) {
        throw new ApiError(409, "User with email or username alredy exists");
    }

    //cheking images are in body
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // let avatarLocalPath;
    // if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length >0){
    //     avatarLocalPath = req.files.avatar[0].path;
    // }

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // checking avatar is given or not

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is not given");
    }

    //upload them in cloudinary

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);


    //check if its uploaded or not

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required!!");
    }


    //Creating user object in db

    const user = await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            username: username.toLowerCase(),
            password,
            email
        }
    );

    //removing password and refreshToken from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    //checking if user is created or not

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user.");
    }

    //response
    return res
        .status(201)
        .json(
            new ApiResponse(200, "User is successfully created!", createdUser)
        )

});

const loginUser = asyncHandler(async (req, res) => {
    //check username or email is given
    //check password is given
    //check password 
    //give refreshtoken and accesstoken
    //remove password and refreshToken from response

    const { username, email, password } = req.body;

    //chcking username or email is given 
    if (!username && !email) {
        throw new ApiError(400, "uername or email is required for login");
    }

    //checking username or email is existes in database or not
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "user not exists.")
    }

    //checking password is given or not
    if (!password) {
        throw new ApiError(400, "password is required");
    }

    //checking password is correct
    const isPasswordValid = await user.isPasswordCorrect(password.trim());

    if (!isPasswordValid) {
        throw new ApiError(400, "user credintals is incorrect");
    }

    //generating access and refresh tokens

    const { accesstoken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .cookie("accessToken", accesstoken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User is logged in.", {
                user: loggedInUser, accesstoken, refreshToken
            })
        );

});

const logoutUser = asyncHandler(async (req, res) => {

    //delete cookies
    //return user

    await User.findByIdAndUpdate(
        req.user._id,
        {
            //unset operator provides you to unset any value.
            //you have to type field name and give the flag 1.
            $unset: {
                refreshToken: 1
            }
        },
        {
            // it creates new document or userObject
            new: true
        }
    );

    return res.status(200)
        .clearCookie("accessToken", options) //clearCokkie is used for clearing cookies.
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "user Logged out")
        );


});

const refreshAccessToken = asyncHandler(async (req, res) => {

    //take incoming refreshtoken from cookies or body.
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    //chekc if token is recieved or not
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }

    //wrap in try catch because it can throw error
    try {
        //verify the recieved token 
        //verify method verifies token and returns the decoded token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        //find user from this decoded token
        const user = await User.findById(decodedToken?._id);

        //check if user exists or not
        if (!user) {
            throw new ApiError(400, "Invalid refreshToken");
        }

        //checking if recieved token and stored token are same of not
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        //genrate new refresh token
        const { accesstoken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accesstoken", accesstoken, options)
            .cookie("refreshtoken", newRefreshToken, options)
            .json(
                new ApiResponse(200, "Access token refreshed succesfully", { accesstoken, refreshToken: newRefreshToken })
            )
    } catch (error) {
        throw new ApiError(401, "invalid refresh token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    //get current password and newpassword from body
    const { currentPassword, newPassword } = req.body;

    if(!currentPassword || !newPassword){
        throw new ApiError(400, "both fields are required to change password");
    }

    if(currentPassword.trim() === newPassword.trim()){
        throw new ApiError(400, "new password must be different from current password");
    }

    //find if user is exists or not
    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(400, "unAuthorized user request.");
    }

    //check current password matches the stored password
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "password is incorrect");
    }

    //if current password matches, stored password then change it to new password
    user.password = newPassword;

    //validate before save stops the validation before saving because we only changed password
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, "password changed succesfully"))
});

const getCurrentUser = asyncHandler(async (req, res) => {
    //verify the user its looged in or not 
    //its done by middleware verifyJwt
    //then send the user details
    //req.user deos not contain password and accesstoken
    return res
        .status(200)
        .json(new ApiResponse(200, "current user fetched", req.user))
})

const updateAccountDetails = asyncHandler(async (req, res) => {

    //take the fields you want to update
    const { fullName, email, username } = req.body;

    //check which field is given if both are not given then give error
    if (!fullName || !email || !username) {
        throw new ApiError(400, "All fields are required");
    }

    //find user in database and update data
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            //set operator is used to set data in given field
            $set: {
                fullName,
                email,
                username
            },

        },
        //new operator creates new document and delete previous one
        { new: true }
    ).select("-password"); // select method is used to remove password from this new user document

    return res
        .status(200)
        .json(new ApiResponse(200, "Account details updated successfully", user));
});

const updateAvatar = asyncHandler(async (req, res) => {
    // take avatar path from req
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is missing")
    }

    //upload avatar on  cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath);

    //check url is recieved fromm clodinary of not
    if (!avatar.url) {
        throw new ApiError(400, "Error occured while uploading avatar")
    }

    //find user and upadte avatar
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, "Avatar updated successfully", user))
});

const updateCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is missing ");
    }

    coverImage = await uploadCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "error occured while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, "coverimage updated successfully", user))

});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // get username from params

    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is required.");
    }

    //Aggregation pipline
    const channel = await User.aggregate(
        [
            {
                //matches with the value
                $match: {
                    username: username.toLowerCase()
                }
            },
            {
                //to find subscribers 
                //join operation : left join, takes : from, loacalfield, foreignfield, as
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                //to find how many channels you have subscribed to
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribed"
                }
            },
            {
                //add operator add new fields to current data
                $addFields: {
                    subscribers: {
                        $size: "$subscribers"
                    },
                    subscribed: {
                        $size: "$subscribed"
                    },
                    // to find out if you have subscribedd to current channel 
                    isSubscribed: {
                        //condition operator to apply condition 
                        //it has three parameters : if:condition, then, else
                        $cond: {
                            // $in operator is used to find given value in given field
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },  
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                //$project operator is used to select which fields you like to have after join
                //if value is 0 its not added, if value is 1 its added
                $project: {
                    fullName: 1,
                    username: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribed: 1,
                    subscribers: 1,
                    isSubscribed: 1
                }
            }
        ]
    );

    if(!channel?.length){
        throw new ApiError(400,"channel does not exists.")
    }

    return res.
            status(200)
            .json(
                new ApiResponse(200,"channel details fetched.",channel[0])
            )
});

const watchHistory = asyncHandler(async(req, res)=>{
    
    //use aggregation pipeline on users to find watch history
    const user = await User.aggregate([
        {
            //macth used for finding the user
            $match:{
                //user._id actually return a string but pipeline needs whole object id
                //moongose actually handles the string of id when we pass to find user by id
                //So to give actual Object id mongoose gives a method to find actual object id.
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
            
        },
        {
            //lookup operator used for join operation
            $lookup:{
                from:"videos", //from which model
                localField:"watchHistory",// what is it called on curecnt schema model
                foreignField:"_id", //whats its called in from  schema model
                as:"watchHistory", // what do you want to call this join field

                //we can add pipeline after all required feild of lookup
                //this pipeline is for owner field which is connected to users
                pipeline:[
                    {
                        //it joins the owner field to user model
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            //this pipeline is used for what data you want to show from user
                            pipeline:[
                                {
                                    //this operator which field you want to have
                                    $project:{
                                        fullName:1,
                                        email:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    //upper pipeline gives an array in return 
                    //this second subpipeline is for better response it directly gives the owner infromation
                    {
                        //it adds new fields to current model
                        $addFields:{
                            //new fields name
                            owner:{
                                //its takes first value from given field
                                $first:"$owner"
                            }
                        }
                    }
                ]
                //after this pipeline returned value is an object which has owner's value
            }
        }
    ]);

    return res
     .status(200)
     .json(
        new ApiResponse(200,"watchHistory fetched successfully.", user.watchHistory)
     )
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateCoverImage,
    updateAvatar,
    getUserChannelProfile,
    watchHistory
};