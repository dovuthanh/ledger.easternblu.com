// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

// define the schema for our user model
var songSchema = mongoose.Schema({
    songTitle :String,
    songCompleted: String,
    songPublish: String,
    songChineseTitle: String,
    songContent: String,
    songDateFirstPublish :String,
    songRegisterDate :Date,
    songOwnerName :String,
    songOwnerRomanizedName: String,
    songUrl :String,
    songHash :String,
    songRightHolderName: String,
    songDigitalSignature :String,
    songContractAddress :String,
    songOwnerContractAddress :String,
    songOwnerContractAddressDeploy :String,
    songOwnerId :String,
    songSize :Number,
    songExtension :String,
    songPlaceOfWork :String,
    songDateOfCompletion: String,
    songISRCNumber :String,
    songAlbumName :String,
    songLengthOfTime: String,
    songCountry :String,
    songCatNo: String,
    songDialect: String,
    songFormatCD :Boolean,
    songFormatDVD :Boolean,
    songFormatKaraoke :Boolean,
    songFormatDigital :Boolean,
    songFormatSocialMedia :Boolean,
    songOriginalVersion :Boolean,
    songRemixVersion :Boolean,
    songExtendVersion :Boolean,
    songReRecordingVersion :Boolean,
    songDisputeAddress: String,
    songTempUrl: String,
    songGenre: String,
    songBlockHash: String,
    songDeployStatus: Boolean,
    songIsMassRegistration: Boolean,
    songBlockConfirmed: Number,
    songMerkleRoot: String,
    songMerkleRootRefer: { type: Schema.Types.ObjectId, ref: 'Merkle' },
    songMerkleDeployRefer: { type: Schema.Types.ObjectId, ref: 'MerkleDeploy' },
    songArtistRefer: { type: Schema.Types.ObjectId, ref: 'Artist' },
    songLyricistsRefer: { type: Schema.Types.ObjectId, ref: 'Artist' },
    songComposerRefer: { type: Schema.Types.ObjectId, ref: 'Artist' },
    songArtistNameTemp: String,
    songIndexTemp: String,
    songDuration: String,
    songComposerRefer: { type: Schema.Types.ObjectId, ref: 'Artist' },
    songLyricRefer: { type: Schema.Types.ObjectId, ref: 'Artist' },
    songComposerName: String,
    songLyricName: String,
    songOrderRefer: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    songUserRefer: { type: Schema.Types.ObjectId, ref: 'User' },
    OtherOwner : Array, 
        // otherName: data1.royaltyName,
        // otherPercent: data1.percentAfter,
        // otherWallet: data1.royaltyPartnerAddress.toLowerCase(),
    verified: Boolean,
    songDisabled:Boolean,
    createAt: Date,
    updatedAt: Date,
    exportId: String,
    errorMessageUpload: String,
    errorCode: String,
    songLocalPath: String,
    avatarLocalPath: String,
    songConflict:Boolean,
    songConflictAddress:{ type: Schema.Types.ObjectId, ref: 'Song' },
    songConflictMessage:String,
    songErrorMessage:String,
    songError:Boolean,
    songMissingUrl:String, //this is used when user upload missing file or replace current one.
    songDeleted: Boolean,
    songSmartContractVersion: { type: Schema.Types.ObjectId, ref: 'SmartContract' },
    songReadyToDeploy: Boolean,
    songRoyaltyPercentTemporary: Number,
    songRoyaltyPercentBefore: Number,
    songRoyaltyPercentAfter: Number,
    songDateIssueRoyalty: Date,
    songID: Number,
    qrcodeImage: String,
}, {
    usePushEach: true
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Song', songSchema);
