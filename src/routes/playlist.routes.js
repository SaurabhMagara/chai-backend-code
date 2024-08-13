import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlayist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.route('/create-playlist').post(createPlayist);
router.route('/user-playlists/:userId').get(getUserPlaylists);
router.route('/get-playlist/:playlistId').get(getPlaylistById);

router.route('/add-to-playlist/:videoId/:playlistId').patch(addVideoToPlaylist);
router.route('/remove-from-playlist/:videoId/:playlistId').patch(removeVideoFromPlaylist);

router.route('/delete-playlist/:playlistId').delete(deletePlaylist);
router.route('/update-playlist/:playlistId').patch(updatePlaylist);

export default router;