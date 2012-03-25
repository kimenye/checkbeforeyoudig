// Data provider
var DataProvider = require('./dataprovider').DataProvider;
var data = new DataProvider();

function testCreateUser() {
	data.createUser(doSomethingWithUser, "trevor@kimenye.com"
	);
}

function doSomethingWithUser(user) {
	console.log("Doing something with " + user.emailAddress);
}

testCreateUser();