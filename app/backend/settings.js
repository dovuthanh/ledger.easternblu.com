var User        = require('../models/user');
var Country 	= require('../models/country');
var Guid        = require('guid');
var csrf_guid   = Guid.raw();
var Promise = require('promise');
const api_version   = 2.7;
const app_id        = process.env.FB_APP_ID;
const app_secret    = process.env.FB_APP_SECRET;

module.exports = function(app, passport){
	app.get('/settings', isLoggedIn, function(req, res){
		var key = req.param('key');

		if(key == undefined || key.length == 0)
		{
			var userWalletAddress = req.session.passport.user.userWalletAddress;
			if (userWalletAddress != undefined) {
				User.findOne({userWalletAddress: userWalletAddress}).exec(function(err, user){
					if (!err && user) {
						res.render('settings/settings', {
							_id: user._id,
							session: req.session,
							message: req.flash('message', ''),
							menu_index: 'settings',
							csrf: csrf_guid,
							app_id: app_id,
							version: 'v1.0'
						});
					}else{
						res.redirect('/404');
					}
				});
			}else{
				res.redirect('/404');
			}
		}else {
			res.redirect('/my-songs?key=' + key + '&type=song');
		}
		
	});

	app.get('/my-account', isLoggedIn, function(req, res){
		var userWalletAddress = req.session.passport.user.userWalletAddress;
		User.findOne({userWalletAddress: userWalletAddress}).exec(function(err, user){
			res.render('settings/my_account', {
				user: user
			});
		});
	});

	app.get('/account-management', isLoggedIn, function(req, res){
		var userWalletAddress = req.session.passport.user.userWalletAddress;
		User.find({
			$or: [
				{userWalletAddress: userWalletAddress},
				{userManagementAccount: userWalletAddress}
			]
		}).exec(function(err, users){
			res.render('settings/account_management', {
				users: users
			});
		});
	});

	app.get('/change-password', isLoggedIn, function(req, res){
		res.render('settings/change_password');
	});

	app.get('/change-mobile', isLoggedIn, function(req, res){
		res.render('settings/change_mobile');
	});

	app.get('/edit-account', isLoggedIn, function(req, res){
		var _id = req.param('id');
		var type = req.param('type');
		User.findOne({_id: _id}).exec(function(err, user){
			Country.find({}).exec(function(err1, countries){
				res.render('settings/update_user_info',{
					type: type,
					user: user,
					countries: countries
				});
			});
		});
	});

	app.get('/create-sub-user', isLoggedIn, function(req, res){
		Country.find({}).exec(function(err, countries){
			res.render('settings/create_sub_user', {
				countries: countries
			});
		});
	});

	app.post('/update-profile', isLoggedIn, function(req, res){
		var data = req.body;
		console.log(data);
		if (data) {
			User.findOne({_id: data.upd_user_id}).exec(function(err, user){
				if (!err && user) {
					// user.userIsCompany = data.upd_user_is_company;
					user.userEmail = data.upd_user_email;
					user.userFullName = data.upd_user_fullname;
					user.userAddress = data.upd_user_address;
					user.userCity = data.upd_user_city;
					user.userPostalZip = data.upd_user_postal;
					user.userCountry = data.upd_user_country;

					user.save(function(err1){
						if (!err) {
							return res.json(200, {error: 0, message: 'ok'});
						}else{
							return res.json(200, {error: 1, message: 'Error! Try again later.'});
						}
					});
				}else{
					return res.json(200, {error: 1, message: 'Error! Try again later.'});
				}
			});
		}else{
			return res.json(200, {error: 2, message: 'Error! Try again later.'});
		}
	});

	app.post('/create-sub-user', checkOwnerRole, function(req, res){
		var data = req.body;
		console.log(data);
		if(data){
			User.findOne({
				$or: [
					{userEmail: data.crt_user_email},
					{userWalletAddress: data.crt_user_wallet_address}
				]
			}).exec(function(err, user){
				if (user) {
					req.flash('message', "Email has been already in use");
					return res.json(200, {error: 1, message: 'Email has been already in use'});
				}else{
					var newUser = new User();
					newUser.userWalletAddress = data.crt_user_wallet_address;
					newUser.userManagementAccount = req.session.passport.userWalletAddress;
					newUser.userEmail = data.crt_user_email;
					newUser.userFullName = data.crt_user_fullname;
					newUser.userAddress = data.crt_user_address;
					newUser.userCity = data.crt_user_city;
					newUser.userPostalZip = data.crt_user_postal;
					newUser.userCountry = data.crt_user_country;
					newUser.userEmailVerified = false;
					newUser.userIsCompany = false;
					newUser.userIsOwner = false;
					newUser.userApproved = false;
					newUser.userPassword = newUser.generateHash(data.crt_pwd);

					user.save(function(err1){
						req.flash('message', "Create successful!");
						return res.json(200, {error: 0, message: 'ok'});
					});
				}
			});
		}else{
			req.flash('message', "Error! Try again later");
			return res.json(200, {error: 1, message: 'Error! Try again later'});
		}
	});

	app.post('/change-password', isLoggedIn, function(req, res){
		var data = req.body;
		console.log(data);
		if (data) {
			User.findOne({_id: data._id}).exec(function(err, user){
				console.log(user);
				if (!err && user) {
					if (user.validPassword(data.pwd_old)) {
						var new_pwd = user.generateHash(data.pwd_new);
						user.userPassword = new_pwd;
						user.save(function(err1){
							console.log(err1);
							if (!err1) {
								// req.flash('message', "Password changed successful!");
								return res.json(200, {error: 0, message: 'Password changed successful!'});
							}else{
								// req.flash('message', "Error! Try again later");
								return res.json(200, {error: 1, message: 'Error! Try again later'});
							}
						});
					}else{
						// req.flash('message', "Wrong password");
						return res.json(200, {error: 1, message: 'Wrong password'});
					}
				}else{
					// req.flash('message', "Error! Try again later");
					return res.json(200, {error: 1, message: 'Error! Try again later'});
				}
			});
		}else{
			// req.flash('message', "Error! Try again later");
			return res.json(200, {error: 1, message: 'Error! Try again later'});
		}
	});

	app.post('/update-phone-number', isLoggedIn, function(req, res){
		var data = req.body;
		if (data) {
			User.findOne({_id: data.usr_id}).exec(function(err, user){
				if (!err && user) {
					if (user.userCountryCode == data.usr_code && user.userPhone == data.usr_phone) {
						return res.json(200, {error: 1, message: 'Phone number must differ from old phone number'});
					}
					user.userCountryCode = data.usr_code;
					user.userPhone = data.usr_phone;
					user.save(function(err1){
						if (!err1) {
							// req.flash('message', "Phone number changed successful!");
							return res.json(200, {error: 0, message: 'Phone number changed successful!'});
						}else{
							// req.flash('message', "Error! Try again later");
							return res.json(200, {error: 1, message: 'Error! Try again later'});
						}
					});
				}else{
					// req.flash('message', "Error! Try again later");
					return res.json(200, {error: 1, message: 'Error! Try again later'});
				}
			});
		}else{
			// req.flash('message', "Error! Try again later");
			return res.json(200, {error: 1, message: 'Error! Try again later'});
		}
	});
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()){
        if(!req.session.passport.user.userEmailVerified){
            req.flash("loginMessage","Please verify your email");
            res.redirect('/email-confirmation?user_id='+req.session.passport.user._id);
        }else if(!req.session.passport.user.userSmsVerified){
            req.flash("loginMessage","Please verify your phone");
            res.redirect('/sms-confirmation?user_id='+req.session.passport.user._id);
        }else{
            return next();
        }
    }
    // res.flash('info','Please login');
    res.redirect('/sign-in');
}

function isLoggedInSignIn(req, res, next) {
    if(req){
        if (req.isAuthenticated())
            return next();
    }
}

function checkOwnerRole(req, res, next) {
    if(req){
        if (req.isAuthenticated()){
            if(!req.session.passport.user.userEmailVerified){
                 req.flash("loginMessage","Please verify your email");
                 res.redirect('/email-confirmation?user_id='+req.session.passport.user._id);
            }else if(!req.session.passport.user.userSmsVerified){
                req.flash("loginMessage","Please verify your phone");
                res.redirect('/sms-confirmation?user_id='+req.session.passport.user._id);
            } else if(req.session.passport.user.userIsOwner){
                return next();
            }
        }
    }
    req.flash('info',"You don't have permission. Please login as owner role");
    res.redirect('/permission');
}

function sha256 (data) {
  return crypto.createHash('sha256').update(data).digest()
}

function isHexString(value) {
    var re = /[0-9A-Fa-f]{6}/g;
    if(re.test(value)) {
        return true;
    } else {
        return false;
    }
}
