import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at Port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Mongo DB Connection Failed !!!`, err);
  });

/*
import express from "express";
const app = express()

( async () => {
    try {
       await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        app.on("Error",(error)=>{
            console.log(`Error`,error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App Was Listening on ${PORT}`)
        })
    } catch (error) {
        console.log("ERROR",error)
        throw error
    }
})(); */
