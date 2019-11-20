// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var io = require('socket.io').listen(app.listen(8000));

var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);
var Buffer 		 = require('buffer');
const paginate = require('express-paginate');
var configDB = require('./config/database.js');
var cron = require('node-cron');
// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
// session store
let store = new MongoStore({
    uri: configDB.url,
    collection: 'sessions'
});

require('./config/passport')(passport); // pass passport for configuration
// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public/' }));
app.use(express.static(__dirname + '/app/public/'));
app.use(paginate.middleware(10, 50));

app.set('view engine', 'ejs'); // set up ejs for templating
app.use(cookieParser('5TOCyfH3HuszKGzFZntk'));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'pAgGxo8Hzg7PFlv1HpO8Eg0Y6xtP7zYx',
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 3600000 * 24
    },
    store: store
}));

app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/backend/routes.js')(app, passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/song.js')(app, passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/royalty.js')(app, passport,paginate);
require('./app/backend/composer.js')(app, passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/artist.js')(app, passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/license.js')(app, passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/transactions.js')(app, passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/mass-registration.js')(app,passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/mass-registration-api.js')(app,passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/vouchers.js')(app,passport, paginate); // load our routes and pass in our app and fully configured passport
require('./app/backend/bookmark.js')(app, passport, paginate);
require('./app/backend/settings.js')(app, passport, paginate);
require('./app/backend/posts.js')(app, passport, paginate);
require('./app/backend/whitelist.js')(app, passport,paginate);
require('./app/backend/socket-server.js')(app, io, paginate);
require('./app/backend/blockchain.js');
require('./app/backend/verify.js')(app, passport, paginate);
require('./app/backend/search.js')(app, passport, paginate);
require('./app/backend/email.js');
var ExportData = require('./app/backend/export-data.js');
var DeployCronjob = require('./app/backend/deploy-cronjob.js');

//export data cron-job
// cron.schedule("*/10 * * * * *", function() {
//   // Email.send_process_mass_migration('dovuthanh2018@gmail.com');
//   ExportData.process_export_data();
//   console.log("Checking export blockchain data");
// });

// //export data cron-job
// cron.schedule("*/10 * * * * *", function() {
//     // Email.send_process_mass_migration('dovuthanh2018@gmail.com');
//     ExportData.process_export_song_data();
//     // console.log("Checking export Song data");
// });


// //export data cron-job
// cron.schedule("*/10 * * * * *", function() {
//     // Email.send_process_mass_migration('dovuthanh2018@gmail.com');
//     ExportData.process_export_artist_data();
//     console.log("Checking export Artist data");
// });

// //export data cron-job
// cron.schedule("*/10 * * * * *", function() {
//     // Email.send_process_mass_migration('dovuthanh2018@gmail.com');
//     DeployCronjob.deploy_mass_migration();
//     console.log("Deploy mass registration");
// });

// //export data cron-job
// cron.schedule("*/10 * * * * *", function() {
//     // Email.send_process_mass_migration('dovuthanh2018@gmail.com');
//     DeployCronjob.check_deploy_mass_migration_total();
//     console.log("Check deploy mass registration");
// });


// //check deploy-mass_migration 
// cron.schedule("*/10 * * * * *", function() {
//   // Email.send_process_mass_migration('dovuthanh2018@gmail.com');
//   DeployCronjob.check_deploy_mass_migration();
//   console.log("Checking Mass migration deploy");
// });

// // // //check deploy-song
// cron.schedule("*/10 * * * * *", function() {
//   DeployCronjob.check_deploy_song_registration();
//   console.log("Checking registration deploy");
// });

// // // //check deploy-song
// cron.schedule("*/10 * * * * *", function() {
//   DeployCronjob.check_deploy_add_royalty_partners();
//   console.log("Checking royalty Parnter add");
// });

// // // //check deploy-song
// cron.schedule("*/10 * * * * *", function() {
//   DeployCronjob.check_deploy_sign_royalty_partners();
//   console.log("Checking royalty Parnter accept");
// });

// // // //check deploy-song
// cron.schedule("*/10 * * * * *", function() {
//   DeployCronjob.check_deploy_unsign_royalty_partners();
//   console.log("Checking royalty Parnter deny");
// });

// // // //check deploy-song
// cron.schedule("*/10 * * * * *", function() {
//   DeployCronjob.check_deploy_add_license();
//   console.log("Checking licese add");
// });

// // // //check deploy-song
// cron.schedule("*/10 * * * * *", function() {
//   DeployCronjob.update_price_for_license();
//   console.log("Checking license update price");
// });

// // // //check deploy-song
// cron.schedule("*/10 * * * * *", function() {
//   DeployCronjob.fund_for_license();
//   console.log("Checking license paid");
// });

// // //check generate song qrcode
cron.schedule("*/10 * * * * *", function() {
  DeployCronjob.generate_qrcode_asyn();
  console.log("generate song qrcode");
});
// // //check account qrcode
cron.schedule("*/10 * * * * *", function() {
  DeployCronjob.generate_wallet_asyn();
  console.log("generate account qrcode");
});


// launch ======================================================================
var https = require('https');
var http = require('http');
// var fs = require('fs');
// var options = {
//    	key: fs.readFileSync("tecadmin.net.key"),
//   	cert: fs.readFileSync("encore_yez_vn.crt"),
//   	ca: [
//           fs.readFileSync('COMODORSADomainValidationSecureServerCA.crt'),
//           fs.readFileSync('COMODORSAAddTrustCA.crt')
//        ]
// };
http.createServer(app).listen(80);
// https.createServer(options, app).listen(443);
// app.listen(8000);
console.log('The magic happens on port ' + 8000);
