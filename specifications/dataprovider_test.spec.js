// Doesn't work. Will fix it
// Should delete user from the db after each run

// Data provider
var DataProvider = require('../dataprovider').DataProvider;
var data = new DataProvider();

var User = require('../dataprovider').User;
var user = new User();

describe("dataprovider", function() {

	
	var email = "trevor@kimenye.com";
	var occupation = "Developer";
	var token = generateUUID();

	it("creates a user", function() {
		data.createUser(function(user) {
			if(user) {
				this.user = user;
			}
		}, email, occupation, token);
		expect(user.emailAddress).toEqual(email);
		expect(user.occupation).toEqual(occupation);
		expect(user.token).toEqual(token);
		expect(user.password).toBeUndefined();
		expect(user.registrationDate).toBeUndefined();
		expect(user.activated).toBeFalsy();
	});
	it("finds a user with the given email", function() {
		data.findUserByEmail(function(user) {
		}, email);
		expect(user.emailAddress).toEqual(email);
	});
	it("finds a user with the given token", function() {
		data.findUserByToken(function(user) {
		}, token);
		expect(user.token).toEqual(token);
	});
	it("updates a user", function() {
		var date = new Date()
		data.updateUser(function(user) {
		}, token, date, "secret");
		expect(user.activated).toBeTruthy();
		expect(user.password).toEqual("secret");
		expect(user.registrationDate).toEqual(date);
	});
});
function generateUUID() {
	var d = new Date().getTime();
	var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = d / 16 | 0;
		return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
	});
	return uuid;
}