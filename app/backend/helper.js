var User              = require('./models/user');
const user_send_email = process.env.GMAIL_USER_SEND;
const pass_send_email = process.env.GMAIL_PASS_SEND;
require('dotenv').config();
var login_url         = process.env.URL_HOST+"/sign-in";
module.exports ={

isLoggedIn: function isLoggedIn(req, res, next) {
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
},

isLoggedInSignIn: function isLoggedInSignIn(req, res, next) {
    if(req){
        if (req.isAuthenticated())
            return next();
    }
}

checkOwnerRole: function checkOwnerRole(req, res, next) {
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
   
};





