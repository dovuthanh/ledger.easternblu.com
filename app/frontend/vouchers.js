const _ = require('lodash');
var Web3 = require('web3');
var ethWallet = require('ethereumjs-wallet');
var ethUtil = require('ethereumjs-util');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

window.Voucher = {
	vouchers_register_account: function vouchers_register_account(){
		var email = document.getElementById('email').value;
		var password = document.getElementById('password').value;
		var confirm_password = document.getElementById('confirm_password').value;

		if (!App.validateEmail(email)) {
			alert('Email invalid');
			return;
		}
		if (password != confirm_password) {
			alert('Password does not match');
			return;
		}
		if (password.length < 6 || password.length > 32) {
			alert('Password length is 6-32 characters.');
			return;
		}

		$.post('/vouchers/register', {
			email: email,
			password: password
		}, function(data){
			if (data.status == 200) {
        		window.location.href = '/vouchers/sign-in';
		    }else{
		        document.getElementById('message').style.display = 'block';
		        document.getElementById('message').innerHTML = data.message;
		        alert(data.message);
		    }
		});
	},

	vouchers_sign_in_for_user: function vouchers_sign_in_for_user(){
		var email = document.getElementById('user_email').value;
		var password = document.getElementById('user_password').value;

		if (!App.validateEmail(email)) {
			alert('Email invalid');
			return;
		}
		$.post('/vouchers/sign-in', {
			email: email,
			password: password,
			type: 'standard',
			browser: 'w'
		}, function(data){
			if (data.status == 200) {
		        window.location.href = '/vouchers/voucher-index';
		    }else{
		        alert(data.message);
		    }
		});
	},

	vouchers_sign_in_for_investor: function vouchers_sign_in_for_investor(){
		var role = document.getElementById('investor_role').value;
		var email = document.getElementById('investor_email').value;
		var password = document.getElementById('investor_password').value;

		if (!App.validateEmail(email)) {
			alert('Email invalid');
			return;
		}
		if (!role.startsWith('0x')) {
			alert('Account ID invalid');
			return;
		}

		$.post('/vouchers/sign-in', {
			role: role,
			email: email,
			type: 'investor',
			password: password,
			browser: 'w'
		}, function(data){
			if (data.status == 200) {
		        window.location.href = '/vouchers/mamagement-vouchers';
		    }else{
		        alert(data.message);
		    }
		});
	},

	vouchers_change_discount: function vouchers_change_discount(discount) {
		$.post('/vouchers/w/change-discount', {
			discount: discount
		}, (data) => {
			alert(data.message);
		});
	},

	vouchers_request_vouchers: function vouchers_request_vouchers() {
		var role = document.getElementById('role').value;
		var privateKey = document.getElementById('private_key').value;

		var vouchers = [];
		var totalToken = 0;

		var types = document.getElementsByName('type_voucher');
		var amounts = document.getElementsByName('amount_voucher');
		var quantities = document.getElementsByName('quantity_voucher');

		for (var i = 0; i < types.length; i++) {
			var type = types[i].options[types[i].selectedIndex].value;
			var amount = amounts[i].options[amounts[i].selectedIndex].value;
			var quantity = quantities[i].value;
			if (type.length == 0 || amount.length == 0 || quantity.length == 0) {
	          alert('Please enter vouchers correct');
	          return;
	        }
	        totalToken += amount * quantity;
	        var voucher = {
	        	type: type,
	        	amount: amount,
	        	quantity: quantity
	        };
	        vouchers.push(voucher);
		}

		console.log(vouchers);

		if (role.length != 0 && privateKey.length == 64) {
	      	var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
	      	console.log(myWallet);
	      	var walletAddress = myWallet.getAddressString();
	      	if (walletAddress == role) {
	      		var msg = web3.sha3('REQUESTVOUCHER');
	      		var signed = ethUtil.ecsign(ethUtil.toBuffer(msg), myWallet.getPrivateKey());
			    var combined = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]);
			    var combinedHex = combined.toString('hex');
	        	$.post('/vouchers/w/request-vouchers', {
	        		signature: combinedHex,
	        		token_quantity: totalToken,
	        		vouchers: vouchers
	        	}, (data) => {
	        		console.log(data);
	        	});
	      	} else {
	        	alert('Your private key does not match');
	      	}
	    } else {
	      	alert('Your private key does not match');
	    }
	},

  vouchers_get_balances: function vouchers_get_balances(id) {
    $.get('/vouchers/w/investor-balances?id=' + id, (data) => {
      	document.getElementById('eth_balance').innerHTML = data.data.ETH + ' ETH';
      	document.getElementById('sp8_balance').innerHTML = data.data.SP8 + ' SP8';
    });
  },

  vouchers_add_to_shop_cart: function vouchers_add_to_shop_cart(id) {
  	$.get('/vouchers/add-to-shop-cart/' + id, (data) => {
  		if (data.error == 0) {
  			window.location.reload();
  		}else{
  			alert(data.msg);
  		}
  	});
  },

  vouchers_remove_from_shop_cart: function vouchers_remove_from_shop_cart(id) {
  	$.get('/vouchers/remove-from-shop-cart/' + id, (data) => {
  		if (data.error == 0) {
  			window.location.reload();
  		}else{
  			alert(data.msg);
  		}
  	});
  },

  vouchers_validate_active: function vouchers_validate_active(callback) {
  	var checkList = document.getElementsByName('checkbox-item');
	var voucherIDs = [];
	checkList.forEach((e) => {
		if (e.checked) {
			console.log(e.value);
			voucherIDs.push(e.value);
		}
	});

	console.log(voucherIDs);
	if (voucherIDs.length == 0) {
		alert('Please choose vouchers to bought');
		return;
	}
	$.post('/vouchers/vouchers-validate-active',{
		ids: voucherIDs
	}, (data) => {
		if (data.error == 1) {
			alert(data.msg);
		}else if(data.error == 2) {
			window.location.href = '/vouchers/sign-in';
		}else{
			// show dialog stripe here
			console.log(data);
			callback(data.allowance);
		}
	});
  },

  voucher_charge: function voucher_charge(token, ids, total) {
  	$.post('/vouchers/w/charge', {
  		stripeToken: token,
  		amount: total,
  		ids: ids
  	}, (data) => {
  		console.log(data);
  	});
  }
};
