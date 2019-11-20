var Bookmark = require('../models/bookmark');
var Cart = require('../models/cart');
const numItemsPerPage =10;
module.exports = function(app, passport){
	app.get('/bookmarks/:pageNumber(/optional/:pageNumber)?', function(req, res){
		if (!req.session.cart) {
        return res.render('bookmarks/bookmarks', {
          bookmarks: [],
          session: req.session,
          message: req.flash('updatePercent'),
          menu_index: 'bookmarks',
          currentPage: 1,
          totalPage:1,
        });
    }
    var currentPage = req.params.pageNumber;
    if(currentPage==undefined || currentPage <1){
    	currentPage = 1;
    }
    var cart = new Cart(req.session.cart);
    var collection = cart.getItems();
    if(currentPage>collection.length/numItemsPerPage){
    	currentPage = 1;
    }
    res.render('bookmarks/bookmarks',{
        session: req.session,
        message: req.flash('updatePercent'),
        bookmarks: collection.slice((currentPage-1)*numItemsPerPage, numItemsPerPage),
        currentPage: currentPage,
        totalPage: collection.length/numItemsPerPage,
        menu_index: 'bookmarks'
    });
		// Bookmark.find({userWalletAddress: req.session.passport.user.userWalletAddress}).populate('bookmarkSongRefer').exec(function(err, bookmarks){
		// 	console.log(bookmarks);
		// 	res.render('bookmarks', {
		// 		bookmarks: bookmarks,
		// 		session: req.session,
		// 		menu_index: 'bookmarks'
		// 	});
		// });
	});

	// app.post('/add-bookmarks', function(req, res){
	// 	var data = req.body;
	// 	console.log(data);
	// 	if (data) {
	// 		Song.findOne({songContractAddress: data.song_address}).exec(function(err, song){
	// 			if (!err && song) {
	// 				var newbookmark = new Bookmark();
	// 				newbookmark.userWalletAddress = req.session.passport.user.userWalletAddress;
	// 				newbookmark.songRefer = song;
	// 			}else{
	// 				res.redirect('/bookmarks');
	// 			}
	// 		});
	// 	}else{
	// 		res.redirect('/bookmarks');
	// 	}
	// });

	// app.delete('/delete-bookmark', function(req, res){
	// 	var _id = req.id;
	// 	if (_id != undefined) {
	// 		Bookmark.delete({_id: _id}).exec(function(err, data){
	// 			if (!err) {
	// 				res.redirect('/bookmarks');
	// 			}else{
	// 				res.redirect('/bookmarks');
	// 			}
	// 		});
	// 	}else{
	// 		res.redirect('/bookmarks');
	// 	}
	// });
}
