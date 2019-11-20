module.exports = function Cart(cart) {
    this.items = cart.items || {};
    this.totalItems = cart.totalItems || 0;

    this.add = function(
        url,
        song_title,
        artist_name,
        owner_name,
        url_avatar,
        song_address,
        ower_address,
        type, 
        id,
        duration,) {
        var cartItem = this.items[id];
        if (!cartItem) {
            cartItem = this.items[id] = {
                url: url,
                song_title: song_title,
                artist_name: artist_name,
                owner_name: owner_name,
                url_avatar: url_avatar,
                song_address: song_address,
                ower_address: ower_address,
                type: type,
                id: id
            };
            this.totalItems++;
        }
    };

    this.remove = function(id) {
        delete this.items[id];
        if(this.totalItems>0)
            this.totalItems --;
    };
    
    this.getItems = function() {
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };
};