import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { destroyCloudinary, uploadCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";

export const getAllVideos = asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        throw new ApiError(400, "userId required.");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "userId is not valid ID.");
    }

    const videos = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                //unwind operator spreads the value of given field
                $unwind: "$owner"
            }
        ]
    );

    if (!videos) {
        throw new ApiError(500, "Something went wrong while fetching video");
    }

    if (videos.length == 0) {
        return res.status(200).json(new ApiResponse(200, "No videos found!"));
    }


    return res
        .status(200)
        .json(new ApiResponse(200, "Videos fetched successfully.", videos));
});

export const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "All fields are required");
    }

    //taking paths of files from req.files
    const thumbnailLoacalPath = req.files?.thumbnail[0]?.path;
    const videoLocalPath = req.files?.video[0]?.path;


    //It checks if any fields are empty
    if ([title, description, thumbnailLoacalPath, videoLocalPath].some((eachItem) => eachItem?.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    const thumbnail = await uploadCloudinary(thumbnailLoacalPath);
    const videoFile = await uploadCloudinary(videoLocalPath);

    if (!thumbnail) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail.");
    }

    if (!videoFile) {
        throw new ApiError(500, "Something went wrong while uploading videoFile.");
    }

    const video = await Video.create({
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        description,
        title,
        isPublished: true,
        duration: videoFile?.duration,
        owner: req.user?._id
    });

    if (!video) {
        throw new ApiError(500, "Somthing went wrong while publishing video");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Video published Successfully", video)
        );
});

export const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.query;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required.");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Not valid videoId");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]);

    if (!video) {
        throw new ApiError(500, "Something went wrong while fetching video.");
    }

    if (video.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No video found."));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Video fetched successfully.", video)
        );

});

export const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const { title, description } = req.body;


    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is invalid.");
    }

    if (!title || !description) {
        throw new ApiError(400, "All fields are required.");
    }

    const upadtedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title,
                description
            }
        },
        {
            new: true
        }
    );

    if (!upadtedVideo) {
        throw new ApiError(500, "Something went wrong while updating.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Video updated successfully.", upadtedVideo)
        );
});

export const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        throw new ApiError(500, "Something went wrong while deleting video.");
    }

    const thumbnailUrl = video.thumbnail;
    const videoUrl = video.videoFile;

    const publicId = thumbnailUrl.split("/").pop().split(".")[0];
    const publicVideoId = videoUrl.split("/").pop().split(".")[0];

    const thumbnailResponse = await destroyCloudinary(publicId);
    const videoResponse = await destroyCloudinary(publicVideoId);

    if (!thumbnailResponse) {
        throw new ApiError(500, "Something went wrong while deleting thumbnail from clodinary.");
    }

    if (!videoResponse) {
        throw new ApiError(500, "Something went wrong while deleting videoFile from clodinary.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Video deleted Successfully")
        );
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);
    video.isPublished = !video.isPublished;

    if (!video) {
        throw new ApiError(500, "Video not found");
    }

    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Published status toggled successfully.", video?.isPublished)
        )

});