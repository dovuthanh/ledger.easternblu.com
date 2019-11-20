var User        = require('../models/user');
var Song        = require('../models/song');
var Order       = require('../models/order');
var Artist      = require('../models/artist');
var Composer    = require('../models/composer');
var Lyric       = require('../models/lyric');
var Country     = require('../models/country');
var Royalty     = require('../models/royalty');
var Cart        = require('../models/cart');
var Merkle      = require('../models/merkle');
var Export      = require('../models/export');
var WalletBK      = require('../models/walletbk');
var Email       = require('./email.js');
var bcrypt      = require('bcrypt');
var crypto      = require('crypto');
var merkle      = require('merkle-lib')
var fastRoot    = require('merkle-lib/fastRoot')
var merkleProof = require('merkle-lib/proof')
var multer      = require('multer');
var bodyParser  = require('body-parser');
var path        = require('path');
var formidable  = require('formidable');
const https     = require('https');
var fs          = require('fs');
var OneSignal   = require('onesignal-node');
var Guid        = require('guid');
var csrf_guid   = Guid.raw();
var Email = require('./email.js');
var kue         = require('kue');
queue = kue.createQueue();
const Request   = require('request');
const Querystring  = require('querystring');
require('dotenv').config();
const confirmation_royalty_address = process.env.CONFIRM_ROYALTY_PARTNER_ADDRESS;
const api_version   = 2.7;
const app_id        = process.env.FB_APP_ID;
const app_secret    = process.env.FB_APP_SECRET;
var Promise = require('promise');
const _ = require('lodash');
const BlockChain = require('./blockchain');
const Config = require('../../config/config');
var Iconv     = require("iconv").Iconv;
var iconv     = new Iconv('utf8', 'utf16le');
var Web3 = require('web3');
var sleep = require('sleep');
var web3 = new Web3(new Web3.providers.HttpProvider(Config.LinkTestNet));
var myClient = new OneSignal.Client({
    userAuthKey: process.env.ONE_SINGNAL_USER_AUTHENT,
    app: { appAuthKey: process.env.ONE_SINGNAL_APP_AUTHENT, appId: process.env.ONE_SIGNAL_APP_ID }
});
const algosdk = require('algosdk');
const baseServer = "https://testnet-algorand.api.purestake.io/ps1"
const port = "";

// Create client for transaction POST
const postToken = {
    'X-API-key' : 'B3SU4KcVKi94Jap2VXkK83xx38bsv95K5UZm2lab',
    'Content-Type' : 'application/x-binary'
}

const postAlgodclient = new algosdk.Algod(postToken, baseServer, port); // Binary content type

//Create client for GET of Transaction parameters 
const token = {
    'X-API-key' : 'B3SU4KcVKi94Jap2VXkK83xx38bsv95K5UZm2lab',
}


module.exports  = function(app, passport, paginate) {

    app.get('/export-song-csv', isLoggedIn, async function (req, res) {
        var [songs] = await Promise.all([
            Song.find({songUserRefer: req.session.passport.user._id})
                .populate('songArtistRefer').exec()
        ]);

        var header    = "Id"+"\t"+"Song Title"+"\t"+"Non Romanized Name"+"\t";
        header += "Completed date"+"\t"+"Content"+"\t"+"Date first publish"+"\t"+"Register date"+"\t";
        header += "Ower name"+"\t"+"Owner Romanized Name"+"\t"+"Place of work"+"\t"+"Date of completion"+"\t";
        header += "ISRCNumber"+"\t"+"AlbumName"+"\t"+"Country"+"\t"+"Diaect"+"\t"+"Format CD"+"\t"+"Format DVD"+"\t";
        header += "Format Social"+"\t"+"Format Karaoke"+"\t"+"Original Version"+"\t"+"Song remix version"+"\t";
        header += "Song extened version"+"\t"+"Recording version"+"\t"+"Genre";
        var content   = header;
        for (var i=0, total=songs.length; i<total; i++) {
            content += songs[i]._id +"\t";
            content += songs[i].songTitle +"\t";
            if(songs[i].songChineseTitle != undefined) {
                content += songs[i].songChineseTitle + "\t";
            }
            if(songs[i].songCompleted != undefined) {
                content += songs[i].songCompleted + "\t";
            }
            if(songs[i].songContent != undefined) {
                content += songs[i].songContent + "\t";
            }
            if(songs[i].songDateFirstPublish != undefined) {
                content += songs[i].songDateFirstPublish + "\t";
            }
            if(songs[i].songOwnerName != undefined) {
                content += songs[i].songOwnerName + "\t";
            }
            if(songs[i].songRomanizedOwnerName != undefined) {
                content += songs[i].songRomanizedOwnerName + "\t";
            }
            if(songs[i].songPlaceOfWork != undefined) {
                content += songs[i].songPlaceOfWork + "\t";
            }
            if(songs[i].songDateOfCompletion != undefined) {
                content += songs[i].songDateOfCompletion + "\t";
            }
            if(songs[i].songISRCNumber != undefined) {
                content += songs[i].songISRCNumber + "\t";
            }
            if(songs[i].songAlbumName != undefined) {
                content += songs[i].songAlbumName + "\t";
            }
            if(songs[i].songCountry != undefined) {
                content += songs[i].songCountry + "\t";
            }
            if(songs[i].songDialect != undefined) {
                content += songs[i].songDialect + "\t";
            }
            if(songs[i].songFormatCD != undefined) {
                content += songs[i].songFormatCD + "\t";
            }
            if(songs[i].songFormatDVD != undefined) {
                content += songs[i].songFormatDVD + "\t";
            }
            if(songs[i].songFormatKaraoke != undefined) {
                content += songs[i].songFormatKaraoke + "\t";
            }
            if(songs[i].songFormatSocialMedia != undefined) {
                content += songs[i].songFormatSocialMedia + "\t";
            }
            if(songs[i].songOriginalVersion != undefined) {
                content += songs[i].songOriginalVersion + "\t";
            }
            if(songs[i].songRemixVersion != undefined) {
                content += songs[i].songRemixVersion + "\t";
            }
            if(songs[i].songExtendVersion != undefined) {
                content += songs[i].songExtendVersion + "\t";
            }
            if(songs[i].songReRecordingVersion != undefined) {
                content += songs[i].songReRecordingVersion + "\t";
            }
            if(songs[i].songGenre != undefined) {
                content += songs[i].songGenre + "\t";
            }
        }

        res.setHeader('Content-Type',        'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", 'attachment; filename=Export.xls');
        res.write(new Buffer([0xff, 0xfe]));
        res.write(iconv.convert(content));
        res.end();
    });

    app.get('/api/get-demo-song', async function(req, res) {
        if(process.env.TESTING_MODE == 1){
            var [songs] = await Promise.all([
                Song.find({
                    $and:[
                        {songContractAddress: { "$ne": "" }},
                        {songContractAddress:{ $exists: true}}
                    ]
                }).populate('songArtistRefer').sort({_id: 'desc'}).limit(6).exec()
            ]); 
            return res.json(200, {error: 0, msg: "ok",data: songs});
        }
        return res.json(200, {error: 1, msg: "error"});
    });

    app.get('/my-songs',isLoggedIn, async function(req, res) {
    	var key = req.param('key');
    	var type = req.param('type')

    	var results = [];
    	var itemCount = 0;

    	var results1 = [];
    	var itemCount1 = 0;

    	if (key == undefined || key.length == 0 && type == undefined || type.length == 0) {
    		[ results, itemCount ] = await Promise.all([
            Song.find({songUserRefer: req.session.passport.user._id})
	            .populate('songArtistRefer')
	            .limit(req.query.limit)
	            .skip(req.skip)
	            .lean()
	            .sort({_id: 'desc'})
	            .exec(),
	            Song.count({songUserRefer: req.session.passport.user._id})
	        ]);
    	}else{
    		if (type == 'song') {
    			console.log(type);
    			[ results, itemCount ] = await Promise.all([
	            Song.find({
	            	$or:[
		               {songTitle: new RegExp(key, 'i')},
		               {songNonRomanizedtitle: new RegExp(key, 'i')}
		            ]
	            })
	            .populate('songArtistRefer')
                .populate('songMerkleRootRefer')
	            .limit(req.query.limit)
	            .skip(req.skip)
	            .lean()
	            .sort({_id: 'desc'})
	            .exec(),
	            Song.count({
	            	$or:[
		               {songTitle: new RegExp(key, 'i')},
		               {songNonRomanizedtitle: new RegExp(key, 'i')}
		            ]
	            })
	        ]);
    		}
    	}
        
        const pageCount = Math.ceil(itemCount / req.query.limit);

        if (key == undefined || key.length == 0 && type == undefined || type.length == 0) {
	        	[ results1, itemCount1 ] = await Promise.all([
	            Composer.find({composerUserRefer: req.session.passport.user._id})
		            .populate('songArtistRefer')
		            .limit(req.query.limit)
		            .skip(req.skip)
		            .lean()
		            .sort({_id: 'desc'})
		            .exec(),
	            Composer.count({composerUserRefer: req.session.passport.user._id})
	        ]);
        }else{
        	if (type == 'work') {
        		console.log(type);
        		[ results1, itemCount1 ] = await Promise.all([
	            Composer.find({
	            	$or: [
			            {composerSongTitle: new RegExp(key, 'i')},
			            {composerName: new RegExp(key, 'i')}
			        ]
	            })
		            .populate('songArtistRefer')
		            .limit(req.query.limit)
		            .skip(req.skip)
		            .lean()
		            .sort({_id: 'desc'})
		            .exec(),
	            Composer.count({
	            	$or: [
			            {composerSongTitle: new RegExp(key, 'i')},
			            {composerName: new RegExp(key, 'i')}
			        ]
	            })
	        ]);
            }
        }
        
        const pageCount1 = Math.ceil(itemCount1 / req.query.limit);
        var [exportData] = await Promise.all([
            Export.findOne({
                $and: [
                    {SongFile: {"$ne": ""}},
                    {Status: 0}
                ]
            }).populate('UserRefer').populate('MerkleRefer').exec()
        ]);
        var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
        if(!walletbk || req.session.passport.user.userShowPrivateKeyBox){
            walletbk = new WalletBK();
            walletbk.publicWallet = req.session.passport.user.userWalletAddress;
        }
        res.render('songs/listsongs', {
            url: process.env.NETWORK_TRANSACTION,
            songs: results,
            type: type,
            composers: results1,
            session: req.session,
            pageCount: pageCount,
            itemCount: itemCount,
            currentPage: req.query.page,
            pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
            pageCount1: pageCount1,
            itemCount1: itemCount1,
            pages1: paginate.getArrayPages(req)(10, pageCount1, req.query.page),
            menu_index: 'my-songs',
            walletbk: walletbk,
            exportData: exportData
        });
    });

    app.get('/my-works',isLoggedIn, async function(req, res) {
        var key = req.param('key');
        var type = req.param('type')
        type = "work";
        var results = [];
        var itemCount = 0;

        var results1 = [];
        var itemCount1 = 0;

        if (key == undefined || key.length == 0 && type == undefined || type.length == 0) {
            [ results, itemCount ] = await Promise.all([
            Song.find({songUserRefer: req.session.passport.user._id})
                .populate('songArtistRefer')
                .limit(req.query.limit)
                .skip(req.skip)
                .lean()
                .sort({_id: 'desc'})
                .exec(),
                Song.count({songUserRefer: req.session.passport.user._id})
            ]);
        }else{
            if (type == 'song') {
                console.log(type);
                [ results, itemCount ] = await Promise.all([
                Song.find({
                    $or:[
                       {songTitle: new RegExp(key, 'i')},
                       {songNonRomanizedtitle: new RegExp(key, 'i')}
                    ]
                })
                .populate('songArtistRefer')
                .limit(req.query.limit)
                .skip(req.skip)
                .lean()
                .sort({_id: 'desc'})
                .exec(),
                Song.count({
                    $or:[
                       {songTitle: new RegExp(key, 'i')},
                       {songNonRomanizedtitle: new RegExp(key, 'i')}
                    ]
                })
            ]);
            }
            
        }
        
        const pageCount = Math.ceil(itemCount / req.query.limit);

        if (key == undefined || key.length == 0 && type == undefined || type.length == 0) {
                [ results1, itemCount1 ] = await Promise.all([
                Composer.find({composerUserRefer: req.session.passport.user._id})
                    .populate('songArtistRefer')
                    .limit(req.query.limit)
                    .skip(req.skip)
                    .lean()
                    .sort({_id: 'desc'})
                    .exec(),
                Composer.count({composerUserRefer: req.session.passport.user._id})
            ]);
        }else{
            if (type == 'work') {
                console.log(type);
                [ results1, itemCount1 ] = await Promise.all([
                Composer.find({
                    $or: [
                        {composerSongTitle: new RegExp(key, 'i')},
                        {composerName: new RegExp(key, 'i')}
                    ]
                })
                    .populate('songArtistRefer')
                    .limit(req.query.limit)
                    .skip(req.skip)
                    .lean()
                    .sort({_id: 'desc'})
                    .exec(),
                Composer.count({
                    $or: [
                        {composerSongTitle: new RegExp(key, 'i')},
                        {composerName: new RegExp(key, 'i')}
                    ]
                })
            ]);
            }
        }
        
        const pageCount1 = Math.ceil(itemCount1 / req.query.limit);

        res.render('songs/listworks', {
            url: process.env.NETWORK_TRANSACTION,
            songs: results,
            type: type,
            composers: results1,
            session: req.session,
            pageCount: pageCount,
            itemCount: itemCount,
            currentPage: req.query.page,
            pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
            pageCount1: pageCount1,
            itemCount1: itemCount1,
            pages1: paginate.getArrayPages(req)(10, pageCount1, req.query.page),
            menu_index: 'my-works'
        });
    });

    app.get('/new-song-registration',checkOwnerRole, async function(req, res) {
    	var key = req.param('key');

    	if (key == undefined || key.length == 0) {
	        var [countries] = await Promise.all([Country.find({})]);
            var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
            res.render('songs/song_registration', {
                url: process.env.NETWORK_TRANSACTION,
                countries: countries,
                session: req.session,
                walletbk: walletbk,
                menu_index: 'song-registration'
	        });
    	}else {
    		res.redirect('/my-songs?key=' + key + '&type=song');
    	}
    });

    app.get('/add-song-short-list/:id',function(req, res){
        var song_id = req.params.id;
        Song.findOne({_id: song_id}).populate("songArtistRefer").exec(function(err,song){
            if(err || !song){
                return res.json(200, {error: 1, msg: "error"});
            }else{
                var cart = new Cart(req.session.cart ? req.session.cart : {});
                if(song.songArtistRefer.artistsPictures.length>0){
                    cart.add(
                        song.songUrl,
                        song.songTitle,
                        song.songArtistRefer.artistProfessionName,
                        song.ownerName,
                        song.songArtistRefer.artistsPictures,
                        song.songOwnerContractAddress,
                        song.songOnwerContactAddress,
                        1,
                        song_id,
                        song.songLengthOfTime
                    );
                }else{
                    cart.add(
                        song.songUrl,
                        song.songTitle,
                        song.songArtistRefer.artistProfessionName,
                        song.ownerName,
                        "",
                        song.songContractAddress,
                        song.songOnwerContactAddress,
                        1,
                        song_id,
                        song.songLengthOfTime
                    );
                }
                req.session.cart = cart;
                // console.log(req.session);
                return res.json(200, {error: 0, msg: "ok"});
            }
        });
    });

    app.get('/remove-song-short-list/:id',function(req, res){
        var song_id = req.params.id;
        var cart = new Cart(req.session.cart ? req.session.cart : {});
        cart.remove(song_id);
        req.session.cart = cart;
        return res.json(200, {error: 0, msg: "ok"});
    });

    app.get('/short-list',function(req, res){
        if (!req.session.cart) {
            return res.render('bookmarks/bookmarks', {
              products: null,
              session: req.session,
              message: req.flash('updatePercent'),
              appId: app_id,
              csrf: csrf_guid,
              version: 'v1.0',
              menu_index:5
            });
        }
        var cart = new Cart(req.session.cart);
        console.log(cart.getItems());
        res.render('short_list',{
            session: req.session,
            message: req.flash('updatePercent'),
            products: cart.getItems(),
            appId: app_id,
            csrf: csrf_guid,
            version: 'v1.0',
            menu_index:5
        });
    });

    app.get('/royalty-partner-sign',isLoggedIn, function(req, res) {
        var type = req.param('type');
        if(type == undefined){
            type = 0;
        }
        console.log(type);
        switch(type){
            case "1":
                Royalty.find({ownerAddress: req.session.passport.user.userWalletAddress}).exec(function(err, data){
                    res.render('royalties/royalty_confirmation',{
                        royalties: data,
                        session: req.session,
                        message: req.flash('updatePercent'),
                        title: "Offer",
                        appId: app_id,
                        csrf: csrf_guid,
                        version: 'v1.0',
                        menu_index:5
                    });
                });
                break;
            case "2":
                 Royalty.find({royaltyPartnerAddress: req.session.passport.user.userWalletAddress}).exec(function(err, data){
                    res.render('royalties/royalty_confirmation',{
                        royalties: data,
                        session: req.session,
                        title: "Acceptance",
                        appId: app_id,
                        csrf: csrf_guid,
                        version: 'v1.0',
                        message: req.flash('updatePercent'),
                        menu_index:5
                    });
                });
                break;
            default:
                Royalty.find({
                        $or:[
                            {royaltyPartnerAddress: req.session.passport.user.userWalletAddress},
                            {ownerAddress: req.session.passport.user.userWalletAddress},
                        ]
                    }).exec(function(err, data){
                    res.render('royalties/royalty_confirmation',{
                        royalties: data,
                        session: req.session,
                        title: "All",
                        appId: app_id,
                        csrf: csrf_guid,
                        version: 'v1.0',
                        message: req.flash('updatePercent'),
                        menu_index:5
                    });
                });
                break;
        }
    });

    app.get('/change-royalty-percent', checkOwnerRole, async function(req, res) {
        var song_id = req.param('id');
        if(song_id!=undefined){
            var [song] = await Promise.all([
                Song.findOne({_id: song_id}).populate('songMerkleRootRefer').exec()
            ]);

            if(!song){
                res.redirect("/royalty-partner-sign");
            }
            //calculate percentage of owner
            var ownerTotalPercent = 100;
            var sumaryOtherPercent = 0;
            var [result, count] = await Promise.all([
                Royalty.find({
                    $and: [
                        {songId: song._id},
                        {status: 2}
                    ]
                }).exec(),
                Royalty.count({
                    $and: [
                        {songId: song._id},
                        {status: 2}
                    ]
                }).exec()
            ]);
            result.forEach(function (owner) {
                sumaryOtherPercent += owner.percentAfter
            });        
            ownerTotalPercent -= sumaryOtherPercent;

            var [royalties] = await Promise.all([
                Royalty.find({
                    $and: [
                        {songId: song._id},
                        {status:{ "$in" : [0,1]}}
                    ]
                }).exec(),
            ]);

            var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
            if(!walletbk || req.session.passport.user.userShowPrivateKeyBox){
                walletbk = new WalletBK();
                walletbk.publicWallet = req.session.passport.user.userWalletAddress;
            }
            res.render('royalties/change_royalty_percent',{
                song: song,
                confirmation: royalties,
                royalties: result,
                count: count,
                session: req.session,
                message: req.flash('updatePercent'),
                appId: app_id,
                csrf: csrf_guid,
                version: 'v1.0',
                ownerTotalPercent: ownerTotalPercent,
                menu_index:'my-songs',
                walletbk: walletbk
            });
        }else{
            res.redirect("/royalty-partner-sign");
        }
    });

    app.post('/change-royalty-percent', checkOwnerRole, async function(req, res) {
        var dataReq = req.body;
        if(dataReq && dataReq.song_address!=undefined){
            var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
            var ownerAccount = algosdk.mnemonicToSecretKey(walletbk.publicDeploySeed);
            User.findOne({userWalletAddress:  dataReq.wallet_address.toLowerCase()}).exec(function(error, user){
                if (user) {
                    Song.findOne({songContractAddress: dataReq.song_address}).exec(function(err, song){
                        if(err && !song){
                            return res.json(200,{error: 1, msg: ""});
                        }else{
                            var newroyalty = new Royalty();
                            let signatureBuyer = algosdk.signBytes((song.songContractAddress+'-'+dataReq.other_percent), ownerAccount.sk);
                            let signatureString = new Buffer.from(signatureBuyer).toString('hex');
                            newroyalty.multisignAddress = confirmation_royalty_address;
                            newroyalty.songAddress = song.songContractAddress;
                            newroyalty.ownerAddress = req.session.passport.user.userWalletAddress;
                            newroyalty.ownerName = req.session.passport.user.userFullName;
                            newroyalty.ownerEmail = req.session.passport.user.userEmail;
                            newroyalty.ownerUserID = req.session.passport.user.userAccountName;
                            newroyalty.ownerAccountNumber = req.session.passport.user.userWalletAddress;
                            newroyalty.songUrl = song.songUrl;
                            newroyalty.royaltyName = dataReq.other_owner;
                            newroyalty.royaltyUserID = dataReq.user_id;
                            newroyalty.royaltyPartnerAddress = dataReq.wallet_address.toLowerCase();
                            newroyalty.songTitle = song.songTitle;
                            newroyalty.ownerSigned = signatureString;
                            newroyalty.songId = song._id;
                            song.OtherOwner.forEach(function(royalty){
                                if(royalty.wallet_address == dataReq.wallet_address){
                                    newroyalty.percentBefore = royalty.percent
                                }
                            });
                            newroyalty.percentAfter = dataReq.other_percent;
                            newroyalty.dateIssue = Date();
                            newroyalty.status = 0;
                            newroyalty.deployStatus = dataReq.deploy_status;
                            newroyalty.save(function(err){
                                var firstNotification;
                                Email.add_royalty_partner(newroyalty);
                                firstNotification = new OneSignal.Notification({
                                    contents: {
                                        en: "add request royalty successed: "+tx.txId,
                                        tr: "add request royalty successed: "+tx.txId,
                                    }
                                });
                                firstNotification.setFilters([
                                    // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
                                ]);

                                myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
                                    if (err2) {
                                        console.log('Something went wrong...');
                                    } else {
                                        console.log(data);
                                    }
                                });
                                if(err){
                                    console.log(err);
                                    return res.json(200,{error: 1, msg: ""});
                                }else {
                                    // new_block_add_royalty_partners(dataReq.txHash, req.session.passport.user._id, newroyalty._id);
                                    return res.json(200,{error: 0, msg: ""});
                                }
                            });
                        }
                    });
                }else{
                    return res.json(200,{error: 1, msg: ""});
                }
            });
        }else{
            return res.json(200,{error: 1, msg: ""});
        }
    });

    app.post('/sign_un_sign_royalty', isLoggedIn,function(req,res){
        var dataReq = req.body;
        // console.log(dataReq);
        Royalty.findOne({_id: dataReq.royalty_id}).exec(function(err, data1){
            if (err || !data1){
                console.log('1: ' + err);
                return res.json(200,{error: 1, msg: ""});
            }else{
                data1.status = dataReq.accept;
                data1.deployStatus = dataReq.deploy_status;
                data1.save(function(err1){
                    if(err1){
                        console.log('2: ' + err1);
                        return res.json(200,{error: 1, msg: ""});
                    }else{
                        if(dataReq.accept==1){
                            Song.findOne({songContractAddress: data1.songAddress}).exec(function(err2, song){
                                if(err2 || !song){
                                    console.log('3: ' + err2);
                                    return res.json(200,{error: 1, msg: ""});
                                }else{
                                    var update = false;
                                    song.OtherOwner.forEach(function(owner){
                                        if(owner.otherWallet.toLowerCase() == data1.royaltyPartnerAddress.toLowerCase()){
                                            owner.otherPercent = data1.percentBefore;
                                            update = true;
                                        }
                                    });
                                    if(!update){
                                        var other = {
                                            otherName: data1.royaltyName,
                                            otherPercent: data1.percentAfter,
                                            otherWallet: data1.royaltyPartnerAddress,
                                          };
                                        song.OtherOwner.push(other);
                                        console.log(song);
                                    }
                                    song.save(function(err3){
                                        if(err3){
                                            console.log('4: ' + err3);
                                            return res.json(200,{error: 1, msg: ""});
                                        }else{
                                            User.findOne({userWalletAddress:  data1.ownerAccountNumber}).exec(function(err, user){
                                                if(user){
                                                    // new_block_sign_royalty_partners(dataReq.txHash, req.session.passport.user._id, dataReq.royalty_id);
                                                }
                                            })
                                            return res.json(200,{error: 0, msg: ""});
                                        }
                                    });
                                }
                            });
                        }else{
                            User.findOne({userWalletAddress:  data1.ownerAccountNumber}).exec(function(err, user){
                                if(user){
                                    // new_block_unsign_royalty_partners(dataReq.txHash, req.session.passport.user._id, dataReq.royalty_id);
                                }
                                // req.flash("updatePercent","update Successfull");
                                // res.redirect("/royalty-partner-sign");
                            })
                            return res.json(200,{error: 0, msg: ""});
                        }
                    }
                })
            }
        });
    });

    app.post('/check_song_exist',isLoggedIn, function(req,res){
        var data = req.body;
        Song.find({songHash: data.songHash}).exec(function(err, song){
            if (err || !song){
                return res.json(200, {error: 1,msg: 'Sorry. Cannot upload this file'});
            }
            if(song.length > 1){
               return res.json(200, {error: 3,msg: 'Song already has disputed'});
            }else{
                if(song.length == 1){
                    return res.json(200, {error: 2, songaddress:song[0].songContractAddress, msg: 'Song has been registered'});
                }else{
                    return res.json(200, {error: 0,msg: 'ok'});
                }
            }
        });
    });

    app.post('/activate_song/:id', isLoggedIn, async function(req, res){
        var song_id = req.params.id;
        var [songObject] = await Promise.all([
            Song.findOne({
                $and:[
                    {_id: song_id},
                    {songOwnerContractAddress: req.session.passport.user.userWalletAddress}
                ]
            }).exec()
        ]); 
        if(songObject){
            if(songObject.songDisabled){
                songObject.songDisabled = false;
            }else{
                songObject.songDisabled = true;
            }
            songObject.save((error) => {
                if (error) {
                    return res.json(200, {error: 1, msg: 'Sorry, something wrong'}); 
                }
                if(songObject.songDisabled){
                    return res.json(200, {error: 0, msg: "Song has been disabled"}); 
                }else{
                    return res.json(200, {error: 0, msg: "Song has been enable"}); 
                }
            }); 
        }else{
           return res.json(200, {error: 1, msg: 'Sorry, something wrong'}); 
        }
    });

    app.post('/deploy-one-song', checkOwnerRole, async function(req, res){
        var data = req.body;
        var song_id = data.id;
        var [song] = await Promise.all([
                Song.findOne({_id: song_id}).populate('songArtistRefer')
            ]);
        if(!data.song_wallet_deploy){
            return res.json(200, {error: 1, msg: 'Sorry, something wrong'}); 
        }
        if(song){
            var Sol_SongRecordingABI = Config.Sol_SongRecordingABI;
            var Sol_SongRecordingData = Config.Sol_SongRecordingData;
            // var [smartContract] = await Promise.all([
            //     SmartContract.findOne({status:true})
            // ]);
            // if(smartContract){
            //     Sol_SongRecordingABI = JSON.parse(smartContract.Sol_SongRecordingABI);
            //     Sol_SongRecordingData = JSON.parse(smartContract.Sol_SongRecordingData)
            // }
            // var arrOtherPercentWriteToBC=[];
            // var arrOtherWalletWriteToBC=[];
            // song.OtherOwner.forEach(function(owner){
            //     arrOtherPercentWriteToBC.add(owner.otherPercent);
            //     arrOtherWalletWriteToBC.add(owner.otherWallet);
            // });
            var artistID = 0;
            if (typeof song.songArtistRefer.artistID !== 'undefined') {
               artistID = song.songArtistRefer.artistID;
            }
            var songrecordingregistrationContract = web3.eth.contract(Sol_SongRecordingABI);
            var songContractData = songrecordingregistrationContract.new.getData(
                song.songOwnerContractAddress, 
                song.songTitle, 
                song.songHash, 
                song.songDigitalSignature, 
                artistID, 
                song.songDuration, 
                0, {
                    data: Sol_SongRecordingData
                }
            );
            // var songrecordingregistrationContract = web3.eth.contract(Sol_SongRecordingABI);
            // var songContractData = songrecordingregistrationContract.new.getData(
            //     song.songOwnerContractAddress, 
            //     song.songTitle, 
            //     song.songHash, 
            //     song.songDigitalSignature, 
            //     "", 
            //     song.songPublish, 
            //     song.songArtistNameTemp, 
            //     song.songDuration, 
            //     [], 
            //     [], {
            //         data: Sol_SongRecordingData
            //     }
            // );
            var serialized = BlockChain.ethRawTx('contract', songContractData, Config.accountDefault, '');
            BlockChain.ethSendRawTransaction(serialized, (err2, hash) => {
                if (err2 || hash == null || hash.length == 0) {
                    return res.json(200, {error: 1, msg: 'Could not deploy song registration'});
                }
                song.songBlockHash = hash;
                song.songOwnerContractAddress = data.song_wallet_deploy;
                song.save(function(err3){
                    if(err3){
                        console.log(err3);
                        return res.json(200, {error: 1, msg: 'Could not save song. Try again later'});
                    }
                    return res.json(200, {error: 0, msg: 'Song saved.'});
                });
            });
        }else{
            return res.json(200, {error: 1, msg: 'Sorry, song not found'}); 
        }
    });

    app.post('/upload-song',checkOwnerRole, async function(req, res) {
        var data = req.body;
        // console.log(data);
        //http://upload.fileinject.yunfancdn.com/file/create?user=easternblu&token=cc9c481faa407a422fda94b7c6035dd1&key=
         var [artist] = await Promise.all([
            Artist.findOne({_id: data.song_artist_id})
        ]);
        var owner = data.song_wallet_deploy;
        var songTitle = data.song_chinese_title.length != 0 ? data.song_title + ' (' + data.song_chinese_title + ')' : data.song_title;
        if (data.arrOtherPercentWriteToBC == undefined) {
            data.arrOtherPercentWriteToBC = [];
        }
        if (data.arrOtherWalletWriteToBC == undefined) {
            data.arrOtherWalletWriteToBC = [];
        }
        var artistName = artist ? artist.artistProfessionName : '';
        console.log(owner, songTitle, data.song_hash, data.song_digital_signatures, "", data.song_publish, artistName, data.song_length_of_time, data.arrOtherPercentWriteToBC, data.arrOtherWalletWriteToBC);

        if(data.song_isdraft){
            var song = new Song();
            song.songID = new Date().getTime();
            song.songTitle = data.song_title;
            song.songCompleted = data.song_completed;
            song.songPublish = data.song_publish;
            song.songChineseTitle = data.song_chinese_title;
            song.songContent = data.song_content;
            song.songRegisterDate = new Date();
            song.songOwnerName = data.song_owner_name;
            song.songRomanizedOwnerName = data.song_romanized_owner_name;
            song.songHash = data.song_hash;
            song.songRightHolderName = data.song_right_holder_name;
            song.songDigitalSignature = data.song_digital_signatures;
            song.songOwnerContractAddress= data.song_wallet_deploy;
            song.songSize = data.song_size;
            song.songExtension = data.song_extension;
            song.songPlaceOfWork = data.song_place_of_work;
            song.songDateOfCompletion = data.date_of_completion;
            song.songISRCNumber = data.song_isrc_number;
            song.songAlbumName = data.song_album_name;
            song.songLengthOfTime = data.song_length_of_time;
            song.songDuration = data.song_length_of_time;
            song.songCountry = data.song_country_name;
            song.songDialect = data.song_dialect;
            song.songFormatCD = data.song_format_cd;
            song.songFormatDVD = data.song_format_dvd;
            song.songFormatKaraoke = data.song_format_kara;
            song.songFormatSocialMedia = data.song_format_social;
            song.songOriginalVersion = data.song_original_version;
            song.songRemixVersion = data.song_remixed_version;
            song.songExtendVersion = data.song_extended_version;
            song.songReRecordingVersion = data.song_re_recording_version;
            song.songArtistNameTemp = artistName;
            song.songContractAddress = "";
            song.songDeployStatus = false;
            song.songArtistRefer = artist;
            song.songIsMassRegistration = false;
            song.songReadyToDeploy = true;
            // song.songUrl = "";
            if(data.song_lyric_id != undefined && data.song_lyric_id.length >0){
                song.songLyricistsRefer= data.song_lyric_id;
                song.songLyricName = data.song_lyric_name;
            }
            if(data.song_composer_id != undefined && data.song_composer_id.length >0){
                song.songComposerRefer= data.song_composer_id;
                song.songComposerName = data.song_composer_name;
            } 
            song.songBlockHash = "";
            song.songTempUrl = data.song_temp_url;
            song.songUrl = data.song_temp_url;
            song.songUserRefer = req.session.passport.user;
            if(data.song_arrOtherName){
                data.song_arrOtherName.forEach(function(owner){
                   song.OtherOwner.push(other);
                });
            }
            song.save(function(err3){
                if(err3){
                    console.log(err3);
                    return res.json(200, {error: 1, msg: 'Could not save song. Try again later'});
                }
                
                // new_block_transaction(hash, req.session.passport.user._id, req.session.passport.user.userEmail, req.session.passport.user.userFullName);
                return res.json(200, {error: 0, msg: 'Song saved.'});
            });
        }else{
            var artistID = 0;
            if (typeof artist.artistID !== 'undefined') {
               artistID = artist.artistID;
            }
            (async() => {
                var [ownerWalletBK] = await Promise.all([WalletBK.findOne({publicWallet:owner})]);
                const algodclient = new algosdk.Algod(token, baseServer, port); 
                var recoveredAccount = algosdk.mnemonicToSecretKey(Config.algorand_seed); 
                var ownerAccount = algosdk.mnemonicToSecretKey(ownerWalletBK.publicDeploySeed);
                // console.log(ownerAccount);

                // console.log(recoveredAccount.addr);
                let params = await algodclient.getTransactionParams();
                let endRound = params.lastRound + parseInt(1000);
                let signature = algosdk.signBytes(data.song_hash, ownerAccount.sk);
                let signatureString = new Buffer.from(signature).toString('hex');
                // console.log(new Buffer.from(singature).toString('hex'));
                // let value = algosdk.verifyBytes(data.song_hash, Buffer.from(signatureString, 'hex'), ownerAccount.addr);
                // console.log(value);
                // return;
                let songInformation = {
                    songTitle: songTitle, 
                    songHash: data.song_hash, 
                    publishDate: data.song_publish, 
                    artistName: artistName, 
                    songDuration: data.song_length_of_time,
                    digitalSignatures: signatureString
                    // royaltyPartner: data.arrOtherPercentWriteToBC
                };

                // console.log(songInformation);
                //check algorand account
                var ownerAccountBalance = await algodclient.accountInformation(ownerAccount.addr);
                console.log(ownerAccountBalance);
                if(ownerAccountBalance.amount < 100000 ){
                    let txnSendAlgo = {
                        "from": recoveredAccount.addr,
                        "to": ownerAccount.addr,
                        "fee": params.fee,
                        "amount": 100000-ownerAccountBalance.amount,
                        "firstRound": params.lastRound,
                        "lastRound": endRound,
                        "genesisID": params.genesisID,
                        "genesisHash": params.genesishashb64,
                        "note": new Uint8Array(0)
                    };
                    console.log(100000-ownerAccountBalance.amount);
                    let signedTxn1 = algosdk.signTransaction(txnSendAlgo, recoveredAccount.sk);
                    let tx1 = (await postAlgodclient.sendRawTransaction(signedTxn1.blob));
                    sleep.sleep(10);
                }

                params = await algodclient.getTransactionParams();
                endRound = params.lastRound + parseInt(1000);

                let txn = {
                    "from": recoveredAccount.addr,
                    "to": ownerAccount.addr,
                    "fee": params.fee,
                    "amount": 0,
                    "firstRound": params.lastRound,
                    "lastRound": endRound,
                    "genesisID": params.genesisID,
                    "genesisHash": params.genesishashb64,
                    "note": algosdk.encodeObj(songInformation)
                };

                let signedTxn = algosdk.signTransaction(txn, recoveredAccount.sk);
                let tx = (await postAlgodclient.sendRawTransaction(signedTxn.blob));
                console.log("Transaction : " + tx.txId);
                if (tx){

                    var song = new Song();
                    song.songTitle = data.song_title;
                    song.songCompleted = data.song_completed;
                    song.songPublish = data.song_publish;
                    song.songChineseTitle = data.song_chinese_title;
                    song.songContent = data.song_content;
                    song.songRegisterDate = new Date();
                    song.songOwnerName = data.song_owner_name;
                    song.songRomanizedOwnerName = data.song_romanized_owner_name;
                    song.songHash = data.song_hash;
                    song.songRightHolderName = data.song_right_holder_name;
                    song.songDigitalSignature = signatureString;
                    song.songOwnerContractAddress= data.song_wallet_deploy;
                    song.songSize = data.song_size;
                    song.songExtension = data.song_extension;
                    song.songPlaceOfWork = data.song_place_of_work;
                    song.songDateOfCompletion = data.date_of_completion;
                    song.songISRCNumber = data.song_isrc_number;
                    song.songAlbumName = data.song_album_name;
                    song.songLengthOfTime = data.song_length_of_time;
                    song.songDuration = data.song_length_of_time;
                    song.songCountry = data.song_country_name;
                    song.songDialect = data.song_dialect;
                    song.songFormatCD = data.song_format_cd;
                    song.songFormatDVD = data.song_format_dvd;
                    song.songFormatKaraoke = data.song_format_kara;
                    song.songFormatSocialMedia = data.song_format_social;
                    song.songOriginalVersion = data.song_original_version;
                    song.songRemixVersion = data.song_remixed_version;
                    song.songExtendVersion = data.song_extended_version;
                    song.songReRecordingVersion = data.song_re_recording_version;
                    song.songIsMassRegistration = false;
                    song.songArtistNameTemp = artistName;
                    song.songDeployStatus = true;
                    song.songArtistRefer = artist;
                    song.songReadyToDeploy = true;
                    // song.songUrl = "";
                    if(data.song_lyric_id != undefined && data.song_lyric_id.length >0){
                        song.songLyricistsRefer= data.song_lyric_id;
                        song.songLyricName = data.song_lyric_name;
                    }
                    if(data.song_composer_id != undefined && data.song_composer_id.length >0){
                        song.songComposerRefer= data.song_composer_id;
                        song.songComposerName = data.song_composer_name;
                    } 
                    song.songBlockHash = tx.txId;
                    song.songContractAddress = tx.txId;
                    song.songTempUrl = data.song_temp_url;
                    song.songUrl = data.song_temp_url;
                    song.songUserRefer = req.session.passport.user;
                    if(data.song_arrOtherName){
                        data.song_arrOtherName.forEach(function(owner){
                           song.OtherOwner.push(other);
                        });
                    }

                    var firstNotification;
                    Email.send_song_deploy_success(req.session.passport.user.userEmail, req.session.passport.user.userFullName, tx.txId, song._id, song.songTitle);
                    firstNotification = new OneSignal.Notification({
                        contents: {
                            en: "Song registration deploy successed: "+tx.txId,
                            tr: "Song registration deploy successed: "+tx.txId,
                        }
                    });
                    firstNotification.setFilters([
                        {"field": "tag", "key": "USER_ID", "relation": "=", "value": song.songUserRefer._id},
                    ]);

                    song.save(function(err3){
                        if(err3){
                            console.log(err3);
                            return res.json(200, {error: 1, msg: 'Could not save song. Try again later'});
                        }
                        // new_block_transaction(hash, req.session.passport.user._id, req.session.passport.user.userEmail, req.session.passport.user.userFullName);
                        return res.json(200, {error: 0, msg: 'Song saved.'});
                    });
                }
            })().catch(e => {
                console.log(e);
                return res.json(200, {error: 1, msg: 'Could not save song. Try again later'});
            });
        }
    });

    app.get('/song-detail', async function(req, res) {
        var _id = req.param('id');
        if (_id == undefined || _id.length == 0) {
            res.redirect('/404');
        }else{
            const [song] = await Promise.all([
                Song.findOne({_id: _id}).populate('songArtistRefer').exec()
            ]);

            if (!song) {
                res.redirect('/404');
            }else{
                const [countries] = await Promise.all([
                    Country.find({}).exec()
                ]);

                var [royalties] = await Promise.all([
                    Royalty.find({
                        $and:[
                            {songId: song._id},
                            {status: 2},
                        ]
                    })
                ]);

                //calculate percentage of owner
                var ownerTotalPercent = 100;
                var sumaryOtherPercent = 0;

                royalties.forEach(function (owner) {
                    sumaryOtherPercent += owner.percentAfter
                });        
                ownerTotalPercent -= sumaryOtherPercent;

                res.render('songs/song_detail', {
                    song: song,
                    countries: countries,
                    session: req.session,
                    ownerTotalPercent:ownerTotalPercent,
                    royalties:royalties,
                    menu_index: 'my-songs'
                });
            }
        }
    });

    app.get('/update-song-info', isLoggedIn, async function(req, res){
        var _id = req.param('id');
        if (_id != undefined && _id.length > 0) {
        
            var [song] = await Promise.all([
                Song.findOne({_id: _id}).populate('songArtistRefer').exec()
            ]);
             if (!song) {
                res.redirect('/404');
            }else{
                const [countries] = await Promise.all([
                    Country.find({}).exec()
                ]);
                var [royalties] = await Promise.all([
                    Royalty.find({
                        $and:[
                            {songId: song._id},
                            {status: 2},
                        ]
                    })
                ]);

                //calculate percentage of owner
                var ownerTotalPercent = 100;
                var sumaryOtherPercent = 0;

                royalties.forEach(function (owner) {
                    sumaryOtherPercent += owner.percentAfter
                });        
                ownerTotalPercent -= sumaryOtherPercent;

                res.render('songs/update_song_info', {
                    song: song,
                    countries: countries,
                    ownerTotalPercent: ownerTotalPercent,
                    royalties: royalties,
                    session: req.session,
                    menu_index: 'my-songs'
                });
            }
        }else{
            res.redirect('/my-songs');
        }
    });

    app.post('/update-song-info', function(req, res){
        var data = req.body;
        console.log(data);
        if (data) {
            Song.findOne({_id: data._id}).exec(function(err, song){
                if (!err && song) {
                    song.songRomanizedOwnerName = data.song_romanized_owner_name;
                    song.songPlaceOfWork = data.song_place_of_work;
                    song.songDateOfCompletion = data.date_of_completion;
                    song.songISRCNumber = data.song_isrc_number;
                    song.songAlbumName = data.song_album_name;
                    song.songCountry = data.song_country_name;
                    song.songDialect = data.song_dialect;
                    song.songFormatCD = data.song_format_cd;
                    song.songFormatDVD = data.song_format_dvd;
                    song.songFormatKaraoke = data.song_format_kara;
                    song.songFormatSocialMedia = data.song_format_social;
                    song.songOriginalVersion = data.song_original_version;
                    song.songRemixVersion = data.song_remixed_version;
                    song.songExtendVersion = data.song_extended_version;
                    song.songReRecordingVersion = data.song_re_recording_version;
                    song.songComposerName = data.song_composer_name;
                    song.songLyricName = data.song_lyric_name;
                    song.save(function(err1){
                        if (!err1) {
                            return res.json(200, {error: 0, msg: "Song saved successfull"});
                        }else{
                            console.log(err1);
                            return res.json(200, {error: 1, msg: "Error! Song could not saved."});
                        }
                    });
                }else{
                    console.log(err);
                    return res.json(200, {error: 1, msg: "Error! Song could not be found."});
                }
            });
        }else{
            return res.json(200, {error: 1, msg: "Error! Try again later."});
        }
    });

    app.get('/search-royalty-confirmation', isLoggedIn, function(req, res){
        var address = req.session.passport.user.userWalletAddress;
        var keyword = req.param('keyword');
        var arrConditionRoyalty = [];
        if (keyword.length > 1 && address.length != 0) {
            arrConditionRoyalty.push({ownerAddress: address});
            arrConditionRoyalty.push({songTitle: new RegExp(keyword, 'i')});
            var conditionRoyalty = {
                $and: arrConditionRoyalty
            };
            Royalty.find(conditionRoyalty).exec(function(err, data){
                if (!err) {
                    res.render('royalty_confirmation', {
                        royalties: data,
                        session: req.session,
                        title: "All",
                        appId: app_id,
                        csrf: csrf_guid,
                        version: 'v1.0',
                        message: req.flash('updatePercent'),
                        menu_index:5
                    });
                }else{
                    console.log('Error: ' + err);
                    res.redirect('/royalty-partner-sign');
                }
            });
        }else{
            res.redirect('/royalty-partner-sign');
        }
    });

    app.post('/retrieve-merkle-root', function(req, res){
        var songHash = req.body.hash;
        Song.findOne({songHash: songHash}).exec(function(err, song){
            // console.log(song);
            if(err || !song){
                return res.json(200, {error: 0, merkle_root: ''});
            }else{
                return res.json(200,{error: 0, merkle_root: song.songMerkleRoot});
            }
        });
    });

    app.post('/mapping-artist', async function(req, res) {
        var data = req.body;
        console.log(data);

        Song.findOne({songTitle: data.songname}).exec((err, song) => {
            if (err || !song) {
                return res.json(200, {error: 1});
            }
            if (!song.songArtistRefer) {
                Artist.findOne({artistProfessionName: data.artistname}).exec((err1, artist) => {
                    if (!artist) {
                        var new_artist = new Artist();
                        new_artist.artistID = new Date().getTime();
                        new_artist.artistProfessionName = data.artistname;
                        new_artist.artistNameInPassportOfficialIdentificationCard = data.artistname;
                        new_artist.artistManagementAccount = '0xf7cc551106a1f4e2843a3da0c477b6f77fa4a09d';
                        new_artist.artistType = 'Artist';
                        new_artist.artistOwnerId = user._id;
                        new_artist.artistUserRefer = user;
                        new_artist.save((er2, arti) => {
                            song.songArtistRefer = arti;
                            song.save((err3) => {
                                return res.json(200, {error: 0});
                            });
                        });
                    }else{
                        song.songArtistRefer = artist;
                        song.save((err2) => {
                            return res.json(200, {error: 0});
                        });
                    }
                });
            }else{
                return res.json(200, {error: 0});
            }
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
        if (req.isAuthenticated()){
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
    }
    req.flash('info',"You don't have permission. Please login as owner role");
    res.redirect('/permission');
}

function sha256 (data) {
  return crypto.createHash('sha256').update(data).digest()
}

function isHexString(value) {
    var re = /[0-9A-Fa-f]{6}/g;
    if(re.test(value)) {
        return true;
    } else {
        return false;
    }
}
