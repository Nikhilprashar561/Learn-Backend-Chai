import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRes } from "../utils/ApiRes.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    console.log(user);
    console.log(accesToken);
    console.log(refreshToken);

    return { accesToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(
      500,
      "something went wrong while Generating Access and Refresh Token"
    );
  }
};

const register = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  console.log(`Email Enter by a user ${email}`);

  if (
    [fullname, username, email, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiErrors(400, "All Field are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiErrors(409, "User with email or username is already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, "Avatar Field is Required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  console.log(user)

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiErrors(
      500,
      "Something Went Wrong While Registering the users"
    );
  }

  return res
    .status(201)
    .json(new ApiRes(200, createdUser, "User Register SucccessFully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body from data
  //username or email validate
  //find the user
  //password check
  //access and refresh token
  //send cookies

  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiErrors(400, "Username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiErrors(404, "user was not exits");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiErrors(404, "Invaild User");
  }

  const { accesToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"   
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accesToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiRes(200, { user: loggedInUser, accesToken, refreshToken }));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRes(200, {}, "User Logged Out Seccussfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiErrors(401, "Unauthorized Request");
  }
  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodeToken?._id);
    if (!user) {
      throw new ApiErrors(401, "Unauthorized Request");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiErrors(401, "Refresh Token is Expired Or Use");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accesToken, newrefreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accesToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiRes(200, { accesToken, newrefreshToken }, "Access Token refresh")
      );
  } catch (error) {
    throw new ApiErrors(401, error?.message || "Invalid refresh token");
  }
});

const changedCurrentPasscode = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiErrors(400, "Invalid Password Old");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiRes(200, {}, "Password Changed Successfully"));
});

const getcurrentuser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiRes(200, req.user, "current uerr fetch successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiErrors(400, "All Fields Are Required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname, email: email } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRes(200, user, "Account details update successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar files is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiErrors(400, "Error wile uploading on Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiRes(200, "Avatar Upload Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiErrors(400, "coverImage files is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiErrors(400, "Error wile uploading on CoverImages");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRes(200, "CoverImage Upload Successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiErrors(400, "user is Missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subsciptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subsciptions",
        localField: "_id",
        foreignField: "subscribe",
        as: "subscriberTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelCount: {
          $size: "$subscriberTo",
        },
        isSubscibe: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        coverImage: 1,
        avatar: 1,
        subscriberCount: 1,
        channelCount: 1,
        isSubscibe: 1,
      },
    },
  ]);
  console.log(channel);
  if (!channel?.length) {
    throw new ApiErrors(404, "Channel DoesNot Exists");
  }
  return res.status(200).json(new ApiRes(200, "user fetch successfully"));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  console.log(user)
  return res
    .status(200)
    .json(
      new ApiRes(200, user[0].watchHistory, "Watch History Fetch Successfully")
    );
});

const check = async(req, res)=>{
  return res.json({message:"Checking is Successful"})
}

export {
  register,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changedCurrentPasscode,
  getcurrentuser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserProfile,
  getUserWatchHistory,
  check
};
