var User            = require('../models/user');
var Song            = require('../models/song');
var Order           = require('../models/order');
var Artist          = require('../models/artist');
var Composer        = require('../models/composer');
var Cart            = require('../models/cart');
var Country         = require('../models/country');
var Royalty 		= require('../models/royalty');
var bodyParser      = require('body-parser');
var formidable      = require('formidable');
var Email           = require('./email.js');
var WalletBK      = require('../models/walletbk');
var OneSignal   = require('onesignal-node');
var Guid        = require('guid');
var csrf_guid   = Guid.raw();
var kue             = require('kue'),
queue = kue.createQueue();
const api_version   = 2.7;
const app_id        = process.env.FB_APP_ID;
const app_secret    = process.env.FB_APP_SECRET;
var Promise = require('promise');
const _ = require('lodash');
const BlockChain = require('./blockchain');
const Config = require('../../config/config');
const SolFunction = require('web3/lib/web3/function');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider(Config.LinkTestNet));
const algosdk = require('algosdk');
const baseServer = "https://testnet-algorand.api.purestake.io/ps1"
const port = "";
var Email = require('./email.js');

// Create client for transaction POST
const postToken = {
    'X-API-key' : 'B3SU4KcVKi94Jap2VXkK83xx38bsv95K5UZm2lab',
    'Content-Type' : 'application/x-binary'
}
//Create client for GET of Transaction parameters
const token = {
    'X-API-key' : 'B3SU4KcVKi94Jap2VXkK83xx38bsv95K5UZm2lab',
}
var myClient = new OneSignal.Client({
    userAuthKey: process.env.ONE_SINGNAL_USER_AUTHENT,
    app: { appAuthKey: process.env.ONE_SINGNAL_APP_AUTHENT, appId: process.env.ONE_SIGNAL_APP_ID }
});

module.exports  = function(app, passport, paginate) {
    app.get('/royalties', isLoggedIn, async function(req, res) {
        const data = req.body;
        var key = req.param('key');
        var type = req.param('type')

        var results = [];
        var itemCount = 0;
        const [royalties] = await Promise.all([
            Royalty.find({
                $and:[
                    {partnerUserRefer: req.session.passport.user._id},
                    {status: 2},
                ]
            }).exec()
        ]);
        var ids = royalties.map(function(item) {
          return item.songId;
        });
        const [confirmation] = await Promise.all([
            Royalty.find({
                $and:[
                    {partnerUserRefer: req.session.passport.user._id},
                    {status:{ "$in" : [0,1]}}
                ]
            }).populate('songId').exec()
        ]);

        if (key == undefined || key.length == 0 && type == undefined || type.length == 0) {
            [ results, itemCount ] = await Promise.all([
                Song.find({
                    $and:[
                        {songContractAddress: { "$ne": "" }},
                        {songContractAddress:{ $exists: true}},
                        {
                            $or:[
                                {songUserRefer: req.session.passport.user._id},
                                {_id: { "$in" : ids}},
                            ]
                        }
                    ]
                })
                .populate('songUserRefer')
                .limit(req.query.limit)
                .skip(req.skip)
                .lean()
                .sort({_id: 'desc'})
                .exec(),
                Song.count({
                    $and:[
                        {songContractAddress: { "$ne": "" }},
                        {songContractAddress:{ $exists: true}},
                        {
                            $or:[
                                {songUserRefer: req.session.passport.user._id},
                                {_id: { "$in" : ids}},
                            ]
                        }
                    ]
                })
            ]);
        }else{
            console.log(type);
            [ results, itemCount ] = await Promise.all([
                Song.find({
                    $and:[
                        {songContractAddress: { "$ne": "" }},
                        {songContractAddress:{ $exists: true}},
                        {
                            $or:[
                                {songUserRefer: req.session.passport.user._id},
                                {_id: { "$in" : ids}},
                            ]
                        },
                        {
                            $or:[
                               {songTitle: new RegExp(key, 'i')},
                               {songNonRomanizedtitle: new RegExp(key, 'i')}
                            ]
                        }
                    ]
                })
                .populate('songUserRefer')
                .limit(req.query.limit)
                .skip(req.skip)
                .lean()
                .sort({_id: 'desc'})
                .exec(),
                Song.count({
                    $and:[
                        {songContractAddress: { "$ne": "" }},
                        {songContractAddress:{ $exists: true}},
                        {
                            $or:[
                                {songUserRefer: req.session.passport.user._id},
                                {_id: { "$in" : ids}},
                            ]
                        },
                        {
                            $or:[
                               {songTitle: new RegExp(key, 'i')},
                               {songNonRomanizedtitle: new RegExp(key, 'i')}
                            ]
                        }
                    ]
                })
            ]);
        }

        for(var i=0; i<results.length; i++){
            var song = results[i];
            song.royalties = [];
            var id = song.songUserRefer==null? song.songUserRefer :song.songUserRefer._id;
            if(id.equals(req.session.passport.user._id)){
                var ownerTotalPercent = 100;
                var sumaryOtherPercent = 0;
                var [result] = await Promise.all([
                    Royalty.find({
                        $and:[
                            {songId: song._id},
                            {status:2}
                        ]
                    }).populate('partnerUserRefer').exec()
                ]);
                result.forEach(function (owner) {
                    console.log(owner);
                    sumaryOtherPercent += owner.percentAfter
                });
                song.royalties = result;
                ownerTotalPercent -= sumaryOtherPercent;
                song.songRoyaltyPercentBefore = 100;
                song.songRoyaltyPercentAfter = ownerTotalPercent;
                song.songDateIssueRoyalty = song.createAt;
                console.log(ownerTotalPercent);
            }else{
                song.songRoyaltyPercentBefore = 0;
                song.songRoyaltyPercentAfter = 0;
                var [result] = await Promise.all([
                    Royalty.findOne({
                        $and:[
                            {songId: song._id},
                            {status:2}
                        ]
                    }).populate('partnerUserRefer').exec()
                ]);
                if(result && result.partnerUserRefer.equals(req.session.passport.user._id)){
                    song.songRoyaltyPercentBefore = result.percentBefore;
                    song.songRoyaltyPercentAfter = result.percentAfter;
                    song.songDateIssueRoyalty = result.dateIssue;
                }
            }
        }

        const pageCount = Math.ceil(itemCount / req.query.limit);
        //find royalty
        var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
        res.render('royalties/royalties',{
            songs: results,
            session: req.session,
            appId: app_id,
            csrf: csrf_guid,
            version: 'v1.0',
            menu_index:'royalties',
            walletbk: walletbk,
            pageCount: pageCount,
            itemCount: itemCount,
            currentPage: req.query.page,
            confirmation: confirmation,
            pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
        });
    });

	app.post('/save-royalty-partner', isLoggedIn, async function(req, res) {
		const data = req.body;
		const [user, song] = await Promise.all([
			User.findOne({_id: data.user_id}).exec(),
			Song.findOne({songContractAddress: data.song_address}).populate('songMerkleRootRefer').exec()
		]);

		if (!song || !user) {
			return res.json(200,{error: 1, msg: "Sorry. Song not found."});
		}

        if(!song.songContractAddress){
            return res.json(200,{error: 1, msg: "Sorry. Song not found."});
        }

        if(!song.songHash || song.songHash.length ==0){
            return res.json(200, {error: 1,msg: "Sorry. Song not found."});   
        }
        
        if(data.royalty_address == req.session.passport.user.userWalletAddress){
            return res.json(200, {error: 1,msg: "Error. You're owner."});   
        }

        if(song.OtherOwner && song.OtherOwner.length ==5){
            var foundBuyer = false;
            for(var i=0; i<song.OtherOwner.length;i++){
                if(song.OtherOwner[i].wallet_address == data.royalty_address){
                    foundBuyer = true;
                }
            }
            if(!foundBuyer){
                return res.json(200, {error: 1,msg: "Sorry. Owner has been added."});
            }
        }

        // if(song.songMerkleRootRefer && (song.songMerkleRootRefer.contractAddress == song.songContractAddress)){
        //     //sign transaction here
        //     var Sol_MassRegistrationABI = Config.Sol_MassRegistrationABI;
        //     // var [smartContract] = await Promise.all([
        //     //     SmartContract.findOne({status:true})
        //     // ]);
        //     // if(smartContract){
        //     //     Sol_SongRecordingABI = JSON.parse(smartContract.Sol_SongRecordingABI);
        //     // }
        //     const solFunction = new SolFunction('', _.find(Sol_MassRegistrationABI, {name: 'royaltyChangePercent'}), '');
        //     const payloadData = solFunction.toPayload([song.songHash,data.royalty_address, data.royalty_percent]).data;
        //     console.log(song.songHash);
        //
        //     const serialized = BlockChain.ethRawTx('function', payloadData, Config.accountDefault, data.song_address);
        //     BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
        //         console.log(err, hash);
        //         if(hash) {
        //             var newroyalty = new Royalty();
        //             newroyalty.songAddress = song.songContractAddress;
        //             newroyalty.ownerAddress = song.songOwnerContractAddress;
        //             newroyalty.ownerName = req.session.passport.user.userFullName;
        //             newroyalty.ownerEmail = user.userEmail;
        //             newroyalty.ownerUserRefer = song.songUserRefer;
        //             newroyalty.songUrl = song.songUrl;
        //             newroyalty.royaltyName = user.userFullName;
        //             newroyalty.royaltyPartnerAddress = data.royalty_address.toLowerCase();
        //             newroyalty.songTitle = song.songTitle;
        //             newroyalty.songId = song;
        //             newroyalty.percentBefore = 0;
        //             song.OtherOwner.forEach(function(royalty){
        //                 if(royalty.wallet_address == data.royalty_address){
        //                     newroyalty.percentBefore = royalty.percent
        //                 }
        //             });
        //             newroyalty.percentAfter = data.royalty_percent;
        //             newroyalty.deployBlockHash = hash;
        //             newroyalty.dateIssue = Date();
        //             newroyalty.status = 0;
        //             newroyalty.partnerUserRefer = user;
        //             newroyalty.deployStatus = false;
        //             newroyalty.save(function(err){
        //                 if(err){
        //                     console.log(err);
        //                     return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
        //                 }
        //
        //                 song.save(function(err1) {
        //                     if(err1){
        //                         console.log(err1);
        //                         return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
        //                     }
        //
        //                     // new_block_add_royalty_partner(hash, user._id);
        //                     return res.json(200,{error: 0, msg: 'ok'});
        //                 });
        //             });
        //         }
        //     });
        // }else{
    		//sign transaction here
            // var Sol_SongRecordingABI = Config.Sol_SongRecordingABI;
            // var [smartContract] = await Promise.all([
            //     SmartContract.findOne({status:true})
            // ]);
            // if(smartContract){
            //     Sol_SongRecordingABI = JSON.parse(smartContract.Sol_SongRecordingABI);
            // }

            // const solFunction = new SolFunction('', _.find(Sol_SongRecordingABI, {name: 'royaltyChangePercent'}), '');
            // const payloadData = solFunction.toPayload([data.royalty_address, data.royalty_percent]).data;

            // const serialized = BlockChain.ethRawTx('function', payloadData, Config.accountDefault, data.song_address);
            // BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
            // 	console.log(err, hash);
            // 	if(hash) {
            // 		var newroyalty = new Royalty();
    		 //        newroyalty.songAddress = song.songContractAddress;
    		 //        newroyalty.ownerAddress = song.songOwnerContractAddress;
    		 //        newroyalty.ownerName = req.session.passport.user.userFullName;
    		 //        newroyalty.ownerEmail = user.userEmail;
    		 //        newroyalty.ownerUserRefer = song.songUserRefer;
    		 //        newroyalty.songUrl = song.songUrl;
    		 //        newroyalty.royaltyName = user.userFullName;
    		 //        newroyalty.royaltyPartnerAddress = data.royalty_address.toLowerCase();
    		 //        newroyalty.songTitle = song.songTitle;
    		 //        newroyalty.songId = song;
            //         newroyalty.percentBefore = 0;
            //         song.OtherOwner.forEach(function(royalty){
            //             if(royalty.wallet_address == data.royalty_address){
            //                 newroyalty.percentBefore = royalty.percent
            //             }
            //         });
    		 //        newroyalty.percentAfter = data.royalty_percent;
    		 //        newroyalty.deployBlockHash = hash;
    		 //        newroyalty.dateIssue = Date();
    		 //        newroyalty.status = 0;
            //         newroyalty.partnerUserRefer = user;
    		 //        newroyalty.deployStatus = false;
    		 //        newroyalty.save(function(err){
    		 //            if(err){
    		 //                console.log(err);
    		 //                return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
    		 //            }
            //
            //             song.save(function(err1) {
            //                 if(err1){
            //                     console.log(err1);
            //                     return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
            //                 }
            //
            //                 // new_block_add_royalty_partner(hash, user._id);
            //                 return res.json(200,{error: 0, msg: 'ok'});
            //             });
    		 //        });
            // 	}
            // });
            var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
            var ownerAccount = algosdk.mnemonicToSecretKey(walletbk.publicDeploySeed);
            let signatureBuyer = algosdk.signBytes((song.songContractAddress+'-'+data.royalty_percent), ownerAccount.sk);
            let signatureString = new Buffer.from(signatureBuyer).toString('hex');

            var newroyalty = new Royalty();
            newroyalty.songAddress = song.songContractAddress;
            newroyalty.ownerAddress = song.songOwnerContractAddress;
            newroyalty.ownerName = req.session.passport.user.userFullName;
            newroyalty.ownerEmail = user.userEmail;
            newroyalty.ownerUserRefer = song.songUserRefer;
            newroyalty.songUrl = song.songUrl;
            newroyalty.royaltyName = user.userFullName;
            newroyalty.royaltyPartnerAddress = data.royalty_address;
            newroyalty.songTitle = song.songTitle;
            newroyalty.songId = song;
            newroyalty.ownerSigned = signatureString;
            newroyalty.percentBefore = 0;
            song.OtherOwner.forEach(function(royalty){
                if(royalty.wallet_address == data.royalty_address){
                    newroyalty.percentBefore = royalty.percent
                }
            });
            newroyalty.percentAfter = data.royalty_percent;
            // newroyalty.deployBlockHash = ;
            newroyalty.dateIssue = Date();
            newroyalty.status = 1;
            newroyalty.partnerUserRefer = user;
            newroyalty.deployStatus = true;
            newroyalty.save(function(err){
                if(err){
                    console.log(err);
                    return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
                }

                song.save(function(err1) {
                    if(err1){
                        console.log(err1);
                        return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
                    }

                    // new_block_add_royalty_partner(hash, user._id);
                    return res.json(200,{error: 0, msg: 'ok'});
                });
            });
        // }
	});

	app.post('/royalty-confirmed', isLoggedIn, async function(req, res) {
		const data = req.body;

		var [royalty] = await Promise.all([
			Royalty.findOne({_id: data._id}).populate('').exec()
		]);

		if (!royalty) {
			return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
		}

        var [song] = await Promise.all([
            Song.findOne({songContractAddress: royalty.songAddress}).populate('songMerkleRootRefer').exec()

        ]);

        if (!song) {
            return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
        }
        if (!song.songContractAddress) {
            return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
        }

        var update = false;
        song.OtherOwner.forEach(function(owner){
            if(owner.otherWallet.toLowerCase() == royalty.royaltyPartnerAddress){
                owner.otherPercent = royalty.percentBefore;
                update = true;
            }
        });
        if(!update){
            var other = {
                otherName: royalty.royaltyName,
                otherPercent: royalty.percentAfter,
                otherWallet: royalty.royaltyPartnerAddress,
              };
            song.OtherOwner.push(other);
        }
        var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
        var ownerAccount = algosdk.mnemonicToSecretKey(walletbk.publicDeploySeed);
        let signatureBuyer = algosdk.signBytes((song.songContractAddress+'-'+royalty.percentAfter), ownerAccount.sk);
        let signatureString = new Buffer.from(signatureBuyer).toString('hex');
        let algodclient = new algosdk.Algod(token, baseServer, port);
        let postAlgodclient = new algosdk.Algod(postToken, baseServer, port); // Binary content type
        try {
            let params = await algodclient.getTransactionParams();
            let endRound = params.lastRound + parseInt(1000);
            var recoveredAccount = algosdk.mnemonicToSecretKey(Config.algorand_seed);

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


            let RoyaltyInformation = {
                songAddress: royalty.songAddress,
                signatureOwner: royalty.ownerSigned,
                signaturePartner: signatureString,
                percent: royalty.percentAfter,
                songHash: song.songHash,
                date: new Date()
            };

            let txn = {
                "from": recoveredAccount.addr,
                "to": ownerAccount.addr,
                "fee": params.fee,
                "amount": 0,
                "firstRound": params.lastRound,
                "lastRound": endRound,
                "genesisID": params.genesisID,
                "genesisHash": params.genesishashb64,
                "note": algosdk.encodeObj(RoyaltyInformation)
            };

            let signedTxn = algosdk.signTransaction(txn, recoveredAccount.sk);
            let tx = (await postAlgodclient.sendRawTransaction(signedTxn.blob));
            if (tx) {
                var firstNotification;
                Email.accept_royalty_partner(royalty);
                firstNotification = new OneSignal.Notification({
                    contents: {
                        en: "deploy sign royalty successed: " + tx.txId,
                        tr: "deploy sign royalty successed: " + tx.txId,
                    }
                });
                firstNotification.setFilters([
                    // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
                ]);

                myClient.sendNotification(firstNotification, function (err2, httpResponse, data) {
                    if (err2) {
                        console.log('Something went wrong...');
                    } else {
                        console.log(data);
                    }
                });
                royalty.deploySignBlockHash = tx.txId;
                royalty.partnerSigned = signatureString;
                royalty.deployStatus = true;
                royalty.status = 2
                royalty.dateConfirmed = new Date();
                royalty.save(function (err1) {
                    if (err1) {
                        return res.json(200, {error: 1, msg: err1});
                    }
                    song.save(function (err2) {
                        // new_block_royalty_confirmed(hash);
                        if (err2) {
                            return res.json(200, {error: 1, msg: err2});
                        }
                        return res.json(200, {error: 0, msg: 'ok'});
                    });
                });
            } else {
                return res.json(200, {error: 1, msg: "Sorry. There are Something wrong"});
            }
        } catch (err) {
            console.log(err);
        }
        // const signature = data.signature;
        // console.log(signature);
        //
        // const r = signature.substr(0, 66);
        // const s = "0x" + signature.substr(66, 64);
        // const v = "0x" + signature.substr(130, 2);

        // const message = web3.sha3('ROYALTY-CONFIRMED');

        // console.log(message);
        // console.log(r);
        // console.log(s);
        // console.log(v);
        // console.log(song.songHash);

        // if(song.songMerkleRootRefer && (song.songMerkleRootRefer.contractAddress == song.songContractAddress)){
        //     var Sol_MassRegistrationABI = Config.Sol_MassRegistrationABI;
        //     // var [smartContract] = await Promise.all([
        //     //     SmartContract.findOne({status:true})
        //     // ]);
        //     // if(smartContract){
        //     //     Sol_SongRecordingABI = JSON.parse(smartContract.Sol_SongRecordingABI);
        //     // }
        //     const solFunction = new SolFunction('', _.find(Sol_MassRegistrationABI, {name: 'royaltyConfirmed'}), '');
    		// const payloadData = solFunction.toPayload([song.songHash,message, r, s, v, true]).data;
        //
    		// const serialized = BlockChain.ethRawTx('function', payloadData, Config.accountDefault, royalty.songAddress);
        //     BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
        //     	console.log(err, hash);
        //     	if (hash) {
        //     		royalty.deploySignBlockHash = hash;
        //             royalty.deployStatus = false;
        //     		royalty.save(function(err1) {
        //                 if(err1){
        //                     return res.json(200,{error: 1, msg: err1});
        //                 }
        //                 song.save(function(err2) {
        //                     // new_block_royalty_confirmed(hash);
        //                     if(err2){
        //                         return res.json(200,{error: 1, msg: err2});
        //                     }
        //                     return res.json(200,{error: 0, msg: 'ok'});
        //                 });
        //     		});
        //     	}
        //     });
        // }else{
        //     var Sol_SongRecordingABI = Config.Sol_SongRecordingABI;
        //     // var [smartContract] = await Promise.all([
        //     //     SmartContract.findOne({status:true})
        //     // ]);
        //     // if(smartContract){
        //     //     Sol_SongRecordingABI = JSON.parse(smartContract.Sol_SongRecordingABI);
        //     // }
        //     //sign transaction here
        //     const solFunction = new SolFunction('', _.find(Sol_SongRecordingABI, {name: 'royaltyConfirmed'}), '');
        //     const payloadData = solFunction.toPayload([message, r, s, v, true]).data;
        //
        //     const serialized = BlockChain.ethRawTx('function', payloadData, Config.accountDefault, royalty.songAddress);
        //     BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
        //         console.log(err, hash);
        //         if (hash) {
        //             royalty.deploySignBlockHash = hash;
        //             royalty.deployStatus = false;
        //             royalty.save(function(err1) {
        //                 if(err1){
        //                     return res.json(200,{error: 1, msg: err1});
        //                 }
        //                 song.save(function(err2) {
        //                     // new_block_royalty_confirmed(hash);
        //                     if(err2){
        //                         return res.json(200,{error: 1, msg: err2});
        //                     }
        //                     return res.json(200,{error: 0, msg: 'ok'});
        //                 });
        //             });
        //         }
        //     });
        // }
	});

	app.post('/royalty-rejected', isLoggedIn, async function(req, res) {
		const data = req.body;

		const [royalty] = await Promise.all([
			Royalty.findOne({_id: data._id}).exec()
		]);

		if (!royalty) {
			return res.json(200,{error: 1, msg: ''});
		}

        var [song] = await Promise.all([
            Song.findOne({songContractAddress: royalty.songAddress}).populate('songMerkleRootRefer').exec()
        ]);

        if (!song) {
            return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
        }
        if (!song.songContractAddress) {
            return res.json(200,{error: 1, msg: 'Sorry. There are Something wrong'});
        }
        var firstNotification;
        Email.deny_royalty_partner(royalty);
        firstNotification = new OneSignal.Notification({
            contents: {
                en: "deploy unsign royalty successed: ",
                tr: "deploy unsign royalty successed: ",
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
        // const signature = data.signature;
        // console.log(signature);

        // const r = signature.substr(0, 66);
        // const s = "0x" + signature.substr(66, 64);
        // const v = "0x" + signature.substr(130, 2);
        //
        // const message = web3.sha3('ROYALTY-REJECTED');
        //
        // console.log(r,s,v,message);


        // if(song.songMerkleRootRefer && (song.songMerkleRootRefer.contractAddress == song.songContractAddress)){
        //     var Sol_MassRegistrationABI = Config.Sol_MassRegistrationABI;
        //     // var [smartContract] = await Promise.all([
        //     //     SmartContract.findOne({status:true})
        //     // ]);
        //     // if(smartContract){
        //     //     Sol_SongRecordingABI = JSON.parse(smartContract.Sol_SongRecordingABI);
        //     // }
        //     const solFunction = new SolFunction('', _.find(Sol_MassRegistrationABI, {name: 'royaltyConfirmed'}), '');
        //     const payloadData = solFunction.toPayload([song.songHash,message, r, s, v, false]).data;
        //     const serialized = BlockChain.ethRawTx('function', payloadData, Config.accountDefault, royalty.songAddress);
        //     BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
        //         console.log(err, hash);
        //         if (hash) {
        //             royalty.deployUnsignBlockHash = hash;
        //             royalty.deployStatus = false;
        //             royalty.save(function(err1) {
        //                 // new_block_royalty_rejected(hash);
        //                 return res.json(200,{error: 0, msg: 'ok'});
        //             });
        //         }
        //     });
        // }else{
        //     var Sol_SongRecordingABI = Config.Sol_SongRecordingABI;
        //     var [smartContract] = await Promise.all([
        //         SmartContract.findOne({status:true})
        //     ]);
        //     if(smartContract){
        //         Sol_SongRecordingABI = JSON.parse(smartContract.Sol_SongRecordingABI);
        //     }
        //
        //     //sign transaction here
        //     const solFunction = new SolFunction('', _.find(Sol_SongRecordingABI, {name: 'royaltyConfirmed'}), '');
    		// const payloadData = solFunction.toPayload([message, r, s, v, false]).data;
        //
    		// const serialized = BlockChain.ethRawTx('function', payloadData, Config.accountDefault, royalty.songAddress);
        //     BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
        //     	console.log(err, hash);
        //     	if (hash) {
        //     		royalty.deployUnsignBlockHash = hash;
        //             royalty.deployStatus = false;
        //     		royalty.save(function(err1) {
        //     			// new_block_royalty_rejected(hash);
        //     			return res.json(200,{error: 0, msg: 'ok'});
        //     		});
        //     	}
        //     });
        // }
	});
};

// function new_block_add_royalty_partner (block_hash, user_id) {
//     var job = queue.create('add_royalty_partner', {
//         txHash: block_hash,
//         user_id: user_id
//     });

//     job
//         .on('complete', function(){
//             console.log(1232131);
//         })
//         .on('failed', function(){
//             console.log(12321312323232);
//         });
//     job.save();
// }

// queue.process('add_royalty_partner', async function(job, done){
//     try{
//         console.log(job.data.txHash);
//         var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
//         if(receipt){
//             console.log(receipt);

//             var [royalty] = await Promise.all([
//                 Royalty.findOne({deployBlockHash: job.data.txHash}).exec()
//             ]);
//             console.log(royalty);

//             if (!royalty) {
//                 console.log('error when find royalty');
//                 return;
//             }
            
//             royalty.deployStatus = true;
//             if (receipt.status == 0x1) {
//                 royalty.status = 1;
//             }else{
//                 royalty.status = 4;
//             }

//             royalty.save(function(err1) {
//                 if (err1) {
//                     console.log(err1);
//                     return;
//                 }

//                 var firstNotification;
//                 if (receipt.status == 0x1) {
//                   Email.add_royalty_partner(royalty);
//                   firstNotification = new OneSignal.Notification({
//                       contents: {
//                           en: "Royalty deploy successed: "+receipt.transactionHash,
//                           tr: "Royalty deploy successed: "+receipt.transactionHash,
//                       }
//                   });
//                 }else{
//                   firstNotification = new OneSignal.Notification({
//                       contents: {
//                           en: "Sorry. Royalty deploy failed: "+receipt.transactionHash,
//                           tr: "Sorry. Royalty deploy failed: "+receipt.transactionHash,
//                       }
//                   });
//                 }
//                 firstNotification.setFilters([
//                     {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
//                 ]);

//                 myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
//                    if (err2) {
//                        console.log('Something went wrong');
//                    } else {
//                        console.log(data);
//                    }
//                 });
//             });
//         }else{
//             new_block_add_royalty_partner(job.data.txHash, job.data.user_id);
//         }
//     }catch(ex){
//         console.log(ex);
//     }
//     done && done();
// });

// function new_block_royalty_confirmed (block_hash){
//     var job = queue.create('royalty_confirmed', {
//         txHash: block_hash
//     });

//     job
//         .on('complete', function(){
//             console.log(1232131);
//         })
//         .on('failed', function(){
//             console.log(12321312323232);
//         });
//     job.save();
// }

// queue.process('royalty_confirmed', function(job, done){
//     try{
//         console.log(job.data.txHash);
//         var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
//         if(receipt){
//             console.log(receipt);

//             Royalty.findOne({deploySignBlockHash: job.data.txHash}).exec(function(err, royalty) {
//             	if (err) {
//             		return;
//             	}

//             	royalty.deployStatus = true;
//             	if (receipt.status == 0x1) {
//             		royalty.status = 2;
//             	}else{
//             		royalty.status = 4;
//             	}

//             	royalty.save(function(err1) {

//             	});
//             });
//         }else{
//             new_block_royalty_confirmed(job.data.txHash);
//         }
//     }catch(ex){
//         console.log(ex);
//     }
//     done && done();
// });

// function new_block_royalty_rejected (block_hash){
//     var job = queue.create('royalty_rejected', {
//         txHash: block_hash
//     });

//     job
//         .on('complete', function(){
//             console.log(1232131);
//         })
//         .on('failed', function(){
//             console.log(12321312323232);
//         });
//     job.save();
// }

// queue.process('royalty_rejected', function(job, done){
//     try{
//         console.log(job.data.txHash);
//         var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
//         if(receipt){
//             console.log(receipt);

//             Royalty.findOne({deployUnsignBlockHash: job.data.txHash}).exec(function(err, royalty) {
//             	if (err) {
//             		return;
//             	}

//             	royalty.deployStatus = true;
//             	if (receipt.status == 0x1) {
//             		royalty.status = 3;
//             	}else{
//             		royalty.status = 4;
//             	}

//             	royalty.save(function(err1) {

//             	});
//             });
//         }else{
//             new_block_royalty_rejected(job.data.txHash);
//         }
//     }catch(ex){
//         console.log(ex);
//     }
//     done && done();
// });

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