var SongTest = require('../models/songtest');
var ArtistTest = require('../models/artisttest');
var Song = require('../models/song');
var Work = require('../models/composer');
var Promise = require('promise');
module.exports = function(app, passport, paginate) {

  app.get('/search-demo', async function(req, res) {
    var key = req.param('key');
    var type = req.param('type');

    if (type == undefined || type.length == 0) {
      return res.redirect('/404');
    }

    var songs = [];
    var itemCount = 0;
    [songs, itemCount] = await Promise.all([
      SongTest.find({
          $and:[
            {songContractAddress:{"$ne":""}},
            {songContractAddress:{$exists:true}},
            {$or:[
              {songTitle: new RegExp(key, 'i')},
              {songNonRomanizedtitle: new RegExp(key, 'i')},
              {songArtistName: new RegExp(key, 'i')}
           ]}
          ]
       }).populate('songArtistRefer').limit(req.query.limit).skip(req.skip).lean().exec(),
      SongTest.count({
        $and:[
            {songContractAddress:{"$ne":""}},
            {songContractAddress:{$exists:true}},
            {$or:[
              {songTitle: new RegExp(key, 'i')},
              {songNonRomanizedtitle: new RegExp(key, 'i')},
              {songArtistName: new RegExp(key, 'i')}
            ]}
          ]
       })
    ]);
   const pageCount = Math.ceil(itemCount / req.query.limit);

   res.render('search/search_demo', {
       session: req.session,
       songs: songs,
       pageCount: pageCount,
       itemCount: itemCount,
       currentPage: req.query.page,
       menu_index: 'home',
       pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
       key: key,
       type: type
   });
  });

  app.get('/search', async function(req, res) {
    var key = req.param('key');
    var type = req.param('type');

    if (type == undefined || type.length == 0) {
      return res.redirect('/404');
    }

    var songs = [];
    var composers = [];
    var itemCount = 0;
    if (type == 'work') {
      [composers, itemCount] = await Promise.all([
        Work.find({
          $and:[
            {composerContractAddress:{"$ne":""}},
            {composerContractAddress:{$exists:true}},
            {$or: [
              {composerSongTitle: new RegExp(key, 'i')},
              {composerName: new RegExp(key, 'i')},
              {composerRomanizedName: new RegExp(key, 'i')},
              {composerSongRomanizedTitle: new RegExp(key, 'i')}
            ]}
          ]
        }).limit(req.query.limit).skip(req.skip).lean().sort({_id: 'desc'}).exec(),
        Work.count({
          $and:[
            {composerContractAddress:{"$ne":""}},
            {composerContractAddress:{$exists:true}},
            {$or: [
              {composerSongTitle: new RegExp(key, 'i')},
              {composerName: new RegExp(key, 'i')},
              {composerRomanizedName: new RegExp(key, 'i')},
              {composerSongRomanizedTitle: new RegExp(key, 'i')}
            ]}
          ]
        })
      ]);
    }else {
      [songs, itemCount] = await Promise.all([
        Song.find({
            $and:[
              {songContractAddress:{"$ne":""}},
              {songContractAddress:{$exists:true}},
              {$or:[
                {songTitle: new RegExp(key, 'i')},
                {songNonRomanizedtitle: new RegExp(key, 'i')},
                {songArtistName: new RegExp(key, 'i')}
             ]}
            ]
         }).populate('songArtistRefer').limit(req.query.limit).skip(req.skip).lean().exec(),
        Song.count({
          $and:[
              {songContractAddress:{"$ne":""}},
              {songContractAddress:{$exists:true}},
              {$or:[
                {songTitle: new RegExp(key, 'i')},
                {songNonRomanizedtitle: new RegExp(key, 'i')},
                {songArtistName: new RegExp(key, 'i')}
              ]}
            ]
         })
      ]);
      
    }
   const pageCount = Math.ceil(itemCount / req.query.limit);

   res.render('search/search', {
      url: process.env.NETWORK_TRANSACTION,
       session: req.session,
       songs: songs,
       composers: composers,
       pageCount: pageCount,
       itemCount: itemCount,
       currentPage: req.query.page,
       menu_index: 'home',
       pages: paginate.getArrayPages(req)(10, pageCount, req.query.page),
       key: key,
       type: type
   });
  });
};
