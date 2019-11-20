var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
// define the schema for our user model
var imageSchema = mongoose.Schema({
	public_id: String,
	version: Number,
	signature: String,
	width: Number,
	height: Number,
	format: String,
	resource_type: String,
	url: String,
	secure_url: String,
});

module.exports = mongoose.model('Image', imageSchema);