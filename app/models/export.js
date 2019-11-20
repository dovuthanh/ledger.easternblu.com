// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

// define the schema for our user model
var exportSchema = mongoose.Schema({
    UserRefer: { type: Schema.Types.ObjectId, ref: 'User' },
    BlockChainFile: String,
    SongFile: String,
    ArtistFile: String,
    Status: Number, //0 - pending, 1-runing, 2-fail, 3-success, terminate
    ErrorMessage: String,
    MerkleRefer: { type: Schema.Types.ObjectId, ref: 'Merkle' },
    MerkleRefer: { type: Schema.Types.ObjectId, ref: 'Merkle' },
    SessionId: String,
});

module.exports = mongoose.model('Export', exportSchema);


