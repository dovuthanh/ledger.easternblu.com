// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var bookmarkSchema = mongoose.Schema({
	userWalletAddress: String,
	songRefer: String,
});

module.exports = mongoose.model('Bookmarks', bookmarkSchema);