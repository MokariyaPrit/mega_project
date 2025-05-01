import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true, // For better text search
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    videoFile: {
      type: String, // Cloudinary URL of the video
      required: true,
    },
    thumbnail: {
      type: String, // Cloudinary URL of the thumbnail
      required: true,
    },
    duration: {
      type: Number, // Duration in seconds
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to the User who uploaded the video
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Users who liked this video
      },
    ],
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Users who disliked this video
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment", // Reference to the Comment model (you'll need this)
      },
    ],
    category: {
      type: String,
      trim: true,
      index: true, // For filtering by category
    },
    // You might want to add tags for better discoverability
    tags: [String],
  },
  { timestamps: true }
);

// Add an index for better querying on title and description
videoSchema.index({ title: "text", description: "text" });
videoSchema.plugin(mongooseAggregatePaginate)
export default Video = mongoose.model("Video", videoSchema);
