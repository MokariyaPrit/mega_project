import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refereshandAccessToken,
  getCurrentUser,
  changeCurrentPasswordusingoldPassword,
  getUserChannelProfile,
  getWatchHistory,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secure route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refereshandAccessToken);
router
  .route("/change-password")
  .post(verifyJWT, changeCurrentPasswordusingoldPassword);

// secure routes
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").put(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .put(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-cover-image")
  .put(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/user-channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
