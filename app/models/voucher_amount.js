// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var typeSchema = mongoose.Schema({
    amount: Number,
    createdAt: Date,
    updatedAt: Date
});

// create the model for users and expose it to our app
module.exports = mongoose.model('VoucherAmount', typeSchema);