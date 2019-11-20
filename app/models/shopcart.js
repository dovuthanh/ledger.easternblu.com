module.exports = function ShopCart(cart) {
    this.items = cart.items || {};
    this.totalItems = cart.totalItems || 0;

    this.add = function(_id) {
        var cartItem = this.items[_id];
        if (!cartItem) {
            cartItem = this.items[_id] = {
                _id: _id
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