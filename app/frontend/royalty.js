const _ = require('lodash');
const multiHash = require("multi-hash");
const ipfsDag = require("ipfs-dag");
var Web3 = require('web3');
var ethWallet = require('ethereumjs-wallet');
var ethUtil = require('ethereumjs-util');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

//upload song


window.Royalty = {

  checking_voucher_if_any: function checking_voucher_if_any(callback) {
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
          Royalty.royalty_process();
        }
      });
    }else{
      if (priceOf > 0) {
        callback(priceOf*100);
      }else{
        $('.load').html('Processing...');
        $('#loading').show();
        Royalty.royalty_process();
      }
    }
  },

  regis_charge: function regis_charge(token, price) {
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
      Royalty.royalty_process();
    });
  },

  royalty_process: function royalty_save() {
    var privateKey = document.getElementById('private_key').value;
    var role = document.getElementById('role').value;
    if (role.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      console.log(myWallet);
      var walletAddress = myWallet.getAddressString();
      if (walletAddress == role) {
        Royalty.save_royalty_server();
      } else {
        alert('Your private key does not match');
        return;
      }
    } else {
      alert('Your private key does not match');
      return;
    }
  },

  //save song to db
  save_royalty_server: function save_royalty_server() {
    const royaltyAddress = document.getElementById('account_id').value;
    const royaltyPercent = document.getElementById('royalty_percent').value;
    const songAddress=  document.getElementById('song_contract_address').value;

    $.post('/save-royalty-partner', {
      royalty_address: royaltyAddress,
      royalty_percent: parseInt(royaltyPercent),
      song_address: songAddress
    }, function () {
      $('#loading').hide();
      window.location.href = "/my-songs";
    });
  },

  royalty_confirmed: function royalty_confirmed(royalty_id, privateKey) {
    // var privateKey = document.getElementById('private_key').value;
    var role = document.getElementById('role').value;

    if (role.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      console.log(myWallet);
      var walletAddress = myWallet.getAddressString();
      if (walletAddress == role) {
        Royalty.royalty_confirmed_deploy(royalty_id, privateKey);
      } else {
        alert('Your private key does not match');
        return;
      }
    } else {
      alert('Your private key does not match');
      return;
    }
  },

  royalty_rejected: function royalty_rejected(royalty_id, privateKey) {
    // var privateKey = document.getElementById('private_key').value;
    var role = document.getElementById('role').value;

    if (role.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      console.log(myWallet);
      var walletAddress = myWallet.getAddressString();
      if (walletAddress == role) {
        Royalty.royalty_rejected_deploy(royalty_id, privateKey);
      } else {
        alert('Your private key does not match');
        return;
      }
    } else {
      alert('Your private key does not match');
      return;
    }
  },

  royalty_confirmed_deploy: function royalty_confirmed_deploy(royalty_id, privateKey) {
    // const _id = document.getElementById('royalty_id').value;

    var msg = web3.sha3('ROYALTY-CONFIRMED');
    var wallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    var signed = ethUtil.ecsign(ethUtil.toBuffer(msg), wallet.getPrivateKey());
    var combined = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]);
    var combinedHex = '0x' + combined.toString('hex');

    $.post('/royalty-confirmed', {
      _id: royalty_id,
      signature: combinedHex
    }, function(data) {
      window.href = '/royalties';
    });
  },

  royalty_rejected_deploy: function royalty_rejected_deploy(royalty_id, privateKey) {
    // const _id = document.getElementById('royalty_id').value;

    var msg = web3.sha3('ROYALTY-REJECTED');
    var wallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    var signed = ethUtil.ecsign(ethUtil.toBuffer(msg), wallet.getPrivateKey());
    var combined = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]);
    var combinedHex = '0x' + combined.toString('hex');

    $.post('/royalty-rejected', {
      _id: royalty_id,
      signature: combinedHex
    }, function(data) {
      window.href = '/royalties';
    });
  }

}
