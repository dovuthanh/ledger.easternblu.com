const _ = require('lodash');
const Web3 = require('web3');
var ethUtil = require('ethereumjs-util');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

window.Verify = {
	//verify song
  verify: function verify() {
    var registration_address = document.getElementById("registration_address").value;
    if (registration_address.length == 0) {
      alert('Please enter registration address');
      return;
    }
    if (!ethUtil.isValidAddress(registration_address)) {
      alert('Please enter correct address');
      return;
    }

    $('.load').html('Please wait...');
    $('#loading').show();
    $.post('/verification', {
      address: registration_address
    }, (data) => {
      $('#loading').hide();
      if (data.error != 0) {
        document.getElementById('registration-info').innerHTML = '<p style="color: #f00; font-size: 16px;">'+data.msg+'</p>';
        return;
      }
      const value = data.value;
      console.log(value);
      var uri = '';
      if (value[4] == 3) {
        var hashOfSong = document.getElementById('hash_of_song').value;
        uri = '/verification-result?address=' + registration_address + '&title=' + value[0] + '&signature=' + value[3] +
                '&merkle=' + value[2] + '&hash=' + hashOfSong + '&role=' + value[1] + '&type=' + value[4];
      }else{
        uri = '/verification-result?address=' + registration_address + '&title=' + value[0] + '&signature=' + value[3] +
                '&hash=' + value[2] + '&role=' + value[1] + '&type=' + value[4];
      }
      var url = encodeURI(uri);
      console.log(url);
      $('#verify').load(url);
    });
  },

  //authentication song
  authentication: function authentication() {
    var owner_of_song = document.getElementById("auth_account_number").value;
    var digital_signatures = document.getElementById("auth_digital_signatures").value;
    var hash_of_song = document.getElementById("auth_hash_of_song").value;
    var merkle_root = document.getElementById('auth_merkle_root').value;

    if (owner_of_song.length == 0 || digital_signatures.length == 0 || hash_of_song.length == 0) {
      alert('Please enter all information');
      return;
    }

    if (!digital_signatures.length != 64) {
      alert('Digital signature is not correct');
      return;
    }

    if (digital_signatures.match(/^[0-9abcdef]+$/g) == null) {
      alert('Digital signature is not correct');
      return;
    }
    
    if(!digital_signatures.startsWith('0x')) {
      digital_signatures = '0x' + digital_signatures;
    }

    if (!ethUtil.isValidAddress(owner_of_song)) {
      alert('Please enter correct address');
      return;
    }

    var hash = '';
    if (merkle_root.length != 0) {
      hash = web3.sha3(merkle_root);
    }else{
      hash = web3.sha3(hash_of_song);
    }

    $('.load').html('Please wait...');
    $('#loading').show();
    $.post('/authentication', {
      owner_of_song: owner_of_song,
      hash: hash,
      signature: digital_signatures
    }, (data) => {
      $('#loading').hide();
      if (data.error != 0) {
        alert(data.msg);
        return;
      }

      var uri = '/authentication-result?signature=' + digital_signatures + '&hash=' + hash_of_song + 
                '&root=' + merkle_root + '&role=' + owner_of_song + '&status=' + data.value;
      var url = encodeURI(uri);
      $('#authentication').load(url);
    });
  }
}
