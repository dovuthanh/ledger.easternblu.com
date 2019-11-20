var User        = require('../models/user');
var Song        = require('../models/song');
var Order       = require('../models/order');
var Artist      = require('../models/artist');
var Composer    = require('../models/composer');
var Country     = require('../models/country');
var Cart        = require('../models/cart');
var bcrypt      = require ('bcrypt');
var multer      = require('multer');
var bodyParser  = require('body-parser');
var path        = require('path');
const https     = require('https');
var fs          = require('fs');
var OneSignal   = require('onesignal-node');
var Guid        = require('guid');
var csrf_guid   = Guid.raw();
var Email       = require('./email.js');
const Request   = require('request');
const api_version   = 2.7;
const app_id        = process.env.FB_APP_ID;
const app_secret    = process.env.FB_APP_SECRET;
var kue = require('kue'), queue = kue.createQueue();
var Promise = require('promise');
const _ = require('lodash');
const BlockChain = require('./blockchain');
const Config = require('../../config/config');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider(Config.LinkTestNet));

var myClient = new OneSignal.Client({
    userAuthKey: process.env.ONE_SINGNAL_USER_AUTHENT,
    app: { appAuthKey: process.env.ONE_SINGNAL_APP_AUTHENT, appId: process.env.ONE_SIGNAL_APP_ID }
});

module.exports  = function(app, passport) {

    app.get('/new-work-registration', isLoggedIn, function(req, res){
        Country.find({}).exec(function(err, countries){
            res.render('works/work_registration', {
                countries: countries,
                session: req.session,
                menu_index: 'my-songs'
            });
        });
    });

    app.post('/new-work-registration', isLoggedIn, async function(req, res){
        var data = req.body;
        console.log(data);
        if (data) {
            var owner = req.session.passport.user.userWalletAddress;
            var composer_song_title = data.composer_romanized_title.length != 0 ? data.composer_song_title + ' (' + data.composer_romanized_title + ')' : data.composer_song_title;

            var Sol_WorkRegistrationABI = Config.Sol_WorkRegistrationABI;
            var Sol_WorkRegistrationData = Config.Sol_WorkRegistrationData;
            var [smartContract] = await Promise.all([
                SmartContract.findOne({status:true})
            ]);
            if(smartContract){
                Sol_WorkRegistrationABI = JSON.parse(smartContract.Sol_WorkRegistrationABI);
                Sol_WorkRegistrationData = JSON.parse(smartContract.Sol_WorkRegistrationData)
            }

            var workRegistrationContract = web3.eth.contract(Sol_WorkRegistrationABI);
            var workRegistrationData = workRegistrationContract.new.getData(owner, data.composer_song_title, data.composer_hash, data.composer_digital_signatures, "", false, {
              data: Sol_WorkRegistrationData
            });

            const serialized = BlockChain.ethRawTx('contract', workRegistrationData, Config.accountDefault, '');
            BlockChain.ethSendRawTransaction(serialized, (err, hash) => {
                if (hash) {
                    var composer = new Composer();
                    composer.composerName = data.composer_name;
                    composer.composerRomanizedName = data.composer_romanized_name;
                    composer.composerUserRefer = req.session.passport.user;
                    composer.composerAddress = data.composer_address;
                    composer.composerContactNumber = data.composer_contact_number;
                    composer.hasReleased = data.composer_has_released;
                    composer.hasReleasedSoundRecording = data.composer_has_released_sound_recording;
                    composer.hasReleasedKaraoke = data.composer_has_released_kara;
                    composer.hasReleasedThemeSong = data.composer_has_released_theme;
                    composer.hasReleasedGaming = data.composer_has_released_gaming;
                    composer.hasReleasedMusical = data.composer_has_released_musical;
                    composer.hasReleasedOthers = data.composer_has_released_other;
                    composer.composerSongTitle = data.composer_song_title;
                    composer.composerSongRomanizedTitle = data.composer_romanized_title;
                    composer.composerSongLengthOfTime = data.composer_length_of_time;
                    composer.composerSongDigitalSignatures = data.composer_digital_signatures;
                    composer.copyrightClaimReproductionMechanical = data.composer_copyright_rm;
                    composer.copyrightClaimSynchronisation = data.composer_copyright_sync;
                    composer.copyrightClaimAdaptation = data.composer_copyright_adaptation;
                    composer.copyrightClaimPublicPerformances = data.composer_copyright_public_perform;
                    composer.copyrightClaimCommunication = data.composer_copyright_communication;
                    composer.copyrightClaimBroadcasting = data.composer_copyright_broadcasting;
                    composer.composerCountry = data.composer_country;
                    composer.hasThePulicPerformanceRightCMOPRO = data.composer_has_public;
                    composer.hasThePulicBroadcastingRightCMOPRO = data.composer_has_broadcasting;
                    composer.hasAnyOtherRights = data.composer_has_any_right;
                    composer.rightsAnDurationReproductionMechanical = data.composer_time_rm;
                    composer.rightsAnDurationSynchronisation = data.composer_time_sync;
                    composer.rightsAnDurationAdaptation = data.composer_time_adaptation;
                    composer.composerFileExtension = data.composer_song_extension;
                    composer.composerFileSize = data.composer_song_size;
                    composer.composerBlockHash = hash;
                    composer.composerTempUrl = data.composer_song_temp_url;
                    composer.composerSongFileName = data.composer_song_file_name;
                    composer.composerHashOfSong = data.composer_hash;
                    composer.composerDateRegsiter = Date();
                    composer.composerDeployStatus = false;
                    console.log(composer);

                    composer.save(function(er1){
                        if (err) {
                            return res.json(200, {error: 1, msg: 'error'});
                        }

                        // https.get(data.composer_song_temp_url, (response) => {
                        //     var dir = __dirname;
                        //     var filePath = dir.replace('/backend', '') + '/public/uploads/audio/' + data.composer_song_file_name.replace('.mp3', '') + '.' + data.composer_song_extension;
                        //     var fileUpload = fs.createWriteStream(filePath);
                        //     response.pipe(fileUpload);

                        //     var formData = {
                        //         file: {
                        //             value: response,
                        //             options: {
                        //                 filename: data.composer_song_file_name.replace('.mp3') + '.' + data.composer_song_extension
                        //             }
                        //         }
                        //     };

                        //     Request.post({
                        //         url: 'http://upload.fileinject.yunfancdn.com/file/create?user=easternblu&token=cc9c481faa407a422fda94b7c6035dd1&key=' + data.composer_hash,
                        //         formData: formData
                        //     }, function(err2, response, body){
                        //         console.log(err2, body);
                        //         if (!err2) {
                        //             composer.composerDemoFileUrl = 'http://yfcdn.easternblu.com/' + data.composer_hash;
                        //             composer.save(function(err3){
                        //                 fs.unlink(filePath, (err4) => {
                        //                     console.log(err4);
                        //                 });
                        //             });
                        //         }
                        //     });
                        // });

                        new_block_transaction(hash, req.session.passport.user._id, req.session.passport.user.userEmail, req.session.passport.user.userFullName);
                        return res.json(200, {error: 0, msg: 'Successfull'});
                    });
                }else{
                    return res.json(200, {error: 1, msg: "error"});
                }
            });
        }else{
            return res.json(200, {error: 1, msg: "error"});
        }
    });

    app.get('/update-work-info', isLoggedIn, function(req, res){
        var _id = req.param('id');
        if (_id != undefined && _id.length > 0) {
            Composer.findOne({_id: _id}).exec(function(err, composer){
                if (err || !composer ) {
                    res.redirect('/my-songs');
                }else{
                    Country.find({}).exec(function(err1, countries){
                        res.render('works/update_work_info', {
                            composer: composer,
                            countries: countries,
                            session: req.session,
                            menu_index: 'my-songs'
                        });
                    });
                }
            });
        }else{
            res.redirect('/my-songs');
        }
    });

    app.post('/update-work-info', isLoggedIn, function(req, res){
        var data = req.body;
        console.log(data);
        if (data) {
            Composer.findOne({_id: data._id}).exec(function(err, composer){
                composer.composerRomanizedName = data.composer_romanized_name;
                composer.composerAddress = data.composer_address;
                composer.composerContactNumber = data.composer_contact_number;
                composer.hasReleased = data.composer_has_released;
                composer.hasReleasedSoundRecording = data.composer_has_released_sound_recording;
                composer.hasReleasedKaraoke = data.composer_has_released_kara;
                composer.hasReleasedThemeSong = data.composer_has_released_theme;
                composer.hasReleasedGaming = data.composer_has_released_gaming;
                composer.hasReleasedMusical = data.composer_has_released_musical;
                composer.hasReleasedOthers = data.composer_has_released_other;
                composer.composerSongRomanizedTitle = data.composer_romanized_title;
                composer.copyrightClaimReproductionMechanical = data.composer_copyright_rm;
                composer.copyrightClaimSynchronisation = data.composer_copyright_sync;
                composer.copyrightClaimAdaptation = data.composer_copyright_adaptation;
                composer.copyrightClaimPublicPerformances = data.composer_copyright_public_perform;
                composer.copyrightClaimCommunication = data.composer_copyright_communication;
                composer.copyrightClaimBroadcasting = data.composer_copyright_broadcasting;
                composer.composerCountry = data.composer_country;
                composer.hasThePulicPerformanceRightCMOPRO = data.composer_has_public;
                composer.hasThePulicBroadcastingRightCMOPRO = data.composer_has_broadcasting;
                composer.hasAnyOtherRights = data.composer_has_other;
                composer.rightsAnDurationReproductionMechanical = data.composer_time_rm;
                composer.rightsAnDurationSynchronisation = data.composer_time_sync;
                composer.rightsAnDurationAdaptation = data.composer_time_adaptation;

                composer.save(function(err1){
                    if (!err1) {
                        return res.json(200, {error: 0, msg: 'ok'});
                    }
                    return res.json(200, {error: 1, msg: 'Could not save data'});
                });
            });
        }else{
            return res.json(200, {error: 1, msg: 'Could not save data'});
        }
    });

    app.get('/add-composer-short-list/:id', isLoggedIn, function(req, res){
        var composer_id = req.params.id;
        Composer.findOne({_id: composer_id}).exec(function(err, composer){
            if(err || !composer){
                return res.json(200, {error: 1, msg: "error"});
            }else{
                var cart = new Cart(req.session.cart ? req.session.cart : {});
                if(composer.composerPictures.length>0){
                    cart.add(
                        composer.songUrl,
                        composer.songTitle,
                        composer.name,
                        composer.name,
                        composer.composerPictures[0],
                        composer.composerSongAddress,
                        composer.composerMangementAccount,
                        1,
                        composer_id
                    );
                }else{
                    cart.add(
                        composer.songUrl,
                        composer.songTitle,
                        composer.name,
                        composer.name,
                        "",
                        composer.composerSongAddress,
                        composer.composerMangementAccount,
                        1,
                        composer_id
                    );
                }
                req.session.cart = cart;
                console.log(req.session);
                return res.json(200, {error: 0, msg: "ok"});
            }
        });
    });

    app.get('/composer-insert',isLoggedIn ,function(req, res) {
         Song.find().exec(function(err, data){
            res.render('composer_insert', {
                songs: data,
                appId: app_id,
                csrf: csrf_guid,
                version: 'v1.0',
                session: req.session,
                menu_index:7
            });
        });
    });

    app.get('/add-composer-short-list/:id', isLoggedIn, function(req, res){
        var song_id = req.params.id;
        var song = Song.findOne(function(item) {
            return item.id == song_id;
        });
        if(!req.session.cart){
            var arrSong = [];
            arrSong.push(song);
            req.session.cart = arrSong;
        }else{
            var arrSong = req.session.cart;
            arrSong.push(song);
            req.session.cart = arrSong;
        }
    });

    app.post('/check-song-composer-exist',isLoggedIn,function(req,res){
        var data = req.body;
        Composer.findOne({composerHashOfSong: data.songHash}).exec(function(err, data){
            if (err){
                return res.json(200, { error: 1, msg: 'Sorry. Cannot upload this file' });
            }else if(data){
                return res.json(200, { error: 2, msg: 'Song composer has been registered' });
            }else{
                return res.json(200, { error: 0, msg: 'ok' });
            }
        });
    });

    app.get('/certificate-work', function(req, res) {
        var composer_address = req.param('composer_address');
        if(composer_address==undefined){
            res.redirect('/404');
        }else{
            Composer.findOne({composerSongAddress: composer_address}).exec(function(err, data){
                if(!err && data){
                    console.log(data);
                    Order.find({songAddress: composer_address}).exec(function(err2, data2){
                        res.render('verify/certificate_work', {
                            composer: data,
                            transactions: data2,
                            session: req.session,
                            menu_index:2
                        });
                    });
                }else{
                    res.redirect('/404');
                }
            });
        }
    });

    app.get('/search_work', function(req, res) {
        var song_title = req.param('song_title');
        var composer_name = req.param('composer_name');
        var conditionComposer = [];
        if(song_title ==undefined && ower_name==undefined && artist_name==undefined){
            res.render('search_work', {
                transactions: null,
                composers: null,
                song_title: song_title,
                ower_name: ower_name,
                session: req.session,
                menu_index:1
            });
            return;
        }
        if(song_title==undefined){
            song_title="";
        }else{
            if(song_title.length>0){
                conditionComposer.push({songTitle: new RegExp(song_title, 'i')});
            }
        }
        if(composer_name==undefined){
            composer_name="";
        }else{
            if(composer_name.length>0){
                conditionComposer.push({name: new RegExp(composer_name,'i')});
             }
        }
        console.log(conditionComposer);
        Composer.find(conditionComposer).exec(function(err, data1){
            if(!req.isAuthenticated()){
                res.render('search_work', {
                        transactions: null,
                        composers: data1,
                        song_title: song_title,
                        composer_name: composer_name,
                        session: req.session,
                        menu_index:1
                    });
            }else{
                Order.find().exec(function(err, data){
                    if(err){
                        res.redirect('/404');
                    }else{
                        res.render('search_work', {
                            transactions: data,
                            composers: data1,
                            song_title: song_title,
                            composer_name: composer_name,
                            session: req.session,
                            menu_index:1
                        });
                    }
                });
            }
        });
    });

    app.post('/publish-work', isLoggedIn, function(req, res){
        var dataReq = req.body;
        Composer.findOne({_id: dataReq.composer_id}).exec(function(err, composer){
            if (err || !composer) {
                res.json(200,{
                    err: 1, message: "Error"
                });
            }else{
                composer.hasTheMusicalCompositionBeenReleased = true;
                composer.save(function(err){
                    if (err) {
                        res.json(200,{
                            err: 1, message: "Error"
                        });
                    }else{
                        res.json(200,{
                            err: 0, message: "Success"
                        });
                    }
                });
            }
        });
    });

};

function new_block_transaction (block_hash, user_id, to, from){
  var job = queue.create('composer_recording_registration', {
    txHash: block_hash,
    user_id: user_id,
    from: from,
    to: to
  });

  job
    .on('complete', function (){
      console.log(1232131);
    })
    .on('failed', function (){
      console.log(12321312323232);
    })

  job.save();
}

queue.process('composer_recording_registration', function(job, done){
    try{
        console.log(job.data.txHash);
        var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
        if(receipt){
            console.log(receipt);
            Composer.findOne({composerBlockHash: receipt.transactionHash}).exec(function(err,composer){
                if(!composer){
                    return;
                }
                composer.composerContractAddress = receipt.contractAddress;
                composer.composerDeployStatus = true;
                if (receipt.status == 0x1) {
                  composer.verified = true; //deploy successed
                }else {
                  composer.verified = false;
                }
                composer.save(function(err1){
                    if(err1){
                        return;
                    }
                    var firstNotification;
                    if (receipt.status == 0x1) {
                      Email.send_work_deploy_success(job.data.to, job.data.from, composer._id, receipt.contractAddress);
                      firstNotification = new OneSignal.Notification({
                          contents: {
                              en: "Work registration deploy successed: "+receipt.transactionHash,
                              tr: "Work registration deploy successed: "+receipt.transactionHash,
                          }
                      });
                    }else{
                      firstNotification = new OneSignal.Notification({
                          contents: {
                              en: "Sorry. Work registration deploy failed: "+receipt.transactionHash,
                              tr: "Sorry. Work registration deploy failed: "+receipt.transactionHash,
                          }
                      });
                    }
                    firstNotification.setFilters([
                        {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
                    ]);

                    myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
                       if (err2) {
                           console.log('Something went wrong...');
                       } else {
                           console.log(data);
                       }
                    });
                });
            });
        }else{
            new_block_transaction(job.data.txHash, job.data.user_id);
        }
    }catch(ex){
        console.log(ex);
    }
    done && done();
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()){
        if(!req.session.passport.user.userEmailVerified){
            req.flash("loginMessage","Please verify your email");
            res.redirect('/email-confirmation?user_id='+req.session.passport.user._id);
        }else if(!req.session.passport.user.userSmsVerified){
            req.flash("loginMessage","Please verify your phone");
            res.redirect('/sms-confirmation?user_id='+req.session.passport.user._id);
        }else{
            return next();
        }
    }
    // res.flash('info','Please login');
    res.redirect('/sign-in');
}

function isLoggedInSignIn(req, res, next) {
    if(req){
        if (req.isAuthenticated())
            return next();
    }
}

function checkOwnerRole(req, res, next) {
    if(req){
        if (req.isAuthenticated())
            if(!req.session.passport.user.userEmailVerified){
                 req.flash("loginMessage","Please verify your email");
                 res.redirect('/email-confirmation?user_id='+req.session.passport.user._id);
            }else if(!req.session.passport.user.userSmsVerified){
                req.flash("loginMessage","Please verify your phone");
                res.redirect('/sms-confirmation?user_id='+req.session.passport.user._id);
            } else if(req.session.passport.user.userIsOwner){
                return next();
            }
    }
    req.flash('info',"You don't have permission. Please login as owner role");
    res.redirect('/permission');
}
