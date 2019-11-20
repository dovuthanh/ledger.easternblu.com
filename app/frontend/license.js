const _ = require('lodash');
const multiHash = require("multi-hash");
const ipfsDag = require("ipfs-dag");
const ethWallet = require('ethereumjs-wallet');

//license
var license_song_id = '';
var license_song_address = '';
var license_buyer_address = '';
var license_owner_address = '';
var license_from = '';
var license_to = '';
var license_song_title = '';
var license_territories = '';
var license_right = '';
var license_peroid = '';
var license_hash = '';
var license_type = '';
var license_amount = '';

//update price
var transaction_address = '';
var transaction_price = '';
var song_address = '';

//fund
var owner_address = '';
var owner_contract = '';
var transaction_address_fund = '';
var amount = '';

window.License = {
	// create license
  validate_license: function validate_license() {
    license_song_id = document.getElementById('license_song_id').value;
    license_buyer_address = document.getElementById('buyer_address').value;
    license_owner_address = document.getElementById('owner_address').value;
    license_song_title = document.getElementById('song_title').value;
    license_song_address = document.getElementById('song_address').value;
    license_hash = document.getElementById('hash_of_song').value;
    license_from = document.getElementById('license_from').value;
    license_to = document.getElementById('license_to').value;
    license_type = document.getElementById('license_type').value;
    var right_select = document.getElementById('license_right');
    license_right = right_select.options[right_select.selectedIndex].value;
    var ter_select = document.getElementById('territories');
    license_territories = ter_select.options[ter_select.selectedIndex].value;
    license_peroid = document.getElementById('license_peroid').value;
    var privateKey = document.getElementById('private_key').value;

    if (license_buyer_address.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      var walletAddress = myWallet.getAddressString();
      if (walletAddress != license_buyer_address) {
        alert('Your private key does not match');
        return false;
      }
    } else {
      alert('Your private key does not match');
      return false;
    }
    if (license_buyer_address.length == 0 || license_owner_address.length == 0) {
      alert('Error! Try again later.');
      return false;
    }
    if (license_buyer_address == license_owner_address) {
      alert('You are owner of this song.');
      return false;
    }
    if (license_type == 0) {
      alert("Wrong type");
      return false;
    }
    if (license_territories == '') {
      alert("Please select territories");
      return false;
    }
    if (license_peroid == '') {
      alert("Invalid peroid");
      return false;
    }
    if (license_hash == '') {
      alert("Invalid hash of license");
      return false;
    }
    return true;
  },

  checking_voucher_if_any: function checking_voucher_if_any(func, callback) {
    var voucherCode = document.getElementById('voucher_code').value;
    var priceOf = document.getElementById('price_of').value.replace('$', '');
    var privateKey = document.getElementById('private_key').value;
    var role = document.getElementById('role').value;
    if (role.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      console.log(myWallet);
      var walletAddress = myWallet.getAddressString();
      if (walletAddress != role) {
        alert('Your private key does not match');
        return;
      }
    } else {
      alert('Your private key does not match');
      return;
    }

    if (voucherCode.length > 0) {
      $.post('/checking-voucher-code', {
        code: voucherCode
      }, (data) => {
        if (data.error != 0) {
          alert(data.msg);
          return;
        }
        const priceNeedToPay = (priceOf - data.amount) * 100;
        if (priceNeedToPay > 0) {
          callback(priceNeedToPay);
        }else{
          $('.load').html('Processing...');
          $('#loading').show();
          switch (func) {
            case 'licensing':
              License.upload_license();
              break;
            case 'accept':
              License.update_accept_license();
              break;
          }
        }
      });
    }else{
      if (priceOf > 0) {
        callback(priceOf*100);
      }else{
        $('.load').html('Processing...');
        $('#loading').show();
        switch (func) {
          case 'licensing':
            License.upload_license();
            break;
          case 'accept':
            License.update_accept_license();
            break;
        }
      }
    }
  },

  license_charge: function license_charge(func, token, price) {
    $.post('/regis-charge', {
      stripeToken: token,
      amount: price,
    }, (data) => {
      console.log(data);
      if (data.error != 0) {
        alert(data.msg);
        return;
      }
      $('.load').html('Processing...');
      $('#loading').show();
      switch (func) {
        case 'licensing':
          License.upload_license();
          break;
        case 'accept':
          License.update_accept_license();
          break;
        case 'payment':
          License.update_payment_license();
          break;
      }
    });
  },

  //save license to db
  upload_license: function upload_license() {
    $.post('/create-license', {
      license_song_id: license_song_id,
      license_from: license_from,
      license_to: license_to,
      license_song_title: license_song_title,
      license_ter: license_territories,
      license_right: license_right,
      license_peroid: license_peroid,
      license_song_address: license_song_address,
      license_owner_address: license_owner_address,
      license_buyer_address: license_buyer_address,
      license_hash: license_hash,
      license_type: license_type
    }, function (data) {
      if (data.error == 0) {
        $('#loading').hide();
        window.location.href = '/my-licensings';
      } else {
        alert(data.msg);
      }
    });
  },

  //validate accept license
  validate_accept_license: function validate_accept_license() {
    amount = document.getElementById('amount').value;
    var privateKey = document.getElementById('private_key').value;
    var role = document.getElementById('role').value;
    var songOwnerAddress = document.getElementById('song_owner_address').value;

    if (role.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      var walletAddress = myWallet.getAddressString();
      if (walletAddress != role) {
        alert('Your private key does not match');
        return false;
      }
    } else {
      alert('Your private key does not match');
      return false;
    }
    if (role != songOwnerAddress || songOwnerAddress.length == 0) {
      alert('You are not owner of this song');
      return false;
    }
    if (amount <= 0) {
      alert('Price invalid');
      return false;
    }
    return true;
  },

  //save amount to db
  update_accept_license: function update_accept_license() {
    var licenseAddress = document.getElementById('license_address').value;
    var methodSelect = document.getElementById('payment_method');
    var method = methodSelect.options[methodSelect.selectedIndex].value;

    $.post('/accept-license', {
      license_address: licenseAddress,
      amount: amount,
      method: method
    }, function (data) {
      if (data.error == 0) {
        $('#loading').hide();
        window.location.href = '/my-licensings';
      } else {
        alert('Error. Try again later');
      }
    });
  },

  //validate payment license
  validate_payment_license: function validate_payment_license() {
    owner_address = document.getElementById("song_owner_address").value;
    transaction_address_fund = document.getElementById("license_address").value;
    amount = document.getElementById("license_price").value;
    var privateKey = document.getElementById('private_key').value;
    var role = document.getElementById('role').value;
    if (role.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      var walletAddress = myWallet.getAddressString();
      if (walletAddress != role) {
        alert('Your private key does not match');
        return false;
      }
    } else {
      alert('Your private key does not match');
      return false;
    }
    if (transaction_address_fund.length < 0) {
      alert("Invalid address");
      return false;
    }
    if (amount <= 0) {
      alert("Invalid number");
      return false;
    }
    return true;
  },

  // save to db
  update_payment_license: function update_payment_license() {
    var licenseAddress = document.getElementById('license_address').value;
    $('.load').html('Processing...');
    $('#loading').show();
    $.post('/payment-license', {
      license_address: licenseAddress,
      owner_address: owner_address,
      transaction_address_fund: transaction_address_fund,
      amount: amount
    }, function (data) {
      if (data.error == 0) {
        $('#loading').hide();
        window.location.href = '/my-licensings';
      } else {
        alert('Error. Try again later.');
      }
    });
  }
}
