import mongoose from "mongoose";

const subSchema = new mongoose.Schema({
    subscribe:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
});

export const subsciption = mongoose.model("subsciption", subSchema);
