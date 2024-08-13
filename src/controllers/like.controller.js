import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

export const toggleVideoLike = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId");
    }

    const liked = await Like.findOne({
        video : videoId,
        likedBy:req.user?._id
    });

    if(liked){
        await liked.deleteOne();
        return res
        .status(200)
        .json(
            new ApiResponse(200, "Video disliked.", liked)
        )
    }

    const likedVideo = await Like.create(
        {
            video: videoId,
            likedBy:req.user?._id
        }
    );

    if(!likedVideo){
        throw new ApiError(500, "Something went wrong while liking video.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "video liked.", likedVideo)
    );

});

export const toggleCommentLike = asyncHandler(async(req, res)=>{
    const {commentId} = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId");
    }

    const likedComment = await Like.findOne({comment: commentId, likedBy:req.user?._id});

    if(likedComment){
        await likedComment.deleteOne();
        return res
        .status(200)
        .json(
            new ApiResponse(200, "comment disliked.")
        );
    }

    const liked = await Like.create({
        comment:commentId,
        likedBy:req.user?._id
    });

    if(!liked){
        throw new ApiError(500, "Cannot like now, try again later");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Comment liked.", liked)
    );
});

export const toggleTweetLike = asyncHandler(async(req, res)=>{
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invlid tweetId");
    }

    const likedTweet = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    });

    if(likedTweet){
        await likedTweet.deleteOne();
        return res
        .status(200)
        .json(
            new ApiResponse(200, "Tweet disliked.")
        );
    }

    const tweetLiked = await Like.create(
        {
            tweet:tweetId,
            likedBy:req.user?._id
        }
    );

    if(!tweetLiked){
        throw new ApiError(500, "Cannot like now, try again letter.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweet liked.", tweetLiked)
    );
});

export const getLikedVideos = asyncHandler(async(req, res)=>{
    const likedVideo = await Like.aggregate(
        [
            {
                $match:{
                    likedBy : new mongoose.Types.ObjectId(req.user?._id),
                    video :{$ne : null}
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"video",
                    foreignField:"_id",
                    as:"video",
                    pipeline:[
                        {
                            $project:{
                                thumbnail:1,
                                videoFile:1,

                            }
                        }
                    ]
                }
            }
        ]
    )

    if(likedVideo.length === 0){
        return res
        .status(200)
        .json(
            new ApiResponse(200, "Has no liked videos yet", likedVideo)
        );
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "liked Videos fetched successfully.", likedVideo)
    );
})