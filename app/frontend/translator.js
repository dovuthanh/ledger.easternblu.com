const PinYin = require('hanzi-to-pinyin');
const JPTranslit = require('jp-conversion');

window.Translator = {
	detect_non_romanized: function detect_non_romanized(song_title, song_chinese_title, callback) {
		$.ajax({
		  url: 'https://translate.yandex.net/api/v1.5/tr.json/detect?key=trnsl.1.1.20180316T064349Z.d4ae36fb8e10fe6c.97fa35f998b6594aaa0f0033982c32d1949a1c14&text=' + song_title,
		  type: 'GET',
		  success: function success(response) {
		    console.log(response);
		    if (response.lang == 'zh') {
		      PinYin(song_title).then(function (response1) {
		        console.log(response1);
		        var translit = '';
		        response1.forEach(function (character) {
		          translit += ' ' + character[0].toLowerCase();
		        });
		        callback(translit);
		      }).catch(function (err) {
		        console.log(err);
		        callback('');
		      });
		    } else if (response.lang == 'ja') {
		      var translit = JPTranslit.convert(song_title);
		      console.log(translit);
		      callback(translit.romaji);
		    }
		  }
		});
	}
}