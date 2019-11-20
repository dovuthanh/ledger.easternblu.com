// load all the things we need
require('dotenv').config();
var LocalStrategy    = require('passport-local-roles').Strategy;
// load up the user model
var User             = require('../app/models/user');
var WalletBK        = require('../app/models/walletbk');
var email_helper     = require('../app/backend/email');
var Promise = require('promise');
// load the auth variables
var configAuth       = require('./auth'); // use this one for testing
var default_confirm_url = process.env.URL_HOST+'/confirmation?id=';
const EthereumWallet = require('ethereumjs-wallet');
const algosdk = require('algosdk');
const baseServer = "https://testnet-algorand.api.purestake.io/ps1";
const port = "";
const token = {
    'X-API-Key': 'AvMYi1rgR7ayT2D5MA34Y7Ku5IfNw76223Y69KTU'
}
const algodclient = new algosdk.Algod(token, baseServer, port);

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });    

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        roleField: 'role',
        passwordField : 'password',
        addressField : 'address',
        contactNoField : 'contactNo',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, role, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            User.findOne({'userAccountName' :  role}, function(err, user) {
                // if there are any errors, return the error
                console.log(role);
                if (err)
                    return done(err);
                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));

                if(!user.userApproved)
                    return done(null, false, req.flash('loginMessage', "Thanks You. We're creating your account"));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                var isSub = true;
                var isOwner = true;
                var isAdmin = false;
                if (user.account_id != role.toLowerCase() && user.account_id!=undefined && user.account_id.length >0){
                    isOwner = false;
                }

                if (user.account_id != role.toLowerCase() && user.account_id!=undefined &&  user.account_id.length >0){
                    isSub =false;
                }
                console.log(user._id, process.env.ADMIN_ID)
                if (user._id == process.env.ADMIN_ID){
                    isAdmin =true;
                }

                if(isOwner){
                    isSub =false;
                }
                if(!isOwner && !isSub){
                     return done(null, false, req.flash('loginMessage', 'Oops! Wrong wallet.'));   
                }
                if (user.userWalletAddress == role.toLowerCase()){
                    user.userIsOwner = true;
                }else if (user.userManagerWalletAddress == role.toLowerCase()){
                    user.userIsOwner = false;
                }
                user.userIsAdmin = isAdmin;
                return done(null, user);
            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        roleField: 'role',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, role, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
        console.log(req);
        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                User.findOne({ $or:[
                        // {'userEmail' :  email},
                        {'userAccountName' :  req['body'].account_id},
                    ] }, async function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);
                    // check to see if theres already a user with that email
                    if (user) {
                        if(user.userWalletAddress != undefined){
                            req.flash('formdata',req['body']);
                            console.log('return here 1: ' + req['body']);
                            return done(null, false, req.flash('signupMessage', 'User ID is already taken.'));
                        }else{
                            user.userWalletAddress = req['body'].role.toLowerCase();
                            user.save(function(err) {
                                if (err){
                                    return done(err);
                                }else{
                                    req.flash('formdata', req.body);
                                    return done(null, user);
                                }
                            });
                        }
                    } else {
                        // create the user
                        var seed ="";
                        var walletAddress = "";
                        var walletPrivateKey = "";
                        var newUser = new User();
                        //testing only:
                        newUser.userFullName = req['body'].user_name.trim();
                        newUser.userEmail = req['body'].email.trim();
                        newUser.userPhone = req['body'].user_phone;
                        newUser.userAddress = req['body'].user_address;
                        newUser.userCity = req['body'].user_city;
                        newUser.userPostalZip = req['body'].user_postal;
                        newUser.userCountry = req['body'].user_country;
                        newUser.userAvartar = "";
                        newUser.userCountryCode  = '+' + req['body'].user_code;
                        newUser.userManagerWalletAddress = req['body'].role.toLowerCase();
                        newUser.userWalletAddress = req['body'].role.toLowerCase();
                        newUser.userPassword = newUser.generateHash(password);
                        newUser.userIsCompany = true;
                        newUser.userAccountName = req['body'].account_id.trim();
                        newUser.userApproved = false;
                        newUser.userShowPrivateKeyBox = false;
                        newUser.userPassportImage = req['body'].image_file_url;
                        newUser.userCanDeployMassMigration = false;
                        newUser.userPassport =  req['body'].national_id;
                        newUser.userAddresProof =  req['body'].address_file_url;
                        const privateKey = req['body'].key;
                        if (req['body'].user_is_company == 'true') {
                            newUser.userIsCompany = true;
                        }else{
                            newUser.userIsCompany = false;
                        }
                        newUser.userEmailVerified = true;
                        newUser.userSmsVerified = true;
                        newUser.userIsOwner = true;
                        newUser.userCreated = new Date();

                        if(process.env.TESTING_MODE == 1){
                            var keys = algosdk.generateAccount();
                            console.log(keys);
                            // const myWallet = EthereumWallet.generate();
                            // walletAddress = keys.addr;//myWallet.getAddressString();
                            walletPrivateKey = keys.sk;//myWallet.getPrivateKeyString().replace('0x', '');
                            seed = algosdk.secretKeyToMnemonic(keys.sk);
                            newUser.userWalletAddress = keys.addr;
                            newUser.userManagerWalletAddress = newUser.userWalletAddress;
                            newUser.userFirstTime = false;
                            newUser.userCanDeployMassMigration = true;
                        }

                        var [result] = await Promise.all([newUser.save()]);
                        if(process.env.TESTING_MODE == 1){
                            var walletBK = new WalletBK();
                            walletBK.publicWallet = newUser.userWalletAddress;
                            walletBK.publicDeployKey = walletPrivateKey;
                            walletBK.publicDeploySeed = seed;
                            walletBK.created = new Date();
                            walletBK.userRefer = result;
                            // newUser.userApproved = true;
                            await Promise.all([walletBK.save()]);
                        }
                        if(process.env.TESTING_MODE == 1){
                            email_helper.send_approve_email(newUser.userEmail, newUser._id, "");
                        }else{
                            email_helper.send_confirmation_email(newUser.userEmail, newUser._id, "");
                        }
                        return done(null, newUser);
                    }
                });
            // if the user is logged in but has no local account...
            }else if ( !req.user.email ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account is being used by another user
                User.findOne({'userAccountName' :  req['body'].account_id}, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        req.flash('formdata',req['body']);
                        console.log('return here 2: ' + req['body']);
                        return done(null, false, req.flash('signupMessage', 'User ID is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        // user.local.address = address;
                        // user.local.contact_no = contactNo;
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            return done(null,user);
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }
        });
    }));


    passport.use('normal-local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        roleField: 'role',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, role, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
        console.log(req);
        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                User.findOne({ $or:[
                        // {'userEmail' :  email},
                        {'userAccountName' :  req['body'].account_id},
                    ] }, async function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);
                    // check to see if theres already a user with that email
                    if (user) {
                        if(user.userWalletAddress != undefined){
                            req.flash('formdata',req['body']);
                            console.log('return here 1: ' + req['body']);
                            return done(null, false, req.flash('signupMessage', 'User ID is already taken.'));
                        }else{
                            user.userWalletAddress = req['body'].role.toLowerCase();
                            user.save(function(err) {
                                if (err){
                                    return done(err);
                                }else{
                                    req.flash('formdata', req.body);
                                    return done(null, user);
                                }
                            });
                        }
                    } else {
                        // create the user
                        var newUser = new User();
                        //testing only:
                        newUser.userFullName = req['body'].user_name.trim();
                        newUser.userEmail = req['body'].email.trim();
                        newUser.userPhone = req['body'].user_phone;
                        newUser.userAddress = req['body'].user_address;
                        newUser.userCity = req['body'].user_city;
                        newUser.userPostalZip = req['body'].user_postal;
                        newUser.userCountry = req['body'].user_country;
                        newUser.userAvartar = "";
                        newUser.userCountryCode  = '+' + req['body'].user_code;
                        newUser.userManagerWalletAddress = req['body'].role.toLowerCase();
                        newUser.userWalletAddress = req['body'].role.toLowerCase();
                        newUser.userPassword = newUser.generateHash(password);
                        newUser.userIsCompany = true;
                        newUser.userAccountName = req['body'].account_id.trim();
                        newUser.userApproved = false;
                        newUser.userShowPrivateKeyBox = false;
                        newUser.userPassportImage = req['body'].image_file_url;
                        newUser.userCanDeployMassMigration = true;
                        newUser.userPassport =  req['body'].national_id;
                        newUser.userAddresProof =  req['body'].address_file_url;
                        const privateKey = req['body'].key;
                        if (req['body'].user_is_company == 'true') {
                            newUser.userIsCompany = true;
                        }else{
                            newUser.userIsCompany = false;
                        }
                        newUser.userEmailVerified = true;
                        newUser.userSmsVerified = true;
                        newUser.userIsOwner = true;
                        newUser.userShowPrivateKeyBox = true;
                        newUser.userCreated = new Date();

                        if(process.env.TESTING_MODE == 1){
                            newUser.userFirstTime = false;
                            newUser.userCanDeployMassMigration = true;
                        }

                        var [result] = await Promise.all([newUser.save()]);
                        if(process.env.TESTING_MODE == 1){                              
                            email_helper.send_approve_email(newUser.userEmail, newUser._id, "");
                        }else{
                            email_helper.send_confirmation_email(newUser.userEmail, newUser._id, "");
                        }
                        return done(null, newUser);
                    }
                });
            // if the user is logged in but has no local account...
            }else if ( !req.user.email ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account is being used by another user
                User.findOne({'userAccountName' :  req['body'].account_id}, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        req.flash('formdata',req['body']);
                        console.log('return here 2: ' + req['body']);
                        return done(null, false, req.flash('signupMessage', 'User ID is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        // user.local.address = address;
                        // user.local.contact_no = contactNo;
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            return done(null,user);
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }
        });
    }));

    function checkOwnerRole(req, res, next) {
        if(req){
            if (req.isAuthenticated())
                if(req.session.passport.user.userIsOwner){
                    return next();
                }
        }
        res.redirect('/');
    }

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('mass-migration-local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        roleField: 'role',
        passwordField : 'password',
        addressField : 'address',
        contactNoField : 'contactNo',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, role, done) {
        // asynchronous
        process.nextTick(function() {
            User.findOne({ 'userAccountName' :  email }, function(err, user) {
                // if there are any errors, return the error
                if(role == undefined){
                    role = "";
                }
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                var isSub = false;
                var isOwner = true;
                var isAdmin = false;
                // if (user.userWalletAddress != role.toLowerCase() && user.userWalletAddress!=undefined && user.userWalletAddress.length >0){
                //     isOwner = false;
                // }

                // if (user.userManagerWalletAddress != role.toLowerCase() && user.userManagerWalletAddress!=undefined &&  user.userManagerWalletAddress.length >0){
                //     isSub =false;
                // }
                // console.log(user._id, process.env.ADMIN_ID)
                // if (user._id == process.env.ADMIN_ID){
                //     isAdmin =true;
                // }

                if(isOwner){
                    isSub =false;
                }
                if(!isOwner && !isSub){
                     return done(null, false, req.flash('loginMessage', 'Oops! Wrong wallet.'));   
                }
                if(user.userManagerWalletAddress.length ==0 && user.userWalletAddress ===0){
                    user.userIsOwner = true;
                }else{
                    if (user.userWalletAddress == role.toLowerCase()){
                        user.userIsOwner = true;
                    }else if (user.userManagerWalletAddress == role.toLowerCase()){
                        user.userIsOwner = false;
                    }
                }
                user.userIsAdmin = isAdmin;
                return done(null, user);
            });
        });

    }));

    // =========================================================================
    // mass-registration-local-signup SIGNUP ============================================================
    // =========================================================================
    passport.use('mass-registration-local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        roleField: 'role',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, role, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
        console.log(req);
        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                 User.findOne({ $or:[
                        // {'userEmail' :  email},
                        {'userAccountName' :  role},
                    ] }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);
                    // check to see if theres already a user with that email
                    if (user) {
                        req.flash('formdata',req['body']);
                        console.log('return here 1: ' + req['body']);
                        return done(null, false, req.flash('signupMessage', 'User ID is already taken.'));
                    } else {
                        // create the user
                        var newUser = new User();
                        //testing only:
                        newUser.userFullName = req['body'].user_name;
                        newUser.userEmail = req['body'].email;
                        newUser.userPhone = req['body'].user_phone;
                        newUser.userAddress = req['body'].user_address;
                        newUser.userCity = req['body'].user_city;
                        newUser.userPostalZip = req['body'].user_postal;
                        newUser.userCountry = req['body'].user_country;
                        newUser.userAvartar = "";
                        newUser.userCountryCode  = '+' + req['body'].user_code;
                        newUser.userManagerWalletAddress = "";
                        newUser.userWalletAddress = "";
                        newUser.userPassword = newUser.generateHash(password);
                        newUser.userIsCompany = true;
                        newUser.userAccountName = req['body'].account_id;
                        newUser.userCanDeployMassMigration = false;
                        newUser.userApproved = false;
                        newUser.userShowPrivateKeyBox = false;
                        newUser.userPassportImage = req['body'].image_file_url;
                        newUser.userPassport =  req['body'].national_id;
                        newUser.userAddresProof =  req['body'].address_file_url;
                        newUser.userCreated = new Date();
                        // const privateKey = req['body'].key;
                        if (req['body'].user_is_company == 'true') {
                            newUser.userIsCompany = true;
                        }else{
                            newUser.userIsCompany = false;
                        }
                        newUser.userEmailVerified = true;
                        newUser.userSmsVerified = true;
                        newUser.userIsOwner = true;
                        newUser.save(function(err, user) {
                            if (err){
                                req.flash('formdata', req.body);
                                return done(err);
                            }else{
                                email_helper.send_confirmation_email_for_mass_migration(user.userEmail, user._id);
                                return done(null, user);
                            }
                        });
                    }
                });
            // if the user is logged in but has no local account...
            }else if ( !req.user.email ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account is being used by another user
                User.findOne({ 'userAccountName' :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        req.flash('formdata',req['body']);
                        console.log('return here 2: ' + req['body']);
                        return done(null, false, req.flash('signupMessage', 'User ID is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        // user.local.address = address;
                        // user.local.contact_no = contactNo;
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            return done(null,user);
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }
        });
    }));

    function checkOwnerRole(req, res, next) {
        if(req){
            if (req.isAuthenticated())
                if(req.session.passport.user.userIsOwner){
                    return next();
                }
        }
        res.redirect('/');
    }


};
