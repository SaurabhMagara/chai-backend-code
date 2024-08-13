import dotenv from "dotenv"; // dot env  file for sensitive data
import { app } from "./app.js";
import connectDB from './db/connectDB.js';
dotenv.config({ path: './.env' }); //configures dotenv file with file attribute

// Connecting to databse
//chaining 
connectDB()
    .then(() => {

        //on method used for cheking error
        app.on('error', (err) => {
            console.log("App crashed !", err);
        });

        //Staring server
        app.listen(`${process.env.PORT || 8000}`, () => {
            console.log(`⚙️  Server is running on port : ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log("MONGO DB connection failed!! ", err);
    });
