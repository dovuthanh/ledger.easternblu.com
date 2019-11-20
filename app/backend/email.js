var User                = require('../models/user');
const user_send_email   = process.env.GMAIL_USER_SEND;
const pass_send_email   = process.env.GMAIL_PASS_SEND;
require('dotenv').config();
var login_url           = process.env.URL_HOST+"/sign-in";
var URL_HOST            = process.env.URL_HOST;
var default_confirm_url = process.env.URL_HOST+'/confirmation?id=';
var default_confirm_mass_migration_url = process.env.URL_HOST+'/confirmation_mass?id=';
var ropstenAddress      = process.env.NETWORK_TRANSACTION;
var ropstenTransaction  = process.env.NETWORK_TRANSACTION;
module.exports ={

send_process_mass_migration_sucess: function send_process_mass_migration_sucess(user){
  if (user) {
    console.log(user_send_email);
    console.log(pass_send_email);
    var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   user.userEmail, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Export completed',
      text:    '',  // Plain text
      html: 'Hi '+ ',<br/><br/>Your batch has been done. Please Login to system and process upload media file.'
    })({});
  }    
},

send_process_mass_migration_fail: function send_process_mass_migration_fail(user){
  if (user) {
    console.log(user_send_email);
    console.log(pass_send_email);
    var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   user.userEmail, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Export completed',
      text:    '',  // Plain text
      html: 'Hi ' + ',<br/><br/>Your batch has been fail. Please Login to system to get more detail.'
    })({});
  }  
},

send_initial_license: function send_initial_license(owner,buyer, song, license, contractAddress){
  var send = require('gmail-send')({
    user: user_send_email,
    pass: pass_send_email,
    to:   owner.userEmail, 
    // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
    subject: 'Licensing confirmation',
    text:    '',  // Plain text
    html: 'Hi ' +song.songOwnerName + ',<br/><br/>'+
     'You have an offer to license ' + song.songTitle + ' - ' + (song.songArtistRefer ? song.songArtistRefer.artistProfessionName : '') + ' for ' + license.right + ' for ' + license.peroid + ' months for ' + license.territories +
     'From '+buyer.userWalletAddress+', ' + buyer.userFullName + ', ' + buyer.userAddress + ', ' + buyer.userCountryCode + buyer.userPhone + '<br/>'+
     'Please contact the offerer and discuss the offer and terms.<br/><br/>'+
     'To get more detail, please click to the link <a href="'+URL_HOST+ '/accept-license?address=' +license._id+'" target="_blank">'+process.env.URL_HOST+ '/accept-license?address=' +license._id+'</a>'
  })({});
},

send_song_deploy_success: function send_song_deploy_success(email, ownerName, contractAddress, song_id, song_title){
  var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   email, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Song registration successed!',
      text:    '',  // Plain text
      html: 'Hi '+ ownerName +',<br/>'+
            song_title+  ' has been registered on the public blockchain at Address '+contractAddress+'.<br/>'+
            'Click <a href="'+ URL_HOST + '/certificate-song?id=' + song_id  +'">Certificate & Authentication</a> to view the song certificate.<br/>'+
            'Click this link: <a href="'+ ropstenAddress + contractAddress +'">'+ ropstenAddress + contractAddress +'</a> to confirm information on ethereum scan.<br/>'
    })({});
},

send_mass_migration_deploy_success: function send_mass_migration_deploy_success(email, ownerName, contractAddress){
  var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   email, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Your batch has been deployed successfull',
      text:    '',  // Plain text
      html: 'Hi '+ ownerName +',<br/><br/>'+
            'Batch has been deployed on Ethereum<br/><br/>'
    })({});
},

send_work_deploy_success: function send_work_deploy_success(email, ownerName, work_id, contractAddress){
  var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   email, 
      subject: 'Composer/Lyricsist registration successed!',
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      text:    '',  // Plain text
      html: 'Hi '+ ownerName +',<br/>'+
      'Congrulation, your composer/lyricsist registration successed!<br/>Click <a href="'+ process.env.URL_HOST + '/certificate-work?id='+work_id+'">Certificate & Authentication</a> to view your composers registration.'+
      '<br/>Go to <a href="'+ process.env.URL_HOST + contractAddress + '">'+ ropstenAddress + contractAddress +'</a> to confirm information on ethereum scan.'
    })({});
},

send_accept_license: function send_accept_license(buyer, owner, license){
  var send = require('gmail-send')({
    user: user_send_email,
    pass: pass_send_email,
    to:   buyer.userEmail, 
    subject: 'Licensing confirmation',
    // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
    text:    '',  // Plain text
    html: 'Hi <br/>' +
          'Licensor - '+owner.userWalletAddress+', '+owner.userFullName+' has accepted your offer.<br/>' +
          'To get more detail, please click to this link: <a href="'+URL_HOST+'/payment-license?address='+license.licenseAddress+'" target="_blank">'+URL_HOST+'/payment-license?address='+license.licenseAddress+'</a><br/>' +
          'The license will then be recorded onto the decentralized blockchain for public inspection.'
  })({});
},

send_fund_license: function send_fund(email, song, license){
  User.findOne({userWalletAddress: license.ownerAddress}, function(err, owner){
    if (!err && owner) {
      var send = require('gmail-send')({
        user: user_send_email,
        pass: pass_send_email,
        to:   email, 
        subject: 'Licensing confirmation',
        // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
        text:    '',  // Plain text
        html: 'Hi '+owner.userFullName+',<br/>' +
            'This refers to our agreement to license '+song.songTitle+' by artiste '+(song.songArtistRefer ? song.songArtistRefer.artistProfessionName : '')+' for '+license.right+' for '+license.peroid+' period for '+license.territories+' territories.'+
            'Please remit 30 amt to our account at <a href="'+ropstenAddress+owner.userWalletAddress+'" target="_blank">'+owner.userWalletAddress+'</a> within the next 10 days from the date of this email through this link: <a href="'+ropstenAddress+license.licenseAddress+'" target="_blank">'+ropstenAddress+license.licenseAddress+'</a>'
      })({});
    }
  });     
},

send_transfer_amount: function send_transfer_amount(email, transferName,  transaction){
  var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   email, 
      subject: 'Fund & Transfer confirmation',
      cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      text:    '',  // Plain text
      html: 'Hi '+ transferName+',<br/>'+
      'Congrulation, your transaction to account: ' + transaction.toAddress + ' with ' +transaction.amount+ '('+transaction.unit+') at ' +transaction.datetime.toString() + ' successed!' +
      'You can check the transaction in the ethereum scan with the link: <a href="'+ropstenTransaction+transaction.txHash+'" target="_blank">'+ropstenTransaction+transaction.txHash+'</a>' 
    })({});
},

add_royalty_partner: function add_royalty_partner(royalty){
  if (royalty.percentBefore == '' || royalty.percentBefore == undefined) {
    royalty.percentBefore = 0;
  }
  if (royalty.percentAfter == '' || royalty.percentAfter == undefined) {
    royalty.percentAfter = 0;
  }
  User.findOne({_id: royalty.partnerUserRefer}, function(err, user){
    if(user){
      var send = require('gmail-send')({
        user: user_send_email,
        pass: pass_send_email,
        to:   user.userEmail, 
        subject: 'Update Royalty Partner',
        // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
        text:    '',  // Plain text
        html: 'Hi ' + user.userFullName + ',<br/><br/>' +
            'You are added to ' + royalty.songAddress + ' by ' + royalty.ownerName + ' - ' + royalty.ownerAddress + '.<br/><br/>' +
            'Your percentage will be changed from ' + royalty.percentBefore + '% to ' + royalty.percentAfter +'%<br/><br/>' +
            'If accepted or denied, please click this link: <a href="'+URL_HOST+'/royalty-partner-sign">'+URL_HOST+'/royalty-partner-sign</a>'  
      })({});
    }
  });     
},

accept_royalty_partner: function accept_royalty_partner(royalty){
  if (royalty.percentBefore == '' || royalty.percentBefore == undefined) {
    royalty.percentBefore = 0;
  }
  if (royalty.percentAfter == '' || royalty.percentAfter == undefined) {
    royalty.percentAfter = 0;
  }
  User.findOne({_id: royalty.partnerUserRefer}, function(err, user){
    if(user){
        var send = require('gmail-send')({
          user: user_send_email,
          pass: pass_send_email,
          to:   user.userEmail, 
          // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
          subject: 'Accept Royalty Partner',
          text:    '',  // Plain text
          html: 'Hi ' + royalty.ownerName + ',<br/><br/>' +
                royalty.royaltyName + ' - ' + royalty.royaltyPartnerAddress + ' accepted your request to ' + royalty.songAddress + '.<br/><br/>' +
                'The percentage of ' + royalty.royaltyPartnerAddress + ' changed from ' + royalty.percentBefore + '% to ' + royalty.percentAfter + '% at ' + royalty.dateIssue + '.'
        })({});
      }
    });     
},

deny_royalty_partner: function deny_royalty_partner(royalty){
  if (royalty.percentBefore == '' || royalty.percentBefore == undefined) {
    royalty.percentBefore = 0;
  }
  if (royalty.percentAfter == '' || royalty.percentAfter == undefined) {
    royalty.percentAfter = 0;
  }
  User.findOne({_id: royalty.partnerUserRefer}, function(err, user){
    if(!user) return;
    var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   user.userEmail, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Deny Royalty Partner',
      text:    '',  // Plain text
      html: 'Hi ' + royalty.ownerName + ',<br/><br/>' +
            '' + royalty.royaltyName + ' - ' + royalty.royaltyPartnerAddress + ' denied your request to ' + royalty.songAddress + '.<br/><br/>' +
            'Your request is to change the percentage of ' + royalty.royaltyPartnerAddress + ' from ' + royalty.percentBefore + '% to ' + royalty.percentAfter + '% at ' + royalty.dateIssue + '.'
    })({});
  });     
},


send_confirmation_email: function send_confirmation_email(email, id, privateKey){
  User.findOne({_id: id}, function(err, user){
    if(!user) return;
    var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   email, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Accont confirmation',
      text:    '',  // Plain text
      html: 'Hi, '+user.userFullName+'<br/><br/>' +
            'Here is your information:<br/><br/>' +
            'Account id: <b>' + user.userAccountName + '</b><br/><br/>' +
            'Finally step, click this link to complete your registration: <a href="'+default_confirm_url+id+'"> Confirmation </a>'
    })({}); 
  });  
},

send_approve_email: function send_approve_email(email, id, privateKey){
  User.findOne({_id: id}, function(err, user){
    if(!user) return;
    var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   email, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Acount Approved',
      text:    '',  // Plain text
      html: 'We are pleased to include you in our software launch<br/><br/>Your ID is '+user.userAccountName+'<br/><br/>'+
            // 'And your password - xxxxxabcd (reveal only last 4 character)<br/><br/>'+
            'Here is your Account No (public key) - '+user.userWalletAddress+'<br/><br/>'+
            'We will secure your Signature ID (private key)<br/><br/>'+
            'We will mail you your wallet if you want to maintain it yourself.<br/><br/>'+
            'Your wallet credentials are kept only for the purpose of Registration in our soft launch.<br/><br/>'+
            'We will mail you your wallet keys when we start licensing transaction.<br/><br/>'+
            'Spxtrum Pte Ltd'
    })({}); 
  });  
},

send_not_approve_email: function send_approve_email(email, id, privateKey){
  User.findOne({_id: id}, function(err, user){
    if(!user) return;
    var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   email, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Acount Approved',
      text:    '',  // Plain text
      html: 'We regret to inform you we are not able to include you in our soft launch.<br/><br/>'+
            'Thanks for your interest in our service'
    })({}); 
  });  
},

send_confirmation_email_for_mass_migration: function send_confirmation_email_for_mass_migration(email, id){
  User.findOne({_id: id}, function(err, user){
    if(!user) return;
    var send = require('gmail-send')({
      user: user_send_email,
      pass: pass_send_email,
      to:   email, 
      // cc:   'elroycheo@me.com,dovuthanh@gmail.com,limtaiwah@mac.com',
      subject: 'Acount confirmation',
      text:    '',  // Plain text
      html: 'Hi, '+user.userFullName+'<br/><br/>' +
            'Here is your information:<br/><br/>' +
            'Account id: <b>' + user.userAccountName + '</b><br/><br/>' +
            'Finally step, click this link to complete your registration: <a href="'+default_confirm_url+id+'"> Confirmation </a>'
    })({}); 
  });
},
   
};





