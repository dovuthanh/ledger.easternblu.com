var UserVoucher     = require('../models/user_voucher');
var Voucher 		= require('../models/voucher');
var History 		= require('../models/histories');
var VoucherType 	= require('../models/voucher_type');
var VoucherAmount 	= require('../models/voucher_amount');
var ShopCart 		= require('../models/shopcart');	
var Guid            = require('guid');
var csrf_guid       = Guid.raw();
var crypto      	= require('crypto');
var email_helpler   = require('./email');
var rs 				= require('random-strings');
const Request       = require('request');
var multer 			= require('multer');
var bcrypt   		= require('bcrypt-nodejs');
var kue         	= require('kue'),
queue = kue.createQueue();
const itemLimit 	= 20;
const api_version   = 2.7;
const app_id        = process.env.FB_APP_ID;
const app_secret    = process.env.FB_APP_SECRET;
var Promise = require('promise');
const Stripe = require('stripe')('sk_test_XPqG08oJWkRZgLkWTOoXzg02');

const _ = require('lodash');
const BlockChain 	= require('./blockchain.js');
const Config = require('../../config/config');

var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider(Config.LinkTestNet));
const SolFunction = require('web3/lib/web3/function');

module.exports  = function(app, passport, paginate) {
	// var vc = [];
	// for (var i = 0; i < 50; i++) {
	// 	var voucher = new Voucher();
	// 	voucher.ownerAddress = '0x3bb24126614a675bf00558bb16d2b41b0129a1af';
	// 	voucher.ownerEmail = 'test1@vinsofts.net';
	// 	voucher.status = 'active';
	// 	voucher.type = 'Licensing';
	// 	voucher.amount = 20;
	// 	voucher.discount = 5;
	// 	voucher.code = makecode();
	// 	voucher.createdAt = Date();
	// 	voucher.updatedAt = Date();
	// 	vc.push(voucher);
	// }

	// Voucher.insertMany(vc, function(err2, result){
	// 	if (err2) {
	// 		console.log('Create failed');
	// 	}else{
	// 		console.log('Create successed');
	// 	}
	// });

	//for web
	app.get('/vouchers/voucher-index', async function(req, res){
		var voucherIDs = [];
		if (req.session.shopcart != undefined) {
			var shopcart = new ShopCart(req.session.shopcart);
			const collection = shopcart.getItems();

			collection.forEach((cart) => {
				voucherIDs.push(cart._id);
			});
		}

		var _id;
		if (req.session.userVoucher != undefined) {
			_id = req.session.userVoucher._id;
		}
		if (_id != undefined && _id.length != 0) {
			const [user] = await Promise.all([
				UserVoucher.findOne({_id: _id}).exec()
			]);

			if (user && user.type == 'investor') {
				res.redirect('/vouchers/mamagement-vouchers');
				return;
			}
		}
		const [results, itemCount] = await Promise.all([
			Voucher.find({status: 'active'}).limit(req.query.limit).skip(req.skip).sort({_id: 'desc'}).exec(),
			Voucher.count({status: 'active'})
		]);
		const pageCount = Math.ceil(itemCount / req.query.limit);

		res.render('vouchers/index_vouchers', {
			session: req.session,
			vouchers: results,
			voucherIDs: voucherIDs,
			itemCount: itemCount,
			pageCount: pageCount,
			pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
			menu_index: 'voucher-index'
		});
	});

	app.get('/vouchers/sign-in', function(req, res){
	    res.render('vouchers/vouchers_login', {});
	});

	app.get('/vouchers/register', function(req, res){
	    res.render('vouchers/vouchers_guest_register', {});
	});

	app.get('/vouchers/create-investor', checkOwnerRole, function(req, res){

	});

	app.post('/vouchers/create-investor', multer().fields([]), checkOwnerRole, function(req, res){
		var data = req.body;
		console.log(data);
		if (!data) {
			return res.json(200, {status: 400, message: 'Bad request.'});
		}
		if (data.token == undefined || data.token.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request.'});
		}
		if (data.email == undefined || data.email.length == 0) {
			return res.json(200, {status: 400, message: 'Email cannot be empty.'});
		}
		if (data.role == undefined || data.role.length != 42 || !data.role.startsWith('0x')) {
			return res.json(200, {status: 400, message: 'Account ID is invalid.'});
		}
		if (data.password == undefined || data.password.length < 6 || data.password.length > 32) {
			return res.json(200, {status: 400, message: 'Password length is 6-32 characters.'});
		}

		UserVoucher.findOne({email: data.email.toLowerCase()}).exec(function(err, user){
			if (user) {
				return res.json(200, {status: 401, message: 'Email already taken.'});
			}
			var user = new UserVoucher();
			user.role = data.role.toLowerCase();
			user.email = data.email.toLowerCase();
			user.type = 'investor';
			user.password = user.generateHash(data.password);

			user.save(function(err1){
				if (!err1) {
					return res.json(200, {status: 200, message: 'Register successed!'});
				}else{
					return res.json(200, {status: 400, message: 'Register failed.'});
				}
			});
		});
	});

	app.get('/vouchers/mamagement-vouchers', isLoggedIn, async function(req, res){
		var _id = req.session.userVoucher._id;
		if (_id == undefined || _id.length == 0) {
			res.redirect('/404');
		}
		UserVoucher.findOne({_id: _id}).exec(async function(err, user){
			if (user && !err) {
				if (user.type == 'admin') {
					const [results, itemCount] = await Promise.all([
						Voucher.find({}).limit(req.query.limit).skip(req.skip).sort({_id: 'desc'}).exec(),
						Voucher.count({})
					]);
					const pageCount = Math.ceil(itemCount / req.query.limit);

					res.render('vouchers/my_vouchers', {
						session: req.session,
						vouchers: results,
						pageCount: pageCount,
        				itemCount: itemCount,
        				pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
						menu_index: 'management-vouchers'
					});
				}else if (user.type == 'standard') {
					const [results, itemCount] = await Promise.all([
						Voucher.find({buyerAddress: user.email}).limit(req.query.limit).skip(req.skip).sort({_id: 'desc'}).exec(),
						Voucher.count({buyerAddress: user.email})
					]);
					const pageCount = Math.ceil(itemCount / req.query.limit);

					res.render('vouchers/my_vouchers', {
						session: req.session,
						vouchers: results,
						pageCount: pageCount,
        				itemCount: itemCount,
        				pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
						menu_index: 'management-vouchers'
					});
				}else if (user.type == 'investor'){
					const [results, itemCount] = await Promise.all([
						Voucher.find({ownerAddress: user.role}).limit(req.query.limit).skip(req.skip).sort({_id: 'desc'}).exec(),
						Voucher.count({ownerAddress: user.role})
					]);
					const pageCount = Math.ceil(itemCount / req.query.limit);

					res.render('vouchers/my_vouchers', {
						session: req.session,
						vouchers: results,
						pageCount: pageCount,
        				itemCount: itemCount,
        				pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
						menu_index: 'management-vouchers'
					});
				}else{
					res.redirect('/404');
				}
			}else{
				res.redirect('/404');
			}
		});
	});

	app.get('/vouchers/request-vouchers', checkInvestorRole, async function(req, res){
		//web browser
		res.render('vouchers/request_vouchers', {
			userVoucher: req.session.userVoucher,
			menu_index: 'request-vouchers'
		});
	});

	app.get('/vouchers/request-vouchers/:token', async function(req, res){
		var token = req.params.token;
		if (token == undefined || token.length == 0) {
			if (!req.session.userVoucher) {
				res.redirect('/permission');
				return;
	        }
		}
		// client
		const [user] = await Promise.all([
			UserVoucher.findOne({token: token}).exec()
		]);

		if (!user) {
			res.redirect('/permission');
			return;
		}
		if (user.type != 'investor') {
			res.redirect('/permission');
			return;
		}
		res.render('vouchers/request_vouchers', {
			userVoucher: user,
			menu_index: 'request-vouchers'
		});
	});

	app.get('/vouchers/shop-cart', async function(req, res){
		if (req.session.shopcart == undefined) {
			res.render('vouchers/voucher_shop_cart', {
				session: req.session,
				vouchers: [],
				itemCount: 0,
				pageCount: 0,
				pages: paginate.getArrayPages(req)(10, 0, req.query.page),
				menu_index: 'shop-cart'
			});
			return;
		}
		var shopcart = new ShopCart(req.session.shopcart);
		const collection = shopcart.getItems();
		console.log(collection);

		var voucherIDs = [];
		collection.forEach((cart) => {
			voucherIDs.push(cart._id);
		});

		const [vouchers, itemCount] = await Promise.all([
			Voucher.find({_id: {$in: voucherIDs}, status: 'active'}, {code: 0})
					.skip(req.skip)
					.limit(req.query.limit)
					.sort({_id: 'desc'})
					.exec(),
			Voucher.count({_id: {$in: voucherIDs}})
		]);

		const pageCount = Math.ceil(itemCount / req.query.limit);

		res.render('vouchers/voucher_shop_cart', {
			session: req.session,
			vouchers: vouchers,
			itemCount: itemCount,
			pageCount: pageCount,
			pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
			menu_index: 'shop-cart'
		});
	});

	app.get('/vouchers/add-to-shop-cart/:id', function(req, res) {
		var _id = req.params.id;
		var cart = new ShopCart(req.session.shopcart ? req.session.shopcart : {});
		cart.add(_id);
		req.session.shopcart = cart;

		return res.json(200, {error: 0, msg: "ok", id: _id});
	});

	app.get('/vouchers/remove-from-shop-cart/:id', function(req, res) {
		var _id = req.params.id;
		var cart = new ShopCart(req.session.shopcart ? req.session.shopcart : {});
		cart.remove(_id);
        req.session.shopcart = cart;
        return res.json(200, {error: 0, msg: "ok", id: _id});
	});

	app.post('/vouchers/vouchers-validate-active', async function(req, res) {
		var data = req.body;
		console.log(data);

		var ids = data.ids;
		var failedIDs = [];
		var allowanceIDs = [];

		if (req.session.userVoucher == undefined) {
			return res.json(200, {error: 2, msg: 'unauthorised'});
		}

		if (ids == undefined || ids.length == 0) {
			return res.json(200, {error: 1, msg: 'Bad Request'});
		}

		const [vouchers] = await Promise.all([
			Voucher.find({_id: {$in: ids}}, {code: 0}).exec()
		]);

		if (vouchers.length == 0) {
			return res.json(200, {error: 1, msg: 'Cannot buy'});
		}

		vouchers.forEach((voucher) => {
			if (voucher.status != 'active') {
				failedIDs.push({id: voucher._id, errmsg: 'Voucher not ready to buy'});
			}else{
				allowanceIDs.push(voucher);
			}
		});

		return res.json(200, {error: 0, msg: 'checked', failure: failedIDs, allowance: allowanceIDs});
	});

	app.get('/vouchers/w/investor-balances', function(req, res){
		var _id = req.param('id');
		if (_id == undefined || _id.length == 0) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}
		UserVoucher.findOne({_id: _id}).exec(async function(err, user) {
			if (!user || err) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}
			const resultsETH = await web3.eth.getBalance(user.role);
			console.log(resultsETH);

			var eSPXInterface = web3.eth.contract(Config.Sol_SPXTROSInterface);
    		var eSPXI = eSPXInterface.at(Config.SPXTokenAddress);
    		const resultsSP8 = await eSPXI.balanceOf.call(user.role, { from: user.role });
    		console.log(user.role);
    		console.log(resultsSP8);

    		const etherBalance = web3.fromWei(resultsETH, 'ether').valueOf();
    		const sp8Balance = web3.fromWei(resultsSP8, "wei").valueOf() / 10 ** 18;
    		return res.json(200, {status: 200, message: 'Balance', data: {'ETH': etherBalance, 'SP8': ''+sp8Balance+''}});
		});
	});

	app.get('/vouchers/transaction-history', isLoggedIn, async function(req, res) {
		const _id = req.session.userVoucher._id;
		if (_id == undefined || _id.length == 0) {
			res.redirect('/404');
		}
		UserVoucher.findOne({_id: _id}).exec(async function(err, user) {
			if (!user || err || user.type == 'standard') {
				res.redirect('/permission');
			}
			if (user.type == 'admin') {
				const [results, itemCount] = await Promise.all([
					History.find({}).limit(req.query.limit).skip(req.skip).sort({_id: 'desc'}).exec(),
					History.count({})
				]);
				const pageCount = Math.ceil(itemCount / req.query.limit);

				res.render('vouchers/vouchers_histories', {
					session: req.session,
					histories: results,
					itemCount: itemCount,
					pageCount: pageCount,
					pages: paginate.getArrayPages(req)(10, pageCount, req.query.limit),
					menu_index: 'transaction-history'
				});
			}else{
				const [results, itemCount] = await Promise.all([
					History.find({buyer: user.role}).limit(req.query.limit).skip(req.skip).sort({_id: 'desc'}).exec(),
					History.count({buyer: user.role})
				]);
				const pageCount = Math.ceil(itemCount / req.query.limit);

				res.render('vouchers/vouchers_histories', {
					session: req.session,
					histories: results,
					itemCount: itemCount,
					pageCount: pageCount,
					pages: paginate.getArrayPages(req)(10, pageCount, req.query.limit),
					menu_index: 'transaction-history'
				});
			}
		});
	});

	app.post('/vouchers/w/change-discount', checkInvestorRole, function(req, res) {
		var data = req.body;
		console.log(data);
		var id = req.session.userVoucher._id;
		if (id == undefined || data.length == 0) {
			return res.json(200, {status: 400, message: 'Permission denied.'});
		}
		UserVoucher.findOne({_id: id}).exec(function(err, user){
			if (err || !user) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}
			if (user.type != 'investor') {
				return res.json(200, {status: 400, message: 'Permission denied.'});
			}
			user.discount = data.discount;
			user.save(function(err1){
				if (err1) {
					return res.json(200, {status: 400, message: 'Request failed'});
				}
				Voucher.find({ownerAddress: user.role}).exec(function(err2, vouchers){
					var ids = [];
					vouchers.forEach(function(voucher){
						ids.push(voucher._id);
					});
					Voucher.update({
						$and: [
							{_id: {$in: ids}},
							{
								$or: [
									{status: 'active'},
									{status: 'inactive'}
								]
							}
						]}, {$set: {discount: data.discount}}, {multi: true}, function(err3, result){
						if (err3) {
							return res.json(200, {status: 400, message: 'Discount failed'});
						}
						return res.json(200, {status: 200, message: 'Discount successed'});
					});
				});
			});
		});
	});

	app.post('/vouchers/w/charge', async function(req, res) {
		var data = req.body;
		console.log(data);

		if (data.length == 0) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}

		var _id = req.session.userVoucher._id;
		const [user] = await Promise.all([
			UserVoucher.findOne({_id: _id}).exec()
		]);

		if (!user) {
			return res.json(200, {status: 401, message: 'Unauthorized'});
		}
		if (user.type != 'standard') {
			return res.json(200, {status: 400, message: 'You cannot buy vouchers. Please to contact admin.'});
		}

		var [list] = await Promise.all([
			Voucher.find({_id: {$in: data.ids}}).exec()
		]);

		var failedList = [];
		var completedList = [];
		if (list) {
			list.forEach((vc) => {
				if (vc.status != 'active') {
					failedList.push({id: vc._id, msg: 'Voucher already used'});
				}
				if (vc.status == 'active') {
					completedList.push({id: vc._id, msg: 'ok'});
				}
			});
		}
		
		var tokenID = data.stripeToken;
		Stripe.charges.create({
			card: tokenID,
			currency: 'usd',
			amount: Math.ceil(data.amount)
		}, (err, charge) => {
			console.log(err, charge);
			if (err) {
				return res.json(200, {status: 700, message: 'Cannot request Stripe'});
			}
			Voucher.update({
				$and: [
					{_id: {$in: data.ids}},
					{status: 'active'}
				]
			}, {$set: {status: 'sold', buyerAddress: user.email, updatedAt: Date()}}, {multi: true}, function(err1, result){
				if (err1) {
					return res.json(200, {status: 701, message: 'An unexpected error occurred. Please contact with admin'});
				}
				return res.json(200, {status: 204, message: 'Buy successed', failure: failedList, successed: completedList});
			});
		});
	});

	app.post('/vouchers/w/request-vouchers', checkInvestorRole, function(req, res){
		var data = req.body;
		console.log(data);

		if (data == undefined || data.length == 0) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}

		var _id = req.session.userVoucher._id;
		UserVoucher.findOne({_id: _id}).exec((err, user) => {
			if (err || !user) {
				return res.json(200, {status: 400, message: 'Bad Request'});
			}
			var msg = BlockChain.strToHash('REQUESTVOUCHER');
			deploy_voucher_transaction(msg, data.signature, user, data.vouchers, res);
		});
	});

	//for both
	app.get('/vouchers/all-vouchers-type-active', function(req, res){
		VoucherType.find({status: 'active'}).exec(function(err, types) {
			if (!types || err) {
				return res.json(200, {status: 400, message: 'Request failed'});
			}
			return res.json(200, {status: 200, message: 'List vouchers type', data: types});
		});
	});

	app.get('/vouchers/all-vouchers-amount-active', function(req, res) {
		VoucherAmount.find({status: 'active'}).exec(function(err, amounts) {
			if (!amounts || err) {
				return res.json(200, {status: 400, message: 'Request failed'});
			}
			return res.json(200, {status: 200, message: 'List vouchers amount', data: amounts});
		});
	});

	app.post('/vouchers/sign-in', multer().fields([]), async function(req, res){
		var data = req.body;
		console.log(data);
		if (!data) {
			return res.json(200, {status: 400, message: 'Bad request.'});
		}
		if (data.email == undefined || data.email.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request.'});
		}
		if (data.password == undefined || data.password.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request.'});
		}
		if (data.type == undefined || data.type.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request.'});
		}
		var required = false;
		if (data.type == 'investor') {
			if (data.role == undefined || data.role.length == 0) {
				return res.json(200, {status: 400, message: 'Bad request.'});
			}
			required = true;
		}
		const [user] = await Promise.all([UserVoucher.findOne({email: data.email.toLowerCase()}).exec()]);

		if (!user) {
			return res.json(200, {status: 401, message: 'Email or password invalid.'});
		}
		if (!user.validPassword(data.password)) {
			return res.json(200, {status: 401, message: 'Email or password invalid.'});
		}
		if (required) {
			if (user.role.toLowerCase() != data.role.toLowerCase()) {
				return res.json(200, {status: 401, message: 'Permission denied.'});
			}
		}
		if(user.type != data.type){
			return res.json(200, {status: 401, message: 'Permission denied.'});
		}

		if (data.browser == undefined || data.browser != 'w') {
			user.token = crypto.randomBytes(48).toString('hex');
			console.log(user.token);
		}
		req.session.userVoucher = user;

		user.save(function(err1){
			var response = {
				id: user._id,
				email: user.email,
				role: user.role,
				token: user.token,
				type: user.type,
				discount: user.discount
			}
			return res.json(200, {status: 200, message: 'Login successed', user: response});
		});
	});

	app.post('/vouchers/register', multer().fields([]), function(req, res){
		var data = req.body;
		console.log(data);
		if (data) {
			if (data.email == undefined || data.email.length == 0) {
				return res.json(200, {status: 400, message: 'Email cannot be empty.'});
			}
			if (data.password == undefined || data.password.length < 6 || data.password.length > 32) {
				return res.json(200, {status: 400, message: 'Password length is 6-32 characters.'});
			}

			UserVoucher.findOne({email: data.email.toLowerCase()}).exec(function(err, user){
				if (user) {
					return res.json(200, {status: 401, message: 'Email already taken.'});
				}else{
					var user = new UserVoucher();
					user.email = data.email.toLowerCase();
					user.type = 'standard';
					user.role = '';
					user.password = user.generateHash(data.password);

					user.save(function(err1){
						if (!err1) {
							return res.json(200, {status: 200, message: 'Register successed!'});
						}else{
							return res.json(200, {status: 400, message: 'Register failed.'});
						}
					});
				}
			});
		}else{
			return res.json(200, {status: 400, message: 'Bad request'});
		}
	});

	//for client
	app.get('/vouchers/investor-balances', async function(req, res) {
		var token = req.param('token');
		if (token == undefined || token.length == 0) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}
		UserVoucher.findOne({token: token}).exec(async function(err, user) {
			if (!user || err) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}
			if (user.type != 'investor') {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}
			const resultsETH = await web3.eth.getBalance(user.role);
			console.log(resultsETH);

			var eSPXInterface = web3.eth.contract(Config.Sol_SPXTROSInterface);
    		var eSPXI = eSPXInterface.at(Config.SPXTokenAddress);
    		const resultsSP8 = await eSPXI.balanceOf.call(user.role, { from: user.role });
    		console.log(resultsSP8);

    		const etherBalance = web3.fromWei(resultsETH, 'ether').valueOf();
    		const sp8Balance = web3.fromWei(resultsSP8, "wei").valueOf() / 10 ** 18;
    		return res.json(200, {status: 200, message: 'Balance', data: {'ETH': etherBalance, 'SP8': ''+sp8Balance+''}});
		});
	});

	app.get('/vouchers/my-vouchers', async function(req, res){
		var token = req.param('token');
		var offset = req.param('offset');

		if (token == undefined || token.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request'});
		}
		if (offset == undefined || offset < 0) {
			offset = 0;
		}
		UserVoucher.findOne({token: token}).exec(async function(err, user){
			console.log(user);
			if (!user || err) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}

			var condition = {};
			if (user.type == 'standard') {
				condition = {buyerAddress: user.email};
			}else if (user.type == 'investor'){
				condition = {ownerAddress: user.role};
			}
			var vouchers;
			if (offset != 0) {
				[vouchers] = await Promise.all([
					Voucher.find(condition)
						   	.limit(itemLimit)
						   	.skip(Number(offset))
						   	.sort({_id: 'desc'})
						   	.exec()
				]);
			}else{
				[vouchers] = await Promise.all([
					Voucher.find(condition)
						   	.limit(itemLimit)
						   	.sort({_id: 'desc'})
						   	.exec()
				]);
			}

			if (vouchers == undefined || vouchers.length == 0) {
				return res.json(200, {status: 200, message: 'List vouchers', data: []});
			}
			return res.json(200, {status: 200, message: 'List vouchers', data: vouchers});
		});
	});

	app.get('/vouchers/all-active-vouchers', async function(req, res){
		var offset = req.param('offset');
		if (offset == undefined || offset < 0) {
			offset = 0;
		}
		var vouchers;
		if (offset != 0) {
			[vouchers] = await Promise.all([
				Voucher.find({status: 'active'}, {code: 0})
						.limit(itemLimit)
						.skip(Number(offset))
						.sort({_id: 'desc'})
						.exec()
			]);
		}else{
			[vouchers] = await Promise.all([
				Voucher.find({status: 'active'}, {code: 0})
						.limit(itemLimit)
						.sort({_id: 'desc'})
						.exec()
			]);
		}

		if (vouchers == undefined || vouchers.length == 0) {
			return res.json(200, {status: 400, message: 'Empty', data: []});
		}
		return res.json(200, {status: 200, message: 'Active vouchers', data: vouchers});
	});

	app.get('/vouchers/search-vouchers', async function(req, res) {
		var token = req.param('token');
		var key = req.param('key');
		var offset = req.param('offset');
		if (key == undefined || key.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request'});
		}
		if (offset == undefined || offset < 0) {
			offset = 0;
		}

		var vouchers;
		if (token == undefined || token.length == 0) {
			[vouchers] = await Promise.all([
				Voucher.find({
					$and: [
						{ownerEmail: new RegExp(key, 'i')},
						{status: 'active'}
					]
				}, {code: 0})
				.skip(Number(offset))
				.limit(itemLimit)
				.exec()
			]);
		}else{
			const [user] = await Promise.all([
				UserVoucher.findOne({token: token}).exec()
			]);

			if (!user) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}

			var condition = {};
			var option = {};
			if (user.type == 'investor') {
				condition = {
					$and: [
						{code: new RegExp(key, 'i')},
						{ownerEmail: user.email}
					]
				}
			}
			if (user.type == 'admin') {
				condition = {
					$or: [
						{code: new RegExp(key, 'i')},
						{ownerEmail: new RegExp(key, 'i')}
					]
				};
			}
			if (user.type == 'standard') {
				condition = {
					$or:[
						{
							$and: [
								{ownerEmail: new RegExp(key, 'i')},
								{buyerAddress: user.email}
							]
						},
						{
							$and: [
								{buyerAddress: user.email},
								{code: new RegExp(key, 'i')}
							]
						}
					]
				};
			}
			[vouchers] = await Promise.all([
				Voucher.find(condition)
						.skip(Number(offset))
						.limit(itemLimit)
						.exec()
			]);

			if (user.type == 'standard') {
				var list = [];
				vouchers.forEach((voucher) => {
					if (voucher.status == 'active') {
						voucher.code = '';
					}
					list.push(voucher);
				});

				vouchers = list;
			}
		}

		if (vouchers == undefined || vouchers.length == 0) {
			return res.json(200, {status: 200, message: 'List vouchers', data: []});
		}
		return res.json(200, {status: 200, message: 'List vouchers', data: vouchers});
	});

	app.get('/vouchers/filter-vouchers', async function(req, res) {
		var token = req.param('token');
		var status = req.param('status');
		var type = req.param('type');
		// var amount = req.param('amount');
		var start = req.param('start');
		var end = req.param('end');
		var offset = req.param('offset');
		if (offset == undefined || offset < 0) {
			offset = 0;
		}
		if (start == undefined) {
			start = 0;
		}
		if (end == undefined) {
			end = 100;
		}

		console.log(start, end, offset);
		var vouchers;
		if (token == undefined || token.length == 0) {
			var condition = {};
			if (type == undefined || type.length == 0) {
				condition = {
					$and: [
						{amount: {$gte: start, $lte: end}},
						{status: 'active'}
					]
				};
			}else{
				condition = {
					$and: [
						{type: type},
						{amount: { $gte: start, $lte: end }},
						{status: 'active'}
					]
				};
			}

			[vouchers] = await Promise.all([
				Voucher.find(condition, {code: 0})
						.skip(Number(offset))
						.limit(itemLimit)
						.exec()
			]);
		}else{
			const [user] = await Promise.all([
				UserVoucher.findOne({token: token}).exec()
			]);

			if (!user) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}

			var condition;
			if (user.type == 'investor') {
				if (status == undefined || status.length == 0) {
					return res.json(200, {status: 400, message: 'Bad request'});
				}
				condition = {
					$and: [
						{status: status},
						{ownerAddress: user.role}
					]
				};
			}
			if (user.type == 'standard') {
				if (type == undefined || type.length == 0) {
					condition = {
						$and: [
							{amount: { $gte: start, $lte: end }},
							{buyerAddress: user.email}
						]
					};
				}else{
					condition = {
						$and: [
							{type: type},
							{amount: { $gte: start, $lte: end }},
							{buyerAddress: user.email}
						]
					};
				}
			}

			[vouchers] = await Promise.all([
				Voucher.find(condition)
						.skip(Number(offset))
						.limit(itemLimit)
						.exec()
			]);

			var list = [];
			vouchers.forEach((voucher) => {
				if (user.type == 'standard' && voucher.status == 'active') {
					voucher.code = '';
				}
				list.push(voucher);
			});

			vouchers = list;
		}

		console.log(vouchers.length);
		if (!vouchers) {
			return res.json(200, {status: 200, message: 'List vouchers', data: []});
		}
		return res.json(200, {status: 200, message: 'List vouchers', data: vouchers});
	});

	app.get('/vouchers/history', async function(req, res) {
		var token = req.param('token');
		var offset = req.param('offset');

		if (token == undefined || token.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request'});
		}
		if (offset == undefined || offset < 0) {
			offset = 0;
		}

		UserVoucher.findOne({token: token}).exec(async function(err, user){
			if (!user || user.type == 'standard' || err) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}
			var condition = {};
			if (user.type == 'admin') {
				condition = {};
			}else{
				condition = {buyer: user.role};
			}

			var histories;
			if (offset != 0) {
				[histories] = await Promise.all([
					History.find(condition)
							.limit(itemLimit)
							.skip(Number(offset))
							.sort({_id: 'desc'})
							.exec()
				]);
			}else{
				[histories] = await Promise.all([
					History.find(condition)
							.limit(itemLimit)
							.sort({_id: 'desc'})
							.exec()
				]);
			}

			if (histories == undefined || histories.length == 0) {
				return res.json(200, {status: 200, message: 'Transaction history', data: []});
			}
			return res.json(200, {status: 200, message: 'Transaction history', data: histories});
		});
	});

	app.get('/vouchers/history-detail', function(req, res) {
		var token = req.param('token');
		var _id = req.param('id');
		if (token == undefined || token.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request'});
		}
		if (_id == undefined || _id.length == 0) {
			return res.json(200, {status: 400, message: 'Bad request'});
		}
		UserVoucher.findOne({token: token}).exec(function(err, user){
			if (!user || user.type == 'standard' || err) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}
			History.findOne({_id: _id}).exec(function(err1, history) {
				if (err || !history) {
					return res.json(200, {status: 400, message: 'Not Found'});
				}
				return res.json(200, {status: 200, message: 'Transaction history detail', data: history});
			});
		});
	});

	app.post('/vouchers/request-vouchers', multer().fields([]), async function(req, res){
		var data = req.body;
		console.log(data);

		if (data.token == undefined || data.total_tokens == undefined || data.signature == undefined) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}

		UserVoucher.findOne({token: data.token}).exec(function(err, user){
			if (err || !user) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}
			var msg = web3.sha3('REQUESTVOUCHER');
			deploy_voucher_transaction(msg, data.signature, user, data.vouchers, res);
		});
	});

	app.post('/vouchers/buy-vouchers', multer().fields([]), async function(req, res){
		var data = req.body;
		console.log(data);

		if (data.token == undefined || data.ids == undefined || data.ids == []) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}

		const [user] = await Promise.all([
			UserVoucher.findOne({token: data.token}).exec()
		]);

		if (!user) {
			return res.json(200, {status: 401, message: 'Unauthorized'});
		}
		if (user.type != 'standard') {
			return res.json(200, {status: 400, message: 'You cannot buy vouchers. Please to contact admin.'});
		}

		var [list] = await Promise.all([
			Voucher.find({_id: {$in: data.ids}}).exec()
		]);

		var failedList = [];
		var completedList = [];
		if (list) {
			list.forEach((vc) => {
				if (vc.status != 'active') {
					failedList.push({id: vc._id, msg: 'Voucher already used'});
				}
				if (vc.status == 'active') {
					completedList.push({id: vc._id, msg: 'ok'});
				}
			});
		}

		var tokenID = data.stripeToken;
		Stripe.charges.create({
			card: tokenID,
			currency: 'usd',
			amount: Math.ceil(data.amount)
		}, (err, charge) => {
			console.log(err, charge);
			if (err) {
				return res.json(200, {status: 700, message: 'Cannot request Stripe'});
			}
			Voucher.update({
				$and: [
					{_id: {$in: data.ids}},
					{status: 'active'}
				]
			}, {$set: {status: 'sold', buyerAddress: user.email, updatedAt: Date()}}, {multi: true}, function(err1, result){
				if (err1) {
					return res.json(200, {status: 701, message: 'An unexpected error occurred. Please contact with admin'});
				}
				return res.json(200, {status: 204, message: 'Buy successed', failure: failedList, successed: completedList});
			});
		});
	});

	app.post('/vouchers/change-discount', multer().fields([]), function(req, res){
		var data = req.body;
		console.log(data);

		if (data.token == undefined || data.discount == undefined) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}
		UserVoucher.findOne({token: data.token}).exec(function(err, user){
			if (err || !user) {
				return res.json(200, {status: 401, message: 'Unauthorized'});
			}
			if (user.type != 'investor') {
				return res.json(200, {status: 400, message: 'Permission denied.'});
			}
			user.discount = data.discount;
			user.save(function(err1){
				if (err1) {
					return res.json(200, {status: 400, message: 'Request failed'});
				}
				Voucher.find({ownerAddress: user.role}).exec(function(err2, vouchers){
					var ids = [];
					vouchers.forEach(function(voucher){
						ids.push(voucher._id);
					});
					Voucher.update({
						$and: [
							{_id: {$in: ids}},
							{
								$or: [
									{status: 'active'},
									{status: 'inactive'}
								]
							}
						]}, {$set: {discount: data.discount}}, {multi: true}, function(err3, result){
						if (err3) {
							return res.json(200, {status: 400, message: 'Discount failed'});
						}
						return res.json(200, {status: 200, message: 'Discount successed'});
					});
				});
			})
		});
	});

	app.post('/vouchers/update-voucher-status', multer().fields([]), async function(req, res) {
		var data = req.body;
		if (data.token == undefined || data.id == undefined || data.status == undefined) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}
		const [user] = await Promise.all([
			UserVoucher.findOne({token: data.token}).exec()
		]);

		if (!user) {
			return res.json(200, {status: 401, message: 'Unauthorized'});
		}
		if (user.type != 'investor') {
			return res.json(200, {status: 400, message: 'Permission denied.'});
		}
		const [voucher] = await Promise.all([
			Voucher.findOne({_id: data.id}).exec()
		]);

		if (!voucher) {
			return res.json(200, {status: 400, message: 'Voucher not found.'});
		}
		if (voucher.status != 'active' && voucher.status != 'inactive') {
			return res.json(200, {status: 400, message: 'Cannot active/inactive voucher.'});
		}
		if (voucher.status == 'active' && data.status) {
			return res.json(200, {status: 400, message: 'Voucher already active.'});
		}
		if (voucher.status == 'inactive' && !data.status) {
			return res.json(200, {status: 400, message: 'Voucher already inactive.'});
		}
		voucher.status = data.status ? 'active' : 'inactive';
		voucher.save(function(err) {
			if (err) {
				return res.json(200, {status: 400, message: 'Cannot active/inactive voucher.'});
			}
			return res.json(200, {status: 200, message: 'Voucher active/inactive successed'});
		});
	});

	app.get('/vouchers/update-shopping-cart', async function(req, res){
		const ids_param = req.param('ids');
		if (ids_param == undefined || ids_param.length == 0) {
			return res.json(200, {status: 400, message: 'Bad Request'});
		}
		const ids = ids_param.split(',');

		var vouchers;
		[vouchers] = await Promise.all([
			Voucher.find({_id: {$in: ids}}, {code: 0})
					.sort({_id: 'desc'})
					.exec()
		]);

		if (vouchers == undefined || vouchers.length == 0) {
			return res.json(200, {status: 400, message: 'Empty', data: []});
		}
		return res.json(200, {status: 200, message: 'Active vouchers', data: vouchers});
	});

	app.get('/vouchers/logout', function(req, res) {
		req.session.userVoucher = undefined;
		res.redirect('/vouchers/voucher-index');
	});
}

function makecode() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 8; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function new_block_transaction (block_hash, user_id, to, from){
  var job = queue.create('request_vouchers', {
    txHash: block_hash,
    user_id: user_id,
    from: from,
    to: to
  });

  job
    .on('complete', function (){
      console.log(1232131);
    })
    .on('failed', function (){
      console.log(12321312323232);
    })

  job.save();
}

queue.process('request_vouchers', function(job, done){
    try{
        console.log(job.data.txHash);
        var receipt = web3.eth.getTransactionReceipt(job.data.txHash);
        if(receipt){
            console.log(receipt);
            var status = '';
            if (receipt.status == 0) {
            	status = 'failed';
            }else{
            	status = 'active';
            }
            Voucher.update({
        		blockHash: receipt.transactionHash
        	}, {$set: {
        		status: status,
        		updatedAt: Date()
        	}}, {multi: true}, function(err, result){
        		if (err) {
        			//send notification failured
        		}else{
        			//send notification successed
        		}
        	});
        }else{
            new_block_transaction(job.data.txHash, job.data.user_id, job.data.to, job.data.from);
        }
    }catch(ex){
        console.log(ex);
    }
    done && done();
});

async function deploy_voucher_transaction(msg, signature, user, vouchers, res) {
	var _voucherIDs = [];
	var _voucherAmounts = [];
	var _dateStarts = [];
	vouchers.forEach(function(raw_voucher){
		for (var i = 0; i < raw_voucher.quantity; i++) {
			var code = makecode();
			_voucherIDs.push(code);
			_voucherAmounts.push(raw_voucher.amount);
			var date = new Date();
			_dateStarts.push(date.getTime());
		}
	});

	if (!signature.startsWith('0x')) {
		signature = '0x' + signature;
	}
	var r = signature.substr(0, 66);
    var s = "0x" + signature.substr(66, 64);
    var v = "0x" + signature.substr(130, 2);

    console.log(msg, r, s, v, _voucherIDs, _voucherAmounts, _dateStarts);
	var solFunction = new SolFunction('', _.find(Config.Sol_SPXTROSInterface, {name: 'tokens2Vouchers'}), '');
	var payloadData = solFunction.toPayload([msg, r, s, v, _voucherIDs, _voucherAmounts, _dateStarts]).data;

	const serialized = await BlockChain.ethRawTx('contract', payloadData, Config.accountDefault, Config.SPXTokenAddress);
	BlockChain.ethSendRawTransaction(serialized, (err, hash) => {
		if (err || !hash) {
			return res.json(200, {status: 400, message: 'Transaction creation failed'});
		}
		var datalist = [];
		vouchers.forEach(function(raw_voucher){
			for (var i = 0; i < raw_voucher.quantity; i++) {
				var voucher = new Voucher();
				voucher.ownerAddress = user.role;
				voucher.ownerEmail = user.email;
				voucher.status = 'processing';
				voucher.type = raw_voucher.type;
				voucher.amount = _voucherAmounts[i];
				voucher.discount = user.discount;
				voucher.code = _voucherIDs[i];
				voucher.expried = new Date(_dateStarts[i] + 30 * 24 * 60 * 60 * 1000);
				voucher.blockHash = hash;
				voucher.createdAt = Date();
				voucher.updatedAt = Date();
				datalist.push(voucher);
			}
		});

		Voucher.insertMany(datalist, function(err, result){
			if (err) {
				return res.json(200, {status: 400, message: 'Request vouchers failed!'});
			}
			new_block_transaction(hash, user._id, user.email, '');
			return res.json(200, {status: 200, message: 'Request vouchers successed! Waitting for processing.'});
		});
	});
}

function isLoggedIn(req, res, next) {
    if (req){
    	if (req.session.userVoucher != undefined) {
    		return next();
    	}
    }
    res.redirect('/vouchers/sign-in');
}

function checkOwnerRole(req, res, next) {
    if(req){
        if (req.session.userVoucher) {
        	if (req.session.userVoucher.type == 'admin') {
        		return next();
        	}
        }
    }
    req.flash('info',"You don't have permission. Please login as owner role");
    res.redirect('/permission');
}

function checkInvestorRole(req, res, next) {
    if(req){
        if (req.session.userVoucher) {
        	if (req.session.userVoucher.type == 'investor') {
        		return next();
        	}
        }
    }
    req.flash('info',"You don't have permission. Please login as investor role");
    res.redirect('/permission');
}

function checkUserRole(req, res, next) {
    if(req){
        if (req.session.userVoucher) {
        	if (req.session.userVoucher.type == 'standard') {
        		return next();
        	}
        }
    }
    req.flash('info',"You don't have permission. Please login as user role");
    res.redirect('/permission');
}
