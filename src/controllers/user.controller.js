import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import fs from "fs"

// Example controller method that handles file upload
const registerUser = asyncHandler(async (req, res) => {
  // Get user details from frontend
  const { fullName, email, username, password } = req.body

  // Validation
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required")
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  })

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists")
  }

  // Check for avatar and cover image
  console.log("Files received:", req.files)

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path

  // if (!avatarLocalPath) {
  //   throw new ApiError(400, "Avatar file is required")
  // }

  // Make sure temp directory exists
  const tempDir = "../../public/temp"
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
    console.log("Created temp directory:", tempDir)
  }

  // Upload to cloudinary
  console.log("Uploading avatar from:", avatarLocalPath)
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  console.log("Avatar upload result:", avatar)

  let coverImage
  if (coverImageLocalPath) {
    console.log("Uploading cover image from:", coverImageLocalPath)
    coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("Cover image upload result:", coverImage)
  }

  // if (!avatar) {
  //   throw new ApiError(500, "Avatar file upload failed")
  // }

  // Create user object
  const user = await User.create({
    fullName,
    avatar: avatar?.url || "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-Download-Image.png",
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  })

  // Remove password and refresh token from response
  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"))
})


export { registerUser }
