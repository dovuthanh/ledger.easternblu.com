var User              = require('../models/user');
var Song              = require('../models/song');
var Order             = require('../models/order');
var Artist            = require('../models/artist');
var Composer          = require('../models/composer');
var Royalty           = require('../models/royalty');
var Cart              = require('../models/cart');
var Merkle            = require('../models/merkle');
var MerkleDeploy      = require('../models/merkledeploy');
var SmartContract      = require('../models/smartcontract');
var Export            = require('../models/export');
var WalletBK      = require('../models/walletbk');
var Email             = require('./email.js');
var ExportData        = require('./export-data.js');
var bcrypt            = require ('bcrypt');
var crypto            = require('crypto')
var merkle            = require('merkle-lib')
var fastRoot          = require('merkle-lib/fastRoot')
var merkleProof       = require('merkle-lib/proof')
var multer            = require('multer');
var bodyParser        = require('body-parser');
var formidable        = require('formidable');
var OneSignal         = require('onesignal-node');
var Guid              = require('guid');
var MerkleTools       = require('merkle-tools')
const https           = require('https');
var fs                = require('fs');
var path              = require('path'); 
var csrf_guid         = Guid.raw();
var kue               = require('kue'),
queue                 = kue.createQueue();
const Request         = require('request');
const Querystring     = require('querystring');
require('dotenv').config();
const confirmation_royalty_address = process.env.CONFIRM_ROYALTY_PARTNER_ADDRESS;
const api_version     = 2.7;
const app_id          = process.env.FB_APP_ID;
const app_secret      = process.env.FB_APP_SECRET;
var Promise           = require('promise');
const _               = require('lodash');
const { forEach } = require('p-iteration');
const PinYin          = require('hanzi-to-pinyin');
const BlockChain      = require('./blockchain');
const Config          = require('../../config/config');
var Web3              = require('web3');
var Iconv             = require("iconv").Iconv;
var iconv             = new Iconv('utf8', 'utf16le');
var web3              = new Web3(new Web3.providers.HttpProvider(Config.LinkTestNet));
var myClient          = new OneSignal.Client({
    userAuthKey: process.env.ONE_SINGNAL_USER_AUTHENT,
    app: { appAuthKey: process.env.ONE_SINGNAL_APP_AUTHENT, appId: process.env.ONE_SIGNAL_APP_ID }
});
var sleep = require('sleep');
const algosdk = require('algosdk');
const baseServer = "https://testnet-algorand.api.purestake.io/ps1"
const port = "";
let QRCode = require('qr-image');

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
module.exports ={

  // deploy_mass_migration: async function deploy_mass_migration(){
  //   try{
  //     var [deployItem] = await Promise.all([
  //       MerkleDeploy.findOne({deployStatus:0}),
  //     ]);
  //     if(deployItem){
  //       // console.log(deployItem);
  //       var Sol_MassRegistrationABI = Config.Sol_MassRegistrationABI;
  //       var Sol_MassRegistrationData = Config.Sol_MassRegistrationData;
  //       // var [smartContract] = await Promise.all([
  //       //     SmartContract.findOne({status:true})
  //       // ]);
  //       // if(smartContract){
  //       //     Sol_MassRegistrationABI = JSON.parse(smartContract.Sol_MassRegistrationABI);
  //       //     Sol_MassRegistrationData = JSON.parse(smartContract.Sol_MassRegistrationData)
  //       // }
  //       const massRegistrationContract = web3.eth.contract(Sol_MassRegistrationABI);
  //       const payloadData = massRegistrationContract.new.getData(
  //           deployItem.arrayOwner,
  //           deployItem.songTitle1 + " | "+ deployItem.professionalName1,
  //           deployItem.songTitle2 + " | "+ deployItem.professionalName2,
  //           deployItem.songTitle3 + " | "+ deployItem.professionalName3,
  //           deployItem.hash1,
  //           deployItem.hash2,
  //           deployItem.hash3,
  //           deployItem.digital1,
  //           deployItem.digital2,
  //           deployItem.digital3,
  //           deployItem.duration1 + " | "+ deployItem.publishDate1,
  //           deployItem.duration2 + " | "+ deployItem.publishDate2,
  //           deployItem.duration3 + " | "+ deployItem.publishDate3,
  //           {
  //               data: Sol_MassRegistrationData
  //           });
  //       const serialized = BlockChain.ethRawTx('contract', payloadData, Config.accountDefault, '');
  //       BlockChain.ethSendRawTransaction(serialized, (err, hash) => {
  //         if (hash) {
  //             deployItem.blockHash = hash;
  //             deployItem.deployStatus = 1;
  //             deployItem.save(function(err){
  //                 if(err){
  //                   console.log(err);
  //                 }
  //             });
  //         }else{
  //             console.log("cannot deploy");
  //         }
  //       });
  //     }
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },

  deploy_mass_migration: async function deploy_mass_migration(){
    try{
      var [deployItem] = await Promise.all([
        Merkle.findOne({
          $and:[
            {deployStatus:1},
            {isCompleted:0},
            {contractAddress: ""},
            {isDeploying:0}
          ]
        }),
      ]);
      if(deployItem){
        var [user] = await Promise.all([
          User.findOne({_id: deployItem.userRefer})
        ]);

        var [countSong] = await Promise.all([
          Song.count({songMerkleRootRefer: deployItem._id})
        ]);

        if(countSong == 0){
          deployItem.isDeploying = true;
          deployItem.isCompleted = true;
          var [result]  = await Promise.all([
              deployItem.save()
          ]);
          return
        }

        //deploy merklet root
        if(user.userCanDeployMassMigration && countSong >1){
          // var Sol_MassRegistrationABI = Config.Sol_MassRegistrationABI;
          // var Sol_MassRegistrationData = Config.Sol_MassRegistrationData;
          // var [smartContract] = await Promise.all([
          //     SmartContract.findOne({status:true})
          // ]);
          // if(smartContract){
          //     Sol_MassRegistrationABI = JSON.parse(smartContract.Sol_MassRegistrationABI);
          //     Sol_MassRegistrationData = JSON.parse(smartContract.Sol_MassRegistrationData)
          // }
          // console.log(deployItem.ownerPublicKey);
          // console.log(deployItem.merkleRoot);
          // console.log(deployItem.digitalSignature);
            const algodclient = new algosdk.Algod(token, baseServer, port);
            var [ownerWalletBK] = await Promise.all([WalletBK.findOne({publicWallet:deployItem.ownerPublicKey})]);
            var ownerAccount = algosdk.mnemonicToSecretKey(ownerWalletBK.publicDeploySeed);
            var recoveredAccount = algosdk.mnemonicToSecretKey(Config.algorand_seed);
            let params = await algodclient.getTransactionParams();
            let endRound = params.lastRound + parseInt(1000);
            let signature = algosdk.signBytes(deployItem.merkleRoot, ownerAccount.sk);
            let signatureString = new Buffer.from(signature).toString('hex');

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

            // console.log(new Buffer.from(singature).toString('hex'));
            // let value = algosdk.verifyBytes(data.song_hash, Buffer.from(signatureString, 'hex'), ownerAccount.addr);
            // console.log(value);
            // return;
            let merkleRootInformation = {
                merkleRoot: deployItem.merkleRoot,
                digitalSignatures: signatureString
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
                "note": algosdk.encodeObj(merkleRootInformation)
            };

            let signedTxn = algosdk.signTransaction(txn, recoveredAccount.sk);
            let tx = (await postAlgodclient.sendRawTransaction(signedTxn.blob));
            console.log("Transaction : " + tx.txId);
            if (tx) {
                deployItem.contractAddress = tx.txId;
                deployItem.blockHash = tx.txId;
                deployItem.deployStatus = 1;
                deployItem.isCompleted = true;
                deployItem.verified = true;
                var result2 = await Promise.all([deployItem.save()]);
                var result = await Promise.all([merkle.save()]);
                var [result1] = await Promise.all([
                    Song.update(
                        {songMerkleRootRefer: deployItem._id},
                        {"$set": {"songContractAddress": tx.txId}},{ multi: true }, function(error){
                        })
                ]);
            }
            Email.send_mass_migration_deploy_success(user.userEmail, user.userFullName, "");
            var firstNotification;
            firstNotification = new OneSignal.Notification({
                contents: {
                    en: "Mass registration deploy successed ",
                    tr: "Mass registration deploy successed ",
                }
            });
            firstNotification.setFilters([
                {"field": "tag", "key": "USER_ID", "relation": "=", "value": deployItem.userRefer},
            ]);

            myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
                if (err2) {
                    console.log('Something went wrong...');
                } else {
                    console.log(data);
                }
            });

          // const massRegistrationContract = web3.eth.contract(Sol_MassRegistrationABI);
          // const payloadData = massRegistrationContract.new.getData(
          //     deployItem.ownerPublicKey,
          //     deployItem.merkleRoot,
          //     deployItem.digitalSignature,
          //     {
          //         data: Sol_MassRegistrationData
          //     });
          // const serialized = BlockChain.ethRawTx('contract', payloadData, Config.accountDefault, '');
          // BlockChain.ethSendRawTransaction(serialized, (err, hash) => {
          //   if (hash) {
          //       deployItem.blockHash = hash;
          //       deployItem.deployStatus = 1;
          //       deployItem.save(function(err){
          //           if(err){
          //             console.log(err);
          //           }
          //       });
          //   }else{
          //       console.log("cannot deploy");
          //   }
          // });
        }else{
          //deploy one by one
          var [songs] = await Promise.all([
            Song.find({songMerkleRootRefer: deployItem._id}).populate('songArtistRefer').exec()
          ]);

          songs.forEach(async function (song) {
            // var Sol_SongRecordingABI = Config.Sol_SongRecordingABI;
            // var Sol_SongRecordingData = Config.Sol_SongRecordingData;
            var artistID = 0;
            if (typeof song.songArtistRefer.artistID !== 'undefined') {
              artistID = song.songArtistRefer.artistID;
            }
            // var [smartContract] = await Promise.all([
            //     SmartContract.findOne({status:true})
            // ]);
            // if(smartContract){
            //     Sol_SongRecordingABI = JSON.parse(smartContract.Sol_SongRecordingABI);
            //     Sol_SongRecordingData = JSON.parse(smartContract.Sol_SongRecordingData)
            // }
            // var songrecordingregistrationContract = web3.eth.contract(Sol_SongRecordingABI);
            // var songContractData = songrecordingregistrationContract.new.getData(
            //     song.songOwnerContractAddress,
            //     song.songTitle,
            //     song.songHash,
            //     song.songDigitalSignature,
            //     artistID,
            //     song.songDuration,
            //     0, {
            //         data: Sol_SongRecordingData
            //     }
            // );
            // var serialized = BlockChain.ethRawTx('contract', songContractData, Config.accountDefault, '');
            // BlockChain.ethSendRawTransaction(serialized, (err2, hash) => {
            //   if (err2 || hash == null || hash.length == 0) {
            //
            //   }else{
            //     song.songBlockHash = hash;
            //     song.songReadyToDeploy = true;
            //     song.save(function(err3){
            //       if(err3){
            //           console.log(err3);
            //       }
            //     });
            //   }
            // });
              const algodclient = new algosdk.Algod(token, baseServer, port);
              var [ownerWalletBK] = await Promise.all([WalletBK.findOne({publicWallet:song.songOwnerContractAddress})]);
              var ownerAccount = algosdk.mnemonicToSecretKey(ownerWalletBK.publicDeploySeed);
              var recoveredAccount = algosdk.mnemonicToSecretKey(Config.algorand_seed);
              let params = await algodclient.getTransactionParams();
              let endRound = params.lastRound + parseInt(1000);
              let signature = algosdk.signBytes(song.songHash, ownerAccount.sk);
              let signatureString = new Buffer.from(signature).toString('hex');

              let songInformation = {
                  songTitle: song.songTitle,
                  songHash: song.songHash,
                  publishDate: song.songPublish,
                  artistName: artistID,
                  songDuration: song.songDuration,
                  digitalSignatures: signatureString
              };

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
              if(tx) {
                  console.log("Transaction : " + tx.txId);
                  song.songBlockHash = tx.txId;
                  song.songBlockHash = tx.txId;
                  song.songReadyToDeploy = true;
                  song.songContractAddress = tx.txId;
                  song.songDeployStatus = true;
                  song.save(function (err3) {
                      if (err3) {
                          console.log(err3);
                      }
                  });
                  Email.send_song_deploy_success(song.songUserRefer.userEmail, song.songUserRefer.userFullName, tx.txId, song._id, song.songTitle);
                  firstNotification = new OneSignal.Notification({
                      contents: {
                          en: "Song registration deploy successed: "+tx.txId,
                          tr: "Song registration deploy successed: "+tx.txId,
                      }
                  });
              }
          });
        }
        deployItem.isDeploying = true;
        var [result]  = await Promise.all([
            deployItem.save()
        ]);
      }
    }catch(ex){
        console.log(ex);
    }
  },

  // check_deploy_mass_migration: async function check_deploy_mass_migration(){
  //   try{
  //     var [arrayMerkleDeploy] = await Promise.all([
  //       Merkle.find({
  //         $and:[
  //           {blockHash: { "$ne": "" }},
  //           {blockHash:{ $exists: true}},
  //           {contractAddress: ""},
  //           {isCompleted: false}
  //         ]
  //     }).populate('userRefer').exec()]);
  //     for(var i =0; i < arrayMerkleDeploy.length; i++){
  //       var merkle = arrayMerkleDeploy[i];
  //       var receipt = web3.eth.getTransactionReceipt(merkle.blockHash);
  //       if(receipt){
  //         merkle.contractAddress = receipt.contractAddress;
  //         merkle.isCompleted = true;
  //         if (receipt.status == 0x1) {
  //           merkle.verified = true; //deploy failed
  //         }else {
  //           merkle.verified = false;
  //         }
  //         var result = await Promise.all([merkle.save()]);
  //         var [result1] = await Promise.all([
  //           Song.update(
  //               {songMerkleRootRefer: merkle._id},
  //               {"$set": {"songContractAddress": receipt.contractAddress}},{ multi: true }, function(error){
  //           })
  //         ]);
  //       }
  //     }
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },

  // check_deploy_mass_migration_total: async function check_deploy_mass_migration_total(){
  //   try{
  //     var [arrayMerkle] = await Promise.all([
  //       Merkle.find({
  //         $and:[
  //           {deployStatus: true},
  //           {isCompleted: false},
  //           {merkleRoot: ""},
  //           {isDeploying:true}
  //         ]
  //     }).populate('userRefer').exec()]);
  //     console.log(arrayMerkle);
  //     for(var i =0; i < arrayMerkle.length; i++){
  //       var merkleItem = arrayMerkle[i];
  //       var [songs] = await Promise.all([
  //         Song.find({
  //           $and:[
  //             {songMerkleRootRefer:merkleItem._id},
  //             {contractAddress: ""},
  //           ]
  //         }).exec()
  //       ]);
  //       if(songs.length==0){
  //         merkleItem.isCompleted = true;
  //         var result = await Promise.all([merkleItem.save()]);
  //         //send email
  //         Email.send_mass_migration_deploy_success(merkleItem.userRefer.userEmail, merkleItem.userRefer.userFullName, "");
  //         var firstNotification;
  //         firstNotification = new OneSignal.Notification({
  //             contents: {
  //                 en: "Mass registration deploy successed ",
  //                 tr: "Mass registration deploy successed ",
  //             }
  //         });
  //         firstNotification.setFilters([
  //             {"field": "tag", "key": "USER_ID", "relation": "=", "value": merkleItem.userRefer._id},
  //         ]);
  //
  //         myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
  //            if (err2) {
  //                console.log('Something went wrong...');
  //            } else {
  //                console.log(data);
  //            }
  //         });
  //       }
  //     }
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },

  // check_deploy_song_registration: async function check_deploy_song_registration(){
  //   try{
  //       var [arraySong] = await Promise.all([
  //         Song.find({
  //          $and:[
  //             {songBlockHash: { "$ne": "" }},
  //             {songBlockHash:{ $exists: true}},
  //             {songReadyToDeploy: true},
  //             {
  //               $or:[
  //               {songContractAddress: ""},
  //               {songContractAddress: null},
  //               ]
  //             }
  //           ]
  //       }).populate('songUserRefer').exec()]);
  //       for(var i =0; i < arraySong.length; i++){
  //         var song = arraySong[i];
  //         var receipt = web3.eth.getTransactionReceipt(song.songBlockHash);
  //         console.log(receipt);
  //         if(receipt){
  //           console.log('Song: ' +  song + '& at: ' + receipt.contractAddress);
  //           song.songContractAddress = receipt.contractAddress;
  //           song.songDeployStatus = true;
  //           if (receipt.status == 0x1) {
  //             song.verified = true; //deploy successed
  //           }else {
  //             song.verified = false;
  //           }
  //           var result = await Promise.all([song.save()]);
  //           var firstNotification;
  //           if (receipt.status == 0x1) {
  //             Email.send_song_deploy_success(song.songUserRefer.userEmail, song.songUserRefer.userFullName, receipt.contractAddress, song._id, song.songTitle);
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "Song registration deploy successed: "+receipt.transactionHash,
  //                     tr: "Song registration deploy successed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }else{
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "Sorry. Song registration deploy failed: "+receipt.transactionHash,
  //                     tr: "Sorry. Song registration deploy failed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }
  //           firstNotification.setFilters([
  //               {"field": "tag", "key": "USER_ID", "relation": "=", "value": song.songUserRefer._id},
  //           ]);
  //
  //           myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
  //              if (err2) {
  //                  console.log('Something went wrong...');
  //              } else {
  //                  console.log(data);
  //              }
  //           });
  //       }
  //       };
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },

  // check_deploy_add_royalty_partners: async function check_deploy_add_royalty_partners(){
  //   try{
  //       var [arrayRoyalty] = await Promise.all([
  //         Royalty.find({
  //           $and:[
  //             {deployBlockHash: { "$ne": "" }},
  //             {deployBlockHash:{ $exists: true}},
  //             {deployStatus: false},
  //             {status: 0}
  //           ]
  //         })]);
  //       for(var i =0; i < arrayRoyalty.length; i++){
  //         var royalty = arrayRoyalty[i];
  //         var receipt = web3.eth.getTransactionReceipt(royalty.deployBlockHash);
  //         if (receipt) {
  //           console.log(receipt);
  //           royalty.deployStatus = true;
  //           if (receipt.status == 0x1) {
  //             royalty.status = 1;
  //             royalty.verified = true; //deploy failed
  //           }else {
  //             royalty.verified = false;
  //             royalty.status = 4;
  //           }
  //           var result = await Promise.all([royalty.save()]);
  //           var firstNotification;
  //           if (receipt.status == 0x1) {
  //             Email.add_royalty_partner(royalty);
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "add request royalty successed: "+receipt.transactionHash,
  //                     tr: "add request royalty successed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }else{
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "Sorry. add request royalty failed: "+receipt.transactionHash,
  //                     tr: "Sorry. add request royalty failed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }
  //           firstNotification.setFilters([
  //               // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
  //           ]);
  //
  //           myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
  //              if (err2) {
  //                  console.log('Something went wrong...');
  //              } else {
  //                  console.log(data);
  //              }
  //           });
  //       }
  //     };
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },


  // check_deploy_sign_royalty_partners: async function check_deploy_sign_royalty_partners(){
  //   try{
  //       var [arrayRoyalty] = await Promise.all([
  //         Royalty.find({
  //           $and:[
  //             {deployBlockHash: { "$ne": "" }},
  //             {deployBlockHash:{ $exists: true}},
  //             {deploySignBlockHash: { "$ne": "" }},
  //             {deployStatus: false},
  //             {status: 1}
  //           ]
  //         })]);
  //       for(var i =0; i < arrayRoyalty.length; i++){
  //         var royalty = arrayRoyalty[i];
  //         if(!royalty.deploySignBlockHash) continue;
  //         var receipt = web3.eth.getTransactionReceipt(royalty.deploySignBlockHash);
  //         if (receipt) {
  //           console.log(receipt);
  //           royalty.deployStatus = true;
  //           // royalty.deploySignBlockHash = receipt.transactionHash;
  //           if (receipt.status == 0x1) {
  //             royalty.status = 2;
  //             royalty.verified = true; //deploy failed
  //           }else {
  //             royalty.verified = false;
  //             royalty.status = 4;
  //           }
  //           var result = await Promise.all([royalty.save()]);
  //           var firstNotification;
  //           if (receipt.status == 0x1) {
  //             Email.accept_royalty_partner(royalty);
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "deploy sign royalty successed: "+receipt.transactionHash,
  //                     tr: "deploy sign royalty successed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }else{
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "Sorry. deploy sign royalty failed: "+receipt.transactionHash,
  //                     tr: "Sorry. deploy sign royalty failed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }
  //           firstNotification.setFilters([
  //               // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
  //           ]);
  //
  //           myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
  //              if (err2) {
  //                  console.log('Something went wrong...');
  //              } else {
  //                  console.log(data);
  //              }
  //           });
  //       }
  //     };
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },

  // check_deploy_unsign_royalty_partners: async function check_deploy_unsign_royalty_partners(){
  //   try{
  //       var [arrayRoyalty] = await Promise.all([
  //         Royalty.find({
  //           $and:[
  //             {deployBlockHash: { "$ne": "" }},
  //             {deployBlockHash:{ $exists: true}},
  //             {deployUnsignBlockHash: { "$ne": "" }},
  //             {deployStatus: false},
  //             {status: 1}
  //           ]
  //         })]);
  //       for(var i =0; i < arrayRoyalty.length; i++){
  //         var royalty = arrayRoyalty[i];
  //         if(!royalty.deployUnsignBlockHash) continue;
  //         var receipt = web3.eth.getTransactionReceipt(royalty.deployUnsignBlockHash);
  //         if (receipt) {
  //           console.log(receipt);
  //           royalty.deployStatus = true;
  //           // royalty.deployUnsignBlockHash = receipt.transactionHash;
  //           if (receipt.status == 0x1) {
  //             royalty.status = 3;
  //             royalty.verified = true; //deploy failed
  //           }else {
  //             royalty.status = 4;
  //             royalty.verified = false;
  //           }
  //           var result = await Promise.all([royalty.save()]);
  //           var firstNotification;
  //           if (receipt.status == 0x1) {
  //             Email.deny_royalty_partner(royalty);
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "deploy unsign royalty successed: "+receipt.transactionHash,
  //                     tr: "deploy unsign royalty successed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }else{
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "Sorry. deploy unsign royalty failed: "+receipt.transactionHash,
  //                     tr: "Sorry. deploy unsign royalty failed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }
  //           firstNotification.setFilters([
  //               // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
  //           ]);
  //
  //           myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
  //              if (err2) {
  //                  console.log('Something went wrong...');
  //              } else {
  //                  console.log(data);
  //              }
  //           });
  //       }
  //     };
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },

  // check_deploy_add_license: async function check_deploy_add_license(){
  //   try{
  //       var [arrayLicense] = await Promise.all([
  //         Order.find({
  //           $and:[
  //             {licenseBlockHash: { "$ne": "" }},
  //             {licenseBlockHash:{ $exists: true}},
  //             {licenseDeployStatus: false},
  //             {status: 0}
  //           ]}).populate('orderSellerRefer').exec()
  //         ]);
  //       for(var i =0; i < arrayLicense.length; i++){
  //         var order = arrayLicense[i];
  //         if(!order.licenseBlockHash) continue;
  //         var receipt = web3.eth.getTransactionReceipt(order.licenseBlockHash);
  //         if (receipt) {
  //           console.log(receipt);
  //           order.licenseAddress = receipt.contractAddress;
  //           order.licenseDeployStatus = true;
  //           order.status = 1;
  //           if (receipt.status == 0x0) {
  //               order.status = 3; // deploy failed
  //           }
  //           var [result] = await Promise.all([order.save()]);
  //           var [song] = await Promise.all([
  //               Song.findOne({songContractAddress: order.songAddress}).exec()
  //           ]);
  //           if(!song){
  //             return;
  //           }
  //           var firstNotification;
  //           if (receipt.status == 0x1) {
  //             Email.send_initial_license(order.orderSellerRefer,order.orderBuyerRefer, song, order, receipt.contractAddress);
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "License deploy successed: "+receipt.transactionHash,
  //                     tr: "License deploy successed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }else{
  //             firstNotification = new OneSignal.Notification({
  //                 contents: {
  //                     en: "Sorry. License deploy failed: "+receipt.transactionHash,
  //                     tr: "Sorry. License deploy failed: "+receipt.transactionHash,
  //                 }
  //             });
  //           }
  //           firstNotification.setFilters([
  //               // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
  //           ]);
  //
  //           myClient.sendNotification(firstNotification, function (err3, httpResponse,data) {
  //              if (err3) {
  //                  console.log('Something went wrong...');
  //              } else {
  //                  console.log(data);
  //              }
  //           });
  //       }
  //     };
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },

  // update_price_for_license: async function update_price_for_license(){
  //   try{
  //     var [arrayLicense] = await Promise.all([
  //     Order.find({
  //       $and:[
  //         {licenseUpdatePriceBlockHash: { "$ne": "" }},
  //         {licenseUpdatePriceBlockHash:{ $exists: true}},
  //         {licenseDeployStatus: false},
  //         {status: 1}
  //       ]}).populate('orderBuyerRefer').exec()
  //     ]);
  //     for(var i =0; i < arrayLicense.length; i++){
  //       var order = arrayLicense[i];
  //       if(!order.licenseUpdatePriceBlockHash) continue;
  //       var receipt = web3.eth.getTransactionReceipt(order.licenseUpdatePriceBlockHash);
  //       if (receipt) {
  //         console.log(receipt);
  //         order.licenseDeployStatus = true;
  //         if(order.amount == 0){
  //           order.status = 4;
  //         }else{
  //           order.status = 2;
  //         }
  //         if (receipt.status == 0x0) {
  //             order.status = 3; // deploy failed
  //         }
  //         var [result] = await Promise.all([order.save()]);
  //         var [song] = await Promise.all([
  //             Song.findOne({songContractAddress: order.songAddress}).exec()
  //         ]);
  //         if(!song){
  //           return;
  //         }
  //         var firstNotification;
  //         if (receipt.status == 0x1) {
  //           Email.send_accept_license(order.orderBuyerRefer, order.orderSellerRefer, order);
  //           firstNotification = new OneSignal.Notification({
  //               contents: {
  //                   en: "License accept deploy successed: "+receipt.transactionHash,
  //                   tr: "License accept deploy successed: "+receipt.transactionHash,
  //               }
  //           });
  //         }else{
  //           firstNotification = new OneSignal.Notification({
  //               contents: {
  //                   en: "Sorry. License accept deploy failed: "+receipt.transactionHash,
  //                   tr: "Sorry. License accept deploy failed: "+receipt.transactionHash,
  //               }
  //           });
  //         }
  //         firstNotification.setFilters([
  //             // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
  //         ]);
  //
  //         myClient.sendNotification(firstNotification, function (err2, httpResponse,data) {
  //            if (err2) {
  //                console.log('Something went wrong...');
  //            } else {
  //                console.log(data);
  //            }
  //         });
  //       }
  //     }
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // },

  // fund_for_license: async function fund_for_license(){
  //   try{
  //     var [arrayLicense] = await Promise.all([
  //     Order.find({
  //       $and:[
  //         {licensePayBlockHash: { "$ne": "" }},
  //         {licensePayBlockHash:{ $exists: true}},
  //         {licenseDeployStatus: false},
  //         {status: 2}
  //       ]}).populate('orderSellerRefer').exec()
  //     ]);
  //     for(var i =0; i < arrayLicense.length; i++){
  //       var order = arrayLicense[i];
  //       if(!order.licenseBlockHash) continue;
  //       var receipt = web3.eth.getTransactionReceipt(order.licensePayBlockHash);
  //       if (receipt) {
  //         console.log(receipt);
  //         order.licenseDeployStatus = true;
  //         order.status = 4;
  //         if (receipt.status == 0x0) {
  //             order.status = 3; // deploy failed
  //         }
  //         var [result] = await Promise.all([order.save()]);
  //         var [song] = await Promise.all([
  //             Song.findOne({songContractAddress: order.songAddress}).exec()
  //         ]);
  //         if(!song){
  //           return;
  //         }
  //         var firstNotification;
  //         if (receipt.status == 0x1) {
  //           Email.send_fund_license(order.orderSellerRefer.userEmail, song, order);
  //           firstNotification = new OneSignal.Notification({
  //               contents: {
  //                   en: "License payment deploy successed: "+receipt.transactionHash,
  //                   tr: "License payment deploy successed: "+receipt.transactionHash,
  //               }
  //           });
  //         }else{
  //           firstNotification = new OneSignal.Notification({
  //               contents: {
  //                   en: "Sorry. License payment deploy failed: "+receipt.transactionHash,
  //                   tr: "Sorry. License payment deploy failed: "+receipt.transactionHash,
  //               }
  //           });
  //         }
  //         firstNotification.setFilters([
  //             // {"field": "tag", "key": "USER_ID", "relation": "=", "value": job.data.user_id},
  //         ]);
  //
  //         myClient.sendNotification(firstNotification, function (err3, httpResponse,data) {
  //            if (err3) {
  //                console.log('Something went wrong...');
  //            } else {
  //                console.log(data);
  //            }
  //         });
  //       }
  //     }
  //   }catch(ex){
  //       console.log(ex);
  //   }
  // }

    //generate qrcode for song
    generate_qrcode_asyn: async function generate_qrcode_asyn() {
        var [songNeedtoBeGenerateQrcode] = await Promise.all([
            Song.find({
                $and:[
                    {songContractAddress: { "$ne": "" }},
                    {
                        $or: [
                            {qrcodeImage: ""},
                            {qrcodeImage: {$exists: false}},
                        ]
                    }
                ]
            }),
        ]);

        songNeedtoBeGenerateQrcode.forEach(async (qrcode) => {
            let qr_svg = QRCode.image(qrcode.songContractAddress, {type: 'png'});
            var mainPath = path.join(__dirname, '../public/qrcode/');
            let dir = mainPath + qrcode.songContractAddress;
            if(!fs.existsSync(mainPath)){
                fs.mkdirSync(mainPath);
            }
            if(!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            qr_svg.pipe(fs.createWriteStream(dir + '/' + qrcode._id + '.png'));
            qrcode.qrcodeImage = 'qrcode/' + qrcode.songContractAddress + '/' + qrcode._id + '.png';
            let[newDoc] = await Promise.all([
                qrcode.save()
            ]);
        })
    },

    //generate qrcode for wallet
    generate_wallet_asyn: async function generate_wallet_asyn() {
        var [WalletNeedtoBeGenerateQrcode] = await Promise.all([
            User.find({
                $or: [
                    {qrcodeImage: ""},
                    {qrcodeImage: {$exists: false}},
                ]
            }),
        ]);

        WalletNeedtoBeGenerateQrcode.forEach(async (qrcode) => {
            let qr_svg = QRCode.image(qrcode.userWalletAddress, {type: 'png'});
            var mainPath = path.join(__dirname, '../public/wallet/');
            let dir = mainPath;
            if(!fs.existsSync(mainPath)){
                fs.mkdirSync(mainPath);
            }
            if(!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            qr_svg.pipe(fs.createWriteStream(dir + '/' + qrcode.userWalletAddress + '.png'));
            qrcode.qrcodeImage = '/' + 'wallet/' + qrcode.userWalletAddress + '.png';
            let[newDoc] = await Promise.all([
                qrcode.save()
            ]);
        })
    }
};






