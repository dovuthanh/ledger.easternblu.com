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

    app.get('/admin-mass-migration', checkOwnerRole, async function(req, res){
        const [ results, itemCount ] = await Promise.all([
              Merkle.find(
                {})
              .populate('userRefer')
              .limit(req.query.limit)
              .skip(req.skip)
              .lean()
              .sort({_id: 'desc'})
              .exec(),
              Merkle.count({})
            ]);
             const pageCount = Math.ceil(itemCount / req.query.limit);
            res.render('mass/admin_mass_migration', {
                url: process.env.NETWORK_TRANSACTION,
                merkles: results,
                session: req.session,
                pageCount: pageCount,
                itemCount: itemCount,
                pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
                menu_index: 'admin-migration'
        });
    });

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
            res.render('mass/admin_mass_migration_detail', {
                url: process.env.NETWORK_TRANSACTION,
                songs: results,
                session: req.session,
                pageCount: pageCount,
                itemCount: itemCount,
                key:key,
                pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
                menu_index: 'admin-migration',
                merkle: merkle
        });
    });

    app.get('/admin-songs', checkOwnerRole, async function(req, res) {
        var key = req.param('key');
        const [ results, itemCount ] = await Promise.all([
              Song.find({
                $or:[
                    {songTitle: new RegExp(key,'i')},
                    {"songArtistRefer.artistProfessionName": new RegExp(key,'i')},
                    {"songArtistRefer.artistNonRomanizedName": new RegExp(key,'i')},
                ]
              })
              .populate('songArtistRefer')
              .populate('songUserRefer')
              .limit(req.query.limit)
              .skip(req.skip)
              .lean()
              .sort({_id: 'desc'})
              .exec(),
              Song.count({$or:[
                    {songTitle: new RegExp(key,'i')},
                    {$or:[
                        {"songArtistRefer.artistProfessionName": new RegExp(key,'i')},
                        {"songArtistRefer.artistNonRomanizedName": new RegExp(key,'i')},
                        ]
                    }
                ]})
            ]);
             const pageCount = Math.ceil(itemCount / req.query.limit);
             console.log(results);
            res.render('mass/admin_songs', {
                url: process.env.NETWORK_TRANSACTION,
                songs: results,
                session: req.session,
                pageCount: pageCount,
                itemCount: itemCount,
                key:key,
                pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
                menu_index: 'admin-songs'
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
