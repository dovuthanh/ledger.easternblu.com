var mongoose = require('mongoose');
var whitelistSchema = mongoose.Schema({
	firstName: String,
	lastName: String,
	walletAddress: String,
	email: String,
	active: Boolean,
	onchain: Boolean,
	created_at: Date,
	updated_at: Date,
	blockHash: String,
	deployStatus: Boolean
});
module.exports = mongoose.model('Whitelist', whitelistSchema);