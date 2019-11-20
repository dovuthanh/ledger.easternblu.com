var User            = require('../models/user');
var Song            = require('../models/song');
var Order           = require('../models/order');
var Artist          = require('../models/artist');
var Composer        = require('../models/composer');
var Country         = require('../models/country');
var Voucher         = require('../models/voucher');
var Banner          = require('../models/banner');
var Post            = require('../models/post');
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
var Promise = require('promise');
module.exports  = function(app, passport, paginate) {

app.get('/post-list', async function(req, res) {
    var [posts]  = await Promise.all([
            Post.find({"state" : "published"}).limit(req.query.limit).exec()
        ]);
        res.render('posts/post-list', {
            session: req.session,
            menu_index:0,
            posts:posts,
        });
});

app.get('/post-detail', async function(req, res) {
    var id = req.param("id");
    if(id == undefined){
        res.redirect('/');
    }
    Post.findOne({_id: id}).exec(function(err, post){
        console.log(post);
        if(err || !post){
            res.redirect('/');
        }else{
            res.render('posts/post-detail', {
                session: req.session,
                menu_index:0,
                post:post,
            });
        }
    });
});


app.post('/api/post-list', async function(req, res) {
    var page = req.body.page;
    if(page == undefined) page = 1;
    var [posts]  = await Promise.all([
            Post.find({"state" : "published"}).limit(req.query.limit).skip(page*req.query.limit).lean().exec()
        ]);
    return res.json(200, {status: 200, message: 'ok', data: posts});
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
