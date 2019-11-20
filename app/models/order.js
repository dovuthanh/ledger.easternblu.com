// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var orderSchema = mongoose.Schema({
    licenseAddress: String,
    licenseTo: String,
    licenseFrom: String,
    title: String,
    territories: String,
    right: String,
    peroid: Number,
    amount: Number,
    method: String,
    songAddress: String,
    buyerAddress: String,
    ownerAddress: String,
    dateCreated: Date,
    dateUpdated: Date,
    dateExpireDate: Date,
    licenseHash: String,
    licenseType: String,//0-song, 1-work
    status: Number, //1 - waiting confirm, 2 - confirmed ~update price, 3 fail, 4 compelte
    licenseBlockHash: String,
    licenseUpdatePriceBlockHash: String,
    licensePayBlockHash: String,
    licenseDeployStatus: Boolean,
    licenseBlockConfirmed: Number,
    dateRequest: Date,
    songArtistName: String,
    songComposerName: String,
    songContractAddress: String,
    signatureBuyer: String,
    orderBuyerRefer: { type: Schema.Types.ObjectId, ref: 'User' },
    orderSongRefer: { type: Schema.Types.ObjectId, ref: 'Song' },
    orderSellerRefer: { type: Schema.Types.ObjectId, ref: 'User' },
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Order', orderSchema);
