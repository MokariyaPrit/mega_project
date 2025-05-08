import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// generateAccessTokensAndRefereshTokens
const generateAccessTokensAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Call methods on the user instance
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

// registerUser
const registerUser = asyncHandler(async (req, res) => {
  // Get user details from frontend
  const { fullName, email, username, password } = req.body;

  // Validation
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Check for avatar and cover image
  // console.log("Files received:", req.files);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  // if (!avatarLocalPath) {
  //   throw new ApiError(400, "Avatar file is required")
  // }

  // Make sure temp directory exists
  const tempDir = "../../public/temp";
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    // console.log("Created temp directory:", tempDir);
  }

  // Upload to cloudinary
  // console.log("Uploading avatar from:", avatarLocalPath);
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // console.log("Avatar upload result:", avatar);

  let coverImage;
  if (coverImageLocalPath) {
    // console.log("Uploading cover image from:", coverImageLocalPath);
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log("Cover image upload result:", coverImage);
  }

  // if (!avatar) {
  //   throw new ApiError(500, "Avatar file upload failed")
  // }

  // Create user object
  const user = await User.create({
    fullName,
    avatar:
      avatar?.url ||
      "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-Download-Image.png",
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // Remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "user name or email is reqiured");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(400, "user not registerd");
  }

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new ApiError(401, "invalid cradintial");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokensAndRefereshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Set secure only in production
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Loggin succesfully"
      )
    );
});

// logoutUser
const logoutUser = asyncHandler(async (req, res) => {
  const newUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Set secure only in production
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

//refereshandAccessToken
const refereshandAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies || req.body;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  try {
    const user = await User.findOne({ refreshToken }).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const isValid = user.isRefreshTokenValid(refreshToken);
    if (!isValid) {
      throw new ApiError(402, "Invalid refresh token");
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokensAndRefereshTokens(user._id);
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set secure only in production
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Tokens refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(403,error?.message || `Invalid refresh token`)
  }
});


export { registerUser, loginUser, logoutUser, refereshandAccessToken };
