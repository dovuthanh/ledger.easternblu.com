var User        = require('../models/user');
var Song        = require('../models/song');
var Order       = require('../models/order');
var Export      = require('../models/export');
var Artist      = require('../models/artist');
var Composer    = require('../models/composer');
var bcrypt      = require ('bcrypt');
var multer      = require('multer');
var bodyParser  = require('body-parser');
var path        = require('path');
var formidable  = require('formidable');
var fs          = require('fs');
var Promise = require('promise');
var Iconv     = require("iconv").Iconv;
var iconv     = new Iconv('utf8', 'utf16le');
module.exports  = function(app, passport, paginate) {

    app.get('/export-artist-csv', isLoggedIn, async function (req, res) {
        var [artist] = await Promise.all([
            Artist.find({artistUserRefer: req.session.passport.user._id})
        ]);

        var header    = "Id"+"\t"+"Professional Name"+"\t"+"Non Romanized Name"+"\t"+"Avartar url"+"\t"+"Profile"+"\t"+"Name in passport"+"\t";
        header += "Email"+"\t"+"phone"+"\t"+"Country"+"\t"+"Facebook"+"\t"+"Wechat"+"\t"+"LinkedIn"+"\t"+"Twitter"+"\t";
        header += "Current freelancer"+"\t"+"Contract record label"+"\t"+"Contract product company"+"\t";
        header += "Artist management company"+"\t"+"Record new song with a new record label"+"\t";
        header += "Perform in a ticket solo concert"+"\t"+"Perform in event such as music festival and music converts"+"\t";
        header += "Perform in private organized Events"+"\t"+"To appear in commercials"+"\t"+"To seek cooperation with commercial"+"\t";
        header += "To Sell sound recording and music video directly yo consumer"+"\t"+"Produce your down sound Recording and music video"+"\n";
        var content   = header;

        for (var i=0, total=artist.length; i<total; i++) {
            content += artist[i]._id +"\t";
            content += artist[i].artistProfessionName +"\t";
            if(artist[i].artistNonRomanizedName!=undefined) {
                content += artist[i].artistNonRomanizedName + "\t";
            }
            if(artist[i].artistsPictures!=undefined) {
                content += artist[i].artistsPictures + "\t";
            }
            if(artist[i].artistsPictures!=undefined) {
                content += artist[i].artistProfile + "\t";
            }
            if(artist[i].artistNameInPassportOfficialIdentificationCard!=undefined) {
                content += artist[i].artistNameInPassportOfficialIdentificationCard + "\t";
            }
            if(artist[i].artistEmail!=undefined) {
                content += artist[i].artistEmail + "\t";
            }
            if(artist[i].artistPhone!=undefined) {
                content += artist[i].artistPhone + "\t";
            }
            if(artist[i].artistCountryCode!=undefined) {
                content += artist[i].artistCountryCode + "\t";
            }
            if(artist[i].artistFaceBook!=undefined) {
                content += artist[i].artistFaceBook + "\t";
            }
            if(artist[i].artistWechat!=undefined) {
                content += artist[i].artistWechat + "\t";
            }
            if(artist[i].artistLinkedIn!=undefined) {
                content += artist[i].artistLinkedIn + "\t";
            }
            if(artist[i].artistTwitter!=undefined) {
                content += artist[i].artistTwitter + "\t";
            }
            if(artist[i].artistCurrrentFreelancer!=undefined) {
                content += artist[i].artistCurrrentFreelancer + "\t";
            }
            if(artist[i].artistCurrrentContractRecordLabel!=undefined) {
                content += artist[i].artistCurrrentContractRecordLabel + "\t";
            }
            if(artist[i].artistCurrrentContractProductionCompany!=undefined) {
                content += artist[i].artistCurrrentContractProductionCompany + "\t";
            }
            if(artist[i].artistCurrrentContractArtistManagementCompany!=undefined) {
                content += artist[i].artistCurrrentContractArtistManagementCompany + "\t";
            }
            if(artist[i].artistRecordNewSongsWithANewRecordLabel!=undefined) {
                content += artist[i].artistRecordNewSongsWithANewRecordLabel + "\t";
            }
            if(artist[i].artistPerformInATicketedSoloConcert!=undefined) {
                content += artist[i].artistPerformInATicketedSoloConcert + "\t";
            }
            if(artist[i].artistPerformInEventsSuchAsMusicFestivalAndMusicConcerts!=undefined) {
                content += artist[i].artistPerformInEventsSuchAsMusicFestivalAndMusicConcerts + "\t";
            }
            if(artist[i].artistPerformInPrivatelyOrganizedEvents!=undefined) {
                content += artist[i].artistPerformInPrivatelyOrganizedEvents + "\t";
            }
            if(artist[i].artistToAppearInCommercials!=undefined) {
                content += artist[i].artistToAppearInCommercials + "\t";
            }
            if(artist[i].artistToSeekCooperationWithCommercial!=undefined) {
                content += artist[i].artistToSeekCooperationWithCommercial + "\t";
            }
            if(artist[i].artistToSellSoundRecordingsAndMusicVideosDirectlyToConsumers!=undefined) {
                content += artist[i].artistToSellSoundRecordingsAndMusicVideosDirectlyToConsumers + "\t";
            }
            if(artist[i].artistProduceYourDownSoundRecordingAndOrMusicVideo!=undefined) {
                content += artist[i].artistProduceYourDownSoundRecordingAndOrMusicVideo + "\t";
            }
            content += "\n";
        }
        res.setHeader('Content-Type',        'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", 'attachment; filename=Export.xls');
        res.write(new Buffer([0xff, 0xfe]));
        res.write(iconv.convert(content));
        res.end();
    });

// normal routes ==============================================================
    app.get('/my-talents', isLoggedIn, async function(req, res) {
        var key = req.param('key');

        var artists = [];
        var composers = [];
        var lyricists = [];

        var talents = [];
        console.log(req.session.passport.user.userIsAdmin);
        if (key == undefined || key.length == 0) {
            if (req.session.passport.user.userIsAdmin) {
                [talents] = await Promise.all([
                    Artist.find({})
                            .sort({artistProfessionName: "asc"})
                            .exec()
                ]);
            }else{
                [talents] = await Promise.all([
                    Artist.find({artistUserRefer: req.session.passport.user._id})
                            .sort({artistProfessionName: "asc"})
                            .exec()
                ]);
            }
        }else {
            if (req.session.passport.user.userIsAdmin) {
                [talents] = await Promise.all([
                    Artist.find({
                        $or:[
                            {artistProfessionName: new RegExp(key,'i')},
                            {artistNameInPassportOfficialIdentificationCard: new RegExp(key,'i')}
                        ]
                    })
                        .sort({artistProfessionName: "asc"})
                        .exec()
                ]);
            }else{
                [talents] = await Promise.all([
                    Artist.find({
                        $and: [
                            {
                                $or:[
                                    {artistProfessionName: new RegExp(key,'i')},
                                    {artistNameInPassportOfficialIdentificationCard: new RegExp(key,'i')}
                                ]
                            },
                            {artistUserRefer: req.session.passport.user._id}
                        ]
                    })
                        .sort({artistProfessionName: "asc"})
                        .exec()
                ]);
            }
        }

        var [exportData] = await Promise.all([
            Export.findOne({
                $and: [
                    {ArtistFile: {"$ne": ""}},
                    {Status: 0}
                ]
            }).populate('UserRefer').populate('MerkleRefer').exec()
        ]);

        talents.forEach(function(talent){
            if (talent.artistType == 'Artist') {
                artists.push(talent);
            }else if (talent.artistType == 'Composer') {
                composers.push(talent);
            }else if (talent.artistType == 'Lyricist') {
                lyricists.push(talent);
            }
        });
        res.render('talents/list_talent', {
            url: process.env.NETWORK_TRANSACTION,
            talents: talents,
            artists: artists,
            composers: composers,
            lyricists: lyricists,
            session: req.session,
            exportData: exportData,
            menu_index: 'my-talents'
        });
    });



    app.get('/all-talents', isLoggedIn, async function(req, res){
        var asc = req.param('asc');
        var sort = 'asc';
        if (asc == undefined || asc == 1) {
            sort = 'asc';
        }else{
            sort = 'desc';
        }

        var talents = [];
        if (req.session.passport.user.userIsAdmin) {
            [talents] = await Promise.all([
                Artist.find({})
                        .sort({artistProfessionName: sort})
                        .exec()
            ]);
        }else{
            [talents] = await Promise.all([
                Artist.find({artistUserRefer: req.session.passport.user._id})
                        .sort({artistProfessionName: sort})
                        .exec()
            ]);
        }
        res.render('talents/all_talents', {
            talents: talents,
            asc: asc
        });
    });

    app.get('/all-artists', isLoggedIn, async function(req, res){
        var asc = req.param('asc');
        var sort = 'asc';
        if (asc == undefined || asc == 1) {
            sort = 'asc';
        }else{
            sort = 'desc';
        }

        var artists = [];
        if (req.session.passport.user.userIsAdmin) {
            [artists] = await Promise.all([
                Artist.find({artistType: 'Artist'})
                        .sort({artistProfessionName: sort})
                        .exec()
            ]);
        }else{
            [artists] = await Promise.all([
                Artist.find({
                    $and: [
                        {artistUserRefer: req.session.passport.user._id},
                        {artistType: 'Artist'}
                    ]
                })
                        .sort({artistProfessionName: sort})
                        .exec()
            ]);
        }
        res.render('talents/all_artists', {
            artists: artists,
            asc: asc
        });
    });

    app.get('/all-composers', isLoggedIn, async function(req, res){
        var asc = req.param('asc');
        var sort = 'asc';
        if (asc == undefined || asc == 1) {
            sort = 'asc';
        }else{
            sort = 'desc';
        }

        var composers = [];
        if (req.session.passport.user.userIsAdmin) {
            [composers] = await Promise.all([
                Artist.find({artistType: 'Composer'})
                        .sort({artistProfessionName: sort})
                        .exec()
            ]);
        }else{
            [composers] = await Promise.all([
                Artist.find({
                    $and: [
                        {artistUserRefer: req.session.passport.user._id},
                        {artistType: 'Composer'}
                    ]
                })
                        .sort({artistProfessionName: sort})
                        .exec()
            ]);
        }
        res.render('talents/all_composers', {
            composers: composers,
            asc: asc
        });
    });

    app.get('/all-lyricists', isLoggedIn, async function(req, res){
        var asc = req.param('asc');
        var sort = 'asc';
        if (asc == undefined || asc == 1) {
            sort = 'asc';
        }else{
            sort = 'desc';
        }

        var lyricists = [];
        if (req.session.passport.user.userIsAdmin) {
            [lyricists] = await Promise.all([
                Artist.find({artistType: 'Lyricist'})
                        .sort({artistProfessionName: sort})
                        .exec()
            ]);
        }else{
            [lyricists] = await Promise.all([
                Artist.find({
                    $and: [
                        {artistUserRefer: req.session.passport.user._id},
                        {artistType: 'Lyricist'}
                    ]
                })
                        .sort({artistProfessionName: sort})
                        .exec()
            ]);
        }
        res.render('talents/all_lyricists', {
            lyricists: lyricists,
            asc: asc
        });
    });

    app.get('/my-profile', isLoggedIn, async function(req, res){
        var id = req.param('id');
        if (id != undefined) {
            const [ talent ] = await Promise.all([
              Artist.findOne({_id: id})
              .exec()
            ]);

            const [ results, itemCount ] = await Promise.all([
              Song.find(
                {songArtistRefer: talent._id})
              .limit(req.query.limit)
              .skip(req.skip)
              .lean()
              .sort({_id: 'desc'})
              .exec(),
              Song.count({songArtistRefer: talent._id})
            ]);
            const pageCount = Math.ceil(itemCount / req.query.limit);
            res.render('talents/talent_info_record', {
                talent: talent,
                songs: results,
                session: req.session,
                pageCount: pageCount,
                itemCount: itemCount,
                pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
                menu_index: 'my-talents',
                url: process.env.NETWORK_TRANSACTION,
            });
        }else{
            res.redirect('/my-talents');
        }
    });

    app.get('/create-talent', isLoggedIn, function(req, res) {
        var type = req.param('type') ? req.param('type') : 'artist';

        res.render('talents/create_talent', {
            type: type,
            session: req.session,
            menu_index: 'my-talents'
        });
    });

    app.post('/create-talent',isLoggedIn, function(req, res) {
        // create an incoming form object
        var data = req.body;
        console.log(req.body);
        if(!data){
            return res.json(200, {error: 1, msg: "Could not save talent. Try again later"});
        }
        var artist = new Artist();
        artist.artistType = data.artist_type;
        artist.artistManagementAccount = req.session.passport.user.userWalletAddress;
        artist.artistProfessionName = data.artist_profession_name;
        artist.artistNonRomanizedName = data.artist_romanized_name;
        artist.artistProfile = data.artist_profile;
        artist.artistNameInPassportOfficialIdentificationCard = data.artist_name_passport;
        artist.artistEmail = data.artist_email;
        artist.artistCountryCode = data.artist_code;
        artist.artistPhone = data.artist_phone;
        artist.artistFaceBook = data.artist_facebook_link;
        artist.artistWechat = data.artist_wechat_link;
        artist.artistLinkedIn = data.artist_linked_link;
        artist.artistTwitter = data.artist_twitter_link;
        artist.artistCurrrentFreelancer = data.artist_freelancer;
        artist.artistCurrrentContractRecordLabel = data.artist_record_label;
        artist.artistCurrrentContractProductionCompany = data.artist_product_company;
        artist.artistCurrrentContractArtistManagementCompany = data.artist_management_company;
        // artist.artistProduceYourDownSoundRecordingAndOrMusicVideo = data.have_sound_recording;
        artist.artistRecordNewSongsWithANewRecordLabel = data.artist_is_record_new_song;
        artist.artistPerformInATicketedSoloConcert = data.artist_is_solo_concert;
        artist.artistPerformInEventsSuchAsMusicFestivalAndMusicConcerts = data.artist_is_events;
        artist.artistPerformInPrivatelyOrganizedEvents = data.artist_is_private_organised;
        artist.artistToAppearInCommercials = data.artist_is_appear_commericals;
        artist.artistToSeekCooperationWithCommercial = data.artist_is_seek_cooperations;
        artist.artistToSellSoundRecordingsAndMusicVideosDirectlyToConsumers= data.artist_is_sell_sound;
        artist.artistUserRefer = req.session.passport.user;
        artist.artistID = new Date().getTime();
        // artist.artistNonRomanizedName = data.non_romainized_name;

        if(data.artist_file_avatar.length >0){
            //app/backend
            if (fs.existsSync(path.join(__dirname,'../public/'+data.artist_file_avatar))) {
                artist.artistsPictures = '/' + data.artist_file_avatar;
            }
        }
        console.log(artist);
        artist.save(function(err){
            if(err){
                return res.json(200, {error: 1, msg: "Could not save talent. Try again later"});
            }else {
                return res.json(200, {error: 0, msg: "ok"});
            }
        });
    });

    app.get('/edit-talent-profile', isLoggedIn, function(req, res){
        var id = req.param('id');
        if (id != undefined) {
            Artist.findOne({_id: id}).exec(function(err, talent){
                console.log(talent);
                if (talent && !err) {
                    res.render('talents/edit_talent_profile', {
                        talent: talent,
                        session: req.session,
                        menu_index: 'my-talents'
                    });
                }
            });
        }else{
            res.redirect('/my-talents');
        }
    });

    app.post('/edit-talent-profile', isLoggedIn, async function(req, res){
        var data = req.body;
        console.log(data);
        if (data.length == 0) {
            return res.json(200, {error: 1, msg: "Could not save talent. Try again later"});
        }

        var [talent] = await Promise.all([
            Artist.findOne({_id: data._id}).exec()
        ]);
        if (!talent) {
            return res.json(200, {error: 1, msg: "Could not save talent. Try again later"});
        }

        console.log(talent);
        talent.artistType = data.artist_type;
        talent.artistManagementAccount = req.session.passport.user.userWalletAddress;
        talent.artistProfessionName = data.artist_profession_name;
        talent.artistNonRomanizedName = data.artist_romanized_name;
        talent.artistProfile = data.artist_profile;
        talent.artistNameInPassportOfficialIdentificationCard = data.artist_name_passport;
        talent.artistEmail = data.artist_email;
        talent.artistCountryCode = data.artist_code;
        talent.artistPhone = data.artist_phone;
        talent.artistFaceBook = data.artist_facebook_link;
        talent.artistWechat = data.artist_wechat_link;
        talent.artistLinkedIn = data.artist_linked_link;
        talent.artistTwitter = data.artist_twitter_link;
        talent.artistCurrrentFreelancer = data.artist_freelancer;
        talent.artistCurrrentContractRecordLabel = data.artist_record_label;
        talent.artistCurrrentContractProductionCompany = data.artist_product_company;
        talent.artistCurrrentContractArtistManagementCompany = data.artist_management_company;
        // talent.artistProduceYourDownSoundRecordingAndOrMusicVideo = data.have_sound_recording;
        talent.artistRecordNewSongsWithANewRecordLabel = data.artist_is_record_new_song;
        talent.artistPerformInATicketedSoloConcert = data.artist_is_solo_concert;
        talent.artistPerformInEventsSuchAsMusicFestivalAndMusicConcerts = data.artist_is_events;
        talent.artistPerformInPrivatelyOrganizedEvents = data.artist_is_private_organised;
        talent.artistToAppearInCommercials = data.artist_is_appear_commericals;
        talent.artistToSeekCooperationWithCommercial = data.artist_is_seek_cooperations;
        talent.artistToSellSoundRecordingsAndMusicVideosDirectlyToConsumers= data.artist_is_sell_sound;
        talent.artistNonRomanizedName = data.artist_romanized_name;
        if(data.artist_file_avatar.length >0){
            if (fs.existsSync(path.join(__dirname,'../public/'+data.artist_file_avatar))) {
                talent.artistsPictures = '/' + data.artist_file_avatar;
            }
        }
        talent.save(function(err){
            if(err){
                return res.json(200, {error: 1, msg: "Could not save talent. Try again later"});
            }else {
                return res.json(200, {error: 0, msg: "Edit talent profile successful", _id: talent._id});
            }
        });
    });

    app.get('/autocomplete_artist',isLoggedIn, function(req, res) {
        var keyword = req.param('term');
        var type = req.param('type');
        if(type == undefined){
            Artist.find(
            {
                $and:[
                    {$or:[
                            {artistNonRomanizedName: new RegExp(keyword,'i')},
                            {artistProfessionName: new RegExp(keyword,'i')}
                    ]},
                    {artistUserRefer: req.session.passport.user._id}
                ]
            }).exec(function(err, data){
                return res.json(200, data);
            });
        }else{
            Artist.find(
            {
                $and:[
                    {$or:[
                            {artistNonRomanizedName: new RegExp(keyword,'i')},
                            {artistProfessionName: new RegExp(keyword,'i')}
                    ]},
                    {artistUserRefer: req.session.passport.user._id},
                    {artistType: type}
                ]
            }).exec(function(err, data){
                return res.json(200, data);
            });
        }
    });

    app.post('/activate_talent/:id', isLoggedIn, async function(req, res){
        var talent_id = req.params.id;
        var [talentObject] = await Promise.all([
            Artist.findOne({
                $and:[
                    {_id: talent_id},
                    {artistUserRefer: req.session.passport.user._id}
                ]
            }).exec()
        ]);
        if(talentObject){
            if(talentObject.artistDisabled){
                talentObject.artistDisabled = false;
            }else{
                talentObject.artistDisabled = true;
            }
            talentObject.save((error) => {
                if (error) {
                    return res.json(200, {error: 1, msg: 'Sorry, something wrong'});
                }
                if(talentObject.artistDisabled){
                    return res.json(200, {error: 0, msg: "Talent has been disabled"});
                }else{
                    return res.json(200, {error: 0, msg: "Talent has been enable"});
                }
            });
        }else{
           return res.json(200, {error: 1, msg: 'Sorry, something wrong'});
        }
    });
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()){
        return next();
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
        if (req.isAuthenticated())
            return next();
    }
    req.flash('info',"You don't have permission. Please login as owner role");
    res.redirect('/permission');
}
