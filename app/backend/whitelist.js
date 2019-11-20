var User        = require('../models/user');
var WhiteList   = require('../models/whitelist');
var Email       = require('./email.js');
var multer      = require('multer');
var bodyParser  = require('body-parser');
var path        = require('path');
var validator = require("email-validator");
var kue         = require('kue'),
queue = kue.createQueue();
const Request   = require('request');
const Querystring  = require('querystring');
var ethereum_address = require('ethereum-address');
require('dotenv').config();
var Promise = require('promise');
var Web3 = require('web3');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

module.exports  = function(app, passport, paginate) {
    app.get('/white-list',checkOwnerRole, async function(req, res) {
        const [ results, itemCount ] = await Promise.all([
            WhiteList.find()
            .limit(req.query.limit)
            .skip(req.skip)
            .lean()
            .sort({_id: 'desc'})
            .exec(),
            WhiteList.count()
        ]);
        const pageCount = Math.ceil(itemCount / req.query.limit);
        res.render('whitelist/whitelist', {
            whitelists: results,
            session: req.session,
            pageCount: pageCount,
            itemCount: itemCount,
            pages: paginate.getArrayPages(req)(100, pageCount, req.query.page),
            menu_index: 'white-list'
        });
    });

    app.post('/insert-whitelist', checkOwnerRole, async function(req, res){
        var data = req.body;
        console.log(data);
        const [itemCount ] = await Promise.all([
            WhiteList.findOne({
                $or:[
                    {email: data.email.toLowerCase()},
                    {wallet_address: data.wallet_address.toLowerCase()},
                ]
            }).exec()
        ]);
        console.log(itemCount);
        if(itemCount){
            return res.json(200, {error: 1, msg: "Email or Ethereum wallet address is existed"});
        }
        var newWhitelist = new WhiteList();
        newWhitelist.firstName = data.firstname;
        newWhitelist.lastName = data.lastname;
        newWhitelist.walletAddress = data.wallet_address.toLowerCase();
        newWhitelist.email = data.email.toLowerCase();
        newWhitelist.active = false;
        newWhitelist.onchain = false;
        newWhitelist.created_at = Date.now();
        newWhitelist.updated_at = Date.now();
        newWhitelist.save(function(err){
            if(err){
                return res.json(200, {error: 1, msg: "Error. Please try again later"});
            }else {
                return res.json(200, {error: 0, msg: "Successfully."});
            }
        });
    });

    app.post('/active-item/:id', checkOwnerRole, async function(req, res){
        var id = req.params.id;
        const [item ] = await Promise.all([
            WhiteList.findOne({_id: id})
            .exec()
        ]);
        if(!item){
            return res.json(200, {error: 1, msg: "Item not found"});
        }
        item.active  = true;
        item.save(function(err){
            if(err){
                return res.json(200, {error: 1, msg: "Error. Please try again later"});
            }else {
                return res.json(200, {error: 0, msg: "Successfully."});
            }
        });
    });

    app.post('/disable-item/:id', checkOwnerRole, async function(req, res){
        var id = req.params.id;
        const [item ] = await Promise.all([
            WhiteList.findOne({_id: id})
            .exec()
        ]);
        if(!item){
            return res.json(200, {error: 1, msg: "Item not found"});
        }
        item.active  = false;
        item.save(function(err){
            if(err){
                return res.json(200, {error: 1, msg: "Error. Please try again later"});
            }else {
                return res.json(200, {error: 0, msg: "Successfully."});
            }
        });
    });

    app.get('/whitelist-import-csv', checkOwnerRole, async function(req, res){
        res.render('whitelist/import_csv', {
            session: req.session,
            menu_index: 'white-list'
        });
    });

    app.post('/authorises-white-list', async function(req, res) {
        var data = req.body;
        if (!data || data.length == 0) {
            return res.json(200, {error: 1, msg: 'Data not found'});
        }
        var _id = req.session.passport.user._id;
        const [user] = await Promise.all([
            User.findOne({_id: _id}).exec()
        ]);

        if (!user) {
            return res.json(200, {error: 1, msg: 'Permission denied'});
        }

        WhiteList.update({
            walletAddress: {
                $in: data.authorises
            }
        }, {$set: {
            blockHash: data.hash, 
            deployStatus: false, 
            updated_at: new Date()
        }}, {
            multi: true
        }, function(err, result) {
            if (err) {
                return res.json(200, {error: 1, msg: 'Permission denied'});
            }
            new_block_transaction(data.hash, user._id);
            return res.json(200, {error: 0, msg: 'ok'});
        });
    });
};

function new_block_transaction (block_hash, user_id){
  var job = queue.create('authorises_white_list', {
    txHash: block_hash,
    user_id: user_id
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

queue.process('authorises_white_list', function(job, done) {
    try{
        console.log(job.data.txHash);
        var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
        if (receipt) {
            console.log(receipt);
            WhiteList.update({
                blockHash: receipt.transactionHash
            }, {$set: {
                deployStatus: true, 
                onchain: receipt.status,
                updated_at: new Date()
            }}, {
                multi: true
            }, function(err, result){
                if (err) {
                    //do something when receive error
                }else{
                    //do something when receive success
                }
            });
        }else{
            new_block_transaction(job.data.txHash, job.data.user_id);
        }
    }catch(e){
        console.log(e);
    }
    done & done();
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
