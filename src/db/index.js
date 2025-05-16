import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstances = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(`MongoDB Connected !! DB HOST: ${connectionInstances.connection.host}`)
  } catch (error) {
    console.log("MONGO DB Conection Failed", error);
    process.exit(1);
  }
};


export default connectDB