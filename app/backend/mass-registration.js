var User        = require('../models/user');
var Song        = require('../models/song');
var Order       = require('../models/order');
var Artist      = require('../models/artist');
var Composer    = require('../models/composer');
var Royalty     = require('../models/royalty');
var Cart        = require('../models/cart');
var Merkle      = require('../models/merkle');
var Export      = require('../models/export');
var Email       = require('./email.js');
var ExportData  = require('./export-data.js');
var bcrypt      = require ('bcrypt');
var crypto      = require('crypto')
var merkle      = require('merkle-lib')
var fastRoot    = require('merkle-lib/fastRoot')
var merkleProof = require('merkle-lib/proof')
var bodyParser  = require('body-parser');
var formidable  = require('formidable');
var OneSignal   = require('onesignal-node');
var Guid        = require('guid');
var MerkleTools = require('merkle-tools')
var WalletBK      = require('../models/walletbk');
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

app.get('/admin-mass-migration-detail', isLoggedIn, async function(req, res){
    var merkle_id = req.param('id');
    var key = req.param('key');
    const [merkle] = await Promise.all([
          Merkle.findOne(
            {_id:merkle_id })
          .populate('userRefer')
          .exec()
        ]);
    console.log(merkle);
    const [ results, itemCount ] = await Promise.all([
          Song.find(
            {$and: [
                {songMerkleRootRefer: merkle._id},
                {songTitle: new RegExp(key, 'i')}
                ]
            })
          .populate('songArtistRefer')
          .populate('songUserRefer')
          .limit(req.query.limit)
          .skip(req.skip)
          .lean()
          .sort({_id: 'desc'})
          .exec(),
          Song.count({songMerkleRoot: merkle.merkleRoot})
        ]);
         const pageCount = Math.ceil(itemCount / req.query.limit);
        res.render('mass/mass_migration_detail', {
            url: process.env.NETWORK_TRANSACTION,
            songs: results,
            session: req.session,
            pageCount: pageCount,
            itemCount: itemCount,
            key:key,
            pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
            menu_index: 'mass-song-registration',
            merkle: merkle
    });
});

app.get('/mass-registration-deploy-login', isLoggedIn, async function(req, res){
    var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
    res.render('mass/mass_registration_deploy_login',{
        session: req.session,
        menu_index: 'mass-song-registration',
        merkle: "", 
        merkle_id: "",
        walletbk: walletbk,
        user: req.session.passport.user
    });  
});

app.get('/mass-registration-preview-list', isLoggedIn, async function(req, res){
    var [merkles, itemCount] = await Promise.all([
        Merkle.find({
            $and:[
                {confirmed: false},
                {userRefer: req.session.passport.user._id},
            ]
        })
        .populate('userRefer')
        .limit(req.query.limit)
        .skip(req.skip)
        .lean()
        .sort({_id: 'desc'})
        .exec(),
        Merkle.count({
            $and:[
                {confirmed: false},
                {userRefer: req.session.passport.user._id},
            ]
        }).exec()
    ]);
    console.log(merkles);
    const pageCount = Math.ceil(itemCount/req.query.limit);

    res.render('mass/mass_registration_preview_list',{
        session: req.session,
        menu_index: 'mass-song-registration',
        merkles: merkles, 
        user: req.session.passport.user,
        itemCount: itemCount,
        pageCount: pageCount,
        pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
    });  
});

app.get('/mass', function(req, res){
    res.render('mass/sign_in', {
        session: req.session,
        message: req.flash('loginMessage'),
        menu_index:0
    });
});

app.get('/mass-migration-sign-in', function(req, res){
    res.render('mass/sign_in', {
        session: req.session,
        message: req.flash('loginMessage'),
        menu_index:0
    });
});

app.post('/mass-migration-sign-in', passport.authenticate('mass-migration-local-login', {
    successRedirect : '/mass-registration-list', // redirect to the secure profile section
    failureRedirect : '/mass', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.get('/mass-sign-up-step-1', isLoggedIn, async function(req, res) {
    var wallet = req.param('wallet');
    if(wallet==undefined){
        wallet = "";
    }
    if(isLoggedInSignIn()){
        res.redirect("/");
    }
    res.render('mass/sign_up_step_1', {
        wallet: wallet,
        session: req.session,
        message: req.flash('loginMessage'),
        menu_index:0
    });
});

app.get('/mass-sign-up-step-2', isLoggedIn, async function(req, res){
    res.render('mass/sign_up_step_2',{url : Config.MainNet});
});

app.get('/mass-sign-up-step-3', isLoggedIn, async function(req, res){
    var id = req.param('id');
    var seed = req.param('seed');
    var privateKey = req.param('private_key');
    var publickey = req.param('public_key');
    if(id == undefined){
        id="";
    }

    var [user] = await Promise.all([
          User.findOne({_id: req.session.passport.user._id})
    ]);

    if(user){
        user.userManagerWalletAddress = publickey;
        user.userWalletAddress = publickey;
        await Promise.all([
            user.save()
        ]);
        req.session.passport = {"user": user};
    }

    res.render('mass/sign_up_step_3', {
        user_id: id,
        seed: seed,
        private_key: privateKey,
        public_key: publickey
    });
});

app.get('/mass-registration-list', isLoggedIn, async function(req, res) {
    var user = req.session.passport.user;
    const [ results, itemCount ] = await Promise.all([
          Merkle.find({
            $and:[
                {deployStatus: false},
                {confirmed: true},
                {contractAddress: ''},
                {userRefer: user._id}
            ]
          })
          .populate('userRefer')
          .limit(req.query.limit)
          .skip(req.skip)
          .lean()
          .sort({_id: 'desc'})
          .exec(),
          Merkle.count({})
    ]);
    
    const pageCount = Math.ceil(itemCount / req.query.limit);
    res.render('mass/mass_registration_list', {
        session: req.session,
        user: user,
        merkles: results,
        pageCount: pageCount,
        itemCount: itemCount,
        pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
        menu_index: 'mass-song-registration'
    });
         
});

app.get('/mass-registration-song-csv', isLoggedIn, async function(req, res) {
    var user = req.session.passport.user;
    const [itemCount] = await Promise.all([
        Song.count({
            $and:[
                {songIsMassRegistration: true},
                {songMerkleRoot: ''},
                {songHash: ''},
                {songOwnerId: user._id}
            ]
        })
    ]);

    res.render('mass/mass_registration_song_csv', {
        session: req.session,
        user: user,
        menu_index: 'mass-song-registration'
    });     
});

app.get('/export-csv', isLoggedIn, async function (req, res) {
    var songMerkleRoot = req.param('merkle_root');
    if(songMerkleRoot ==undefined){
        songMerkleRoot = "";
    }
    var [songs] = await Promise.all([
        Song.find({
            $and: [
                {songMerkleRoot: songMerkleRoot},
                {songUserRefer: req.session.passport.user._id},
            ]
        })
        .populate('songArtistRefer')
        .populate('songUserRefer')
        .exec()
    ]);
    if(songMerkleRoot == ""){
        var header    = "Song name"+"\t"+"Song hash"+"\t"+"Song local location"+"\t"+"Song url"+"\t"+"Singer name"+"\t"+"Duration"+"\t"+"Release date"+"\n";
        var content   = header;
     
        for (var i=0, total=songs.length; i<total; i++) {
            content += songs[i].songTitle+"\t"+songs[i].songHash+"\t"+songs[i].songLocalPath+"\t"+songs[i].songUrl+"\t"+songs[i].songArtistNameTemp+"\t"+songs[i].songDuration+"\t"+songs[i].songPublish+"\n";
        }
     
        res.setHeader('Content-Type',        'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", 'attachment; filename=Export.xlsx');
        res.write(new Buffer([0xff, 0xfe]));
        res.write(iconv.convert(content));
        res.end();
    }else{
        var header    = "song contract address"+"\t"+"OwnerID"+"\t"+"Song name"+"\t"+"Song hash"+"\t"+"Song url"+"\t"+"Singer name"+"\t"+"Duration"+"\t"+"Release date"+"\n";
        var content   = header;
     
        for (var i=0, total=songs.length; i<total; i++) {
            content += (songs[i].songContractAddress)+"\t"+songs[i].songOwnerContractAddress+"\t"+songs[i].songTitle+"\t"+songs[i].songHash+"\t"+songs[i].songUrl+"\t"+songs[i].songArtistNameTemp+"\t"+songs[i].songDuration+"\t"+songs[i].songPublish+"\n";
        }
     
        res.setHeader('Content-Type',        'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", 'attachment; filename=Export.xlsx');
        res.write(new Buffer([0xff, 0xfe]));
        res.write(iconv.convert(content));
        res.end();
    }
});

app.get('/mass-registration', isLoggedIn, async function(req, res){
    var user = req.session.passport.user;
    res.render('mass/mass_registration',{
        session: req.session,
        menu_index: 'mass-song-registration',
    });   
});

app.get('/mass-registration-deploy', isLoggedIn, async function(req, res){
    var merkleId = req.param('id');
    var [merkle] = await Promise.all([
          Merkle.findOne({_id: merkleId})
          .exec()
    ]);
    var item = '';
    if(req.session.passport.user.userCanDeployMassMigration){
        var merkle_root = '';
        var arrayHash = [];
        var readyToDeploy = true;
        var [songMerkles] = await Promise.all([
            Song.find({songMerkleRootRefer: merkleId},'_id songHash').exec()
        ]);
        songMerkles.forEach(async function (song) {
            if(song.songHash.length > 0 && song.songHash){
                arrayHash.push(song.songHash);
            }
        });
        console.log(arrayHash);
        if(arrayHash.length>0){
            var dataInput = arrayHash.map(x => new Buffer(x, 'hex'));
            var merkleTools = new MerkleTools();
            merkleTools.addLeaves(dataInput);
            merkleTools.makeTree();
            var root = merkleTools.getMerkleRoot();
            if(root){
                merkle_root = root.toString('hex');
            }
        }
        if(arrayHash.length ==1){
            item = JSON.stringify(songMerkles);
            merkle.merkleRoot = '';
            var [result1] = await Promise.all([
                merkle.save()
            ]);
        }else{
            merkle.merkleRoot = merkle_root;
            var [result1] = await Promise.all([
                merkle.save()
            ]);
            var itemArray = [];
            itemArray.push({
                _id: merkleId,
                songHash: merkle_root
            });
            item = JSON.stringify(itemArray);
            console.log(itemArray);
        }
    }else{
        var [songMerkles] = await Promise.all([
            Song.find({songMerkleRootRefer: merkleId},'_id songHash').exec()
        ]);
        merkle.merkleRoot = '';
        var [result1] = await Promise.all([
            merkle.save()
        ]);
        item = JSON.stringify(songMerkles);
    }
    if(merkle.confirmed){
        var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
        res.render('mass/mass_registration_deploy',{
            session: req.session,
            menu_index: 'mass-song-registration',
            merkle: merkle, 
            user: req.session.passport.user,
            songMerkles: item,
            walletbk: walletbk
        });  
    }else{
        res.redirect("/mass-registration-list");
    }
});

app.get('/mass-registration-csv', isLoggedIn, async function(req, res) {
    var user = req.session.passport.user;
    const [itemExport] = await Promise.all([
        Export.findOne({
            $and:[
                {UserRefer: user._id},
                {Status: 0},
            ]
        }).exec()
    ]);
    res.render('mass/mass_registration_csv', {
        session: req.session,
        user: user,
        itemExport: null,
        menu_index: 'mass-song-registration'
    });     
});

app.get('/mass-registration-conflict', isLoggedIn, async function(req, res){
    var user = req.session.passport.user;
    const [songs, itemCount] = await Promise.all([
        Song.find({
            $and:[
                {songIsMassRegistration: true},
                {songMerkleRoot: ''},
                {songOwnerId: user._id},
                {songConflict: true}
            ]
        })
        .populate('songArtistRefer')
        .limit(req.query.limit)
        .skip(req.skip)
        .sort({_id: 'desc'})
        .lean()
        .exec(),
        Song.count({
            $and:[
                {songIsMassRegistration: true},
                {songMerkleRoot: ''},
                {songOwnerId: user._id},
                {songConflict: true}
            ]
        })
    ]);

    const pageCount = Math.ceil(itemCount/req.query.limit);
    var merkle_root = '';
    if(itemCount>0){
        res.render('mass/mass_registration_conflict',{
            session: req.session,
            menu_index: 'mass-song-registration',
            merkle: merkle_root, 
            songs: songs,
            itemCount: itemCount,
            pageCount: pageCount,
            pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
            user: user
        });
    }else{
        if(song.length>0){
            res.redirect("/mass-registration-deploy");
        }else{
            res.redirect("/mass-registration");
        }
    }
});

app.get('/mass-registration-history', isLoggedIn, async function(req, res){
    const [ results, itemCount ] = await Promise.all([
          Merkle.find({
                $and:[
                    {userRefer: req.session.passport.user._id},
                    {deployStatus: 1},
                ]
            })
          .populate('userRefer')
          .limit(req.query.limit)
          .skip(req.skip)
          .lean()
          .sort({_id: 'desc'})
          .exec(),
          Merkle.count({})
        ]);
         const pageCount = Math.ceil(itemCount / req.query.limit);
        res.render('mass/mass_registration_history', {
            merkles: results,
            session: req.session,
            pageCount: pageCount,
            itemCount: itemCount,
            pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
            menu_index: 'history'
    });
});

app.get('/mass-registration-preview-detail', isLoggedIn, async function(req, res, next) {
    var token = req.param('token');
    var song_id = req.param('song_id');
    var action = req.param('action');
    var keyword = req.param('keyword');
    var filter = req.param('filter');
    var merkle_root_id = req.param('id');
    var currentPage = req.param('page');
    if(keyword == undefined){
        keyword ="";
    }
    if(filter==undefined){
        filter = 0;
    }

    var [merkle_root_item] = await Promise.all([
            Merkle.findOne({_id: merkle_root_id}).exec()
        ]);

    if(!merkle_root_item){
        res.redirect("/mass-registration-preview-list");
    }

    var user = req.session.passport.user;

    if(action == 'delete'){
       var [result] = await Promise.all([
            Song.remove({_id: song_id}).exec()
        ]);
    }

    if(action == 'acceptconflict'){
       var [song] = await Promise.all([
            Song.findOne({_id: song_id}).exec()
        ]);
       if(song){
         song.songConflict = false;
         song.songConflictMessage = "";
         song.errorMessageUpload = "";
          var [result] = await Promise.all([
            song.save()
        ]);
       }
    }

    var condition = {$and:[
                        {songIsMassRegistration: true},
                        {songMerkleRoot: ''},
                        {songMerkleRootRefer: merkle_root_id},
                        {songOwnerId: user._id},
                        {
                            $or:[
                                {songTitle: new RegExp(keyword, 'i')},
                                {songArtistNameTemp: new RegExp(keyword, 'i')} ,
                                {songHash: keyword} 
                            ]
                        }
                    ]};
    if(filter ==1){
        condition = {$and:[
                        {songIsMassRegistration: true},
                        {songMerkleRoot: ''},
                        {songMerkleRootRefer: merkle_root_id},
                        {songOwnerId: user._id},
                        {
                            $or:[
                                {songError: true},
                                {songConflict: true},
                            ]
                        },
                        {
                            $and:[
                                {
                                    $or:[
                                       {songTitle: new RegExp(keyword, 'i')},
                                        {songArtistNameTemp: new RegExp(keyword, 'i')},
                                        {songHash: keyword}  
                                    ]
                                }
                            ]
                        }
                    ]};
    }else if(filter ==2){
        condition = {$and:[
                        {songIsMassRegistration: true},
                        {songMerkleRoot: ''},
                        {songMerkleRootRefer: merkle_root_id},
                        {songOwnerId: user._id},
                        {
                            $and:[
                                {songHash: { "$ne": "" }},
                                {songArtistNameTemp: { "$ne": "" }},
                                {songPublish: { "$ne": "" }},
                                {songDuration: { "$ne": "" }},
                                {
                                    $or:[
                                       {songTitle: new RegExp(keyword, 'i')},
                                        {songArtistNameTemp: new RegExp(keyword, 'i')},
                                        {songHash: keyword} 
                                    ]
                                }
                            ]
                        },
                    ]};
    }
    const [songs, itemCount] = await Promise.all([
        Song.find(condition)
        .populate('songArtistRefer')
        .limit(req.query.limit)
        .skip(req.skip)
        .sort({createAt: 'asc'})
        .lean()
        .exec(),
        Song.count(condition)
    ]);

    const pageCount = Math.ceil(itemCount/req.query.limit);
    var merkle_root = '';
    var arrayHash = [];
    var readyToDeploy = true;
    var conflict = false;
    const [song_not_hash] = await Promise.all([
          Song.findOne({$and:[
                {songIsMassRegistration: true},
                {songMerkleRoot: ''},
                {songMerkleRootRefer: merkle_root_id},
                {
                    $or:[
                    {songHash: ''},
                    {songHash: {$exists: false}},
                    ]
                },
                {songOwnerId: user._id}
            ]})
          .exec()
    ]);
    const [song_conflict] = await Promise.all([
          Song.findOne({$and:[
                {songIsMassRegistration: true},
                {songMerkleRoot: ''},
                {songMerkleRootRefer: merkle_root_id},
                {
                    $or:[
                    {songHash: ''},
                    {songHash: {$exists: false}},
                    ]
                },
                {songConflict: true},
                {songOwnerId: user._id}
            ]})
          .exec()
    ]);
    
    if(song_conflict){
        conflict = true;
        readyToDeploy = false;
    }
    if(song_not_hash){
        readyToDeploy = false;
    }

    if(!songs || songs.length==0){
        readyToDeploy = false;
    }

    res.render('mass/mass_registration_preview_detail',{
        session: req.session,
        menu_index: 'mass-song-registration',
        merkle: merkle_root_item, 
        songs: songs,
        mapped: arrayHash.length,
        currentPage: currentPage,
        itemCount: itemCount,
        pageCount: pageCount,
        readyToDeploy: readyToDeploy,
        hasNextPages: paginate.hasNextPages(req)(pageCount),
        hasPreviousPages: paginate.hasNextPages(req)(pageCount),
        pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
        keyword: keyword,
        filter:filter,
        user: user
    });      
});

app.get('/mass-registration-media-upload', isLoggedIn, async function(req, res, next) {
    // var id = req.param('id');
    // var token = req.param('token');
    // var song_id = req.param('song_id');
    // var action = req.param('action');
    // var keyword = req.param('keyword');
    // var filter = req.param('filter');
    // var currentPage = req.param('page');
    // if(keyword == undefined){
    //     keyword ="";
    // }
    // if(filter==undefined){
    //     filter = 0;
    // }
    //auto login if open from app
    // if (id == undefined) {
    //     id = req.session.passport.user._id;
    // }

    // const [user] = await Promise.all([
    //       User.findOne({_id: id})
    //       .exec()
    // ]);
    // if(action == 'delete'){
    //    var [result] = await Promise.all([
    //         Song.remove({_id: song_id}).exec()
    //     ]);
    // }

    // var condition = {$and:[
    //                     {songIsMassRegistration: true},
    //                     {songMerkleRoot: ''},
    //                     {songOwnerId: user._id},
    //                     {
    //                         $or:[
    //                             {songTitle: new RegExp(keyword, 'i')},
    //                             {songArtistNameTemp: new RegExp(keyword, 'i')} ,
    //                             {songHash: keyword} 
    //                         ]
    //                     }
    //                 ]};
    // if(filter ==1){
    //     condition = {$and:[
    //                     {songIsMassRegistration: true},
    //                     {songMerkleRoot: ''},
    //                     {songOwnerId: user._id},
    //                     {
    //                         $or:[
    //                             {songError: true},
    //                             {songConflict: true},
    //                         ]
    //                     },
    //                     {
    //                         $and:[
    //                             {
    //                                 $or:[
    //                                    {songTitle: new RegExp(keyword, 'i')},
    //                                     {songArtistNameTemp: new RegExp(keyword, 'i')},
    //                                     {songHash: keyword}  
    //                                 ]
    //                             }
    //                         ]
    //                     }
    //                 ]};
    // }else if(filter ==2){
    //     condition = {$and:[
    //                     {songIsMassRegistration: true},
    //                     {songMerkleRoot: ''},
    //                     {songOwnerId: user._id},
    //                     {
    //                         $and:[
    //                             {songHash: { "$ne": "" }},
    //                             {songArtistNameTemp: { "$ne": "" }},
    //                             {songPublish: { "$ne": "" }},
    //                             {songDuration: { "$ne": "" }},
    //                             {
    //                                 $or:[
    //                                    {songTitle: new RegExp(keyword, 'i')},
    //                                     {songArtistNameTemp: new RegExp(keyword, 'i')},
    //                                     {songHash: keyword} 
    //                                 ]
    //                             }
    //                         ]
    //                     },
    //                 ]};
    // }
    // const [songs, itemCount] = await Promise.all([
    //     Song.find(condition)
    //     .populate('songArtistRefer')
    //     .limit(req.query.limit)
    //     .skip(req.skip)
    //     .sort({createAt: 'asc'})
    //     .lean()
    //     .exec(),
    //     Song.count(condition)
    // ]);

    // const pageCount = Math.ceil(itemCount/req.query.limit);
    // var merkle_root = '';
    // var arrayHash = [];
    // var readyToDeploy = false;
    // var conflict = false;
    // const [song_not_hash] = await Promise.all([
    //       Song.findOne({$and:[
    //             {songIsMassRegistration: true},
    //             {songMerkleRoot: ''},
    //             {songHash: ''},
    //             {songOwnerId: user._id}
    //         ]})
    //       .exec()
    // ]);
    // const [song_conflict] = await Promise.all([
    //       Song.findOne({$and:[
    //             {songIsMassRegistration: true},
    //             {songMerkleRoot: ''},
    //             {songHash: ''},
    //             {songConflict: true},
    //             {songOwnerId: user._id}
    //         ]})
    //       .exec()
    // ]);
    // console.log(pageCount);
    // if(itemCount>0){
    //     if(!song_not_hash){
    //         res.redirect('/mass-registration-preview-list');
    //     }else{
            res.render('mass/mass_registration_media_upload',{
                session: req.session,
                menu_index: 'mass-song-registration',
                merkle: "", 
                // songs: songs,
                // mapped: arrayHash.length,
                // currentPage: currentPage,
                // itemCount: itemCount,
                // pageCount: pageCount,
                // readyToDeploy: readyToDeploy,
                // hasNextPages: paginate.hasNextPages(req)(pageCount),
                // hasPreviousPages: paginate.hasNextPages(req)(pageCount),
                // pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
                // keyword: keyword,
                // filter:filter,
                user: req.session.passport.user
            });  
    //     }     
    // }else{
    //     res.redirect('/mass-registration');
    // }
});

app.get('/auto-login', async function(req, res){
    var token = req.param('token');
    var redirect_url = req.param('redirect_url');
    if (token == undefined || token.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    const [user] = await Promise.all([
        User.findOne({userToken: token}).exec()
    ]);
    

    if (!user) {
        res.redirect('/sign-in');
    }else{
        user.userIsOwner = true;
        user.userIsAdmin = false;
        req.session.passport = {"user": user};
        if(redirect_url == undefined){
            res.redirect('/');
        }else{
            res.redirect('/'+redirect_url);
        }
    }
});

app.get('/logout-mass', function(req, res) {
    req.flash('formdata','');
    req.logout();
    res.redirect('/mass-registration');
});

app.post('/save-song-mass', isLoggedIn, async function(req, res) {
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
    var song = new Song();
    song.songID = new Date().getTime();
    song.songHash = "";
    song.songTitle = data.title;
    song.songCatNo = data.cat;
    song.songUrl =  data.temp_url;
    song.songHash = data.hash;
    song.songOwnerName = user.userFullName;
    song.songOwnerContractAddress = user.userManagerWalletAddress;
    song.createAt = new Date();
    song.updatedAt = new Date();
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

app.get('/auto-login-admin', isLoggedIn, async function(req, res) {
    var id = req.param('id');
    if(req.session.passport.user._id != process.env.ADMIN_ID){
        res.redirect('/');
    }
    var [user]  = await Promise.all([
        User.findOne({_id: id})
    ]);
    if(!user){
        res.redirect('/');
    }else{
        req.session.passport = {"user": user};
        res.redirect('/');
    }
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

// function isLoggedInMass(req, res, next) {
//     if (req.isAuthenticated()){
//         if(!req.session.passport.user.userEmailVerified){
//             req.flash("loginMessage","Please verify your email");
//             res.redirect('/email-confirmation-mass?user_id='+req.session.passport.user._id);
//         }else if(!req.session.passport.user.userSmsVerified){
//             req.flash("loginMessage","Please verify your phone");
//             res.redirect('/sms-confirmation?user_id='+req.session.passport.user._id);
//         }else{
//             return next();
//         }
//     }
//     // res.flash('info','Please login');
//     res.redirect('/mass-migration-sign-in');
// }

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
