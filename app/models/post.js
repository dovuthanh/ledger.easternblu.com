// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
// define the schema for our user model
var postSchema = mongoose.Schema({
    title: String,
    state: String,
    publishedDate: Date,
    image:  { 
        public_id: String,
        version: Number,
        signature: String,
        width: Number,
        height: Number,
        format: String,
        resource_type: String,
        url: String,
        secure_url: String,
     },
    content: {
        brief: String ,
        extended: String ,
    },
});


module.exports = mongoose.model('Post', postSchema);

