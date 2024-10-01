import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection error", error);
        process.exit(1);        
    }
}

// const connectDB = new Promise((resolve, reject) => {
//     mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     .then((connectionInstance) => {
//         console.log(`\nMongoDB connected!! DB HOST: ${connectionInstance.connection.host}`);
//         resolve(connectionInstance);
//     })
//     .catch((error) => {
//         console.error("MONGODB connection error:", error);
//         reject(error);
//     });
// })

export default connectDB;