// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;
// define the schema for our user model
var smartContractSchema = mongoose.Schema({
    versionName: String,
    baseRegDefaultAddress: String,
    Sol_BaseRegistrationABI:String,
    Sol_BaseRegistrationData: String,
    Sol_SongRecordingABI: String,
    Sol_SongRecordingData: String,
    Sol_WorkRegistrationABI: String,
    Sol_WorkRegistrationData: String,
    Sol_LicensingABI: String,
    Sol_LicensingData: String,
    Sol_MassRegistrationABI: String,
    Sol_MassRegistrationData: String,
    Sol_SPXTROSInterface: String,
    Sol_SPXTokenABI: String,
    Sol_SPXTokenData: String,
    versionStatus: Boolean,
});


// create the model for users and expose it to our app
module.exports = mongoose.model('SmartContract', smartContractSchema);
