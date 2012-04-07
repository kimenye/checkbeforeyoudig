// Doesn't work properly. Shows 0 assertions. Will fix it

// Data provider
var DataProvider = require('../dataprovider').DataProvider;
var data = new DataProvider();

//var User = require('../dataprovider').User;
//var user = new User();

describe("dataprovider", function() {

	var email = "test@kimenye.com";
	var occupation = "Developer";
	var token = "db07ddd580fa4f67a3f4fdcd8c21137c";
	var fullName = "Test";
	
	it("creates a user", function() {
		data.createUser(function(user) {
			expect(user.emailAddress).toEqual(email);
			expect(user.occupation).toEqual(occupation);
			expect(user.token).toEqual(token);
			expect(user.password).toBeUndefined();
			expect(user.registrationDate).toBeUndefined();
			expect(user.activated).toBeFalsy();
			expect(user.fullName).toEqual(fullName);
		}, email, occupation, token, fullName);
	});
	it("tries to create a user with an existing email", function() {
		data.createUser(function(user) {
			expect(user).toEqual(null);
		}, email, occupation, token);
	});
	it("finds a user with the given email", function() {
		data.findUserByEmail(function(user) {
			expect(user.emailAddress).toEqual(email);
		}, email);
	});
	it("finds a user with the given token", function() {
		data.findUserByToken(function(user) {
			expect(user.token).toEqual(token);
		}, token);
	});
	it("updates a user", function() {
		var date = new Date()
		data.updateUser(function(user) {
			expect(user.activated).toBeTruthy();
			expect(user.password).toEqual("secret");
			expect(user.registrationDate).toEqual(date);
		}, token, date, "secret");
	});
	it("deletes a user", function() {
		data.deleteUser(function(msg) {
			expect(msg).toEqual("Deleted");
		}, email);
	});
});
