const XLSX = require('xlsx');
const {convertCSVToArray} = require('convert-csv-to-array');
const converter = require('convert-csv-to-array');
var User = require('../models/user');
var Song = require('../models/song');
var Merkle = require('../models/merkle');
var Artist = require('../models/artist');
var Export = require('../models/export');
var Email = require('./email.js');
var Promise = require('promise');
var fs = require('fs');
var path = require('path');
const user_send_email = process.env.GMAIL_USER_SEND;
const pass_send_email = process.env.GMAIL_PASS_SEND;
require('dotenv').config();
module.exports = {

    update_artist: async function update_artist() {
        var [user] = await Promise.all([
            User.findOne({userManagerWalletAddress: '0xf7cc551106a1f4e2843a3da0c477b6f77fa4a09d'})
        ]);
        Artist.update(
            {artistManagementAccount: '0xf7cc551106a1f4e2843a3da0c477b6f77fa4a09d'},
            {"$set": {"artistUserRefer": user}}, {multi: true}, function (error) {
            })
    },

    update_songID_ArtistID: async function update_songID_ArtistID() {
        var [songs] = await Promise.all([
            Song.find({songID: { $exists: false}}).exec()
        ]);
        for (var i = 0; i < songs.length; i++) {
            var song = songs[i];
            song.songID = new Date().getTime();
            var result = await Promise.all([
                song.save()
            ]);
        }


        var [artists] = await Promise.all([
            Artist.find({artistID: { $exists: false}}).exec()
        ]);

        for (var i = 0; i < artists.length; i++) {
            var artist = artists[i];
            artist.artistID = new Date().getTime();
            var result = await Promise.all([
                artist.save()
            ]);
        }
    },

    // process blockchain only
    process_export_data: async function process_export_data() {
        var [exportData] = await Promise.all([
            Export.findOne({
                $and: [
                    {BlockChainFile: {"$ne": ""}},
                    {Status: 0}
                ]
            }).populate('UserRefer').populate('MerkleRefer').exec()
        ]);
        if (exportData) {
            //process block chain data
            var merkleRoot = processBlockChain(exportData);

        }
    },

    process_export_artist_data: async function process_export_artist_data() {
        var [exportData] = await Promise.all([
            Export.findOne({
                $and: [
                    {ArtistFile: {"$ne": ""}},
                    {Status: 0}
                ]
            }).populate('UserRefer').populate('MerkleRefer').exec()
        ]);
        if (exportData) {
            processArtistInfo(exportData, exportData.MerkleRefer);
        }
    },

    process_export_song_data: async function process_export_song_data() {
        var [exportData] = await Promise.all([
            Export.findOne({
                $and: [
                    {SongFile: {"$ne": ""}},
                    {Status: 0}
                ]
            }).populate('UserRefer').populate('MerkleRefer').exec()
        ]);
        if (exportData) {
            processSongInfo(exportData);
        }
    },
};


async function processArtistInfo(exportData) {
    try {
        if (!exportData) return;
        var file = path.join(__dirname, '../public/' + exportData.ArtistFile);
        var workbook = XLSX.readFile(file);// ./assets is where your relative path directory where excel file is, if your excuting js file and excel file in same directory just igore that part
        var sheet_name_list = workbook.SheetNames; // SheetNames is an ordered list of the sheets in the workbook
        var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]); //if you have multiple sheets
        console.log(data);
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (row.hasOwnProperty("Id") || row["Id"].length > 0) {
                continue;
            }
            var [artist] = await Promise.all([
                Artist.findOne({
                    _id: row.hasOwnProperty("Id")
                })
            ]);

            if (artist) {
                if (row.hasOwnProperty("Non Romanized Name") && row["Non Romanized Name"].length > 0) {
                    artist.artistNonRomanizedName = row["Non Romanized Name"];
                }
                if (row.hasOwnProperty("Avartar url") && row["Avartar url"].length > 0) {
                    artist.songChineseTitle = row["Avartar url"];
                }
                if (row.hasOwnProperty("Profile") && row["Profile"].length > 0) {
                    artist.artistProfile = row["Profile"];
                }
                if (row.hasOwnProperty("Name in passport") && row["Name in passport"].length > 0) {
                    artist.artistNameInPassportOfficialIdentificationCard = row["Name in passport"];
                }
                if (row.hasOwnProperty("Email") && row["Email"].length > 0) {
                    artist.artistEmail = row["Email"];
                }
                if (row.hasOwnProperty("Phone") && row["Phone"].length > 0) {
                    artist.artistPhone = row["Phone"];
                }
                if (row.hasOwnProperty("Country") && row["Country"].length > 0) {
                    artist.artistCountryCode = row["Country"];
                }
                if (row.hasOwnProperty("Facebook") && row["Facebook"].length > 0) {
                    artist.artistFaceBook = row["Facebook"];
                }
                if (row.hasOwnProperty("Wechat") && row["Wechat"].length > 0) {
                    artist.artistWechat = row["Wechat"];
                }
                if (row.hasOwnProperty("LinkedIn") && row["LinkedIn"].length > 0) {
                    artist.artistLinkedIn = row["LinkedIn"];
                }
                if (row.hasOwnProperty("Twitter") && row["Twitter"].length > 0) {
                    artist.artistTwitter = row["Twitter"];
                }
                if (row.hasOwnProperty("Current freelancer") && row["Current freelancer"].length > 0) {
                    artist.artistCurrrentFreelancer = row["Current freelancer"];
                }
                if (row.hasOwnProperty("Contract record lablel") && row["Contract record lablel"].length > 0) {
                    artist.artistCurrrentContractRecordLabel = row["Contract product company"];
                }
                if (row.hasOwnProperty("Contract product company") && row["Contract product company"].length > 0) {
                    artist.artistCurrrentContractProductionCompany = row["Contract product company"];
                }
                if (row.hasOwnProperty("Artist management company") && row["Artist management company"].length > 0) {
                    artist.artistCurrrentContractArtistManagementCompany = row["Artist management company"];
                }
                if (row.hasOwnProperty("Record new song with a new record label") && row["Record new song with a new record label"].length > 0) {
                    artist.artistRecordNewSongsWithANewRecordLabel = row["Record new song with a new record label"];
                }
                if (row.hasOwnProperty("Perform in a ticket solo concert") && row["Perform in a ticket solo concert"].length > 0) {
                    artist.artistPerformInATicketedSoloConcert = row["Perform in a ticket solo concert"];
                }
                if (row.hasOwnProperty("Perform in event such as music festival and music converts") && row["Perform in event such as music festival and music converts"].length > 0) {
                    artist.artistPerformInEventsSuchAsMusicFestivalAndMusicConcerts = row["Perform in event such as music festival and music converts"];
                }
                if (row.hasOwnProperty("Perform in private organized Events") && row["Perform in private organized Events"].length > 0) {
                    artist.artistPerformInPrivatelyOrganizedEvents = row["Perform in private organized Events"];
                }
                if (row.hasOwnProperty("To appear in commercials") && row["To appear in commercials"].length > 0) {
                    artist.artistToAppearInCommercials = row["To appear in commercials"];
                }
                if (row.hasOwnProperty("To seek cooperation with commercial") && row["To seek cooperation with commercial"].length > 0) {
                    artist.artistToSeekCooperationWithCommercial = row["To seek cooperation with commercial"];
                }
                if (row.hasOwnProperty("To Sell sound recording and music video directly yo consumer") && row["To Sell sound recording and music video directly yo consumer"].length > 0) {
                    artist.artistToSellSoundRecordingsAndMusicVideosDirectlyToConsumers = row["To Sell sound recording and music video directly yo consumer"];
                }
                if (row.hasOwnProperty("produce your down sound Recording and music video") && row["produce your down sound Recording and music video"].length > 0) {
                    artist.artistProduceYourDownSoundRecordingAndOrMusicVideo = row["produce your down sound Recording and music video"];
                }
                var result = await Promise.all([
                    artist.save()
                ]);
            }
        }
        exportData.Status = 3;
        exportData.ErrorMessage = "";
        var [result] = await Promise.all([
            exportData.save()
        ]);
        // Email.send_process_mass_migration_sucess(exportData.UserRefer);
    } catch (ex) {
        exportData.Status = 2;
        exportData.ErrorMessage = "";
        var resutl = exportData.save();
        Email.send_process_mass_migration_fail(exportData.UserRefer);
        return null
    }
}

async function processBlockChain(exportData) {
    // try {
        if (!exportData) return;
        var filelist = [];
        var file = path.join(__dirname, '../public/' + exportData.BlockChainFile);
        var workbook = XLSX.readFile(file);// ./assets is where your relative path directory where excel file is, if your excuting js file and excel file in same directory just igore that part
        var sheet_name_list = workbook.SheetNames; // SheetNames is an ordered list of the sheets in the workbook
        var dataCSV = XLSX.utils.sheet_to_csv(workbook.Sheets[sheet_name_list[0]]); //if you have multiple sheets
        var data = convertCSVToArray(dataCSV, {
            type: 'array',
            separator: ',', // use the separator you use in your csv (e.g. '\t', ',', ';' ...)
        });
        var checkCSVFileStatus = true;
        var countErrorRow = 0;
        var errorMessage = 0;
        var merkleRoot;
        //read song data base
        for (var row in data) {
            if (row == 0) {
            } else {
                if (data[row][0].length != undefined && data[row][0].trim().length > 0) {
                    var obj = {};
                    obj.id = row;
                    obj.songname = "";
                    obj.singername = "";
                    obj.duration = "";
                    obj.publishdate = "";
                    for (var item in data[row]) {
                        if (item <= data[row].length) {
                            if (item == 0) { // name
                                obj.songname = data[row][item].length == 0 ? '' : data[row][item];
                            } else if (item == 1) { // singer
                                obj.singername = data[row][item].length == 0 ? '' : data[row][item];
                            } else if (item == 2) { // duration
                                obj.duration = data[row][item].length == 0 ? '' : data[row][item];
                            }
                            else if (item == 3) { // publish date
                                obj.publishdate = data[row][item].length == 0 ? '' : data[row][item];
                            }
                        }
                    }
                    var result = validateRow(obj, filelist, row);
                    if (!result) {
                        countErrorRow++;
                        checkCSVFileStatus = false;
                        console.log(obj.errorMessage);
                        errorMessage += obj.errorMessage + '\n';
                    }
                    filelist.push(obj);
                }
            }
        }
        if (checkCSVFileStatus) {
            //save data in database
            var completedList = [];
            var user = exportData.UserRefer;
            var new_merkle = new Merkle();
            new_merkle.batchId = new Date().getTime();
            new_merkle.userId = user._id;
            new_merkle.userRefer = user;
            new_merkle.merkleRoot = "";
            new_merkle.digitalSignature = "";
            new_merkle.contractAddress = '';
            new_merkle.dateRegistration = new Date();
            new_merkle.deployStatus = 0;
            new_merkle.confirmed = false;
            new_merkle.isCompleted = false;
            new_merkle.albumName = "";
            merkleRoot = new_merkle;
            var [resultMerkle] = await Promise.all([
                new_merkle.save()
            ])
            for (var i = 0; i < filelist.length; i++) {
                var song = filelist[i];
                var artist;
                if (song.singername.length != 0) {
                    [artist] = await Promise.all([Artist.findOne({
                        $and: [
                            {artistProfessionName: song.singername.replace(' ', '').trim()},
                            {artistType: 'Artist'}
                        ]
                    }).exec()]);
                    if (!artist) {
                        var new_artist = new Artist();
                        new_artist.artistProfessionName = song.singername.replace(' ', '').trim();
                        new_artist.artistNameInPassportOfficialIdentificationCard = song.singername.replace(' ', '').trim();
                        new_artist.artistManagementAccount = user.userManagerWalletAddress;
                        new_artist.artistType = 'Artist';
                        new_artist.artistMerkleRootRefer = new_merkle;
                        new_artist.artistUserRefer = exportData.UserRefer;
                        new_artist.artistID = new Date().getTime();
                        [artist] = await Promise.all([new_artist.save()]);
                    }
                    var newSong = new Song();
                    newSong.songID = new Date().getTime();
                    newSong.songTitle = song.songname.trim();
                    newSong.songUrl = "";
                    newSong.songExtension = "mp3";
                    newSong.songSize = "";
                    newSong.songOwnerName = user.userFullName.trim();
                    newSong.songOwnerContractAddress = user.userManagerWalletAddress;
                    newSong.songUserRefer = user;
                    newSong.createAt = new Date();
                    newSong.updatedAt = new Date();
                    newSong.songDuration = song.duration;
                    newSong.songDeployStatus = false;
                    newSong.songPublish = song.publishdate;
                    newSong.songIsMassRegistration = true;
                    newSong.songMerkleRoot = '';
                    newSong.songArtistRefer = artist;
                    newSong.songHash = "";
                    newSong.songArtistNameTemp = song.singername;
                    newSong.songLocalPath = song.songlocation;
                    newSong.avatarLocalPath = song.avatarlocation;
                    newSong.songCatNo = song.SongCat;
                    newSong.songOwnerId = user._id;
                    newSong.songErrorMessage = song.errorMessage;
                    completedList.push(newSong);
                }
            }
            if (resultMerkle) {
                for (var i = 0; i < completedList.length; i++) {
                    completedList[i].songMerkleRootRefer = merkleRoot;
                }
                var [result] = await Promise.all([
                    Song.insertMany(completedList)
                ]);

                exportData.Status = 3;
                exportData.ErrorMessage = "";
                exportData.MerkleRefer = new_merkle;

                var [result] = await Promise.all([
                    exportData.save()
                ]);
                Email.send_process_mass_migration_sucess(exportData.UserRefer);
            }
        } else {
            //send error
            exportData.Status = 2;
            exportData.ErrorMessage = errorMessage;
            var resutl = exportData.save();
            Email.send_process_mass_migration_fail(exportData.UserRefer);
        }
        return merkleRoot;
    // } catch (ex) {
    //     console.log(ex);
    //     exportData.Status = 2;
    //     exportData.MerkleRefer = new_merkle;
    //     exportData.ErrorMessage = ex;
    //     var resutl = exportData.save();
    //     Email.send_process_mass_migration_fail(exportData.UserRefer);
    //     return null
    // }
}

async function processSongInfo(exportData) {
    try {
        if (!exportData) return;
        var file = path.join(__dirname, '../public/' + exportData.SongFile);
        var workbook = XLSX.readFile(file);// ./assets is where your relative path directory where excel file is, if your excuting js file and excel file in same directory just igore that part
        var sheet_name_list = workbook.SheetNames; // SheetNames is an ordered list of the sheets in the workbook
        var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]); //if you have multiple sheets
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (row.hasOwnProperty("Id") || row["Id"].length > 0) {
                continue;
            }
            var [song] = await Promise.all([
                Song.findOne({_id: row.hasOwnProperty("Id")})
            ]);
            if (song) {
                if (row.hasOwnProperty("Non Romanized Name") && row["Non Romanized Name"].length > 0) {
                    song.songChineseTitle = row["Non Romanized Name"];
                }
                if (row.hasOwnProperty("Completed date") && row["Completed date"].length > 0) {
                    song.songCompleted = row["Completed date"];
                }
                if (row.hasOwnProperty("Content") && row["Content"].length > 0) {
                    song.songContent = row["Content"];
                }
                if (row.hasOwnProperty("Date first publish") && row["Date first publish"].length > 0) {
                    song.songDateFirstPublish = row["Date first publish"];
                }
                if (row.hasOwnProperty("Ower name") && row["Ower name"].length > 0) {
                    song.songOwnerName = row["Ower name"];
                }
                if (row.hasOwnProperty("Owner Romanized Name") && row["Owner Romanized Name"].length > 0) {
                    song.songRomanizedOwnerName = row["Owner Romanized Name"];
                }
                if (row.hasOwnProperty("Place of work") && row["Place of work"].length > 0) {
                    song.songPlaceOfWork = row["Place of work"];
                }
                if (row.hasOwnProperty("Date of completion") && row["Date of completion"].length > 0) {
                    song.songDateOfCompletion = row["Date of completion"];
                }
                if (row.hasOwnProperty("ISRCNumber") && row["ISRCNumber"].length > 0) {
                    song.songISRCNumber = row["ISRCNumber"];
                }
                if (row.hasOwnProperty("AlbumName") && row["AlbumName"].length > 0) {
                    song.songAlbumName = row["AlbumName"];
                }
                if (row.hasOwnProperty("Country") && row["Country"].length > 0) {
                    song.songCountry = row["Country"];
                }
                if (row.hasOwnProperty("Diaect") && row["Diaect"].length > 0) {
                    song.songDialect = row["Diaect"];
                }
                if (row.hasOwnProperty("Format CD") && row["Format CD"].length > 0) {
                    song.songFormatCD = row["Format CD"];
                }
                if (row.hasOwnProperty("Format DVD") && row["Format DVD"].length > 0) {
                    song.songFormatDVD = row["Format DVD"];
                }
                if (row.hasOwnProperty("Format Karaoke") && row["Format Karaoke"].length > 0) {
                    song.songFormatKaraoke = row["Format Karaoke"];
                }
                if (row.hasOwnProperty("Format Social") && row["Format Social"].length > 0) {
                    song.songFormatSocialMedia = row["Format Social"];
                }
                if (row.hasOwnProperty("Original Version") && row["Original Version"].length > 0) {
                    song.songOriginalVersion = row["Original Version"];
                }
                if (row.hasOwnProperty("Song remix version") && row["Song remix version"].length > 0) {
                    song.songRemixVersion = row["Song remix version"];
                }
                if (row.hasOwnProperty("Song extened version") && row["Song extened version"].length > 0) {
                    song.songExtendVersion = row["Song extened version"];
                }
                if (row.hasOwnProperty("Recording version") && row["Recording version"].length > 0) {
                    song.songReRecordingVersion = row["Recording version"];
                }
                if (row.hasOwnProperty("Genre") && row["Genre"].length > 0) {
                    song.songGenre = row["Genre"];
                }
                var result = await Promise.all([
                    song.save()
                ]);
            }
        }
        exportData.Status = 3;
        exportData.ErrorMessage = "";
        var [result] = await Promise.all([
            exportData.save()
        ]);
        Email.send_process_mass_migration_sucess(exportData.UserRefer);
    } catch (ex) {
        console.log(ex);
        exportData.Status = 2;
        exportData.ErrorMessage = "";
        var resutl = exportData.save();
        Email.send_process_mass_migration_fail(exportData.UserRefer);
        return null
    }
}

async function validateRow(obj, filelist, index) {
    obj.errorMessage = "";
    if (obj.songname.length == 0) {
        obj.errorMessage = "Please enter song name.";
        return false;
    }
    if (obj.singername.length == 0) {
        obj.errorMessage = "Please enter singer name.";
        return false;
    }
    if (obj.duration.length == 0) {
        obj.errorMessage = "Please enter song duration.";
        return false;
    }
    if (obj.publishdate.length == 0) {
        obj.errorMessage = "Please enter publish date.";
        return false;
    }
    var i = 0;
    filelist.forEach(element => {
        i++;
        if (element.errorMessage.length == 0) {
            if (element.songname == obj.songname && element.singername == obj.singername && element.duration == obj.duration && element.publishdate == obj.publishdate) {
                obj.errorMessage = "Duplicate song at row " + i;
                console.log(obj.errorMessage);
                return false;
            }
        }
    });
    var [songCheck] = await Promise.all([
        Song.findOne({
            $and: [
                {songTitle: obj.songname},
                {songDuration: obj.duration},
                {songArtistNameTemp: obj.singername},
                {songPublish: obj.publishdate},
            ]
        })
    ]);
    console.log(songCheck);
    if (songCheck) {
        obj.errorMessage = "Duplicate song at row " + index;
        console.log(obj.errorMessage);
        return false;
    }
    return true;
}





