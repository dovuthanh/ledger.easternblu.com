// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var royaltychema = mongoose.Schema({
    confirmAddress: String,
    multisignAddress: String,
    songAddress: String,
    royaltyName: String,
    royaltyUserID: String,
    ownerAddress: String,
    ownerName: String,
    ownerUserID: String,
    ownerEmail: String,
    ownerAccountNumber: String,
    songUrl: String,
    royaltyPartnerAddress: String,
    songTitle: String,
    percentBefore: Number,
    songId: { type: Schema.Types.ObjectId, ref: 'Song' },
    percentAfter: Number,
    status: Number, //0 -  not confirmed yet, 1-yes, 2-no
    dateIssue: Date,
    deployStatus: Boolean,
    deployBlockHashStatus: Boolean,
    deploySignBlockHashStatus: Boolean,
    deployUnsignBlockHashStatus: Boolean,
    deployBlockHash: String,
    deploySignBlockHash: String,
    deployUnsignBlockHash: String,
    ownerSigned: String,
    otherSigned: String,
    partnerUserRefer: { type: Schema.Types.ObjectId, ref: 'User' },
    ownerUserRefer: { type: Schema.Types.ObjectId, ref: 'User' },
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Royalty', royaltychema);


