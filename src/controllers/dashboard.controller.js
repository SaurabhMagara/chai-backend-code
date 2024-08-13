import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const getChannelStats = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    const TotalSubscribers = await Subscription.aggregate(
        [
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $count: "totalSubscribers"
            }
        ]
    );

    const totalVideos = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $count: "TotalVideos"
            }
        ]
    );

    const TotalLikes = await Like.aggregate(
        [
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(userId),
                    video: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "Likes"
                }
            },
            {
                $addFields:{
                    Likes:{
                        $size:"$Likes"
                    }
                }
            }
        ]
    );

    if (!totalVideos || !TotalSubscribers || !TotalLikes) {
        throw new ApiError(500, "Something went wrong while fetching channel stats.");
    }

    const channelStats = {};

    channelStats.ownerName = req.user?.fullName;
    channelStats.totalVideos = totalVideos && totalVideos[0]?.TotalVideos || 0;
    channelStats.TotalLikes = TotalLikes && TotalLikes[0]?.Likes || 0;
    channelStats.TotalSubscribers = TotalSubscribers && TotalSubscribers[0]?.totalSubscribers || 0;

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Channel Stats fetched.", channelStats)
        );

});

export const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            //for likes
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
                pipeline: [
                    {
                        $count: "likes"
                    }
                ]
            }
        },
        {
            //for comments
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
                    {
                        $project: {
                            content: 1,
                            _id: 0,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                _id: 0,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                isPublished: 1,
                description: 1,
                comments: {
                    $size: "$comments"
                },
                likes: {
                    $size: "$likes"
                },
                createdAt: 1,
                updatedAt: 1
                
            }
        }
    ]);

    if (!videos) {
        throw new ApiError(500, "Something went wrong while fetching videos.")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Videos fetched succsessfully.", videos)
        );

});