import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
  
    if (!token) {
      throw new ApiErrors(401, "Unauthorized requests");
    }
  
    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
    const user = await User.findById(decodeToken?._id).select(
      "-password -refreshToken"
    );
  
    if (!user) {
      throw new ApiErrors(401, "Invaild Access Token");
    }
  
    req.user = user
    next()
  } catch (error) {
    return res.status(200).json({message:"Please Login your details then you go to profile"})
  }
});
