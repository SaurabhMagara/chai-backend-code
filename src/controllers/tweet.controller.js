import { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

export const createTweet = asyncHandler(async(req, res)=>{
    
    const {content} = req.body;

    if(!content || content.trim()=== ""){
        throw new ApiError(400, "Content is required to tweet.")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    });

    if(!tweet){
        throw new ApiError(500, "Can not tweet now, try after some time");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweeted successfully.", tweet)
    );

});

export const getUserTweets = asyncHandler(async(req, res)=>{
    
    const tweets = await Tweet.find({
        owner:req.user?._id
    });

    if(!tweets.length>0 ){
        return res
        .status(200)
        .json(
            new ApiError(200, "There are tweets yet.", tweets)
        );
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweets fetched successfully.", tweets)
    );
});

export const updateTweet = asyncHandler(async (req, res)=>{
    const {content} = req.body;
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId");
    }

    if(!content || content.trim()=== ""){
        throw new ApiError(400, "Content is required to update tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set:{
                content
            }
        },
        {
            new:true
        }
    );

    if(!updatedTweet){
        throw new ApiError(500, "Something went wrong while updating");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "tweet updated successfully.", updatedTweet)
    );
});

export const deleteTweet = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params;

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deletedTweet){
        throw new ApiError(500, "Something went wrong while deleting");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweet Deleted.", deletedTweet)
    );
});
