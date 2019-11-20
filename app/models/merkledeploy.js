// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var merkleDeploySchema = mongoose.Schema({
    merkleRefer: { type: Schema.Types.ObjectId, ref: 'Merkle' },
    userRefer: { type: Schema.Types.ObjectId, ref: 'User' },
    blockHash: String,
    deployStatus: Number, //0 - pending, 1 - processing, 2 - success, 3 - fail
    payLoad: String,
    contractAddress: String,
    createDate: Date,
    verified: Number, 
    retryCount: Number,
    arrayOwner: Array,
    songTitle1: String,
    songTitle2: String,
    songTitle3: String,
    hash1: String,
    hash2: String,
    hash3: String,
    digital1: String,
    digital2: String,
    digital3: String,
    professionalName1: String,
    professionalName2: String,
    professionalName3: String,
    duration1: String,
    duration2: String,
    duration3: String,
    publishDate1: String,
    publishDate2: String,
    publishDate3: String,
});

// create the model for users and expose it to our app
module.exports = mongoose.model('MerkleDeploy', merkleDeploySchema);
