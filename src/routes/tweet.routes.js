import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router();
router.use(verifyJWT);

router.route('/').post(createTweet);
router.route('/update/:tweetId').patch(updateTweet);
router.route('/delete/:tweetId').delete(deleteTweet);
router.route('/user/get-tweets').get(getUserTweets);

export default router;