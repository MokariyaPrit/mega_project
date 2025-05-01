import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

// Configure cloudinary with explicit values for debugging
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})



// Function to upload file to cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null

    console.log("Uploading to Cloudinary:", localFilePath)

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      console.error("File not found at path:", localFilePath)
      return null
    }

    // Upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    })

    // File has been uploaded successfully
    console.log("File uploaded successfully", response.url)

    // Remove the locally saved temporary file
    fs.unlinkSync(localFilePath)

    return response
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)

    // Additional debugging for authentication errors
    if (error.http_code === 401) {
      console.error("Authentication error. Please check your Cloudinary credentials.")
      console.error("Make sure your API key, API secret, and cloud name are correct.")
    }

    // Remove the locally saved temporary file as the upload operation failed
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath)
    }

    return null
  }
}

export { uploadOnCloudinary }
