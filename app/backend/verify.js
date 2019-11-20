var User        = require('../models/user');
var Song        = require('../models/song');
var Royalty        = require('../models/royalty');
var Composer    = require('../models/composer');
var MerkleTools = require('merkle-tools');
var Order       = require('../models/order');
const BlockChain = require('./blockchain');
var Promise = require('promise');
const _                     = require('lodash');
const Web3                  = require('web3');
const Config = require('../../config/config');
var SmartContract      = require('../models/smartcontract');
var web3 = new Web3(new Web3.providers.HttpProvider(Config.MainNet));
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

module.exports = function(app, passport) {
    app.get('/verification-and-authentication', async function(req, res){
        var key = req.param('key');
        if(key == undefined || key.length == 0){
            var _id = req.param('id') ? req.param('id') : '';
            var type = req.param('type') ?  req.param('type') : 'song';

            var hash = '';
            if (type != 'work' && _id != undefined && _id.length > 0) {
                var [work] = await Promise.all([
                    Composer.findOne({_id: _id}).exec()
                ]);
                if (work) {
                    hash = work.composerHashOfSong;
                }
            }else if(_id != undefined && _id.length > 0){
                var [song] = await Promise.all([
                    Song.findOne({_id: _id}).exec()
                ]);
                if (song) {
                    hash = song.songHash;
                }
            }

            res.render('verify/verification_authentication', {
                url: process.env.NETWORK_TRANSACTION,
                session: req.session,
                verify_id: _id,
                hashOfSong: hash,
                type: type,
                menu_index: 'verify-authen'
            });
        }else {
            res.redirect('/my-songs?key=' + key + '&type=song');
        }
        
    });

    app.get('/verification', async function(req, res) {
        const _id = req.param('id') ? req.param('id') : '';
        const type = req.param('type') ?  req.param('type') : 'song';
        var address = '';
        var hashOfSong = '';

        if (_id != undefined && _id.length > 0) {
            if (type == 'song') {
                const [song] = await Promise.all([
                    Song.findOne({_id: _id}).exec()
                ]);

                if (song) {
                    address = song.songContractAddress;
                    hashOfSong = song.songHash;
                }
            }else{
                var [work] = await Promise.all([
                    Composer.findOne({_id: _id}).exec()
                ]);
                if (work) {
                    address = work.composerContractAddress;
                    hashOfSong = work.composerHashOfSong;
                }
            }
        }
        res.render('verify/verification', {
            url: process.env.NETWORK_TRANSACTION,
            hashOfSong: hashOfSong,
            address: address
        });
    });

    app.get('/authentication', function(req, res) {
        var hash = req.param('hash') ? req.param('hash') : '';
        var merkleRoot = req.param('root') ? req.param('root') : '';
        var signature = req.param('signature') ? req.param('signature') : '';
        var role = req.param('role') ? req.param('role') : '';

        res.render('verify/authentication', {
            url: process.env.NETWORK_TRANSACTION,
            hash: hash,
            merkleRoot: merkleRoot,
            signature: signature,
            role: role
        });
    });

    app.get('/verification-result', function(req, res) {
        var address = req.param('address') ? req.param('address') : '';
        var songTitle = req.param('title') ? req.param('title') : '';
        var signature = req.param('signature') ? req.param('signature') : '';
        var hash = req.param('hash') ? req.param('hash') : '';
        var merkle = req.param('merkle') ?  req.param('merkle') : '';
        var role = req.param('role') ? req.param('role') : '';
        var type = req.param('type') ? req.param('type') : '';

        res.render('verify/verification_result', {
            url: process.env.NETWORK_TRANSACTION,
            address: address,
            title: songTitle,
            signature: signature,
            hash: hash,
            merkle: merkle,
            role: role,
            type: type
        });
    });

    app.get('/authentication-result', async function(req, res) {
        var signature = req.param('signature') ? req.param('signature') : '';
        var hash = req.param('hash') ? req.param('hash') : '';
        var merkleRoot = req.param('root') ? req.param('root') : '';
        var role = req.param('role') ? req.param('role') : '';
        var status = req.param('status') ? req.param('status') : 0;
        if (signature.startsWith('0x')) {
            signature = signature.substr(2);
        }

        var msg = 'This information is correct';
        var error = 0;
        if (status != 'true') {
            msg = 'This information is not correct';
            error = 1;
        }else{
            var songs;
            if (merkleRoot != undefined && merkleRoot.length > 0) {
                [songs] = await Promise.all([
                    Song.find({songMerkleRoot: merkleRoot}).exec()
                ]);
            }else{
                [songs] = await Promise.all([
                    Song.find({
                        $and: [
                            {songHash: hash}
                        ]
                    }).exec()
                ]);
            }

            if (!songs || songs.length == 0) {
                if (merkleRoot != undefined && merkleRoot.length > 0) {
                    msg = 'Not found merkle root';
                }else{
                    msg = 'Not found song registration';
                }
                error = 1;
            }else{
                if (merkleRoot != undefined && merkleRoot.length > 0) {
                    var arrayHash=[];
                    songs.forEach(function (song) {
                        arrayHash.push(song.songHash);
                    });
                    var indexOfHash = arrayHash.indexOf(hash);
                    if (indexOfHash < 0) {
                        msg = 'Hash does not match';
                        error = 1;
                    }else{
                        var dataInput = arrayHash.map(x => new Buffer(x, 'hex'));
                        var merkleTools = new MerkleTools()
                        merkleTools.addLeaves(dataInput);
                        merkleTools.makeTree();
                        console.log('Root: ' + merkleRoot);
                        console.log('Root tool: ' + merkleTools.getMerkleRoot().toString('hex'));
                        if(merkleRoot != merkleTools.getMerkleRoot().toString('hex')){
                            msg = 'Invalid merkle root';
                            error = 1;
                        }else{
                            msg = 'This information is correct';
                            error = 0;
                        }
                    }
                }else{
                    if (songs[0].songDigitalSignature != signature || songs[0].songOwnerContractAddress != role) {
                        msg = 'This information is not correct';
                        error = 1;
                    }else{
                        msg = 'This information is correct';
                        error = 0;
                    }

                }
            }
        }

        res.render('verify/authentication_result', {
            url: process.env.NETWORK_TRANSACTION,
            signature: signature,
            hash: hash,
            merkleRoot: merkleRoot,
            role: role,
            error: error,
            msg: msg
        });
    });

    app.post('/verification', async function(req, res) {
        var data = req.body;
        if (data == undefined || data.length == 0) {
            return res.json(200, {error: 1, msg: 'Bad Request'});
        }
        var contractAddress = data.address;
        if (contractAddress == undefined || contractAddress.length == 0) {
            return res.json(200, {error: 1, msg: 'Bad Request'});
        }

        var [song] = await Promise.all([
            Song.findOne({songContractAddress: contractAddress})
        ]);
        if(song) {
            const algodclient = new algosdk.Algod(token, baseServer, port);
            let tx = (await algodclient.transactionById(contractAddress));
            if(tx) {
                let encodednote = algosdk.decodeObj(tx.note);
                return res.json(200, {error: 0, transation: tx, data: encodednote});
            }else{
                return res.json(200, {error: 1, msg: 'Sorry! The information not found'});
            }
            // var [smartContract] = await Promise.all([
            //     SmartContract.findOne({_id: song.songSmartContractVersion})
            // ]);
            // console.log(smartContract);
            // if(smartContract) {
            //     var Sol_BaseRegistrationABI = Config.Sol_BaseRegistrationABI;
            //     var Sol_BaseRegistrationData = Config.Sol_BaseRegistrationData;
            //     var smartContract = song.songContractVersion;
            //     if (smartContract) {
            //         Sol_BaseRegistrationABI = JSON.parse(smartContract.Sol_BaseRegistrationABI);
            //         Sol_BaseRegistrationData = JSON.parse(smartContract.Sol_BaseRegistrationData)
            //     }
            //
            //     const baseRegistrationContract = web3.eth.contract(Sol_BaseRegistrationABI);
            //     const baseRegistration = baseRegistrationContract.at(contractAddress);
            //     baseRegistration.getRegistration.call({from: Config.accountDefault}, (err, value) => {
            //         console.log(value);
            //         if (err || !value) {
            //             return res.json(200, {error: 1, msg: 'Sorry! The information not found'});
            //         }
            //         return res.json(200, {error: 0, value: value});
            //     });
            // }else{
                // var Sol_BaseRegistrationABI = Config.Sol_BaseRegistrationABI;
                // var Sol_BaseRegistrationData = Config.Sol_BaseRegistrationData;
                // var [smartContract] = await Promise.all([
                //     SmartContract.findOne({status: true})
                // ]);
                // if (smartContract) {
                //     Sol_BaseRegistrationABI = JSON.parse(smartContract.Sol_BaseRegistrationABI);
                //     Sol_BaseRegistrationData = JSON.parse(smartContract.Sol_BaseRegistrationData)
                // }
                //
                // const baseRegistrationContract = web3.eth.contract(Sol_BaseRegistrationABI);
                // const baseRegistration = baseRegistrationContract.at(contractAddress);
                // baseRegistration.getRegistration.call({from: Config.accountDefault}, (err, value) => {
                //     console.log(value);
                //     if (err || !value) {
                //         return res.json(200, {error: 1, msg: 'Sorry! The information not found'});
                //     }
                //     return res.json(200, {error: 0, value: value});
                // });
            // }
        }else{
            return res.json(200, {error: 1, msg: 'Sorry! The information not found'});
        }
    });

    app.post('/authentication', async function(req, res) {
        var data = req.body;
        console.log(data);

        if (data == undefined || data.length == 0) {
            return res.json(200, {error: 1, msg: 'Bad Request'});
        }

        const ownerOfSong = data.owner_of_song;
        const hash = data.hash;
        const signature = data.signature;

        if (ownerOfSong == undefined || ownerOfSong.length == 0 || hash == undefined || hash.length == 0 || signature == undefined || signature.length == 0) {
            return res.json(200, {error: 1, msg: 'Bad Request'});
        }
        return res.json(200, {error: 0, value: algosdk.verifyBytes(hash, Buffer.from(signature, 'hex'), ownerOfSong)});
        // const r = signature.substr(0, 66);
        // const s = "0x" + signature.substr(66, 64);
        // const v = "0x" + signature.substr(130, 2);
        //
        // var Sol_BaseRegistrationABI = Config.Sol_BaseRegistrationABI;
        // var baseRegDefaultAddress = Config.baseRegDefaultAddress;
        // var [smartContract] = await Promise.all([
        //     SmartContract.findOne({status:true})
        // ]);
        // if(smartContract){
        //     Sol_BaseRegistrationABI = JSON.parse(smartContract.Sol_BaseRegistrationABI);
        //     baseRegDefaultAddress = JSON.parse(smartContract.baseRegDefaultAddress)
        // }
        //
        // const baseRegistrationContract = web3.eth.contract(Sol_BaseRegistrationABI);
        // const baseRegistration = baseRegistrationContract.at(baseRegDefaultAddress);
        // baseRegistration.verifyDigitalSignatureOfSong.call(ownerOfSong, hash, r, s, v, {from: Config.accountDefault}, (err, value) => {
        //     console.log(value);
        //     if (value == undefined) {
        //         value = 0;
        //     }
        //     return res.json(200, {error: 0, value: value});
        // });
    });

    app.get('/certificate', async function(req, res){
        var _id = req.param('id');
        if (_id == undefined || _id.length == 0) {
            res.redirect('/');
            return;
        }
        var [song] = await Promise.all([
            Song.findOne({_id: _id}).populate('songArtistRefer').populate('songUserRefer').exec(),
        ]);

        if (!song) {
            res.redirect('/');
            return;
        }

        var [transactions] = await Promise.all([
            Order.find({songAddress: song.songContractAddress})
        ]);

        var [royalties] = await Promise.all([
            Royalty.find({
                $and:[
                    {songId: song._id},
                    {status: 2},
                ]
            }).populate('partnerUserRefer')
        ]);

        //calculate percentage of owner
        var ownerTotalPercent = 100;
        var sumaryOtherPercent = 0;

        royalties.forEach(function (owner) {
            sumaryOtherPercent += owner.percentAfter
        });        
        ownerTotalPercent -= sumaryOtherPercent;

        res.render('verify/certificate_song', {
            url: process.env.NETWORK_TRANSACTION,
            session: req.session,
            transactions: transactions,
            song: song,
            ownerTotalPercent: ownerTotalPercent,
            royalties: royalties,
            menu_index: 'verify-authen'
        });
    });

    app.get('/certificate-song', async function(req, res){
        var _id = req.param('id');
        if (_id == undefined || _id.length == 0) {
            res.redirect('/');
            return;
        }
        var [song] = await Promise.all([
            Song.findOne({_id: _id}).populate('songArtistRefer').populate('songUserRefer').exec(),
        ]);

        if (!song) {
            res.redirect('/');
            return;
        }

        var [transactions] = await Promise.all([
            Order.find({songAddress: song.songContractAddress})
        ]);

        var [royalties] = await Promise.all([
            Royalty.find({
                $and:[
                    {songId: song._id},
                    {status: 2},
                ]
            }).populate('partnerUserRefer')
        ]);

        //calculate percentage of owner
        var ownerTotalPercent = 100;
        var sumaryOtherPercent = 0;

        royalties.forEach(function (owner) {
            sumaryOtherPercent += owner.percentAfter
        });     
        ownerTotalPercent -= sumaryOtherPercent;

        res.render('verify/certificate_song', {
            url: process.env.NETWORK_TRANSACTION,
            session: req.session,
            transactions: transactions,
            song: song,
            ownerTotalPercent: ownerTotalPercent,
            royalties: royalties,
            menu_index: 'verify-authen'
        });
    });

    app.get('/certificate-work', async function(req, res) {
        var _id = req.param('id');
        if (_id == undefined || _id.length == 0) {
            res.redirect('/');
            return;
        }
        var [work] = await Promise.all([
            Composer.findOne({_id: _id}).populate('songArtistRefer').exec()
        ]);

        if (!work) {
            res.redirect('/');
            return;
        }

        var [transactions] = await Promise.all([
            Order.find({songAddress: work.composerContractAddress})
        ]);

        res.render('verify/certificate_work', {
            url: process.env.NETWORK_TRANSACTION,
            session: req.session,
            transactions: transactions,
            work: work,
            menu_index: 'verify-authen'
        });
    });
}