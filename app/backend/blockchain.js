const _ 					= require('lodash');
const ethWallet 			= require('ethereumjs-wallet');
const ethUtil 				= require('ethereumjs-util');
const Tx 					= require('ethereumjs-tx');
const SolFunction 			= require('web3/lib/web3/function');
const Web3 					= require('web3');
const SmartContract 		= require('../models/smartcontract');
var Promise = require('promise');
const Config = require('../../config/config');
var web3 = new Web3(new Web3.providers.HttpProvider(Config.LinkTestNet));
var currentNonce = 0;

module.exports = {
	strToHash: (message) => {
		return web3.sha3(message);
	},

	ethCall: (contract, func, account, params) => {
		return contract.func.call(params, {from: account}, (err, value) => {
			return {error: err, value: value};
		});
	},

	ethSignMessage: (private_key, message) => {
		const msg = web3.sha3(message);
		const wallet = ethWallet.fromPrivateKey(Buffer.from(private_key, 'hex'));
		const signed = ethUtil.ecsign(ethUtil.toBuffer(msg), wallet.getPrivateKey());
		var combined = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]);
    	var combinedHex = combined.toString('hex');
    	return combinedHex;
	},

	ethRawTx: (type, data, from, to) => {
		const wallet = ethWallet.fromPrivateKey(Buffer.from(Config.SignKeyDefault, 'hex'));
		const gasPrice = web3.toWei(Config.gasDeploy, Config.gasUnit);
	    const gasPriceHex = web3.toHex(gasPrice);
	    var gasLimitHex;
	    if (type == 'contract') {
	    	gasLimitHex = web3.toHex(Config.gasLimitContract);
	    }else{
	    	gasLimitHex = web3.toHex(Config.gasLimitFunction);
	    }

	    var nonce = web3.eth.getTransactionCount(Config.accountDefault, 'pending');
	    if (currentNonce != 0 && nonce == currentNonce) {
	    	nonce++;
	    }

	    console.log('Current Nonce: ' + currentNonce + ' Nonce: ' + nonce);

	    currentNonce = nonce;
	    var nonceHex = web3.toHex(nonce);

	    var rawTx = {
	      	nonce: nonceHex,
	      	gasPrice: gasPriceHex,
	      	gasLimit: gasLimitHex,
	      	data: data,
	      	from: Config.accountDefault,
	    };
	    if (to != undefined && to.length != 0) {
	    	rawTx.to = to;
	    }
	    var tx = new Tx(rawTx);
	    tx.sign(Buffer(wallet.getPrivateKey(), 'hex'));
	    var serialized = tx.serialize();

	    return serialized;
	},

	ethSendRawTransaction: (serialized, callback) => {
		web3.eth.sendRawTransaction('0x' + serialized.toString('hex'), (err, hash) => {
			console.log(err, hash);
			callback(err, hash);
		});
	},
};
