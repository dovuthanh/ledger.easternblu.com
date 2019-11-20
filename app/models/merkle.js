// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var merkleSchema = mongoose.Schema({
    userId: String,
    userRefer: { type: Schema.Types.ObjectId, ref: 'User' },
    merkleRoot:String,
    digitalSignature: String,
    contractAddress: String,
    dateRegistration: Date,
    blockHash: String,
    deployStatus: Boolean,
    verified: Boolean,
    confirmed: Boolean,
    batchId: String,
    readyToDeploy: Boolean,
    ownerPublicKey: String,
    isCompleted: Boolean,
    isDeploying: Boolean,
    albumName: String
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Merkle', merkleSchema);
