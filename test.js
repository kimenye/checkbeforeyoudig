// By the end of the day, will have jasmine integrated and have better tests

// Data provider
var DataProvider = require('./dataprovider').DataProvider;
var data = new DataProvider();

function testCreateUser() {
	var token = generateUUID();
	data.createUser(function(user) {
		console.log("Created : " + user.emailAddress + " Occupation: " + user.occupation + "Token: " + token);
	}, "trevor@kimenye.com", "Developer", token
	);
}

function testFindUserByEmail() {
	var expectedEmail = "trevor@kimenye.com";
	data.findUserByEmail(function(user) {
		 		if (user && user.emailAddress === expectedEmail) {
		 			console.log("User found");
		 		} else {
		 			console.log("User not found");
		 		}
		console.log(user);
	}, "trevor@kimenye.com");
}

function testFindUserByToken() {
	var expectedToken = "c84257cdef11473cd4e61e7e01f32db6";
	data.findUserByToken(function(user) {
		 		if (user.token === expectedToken) {
		 			console.log("User found");
		 		} else {
		 			console.log("User not found");
		 		}
		console.log(user);
	}, "c84257cdef11473cd4e61e7e01f32db6");
}

function testUpdateUser() {
	var date = new Date()
	data.updateUser(function(user) {
		console.log("Password set: " + user.password);
		console.log("Activated: " + user.activated);
	}, "c84257cdef11473cd4e61e7e01f32db6", date, "secret");
}

function generateUUID() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = d / 16 | 0;
			return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
		});
		return uuid;
	}

testCreateUser();
testFindUserByEmail();
testFindUserByToken();
testUpdateUser();