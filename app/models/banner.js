var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var bannerSchema = mongoose.Schema({
    title: { type: String, required: true },
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
	brief: String,
	order:Number
});

module.exports = mongoose.model('Banner', bannerSchema);