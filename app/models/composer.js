// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var composerSchema = mongoose.Schema({
    composerName: String,
    composerRomanizedName: String,
    composerContractAddress: String,
    composerAddress: String,
    composerContactNumber: String,
    hasReleased: Boolean,
    hasReleasedSoundRecording: Boolean,
    hasReleasedKaraoke: Boolean,
    hasReleasedThemeSong: Boolean,
    hasReleasedGaming: Boolean,
    hasReleasedMusical: Boolean,
    hasReleasedOthers: Boolean,
    composerDemoFileUrl: String,
    composerTempUrl: String,
    composerSongFileName: String,
    composerFileExtension: String,
    composerFileSize: Number,
    composerHashOfSong: String,
    composerSongTitle: String,
    composerSongRomanizedTitle: String,
    composerSongLengthOfTime: String,
    copyrightClaimReproductionMechanical: Boolean,
    copyrightClaimSynchronisation: Boolean,
    copyrightClaimAdaptation: Boolean,
    copyrightClaimPublicPerformances: Boolean,
    copyrightClaimCommunication: Boolean,
    copyrightClaimBroadcasting: Boolean,
    hasThePulicPerformanceRightCMOPRO: Boolean,
    hasThePulicBroadcastingRightCMOPRO: Boolean,
    hasAnyOtherRights: Boolean,
    rightsAnDurationReproductionMechanical: Date,
    rightsAnDurationSynchronisation: Date,
    rightsAnDurationAdaptation: Date,
    composerSongDigitalSignatures :String,
    composerCountry :String,
    composerDateRegsiter: Date,
    composerBlockHash: String,
    composerDeployStatus: Boolean,
    verified: Boolean,
    composerUserRefer: { type: Schema.Types.ObjectId, ref: 'User' },
    workOrderRefer: Array
});


module.exports = mongoose.model('Composer', composerSchema);
