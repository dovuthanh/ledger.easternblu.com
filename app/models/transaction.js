var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var transactionSchema = mongoose.Schema({
	txHash: String,
	fromAddress: String,
	toAddress: String,
	amount: Number,
	unit: String,
	status: Number,
	datetime: Date
});

module.exports = mongoose.model('Transactions', transactionSchema);