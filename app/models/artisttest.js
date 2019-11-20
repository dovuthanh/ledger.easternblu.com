// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var artisttestSchema = mongoose.Schema({
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
    artistUserRefer: { type: Schema.Types.ObjectId, ref: 'UserTest' },
    artistMerkleRootRefer: { type: Schema.Types.ObjectId, ref: 'Merkle' },
}, {
    usePushEach: true
});


module.exports = mongoose.model('ArtistTest', artisttestSchema);

