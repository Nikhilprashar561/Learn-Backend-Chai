import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {subsciption} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiRes} from "../utils/ApiRes.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }