import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.models.js";
import mongoose, { isValidObjectId } from "mongoose";

export const createPlayist = asyncHandler(async (req,res)=>{
    const {name, description} = req.body;

    if(!name || !description){
        throw new ApiError(400, "All fields are required.");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
        videos:[]
    });

    if(!playlist){
        throw new ApiError(500, "Something went wrong while creating playlist.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Playlist created successfully.", playlist)
    );
});

export const getUserPlaylists = asyncHandler(async(req, res)=>{
    const {userId} = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId.");
    }

    const playlists = await Playlist.aggregate(
        [
            {
                $match:{
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                    pipeline:[
                        {
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
            }
        ]
    );

    if(!playlists){
        throw new ApiError(500, "Somthing went wrong while fetching playlists.");
    }

    if(!playlists.length > 0){
        return res.status(200).json(new ApiResponse(200, "No playlists found."));
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Playlists fetched successfully.", playlists)
    );

});

export const getPlaylistById = asyncHandler(async(req, res)=>{
    const {playlistId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id.");
    }

    const playlist = await Playlist.aggregate(
        [
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                    pipeline:[
                        {
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
            }
        ]
    );

    if(!playlist){
        throw new ApiError(500, "Something went wrong while fetching playlist.");
    }

    if(!playlist.length > 0){
        return res
        .status(200)
        .json(
            new ApiResponse(200, "No playlist found")
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Playlist fetched successfully", playlist)
    )
});

export const addVideoToPlaylist = asyncHandler(async(req, res)=>{
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id.");
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "No video founded.");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400, "No playlist founded.");
    }

    playlist.videos.push(videoId);

    const upadtedPlaylist = await playlist.save();

    if(!upadtedPlaylist){
        throw new ApiError(500, "Something went wrong while adding video.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video added successfully.", upadtedPlaylist)
    );

});

export const removeVideoFromPlaylist = asyncHandler(async(req, res)=>{
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId.")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId.")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(500, "No video found.");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(500, "No playlist found.")
    }

    playlist.videos.pop(videoId);

    const upadtedPlaylist = playlist.save();

    if(!upadtedPlaylist){
        throw new ApiError(500, "Somethimg went wrong while removing video from playlist.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video removed successfully.", upadtedPlaylist)
    );
});

export const deletePlaylist = asyncHandler(async(req, res)=>{
    const {playlistId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if(!playlist){
        throw new ApiError(500, "Something went wrong while deleting playlist.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Playlist deleted successfully.")
    );
});

export const updatePlaylist = asyncHandler(async(req, res)=>{
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id.");
    }

    if(!name || !description){
        throw new ApiError(400, "All fields are required.");
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {
            new :true
        }
    );

    if(!playlist){
        throw new ApiError(500, "Something went wrong while updating playlist.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Playlist updated Successfully.", playlist)
    );
    
});