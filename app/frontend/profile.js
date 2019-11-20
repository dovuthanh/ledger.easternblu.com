const _ = require('lodash');
var Web3 = require('web3');
var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));

window.Profile = {
  validateEmail: function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },

  //sign up meta mask
  sign_up_metamask: function sign_up_metamask() {
    web3 = new Web3(web3.currentProvider);
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }
      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }
      if (accs[0] != account) {
        account = accs[0];
        $.post("/check_user_exist", {
          wallet_address: account
        }, function (data, status) {
          console.log(data);
          console.log(status);
          if (data.error == 2) {
            window.location = "/sign-in?wallet=" + account;
          } else if (data.error == 0) {
            window.location = "/sign-up-info?wallet=" + account;
          } else {
            alert('Something wrong');
          }
        });
      }
    });
  },

  validateInfomation: function validateInfomation() {
    var user_name = document.getElementById('user_name').trim();
    var email = document.getElementById('email').value.trim();
    var role = document.getElementById("role").value.trim();
    var password = document.getElementById("password").value.trim();
    var confirm_password = document.getElementById("confirm_password").value.trim();

    var country_select = document.getElementById('upd_country');
    var country = country_select.options[country_select.selectedIndex].value;

    if (user_name.length < 6) {
      alert('Your name too short');
      return false;
    }

    if (!Profile.validateEmail(email)) {
      alert('Please enter correct email');
      return false;
    }

    if (role.length == 0) {
      alert('Wallet address is empty');
      return false;
    }

    if (country.length == 0) {
      alert('Please choose country');
      return false;
    }

    if (password.length < 6) {
      alert('Your password too short');
      return false;
    }

    if (password != confirm_password) {
      alert('Password does not match');
      return false;
    }
    return true;
  },

	validate_update_profile: function validate_update_profile() {
    var _id = document.getElementById('usr_id').value;
    var full_name = document.getElementById('upd_user_fullname').value;
    var user_is_company = $('input[name="upd_user_is_company"]:checked').val();
    var address = document.getElementById('upd_user_address').value;
    var city = document.getElementById('upd_user_city').value;
    var postal = document.getElementById('upd_user_postal').value;
    var country_select = document.getElementById('upd_country');
    var country = country_select.options[country_select.selectedIndex].value;

    if (full_name.length < 6) {
      alert('Please enter your full name');
      return;
    }
    $.post('/update-profile', {
      upd_user_id: _id,
      upd_user_is_company: user_is_company,
      upd_user_fullname: full_name,
      upd_user_address: address,
      upd_user_city: city,
      upd_user_postal: postal,
      upd_user_country: country
    }, function (data) {
      if (data && data.error == 0) {
        window.location.href = '/settings';
      } else if (!data || data.error == 1) {
        document.getElementById('flashmessage').innerHTML = data.message;
      } else {
        window.location.href = '/404';
      }
    });
  },

  validate_create_sub_user: function validate_create_sub_user() {
    var wallet_address = document.getElementById('crt_user_wallet_address').value;
    var user_email = document.getElementById('crt_user_email').value;
    var user_fullname = document.getElementById('crt_user_fullname').value;
    var user_address = document.getElementById('crt_user_address').value;
    var user_city = document.getElementById('crt_user_city').value;
    var user_postal = document.getElementById('crt_user_postal').value;
    var country_select = document.getElementById('crt_country');
    var country = country_select.options[country_select.selectedIndex].value;
    var pwd = document.getElementById('crt_pwd').value;
    var confirm_pwd = document.getELementById('crt_confirm_pwd').value;
    if (wallet_address.length != 32) {
      alert('Wrong wallet');
      return;
    }
    var isAddress = web3.utils.isAddress(wallet_address);
    if (!isAddress) {
      alert('Wrong wallet');
      return;
    }
    if (user_email.length == 0) {
      alert('Please enter correct email');
      return;
    }
    if (user_fullname.length == 0) {
      alert('Please enter full name');
      return;
    }
    if (pwd.length == 0 || confirm_pwd.length == 0) {
      alert('Please enter password');
      return;
    }
    if (pwd != confirm_pwd) {
      alert('Password does not match');
      return;
    }
    $.post('/create-sub-user', {
      crt_user_wallet_address: wallet_address,
      crt_user_email: user_email,
      crt_user_fullname: user_fullname,
      crt_user_address: user_address,
      crt_user_city: user_city,
      crt_user_postal: user_postal,
      crt_user_country: country,
      crt_pwd: pwd
    }, function (data) {
      if (data && data.error == 0) {
        window.location.href = '/settings';
      } else {
        document.getElementById('flashmessage').innerHTML = data.message;
      }
    });
  },

  change_password: function change_password() {
    var usr_id = document.getElementById('usr_id').value;
    var old_password = document.getElementById('pwd_old').value;
    var new_password = document.getElementById('pwd_new').value;
    var confirm_new_password = document.getElementById('pwd_confirm_new').value;

    if (old_password.length == 0 || new_password.length == 0 || confirm_new_password.length == 0) {
      alert('Please enter your password');
      return;
    }
    if (new_password.length < 6 || new_password.length > 32) {
      alert('New password from 6-32 characters');
      return;
    }
    if (new_password != confirm_new_password) {
      alert('Password does not match');
      return;
    }
    $.post('/change-password', {
      _id: usr_id,
      pwd_old: old_password,
      pwd_new: new_password
    }, function (data) {
      if (data.error == 0) {
        alert(data.message);
        window.location.href = '/settings';
      } else {
        alert(data.message);
      }
    });
  },

  change_mobile: function change_mobile() {
    var usr_id = document.getElementById('usr_id').value;
    var usr_code = document.getElementById('user_code').value;
    var usr_phone = document.getElementById('user_phone').value;

    $.post('/update-phone-number', {
      usr_id: usr_id,
      usr_code: '+' + usr_code,
      usr_phone: usr_phone
    }, function (data) {
      if (data.error == 0) {
        alert(data.message);
        window.location.href = '/settings';
      } else {
        alert(data.message);
      }
    });
  }
}
