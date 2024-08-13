import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.models.js";

export const toggleSubscription = asyncHandler(async(req, res)=>{
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Inavlid channelId");
    }

    if(channelId === req.user?._id){
        return res.status(400).json(new ApiResponse(200, "you cannot subscribe your own channel."));
    }

    const subscriber = await Subscription.findOne({
        channel : channelId,
        subscriber : req.user?._id
    });

    if(subscriber){
       await subscriber.deleteOne();
       return res
       .status(200)
       .json(
        new ApiResponse(200, "Unsubscribed.", {})
       ) 
    }

    const createSubscription = await Subscription.create({
        channel:channelId,
        subscriber: req.user?._id
    });

    if(!createSubscription){
        throw new ApiError(500, "Somthing went wrong while subscribing");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Subscribed!", createSubscription)
    );
    
});

export const getUserChannelSubscriber = asyncHandler(async(req, res)=>{
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid ChannelId");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1,
                            coverImage:1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                _id:0,
                subscriber:1
            }
        },
        {
            $unwind:"$subscriber"
        }
    ]);


    if(!subscribers){
        throw new ApiError(500, "Something went wrong while fetching subscribers.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Subscribers fetched successfully", subscribers)
    );

});

export const getSubscribedChannels = asyncHandler(async(req, res)=>{
    const {subscriberId} = req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriberId.");
    }

    const subscribedChannels = await Subscription.aggregate(
        [
            {
                $match:{
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"channel",
                    pipeline:[
                        {
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1
                            }
                        },
                    ]
                }
            },
            {
                $project:{
                    _id:0,
                    channel:1
                }
            },
            {
                $unwind:"$channel"
            }
            
        ]
    );

    // const subscribedChannels = await Subscription
    // .find({subscriber: subscriberId})
    // .populate("channel", "fullName email username avatar coverImage");

    if(!subscribedChannels){
        throw new ApiError(500, "Something Went wrong while fetching subscribedChannels.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Subscribed Channels fetched successfully.", subscribedChannels)
    );
});