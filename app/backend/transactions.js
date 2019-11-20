var User            = require('../models/user');
var Transaction     = require('../models/transaction');
var Email           = require('./email.js');
var OneSignal       = require('onesignal-node');
var Guid            = require('guid');
var email_helpler   = require('./email');
var csrf_guid       = Guid.raw();
var kue             = require('kue'),
queue = kue.createQueue();
require('dotenv').config();
const api_version   = 2.7;
const app_id        = process.env.FB_APP_ID;
const app_secret    = process.env.FB_APP_SECRET;
var Promise = require('promise');
var Web3 = require('web3');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

var myClient = new OneSignal.Client({
    userAuthKey: process.env.ONE_SINGNAL_USER_AUTHENT,
    app: { appAuthKey: process.env.ONE_SINGNAL_APP_AUTHENT, appId: process.env.ONE_SIGNAL_APP_ID }
});

module.exports = function(app, passport, paginate) {
	app.get('/transactions', isLoggedIn, function(req, res){
    var key = req.param('key');

    if (key == undefined || key.length == 0) {
      Transaction.find({
        fromAddress: req.session.passport.user.userWalletAddress
        }).exec(function(err, transactions){
        res.render('transactions/transactions', {
                  transactions: transactions,
                  address: req.session.passport.user.userWalletAddress,
                  session: req.session,
                  appId: app_id,
                  csrf: csrf_guid,
                  version: 'v1.1',
                  menu_index: 'transactions'
              });
    });
    }else {
      Transaction.find({
        $or: [
          {txHash : new RegExp(key, 'i')},
          {toAddress : new RegExp(key,'i')}
        ]
        }).exec(function(err, transactions){
        res.render('transactions/transactions', {
                  transactions: transactions,
                  address: req.session.passport.user.userWalletAddress,
                  session: req.session,
                  appId: app_id,
                  csrf: csrf_guid,
                  version: 'v1.1',
                  menu_index: 'transactions'
              });
      }); 
    }
	});

    app.get('/transfer', isLoggedIn, function(req, res){
        res.render('transactions/transfer', {
            session: req.session,
            menu_index: 'transactions'
        });
    });

    app.post('/create-transfer-amount', isLoggedIn, function(req, res){
        console.log(req.body);
        var data = req.body;
        User.findOne({userWalletAddress: data.from_address}).exec(function(err, user){
            if (err || !user) {
                return res.json(200, {error: 1,msg: "some error"});
            }else{
                var transaction = new Transaction();
                transaction.txHash = data.txHash;
                transaction.fromAddress = data.from_address;
                transaction.toAddress = data.to_address;
                transaction.amount = data.amount;
                transaction.unit = data.unit;
                transaction.status = data.status;
                transaction.datetime = data.date_time;
                transaction.save(function(err, trans){
                    if (!err) {
                        new_block_transaction(data.txHash, req.session.passport.user._id, user.userEmail, req.session.passport.user.userFullName);
                        return res.json(200, {error: 0,msg: "ok"});
                    }else{
                        return res.json(200, {error: 1,msg: "some error"});
                    }
                });
            }
        });
    });
};

function new_block_transaction (block_hash, user_id, to, from){
    console.log('Job start with: ' + block_hash);
    var job = queue.create('new_transfer_amount', {
        txHash: block_hash,
        user_id: user_id,
        to: to,
        from: from
    });
    job.on('complete', function (){
      console.log(1232131);
    })
    .on('failed', function (){
      console.log(12321312323232);
    });
    job.save();
}

queue.process('new_transfer_amount', function(job, done){
    try{
        console.log(job.data.txHash);
        var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
        if (receipt) {
          Transaction.findOne({txHash: receipt.transactionHash}).exec(function(err, transaction){
              if (!transaction) {
                return;
              }
              if (receipt.status == 0x1) {
                transaction.status = 2; //deploy successed
              }else {
                transaction.status = 3; //deploy failed
              }
              transaction.save(function(err1){
                  if (err1) {
                      return;
                  }
                  var firstNotification;
                  if (receipt.status == 0x1) {
                    email_helpler.send_transfer_amount(job.data.to, job.data.from, transaction);
                    firstNotification = new OneSignal.Notification({
                        contents: {
                            en: "Send amount successed: "+receipt.transactionHash,
                            tr: "Send amount successed: "+receipt.transactionHash,
                        }
                    });
                  }else{
                    firstNotification = new OneSignal.Notification({
                        contents: {
                            en: "Sorry. Send amount failed: "+receipt.transactionHash,
                            tr: "Sorry.Send amount failed: "+receipt.transactionHash,
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
            new_block_transaction(job.data.txHash, job.data.user_id, job.data.to, job.data.from);
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
