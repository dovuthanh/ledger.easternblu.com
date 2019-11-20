const _ = require('lodash');
const multiHash = require("multi-hash");
const ipfsDag = require("ipfs-dag");
const validator = require("email-validator");

var Web3 = require('web3');
var ethWallet = require('ethereumjs-wallet');
var ethUtil = require('ethereumjs-util');
const SolFunction = require('web3/lib/web3/function');
const Tx = require('ethereumjs-tx');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

const SP8TokenSaleAddress = '0xaf95bada33542b8919cb57f62a00a690f730ddfd';
const SPX8TokenSale_ABI = [{"constant":false,"inputs":[{"name":"_recipient","type":"address"}],"name":"reFundETH","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"getOwnerAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"getTotalETHOfAddress","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"phasePublicSale1_From","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_recipient","type":"address"}],"name":"payTokensToAddress","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"cs","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"phasePresale_To","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"phasePublicSale1_To","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"phasePublicSale3_To","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"icoTokenSold","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"whom","type":"address"}],"name":"blockAccount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"phasePresale_From","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"many","type":"address[]"}],"name":"authoriseManyAccounts","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"phase","type":"uint8"},{"name":"_value","type":"uint256"}],"name":"calculateTokens","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_phase","type":"uint8"}],"name":"changePhaseTime","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"tokenPreSale","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_value","type":"uint256"}],"name":"eth2SPXToken","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCurrentICOPhase","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTokenSold","outputs":[{"name":"_tokens","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newCS","type":"address"}],"name":"setCS","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"buy","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"phasePublicSale3_From","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"ethFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"preSaleTokenSold","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"whom","type":"address"}],"name":"authoriseAccount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"minTokenCreationCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"hasEnd","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"investorCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"}],"name":"setEthFundDeposit","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"getTotalTokenOfAddress","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenPublicSale","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"phasePublicSale2_To","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"phasePublicSale2_From","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_token","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"}],"name":"OwnershipTransferred","type":"event"}];

window.WhiteList = {
	insert_email_to_white_list: function insert_email_to_white_list(callback){
		var email = document.getElementById("email").value;
		var wallet_address = document.getElementById("wallet_address").value;

		if (!validator.validate(email)) {
			callback(1, 'Email is invalid');
			return;
		}
		if (!ethUtil.isValidAddress(wallet_address)) {
			callback(1, 'Ethereum wallet address is invalid');
			return;
		}

		$.post( "/insert-whitelist", {
			firstname: '',
			lastname: '',
			email: email,
			wallet_address: wallet_address
		}, function( data ) {
		  	callback(data.error, data.msg);
		});
	},

	active_email: function active_email(item, callback){
		$.post("/active-item/"+item).done(function(data){
			callback(data.error, data.msg);
		});
	},

	disable_email: function disable_email(item, callback){
		$.post("/disable-item/"+item).done(function(data){
			callback(data.error, data.msg);
		});
	},

	validate_wallet: function validate_wallet(params, success, failure) {
		const {firstname, lastname, email, wallet} = params;
		if (!validator.validate(email)) {
			failure('Email is invalid');
			return;
		}
		if (!ethUtil.isValidAddress(wallet)) {
			failure('Ethereum wallet address is invalid');
			return;
		}
		$.post('/insert-whitelist', {
			firstname: firstname,
			lastname: lastname,
			email: email,
			wallet_address: wallet
		}, (data) => {
			if (data.error == 1) {
				failure(data.msg);
				return;
			}
			success(data.msg);
		});
	},

	authoriseMany: function authoriseMany(authorises) {
		var role = document.getElementById('role').value;
	    var privateKey = prompt('Enter your private key');
	    if (privateKey == null || privateKey.length == 0) {
	        alert('Please enter private key');
	        return;
	    }
	    if (authorises.length > 100) {
	    	alert('Maximum wallet address is 100');
	        return;
	    }
	    if (role.length != 0 && privateKey.length == 64) {
	        var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
	        console.log(myWallet);
	        var walletAddress = myWallet.getAddressString();
	        if (walletAddress == role) {
	          	WhiteList.save_white_list(privateKey, authorises);
	        } else {
	          	alert('Your private key does not match');
	        }
	    } else {
	        alert('Your private key does not match');
	    }
	    return;
	},

	save_white_list: async function save_white_list(privateKey, authorises) {
		var wallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
		const walletAddress = wallet.getAddressString();

		const solFunction = new SolFunction('', _.find(SPX8TokenSale_ABI, {name: 'authoriseManyAccounts'}), '');
		const payloadData = solFunction.toPayload([authorises]).data;

		const gasPrice = web3.toWei(1, 'gwei');
		const gasPriceHex = web3.toHex(gasPrice);
		const gasLimitHex = web3.toHex(47000000);

		const nonce = web3.eth.getTransactionCount(walletAddress);
		const nonceHex = web3.toHex(nonce);

		const rawTx = {
			nonce: nonceHex,
			gasPrice: gasPriceHex,
			gasLimit: gasLimitHex,
			data: payloadData,
			from: walletAddress,
			to: SP8TokenSaleAddress
		};

		var tx = new Tx(rawTx);
		tx.sign(Buffer.from(wallet.getPrivateKey(), 'hex'));
		const serialized = tx.serialize();

		web3.eth.sendRawTransaction('0x' + serialized.toString('hex'), (err, hash) => {
			console.log(err, hash);
			if (err || !hash) {
				alert('Error. Try again later');
				return;
			}
			$.post('/authorises-white-list', {
				hash: hash,
				authorises: authorises
			}, (data) => {
				if (data.error != 0) {
					alert(data.msg);
					return;
				}
				window.location.href = '/white-list';
			});
		});
	}
}
