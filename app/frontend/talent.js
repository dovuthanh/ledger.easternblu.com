var artist_type = '';
var artist_owner_address = '';
var artist_profession_name = '';
var artist_romanized_name = '';
var artist_profile = '';
var artist_name_passport = '';
var artist_email = '';
var artist_code = '';
var artist_phone = '';
var artist_wechat_link = '';
var artist_facebook_link = '';
var artist_linked_link = '';
var artist_twitter_link = '';
var artist_freelancer = '';
var artist_record_label = '';
var artist_product_company = '';
var artist_management_company = '';
var artist_is_record_new_song = '';
var artist_is_solo_concert = '';
var artist_is_events = '';
var artist_is_private_organised = '';
var artist_is_appear_commericals = '';
var artist_is_seek_cooperations = '';
var artist_is_sell_sound = '';
var artist_file_avatar = '';

window.Talent = {
  validateEmail: function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },

  // validate talent step 1
  validate_talent_step_1: function validate_talent_step_1() {
    artist_type = $("input[name='talent_type']:checked").val();
    artist_profession_name = document.getElementById('artist_profession_name').value;
    artist_romanized_name = document.getElementById('artist_romanized_name').value;
    artist_profile = document.getElementById('artist_profile').value;
    artist_name_passport = document.getElementById('artist_name_passport').value;
    artist_email = document.getElementById('artist_email').value;
    artist_code = document.getElementById('artist_code').value;
    artist_phone = document.getElementById('artist_phone').value;
    artist_file_avatar = $('#artist_file_avatar').attr('src');

    if (artist_file_avatar.startsWith('/')) {
      artist_file_avatar = artist_file_avatar.substr(1,artist_file_avatar.length-1);
    }

    if(artist_file_avatar == 'images/upload.jpg'){
      alert('Please select avatar');
      return false;
    }

    if (artist_profession_name.length == 0) {
      alert('Please enter artist professional name');
      return false;
    }
    if (artist_profile.length == 0) {
      alert('Please enter artist profile');
      return false;
    }
    if (artist_name_passport.length == 0) {
      alert('Please enter name in passport');
      return false;
    }
    if (artist_email.length == 0) {
      alert('Please enter email');
      return false;
    }
    if (!Talent.validateEmail(artist_email)) {
      alert('Email is not correct');
      return false;
    }
    if (artist_code.length == 0 || artist_code.length > 2) {
      alert('Please enter country code');
      return false;
    }
    if (artist_phone.length == 0 || artist_phone.length > 10) {
      alert('Please enter phone');
      return false;
    }
    return true;
  },

  // validate talent step 2
  validate_talent_step_2: function validate_talent_step_2() {
    artist_wechat_link = document.getElementById('artist_wechat_link').value;
    artist_facebook_link = document.getElementById('artist_facebook_link').value;
    artist_linked_link = document.getElementById('artist_linked_link').value;
    artist_twitter_link = document.getElementById('artist_twitter_link').value;
    artist_freelancer = $("input[name='artist_freelancer']:checked").val();
    var artist_contract_type = $("input[name='contract_type']:checked").val();
    if (artist_contract_type == 'record_label') {
      artist_record_label = document.getElementById('artist_record_label').value;
      if (artist_record_label.length == 0) {
        alert('Please enter record label');
        return false;
      }
    } else if (artist_contract_type == 'product_company') {
      artist_product_company = document.getElementById('artist_product_company').value;
      if (artist_record_label.length == 0) {
        alert('Please enter production company');
        return false;
      }
    } else if (artist_contract_type == 'management_company') {
      artist_management_company = document.getElementById('artist_management_company').value;
      if (artist_record_label.length == 0) {
        alert('Please enter artist management company');
        return false;
      }
    } else{
      artist_record_label = '';
      artist_product_company = '';
      artist_management_company = '';
    }
    artist_is_record_new_song = document.getElementById('artist_is_record_new_song').checked;
    artist_is_solo_concert = document.getElementById('artist_is_solo_concert').checked;
    artist_is_events = document.getElementById('artist_is_events').checked;
    artist_is_private_organised = document.getElementById('artist_is_private_organised').checked;
    artist_is_appear_commericals = document.getElementById('artist_is_appear_commericals').checked;
    artist_is_seek_cooperations = document.getElementById('artist_is_seek_cooperations').checked;
    artist_is_sell_sound = document.getElementById('artist_id_sell_sound').checked;

    if (!artist_facebook_link.includes('www.facebook.com') && artist_facebook_link.length > 0) {
      alert('Please enter facebook link correct');
      return false;
    }
    if (!artist_twitter_link.includes('www.twitter.com') && artist_twitter_link.length > 0) {
      alert('Please enter twitter link correct');
      return false;
    }
    if (!artist_wechat_link.includes('weixin:') && artist_wechat_link.length > 0) {
      alert('Please enter wechat link correct');
      return false;
    }
    if (!artist_linked_link.includes('www.linkedin.com') && artist_linked_link.length > 0) {
      alert('Please enter linkedin link correct');
      return false;
    }
    return true;
  },

  // create talent
  create_talent: function create_talent() {
    $.post('/create-talent', {
      artist_type: artist_type,
      artist_profession_name: artist_profession_name,
      artist_romanized_name: artist_romanized_name,
      artist_profile: artist_profile,
      artist_name_passport: artist_name_passport,
      artist_email: artist_email,
      artist_code: artist_code,
      artist_phone: artist_phone,
      artist_wechat_link: artist_wechat_link,
      artist_facebook_link: artist_facebook_link,
      artist_linked_link: artist_linked_link,
      artist_twitter_link: artist_twitter_link,
      artist_freelancer: artist_freelancer,
      artist_record_label: artist_record_label,
      artist_product_company: artist_product_company,
      artist_management_company: artist_management_company,
      artist_is_record_new_song: artist_is_record_new_song,
      artist_is_solo_concert: artist_is_solo_concert,
      artist_is_events: artist_is_events,
      artist_is_private_organised: artist_is_private_organised,
      artist_is_appear_commericals: artist_is_appear_commericals,
      artist_is_seek_cooperations: artist_is_seek_cooperations,
      artist_is_sell_sound: artist_is_sell_sound,
      artist_file_avatar: artist_file_avatar
    }, function (data) {
      if (data) {
        console.log(data);
        if (data.error == 0) {
          window.location.href = '/my-talents';
        } else {
          alert('Error');
        }
      } else {
        alert('Error');
      }
    });
  },

  edit_talent_profile: function edit_talent_profile() {
    var _id = document.getElementById('artist_id').value;
    $.post('/edit-talent-profile', {
      _id: _id,
      artist_type: artist_type,
      artist_profession_name: artist_profession_name,
      artist_romanized_name: artist_romanized_name,
      artist_profile: artist_profile,
      artist_name_passport: artist_name_passport,
      artist_email: artist_email,
      artist_code: artist_code,
      artist_phone: artist_phone,
      artist_wechat_link: artist_wechat_link,
      artist_facebook_link: artist_facebook_link,
      artist_linked_link: artist_linked_link,
      artist_twitter_link: artist_twitter_link,
      artist_freelancer: artist_freelancer,
      artist_record_label: artist_record_label,
      artist_product_company: artist_product_company,
      artist_management_company: artist_management_company,
      artist_is_record_new_song: artist_is_record_new_song,
      artist_is_solo_concert: artist_is_solo_concert,
      artist_is_events: artist_is_events,
      artist_is_private_organised: artist_is_private_organised,
      artist_is_appear_commericals: artist_is_appear_commericals,
      artist_is_seek_cooperations: artist_is_seek_cooperations,
      artist_is_sell_sound: artist_is_sell_sound,
      artist_file_avatar: artist_file_avatar
    }, function (data) {
      console.log(data);
      if (data.error == 0) {
        window.location.href = '/my-profile?id=' + data._id;
      } else {
        alert(data.msg);
      }
    });
  }
}
