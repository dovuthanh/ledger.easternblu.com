const _ = require('lodash');
const multiHash = require("multi-hash");
const ipfsDag = require("ipfs-dag");
var Web3 = require('web3');
var ethWallet = require('ethereumjs-wallet');
var ethUtil = require('ethereumjs-util');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER));

window.Mass = {
	//upload mass multiple file
  	song_mass_upload: function song_mass_upload(file, success, failure) {
      if (!file) {
          alert('No input file found!');
          return;
      }
      var reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = function () {
          var buffer = Buffer.from(reader.result);
          // console.log(reader.result);
          var node1 = new ipfsDag.Node(buffer);
          var song_hash = node1.multihash;
          console.log(song_hash);
          $.post('/check_song_exist', {
            songHash: song_hash
          }, (data) => {
            if (data.error == 0) {
              success(song_hash);
              // var formData = new FormData();
              // formData.append('audiofile', file, file.name);
              // var ajax = new XMLHttpRequest();
              // ajax.upload.addEventListener('progress', progressHandler, false);
              // ajax.open('POST', '/song-file-upload', true);
              // ajax.send(formData);
            } else if (data.error == 2) {
                failure(data.msg);
            } else if (data.error == 3) {
                failure(data.msg);
            } else {
                failure(data.msg);
            }
          });
      };
    },

    checking_song: function checking_song(file, callback) {
      if (!file) {
          alert('No input file found!');
          return;
      }
      var reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = function () {
          var buffer = Buffer.from(reader.result);
          // console.log(reader.result);
          var node1 = new ipfsDag.Node(buffer);
          var song_hash = node1.multihash;
          console.log(song_hash);
          $.post('/checking-song', {
            songHash: song_hash
          }, (data) => {
            if (data.error == 0) {
              callback(true, data.song);
            }else{
              callback(false, {});
            }
          });
      };
    },

    save_song_mass: function save_song_mass(hash, cat, temp_url, title, artist, ext, size, callback) {
      var id = document.getElementById('user_id').value;
      if (hash == undefined || hash.length == 0) {
        callback(false, 'Hash not found');
        return;
      }
      $.post('/api/mass/save-song-mass', {
        _id: id,
        hash: hash,
        cat: cat,
        temp_url: temp_url,
        title: title,
        artist: artist,
        ext: ext,
        size: size
      }, (data) => {
        if (data.error != 0) {
          callback(false, data.msg);
        }else{
          callback(true, 'ok');
        }
      });
    },

    checking_voucher_if_any: function checking_voucher_if_any(callbacks){
      var voucherCode = document.getElementById('voucher_code').value;
      var priceOf = document.getElementById('price_of').value.replace('$', '');
      var privateKey = document.getElementById('private_key').value;
      var merkle_root = document.getElementById("merkle_root").value;
      if (merkle_root.length == 0) {
        alert('Merkle root cannot empty');
        return;
      }
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
            callbacks(priceNeedToPay);
          }else{
            $('.load').html('Processing...');
            $('#loading').show();
            Mass.save_mass_registration(privateKey);
          }
        });
      }else{
        if (priceOf > 0) {
          callbacks(priceOf*100);
        }else{
          $('.load').html('Processing...');
          $('#loading').show();
          Mass.save_mass_registration(privateKey);
        }
      }
    },

    validate_merkle_root: function validate_merkle_root() {
      var merkle_root = document.getElementById("merkle_root").value;
      if (merkle_root.length == 0) {
        alert('Merkle root cannot empty');
        return;
      }
      var role = document.getElementById('role').value;
      var privateKey = prompt('Enter your private key');
      if (privateKey == null || privateKey.length == 0) {
        alert('Please enter private key');
        return;
      }
      if (role.length != 0 && privateKey.length == 64) {
        var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
        console.log(myWallet);
        var walletAddress = myWallet.getAddressString();
        if (walletAddress == role) {
          var user_is_admin = document.getElementById('user_is_admin').value;
          if (user_is_admin == 'admin') {
            Mass.save_mass_registration(privateKey);
          }else{
            window.location.href = '/mass-registration';
          }
        } else {
          alert('Your private key does not match');
        }
      } else {
        alert('Your private key does not match');
      }
      return;
    },

    regis_charge: function regis_charge(token, price) {
      var privateKey = document.getElementById('private_key').value;

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
        Mass.save_mass_registration(privateKey);
      });
    },

    save_mass_registration: function save_mass_registration(privateKey) {
      var id = document.getElementById('user_id').value;
      var user_is_admin = document.getElementById('user_is_admin').value;
      var merkle_root = document.getElementById("merkle_root").value;
      var msg = web3.sha3(merkle_root);
      var wallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      var signed = ethUtil.ecsign(ethUtil.toBuffer(msg), wallet.getPrivateKey());
      var combined = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]);
      var combinedHex = combined.toString('hex');

      $('.load').html('Processing...');
      $('#loading').show();
      $.post('/api/mass/save-mass-registration', {
        _id: id,
        merkle_root: merkle_root,
        digital_signatures: combinedHex
      }, function(data){
        $('#loading').hide();
        if (data.error != 0) {
          alert(data.msg);
          return;
        }
        if (user_is_admin == 'admin') {
          Mass.admin_deploy_mass_registration(data._id);
        }else{
          Mass.deploy_mass_registration(data._id);
        }
      });
    },

    deploy_mass_registration: function deploy_mass_registration(id) {
      $('.load').html('Processing...');
      $('#loading').show();
      $.post('/api/mass/deploy-mass-registration', {
        id: id
      }, (data) => {
        $('#loading').hide();
        if (data.error == 0) {
          window.location.href = '/mass-registration';
        }else{
          alert(data.msg);
        }
      });
    },

    admin_deploy_mass_registration: function admin_deploy_mass_registration(id) {
      $('.load').html('Processing...');
      $('#loading').show();
      $.post('/api/mass/admin-deploy-mass-registration', {
        id: id
      }, (data) => {
        $('#loading').hide();
        if (data.error == 0) {
          window.location.href = '/admin-mass-migration';
        }else{
          alert(data.msg);
        }
      });
    }
}
