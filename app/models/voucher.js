// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var vouchersSchema = mongoose.Schema({
    ownerAddress: String,
    ownerEmail: String,
    buyerAddress: String,
    code: String,
    status: String, //acitive, inactive, sold, used, expried.
    type: String,
    amount: Number,
    createdAt: Date,
    updatedAt: Date,
    discount: Number,
    blockHash: String,
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Voucher', vouchersSchema);
