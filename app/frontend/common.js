const _ = require('lodash');
var Cookie = require('../backend/cookie-functions.js');
var cookie = Cookie.Cookie;
var Web3 = require('web3');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));
var account;

var SPXTokenAddress = '0x6321f5051b7ffedbd0f58f56f5b7dbfdb55e6413'; // link ropsten

var Sol_SPXTROSInterface = [ { "constant": false, "inputs": [ { "name": "spender", "type": "address" }, { "name": "tokens", "type": "uint256" } ], "name": "approve", "outputs": [ { "name": "success", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_recipient", "type": "address" }, { "name": "_voucherIDs", "type": "bytes32[]" } ], "name": "vouchers2Tokens", "outputs": [ { "name": "", "type": "bytes32[]" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_message", "type": "bytes32" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" }, { "name": "v", "type": "uint8" }, { "name": "_voucherIDs", "type": "bytes32[]" }, { "name": "_value", "type": "uint256[]" }, { "name": "_timeStarts", "type": "uint256[]" } ], "name": "tokens2Vouchers", "outputs": [ { "name": "", "type": "bytes32[]" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "name": "balance", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "buy", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": false, "inputs": [ { "name": "to", "type": "address" }, { "name": "tokens", "type": "uint256" } ], "name": "transfer", "outputs": [ { "name": "success", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_recipient", "type": "address" }, { "name": "_value", "type": "uint256" }, { "name": "_ratePerETH", "type": "uint256" } ], "name": "transferTokens", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "tokenOwner", "type": "address" }, { "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "name": "remaining", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "getExchangeRate", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "tokens", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "tokenOwner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "tokens", "type": "uint256" } ], "name": "Approval", "type": "event" } ];

window.App = {
	validateEmail: function validateEmail(email) {
	  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	  return re.test(email);
	},
	
	refreshBalance: function refreshBalance() {
	    try {
	      	setTimeout(function () {
		        App.refreshBalanceSPXToken(res => {
		          	cookie.setCookie("ETH-balance", res, 1);
		        });
		        App.refreshBalanceEther(res => {
		          	cookie.setCookie("ENC-balance", res, 1);
		        });
	      	}, 1000);
	    } catch (err) {
	      	console.log('fetch failed', err);
	    }
  	},

  	refreshBalanceEther: function refreshBalanceEther(callback) {
  		if(document.getElementById('accountaddress_session')==undefined) return;
  		account = document.getElementById('accountaddress_session').value;
    	if (account == undefined || account.length == 0) return;
    	web3.eth.getBalance(account, function (error, result) {
	      	if (!error) {
	        	var ether_balance = web3.fromWei(result, 'ether').valueOf();
	        	callback(ether_balance);
	      	} else {
	        	console.error(error);
	      	}
    	});
  	},

  	refreshBalanceSPXToken: function refreshBalanceSPXToken(callback) {
  		if(document.getElementById('accountaddress_session')==undefined) return;
  		account = document.getElementById('accountaddress_session').value;
    	if (account == undefined || account.length == 0) return;
    	var eSPXInterface = web3.eth.contract(Sol_SPXTROSInterface);
    	var eSPXI = eSPXInterface.at(SPXTokenAddress);
    	eSPXI.balanceOf.call(account, { from: account }, function (err, value) {
	      	if (value) {
	        	balance = value.valueOf();
		        if (balance != web3.fromWei(value, "ether").valueOf()) {
		          	balance = web3.fromWei(value, "wei").valueOf() / 10 ** 18;
		          	callback(balance);
		        }
	      	}
    	});
  	},
};

window.addEventListener('load', function () {
  	App.refreshBalance();
});
