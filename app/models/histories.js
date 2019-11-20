// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var historySchema = mongoose.Schema({
    buyer: String,
    buyerEmail: String,
    vouchers: Array,
    status: String,
    totalTokens: Number,
    blockHash: String,
    deployStatus: Boolean,
    createdAt: Date,
    updatedAt: Date
});

// create the model for users and expose it to our app
module.exports = mongoose.model('History', historySchema);