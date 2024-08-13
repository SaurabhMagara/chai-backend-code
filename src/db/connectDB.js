import mongoose from 'mongoose'; // mongoose for connecting to database

const connectDB = async () => {

    //warpped in try catch block for handling error
    try {

        // connecting to database
        const connectionInstance = await mongoose.connect(`${process.env.DB_URI}/${process.env.DB_NAME}`);
        console.log("MongoDB is connected !!  Host :", connectionInstance.connection.host);
    } catch (error) {
        console.log("MONGODB connection FAILED");

        //error code : 1 
        process.exit(1);
    }

};

export default connectDB;