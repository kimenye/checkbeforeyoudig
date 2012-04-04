// Data provider
var DataProvider = require('./dataprovider').DataProvider;
var data = new DataProvider();

var email = "test@kimenye.com";
var occupation = "Developer";
var token = "db07ddd580fa4f67a3f4fdcd8c21137c";

/**
 * Creates a user
 */
function testCreateUser() {
	data.createUser(function(user) {
		if(user) {
			console.log("Created : " + user.emailAddress + " Occupation: " + user.occupation + "Token: " + token);
		} else {
			console.log("Error creating user");
		}
	}, email, occupation, token);
}

/**
 * Tries to create a user with a previously saved email
 */
function testCreateUserAgain() {
	data.createUser(function(user) {
		if(user) {
			console.log("Created : " + user.emailAddress + " Occupation: " + user.occupation + "Token: " + token);
		} else {
			console.log("Error creating user");
		}
	}, email, occupation, token);
}

function testFindUserByEmail() {
	data.findUserByEmail(function(user) {
		if(user && user.emailAddress === email) {
			console.log("Find by email: User found");
		} else {
			console.log("Find by email: User not found");
		}
	}, email);
}

function testFindUserByToken() {
	data.findUserByToken(function(user) {
		console.log(token);
		if(user && user.token === token) {
			console.log("Find by token: User found");
		} else {
			console.log("Find by token: User not found");
		}
	}, token);
}

function testUpdateUser() {
	var date = new Date()
	data.updateUser(function(user) {
		console.log("Update user: Password set: " + user.password);
		console.log("Update user: Activated: " + user.activated);
	}, token, date, "secret");
}

function testDeleteUser() {
	data.deleteUser(function(msg) {
		console.log(msg);
	}, email);
}

testCreateUser();
testCreateUserAgain();
testFindUserByEmail();
testFindUserByToken();
testUpdateUser();
testDeleteUser();
