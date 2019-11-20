// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var artistSchema = mongoose.Schema({
    artistType: String,
    artistManagementAccount: String,
    artistProfessionName: String,
    artistNonRomanizedName: String,
    artistProfile: String,
    artistNameInPassportOfficialIdentificationCard: String,
    artistEmail: String,
    artistCountryCode: String,
    artistPhone: String,
    artistFaceBook :String,
    artistWechat :String,
    artistLinkedIn :String,
    artistTwitter :String,
    artistCurrrentFreelancer :Boolean,
    artistCurrrentContractRecordLabel :String,
    artistCurrrentContractProductionCompany :String,
    artistCurrrentContractArtistManagementCompany :String,
    artistRecordNewSongsWithANewRecordLabel :Boolean,
    artistPerformInATicketedSoloConcert: Boolean,
    artistPerformInEventsSuchAsMusicFestivalAndMusicConcerts: Boolean,
    artistPerformInPrivatelyOrganizedEvents: Boolean,
    artistToAppearInCommercials: Boolean,
    artistToSeekCooperationWithCommercial: Boolean,
    artistToSellSoundRecordingsAndMusicVideosDirectlyToConsumers: Boolean,
    artistsPictures: String,
    artistsIdCardPictures: String,
    artistProduceYourDownSoundRecordingAndOrMusicVideo: Boolean,
    artistDisabled: Boolean,
    artistOwnerId: String,
    artistUserRefer: { type: Schema.Types.ObjectId, ref: 'User' },
    artistMerkleRootRefer: { type: Schema.Types.ObjectId, ref: 'Merkle' },
    artistID: Number,
}, {
    usePushEach: true
});


module.exports = mongoose.model('Artist', artistSchema);

