var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
var WalletBKSchema = mongoose.Schema({
	publicWallet: String,
	publicDeployKey: String,
	publicDeploySeed: String,
	created: Date,
	userRefer: { type: Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('WalletBK', WalletBKSchema);