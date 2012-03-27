// Data provider
var DataProvider = require('./dataprovider').DataProvider;
var data = new DataProvider();

function testCreateUser() {
	data.createUser(function(user) {
		console.log("Created : " + user.emailAddress + " Occupation: " + user.occupation);
	}, "trevor@kimenye.com", "Developer"
	);
}

function testFindUserByEmail() {
	data.findUserByEmail(function(user) {
		// var expectedEmail = "trevor@kimenye.com";
		// 		if (user.emailAddress === expectedEmail) {
		// 			console.log("User found");
		// 		} else {
		// 			console.log("User not found");
		// 		}
		console.log(user);
	}, "trevor@kimenye.com");
}

/*function testUpdateUser() {
	var date = new Date()
	data.updateUser(function(user) {
		console.log("Password set: " + user.password);
	}, "trevor@kimenye.com", date, true, "secret");
}*/


//testCreateUser();
testFindUserByEmail();
//testUpdateUser();