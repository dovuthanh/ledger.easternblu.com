const _ = require('lodash');
const multiHash = require("multi-hash");
const ipfsDag = require("ipfs-dag");
const ethWallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
const Web3 = require('web3');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

//upload work
var composer_hash;
var composer_name;
var composer_romanized_name;
var composer_address;
var composer_contact_number;
var composer_has_released;
var composer_has_released_sound_recording;
var composer_has_released_kara;
var composer_has_released_theme;
var composer_has_released_gaming;
var composer_has_released_musical;
var composer_has_released_other;
var composer_song_title;
var composer_digital_signatures;
var composer_song_extension;
var composer_song_size;
var composer_romanized_title;
var composer_length_of_time;
var composer_copyright_rm;
var composer_copyright_sync;
var composer_copyright_adaptation;
var composer_copyright_public_perform;
var composer_copyright_communication;
var composer_copyright_broadcasting;
var composer_country;
var composer_has_public;
var composer_has_broadcasting;
var composer_has_any_right;
var composer_time_rm;
var composer_time_sync;
var composer_time_adaptation;
var composer_song_file_name;
var composer_song_temp_url;

window.Work = {
	// validate work registration
  validate_work_registration: function validate_work_registration(file){
    composer_name = document.getElementById('composer_name').value;
    composer_romanized_name = document.getElementById('composer_romanized_name').value;;
    composer_address = document.getElementById('composer_address').value;
    composer_contact_number = document.getElementById('composer_contact_number').value;
    composer_has_released = $("input[name='has_released']:checked").val();
    composer_has_released_sound_recording = document.getElementById('released_sound_recording').checked;
    composer_has_released_kara = document.getElementById('released_kara').checked;
    composer_has_released_theme = document.getElementById('released_theme').checked;
    composer_has_released_gaming = document.getElementById('released_gaming').checked;
    composer_has_released_musical = document.getElementById('released_musical').checked;
    composer_has_released_other = document.getElementById('released_other').checked;
    composer_song_title = document.getElementById('composer_song_title').value;
    composer_romanized_title = document.getElementById('composer_romanized_title').value;
    composer_length_of_time = document.getElementById('length_of_time').value;
    composer_copyright_rm = document.getElementById('copyright_rm').checked;
    composer_copyright_sync = document.getElementById('copyright_sync').checked;
    composer_copyright_adaptation = document.getElementById('copyright_adaptation').checked;
    composer_copyright_public_perform = document.getElementById('copyright_public_perform').checked;
    composer_copyright_communication = document.getElementById('copyright_communication').checked;
    composer_copyright_broadcasting = document.getElementById('copyright_broadcasting').checked;
    var country_select = document.getElementById('country');
    composer_country = country_select.options[country_select.selectedIndex].value;
    composer_has_public = $("input[name='has_public_perform']:checked").val();
    composer_has_broadcasting =  $("input[name='has_broadcasting']:checked").val();
    composer_has_any_right = $("input[name='has_other_right']:checked").val();
    composer_time_rm = document.getElementById('time_reproduction_mechanical').value;
    composer_time_sync = document.getElementById('time_synchronisations').value;
    composer_time_adaptation = document.getElementById('time_adaptations').value;
    composer_song_file_name = document.getElementById('composer_song_file_name').value;
    composer_song_temp_url = document.getElementById('composer_song_temp_url').value;

    if(composer_name.length == 0){
      alert('Enter composer name please');
      return false;
    }
    if(composer_song_title.length == 0){
      alert('Enter song title please');
      return false;
    }
    if(composer_length_of_time.length == 0){
      alert('Could not get duration of song');
      return false;
    }

    var regex = new RegExp('[0-9]{2}:[0-9]{2}');
    if (!composer_length_of_time.match(regex)) {
      alert("Enter correct duration of song please");
      return false;
    }

    // var file = $('input[type=file]')[0].files[0];
    composer_song_extension = file.name.split('.').pop();
    composer_song_size = file.size;
    return true;
  },

  work_file_upload: function work_file_upload(file, progressHandler, success){
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
      composer_hash = node1.multihash;
      console.log(composer_hash);
      $.post('/check-song-composer-exist', {
        songHash: composer_hash
      }, function (data) {
        if (data.error == 0) {
          success(composer_hash);
          // var formData = new FormData();
          // formData.append('audiofile', file, file.name);
          // var ajax = new XMLHttpRequest();
          // ajax.upload.addEventListener('progress', progressHandler, false);
          // ajax.open('POST', '/song-file-upload', true);
          // ajax.send(formData);
        } else if (data.error == 2) {
          alert(data.msg);
          location.reload();
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
          Work.registration_work();
        }
      });
    }else{
      if (priceOf > 0) {
        callback(priceOf*100);
      }else{
        $('.load').html('Processing...');
        $('#loading').show();
        Work.registration_work();
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
      Work.registration_work();
    });
  },

  // registration work
  registration_work: function registration_work(){
    var privateKey = document.getElementById('private_key').value;
    var role = document.getElementById('role').value;
    if (role.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      console.log(myWallet);
      var walletAddress = myWallet.getAddressString();
      if (walletAddress == role) {
        Work.upload_work_to_server();
      } else {
        alert('Your private key does not match');
      }
    } else {
      alert('Your private key does not match');
    }
  },

  //save work to db
  upload_work_to_server: function upload_work_to_server(){
    var privateKey = document.getElementById('private_key').value;
    if (privateKey.length != 64) {
      alert('Your private key does not match');
      return;
    }
    var msg = web3.sha3(composer_hash);
    var wallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    var signed = ethUtil.ecsign(ethUtil.toBuffer(msg), wallet.getPrivateKey());
    var combined = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]);
    var combinedHex = combined.toString('hex');

    $.post('/new-work-registration', {
      composer_name: composer_name,
      composer_romanized_name: composer_romanized_name,
      composer_address: composer_address,
      composer_contact_number: composer_contact_number,
      composer_has_released: composer_has_released,
      composer_has_released_sound_recording: composer_has_released_sound_recording,
      composer_has_released_kara: composer_has_released_kara,
      composer_has_released_theme: composer_has_released_theme,
      composer_has_released_gaming: composer_has_released_gaming,
      composer_has_released_musical: composer_has_released_musical,
      composer_has_released_other: composer_has_released_other,
      composer_song_title: composer_song_title,
      composer_romanized_title: composer_romanized_title,
      composer_length_of_time: composer_length_of_time,
      composer_digital_signatures: combinedHex,
      composer_copyright_rm: composer_copyright_rm,
      composer_copyright_sync: composer_copyright_sync,
      composer_copyright_adaptation: composer_copyright_adaptation,
      composer_copyright_public_perform: composer_copyright_public_perform,
      composer_copyright_communication: composer_copyright_communication,
      composer_copyright_broadcasting: composer_copyright_broadcasting,
      composer_country: composer_country,
      composer_has_public: composer_has_public,
      composer_has_broadcasting: composer_has_broadcasting,
      composer_has_any_right: composer_has_any_right,
      composer_time_rm: composer_time_rm,
      composer_time_sync: composer_time_sync,
      composer_time_adaptation: composer_time_adaptation,
      composer_song_extension: composer_song_extension,
      composer_song_size: composer_song_size,
      composer_song_temp_url: composer_song_temp_url,
      composer_song_file_name: composer_song_file_name,
      composer_hash: composer_hash
    }, data => {
      if(data.error == 0){
        $('#loading').hide();
        window.location.href = '/my-songs';
      }
    });
  },

  //validate edit work
  validate_edit_work: function validate_edit_work(){
    composer_romanized_name = document.getElementById('composer_romanized_name').value;;
    composer_address = document.getElementById('composer_address').value;
    composer_contact_number = document.getElementById('composer_contact_number').value;
    composer_has_released = $("input[name='has_released']:checked").val();
    composer_has_released_sound_recording = document.getElementById('released_sound_recording').checked;
    composer_has_released_kara = document.getElementById('released_kara').checked;
    composer_has_released_theme = document.getElementById('released_theme').checked;
    composer_has_released_gaming = document.getElementById('released_gaming').checked;
    composer_has_released_musical = document.getElementById('released_musical').checked;
    composer_has_released_other = document.getElementById('released_other').checked;
    composer_copyright_rm = document.getElementById('copyright_rm').checked;
    composer_copyright_sync = document.getElementById('copyright_sync').checked;
    composer_copyright_adaptation = document.getElementById('copyright_adaptation').checked;
    composer_copyright_public_perform = document.getElementById('copyright_public_perform').checked;
    composer_copyright_communication = document.getElementById('copyright_communication').checked;
    composer_copyright_broadcasting = document.getElementById('copyright_broadcasting').checked;
    var country_select = document.getElementById('country');
    composer_country = country_select.options[country_select.selectedIndex].value;
    composer_has_public = $("input[name='has_public_perform']:checked").val();
    composer_has_broadcasting =  $("input[name='has_broadcasting']:checked").val();
    composer_has_any_right = $("input[name='has_other_right']:checked").val();
    composer_time_rm = document.getElementById('time_reproduction_mechanical').value;
    composer_time_sync = document.getElementById('time_synchronisations').value;
    composer_time_adaptation = document.getElementById('time_adaptations').value;

    Work.edit_work_registration();
  },

  //save work to db
  edit_work_registration: function edit_work_registration(){
    var composer_id = document.getElementById('composer_id').value;
    $.post('/update-work-info', {
      _id: composer_id,
      composer_romanized_name: composer_romanized_name,
      composer_address: composer_address,
      composer_contact_number: composer_contact_number,
      composer_has_released: composer_has_released,
      composer_has_released_sound_recording: composer_has_released_sound_recording,
      composer_has_released_kara: composer_has_released_kara,
      composer_has_released_theme: composer_has_released_theme,
      composer_has_released_gaming: composer_has_released_gaming,
      composer_has_released_musical: composer_has_released_musical,
      composer_has_released_other: composer_has_released_other,
      composer_copyright_rm: composer_copyright_rm,
      composer_copyright_sync: composer_copyright_sync,
      composer_copyright_adaptation: composer_copyright_adaptation,
      composer_copyright_public_perform: composer_copyright_public_perform,
      composer_copyright_communication: composer_copyright_communication,
      composer_copyright_broadcasting: composer_copyright_broadcasting,
      composer_country: composer_country,
      composer_has_public: composer_has_public,
      composer_has_broadcasting: composer_has_broadcasting,
      composer_has_any_right: composer_has_any_right,
      composer_time_rm: composer_time_rm,
      composer_time_sync: composer_time_sync,
      composer_time_adaptation: composer_time_adaptation,
    }, data => {
      if(data.error == 0){
        alert('Update work successed!');
        window.location.href = '/my-songs';
      }else{
        alert(data.msg);
      }
    });
  }
}
