var mongoose = require('mongoose');
var lyricSchema = mongoose.Schema({
	lyricName: String,
	lyricManagementAccount: String
});

module.exports = mongoose.model('Lyric', lyricSchema);