// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    userToken: String,
    userName:String,
    userAccountName:String,
    userFullName: String,
    userNonRomanizedName: String,
    userEmail: String,
    userPhone: String,
    userCountryCode: String,
    userAddress: String,
    userCity: String,
    userCountry: String,
    userPostalZip: Number,
    userRole: String,
    userAvartar: String,
    userIsCompany: Boolean,
    userManagerWalletAddress: String,
    userWalletAddress: String,
    userDeployKey: String,
    userDeploySeed: String,
    userDeployPassword: String,
    userPassword: String,
    userIsOwner: Boolean,
    userIsAdmin: Boolean,
    userSmsVerified: Boolean,
    userEmailVerified: Boolean,
    userIsStandardOrInvestor: Boolean,
    userBankName: String,
    userBankAccountNumber: String,
    userBankAccountName:String,
    userSwiftCode: String,
    userBankAddress: String,
    userSkipUploadArtistAndSong: Boolean,
    userApproved: Boolean, //for KYC
    userPassport: String,
    userPassportImage: String,
    userAddresProof: String,
    userFirstTime: Boolean,
    userCanDeployMassMigration: Boolean,
    userShowPrivateKeyBox: Boolean,
    qrcodeImage: String,
    userCreated: Date
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.userPassword);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);


