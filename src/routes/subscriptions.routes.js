import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscriber, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router.route('/toggle-subscription/:channelId').patch(toggleSubscription);
router.route('/get-subscribers/:channelId').get(getUserChannelSubscriber);
router.route('/get-subscribed-channels/:subscriberId').get(getSubscribedChannels);

export default router;