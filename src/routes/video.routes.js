import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();

//all video routes are secured, thats why used verify jwt for authentication
//it verifies user in every route
router.use(verifyJWT);


//routes
router.route("/get-videos").get(getAllVideos);

router.route("/publish-video").post(upload.fields(
    [
        {
            name: "thumbnail",
            maxCount: 1
        },
        {
            name: "video",
            maxCount: 1
        }
    ]
), publishAVideo);

router.route("/get-video").get(getVideoById);
router.route("/update-video/:videoId").patch(updateVideo);
router.route("/delete-video/:videoId").delete(deleteVideo);
router.route("/toggle-status/:videoId").patch(togglePublishStatus);

export default router;