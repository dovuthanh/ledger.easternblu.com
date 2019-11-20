var User            = require('../models/user');
var Song            = require('../models/song');
var Order           = require('../models/order');
var Artist          = require('../models/artist');
var Composer        = require('../models/composer');
var Country         = require('../models/country');
var Voucher         = require('../models/voucher');
var Banner          = require('../models/banner');
var Post            = require('../models/post');
var WalletBK        = require('../models/walletbk');
var bcrypt          = require ('bcrypt');
var multer          = require('multer');
var bodyParser      = require('body-parser');
var path            = require('path');
var formidable      = require('formidable');
var fs              = require('fs');
var Guid            = require('guid');
var csrf_guid       = Guid.raw();
var email_helpler   = require('./email');
const crypto        = require('crypto');
const Request       = require('request');
const Querystring   = require('querystring');
const { forEach } = require('p-iteration');
const Config = require('../../config/config');
var pinyin = require("chinese-to-pinyin");
const Stripe = require('stripe')('sk_test_XPqG08oJWkRZgLkWTOoXzg02');
var Promise = require('promise');
// const Cryptr = require('cryptr');
const api_version   = 2.7;
const app_id        = process.env.FB_APP_ID;
const app_secret    = process.env.FB_APP_SECRET;
const me_endpoint_base_url      = process.env.ME_ENDPOINT_BASE_URL;
const token_exchange_base_url   = process.env.TOKEN_EXCHANGE_BASE_URL;
module.exports  = function(app, passport, paginate) {

app.get('/', async function(req, res) {
    req.flash('info', '');
    if(req.session.passport){
        if(req.session.passport.user){
            var user = req.session.passport.user;
            if(!user.hasOwnProperty("userEmailVerified") || !user.userEmailVerified){
                req.flash("loginMessage","Please go to you mail box and click confirmation link");
                res.redirect('/email-confirmation?user_id='+user._id);
            }else{
                if (!user.hasOwnProperty("userSmsVerified") || !user.userSmsVerified){
                    var usercode = user.userCountryCode;
                    if(usercode ==undefined){
                        usercode ="";
                    }
                    var userPhone = user.userPhone;
                    if(userPhone ==undefined){
                        userPhone ="";
                    }
                    req.flash("loginMessage","Please verify your phone number");
                    res.redirect('/sms-confirmation?user_id='+user._id);
                }else{
                    if(user.userIsAdmin){
                        var key = req.param('key');
                          const [ results, itemCount ] = await Promise.all([
                          User.find({
                            $and:[
                                {_id: {$ne: process.env.ADMIN_ID}},
                                {userWalletAddress: {$ne: null}},
                                {
                                    $or:[
                                            {userFullName: new RegExp(key, 'i')},
                                            {userNonRomanizedName: new RegExp(key, 'i')},
                                            {userEmail: new RegExp(key, 'i')},
                                            {userPhone: new RegExp(key, 'i')},
                                            {userManagerWalletAddress: new RegExp(key, 'i')},
                                            {userWalletAddress: new RegExp(key, 'i')}
                                        ]}
                            ]}).limit(req.query.limit).sort({_id:-1}).skip(req.skip).lean().exec(),
                          User.count({
                            $and:[
                                {_id: {$ne: process.env.ADMIN_ID}},
                                {userWalletAddress: {$ne: null}},
                                {
                                    $or:[
                                            {userFullName: new RegExp(key, 'i')},
                                            {userNonRomanizedName: new RegExp(key, 'i')},
                                            {userEmail: new RegExp(key, 'i')},
                                            {userPhone: new RegExp(key, 'i')},
                                            {userManagerWalletAddress: new RegExp(key, 'i')},
                                            {userWalletAddress: new RegExp(key, 'i')}
                                        ]}
                            ]})
                        ]);
                         const pageCount = Math.ceil((itemCount -1) / req.query.limit);
                        res.render('admin/admin', {
                            session: req.session,
                            menu_index: 'admin-users',
                            users: results,
                            key: key,
                            pageCount: pageCount,
                            itemCount: itemCount,
                            pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
                        });
                    }else{
                        if(!req.session.passport.user.userApproved){
                            res.redirect('/account-processing?user_id=' +req.session.passport.user._id );
                        }
                        const [itemCount] = await Promise.all([
                            Song.count({
                                $and:[
                                    {songIsMassRegistration: true},
                                    {songMerkleRoot: ''},
                                    {songOwnerId: user._id}
                                ]
                            })
                        ]);

                        const [itemCountMatched] = await Promise.all([
                            Song.count({
                                $and:[
                                    {songIsMassRegistration: true},
                                    {songMerkleRoot: ''},
                                    {songHash: { "$ne": "" }},
                                    {songOwnerId: user._id}
                                ]
                            })
                        ]);
                        
                        if(itemCount > 0 && itemCountMatched > 0){
                            Song.find({
                                    $and:[
                                        {songOwnerContractAddress: req.session.passport.user.userManagerWalletAddress},
                                        {songContractAddress: { "$ne": "" }},
                                        {songContractAddress:{ $exists: true}}
                                    ]
                                }).populate('songArtistRefer').sort({_id: 'desc'}).limit(20).exec(function(err, data){
                                    res.render('index', {
                                        session: req.session,
                                        menu_index: 'home',
                                        arrDemoSong: Config.arrDemoSong,
                                        songs: data,
                                    });
                                });
                        }else{
                            if(itemCount > 0){
                              res.redirect('/mass-registration-media-upload');  
                            }else{
                                Song.find({
                                    $and:[
                                        {songContractAddress: { "$ne": "" }},
                                        {songContractAddress:{ $exists: true}}
                                    ]
                                }).populate('songArtistRefer').sort({_id: 'desc'}).limit(20).exec(function(err, data){
                                    res.render('index', {
                                        session: req.session,
                                        menu_index: 'home',
                                        arrDemoSong: Config.arrDemoSong,
                                        songs: data,
                                    });
                                });
                            }    
                        }
                    }
                }
            }
        }else{
            var [banners]  = await Promise.all([
                    Banner.find({}).exec()
                ]);
            var [posts]  = await Promise.all([
                Post.find({"state" : "published",}).sort({_id:-1}).limit(6).exec()
            ]);
            var [songs] = await Promise.all([
                Song.find({
                    $and:[
                        {songContractAddress: { "$ne": "" }},
                        {songContractAddress:{ $exists: true}}
                    ]
                }).populate('songArtistRefer').sort({_id: 'desc'}).limit(6).exec()
            ]);

            const [itemLicensed] = await Promise.all([
                Order.find({
                    $and:[
                        {licenseHash: { "$ne": "" }}
                    ]
                }).populate({
                    path: 'orderSongRefer',
                    populate: {
                        path: 'songArtistRefer',
                        model: 'Artist'
                    }
                })
            ]);
            res.render('index_guest', {
                session: req.session,
                menu_index: 'home',
                arrDemoSong: Config.arrDemoSong,
                songs: songs,
                itemLicensed: itemLicensed,
                banners: banners,
                posts: posts
            });
        }
    }else{

        var [banners]  = await Promise.all([
            Banner.find({}).exec()
        ]);
        var [posts]  = await Promise.all([
            Post.find({"state" : "published"}).sort({_id:-1}).limit(6).exec()
        ]);

        const [itemLicensed] = await Promise.all([
            Order.find({
                $and:[
                    {licenseHash: { "$ne": "" }}
                ]
            }).populate({
                path: 'orderSongRefer',
                populate: {
                    path: 'songArtistRefer',
                    model: 'Artist'
                }
            })
        ]);

        Song.find({
            $and:[
                {songContractAddress: { "$ne": "" }},
                {songContractAddress:{ $exists: true}}
            ]
        }).populate('songArtistRefer').sort({_id: 'desc'}).limit(req.query.limit).exec(function(err, data){
            res.render('index_guest', {
                session: req.session,
                menu_index: 'home',
                arrDemoSong: Config.arrDemoSong,
                itemLicensed: itemLicensed,
                songs: data,
                banners: banners,
                posts: posts
            });
        });
    }
});

app.get('/logout', function(req, res) {
    req.flash('formdata','');
    req.logout();
    res.redirect('/');
});

app.get('/permission', function(req, res) {
    res.render('permission', {
        session: req.session,
        menu_index:0
    });
});

app.get('/confirmation',function(req, res){
    var user_id = req.param("id");
    if(user_id == undefined){
        res.redirect('/');
    }
    User.findOne({_id: user_id}).exec(function(err, user){
        if(err || !user){
            res.redirect('/');
        }else{
            if(user.userEmailVerified){
                res.redirect('/sign-in');
            }else{
                user.userEmailVerified = true;
                user.save(function(err){
                    if(err){
                        req.flash("loginMessage","Something wrong");
                        res.redirect('/email_confirmation');
                    }else{
                        if(user.userSmsVerified){
                        res.redirect('/sign-in');
                    }else{
                        req.flash("loginMessage","Please verify your phone number");
                        res.redirect('/sms-confirmation?user_id='+user._id);
                        }
                    }
                });
            }
        }
    });
});

app.get('/email-confirmation', function(req, res) {
    var user_id = req.param("user_id");
    if(user_id == undefined){
        res.redirect('/404');
    }
    req.logout();
    User.findOne({_id: user_id}).exec(function(err, user){
        if(err || !user){
            res.redirect('/');
        }else{
            if(user.userEmailVerified){
                if(user.userSmsVerified){
                    res.redirect('/');
                }else{
                    req.flash("loginMessage","Please verify your phone number");
                    res.redirect('/sms-confirmation?user_id='+user._id);
                }
            }else{
                res.render('users/email_confirmation', {
                    session: req.session,
                    user: user,
                    appId: app_id,
                    csrf: csrf_guid,
                    version: 'v1.0',
                    message: req.flash('loginMessage'),
                    menu_index:0
                });
            }
        }
    });
});

app.get('/email-confirmation-mass', function(req, res) {
    var user_id = req.param("user_id");
    if(user_id == undefined){
        res.redirect('/404');
    }
    req.logout();
    User.findOne({_id: user_id}).exec(function(err, user){
        if(err || !user){
            res.redirect('/');
        }else{
            if(user.userEmailVerified){
                if(user.userSmsVerified){
                    res.redirect('/');
                }else{
                    req.flash("loginMessage","Please verify your phone number");
                    res.redirect('/sms-confirmation?user_id='+user._id);
                }
            }else{
                res.render('mass/email_confirmation', {
                    session: req.session,
                    user: user,
                    appId: app_id,
                    csrf: csrf_guid,
                    version: 'v1.0',
                    message: req.flash('loginMessage'),
                    menu_index:0
                });
            }
        }
    });
});

app.get('/account-processing',async function(req, res) {
    var user_id = req.param("user_id");
    if(user_id == undefined){
        res.redirect('/404');
    }
    req.logout();
    var [user] = await Promise.all([User.findOne({_id:user_id})]);
    if(user){
        if(process.env.TESTING_MODE == 1){
            user.userApproved = true;
            await Promise.all([user.save()]);
            res.render('users/congratulation', {
                session: req.session,
                user: user,
                appId: app_id,
                csrf: csrf_guid,
                version: 'v1.0',
                message: req.flash('loginMessage'),
                menu_index:0
            });
        }else{
            res.render('users/account_processing', {
                session: req.session,
                user: user,
                appId: app_id,
                csrf: csrf_guid,
                version: 'v1.0',
                message: req.flash('loginMessage'),
                menu_index:0
            });
        }
    }else{
        res.redirect('/');
    }
});

app.post('/email-confirmation', function(req, res) {
    req.flash('signupMessage','');
    if(req.body.user_id ==  undefined){
        res.redirect('/');
    }
    User.findOne({_id: req.body.user_id}).exec(function(err, user){
        if(err || !user){
            res.redirect('/');
        }else{
            if(user.userEmailVerified){
                //do something
            }else{
                email_helpler.send_confirmation_email(user.userEmail, user._id, '');
                res.render('users/email_confirmation', {
                    session: req.session,
                    user: user,
                    appId: app_id,
                    csrf: csrf_guid,
                    version: 'v1.0',
                    message: req.flash('loginMessage'),
                    menu_index:0
                });
            }
        }
    });
});

app.get('/sms-confirmation', function(req, res) {
    var user_id = req.param('user_id');
    User.findOne({_id: user_id}).exec(function(err,data){
        if(err || !data){
            res.redirect('/');
        }else{
            res.render('users/sms_confirmation', {
                session: req.session,
                user: data,
                appId: app_id,
                csrf: csrf_guid,
                version: 'v1.0',
                message: req.flash('loginMessage'),
                menu_index:0
            });
        }
    })
});


app.get('/sign-in', function(req, res) {
    var wallet = req.param('wallet');
    if(wallet==undefined){
        wallet = "";
    }
    res.render('users/sign_in', {
        wallet: wallet,
        session: req.session,
        message: req.flash('loginMessage'),
        menu_index:0
    });
});

app.post('/sign-in', passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/sign-in', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

app.get('/savekey', function(req, res) {
    res.render('users/savekey', {
        publickey: req.param('publickey'),
        session: req.session,
        privatekey: req.param('privatekey'),
        menu_index:0
    });
});

app.get('/sign-up-step-1', isLoggedIn ,async function(req, res) {
    var wallet = req.param('wallet');
    var id = req.param('id');
    if(wallet==undefined){
        wallet = "";
    }
    if(id == undefined){
        id="";
    }
    if(id.length >0){
        var [walletCheck]  = await Promise.all([
            WalletBK.findOne({'userRefer': id}).exec()
        ]);
        if(walletCheck){
            res.redirect("/");
        }
    }
    res.render('users/sign_up_step_1', {
        wallet: wallet,
        user_id: id,
        session: req.session,
        message: req.flash('loginMessage'),
        menu_index:0
    });
});

app.get('/normal-sign-up-step-1' ,async function(req, res) {
    var token = req.param('token');
    var wallet = req.param('wallet');
    if(token != process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN){
        res.redirect("/");
    }
    res.render('users/normal_sign_up_step_1', {
        session: req.session,
        message: req.flash('loginMessage'),
        token: process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN,
        wallet: wallet,
        menu_index:0
    });
});

app.post('/confirmation-wallet-address', function(req, res){
    User.findOne({
        userWalletAddress: req.body.address
    }).exec(function(err, data){
        if (err) {
            return res.json({
                address: req.body.address,
                error: "Bad request",
                status: 404
            });
        }else if (data) {
            return res.json({
                address: req.body.address,
                error: "Authenticate",
                status: 401
            });
        }else{
           return res.json({
                address: req.body.address,
                error: "OK",
                status: 200
            });
        }
    });
});

app.get('/sign-up-step-2', function(req, res){
    var id = req.param('id');
    if(id == undefined){
        id="";
    }
    res.render('users/sign_up_step_2', {
        url : Config.MainNet,
        user_id: id
    });
});

app.get('/normal-sign-up-step-2', function(req, res){
    var token = req.param('token');
    var public_key = req.param('publickey');
    if(token != process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN){
        res.redirect("/");
    }
    res.render('users/normal_sign_up_step_2', {
        token: process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN,
        public_key: public_key
    });
});

app.get('/sign-up-step-3', async function(req, res){
    var id = req.param('id');
    var seed = req.param('seed');
    var privateKey = req.param('private_key');
    var publickey = req.param('public_key');
    var walletBK = new WalletBK();
    walletBK.publicWallet = publickey;
    walletBK.publicDeployKey = privateKey;
    walletBK.publicDeploySeed = seed;
    walletBK.created = new Date();
    if(id == undefined){
        id="";
    }
    if(id!=""){
        var [user] = await Promise.all([
                User.findOne({_id: id})
            ]);
        if(user){
            user.userWalletAddress = walletBK.publicWallet;
            user.userManagerWalletAddress = walletBK.publicWallet;
            var [result] = await Promise.all([
                user.save()
            ]);
            walletBK.userRefer = user;
        }
    }else{
        if(req.session.passport.user){
            walletBK.userRefer = req.session.passport.user;
        }else{
            walletBK.userRefer = null;
        }
    }
    var [result] =  await Promise.all([
        walletBK.save()
    ]);
    if(id!=''){
        res.redirect('/');
    }else{
        res.render('users/sign_up_step_3', {
            seed: seed,
            private_key: privateKey,
            public_key: publickey
        });
    }
});

app.get('/normal-sign-up-step-3', async function(req, res){
    var token = req.param('token');
    var publickey = req.param('public_key');
    var privateKey = req.param('private_key');
    var seed = req.param('seed');
    if(token != process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN){
        res.redirect("/");
    }
    res.render('users/normal_sign_up_step_3', {
        seed: seed,
        private_key: privateKey,
        public_key: publickey,
        token: process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN
    });
});

// app.get('/mass-registration-sign-up-info', function(req, res) {
//     var formdata = req.flash('formdata'); // Get formdata back into a variable
//     Country.find({}).exec(function(err, countries){
//         if(formdata.length>0){
//             res.render('mass/sign_up_info', {
//                 formData: formdata[0],
//                 session: req.session,
//                 countries: countries,
//                 message: req.flash('signupMessage'),
//                 menu_index: ''
//             });
//         }else{
//             res.render('mass/sign_up_info', {
//                 formData: null,
//                 session: req.session,
//                 countries: countries,
//                 message: req.flash('signupMessage'),
//                 menu_index: ''
//             });
//         }
//     });
// });

// app.get('/mass-complete-account', isLoggedInMass,function(req, res) {
//     var wallet = req.param('wallet') == undefined ? '' : req.param('wallet');
//     var key = req.param('key') == undefined ? '' : req.param('key');
//     User.findOne({
//                 $and: [
//                     {_id: req.session.passport.user._id},
//                ]}
//         ).exec(function(err, user){
//             user.userManagerWalletAddress = wallet.toLowerCase();
//             user.userWalletAddress = wallet.toLowerCase();
//             user.save(function(err){
//                 req.session.passport.user = user;
//                 res.redirect("/mass-registration");
//             });
//         });
// });

// // process the signup form
// app.post('/mass-registration-sign-up-info', passport.authenticate('mass-registration-local-signup', {
//     successRedirect : '/mass-registration', // redirect to the secure profile section
//     failureRedirect : '/mass-registration-sign-up-info', // redirect back to the signup page if there is an error
//     failureFlash : true // allow flash messages
// }));

app.get('/sign-up-info', async function(req, res) {
    var wallet = req.param('wallet') == undefined ? '' : req.param('wallet');
    var key = req.param('key') == undefined ? '' : req.param('key');
    var formdata = req.flash('formdata'); // Get formdata back into a variable
    if(formdata.length >0 && wallet ==""){
        wallet = formdata[0].role;
        key = formdata[0].key;
    }

    var [countries] = await Promise.all([
            Country.find({}).exec()
        ]);
    if(formdata.length>0){
        res.render('users/sign_up_info', {
            formData: formdata[0],
            session: req.session,
            wallet: wallet,
            key: key,
            countries: countries,
            message: req.flash('signupMessage'),
            menu_index: '',
            test_mode: process.env.TESTING_MODE,
            token: process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN
        });
    }else{
        res.render('users/sign_up_info', {
            formData: null,
            session: req.session,
            wallet: wallet,
            key: key,
            countries: countries,
            message: req.flash('signupMessage'),
            menu_index: '',
            test_mode: process.env.TESTING_MODE,
            token: process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN
        });
    }
});

app.get('/normal-sign-up-info', async function(req, res) {
    var wallet = req.param('wallet') == undefined ? '' : req.param('wallet');
    var key = req.param('key') == undefined ? '' : req.param('key');
    var formdata = req.flash('formdata'); // Get formdata back into a variable
    var token = req.param('token');
    if(formdata.length >0 && wallet ==""){
        wallet = formdata[0].role;
        key = formdata[0].key;
    }
    if(token != process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN){
        res.redirect("/");
    }
    var [countries] = await Promise.all([
            Country.find({}).exec()
        ]);
    if(formdata.length>0){
        res.render('users/normal_sign_up_info', {
            formData: formdata[0],
            session: req.session,
            wallet: wallet,
            key: key,
            countries: countries,
            message: req.flash('signupMessage'),
            menu_index: '',
            test_mode: process.env.TESTING_MODE,
            token: process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN
        });
    }else{
        res.render('users/normal_sign_up_info', {
            formData: null,
            session: req.session,
            wallet: wallet,
            key: key,
            countries: countries,
            message: req.flash('signupMessage'),
            menu_index: '',
            test_mode: process.env.TESTING_MODE,
            token: process.env.SIGNUP_ALLOW_CREATE_WALLET_TOKEN
        });
    }
});

app.get('/scan-access-wallet', function(req, res){
    var type = req.param('type');
    res.render('users/access_wallet',{
        type: type
    });
});

// // process the signup form
app.post('/sign-up-info', passport.authenticate('local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/sign-up-info', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

// // process the signup form
app.post('/normal-sign-up-info', passport.authenticate('normal-local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/normal-sign-up-info', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.post('/check_user_exist',function(req,res){
    var data = req.body;
    User.findOne({
       $and: [
       {userWalletAddress: data.wallet_address},
       {userIsOwner: true}
       ]}
       ).exec(function(err, data){
        if (err){
            return res.json(400, {
                error: 1,
                msg: ""
            });
        }else if(data){
            return res.json(200, {
                error: 2,
                msg: ""
            });
        }else{
            return res.json(200, {
                error: 0,
                msg: "ok"
            });
        }
    });
});

app.post('/upload', function(req, res){
    // create an incoming form object
    var form = new formidable.IncomingForm();
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // log any errors that occur
    form.uploadDir = path.join(__dirname, '../public/uploads');
    var filename ="";
    form.on('file', function(field, file) {
        filename = new Date().getTime()+file.name;
        console.log(filename);
        fs.renameSync(file.path, path.join(form.uploadDir, filename));
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function() {
        console.log(filename);
        res.json(200, {
            error: 0,
            url: "uploads/"+filename
        });
    });

    form.parse(req);
});

app.post('/song-file-upload', isLoggedIn, function(req, res){
    var form = new formidable.IncomingForm();
    console.log(form);
    var song_hash = '';
    form.multiples = true;
    form.uploadDir = path.join(__dirname, '../public/uploads/audio');
    var filename = '';
    form.on('file', function(field, file){
        console.log(filename, form.song_hash);
        // filename = file.name;
        filename = new Date().getTime()+file.name;
        fs.rename(file.path, path.join(form.uploadDir, filename));
    });
    form.on('end', function(){
        console.log(filename);
        res.json(200, {
            error: 0,
            url: 'uploads/audio/' + filename
        });
    });
    form.parse(req);
});

app.get('/api/list-users', async function(req, res){
    var token = req.param('token');
    if (token == undefined || token.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }
    const [user] = await Promise.all([
        User.findOne({userToken: token})
    ]);

    if (!user) {
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }
    var [users] = await Promise.all([
        User.find({
            $and: [
                {userIsOwner: true},
            ]
        })
    ]);
    return res.json(200, {status: 200, message: 'ok.', users: users});
});

app.post('/api/verify-passord', isLoggedIn, async function(req, res){
    var password = req.param('password');
    var [user] = await Promise.all([
        User.findOne({_id: req.session.passport.user._id})
    ]);
    console.log(user);
    if (user.validPassword(password)){
        return res.json(200, {status: 200, message: 'ok.'});
    }else{
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }
});


app.post('/api/authenticate/login', multer().fields([]), async function(req, res) {
    var data = req.body;

    if (data == undefined || data.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.batch_id == undefined || data.batch_id.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.email == undefined || data.email.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    if (data.password == undefined || data.password.length == 0) {
        return res.json(200, {status: 400, message: 'Bad Request'});
    }

    const [user] = await Promise.all([
        User.findOne({
            $and: [
                {userAccountName: data.email},
            ]
        })
    ]);

    if (!user) {
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }

    if (!user.validPassword(data.password)) {
        return res.json(200, {status: 401, message: 'Unauthorised.'});
    }

    user.userToken = crypto.randomBytes(48).toString('hex');

    user.save(function(err) {
        var response = {
            id: user._id,
            email: user.userEmail,
            role: user.userWalletAddress,
            token: user.userToken
        }
        return res.json(200, {status: 200, message: 'Login successed', user: response});
    });
});


app.post('/checking-voucher-code', isLoggedIn, async function(req, res) {
    var data = req.body;
    console.log(data);

    const code = data.code;
    var [voucher] = await Promise.all([
        Voucher.findOne({code: code}).exec()
    ]);

    if (!voucher) {
        return res.json(200, {error: 1, msg: 'Voucher code is not correct'});
    }
    if (voucher.status != 'sold') {
        return res.json(200, {error: 1, msg: 'Voucher already used'});
    }
    voucher.status = 'used';
    voucher.save((error) => {
        if (error) {
            return res.json(200, {error: 1, msg: 'Something wrong'});
        }
        return res.json(200, {error: 0, msg: 'ok', amount: voucher.amount});
    });
});

app.post('/regis-charge', isLoggedIn, function(req, res) {
    var data = req.body;
    console.log(data);

    var tokenID = data.stripeToken;
    Stripe.charges.create({
        card: tokenID,
        currency: 'usd',
        amount: Math.ceil(data.amount)
    }, (err, charge) => {
        console.log(err, charge);
        if (err) {
            return res.json(200, {error: 1, msg: 'Cannot request Stripe'});
        }
        return res.json(200, {error: 0, msg: 'ok'});
    });
});

app.get('/trezor-connect', function(req, res){
    res.render('trezor_sign_in');
});

app.get('/404',function(req,res){
    res.render('404');
});

app.get('/contact_us/', function(req, res) {
    res.render('contact_page');
});

app.get('/about_us/', function(req, res) {
    res.render('about_us');
});

app.get('/autocomplete_user',isLoggedIn, function(req, res) {
    var keyword = req.param('term');
    User.find(
        {
            $and:[
                {$or:[
                        {userEmail: new RegExp(keyword,'i')},
                        {userFullName: new RegExp(keyword,'i')},
                        {userAccountNumber: new RegExp(keyword,'i')}
                ]},
                {userApproved: true}
            ]
        }).select('_id userAccountName userEmail userWalletAddress').exec(function(err, data){
            return res.json(200, data);
    });
});

app.post('/toogle-user-status', isLoggedIn, async function (req, res){
    var user_id = req.param('user_id');
    var [user] = await Promise.all([
        User.findOne({_id: user_id})
    ]);
    if(req.session.passport.user._id != process.env.ADMIN_ID){
        return res.json(200, {error: 0, msg: "You don't have permission"});
    }

    if(!user){
        return res.json(200, {error: 1, msg: 'Sorry. User not found'});
    }
    user.userApproved = !user.userApproved;
    user.userEmailVerified  = true;
    if(!user.userFirstTime){
        user.userFirstTime = true;
        email_helpler.send_approve_email(user.userEmail, user._id, '');
    }
    var [result] = await Promise.all([user.save()]);
    return res.json(200, {error: 0, msg: 'Saved'});
});

app.post('/toogle-user-deploy-mass', isLoggedIn, async function (req, res){
    var user_id = req.param('user_id');
    if(req.session.passport.user._id != process.env.ADMIN_ID){
        return res.json(200, {error: 0, msg: "You don't have permission"});
    }
    var [user] = await Promise.all([
        User.findOne({_id: user_id})
    ]);

    if(!user){
        return res.json(200, {error: 1, msg: 'Sorry. User not found'});
    }
    user.userCanDeployMassMigration = !user.userCanDeployMassMigration;
    var [result] = await Promise.all([user.save()]);
    return res.json(200, {error: 0, msg: 'Saved'});
});

app.get('/profile-talent', isLoggedIn, function(req, res) {
    var type = req.param('type') ? req.param('type') : 'artist';

    res.render('talents/profile_talent', {
        type: type,
        session: req.session,
        menu_index: 'my-talents'
    });
});

app.get('/allow-user-create-wallet', isLoggedIn, async function(req, res) {
    var user_id = req.param('user_id');
    if(req.session.passport.user._id != process.env.ADMIN_ID){
        return res.json(200, {error: 0, msg: "You don't have permission"});
    }
    var [user] = await Promise.all([
        User.findOne({_id: user_id})
    ]);

    if(!user){
        return res.json(200, {error: 1, msg: 'Sorry. User not found'});
    }
    user.userShowPrivateKeyBox = !user.userShowPrivateKeyBox;
    var [result] = await Promise.all([user.save()]);
    return res.json(200, {error: 0, msg: 'Saved'});
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

function isLoggedInMass(req, res, next) {
    if (req.isAuthenticated()){
        if(!req.session.passport.user.userEmailVerified){
            req.flash("loginMessage","Please verify your email");
            res.redirect('/email-confirmation-mass?user_id='+req.session.passport.user._id);
        }else if(!req.session.passport.user.userSmsVerified){
            req.flash("loginMessage","Please verify your phone");
            res.redirect('/sms-confirmation?user_id='+req.session.passport.user._id);
        }else{
            return next();
        }
    }
    // res.flash('info','Please login');
    res.redirect('/mass-migration-sign-in');
}

function isLoggedInSignIn(req, res, next) {
    if(req){
        if (req.isAuthenticated())
            return next();
    }
}

function checkOwnerRole(req, res, next) {
    if(req){
        if (req.isAuthenticated())
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
    req.flash('info',"You don't have permission. Please login as owner role");
    res.redirect('/permission');
}
