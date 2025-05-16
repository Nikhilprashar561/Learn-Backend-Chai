import { Router } from "express";
import {
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
} from "../controllers/user.controllers.js";
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
      maxCount: 3,
    },
  ]),
  register
);

router.route("/login").post(loginUser);

//secuere routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changedCurrentPasscode);

router.route("/change-user").get(verifyJWT, getcurrentuser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
  
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
  

router.route("/c/:username").get(verifyJWT, getUserProfile);

router.route("/watchHistory").get(verifyJWT, getUserWatchHistory);

router.route("/check").get(verifyJWT,check)


//router.route("/register").get(register);

export default router;
