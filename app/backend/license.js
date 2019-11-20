var User            = require('../models/user');
var Song            = require('../models/song');
var Order           = require('../models/order');
var Artist          = require('../models/artist');
var Composer        = require('../models/composer');
var Cart            = require('../models/cart');
var Country         = require('../models/country');
var WalletBK      = require('../models/walletbk');
var bodyParser      = require('body-parser');
var formidable      = require('formidable');
var email_helpler   = require('./email');
var OneSignal   = require('onesignal-node');
var Guid        = require('guid');
var csrf_guid   = Guid.raw();
const addMonths = require('addmonths');
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
var sleep = require('sleep');
var Email = require('./email.js');
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
//Create client for GET of Transaction parameters 
const token = {
    'X-API-key' : 'B3SU4KcVKi94Jap2VXkK83xx38bsv95K5UZm2lab',
}

module.exports  = function(app, passport) {
    app.get('/my-licensings', isLoggedIn, async function(req, res){
        var key = req.param('key');

        var orders = [];
        var licenses = [];
        var licensors = [];

        if (key == undefined || key.length == 0) {
            var user_id = req.session.passport.user._id;
            [orders, licenses, licensors] = await Promise.all([
                Order.find({
                    $or: [
                        {orderBuyerRefer: user_id},
                        {orderSellerRefer: user_id}
                    ]
                }).sort({_id: 'desc'}).exec(),
                Order.find({orderBuyerRefer: user_id}).sort({_id: 'desc'}).exec(),
                Order.find({orderSellerRefer: user_id}).sort({_id: 'desc'}).exec()
            ]);
        }else {
            [orders, licenses, licensors] = await Promise.all([
                Order.find({
                    $or: [
                        {orderBuyerRefer: new RegExp(key, 'i')},
                        {orderSellerRefer: new RegExp(key, 'i')}
                    ]
                }).sort({_id: 'desc'}).exec(),
                Order.find({orderBuyerRefer: new RegExp(key, 'i')}).sort({_id: 'desc'}).exec(),
                Order.find({orderSellerRefer: new RegExp(key, 'i')}).sort({_id: 'desc'}).exec()
            ]);
            console.log(key);
        }
        console.log(licensors);
        res.render('licenses/list_licensing', {
            orders: orders,
            licenses: licenses,
            licensors: licensors,
            menu_index: 'licensing',
            session: req.session,
            url: process.env.NETWORK_TRANSACTION,
        });
    });

    app.get('/create-license',isLoggedIn, async function(req, res){
        var address = req.param('address');
        var type = req.param('type');

        if (address == undefined || address.length == 0) {
            res.redirect('/my-licensings');
            return;
        }

        if (type == undefined || type.length == 0) {
            res.redirect('/my-licensings');
            return;
        }
        if (type == 'work') {
            const [work, countries] = await Promise.all([
                Composer.findOne({_id: address}).populate('songArtistRefer','songUserRefer').exec(),
                Country.find({}).exec()
            ]);
            var [licensed] = await Promise.all([
                Order.findOne({$and:[
                        {songAddress: work.songContractAddress},
                        {buyerAddress: req.session.passport.user.userWalletAddress},
                        {status: 2},
                        {dateExpireDate: {"$gte": new Date()}}
                    ]}).exec()
            ]);
            if(!licensed){
                [licensed] = await Promise.all([
                    Order.findOne({$and:[
                            {songAddress: work.songContractAddress},
                            {buyerAddress: req.session.passport.user.userWalletAddress},
                            {$or:[
                                {status: 1},
                                {status: 0}
                            ]}
                        ]}).exec()
                ]);
                console.log(licensed);
            }
            res.render('licenses/create_licensing', {
                work: work,
                type: 'work_recording',
                countries: countries,
                session: req.session,
                licensed: licensed
            });
        }else{
            var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
            if(!walletbk || req.session.passport.user.userShowPrivateKeyBox){
                walletbk = new WalletBK();
                walletbk.publicWallet = req.session.passport.user.userWalletAddress;
            }
            const [song, countries] = await Promise.all([
                Song.findOne({_id: address}).populate('songArtistRefer','songUserRefer').exec(),
                Country.find({}).exec()
            ]);
            var [licensed] = await Promise.all([
                Order.findOne({$and:[
                        {songAddress: song.songContractAddress},
                        {buyerAddress: req.session.passport.user.userWalletAddress},
                        {status: 2},
                        {dateExpireDate: {"$gte": new Date()}}
                    ]}).exec()
            ]);
            if(!licensed){
                [licensed] = await Promise.all([
                    Order.findOne({$and:[
                            {songAddress: song.songContractAddress},
                            {buyerAddress: req.session.passport.user.userWalletAddress},
                            {$or:[
                                {status: 1},
                                {status: 0}
                            ]}
                        ]}).exec()
                ]);
                console.log(licensed);
            }
            res.render('licenses/create_licensing', {
                song: song,
                walletbk: walletbk,
                type: 'song_recording',
                countries: countries,
                session: req.session,
                licensed: licensed
            });
        }
    });

    app.post('/create-license',isLoggedIn, async function(req, res){
        var data = req.body;
        var [song] = await Promise.all([
            Song.findOne({songContractAddress: data.license_song_address})
            .populate('songArtistRefer')
            .populate('songUserRefer')
            .exec()
        ]);

        if (!song) {
            return res.json(200, {error: 1,msg: "Error. Song not found."});
        }

        if (!song.songUserRefer.userEmail) {
            return res.json(200, {error: 1,msg: "Error. Song not found."});
        }

        if(song.songOwnerContractAddress == req.session.passport.user.userWalletAddress){
            return res.json(200, {error: 1,msg: "Error. You're owner."});   
        }

        var type = 1;
        if(song.songMerkleRootRefer){
            type = 3;
        }

        let LicenseInformationSign = {
            songAddress: song.songContractAddress,
            territories: data.license_ter,
            licenseRight: data.license_right,
            peroid: data.license_peroid,
        };

        var [buyerWalletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
        var buyerAccount = algosdk.mnemonicToSecretKey(buyerWalletbk.publicDeploySeed);
        let signatureBuyer = algosdk.signBytes(algosdk.encodeObj(LicenseInformationSign), buyerAccount.sk);
        let signatureString = new Buffer.from(signatureBuyer).toString('hex');

        var order = new Order();
        order.licenseTo= data.license_to;
        order.licenseFrom= data.license_from;
        order.title= data.license_song_title;
        order.territories= data.license_ter;
        order.right= data.license_right;
        order.peroid= data.license_peroid;
        order.songAddress= data.license_song_address;
        order.ownerAddress= data.license_owner_address;
        order.buyerAddress= data.license_buyer_address;
        order.licenseHash = data.license_hash;
        order.licenseType = data.license_type;
        order.orderBuyerRefer = req.session.passport.user;
        order.orderSellerRefer = song.songUserRefer;
        order.orderSongRefer = song;
        order.amount = 0;
        order.licenseAddress= '';
        order.dateCreated = new Date();
        order.status= 1;
        order.licenseBlockHash = "";
        order.licenseDeployStatus = true;
        order.signatureBuyer = signatureString;
        var firstNotification;
        Email.send_initial_license(order.orderSellerRefer, order.orderBuyerRefer, song, order,"");
        firstNotification = new OneSignal.Notification({
            contents: {
                en: "License deploy successed",
                tr: "License deploy successe"
            }
        });
        firstNotification.setFilters([
            // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
        ]);

        myClient.sendNotification(firstNotification, function (err3, httpResponse, data) {
            if (err3) {
                console.log('Something went wrong...');
            } else {
                console.log(data);
            }
        });

        if (data.license_type == 'song_recording') {
            order.songContractAddress = song.songContractAddress;
            if (song.songArtistRefer) {
                if(song.songArtistRefer.artistNonRomanizedName) {
                    order.songArtistName = song.songArtistRefer.artistProfessionName + ' (' + song.songArtistRefer.artistNonRomanizedName + ')';
                }else{
                    order.songArtistName = song.songArtistRefer.artistProfessionName
                }
            }else{
                order.songArtistName = '';
            }
            order.songComposerName = song.songComposerName;
            order.save(function(err2, new_order){
                if(err2){
                    console.log(err2);
                    return res.json(200, {error: 1, msg: "Error. Please try again."});
                }
                var cart = new Cart(req.session.cart ? req.session.cart : {});
                cart.remove(data.license_song_id);
                req.session.cart = cart;
                song.songOrderRefer.push(new_order);
                song.save(function(err){
                    // new_block_create_transation(hash, req.session.passport.user._id, user.userEmail);
                    return res.json(200, {error: 0, msg: "ok"});
                });
            });
        }else if (data.license_type == 'work_recording') {
            var [work] = await Promise.all([
                Composer.findOne({composerContractAddress: data.license_song_address}).populate('songArtistRefer').exec()
            ]);

            if (!song) {
                return res.json(200, {error: 1, msg: "Error. Please try again."});
            }
            order.songContractAddress = work.songContractAddress;
            order.songArtistName = '';
            order.songComposerName = work.composerName;
            order.save(function(err2, new_order){
                if(err2){
                    return res.json(200, {error: 1, msg: "Error. Please try again."});
                }
                var cart = new Cart(req.session.cart ? req.session.cart : {});
                cart.remove(data.license_song_id);
                req.session.cart = cart;
                work.workOrderRefer.push(new_order);
                work.save(function(err){
                    new_block_create_transation(hash, req.session.passport.user._id, user.userEmail);
                    return res.json(200, {error: 0, msg: "ok"});
                });
            });
        }else{
            return res.json(200, {error: 1, msg: "Error. Please try again."});
        }
    });

    app.get('/accept-license', isLoggedIn, async function(req, res){
        var licenseAddress = req.param('address');
        var options = [{method: 'token', text: 'Token (SP8)'}, {method: 'cash', text: 'Cash (USD)'}];
        if (licenseAddress == undefined || licenseAddress.length == 0) {
            res.redirect('/my-licensings');
        }
        const [order] = await Promise.all([
            Order.findOne({_id: licenseAddress}).exec()
        ]);
        if (!order) {
            res.redirect('/my-licensings');
        }

        const [song] = await Promise.all([
            Song.findOne({songContractAddress: order.songAddress}).populate('songArtistRefer').exec()
        ]);
        if (!song) {
            res.redirect('/my-licensings');
        }
        var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
        if(!walletbk || req.session.passport.user.userShowPrivateKeyBox){
                walletbk = new WalletBK();
                walletbk.publicWallet = req.session.passport.user.userWalletAddress;
            }
        res.render('licenses/update_price', {
            order: order,
            song: song,
            options: options,
            session: req.session,
            walletbk: walletbk
        });
    });

    app.get('/reject-license', isLoggedIn, async function(req, res){
        var licenseAddress = req.param('address');
        var options = [{method: 'token', text: 'Token (SP8)'}, {method: 'cash', text: 'Cash (USD)'}];
        if (licenseAddress == undefined || licenseAddress.length == 0) {
            res.redirect('/my-licensings');
        }
        const [order] = await Promise.all([
            Order.findOne({licenseAddress: licenseAddress}).exec()
        ]);
        if (!order) {
            res.redirect('/my-licensings');
        }

        const [song] = await Promise.all([
            Song.findOne({songContractAddress: order.songAddress}).populate('songArtistRefer').exec()
        ]);
        if (!song) {
            res.redirect('/my-licensings');
        }
        var [walletbk] = await Promise.all([WalletBK.findOne({userRefer:req.session.passport.user._id})]);
        if(!walletbk || req.session.passport.user.userShowPrivateKeyBox){
            walletbk = new WalletBK();
            walletbk.publicWallet = req.session.passport.user.userWalletAddress;
        }
        res.render('licenses/reject_license', {
            order: order,
            song: song,
            options: options,
            session: req.session,
            walletbk: walletbk
        });
    });

    app.post('/reject-license',isLoggedIn, async function(req, res){
        var data = req.body;
        var id = data.id;
        if (id == undefined || id.length == 0) {
            return res.json(200, {error: 1, msg: "Some error"});
        }
        var [order] = await Promise.all([
            Order.findOne({_id: id}).exec()
        ]);

        if (!order) {
            return res.json(200, {error: 1, msg: "Some error"});
        }

        order.method = data.method;
        order.licenseUpdatePriceBlockHash = '';
        order.amount = data.amount;
        order.dateExpireDate = new Date();
        order.dateUpdated = new Date();
        order.licenseDeployStatus = true;
        order.status = 3;
        var [order] = await Promise.all([
            order.save()    
        ]);



        return res.json(200, {error: 0, msg: "ok"});
    });

    app.post('/accept-license',isLoggedIn, async function(req, res){
        var data = req.body;
        var licenseAddress = data.license_address;
        if (licenseAddress == undefined || licenseAddress.length == 0) {
            return res.json(200, {error: 1, msg: "Some error"});
        }
        var [order] = await Promise.all([
                Order.findOne({_id: licenseAddress}).populate('orderSellerRefer').populate('orderBuyerRefer').exec()
            ]);
        if (!order) {
                return res.json(200, {error: 1, msg: "Some error"});
            }
        // var solFunction = new SolFunction('', _.find(Config.Sol_LicensingABI, { name: 'updatePrice' }), '');
        // var payloadData = solFunction.toPayload([data.amount]).data;
        // const serialized = BlockChain.ethRawTx('function', payloadData, Config.accountDefault, licenseAddress);
        //wallet buyer account
        var [buyerWalletbk] = await Promise.all([WalletBK.findOne({publicWallet:order.buyerAddress})]);
        var [onwerWalletbk] = await Promise.all([WalletBK.findOne({publicWallet:order.ownerAddress})]);
        // var LicensingContractRAW = web3.eth.contract(Config.Sol_LicensingABI);
        // var contractData = LicensingContractRAW.new.getData(
        //     data.license_buyer_address, 
        //     Config.SPXTokenAddress, 
        //     data.license_song_address, 
        //     data.license_ter, 
        //     data.license_right, 
        //     data.license_peroid, 
        //     data.license_hash,
        //     type, 
        //     {
        //         data: Config.Sol_LicensingData
        //     }
        // );
        // const serialized = BlockChain.ethRawTx('contract', contractData, Config.accountDefault, '');
        // BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
        //     if (!hash) {
        //         return res.json(200, {error: 1,msg: "Error. Song not found."});
        //     }
        // try{
        //     const algodclient = new algosdk.Algod(token, baseServer, port); 
        //     const postAlgodclient = new algosdk.Algod(postToken, baseServer, port); // Binary content type
            
        //     var adminAccount = algosdk.mnemonicToSecretKey(Config.algorand_seed); 
        //     var buyerAccount = algosdk.mnemonicToSecretKey(buyerWalletbk.publicDeploySeed); 
        //     var ownerAccount = algosdk.mnemonicToSecretKey(onwerWalletbk.publicDeploySeed); 

        //     let params = await algodclient.getTransactionParams();
        //     let endRound = params.lastRound + parseInt(1000);

        //     let LicenseInformation = {
        //         songAddress: order.songAddress, 
        //         territories: order.territories, 
        //         licenseRight: order.right, 
        //         peroid: order.peroid, 
        //     };

        //     //Setup the parameters for the multisig account
        //     const mparams = {
        //         version: 1,
        //         threshold: 2,
        //         addrs: [
        //             adminAccount.addr,
        //             order.ownerAddress
        //         ],
        //     };
        //     console.log(mparams);

        //     var multsigaddr = algosdk.multisigAddress(mparams);

        //     //create a transaction
        //     let txn = {
        //         "from": multsigaddr,
        //         "to": order.ownerAddress,
        //         "fee": params.fee,
        //         "amount": 2000000,
        //         "firstRound": params.lastRound,
        //         "lastRound": endRound,
        //         "genesisID": params.genesisID,
        //         "genesisHash": params.genesishashb64,
        //         "note": algosdk.encodeObj(LicenseInformation)
        //     };
        //     console.log(ownerAccount);
        //     //Sign with first signature
        //     let rawSignedTxn = algosdk.signMultisigTransaction(txn, mparams, adminAccount.sk).blob;
        //     console.log('sdfsd');
        //     //sign with second account
        //     let twosigs = algosdk.appendSignMultisigTransaction(rawSignedTxn, mparams, ownerAccount.sk).blob;
        //     console.log('sdfsd3232');
        //     let tx;
        //     //submit the transaction
        //     console.log(postAlgodclient);
        //     try{
        //         tx = (await postAlgodclient.sendRawTransaction(twosigs));
        //     }catch(ex){
        //         console.log(ex);
        //     }
        //     console.log('sdfsd32323243243');
        //     console.log(tx);

        //     if(tx){
        //         order.method = data.method;
        //         order.licenseUpdatePriceBlockHash = tx.txId;
        //         order.amount = data.amount;
        //         order.dateExpireDate = addMonths(new Date(),order.peroid);
        //         order.dateUpdated = new Date();
        //         order.licenseDeployStatus = false;
        //         var [order] = await Promise.all([
        //             order.save()    
        //         ]);
        //         return res.json(200, {error: 0, msg: "ok"});
        //     }else{
        //         return res.json(200, {error: 1, msg: "Some error"});
        //     }
        // }catch(e) {
        //     console.log(e);
        //     return res.json(200, {error: 1, msg: "Some error"});
        // };
        // BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
        //     if (err || !hash) {
        //         return res.json(200, {error: 1, msg: "Some error"});
        //     }
        //     var [order] = await Promise.all([
        //         Order.findOne({licenseAddress: licenseAddress}).exec()
        //     ]);

        //     if (!order) {
        //         return res.json(200, {error: 1, msg: "Some error"});
        //     }

        //     order.method = data.method;
        //     order.licenseUpdatePriceBlockHash = hash;
        //     order.amount = data.amount;
        //     order.dateExpireDate = addMonths(new Date(),order.peroid);
        //     order.dateUpdated = new Date();
        //     order.licenseDeployStatus = false;
        //     var [order] = await Promise.all([
        //         order.save()    
        //     ]);
        //     return res.json(200, {error: 0, msg: "ok"});
        // });
        //create an account
        // var account1 = algosdk.generateAccount();
        // console.log(account1.addr);
        // //create an account
        // var account2 = algosdk.generateAccount();
        // console.log(account2.addr);
        // //create an account
        // var account3 = algosdk.generateAccount();
        // console.log(account3.addr);
        let algodclient = new algosdk.Algod(token, baseServer, port); 
        let postAlgodclient = new algosdk.Algod(postToken, baseServer, port); // Binary content type
        var adminAccount = algosdk.mnemonicToSecretKey(Config.algorand_seed); 
        var buyerAccount = algosdk.mnemonicToSecretKey(buyerWalletbk.publicDeploySeed); 
        var ownerAccount = algosdk.mnemonicToSecretKey(onwerWalletbk.publicDeploySeed);

        // console.log(await algodclient.accountInformation(buyerAccount.addr));
        // console.log(await algodclient.accountInformation(ownerAccount.addr));
        let params = await algodclient.getTransactionParams();
        let endRound = params.lastRound + parseInt(1000);
        // let seed1 = passphrase.seedFromMnemonic(buyerWalletbk.publicDeploySeed);
        // let sk1= nacl.keyPairFromSeed(seed1).secretKey;

        // let seed2 = passphrase.seedFromMnemonic(onwerWalletbk.publicDeploySeed);
        // let sk2 = nacl.keyPairFromSeed(seed2).secretKey

        //Setup the parameters for the multisig account
        // const mparams = {
        //     version: 1,
        //     threshold: 1,
        //     addrs: [
        //         adminAccount.addr,
        //         buyerAccount.addr,
        //         ownerAccount.addr
        //     ],
        // };
        //
        // var multsigaddr = algosdk.multisigAddress(mparams);
        // // sleep.sleep(1); // sleep for ten seconds// sleep for 10 seconds
        // console.log("Multisig Address: " + multsigaddr);
        //Pause execution to allow using the dispenser on testnet to put tokens in account
        // console.log('Make sure address above has tokens using the dispenser');
        try {

            // let algodclient = new algosdk.Algod(token, server, port);
            //Get the relevant params from the algod
            let params = await algodclient.getTransactionParams();
            let endRound = params.lastRound + parseInt(1000);
            var recoveredAccount = algosdk.mnemonicToSecretKey(Config.algorand_seed);
            let LicenseInformationSign = {
                songAddress: order.songAddress,
                territories: order.territories,
                licenseRight: order.right,
                peroid: order.peroid,
            };
            let signature = algosdk.signBytes(algosdk.encodeObj(LicenseInformationSign), ownerAccount.sk);
            let signatureString = new Buffer.from(signature).toString('hex');

            let LicenseInformation = {
                songAddress: order.songAddress,
                territories: order.territories,
                licenseRight: order.right,
                peroid: order.peroid,
                signatureOwner: signatureString,
                signatureBuyer: order.signatureBuyer
            };


            var ownerAccountBalance = await algodclient.accountInformation(buyerAccount.addr);
            console.log(ownerAccountBalance);
            if(ownerAccountBalance.amount < 100000 ){
                let txnSendAlgo = {
                    "from": recoveredAccount.addr,
                    "to": buyerAccount.addr,
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
                "to": buyerAccount.addr,
                "fee": params.fee,
                "amount": 0,
                "firstRound": params.lastRound,
                "lastRound": endRound,
                "genesisID": params.genesisID,
                "genesisHash": params.genesishashb64,
                "note": algosdk.encodeObj(LicenseInformation)
            };

            let signedTxn = algosdk.signTransaction(txn, recoveredAccount.sk);
            let tx = (await postAlgodclient.sendRawTransaction(signedTxn.blob));
            if(tx) {
                order.method = data.method;
                order.licenseAddress = tx.txId;
                order.licenseUpdatePriceBlockHash = tx.txId;
                order.amount = data.amount;
                order.dateExpireDate = addMonths(new Date(), order.peroid);
                order.dateUpdated = new Date();
                order.status = 0;
                order.licenseDeployStatus = true;
                var [order] = await Promise.all([
                    order.save()
                ]);
                console.log("Transaction : " + tx.txId);
                var firstNotification;
                Email.send_accept_license(order.orderBuyerRefer, order.orderSellerRefer, order);
                firstNotification = new OneSignal.Notification({
                    contents: {
                        en: "License accept deploy successed: " + tx.txId,
                        tr: "License accept deploy successed: " + tx.txId,
                    }
                });
                firstNotification.setFilters([
                    // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
                ]);

                myClient.sendNotification(firstNotification, function (err3, httpResponse, data) {
                    if (err3) {
                        console.log('Something went wrong...');
                    } else {
                        console.log(data);
                    }
                });
                return res.json(200, {error: 0, msg: "ok"});
            }
        } catch (err) {
            console.log(err); 
        }
    });

    app.get('/payment-license',isLoggedIn, async function(req, res){
        var licenseAddress = req.param('address');
        if (licenseAddress == undefined) {
            res.redirect('/my-licensings');
            return;
        }
        var [order] = await Promise.all([
            Order.findOne({licenseAddress: licenseAddress}).exec()
        ]);
        if (!order) {
            res.redirect('/my-licensings');
            return;
        }

        var [song] = await Promise.all([
            Song.findOne({songContractAddress: order.songAddress}).populate('songArtistRefer').exec()
        ]);
        if (!song) {
             res.redirect('/my-licensings');
             return;
        }
        res.render('licenses/fund', {
            order: order,
            song: song,
            session: req.session
        });
    });

    app.post('/payment-license',isLoggedIn, async function(req, res){
        var data = req.body;
        console.log(data);

        var licenseAddress = data.license_address;
        if (licenseAddress == undefined) {
            return res.json(200, {error: 1, msg: "Some error"});
        }
        var solFunction = new SolFunction('', _.find(Config.Sol_LicensingABI, { name: 'fundLicense' }), '');
        var payloadData = solFunction.toPayload([]).data;

        const serialized = BlockChain.ethRawTx('function', payloadData, Config.accountDefault, licenseAddress);
        BlockChain.ethSendRawTransaction(serialized, async (err, hash) => {
            if (err || !hash) {
                return res.json(200, {error: 1, msg: "Some error"});
            }
            var [order] = await Promise.all([
                Order.findOne({licenseAddress: licenseAddress}).exec()
            ]);
            if (!order) {
                return res.json(200, {error: 1, msg: "Some error"});
            }

            order.licensePayBlockHash = hash;
            order.licenseDeployStatus = false;
            // order.status = 2;
            var [order] = await Promise.all([
                order.save()    
            ]);
            return res.json(200, {error: 0, msg: "ok"});
        });
    });

    app.get('/search-licensings', isLoggedIn, function(req, res){
        var keyword = req.param('keyword');
        var arrConditionLicense = [];
        if (keyword == undefined) {
            keyword = '';
        }
        if (keyword.length > 1) {
            arrConditionLicense.push({title: new RegExp(keyword, 'i')});
            var conditionLicense = {
                $and: [
                    {
                        arrConditionLicense
                    },
                    {
                        $or:[
                            {buyerAddress: req.session.passport.user.userWalletAddress},
                            {ownerAddress: req.session.passport.user.userWalletAddress}
                        ]
                    }
                ]
            };
            console.log('Condition:' + conditionLicense);
            Order.find(conditionLicense).exec(function(err, data){
                if (!err) {
                    res.render('listtransactions',{
                        transactions: data,
                        address: req.session.passport.user.userWalletAddress,
                        session: req.session,
                        title: "All",
                        menu_index: 3
                    });
                }else{
                    console.log('Error: ' + err);
                    res.redirect('/licensings');
                }
            });
        }else{
            res.redirect('/licensings');
        }
    });
};

// function new_block_create_transation (block_hash, user_id, to){
//   var job = queue.create('license_song_work', {
//     txHash: block_hash,
//     user_id: user_id,
//     to: to
//   });
//   job
//     .on('complete', function (){
//       console.log(1232131);
//     })
//     .on('failed', function (){
//       console.log(12321312323232);
//     })
//   job.save();
// }

// function new_block_update_price_transaction (block_hash, user_id, to, from){
//     var job = queue.create('update_price_for_license', {
//         txHash: block_hash,
//         user_id: user_id,
//         to: to,
//         from: from
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

function new_block_fund_transaction (block_hash, user_id, to){
    var job = queue.create('fund_for_license', {
        txHash: block_hash,
        user_id: user_id,
        to: to
    });
    job
        .on('complete', function(){
            console.log(1232131);
        })
        .on('failed', function(){
            console.log(12321312323232);
        });
    job.save();
}

// queue.process('license_song_work', function(job, done){
//     try{
//         console.log(job.data.txHash);
//         var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
//         if(receipt){
//             console.log(receipt);
//             Order.findOne({licenseBlockHash: receipt.transactionHash}).exec(function(err, order){
//                 if(!order){
//                     return;
//                 }
//                 order.licenseAddress = receipt.contractAddress;
//                 order.licenseDeployStatus = true;
//                 if (receipt.status == 0x0) {
//                     order.status = 3; // deploy failed
//                 }
//                 order.save(function(err1){
//                     if(err1){
//                         return;
//                     }
//                     Song.findOne({songContractAddress: order.songAddress}, function(err2, song){
//                         if (!song) {
//                             return;
//                         }
//                         var firstNotification;
//                         if (receipt.status == 0x1) {
//                           email_helpler.send_initial_license(job.data.to, song, order, receipt.contractAddress);
//                           firstNotification = new OneSignal.Notification({
//                               contents: {
//                                   en: "License deploy successed: "+receipt.transactionHash,
//                                   tr: "License deploy successed: "+receipt.transactionHash,
//                               }
//                           });
//                         }else{
//                           firstNotification = new OneSignal.Notification({
//                               contents: {
//                                   en: "Sorry. License deploy failed: "+receipt.transactionHash,
//                                   tr: "Sorry. License deploy failed: "+receipt.transactionHash,
//                               }
//                           });
//                         }
//                         firstNotification.setFilters([
//                             {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
//                         ]);

//                         myClient.sendNotification(firstNotification, function (err3, httpResponse,data) {
//                            if (err3) {
//                                console.log('Something went wrong...');
//                            } else {
//                                console.log(data);
//                            }
//                         });
//                     });
//                 });
//             });
//         }else{
//             new_block_create_transation(job.data.txHash, job.data.user_id, job.data.to);
//         }
//     }catch(ex){
//         console.log(ex);
//     }
//     done && done();
// });

// queue.process('update_price_for_license', function(job, done){
//     try{
//         console.log(job.data.txHash);
//         var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
//         if (receipt) {
//             console.log(receipt);
//             Order.findOne({licenseBlockHash: receipt.transactionHash}).exec(function(err, order){
//                 if (!order) {
//                     return;
//                 }
//                 order.licenseDeployStatus = true;
//                 if (receipt.status == 0x0) {
//                     order.status = 3; // deploy failed
//                 }
//                 order.save(function(err1){
//                     if (err1) {
//                       return;
//                     }
//                     var firstNotification;
//                     if (receipt.status == 0x1) {
//                       email_helpler.send_accept_license(job.data.to, job.data.from, order);
//                       firstNotification = new OneSignal.Notification({
//                           contents: {
//                               en: "License accept deploy successed: "+receipt.transactionHash,
//                               tr: "License accept deploy successed: "+receipt.transactionHash,
//                           }
//                       });
//                     }else{
//                       firstNotification = new OneSignal.Notification({
//                           contents: {
//                               en: "Sorry. License accept deploy failed: "+receipt.transactionHash,
//                               tr: "Sorry. License accept deploy failed: "+receipt.transactionHash,
//                           }
//                       });
//                     }
//                     firstNotification.setFilters([
//                         {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
//                     ]);

//                     myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
//                        if (err2) {
//                            console.log('Something went wrong...');
//                        } else {
//                            console.log(data);
//                        }
//                     });
//                 });
//             });
//         }else{
//             new_block_update_price_transaction(job.data.txHash, job.data.user_id, job.data.to, job.data.from);
//         }
//     }catch(ex){
//         console.log(ex);
//     }
//     done && done();
// });

// queue.process('fund_for_license', function(job, done){
//     try{
//         console.log(job.data.txHash);
//         var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
//         if (receipt) {
//           Order.findOne({licenseBlockHash: receipt.transactionHash}).exec(function(err, order){
//               if (!order) {
//                   return;
//               }
//               order.licenseDeployStatus = true;
//               if (receipt.status == 0x0) {
//                   order.status = 3; // deploy failed
//               }
//               order.save(function(err1){
//                   if (err1) {
//                       return;
//                   }
//                   Song.findOne({songContractAddress: order.songAddress}, function(err2, song){
//                       if (!song) {
//                           return;
//                       }
//                       var firstNotification;
//                       if (receipt.status == 0x1) {
//                         email_helpler.send_fund_license(job.data.to, song, order);
//                         firstNotification = new OneSignal.Notification({
//                             contents: {
//                                 en: "License payment deploy successed: "+receipt.transactionHash,
//                                 tr: "License payment deploy successed: "+receipt.transactionHash,
//                             }
//                         });
//                       }else{
//                         firstNotification = new OneSignal.Notification({
//                             contents: {
//                                 en: "Sorry. License payment deploy failed: "+receipt.transactionHash,
//                                 tr: "Sorry. License payment deploy failed: "+receipt.transactionHash,
//                             }
//                         });
//                       }
//                       firstNotification.setFilters([
//                           {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
//                       ]);

//                       myClient.sendNotification(firstNotification, function (err3, httpResponse,data) {
//                          if (err3) {
//                              console.log('Something went wrong...');
//                          } else {
//                              console.log(data);
//                          }
//                       });
//                   });
//               });
//           });
//         }else{
//             new_block_fund_transaction(job.data.txHash, job.data.user_id, job.data.to);
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
