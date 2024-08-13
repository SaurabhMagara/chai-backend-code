import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";

export const getVideoComments = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if(!video){
       return new ApiResponse(500, "No video found.");
    }

    const comments = await Comment.aggregate(
        [
            {
                $match:{
                    video: new mongoose.Types.ObjectId(videoId)
                }
            }
        ]
    );

    if(!comments){
        throw new ApiError(500, "Something went wrong while fetching comments.");
    }

    if(!comments.length>0){
        return res.status(200).json(new ApiResponse(200, "No commnets on this video."));
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Comments fetched successfully.", comments)
    );

});

export const addComment = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId.");
    }
    
    if(!content || content.trim() ===""){
        throw new ApiError(400, "Content is required.")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(500, "No video founded with given id.");
    }

    const comment = await Comment.create(
        {
            content,
            video: videoId,
            owner: req.user?._id
        }
    );

    if(!comment){
        throw new ApiError(500, "Something went wrong while creating comment.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Comment added successfully.", comment)
    );
});

export const updateComment = asyncHandler(async(req, res)=>{

    const {commentId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId");
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set:{
                content
            }
        },
        {
            new:true
        }
    );

    if(!updatedComment){
        throw new ApiError(500, "Something went Wrong while updating comment.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Comment updated successfully.", updatedComment)
    );
});

export const deleteComment = asyncHandler(async(req, res)=>{
    const {commentId} = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId.");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if(!deletedComment){
        throw new ApiError(500, "Something went wrong while deleting comment.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "comment deleted successfully.")
    );
});