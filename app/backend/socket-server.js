module.exports = function(app, io) {
	var rawTx = ''
	var chat = io.on('connect', function(socket){
		console.log('New connection');
		socket.on('checking-connection', function(data){
			var dt = {
		        ready: true
		      };
		    socket.emit('ready-to-connect', dt)
		});

		socket.on('em-sign-in', function(data){
			var room_id = data['room_id'];
			var pub_key = data['pub_key'];
			socket.in(room_id).emit('add-public-key-sign-in', {
				pub_key: pub_key
			});
			socket.leave(socket.room);
		});

		socket.on('em-sign-up', function(data){
			var room_id = data['room_id'];
			var pub_key = data['pub_key'];
			socket.in(room_id).emit('add-public-key-sign-up', {
				pub_key: pub_key
			});
			socket.leave(socket.room);
		});

		socket.on('em-sign-infomation', function(data){
			var room_id = data['room_id'];
			var pub_key = data['pub_key'];
			socket.in(room_id).emit('add-public-key-sign-infomation', {
				pub_key: pub_key
			});
			socket.leave(socket.room);
		});

		socket.on('data-sign-transaction', function(data){
			var room_id = data['room_id'];
			var room_type = data['room_type'];
			var client = data['client'];
			var txSign = data['txSign'];
			if (client == 'mobile' && room_type == "sign-transaction" && txSign != undefined) {
				socket.in(room_id).emit('sign-transaction', {
					txSign: txSign
				});
			}
		});

		socket.on('join-to-room', function(data){
			var room_id = data['room_id'];
			var client = data['client'];
			var room_type = data['room_type'];
			if (socket.room) {
				socket.leave(socket.room)
			}
			socket.room = room_id
			socket.join(room_id);
			if (client == 'mobile' && room_type == 'sign-transaction') {
				socket.in(room_id).emit('req-data-transaction', null)
			}
		});

		socket.on('join-to-sign-room', function(data){
			var room_id = data['room_id'];
			var client = data['client'];
			var room_type = data['room_type'];
			if (socket.room) {
				socket.leave(socket.room)
			}
			socket.room = room_id;
			socket.join(room_id);
			if (client == 'mobile' && room_type == 'sign-digital-signatures') {
				var dt = {
					digital_signatures: data['digital_signatures']
				}
				socket.in(room_id).emit('digital-signed', dt);
			}
		});

		socket.on('res-data-transaction', function(data){
			var room_id = data['room_id']
			var room_type = data['room_type']
			var client = data['client']
			var tx = JSON.stringify(data['rawTx']);
			if (room_type == 'sign-transaction' && client == 'browser' && tx != undefined) {}
			io.to(room_id).emit('data-transaction', {
				room_id: room_id.toString(),
				room_type: room_type,
				rawTx: tx
			});
		});
	});
}