const _ = require('lodash');
const multiHash = require("multi-hash");
const ipfsDag = require("ipfs-dag");
var Web3 = require('web3');
var ethWallet = require('ethereumjs-wallet');
var ethUtil = require('ethereumjs-util');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

//upload song
var song_id;
var song_title;
var song_chinese_title;
var song_content;
var song_date_publish;
var song_register_date;
var song_owner_name;
var song_romanized_owner_name;
var song_url;
var song_hash;
var song_right_holder_name;
var song_digital_signatures;
var song_contract_address;
var song_owner_contract_address;
var song_size;
var song_extension;
var song_place_of_work;
var song_date_of_completion;
var song_isrc_number;
var song_album_name;
var song_length_of_time;
var song_country_name;
var song_dialect;
var song_format_cd;
var song_format_dvd;
var song_format_kara;
var song_format_digital;
var song_format_social;
var song_original_version;
var song_remixed_version;
var song_extended_version;
var song_re_recording_version;
var song_dispute_address;
var song_is_mass_registration;
var song_block_confirmed;
var song_merkel_root;
var song_artist_id;
var song_lyric_id;
var song_composer_id;
var song_composer_name;
var song_lyric_name;
var song_other_owner;
var song_artist_name;
var song_temp_url;
var song_file_name;
var song_completed;
var song_publish;
var arrOtherName;
var arrOtherPercentWriteToBC;
var arrOtherWalletWriteToBC;

window.Song = {
	//validate song step 1
  validate_new_song_step1: function validate_new_song_step1() {
    song_owner_name = document.getElementById('song_owner_name').value;
    song_romanized_owner_name = document.getElementById('song_romanized_owner_name').value;
    song_artist_id = document.getElementById('artist_id').value;
    song_lyric_id = document.getElementById('lyric_id').value;
    song_composer_id = document.getElementById('composer_id').value;
    song_artist_name = document.getElementById('artist_name').value;
    song_lyric_name = document.getElementById('song_lyric_name').value;
    song_composer_name = document.getElementById('song_composer_name').value;
    song_place_of_work = document.getElementById('place_of_work').value;
    song_date_of_completion = document.getElementById('date_of_completion').value;
    song_isrc_number = document.getElementById('song_isrc_number').value;
    var country_select = document.getElementById('country');
    song_country_name = country_select.options[country_select.selectedIndex].value;

    if (song_owner_name.length == 0) {
      alert("Please enter Copyright Owner Name please");
      return false;
    }
    if (song_artist_id == undefined || song_artist_id.length == 0) {
      alert("Please enter correct Artist Name please");
      return false;
    }

    if (song_artist_id == undefined || song_artist_id.length == 0) {
      alert("Please enter correct Artist Name please");
      return false;
    }

    if (song_lyric_name.length ==0 && (song_lyric_id == undefined || song_lyric_id.length == 0)) {
      alert("Please enter correct Lyricists Name please");
      return false;
    }
    if (song_composer_name.length ==0 && (song_composer_id == undefined || song_composer_id.length == 0)) {
      alert("Please enter correct Composer Name please");
      return false;
    }

    arrOtherName = [];
    arrOtherPercentWriteToBC = [];
    arrOtherWalletWriteToBC = [];
    var totalPercent = 0;
    var validate = true;

    var names = document.getElementsByName('other_owner');
    var percents = document.getElementsByName('other_percent');
    var wallets = document.getElementsByName('wallet_address');
    
    if (!ethUtil.isValidAddress(wallets)) {
      alert('Please enter correct other owner address.');
      return false; 
    }

    for (var i = 0; i < names.length; i++) {
      var name = names[i].value;
      var percent = percents[i].value;
      var wallet_address = wallets[i].value;
      if (name.length == 0 && percent.length == 0 && wallet_address.length == 0) {
        continue;
      }
      if (!(name.length != 0 && percent.length != 0 && wallet_address.length != 0)) {
        validate = false;
        break;
      }
      if (name.length != 0 && percent.length != 0 && wallet_address.length != 0) {
        var person = {
          otherName: name,
          otherPercent: percent,
          otherWallet: wallet_address
        };
        arrOtherPercentWriteToBC.push(percent);
        arrOtherWalletWriteToBC.push(wallet_address);
        totalPercent += percent;
        arrOtherName.push(person);
      }
    }
    if (!validate) {
      alert('Please enter correct royalty partners');
      return false;
    }
    console.log(totalPercent);
    if (totalPercent > 100) {
      alert('Please enter correct royalty percent');
      return false;
    }
    return true;
  },

  //validate song step 2
  validate_new_song_step2: function validate_new_song_step2() {
    song_file_name = document.getElementById('song_file_name').value;
    song_title = document.getElementById('song_title').value;
    song_publish = document.getElementById('song_publish').value;
    song_chinese_title = document.getElementById('song_chinese_title').value;
    song_album_name = document.getElementById('song_album_name').value;
    song_dialect = document.getElementById('song_dialect').value;
    song_length_of_time = document.getElementById('length_of_time').value;
    song_format_cd = document.getElementById('format_cd').checked;
    song_format_dvd = document.getElementById('format_dvd').checked;
    song_format_kara = document.getElementById('format_kara').checked;
    song_format_digital = document.getElementById('format_digital').checked;
    song_format_social = document.getElementById('format_social').checked;
    song_original_version = document.getElementById('version_original').checked;
    song_remixed_version = document.getElementById('version_remixed').checked;
    song_extended_version = document.getElementById('version_extended').checked;
    song_re_recording_version = document.getElementById('version_recording').checked;
    song_temp_url = document.getElementById('song_temp_url').value;
    var file = $('input[type=file]')[0].files[0];
    song_extension = file.name.split('.').pop();
    song_size = file.size;

    if (song_title.length == 0) {
      alert("Enter song title please");
      return false;
    }
    if (song_publish.length == 0) {
      alert("Enter song publish please");
      return false;
    }
    if (song_length_of_time.length == 0) {
      alert("Enter duration of song please");
      return false;
    }

    var regex = new RegExp('[0-9]{2}:[0-9]{2}');
    if (!song_length_of_time.match(regex)) {
      alert("Enter correct duration of song please");
      return false;
    }
    return true;
  },

  //upload song to server
  song_file_upload: function song_file_upload(file, success) {
    if (!file) {
      alert('No input file found!');
      return;
    }
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = function () {
      var buffer = Buffer.from(reader.result);
      console.log(reader.result);
      var node1 = new ipfsDag.Node(buffer);
      song_hash = node1.multihash;
      console.log(song_hash);
      $.post('/check_song_exist', {
        songHash: song_hash
      }, function (data) {
        if (data.error == 0) {
          success(song_hash);
          // var formData = new FormData();
          // formData.append('audiofile', file, file.name);
          // var ajax = new XMLHttpRequest();
          // ajax.upload.addEventListener('progress', progressHandler, false);
          // ajax.open('POST', '/song-file-upload', true);
          // ajax.send(formData);
        } else if (data.error == 2) {
          alert(data.msg);
          location.reload();
        } else if (data.error == 3) {
          alert(data.msg);
        } else {
          alert(data.msg);
        }
        return;
      });
    };
  },

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
          Song.registration_song();
        }
      });
    }else{
      if (priceOf > 0) {
        callback(priceOf*100);
      }else{
        $('.load').html('Processing...');
        $('#loading').show();
        Song.registration_song();
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
      Song.registration_song();
    });
  },

  //registration song
  registration_song: function registration_song() {
    // var privateKey = document.getElementById('private_key').value;
    // var role = document.getElementById('role').value;
    // if (role.length != 0 && privateKey.length == 64) {
    //   var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    //   console.log(myWallet);
    //   var walletAddress = myWallet.getAddressString();
    //   if (walletAddress == role) {
    //     Song.up_load_song_to_server(false);
    //   } else {
    //     alert('Your private key does not match');
    //     return;
    //   }
    // } else {
    //   alert('Your private key does not match');
    //   return;
    // }
      Song.up_load_song_to_server(false);
  },

  //save song to db
  up_load_song_to_server: function up_load_song_to_server() {
  	var privateKey = document.getElementById('private_key').value;
    if (privateKey.length != 64) {
      alert('Your private key does not match');
      return;
    }
  	var msg = web3.sha3(song_hash);
    var wallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    var signed = ethUtil.ecsign(ethUtil.toBuffer(msg), wallet.getPrivateKey());
    var combined = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]);
    var combinedHex = combined.toString('hex');

    $.post("/upload-song", {
      song_title: song_title,
      song_completed: song_completed,
      song_publish: song_publish,
      song_chinese_title: song_chinese_title,
      song_content: song_content,
      song_owner_name: song_owner_name,
      song_romanized_owner_name: song_romanized_owner_name,
      song_hash: song_hash,
      song_right_holder_name: song_right_holder_name,
      song_digital_signatures: combinedHex,
      song_size: song_size,
      song_extension: song_extension,
      song_place_of_work: song_place_of_work,
      song_date_completion: song_date_of_completion,
      song_isrc_number: song_isrc_number,
      song_album_name: song_album_name,
      song_length_of_time: song_length_of_time,
      song_country_name: song_country_name,
      song_dialect: song_dialect,
      song_format_cd: song_format_cd,
      song_format_dvd: song_format_dvd,
      song_format_kara: song_format_kara,
      song_format_social: song_format_social,
      song_original_version: song_original_version,
      song_remixed_version: song_remixed_version,
      song_extended_version: song_extended_version,
      song_re_recording_version: song_re_recording_version,
      song_artist_id: song_artist_id,
      song_lyric_id: song_lyric_id,
      song_composer_id: song_composer_id,
      song_composer_name: song_composer_name,
      song_lyric_name: song_lyric_name,
      song_temp_url: song_temp_url,
      song_file_name: song_file_name
    }, function () {
      $('#loading').hide();
      window.location.href = "/my-songs";
    });
  },

  update_song: function update_song() {
    song_romanized_owner_name = document.getElementById('song_romanized_owner_name').value;
    song_lyric_name = document.getElementById('song_lyric_name').value;
    song_composer_name = document.getElementById('song_composer_name').value;
    song_place_of_work = document.getElementById('place_of_work').value;
    song_date_of_completion = document.getElementById('date_of_completion').value;
    song_isrc_number = document.getElementById('song_isrc_number').value;
    var country_select = document.getElementById('country');
    song_country_name = country_select.options[country_select.selectedIndex].value;
    song_album_name = document.getElementById('song_album_name').value;
    song_dialect = document.getElementById('song_dialect').value;
    song_format_cd = document.getElementById('format_cd').checked;
    song_format_dvd = document.getElementById('format_dvd').checked;
    song_format_kara = document.getElementById('format_kara').checked;
    song_format_digital = document.getElementById('format_digital').checked;
    song_format_social = document.getElementById('format_social').checked;
    song_original_version = document.getElementById('version_original').checked;
    song_remixed_version = document.getElementById('version_remixed').checked;
    song_extended_version = document.getElementById('version_extended').checked;
    song_re_recording_version = document.getElementById('version_recording').checked;

    $.post('/update-song-info', {
      _id: _id,
      song_romanized_owner_name: song_romanized_owner_name,
      song_place_of_work: song_place_of_work,
      song_date_completion: song_date_of_completion,
      song_isrc_number: song_isrc_number,
      song_album_name: song_album_name,
      song_country_name: song_country_name,
      song_dialect: song_dialect,
      song_format_cd: song_format_cd,
      song_format_dvd: song_format_dvd,
      song_format_kara: song_format_kara,
      song_format_social: song_format_social,
      song_original_version: song_original_version,
      song_remixed_version: song_remixed_version,
      song_extended_version: song_extended_version,
      song_re_recording_version: song_re_recording_version,
      song_composer_name: song_composer_name,
      song_lyric_name: song_lyric_name
    }, function (data) {
      if (data.error == 0) {
        alert(data.msg);
        window.location.href = '/update-song-info?id=' + data._id;
      } else {
        alert(data.msg);
      }
    });
  }
}
