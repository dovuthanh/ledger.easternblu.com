var User        = require('../models/user');
var Song        = require('../models/song');
var Order       = require('../models/order');
var Artist      = require('../models/artist');
var Composer    = require('../models/composer');
var Royalty     = require('../models/royalty');
var Cart        = require('../models/cart');
var Merkle      = require('../models/merkle');
var Export      = require('../models/export');
var WalletBK      = require('../models/walletbk');
var SmartContract      = require('../models/smartcontract');
var MerkleDeploy      = require('../models/merkledeploy');
var Email       = require('./email.js');
var ExportData  = require('./export-data.js');
var bcrypt      = require ('bcrypt');
var crypto      = require('crypto')
var merkle      = require('merkle-lib')
var fastRoot    = require('merkle-lib/fastRoot')
var merkleProof = require('merkle-lib/proof')
var multer      = require('multer');
var bodyParser  = require('body-parser');
var formidable  = require('formidable');
var OneSignal   = require('onesignal-node');
var Guid        = require('guid');
var MerkleTools = require('merkle-tools')
const https      = require('https');
var fs          = require('fs');
var path = require('path'); 
var csrf_guid   = Guid.raw();
var kue         = require('kue'),
queue = kue.createQueue();
const Request   = require('request');
const Querystring  = require('querystring');
require('dotenv').config();
const confirmation_royalty_address = process.env.CONFIRM_ROYALTY_PARTNER_ADDRESS;
const api_version   = 2.7;
const app_id        = process.env.FB_APP_ID;
const app_secret    = process.env.FB_APP_SECRET;
var Promise = require('promise');
const { forEach } = require('p-iteration');
var pinyin = require("chinese-to-pinyin");
const _ = require('lodash');
const PinYin = require('hanzi-to-pinyin');
const BlockChain = require('./blockchain');
const Config = require('../../config/config');
var Web3 = require('web3');
var Iconv     = require("iconv").Iconv;
var iconv     = new Iconv('utf8', 'utf16le');
var web3 = new Web3(new Web3.providers.HttpProvider(Config.LinkTestNet));
var myClient = new OneSignal.Client({
    userAuthKey: process.env.ONE_SINGNAL_USER_AUTHENT,
    app: { appAuthKey: process.env.ONE_SINGNAL_APP_AUTHENT, appId: process.env.ONE_SIGNAL_APP_ID }
});

module.exports  = function(app, passport, paginate) {

    app.post('/api/mass/owner-sign-data',isLoggedIn, async function(req, res){
        var token = req.param('token');
        var batch_id = req.body.merkle_id;

        return res.json(200, {status: 200, message: 'Results', results: songs});
    });

    app.post('/api/mass/delete-song',isLoggedIn, async function(req, res){
        var token = req.param('token');
        var batch_id = req.body.merkle_id;
        var song_id = req.body.song_id;
        if (token == undefined || token.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }

        const [merkle_root] = await Promise.all([
            Merkle.findOne({batchId: batch_id}).exec()
        ]);

        if (!merkle_root) {
            return res.json(200, {status: 401, message: 'Unauthorised.'});
        }

        const [user] = await Promise.all([
            User.findOne({userToken: token}).exec()
        ]);

        if (!user) {
            return res.json(200, {status: 401, message: 'Unauthorised.'});
        }
        var [songCheck] = await Promise.all([
            Song.findOne({
                $and:[
                    {_id: song_id},
                    {songMerkleRootRefer: merkle_root._id},
                    {songUserRefer: req.session.passport.user._id},
                    {$or:[
                        {contractAddress:{ $exists: false}},
                        {contractAddress:{ "$ne": ""}},
                    ]}
                ]
            }).exec()
        ]);
        if(!songCheck){
            return res.json(400, {status: 400, message: 'Not found.'});
        }else{
            var [resul] = await Promise.all([
                songCheck.remove()
            ]);
        }
        return res.json(400, {status: 200, message: 'Song has been removed from'});
    });

    app.post('/api/mass/delete-batch',isLoggedIn, async function(req, res){
        var merkle_id = req.body.id;
        var [new_merkle] = await Promise.all([
            Merkle.findOne({
                $and:[
                    {_id: merkle_id},
                    {userRefer: req.session.passport.user._id},
                    {isCompleted: false}
                    // {$or:[
                    //     {contractAddress: {$exists: false}},
                    //     {contractAddress: {"$ne": ""}},
                    // ]}
                ]
            }).exec()
        ]);
        if(!new_merkle){
            return res.json(400, {status: 400, message: 'Not found.'});
        }else{
            var [songs] = await Promise.all([
                Song.remove({songMerkleRootRefer: new_merkle._id}).exec()
            ]);

            var [result] = await Promise.all([
                new_merkle.remove()
            ]);

            return res.json(200, {status: 200, message: 'Batch has been removed.'});
        }
    });

    app.post('/api/mass/confirm-deploy',isLoggedIn, async function(req, res){
        var merkle_id = req.body.id;
        var [new_merkle] = await Promise.all([
            Merkle.findOne({
                $and:[
                    {_id: merkle_id},
                    {userRefer: req.session.passport.user._id}
                ]
            }).exec()
        ]);
        if(!new_merkle){
            return res.json(400, {status: 400, message: 'Data not found.'});
        }else{
            new_merkle.confirmed = true;
            var [result] = await Promise.all([
                new_merkle.save()
            ]);
            return res.json(200, {status: 200, message: 'Confirmed.'});
        }
    });
    
    app.get('/api/mass/list-waiting-songs', multer().fields([]), async function(req, res) {
        var token = req.param('token');
        var userId = req.param('id');
        var batchId = req.param('batch_id');
        if (token == undefined || token.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }

        const [user] = await Promise.all([
            User.findOne({userToken: token}).exec()
        ]);

        if (!user) {
            return res.json(200, {status: 401, message: 'Unauthorised.'});
        }

        const [merkle_root] = await Promise.all([
            Merkle.findOne({batchId: batchId}).exec()
        ]);

        if (!merkle_root) {
            return res.json(200, {status: 401, message: 'Unauthorised.'});
        }

        var songs;
        if (user.userWalletAddress.toLowerCase() == '0xf7cc551106a1f4e2843a3da0c477b6f77fa4a09d') { // this is admin
            [songs] = await Promise.all([
                Song.find({
                    $and: [
                        {songIsMassRegistration: true},
                        {songDeployStatus: false},
                        {songMerkleRoot: ''},
                        {songHash: ''},
                        {songMerkleRootRefer: merkle_root._id}
                    ]
                })
                .populate('songArtistRefer')
                .exec()
            ]);
        }else{
            [songs] = await Promise.all([
                Song.find({
                    $and: [
                        {songIsMassRegistration: true},
                        {songDeployStatus: false},
                        {songMerkleRoot: ''},
                        {songHash: ''},
                        {songUserRefer: user._id},
                        {songMerkleRootRefer: merkle_root._id}
                    ]
                })
                .populate('songArtistRefer')
                .exec()
            ]);
        }

        if (!songs) {
            return res.json(200, {status: 400, message: 'Data not found', results: []});
        }

        return res.json(200, {status: 200, message: 'Results', results: songs});
    });

    app.post('/api/mass/save-mass-registration', isLoggedIn, async function(req, res){
        var data = req.body;
        var arrayItemSigned = data.digital_signatures;
        var merkle_root_id = data.merkle_root_id;
        var user = req.session.passport.user;
        if (!user) {
            return res.json(200, {error: 1, msg: 'Sorry. Could not save mass registration'});
        }

        var [new_merkle] = await Promise.all([
            Merkle.findOne({_id: merkle_root_id})
                .exec()
        ]);

        if(!new_merkle){
            return res.json(200, {error: 1, msg: 'Sorry. batchId is not correct'});
        }

        var [songMerkles] = await Promise.all([
            Song.find({songMerkleRootRefer: merkle_root_id},'_id songHash').exec()
        ]);

        if(songMerkles.length ==0 || arrayItemSigned.length == 0){
            return res.json(200, {error: 1, msg: 'Sorry. Something wrong'});
        }
        if(req.session.passport.user.userCanDeployMassMigration && songMerkles.length>1){
            new_merkle.ownerPublicKey = data.public_key;
            new_merkle.digitalSignature = arrayItemSigned[0].digital_signature;
            var [result]  = await Promise.all([
                new_merkle.save()
            ]);
            var [result1] = await Promise.all([
                Song.update(
                    {songMerkleRootRefer: new_merkle._id},
                    {"$set": {"songOwnerContractAddressDeploy": arrayItemSigned[0].ownerAddress}},{ multi: true }, function(error){
                })
              ]);
            return res.json(200, {status: 200, error: 0, message: 'songs singed successed.'});
        }else{
            for(var i = 0; i<arrayItemSigned.length; i++){
                var [song] = await Promise.all([
                    Song.findOne({_id: arrayItemSigned[i].id})
                ]);
                if(song){
                    song.songDigitalSignature = arrayItemSigned[i].digital_signature;
                    song.songOwnerContractAddressDeploy = arrayItemSigned[i].ownerAddress;
                    song.songIsMassRegistration = false;
                    var [result]  = await Promise.all([
                        song.save()
                    ]);               
                }
            }
            new_merkle.ownerPublicKey = data.public_key;
            var [result]  = await Promise.all([
                new_merkle.save()
            ]);
            return res.json(200, {status: 200, error: 0, message: 'songs singed successed.'});
        }
    });

    app.post('/api/mass/admin-deploy-mass-registration', checkOwnerRole, async function(req, res) {
        var data = req.body;
        const id = data.id;

        if (id == undefined) {
            return res.json(200, {error: 1, msg: 'Could not found merkle root'});
        }
        
        const [merkle] = await Promise.all([
            Merkle.findOne({_id: id}).populate('userRefer').exec()
        ]);

        if (!merkle) {
            return res.json(200, {error: 1, msg: 'Could not found merkle root'});
        }

        var Sol_MassRegistrationABI = Config.Sol_MassRegistrationABI;
        var Sol_MassRegistrationData = Config.Sol_MassRegistrationData;
        var [smartContract] = await Promise.all([
            SmartContract.findOne({status:true})
        ]);
        if(smartContract){
            Sol_MassRegistrationABI = JSON.parse(smartContract.Sol_MassRegistrationABI);
            Sol_MassRegistrationData = JSON.parse(smartContract.Sol_MassRegistrationData)
        }

        const massRegistrationContract = web3.eth.contract(Sol_MassRegistrationABI);
        const payloadData = massRegistrationContract.new.getData(merkle.userRefer.userManagerWalletAddress, merkle.merkleRoot, merkle.digitalSignature, {
            data: Sol_MassRegistrationData
        });

        const serialized = BlockChain.ethRawTx('contract', payloadData, Config.accountDefault, '');
        BlockChain.ethSendRawTransaction(serialized, (err, hash) => {
            if (hash) {
                merkle.blockHash = hash;
                merkle.save(function(err){
                    if(err){
                        return res.json(200, {error: 1, msg: 'Sorry. Could not save mass registration'});
                    }else{
                        // new_block_transaction(hash, req.session.passport.user._id);
                        return res.json(200, {error: 0, msg: 'ok'});
                    }
                });
            }else{
                return res.json(200, {error: 1, msg: 'Sorry. Could not save mass registration'});
            }
        });
    });

    // app.post('/api/mass/deploy-mass-registration', isLoggedIn, async function(req, res) {
    //     var data = req.body;
    //     const id = data.id;

    //     if (id == undefined) {
    //         return res.json(200, {error: 1, msg: 'Could not found merkle root'});
    //     }
        
    //     const [merkle] = await Promise.all([
    //         Merkle.findOne({_id: id}).populate('userRefer').exec()
    //     ]);

    //     if (!merkle) {
    //         return res.json(200, {error: 1, msg: 'Could not found merkle root'});
    //     }

    //     var [count] = await Promise.all([
    //         Song.count({songMerkleRootRefer: merkle._id}).exec()
    //     ]);

    //     if(count ==0){
    //         return res.json(200, {error: 1, msg: 'Batch is empty'});
    //     }
    //     var paging = count/3;
    //     for (var i = 0; i <= paging; i++) {
    //         var _songTitle1 = "";
    //         var _songTitle2 = "";
    //         var _songTitle3 = "";
    //         var _hash1 = "" ;
    //         var _hash2 = "";
    //         var _hash3 = "" ;
    //         var _digital1 = "" ;
    //         var _digital2 = "" ;
    //         var _digital3 = "";
    //         var _duration1 = "";
    //         var _duration2 = "";
    //         var _duration3 = "";
    //         var _publishDate1 = "";
    //         var _publishDate2 = "";
    //         var _publishDate3 = "";
    //         var _professionalName1 = "" ;
    //         var _professionalName2 = "" ;
    //         var _professionalName3 = "" ;
    //         var [songs] = await Promise.all([
    //             Song.find({
    //                 $and:[
    //                     {songMerkleRootRefer: merkle._id},
    //                     {songMerkleDeployRefer :{$exists: false}}
    //                 ]
    //             }).limit(Config.limitSongDeploy)
    //         ]);
    //         if(songs && songs.length > 0){
    //             var arrayOwner = [];
    //             for (var j = 0; j < songs.length; j++) {
    //                 var song = songs[j];
    //                 arrayOwner.push(merkle.ownerPublicKey);
    //                 if(j==0){
    //                     _songTitle1 = song.songTitle;
    //                     _hash1 = song.songHash;
    //                     _digital1 = song.songDigitalSignature;
    //                     _duration1 = song.songDuration;
    //                     _publishDate1 = song.songPublish;
    //                     _professionalName1 = song.songArtistNameTemp;
    //                 }else if(j==1){
    //                     _songTitle2 = song.songTitle;
    //                     _hash2 = song.songHash;
    //                     _digital2 = song.songDigitalSignature;
    //                     _professionalName2 = song.songArtistNameTemp;
    //                     _publishDate2 = song.songPublish;
    //                     _duration2 = song.songDuration;
    //                 }else {
    //                     _songTitle3 = song.songTitle;
    //                     _hash3 = song.songHash;
    //                     _digital3 = song.songDigitalSignature;
    //                     _professionalName3 = song.songArtistNameTemp;
    //                     _duration3 = song.songDuration;
    //                     _publishDate3 = song.songPublish;
    //                 }
    //             }
    //             var merkleDeploy = new MerkleDeploy();
    //             merkleDeploy.arrayOwner = arrayOwner;
    //             merkleDeploy.songTitle1 = _songTitle1;
    //             merkleDeploy.songTitle2 = _songTitle2;
    //             merkleDeploy.songTitle3 = _songTitle3;
    //             merkleDeploy.hash1 = _hash1;
    //             merkleDeploy.hash2 = _hash2;
    //             merkleDeploy.hash3 = _hash3;
    //             merkleDeploy.digital1 = _digital1;
    //             merkleDeploy.digital2 = _digital2;
    //             merkleDeploy.digital3 = _digital3;
    //             merkleDeploy.professionalName1 = _professionalName1;
    //             merkleDeploy.professionalName2 = _professionalName2;
    //             merkleDeploy.professionalName3 = _professionalName3;
    //             merkleDeploy.duration1 = _duration1;
    //             merkleDeploy.duration2 = _duration2;
    //             merkleDeploy.duration3 = _duration3;
    //             merkleDeploy.publishDate1 = _publishDate1;
    //             merkleDeploy.publishDate2 = _publishDate2;
    //             merkleDeploy.publishDate3 = _publishDate3;
    //             merkleDeploy.merkleRefer = merkle;
    //             merkleDeploy.deployStatus = 0;
    //             merkleDeploy.blockHash = "";
    //             merkleDeploy.contractAddress ="";
    //             merkleDeploy.userRefer = req.session.passport.user;
    //             merkleDeploy.createDate = new Date();
    //             var [result]  = await Promise.all([
    //                 merkleDeploy.save()
    //             ]);
    //             for (var j = 0; j < songs.length; j++) {
    //                 var song = songs[j];
    //                 song.songMerkleDeployRefer = result;
    //                 var [result1]  = await Promise.all([
    //                     song.save()
    //                 ]);
    //             }
    //         }
    //     }
    //     merkle.deployStatus = 1; 
    //      var [result]  = await Promise.all([
    //         merkle.save()
    //     ]);
    //     return res.json(200, {error: 0, msg: 'ok'});
    // });
    app.post('/api/mass/deploy-mass-registration', isLoggedIn, async function(req, res) {
        var data = req.body;
        const id = data.id;

        if (id == undefined) {
            return res.json(200, {error: 1, msg: 'Could not found merkle root'});
        }
        
        var [merkle] = await Promise.all([
            Merkle.findOne({_id: id}).populate('userRefer').exec()
        ]);

        if (!merkle) {
            return res.json(200, {error: 1, msg: 'Could not found merkle root'});
        }

        var [count] = await Promise.all([
            Song.count({songMerkleRootRefer: merkle._id}).exec()
        ]);

        if(count ==0){
            return res.json(200, {error: 1, msg: 'Batch is empty'});
        }

        var [songs] = await Promise.all([
            Song.find({songMerkleRootRefer: merkle._id}).exec()
        ]);
        // var merkle_root = '';
        // if(res.session.passport.user.userCanDeployMassMigration){
        //     var arrayHash = [];
        //     var readyToDeploy = true;
        //     songs.forEach(async function (song) {
        //         if(song.songHash.length > 0 && song.songHash){
        //             arrayHash.push(song.songHash);
        //         }else{
        //             readyToDeploy = false;
        //         }
        //     });
        //     if(arrayHash.length>0 && !readyToDeploy){
        //         var dataInput = arrayHash.map(x => new Buffer(x, 'hex'));
        //         var merkleTools = new MerkleTools();
        //         merkleTools.addLeaves(dataInput);
        //         merkleTools.makeTree();
        //         var root = merkleTools.getMerkleRoot();
        //         if(root){
        //             merkle_root = root.toString('hex');
        //         }
        //     }
        //     if(!readyToDeploy){
        //         return res.json(200, {error: 1, msg: 'Something wrong. Please check your song information'});
        //     }
        // }else{

        // }
        merkle.deployStatus = 1; 
        merkle.isDeploying = 0;
        var [result]  = await Promise.all([
            merkle.save()
        ]);
        return res.json(200, {error: 0, msg: 'ok'});
    });

    app.post('/api/mass/save-song-mass', isLoggedIn, async function(req, res) {
        var data = req.body;
        console.log(data);

        var id = data.id;
        if (id == undefined) {
            id = req.session.passport.user._id;
        }

        var artist;
        var composer;
        var lyric;

        const [user] = await Promise.all([
            User.findOne({_id: id}).exec()
        ]);

        if (!user) {
            return res.json(200, {error: 1, msg: 'Permission denied'});
        }

        if (data.artist.length != 0) {
            [artist] = await Promise.all([
                Artist.findOne({
                    $and: [
                        {artistProfessionName: data.artist.replace(' ', '')},
                        {artistType: 'Artist'}
                    ]
                }).exec()
            ]);

            if (!artist) {
                var new_artist = new Artist();
                new_artist.artistProfessionName = data.artist.replace(' ', '');
                new_artist.artistNameInPassportOfficialIdentificationCard = data.artist.replace(' ', '');
                new_artist.artistManagementAccount = user.userManagerWalletAddress;
                new_artist.artistOwnerId = user._id;
                new_artist.artistType = 'Artist';
                new_artist.artistUserRefer = user;
                new_artist.artistID = new Date().getTime();
                [artist] = await Promise.all([
                    new_artist.save()
                ]);
            }
        }

        if (data.composer.length != 0) {
            [composer] = await Promise.all([
                Artist.findOne({
                    $and: [
                        {artistProfessionName: data.composer.replace(' ', '')},
                        {artistType: 'Composer'}
                    ]
                }).exec()
            ]);

            if (!composer) {
                var new_artist = new Artist();
                new_artist.artistID = new Date().getTime();
                new_artist.artistProfessionName = data.composer.replace(' ', '');
                new_artist.artistNameInPassportOfficialIdentificationCard = data.composer.replace(' ', '');
                new_artist.artistManagementAccount = user.userManagerWalletAddress;
                new_artist.artistOwnerId = user._id;
                new_artist.artistType = 'Composer';
                new_artist.artistUserRefer = user;
                [composer] = await Promise.all([
                    new_artist.save()
                ]);
            }
        }

        if (data.lyric.length != 0) {
            [lyric] = await Promise.all([
                Artist.findOne({
                    $and: [
                        {artistProfessionName: data.lyric.replace(' ', '')},
                        {artistType: 'Lyricist'}
                    ]
                }).exec()
            ]);

            if (!lyric) {
                var new_artist = new Artist();
                new_artist.artistID = new Date().getTime();
                new_artist.artistProfessionName = data.lyric.replace(' ', '');
                new_artist.artistNameInPassportOfficialIdentificationCard = data.lyric.replace(' ', '');
                new_artist.artistManagementAccount = user.userManagerWalletAddress;
                new_artist.artistOwnerId = user._id;
                new_artist.artistType = 'Lyricist';
                new_artist.artistUserRefer = user;
                [lyric] = await Promise.all([
                    new_artist.save()
                ]);
            }
        }

        console.log(artist);
        console.log(composer);
        console.log(lyric);

        var song = new Song();
        song.songID = new Date().getTime();
        song.songTitle = data.title;
        song.songCatNo = data.cat;
        song.songUrl =  data.temp_url;
        song.songHash = data.hash;
        song.songOwnerName = user.userFullName;
        song.songOwnerContractAddress = user.userManagerWalletAddress;
        song.createAt = new Date();
        song.updatedAt = new Date();
        song.songHash ="";
        song.songExtension = data.ext,
        song.songSize = data.size;
        song.songDeployStatus = false;
        song.songIsMassRegistration = true;
        song.songMerkleRoot = '';
        song.songArtistRefer = artist;
        song.songComposerRefer = composer;
        song.songLyricRefer = lyric;
        song.songContractAddress = "";
        // song.songUrl = 'http://yfcdn.easternblu.com/' + data.hash;

        song.save(function(err){
            if(err){
                return res.json(200, {error: 1, msg: 'Sorry. Cannot save this file'});
            }
            return res.json(200, {error: 0, msg: 'ok'});
        });
    });

    app.post('/api/mass/mass_registration_proof', function(req, res){
        var dataReq = req.body;
        var merkle_root = dataReq.merkle_root;
        var hash_of_songs = dataReq.hash_of_songs;
        console.log(hash_of_songs);
        Song.find({songMerkleRoot: merkle_root}).exec(function(error, songs){
            if(error || !songs || songs.lenth ==0){
                res.json(200,{error: 1, msg: "Not found merkle root"});
            }else{
                var arrayHash=[];
                songs.forEach(function (song) {
                    arrayHash.push(song.songHash);
                });
                console.log(arrayHash);
                var index_hash = arrayHash.indexOf(hash_of_songs);
                if(index_hash<0){
                    res.json(200,{error: 1, msg: "invalid hash 1"});
                }else{
                    var dataInput = arrayHash.map(x => new Buffer(x, 'hex'));
                    var merkleTools = new MerkleTools()
                    merkleTools.addLeaves(dataInput);
                    merkleTools.makeTree();
                    console.log(merkleTools.getLeafCount());
                    console.log(merkleTools.getMerkleRoot().toString('hex'));
                    if(merkle_root != merkleTools.getMerkleRoot().toString('hex')){
                        res.json(200,{error: 1, msg: "invalid merkle root"});
                    }else{
                        res.json(200,{error: 0, msg: "valid hash"});
                    }
                }
            }
        });
    });

    app.post('/api/mass/admin-convert-romanized', checkOwnerRole, async function(req, res) {
        var talents = [];
        [talents] = await Promise.all([
            Artist.find({}).exec()
        ]);

        talents.forEach((talent) => {
            if (talent.artistNonRomanizedName == undefined || talent.artistNonRomanizedName.length == 0) {
                PinYin(talent.artistProfessionName).then(function (response1) {
                    console.log(response1);
                    var translit = '';
                    response1.forEach(function (character) {
                      translit += ' ' + character[0].toLowerCase();
                    });
                    talent.artistNonRomanizedName = translit;
                    talent.save({});
                }).catch(function (err) {
                    console.log(err);
                });
            }
        });

        return res.json(200, {error: 0, msg: 'ok'});
    });

    app.post('/api/mass/export-song', checkOwnerRole, async function(req, res) {
        const [songs] = await Promise.all([
            Song.find({}).populate('songArtistRefer').populate('songComposerRefer').populate('songLyricRefer').exec()
        ]);

        if (songs) {
            return res.json(200, {error: 0, songs: songs});
        }
        return res.json(200, {error: 1, songs: []});
    });

    app.post('/api/mass/export-song-data', checkOwnerRole, async function(req, res) {
        const [songs] = await Promise.all([
            Song.find({}).populate('songArtistRefer').populate('songComposerRefer').populate('songLyricRefer').exec()
        ]);

        if (songs) {
            return res.json(200, {error: 0, songs: songs});
        }
        return res.json(200, {error: 1, songs: []});
    });

    app.get('/api/mass/songdetail', isLoggedIn, function(req, res) {
        console.log('id: ' + req.param('id'));
        var id = req.param('id');
        Song.findOne({_id: id}).exec(function(err, song) {
            return res.json(200, {error: 0, song: song});
        });
    });

    app.get('/api/mass/resetdata', isLoggedIn, async function(req, res) {
        var [result] = await Promise.all([
            Song.remove({
                songHash: ""
            }).exec()
        ]);
        return res.json(200, {error: 0});
    });

    app.post('/api/mass/updateSongDetail', isLoggedIn, async function(req, res){
        var data = req.body;
        console.log(data);
        if (data.id == undefined || data.id.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }
        if (data.songTitle == undefined || data.songTitle.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }
        if (data.songSingerName == undefined || data.songSingerName.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }
        if (data.duration == undefined || data.duration.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }
        if (data.publishDate == undefined || data.publishDate.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }
        var user = req.session.passport.user;
        var  [songCheck] = await Promise.all([
                    Song.findOne({
                        $and: [
                            {songTitle: data.songTitle},
                            {songDuration: data.duration},
                            {songArtistNameTemp: data.singername},
                            {songPublish: data.publishdate},
                        ]
                    }).exec()
                ]);
        if(songCheck && !songCheck._id.equals(data.id)){
            return res.json(200, {status: 400, message: 'Duplicate song'});
        }
        var  [songUpdate] = await Promise.all([
                    Song.findOne({
                        $and: [
                            {_id: data.id},
                        ]
                    }).exec()
                ]);
        if(!songUpdate){
            return res.json(200, {status: 400, message: 'Song not found'});
        }

        // if((songUpdate.songHash ==undefined || (songUpdate.songHash && songUpdate.songHash.length ==0) && data.songLocation.length==0){
        //   return res.json(200, {status: 400, message: 'Please upload media file'});   
        // }

        var artist;
        if (data.songSingerName.length != 0 && data.songSingerName!=undefined) {
            [artist] = await Promise.all([
                Artist.findOne({
                    $and: [
                        {artistProfessionName: data.songSingerName.replace(' ', '')},
                        {artistType: 'Artist'}
                    ]
                }).exec()
            ]);

            if (!artist) {
                var new_artist = new Artist();
                new_artist.artistID = new Date().getTime();
                new_artist.artistProfessionName = data.songSingerName.replace(' ', '');
                new_artist.artistNameInPassportOfficialIdentificationCard = data.songSingerName.replace(' ', '');
                new_artist.artistManagementAccount = user.userManagerWalletAddress;
                new_artist.artistOwnerId = user._id;
                new_artist.artistType = 'Artist';
                new_artist.artistUserRefer = user;
                [artist] = await Promise.all([
                    new_artist.save()
                ]);
            }
        }

        songUpdate.songTitle = data.songTitle;
        if(songUpdate.songHash ==undefined || songUpdate.songHash.length ==0){
            // if(data.songLocation.length>0){
            //     songUpdate.songLocalPath = data.songLocation;
            // }
            songUpdate.songArtistNameTemp = data.songSingerName;
            songUpdate.songDuration = data.duration;
            if(data.songHash.length>0){
                songUpdate.songHash  = data.songHash;
            }
            songUpdate.songArtistRefer = artist;
            songUpdate.songPublish = data.publishDate;
            songUpdate.songError = false;
            songUpdate.errorMessageUpload = "";
            if(data.songUrl.length>0){
                songUpdate.songMissingUrl = data.songUrl;
                songUpdate.songUrl = data.songUrl;
            }
            var [result] = await Promise.all([ songUpdate.save() ]);
            return res.json(200, {status: 200, message: 'saved.'});
        }else{
            // if(songUpdate.songLocalPath != data.songLocation && data.songLocation !=undefined && data.songLocation.length > 0 ){
            // if(data.songLocation.length>0){    
            //     songUpdate.songLocalPath = data.songLocation;
            // }
            songUpdate.songArtistNameTemp = data.songSingerName;
            songUpdate.songDuration = data.duration;
            if(data.songHash.length>0){
                songUpdate.songHash  = data.songHash;
            }
            songUpdate.songArtistRefer = artist;
            songUpdate.songPublish = data.publishDate;
            songUpdate.songError = false;
            songUpdate.errorMessageUpload = "";
            if(data.songUrl.length>0){
                songUpdate.songMissingUrl = data.songUrl;
                songUpdate.songUrl = data.songUrl;
            }
            var [result] = await Promise.all([ songUpdate.save() ]);
            return res.json(200, {status: 200, message: 'saved.'});
            // }
            return res.json(200, {status: 400, message: 'Something is wrong'});
        }
    });

    app.post('/api/mass/create-multi-songs', isLoggedIn, async function(req, res) {
        var data = req.body;
        if (data == undefined || data.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }

        if (data.songs == undefined || data.songs.length == 0) {
            return res.json(200, {status: 400, message: 'Bad Request'});
        }

        var user = req.session.passport.user;

        var completedList = [];
        var failedList = [];

        for(var i=0; i< data.songs.length; i++){
            var song = data.songs[i];
            var artist;
            var songCheck;

            if (song.singername.length != 0) {
                [artist] = await Promise.all([
                    Artist.findOne({
                        $and: [
                            {artistProfessionName: song.singername.replace(' ', '')},
                            {artistType: 'Artist'}
                        ]
                    }).exec()
                ]);

                if (!artist) {
                    var new_artist = new Artist();
                    new_artist.artistID = new Date().getTime();
                    new_artist.artistProfessionName = song.singername.replace(' ', '');
                    new_artist.artistNameInPassportOfficialIdentificationCard = song.singername.replace(' ', '');
                    new_artist.artistManagementAccount = user.userManagerWalletAddress;
                    new_artist.artistType = 'Artist';
                    new_artist.artistUserRefer = user;
                    [artist] = await Promise.all([
                        new_artist.save()
                    ]);
                }

                [songCheck] = await Promise.all([
                    Song.findOne({
                        $and: [
                            {songTitle: song.songname},
                            {songDuration: song.duration},
                            {songArtistNameTemp: song.singername},
                            {songPublish: song.publishdate},
                        ]
                    }).exec()
                ]);

                if(songCheck){
                    failedList.push("Song at row "+song.id+ " is Duplicate");
                }else{
                    var newSong = new Song();
                    newSong.songID = new Date().getTime();
                    newSong.songTitle = song.songname;
                    newSong.songUrl ="";
                    newSong.songExtension="";
                    newSong.songSize = "";
                    newSong.songOwnerName = user.userFullName;
                    newSong.songOwnerContractAddress = user.userManagerWalletAddress;
                    newSong.songUserRefer = user;
                    newSong.createAt = new Date();
                    newSong.updatedAt = new Date();
                    newSong.songDuration = song.duration;
                    newSong.songDeployStatus = false;
                    newSong.songPublish = song.publishdate;
                    newSong.songIsMassRegistration = true;
                    newSong.songMerkleRoot = '';
                    newSong.songArtistRefer = artist;
                    newSong.songHash = "";
                    newSong.songArtistNameTemp = song.singername;
                    newSong.songLocalPath = song.songlocation;
                    newSong.avatarLocalPath = song.avatarlocation;
                    newSong.songCatNo = song.SongCat;
                    newSong.songOwnerId = user._id;
                    newSong.songErrorMessage = song.errorMessage;
                    newSong.songContractAddress = "";
                    completedList.push(newSong);
                }
            }
        }

        Song.insertMany(completedList, function(error, result) {
            return res.json(200, {status: 200, message: 'Create multi songs successed.', failedList: failedList, completedList: completedList});
        });
    });

    app.post('/api/mass/exports-template', isLoggedIn, function(req, res) {
        var user = req.session.passport.user;
        if(req.body.blockChainFileUrl == undefined){
            return res.json(200, {error: 1, msg: 'Sorry. Something wrong'});
        }
        var blockFileName = req.body.blockChainFileUrl;
        var file = path.join(__dirname, '../public/'+blockFileName);
        if(!fs.existsSync(file)) {
            return res.json(200, {error: 1, msg: 'Sorry. Something wrong'});   
        }
        var exportNew = new Export();
        exportNew.BlockChainFile = req.body.blockChainFileUrl;
        exportNew.SongFile = (req.body.songFileUrl != undefined)? req.body.songFileUrl :"";
        exportNew.ArtistFile = (req.body.artistFileUrl != undefined)? req.body.artistFileUrl :"";
        exportNew.UserRefer = user;
        exportNew.Status = 0;
        exportNew.save(function(err){
            if(err){
                return res.json(200, {error: 1, msg: 'Sorry. Something wrong'});
            }else{
                return res.json(200, {error: 0, msg: 'ok', data: exportNew});
                ExportData.process_export_data();
            }
        });
    });

    app.post('/api/mass/get-merkle-root', isLoggedIn, async function(req, res) {
        var user = req.session.passport.user;
        var merkleId = req.body.id;
        const [songMerkles] = await Promise.all([
            Song.find({_id: merkleId}).exec()
        ]);

        if(merkleId.length ==0) {
            return res.json(200, {error: 0, merkle_root: ''});
        }
        var merkle_root = '';
        var arrayHash = [];
        var readyToDeploy = true;
        songMerkles.forEach(async function (song) {
            if(song.songHash.length > 0 && song.songHash){
                arrayHash.push(song.songHash);
            }else{
                readyToDeploy = false;
            }
        });
        if(arrayHash.length>0 && !readyToDeploy){
            var dataInput = arrayHash.map(x => new Buffer(x, 'hex'));
            var merkleTools = new MerkleTools();
            merkleTools.addLeaves(dataInput);
            merkleTools.makeTree();
            var root = merkleTools.getMerkleRoot();
            if(root){
                merkle_root = root.toString('hex');
            }
        }
        return res.json(200, {error: 0, merkle_root: merkle_root});
    });

    app.post('/api/mass/upload-template-file',isLoggedIn, function(req, res){
        // create an incoming form object
        var form = new formidable.IncomingForm();
        form.multiples = true;

        // log any errors that occur
        form.uploadDir = path.join(__dirname, '../public/uploads/Import');
        var filename ="";
        form.on('file', function(field, file) {
            var date =  new Date();
            filename = date.getTime()+"_"+ file.name;
            fs.rename(file.path, path.join(form.uploadDir, filename));
        });

        // once all the files have been uploaded, send a response to the client
        form.on('end', function() {
            console.log(filename);
            res.json(200, {
                error: 0,
                url: "uploads/Import/"+filename
            });
        });

        form.parse(req);
    });

    app.post('/api/mass/check-exports-template-status', isLoggedIn, async function(req, res) {
        var user = req.session.passport.user;
        var exportId = req.body.exportId;
        if(exportId == undefined){
            return res.json(200, {error: 2, msg: 'Something wrong'});
        }
        const [exportData] = await Promise.all([
            Export.findOne({_id: exportId}).populate("MerkleRefer").exec()
        ]);
        if(!exportData){
            return res.json(200, {error: 2, msg: 'Something wrong'});
        }else{
            if(exportData.Status != 0){
                return res.json(200, {error: 0, msg: 'ok', data: exportData});
            }else{
                return res.json(200, {error: 1, msg: 'Processing. not completed yet.'});
            }
        }
    });

    app.post('/api/songs/save-mass-temp-songs', multer().fields([]), async function(req, res) {
    var data = req.body;

    if (data == undefined || data.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.token == undefined || data.token.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.songs == undefined || data.songs.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    const [user] = await Promise.all([
        User.findOne({userToken: data.token})
    ]);

    if (!user) {
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }

    var completedList = [];
    var failedList = [];

    for (var i = 0; i < data.songs.length; i++) {
        const song = data.songs[i];

    }

    await forEach(data.songs, async(song) => {
        // var [songIn] = await Promise.all([
        //     Song.findOne({songHash: song.hash}).exec()
        // ]);

        // if (songIn) {
        //     songIn.errorMessageUpload = 'Song already exists.';
        //     songIn.errorCode = 101;
        //     songIn.songIndexTemp = song.songIndex;
        //     songIn.songConflict = true;
        //     songIn.songConflictMessage = 'Duplicate song hash.';
        //     var [resutl] = await Promise.all([
        //             songIn.save()
        //         ]);
        //     failedList.push(songIn);
        // }else{
        var artist;
        var composer;
        var lyric;

        // [songCheck] = await Promise.all([
        //         Song.findOne({
        //             $and: [
        //                 {songTitle: song.title},
        //                 {songDuration: song.duration},
        //                 {songArtistNameTemp: song.artist},
        //                 {songPublish: song.songPublish},
        //             ]
        //         }).exec()
        //     ]);

        // if(songCheck){
        //     failedList.push("Song at row "+song.id+ " is Duplicate");
        // }else{
            if (song.artist != undefined && song.artist.length != 0) {
                [artist] = await Promise.all([
                    Artist.findOne({
                        $and: [
                            {artistProfessionName: song.artist.replace(' ', '')},
                            {artistType: 'Artist'}
                        ]
                    }).exec()
                ]);

                if (!artist) {
                    var new_artist = new Artist();
                    new_artist.artistID = new Date().getTime();
                    new_artist.artistProfessionName = song.artist.replace(' ', '');
                    new_artist.artistNameInPassportOfficialIdentificationCard = song.artist.replace(' ', '');
                    new_artist.artistManagementAccount = user.userManagerWalletAddress;
                    new_artist.artistType = 'Artist';
                    new_artist.artistUserRefer = user;
                    [artist] = await Promise.all([
                        new_artist.save()
                    ]);
                }
            }

            var newSong = new Song();
            newSong.songID = new Date().getTime();
            newSong.songTitle = song.title;
            newSong.songCatNo = song.cat;
            newSong.songUrl =  song.song_url;
            newSong.songHash = song.hash;
            newSong.songOwnerName = user.userFullName;
            newSong.songOwnerContractAddress = user.userManagerWalletAddress;
            newSong.createAt = new Date();
            newSong.updatedAt = new Date();
            newSong.songExtension = song.ext,
            newSong.songSize = song.size;
            newSong.songDuration = song.duration;
            newSong.songDeployStatus = false;
            newSong.songPublish = song.songPublish;
            newSong.songIsMassRegistration = true;
            newSong.songMerkleRoot = '';
            newSong.songArtistRefer = artist;
            newSong.songComposerRefer = composer;
            newSong.songLyricRefer = lyric;
            newSong.songArtistNameTemp = song.artist;
            newSong.songIndexTemp = song.songIndex;
            newSong.songLocalPath = song.songLocation;
            newSong.songCatNo = song.cat;
            newSong.songOwnerId = user._id;
            newSong.songUserRefer = user;
            newSong.songErrorMessage = song.errorMessage;
            newSong.songContractAddress = "";
            completedList.push(newSong);
        // }
        // }
    });

    Song.insertMany(completedList, function(error, result) {
        return res.json(200, {status: 200, message: 'Create multi songs successed.', failedList: failedList, completedList: completedList});
    });
});

app.post('/api/songs/check-duplicate-song-hash', multer().fields([]), async function(req, res) {
    var data = req.body;

    if (data == undefined || data.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.token == undefined || data.token.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.songs == undefined || data.songs.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    const [user] = await Promise.all([
        User.findOne({userToken: data.token})
    ]);

    if (!user) {
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }

    var completedList = [];
    var failedList = [];

    for (var i = 0; i < data.songs.length; i++) {
        const song = data.songs[i];

    }

    await forEach(data.songs, async(song) => {
        //find song to mapping
        var [songCurent] = await Promise.all([
            Song.findOne({_id: song._id}).exec()
        ]);

        if(songCurent){
            //check song hash
            var [songIn] = await Promise.all([
                Song.findOne({songHash: song.hash}).exec()
            ]);
            if (songIn && !songIn._id.equals(songCurent._id) && song.hash.length>0) {
                songCurent.errorMessageUpload = 'Song already exists.';
                songCurent.errorCode = 101;
                songCurent.songIndexTemp = song.songIndex;
                songCurent.songConflict = true;
                songCurent.songHash = song.hash;
                songCurent.songUrl = song.song_url;
                songCurent.songConflictMessage = 'Duplicate song hash.';
                songCurent.songError = true;
                var [resutl] = await Promise.all([
                        songCurent.save()
                    ]);
                failedList.push(songCurent);
            }else{
                songCurent.songUrl =  song.song_url;
                songCurent.songHash = song.hash;
                songCurent.updatedAt = new Date();
                songCurent.songExtension = song.ext,
                songCurent.songSize = song.size;
                songCurent.songDeployStatus = false;
                songCurent.songIsMassRegistration = true;
                songCurent.songMerkleRoot = '';
                songCurent.songIndexTemp = song.songIndex;
                songCurent.errorMessageUpload ='';
                songCurent.songError = false;
                songCurent.songConflict = false;
                songCurent.songConflictMessage='';
                if(song.hash == ''){
                    songCurent.errorMessageUpload ='Cannot find media file';
                    songCurent.songError = true;
                }else if(song.duration=''){
                    songCurent.errorMessageUpload ='Duration is empty';
                    songCurent.songError = true;
                }else if(songCurent.songArtistNameTemp == ''){
                    songCurent.errorMessageUpload ='Artist is empty';
                    songCurent.songError = true;
                }else if(songCurent.songPublish == ''){
                    songCurent.errorMessageUpload ='Release date is empty';
                    songCurent.songError = true;
                }else{
                    songCurent.errorMessageUpload ='';
                    songCurent.songError = false;
                }
                var [resutl] = await Promise.all([
                        songCurent.save()
                    ]);
                completedList.push(songCurent);
            }
        }
    });
    return res.json(200, {status: 200, message: 'Create multi songs successed.', failedList: failedList, completedList: completedList});
});


app.post('/api/songs/save-hash-url', multer().fields([]), async function(req, res) {
    var data = req.body;

    if (data == undefined || data.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.token == undefined || data.token.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.songs == undefined || data.songs.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    const [user] = await Promise.all([
        User.findOne({userToken: data.token})
    ]);

    if (!user) {
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }

    var completedList = [];
    var failedList = [];

    for (var i = 0; i < data.songs.length; i++) {
        const song = data.songs[i];

    }

    await forEach(data.songs, async(song) => {
        //find song to mapping
        var [songCurent] = await Promise.all([
            Song.findOne({_id: song._id}).populate('songArtistRefer').exec()
        ]);

        if(songCurent){
            //check song hash
            var [songIn] = await Promise.all([
                Song.findOne({songHash: song.hash})
                .populate('songArtistRefer')
                .exec()
            ]);
            if (songIn && 
                !songIn._id.equals(songCurent._id) && 
                song.hash && 
                song.hash.length > 0 && 
                songCurent.songArtistRefer && 
                songIn.songArtistRefer){
                var artist1 = "";
                var artist2 = "";
                console.log(songCurent);
                if(songCurent.songArtistRefer.artistProfessionName != undefined){
                    artist1 = songCurent.songArtistRefer.artistProfessionName;
                }
                if(songIn.songArtistRefer.artistProfessionName != undefined){
                    artist2 = songIn.songArtistRefer.artistProfessionName;
                }
                if(artist1 == artist2 && songCurent.songTitle == songIn.songTitle){
                    songCurent.songChineseTitle = pinyin(songCurent.songTitle, {filterChinese: true});
                    songCurent.songUrl =  song.song_url;
                    songCurent.songHash = song.hash;
                    songCurent.updatedAt = new Date();
                    songCurent.songExtension = song.ext,
                    songCurent.songSize = song.size;
                    songCurent.songDeployStatus = false;
                    songCurent.songIsMassRegistration = true;
                    songCurent.songMerkleRoot = '';
                    songCurent.songIndexTemp = song.songIndex;
                    songCurent.errorMessageUpload ='';
                    songCurent.songError = false;
                    songCurent.songConflict = false;
                    songCurent.songConflictMessage='';
                    if(song.hash == ''){
                        songCurent.errorMessageUpload ='Cannot find media file';
                        songCurent.songError = true;
                    }else if(song.duration=''){
                        songCurent.errorMessageUpload ='Duration is empty';
                        songCurent.songError = true;
                    }else if(songCurent.songArtistNameTemp == ''){
                        songCurent.errorMessageUpload ='Artist is empty';
                        songCurent.songError = true;
                    }else if(songCurent.songPublish == ''){
                        songCurent.errorMessageUpload ='Release date is empty';
                        songCurent.songError = true;
                    }else{
                        songCurent.errorMessageUpload ='';
                        songCurent.songError = false;
                    }
                    var [resutl] = await Promise.all([
                            songCurent.save()
                        ]);
                    completedList.push(songCurent);
                }else{
                    songCurent.errorMessageUpload = 'Same song hash allocated with id '+songIn._id ;
                    songCurent.errorCode = 101;
                    songCurent.songIndexTemp = song.songIndex;
                    songCurent.songConflict = true;
                    songCurent.songHash = song.hash;
                    songCurent.songUrl = song.song_url;
                    songCurent.songConflictMessage = 'Duplicate song hash.';
                    songCurent.songError = true;
                    songCurent.songConflictAddress = songIn;
                    songCurent.songChineseTitle = pinyin(songCurent.songTitle, {filterChinese: true});
                    var [resutl] = await Promise.all([
                            songCurent.save()
                        ]);
                    failedList.push(songCurent);
                }
            }else{
                songCurent.songChineseTitle = pinyin(songCurent.songTitle, {filterChinese: true});
                songCurent.songUrl =  song.song_url;
                songCurent.songHash = song.hash;
                songCurent.updatedAt = new Date();
                songCurent.songExtension = song.ext,
                songCurent.songSize = song.size;
                songCurent.songDeployStatus = false;
                songCurent.songIsMassRegistration = true;
                songCurent.songMerkleRoot = '';
                songCurent.songIndexTemp = song.songIndex;
                songCurent.errorMessageUpload ='';
                songCurent.songError = false;
                songCurent.songConflict = false;
                songCurent.songConflictMessage='';
                if(song.hash == ''){
                    songCurent.errorMessageUpload ='Cannot find media file';
                    songCurent.songError = true;
                }else if(song.duration=''){
                    songCurent.errorMessageUpload ='Duration is empty';
                    songCurent.songError = true;
                }else if(songCurent.songArtistNameTemp == ''){
                    songCurent.errorMessageUpload ='Artist is empty';
                    songCurent.songError = true;
                }else if(songCurent.songPublish == ''){
                    songCurent.errorMessageUpload ='Release date is empty';
                    songCurent.songError = true;
                }else{
                    songCurent.errorMessageUpload ='';
                    songCurent.songError = false;
                }
                var [resutl] = await Promise.all([
                        songCurent.save()
                    ]);
                completedList.push(songCurent);
            }
        }
    });
    return res.json(200, {status: 200, message: 'Create multi songs successed.', failedList: failedList, completedList: completedList});
});

app.post('/api/songs/create-multi-songs', multer().fields([]), async function(req, res) {
    var data = req.body;

    if (data == undefined || data.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.token == undefined || data.token.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.songs == undefined || data.songs.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    const [user] = await Promise.all([
        User.findOne({userToken: data.token})
    ]);

    if (!user) {
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }

    var completedList = [];
    var failedList = [];

    for (var i = 0; i < data.songs.length; i++) {
        const song = data.songs[i];

    }

    await forEach(data.songs, async(song) => {
        //find song to mapping
        var [songCurent] = await Promise.all([
            Song.findOne({_id: song._id}).exec()
        ]);

        if(songCurent){
            //check song hash
            var [songIn] = await Promise.all([
                Song.findOne({songHash: song.hash}).exec()
            ]);
            var artist1 = "";
            var artist2 = "";
            if(songCurent.songArtistRefer.artistProfessionName != undefined){
                artist1 = songCurent.songArtistRefer.artistProfessionName;
            }
            if(songIn.songArtistRefer.artistProfessionName != undefined){
                artist2 = songIn.songArtistRefer.artistProfessionName;
            }
            if (songIn && !songIn._id.equals(songCurent._id) && song.hash.length>0 
                && artist1 != artist2 && songCurent.songTitle != songIn.songTitle ) {
                songCurent.errorMessageUpload = 'Same song hash allocated with id '+songIn._id ;
                songCurent.errorCode = 101;
                songCurent.songIndexTemp = song.songIndex;
                songCurent.songConflict = true;
                songCurent.songHash = song.hash;
                songCurent.songUrl = song.song_url;
                songCurent.songConflictMessage = 'Duplicate song hash.';
                songCurent.songError = true;
                var [resutl] = await Promise.all([
                        songCurent.save()
                    ]);
                failedList.push(songCurent);
            }else{
                songCurent.songUrl =  song.song_url;
                songCurent.songHash = song.hash;
                songCurent.updatedAt = new Date();
                songCurent.songExtension = song.ext,
                songCurent.songSize = song.size;
                songCurent.songDeployStatus = false;
                songCurent.songIsMassRegistration = true;
                songCurent.songMerkleRoot = '';
                songCurent.songIndexTemp = song.songIndex;
                songCurent.errorMessageUpload ='';
                songCurent.songError = false;
                songCurent.songConflict = false;
                songCurent.songConflictMessage='';
                if(song.hash == ''){
                    songCurent.errorMessageUpload ='Cannot find media file';
                    songCurent.songError = true;
                }else if(song.duration=''){
                    songCurent.errorMessageUpload ='Duration is empty';
                    songCurent.songError = true;
                }else if(songCurent.songArtistNameTemp == ''){
                    songCurent.errorMessageUpload ='Artist is empty';
                    songCurent.songError = true;
                }else if(songCurent.songPublish == ''){
                    songCurent.errorMessageUpload ='Release date is empty';
                    songCurent.songError = true;
                }else{
                    songCurent.errorMessageUpload ='';
                    songCurent.songError = false;
                }
                var [resutl] = await Promise.all([
                        songCurent.save()
                    ]);
                completedList.push(songCurent);
            }
        }
    });
    return res.json(200, {status: 200, message: 'Create multi songs successed.', failedList: failedList, completedList: completedList});
});

app.post('/api/songs/create-song', multer().fields([]), async function(req, res) {
    var data = req.body;

    if (data == undefined || data.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.token == undefined || data.token.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.song == undefined) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    const [user] = await Promise.all([
        User.findOne({userToken: data.token})
    ]);

    if (!user) {
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }

    const [song] = await Promise.all([
        Song.findOne({songHash: data.song.hash}).exec()
    ]);

    if (song) {
        return res.json(200, {status: 400, message: 'This song already exists.'});
    }

    var artist;
    var composer;
    var lyric;

    if (data.artist.length != 0) {
        [artist] = await Promise.all([
            Artist.findOne({
                $and: [
                    {artistProfessionName: data.artist.replace(' ', '')},
                    {artistType: 'Artist'}
                ]
            }).exec()
        ]);

        if (!artist) {
            var new_artist = new Artist();
            new_artist.artistID = new Date().getTime();
            new_artist.artistProfessionName = data.artist.replace(' ', '');
            new_artist.artistNameInPassportOfficialIdentificationCard = data.artist.replace(' ', '');
            new_artist.artistManagementAccount = user.userManagerWalletAddress;
            new_artist.artistOwnerId = user._id;
            new_artist.artistType = 'Artist';
            new_artist.artistUserRefer = user;
            [artist] = await Promise.all([
                new_artist.save()
            ]);
        }
    }

    if (data.composer.length != 0) {
        [composer] = await Promise.all([
            Artist.findOne({
                $and: [
                    {artistProfessionName: data.composer.replace(' ', '')},
                    {artistType: 'Composer'}
                ]
            }).exec()
        ]);

        if (!composer) {
            var new_artist = new Artist();
            new_artist.artistID = new Date().getTime();
            new_artist.artistProfessionName = data.composer.replace(' ', '');
            new_artist.artistNameInPassportOfficialIdentificationCard = data.composer.replace(' ', '');
            new_artist.artistManagementAccount = user.userManagerWalletAddress;
            new_artist.artistOwnerId = user._id;
            new_artist.artistType = 'Composer';
            new_artist.artistUserRefer = user;
            [composer] = await Promise.all([
                new_artist.save()
            ]);
        }
    }

    if (data.lyric.length != 0) {
        [lyric] = await Promise.all([
            Artist.findOne({
                $and: [
                    {artistProfessionName: data.lyric.replace(' ', '')},
                    {artistType: 'Lyricist'}
                ]
            }).exec()
        ]);

        if (!lyric) {
            var new_artist = new Artist();
            new_artist.artistID = new Date().getTime();
            new_artist.artistProfessionName = data.lyric.replace(' ', '');
            new_artist.artistNameInPassportOfficialIdentificationCard = data.lyric.replace(' ', '');
            new_artist.artistManagementAccount = user.userManagerWalletAddress;
            new_artist.artistOwnerId = user._id;
            new_artist.artistType = 'Lyricist';
            new_artist.artistUserRefer = user;
            [lyric] = await Promise.all([
                new_artist.save()
            ]);
        }
    }

    var newSong = new Song();
    newSong.songID = new Date().getTime();
    newSong.songHash = "";
    newSong.songTitle = data.song.title;
    newSong.songCatNo = data.song.cat;
    newSong.songUrl =  data.song.song_url;
    newSong.songHash = data.song.hash;
    newSong.songOwnerName = user.userFullName;
    newSong.songOwnerContractAddress = user.userManagerWalletAddress;
    newSong.createAt = new Date();
    newSong.updatedAt = new Date();
    newSong.songExtension = data.song.ext,
    newSong.songSize = data.song.size;
    newSong.songDeployStatus = false;
    newSong.songIsMassRegistration = true;
    newSong.songMerkleRoot = '';
    newSong.songArtistRefer = artist;
    newSong.songComposerRefer = composer;
    newSong.songLyricRefer = lyric;
    newSong.songContractAddress = "";
    newSong.save(function(error) {
        if (error) {
            return res.json(200, {status: 400, message: 'Cannot create this song'})
        }
        return res.json(200, {status: 200, message: 'Song created'});
    });
});
    
};

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
    res.redirect('/mass-migration-sign-in');
}

function isLoggedInMass(req, res, next) {
    if (req.isAuthenticated()){
        if(!req.session.passport.user.userEmailVerified){
            req.flash("loginMessage","Please verify your email");
            res.redirect('/email-confirmation-mass?user_id='+req.session.passport.user._id);
        }else if(!req.session.passport.user.userSmsVerified){
            req.flash("loginMessage","Please verify your phone");
            res.redirect('/sms-confirmation?user_id='+req.session.passport.user._id);
        }else{
            return next();
        }
    }
    // res.flash('info','Please login');
    res.redirect('/mass-migration-sign-in');
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
            } else if(req.session.passport.user.userIsAdmin){
                return next();
            }
    }
    req.flash('info',"You don't have permission. Please login as owner role");
    res.redirect('/permission');
}

function sha256 (data) {
  return crypto.createHash('sha256').update(data).digest()
}
