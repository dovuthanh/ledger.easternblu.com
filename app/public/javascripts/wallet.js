var private_key;
var address;
function generate_seed()
{
	var new_seed = lightwallet.keystore.generateRandomSeed();

	document.getElementById("seed").value = new_seed;

	// generate_addresses(new_seed);
}

var totalAddresses = 0;

function generate_addresses(seed, url, password){
	if(!lightwallet.keystore.isSeedValid(seed)){
		alert("Please enter a valid seed");
		return;
	}
	totalAddresses = 1;//prompt("How many addresses do you want to generate");
	lightwallet.keystore.createVault({
		password: password,
	  	seedPhrase: seed
	}, function (err, ks) {
	  	ks.keyFromPassword(password, function (err, pwDerivedKey) {
	    	if(err){
	    		alert(err);
	    	}
	    	else{
	    		ks.generateNewAddress(pwDerivedKey, totalAddresses);
	    		var addresses = ks.getAddresses();	
	    		
	    		var web3 = new Web3(new Web3.providers.HttpProvider(url));

	    		var html = "";

	    		for(var count = 0; count < addresses.length; count++){
					address = "0x" + addresses[count];
					private_key = ks.exportPrivateKey(address, pwDerivedKey);
					var balance = web3.eth.getBalance(address);
	    		}
	    		document.getElementById("role").value = address;
	    		document.getElementById("private_key").value = private_key;
	    		document.getElementById('btn-next').disabled = false;
	    	}
	  	});
	});
	    
}


function printWallet(pubKey, priKey){
	if(pubKey && priKey){
	 	window.open('/savekey?public_address='+pubKey+'&private_key='+priKey,'_blank');
	}else{
		alert('Canot print');
	}
}

function downloadWallet(seed, pubKey, priKey){
	if (pubKey && priKey) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent('Your infomation wallet account:\r\nYour public key: ' + pubKey + '\r\nYour private key: ' + priKey + '\r\nYour Seed: ' + seed));
		element.setAttribute('download', 'Wallet-'+ pubKey);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();
		document.body.removeChild(element);
	}
}

function usethis(){
	console.log('set cookie:', address);
	setCookie('Verse-account',address, 2);
	window.location.href='/';
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function send_ether(){
	var	seed = document.getElementById("seed").value;

	if(!lightwallet.keystore.isSeedValid(seed))
	{
		alert("Please enter a valid seed");
		return;
	}

	var password = prompt('Enter password for encryption', 'password');

	lightwallet.keystore.createVault({
		password: password,
	  	seedPhrase: seed
	}, function (err, ks) {
	  	ks.keyFromPassword(password, function (err, pwDerivedKey) {
	    	if(err)
	    	{
	    		alert(err);
	    	}
	    	else
	    	{
	    		ks.generateNewAddress(pwDerivedKey, totalAddresses);
	    		var addresses = ks.getAddresses();
	    		console.log(addresses);
	    		ks.passwordProvider = function (callback) {
			      	callback(null, password);
			    };

			    var provider = new HookedWeb3Provider({
  					host: "http://localhost:8545",
  					transaction_signer: ks
				});

			    var web3 = new Web3(provider);

			    var from = document.getElementById("address1").value;
				var to = document.getElementById("address2").value;
			    var value = web3.toWei(document.getElementById("ether").value, "ether");

			    web3.eth.sendTransaction({
			    	from: from,
			    	to: to,
			    	value: value,
			    	gas: 21000
			    }, function(error, result){
			    	if(error)
			    	{	
			    		alert(error);
			    	}
			    	else
			    	{
			    		alert("Txn hash: " + result);
			    	}
			    })
	    	}
	  	});
	});
}