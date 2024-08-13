import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; //package for sending cookies with request and response

//create app from express
const app = express();

//cors configuration
app.use(
    cors(
        {
            origin: process.env.CORS_ORIGIN, // sets origin from where it accepts requests
            credentials: true // sending credintials propetry set to true
        }
    )
);

//Middlewares --> middlewares runs before the main task or operation to check 

app.use(express.json({ limit: "16kb" })); // it provides sending json data and limit property sets the size limit of jason data
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //it provides sending the urlencoded data
app.use(express.static('./public')); //its sets static file 
app.use(cookieParser()); // uses cookie-parsers to send cookies and clear-cookies

//import routes
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import commentRouter from './routes/comment.routes.js';
import subscriptionRouter from './routes/subscriptions.routes.js';
import likeRouter from './routes/likes.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import dashboardRouter from "./routes/dashboard.routes.js";
import healthRouter from "./routes/healthChekc.routes.js";

//routes declaration
app.use('/api/v1/users', userRouter); // user routes
app.use("/api/v1/videos", videoRouter); //video routes
app.use('/api/v1/playlists', playlistRouter); // playlist routes
app.use('/api/v1/comments', commentRouter); // comments routes
app.use('/api/v1/subscriptions', subscriptionRouter); // subscription routes
app.use('/api/v1/likes', likeRouter); // likes routes
app.use('/api/v1/tweets', tweetRouter); // tweets routes
app.use('/api/v1/dashboard', dashboardRouter); // dashboard routes
app.use('/api/v1/healthCheck', healthRouter); // health check route

export { app };