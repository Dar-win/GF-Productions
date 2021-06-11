const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    imageId:{
        type: String,
        required: true
    },
    description:{
        type:String,
        required: true
    },
    price:{
        type:Number,
        required: true
    },
    keywords:{
        type:Array,
        required: true
    },
    alias:{
        type:String,
        required: true
    },
    aspectRatio: {
        type:Number,
        required: true
    }
}, {timestamps:true});

const Image = mongoose.model("Image", imageSchema);

module.exports = Image