var mongoose = require('mongoose');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var CONFIG = require('config').Environment

var url = CONFIG.database;
mongoose.connect(url);

var UserSchema = new Schema({
	fullName: {
		type : String
	},
	emailAddress : {
		type : String
	},
	occupation : {
		type : String
	},
	token : {
		type : String
	},
	password : {
		type : String
	},
	registrationDate : {
		type : Date
	},
	activated : {
		type : Boolean
	}
});

/**
 * Define Model
 */
var User = mongoose.model('User', UserSchema);
DataProvider = function() {
};
/**
 * Find a user by providing their email address
 */
DataProvider.prototype.findUserByEmail = function(callback, email) {
	User.findOne({
		emailAddress : email
	}, function(error, user) {
		if(error) {
			callback(error);
		} else {
			callback(user);
		}
	});
};
/**
 * Find a user by providing their token id
 */
DataProvider.prototype.findUserByToken = function(callback, tokenId) {
	User.findOne({
		token : tokenId
	}, function(error, user) {
		if(error) {
			callback(error);
		} else {
			callback(user);
		}
	});
};
/**
 * Create a user
 */
DataProvider.prototype.createUser = function(callback, email, occupation, token, name) {

	this.findUserByEmail(function(user) {
		if(user) {
			callback(null);
		} else {
			var newUser = new User();
			newUser.emailAddress = email;
			newUser.occupation = occupation;
			newUser.token = token;
			newUser.fullName = name;
			newUser.activated = false;

			newUser.save();
			callback(newUser);
		}
	}, email);

};
/**
 * Update a user. Is used when activating a user acc and when a user resets their password
 */

DataProvider.prototype.updateUser = function(callback, token, registrationDate, password) {

	this.findUserByToken(function(user) {
		if(user) {
			// Checks if user is not activated before activating them and setting the registration date
			if(!user.activated) {
				user.registrationDate = registrationDate;
				user.activated = true;
			}
			
			user.password = password;

			user.save();
			callback(user);
		} else {
			callback(null);
		}

	}, token);
};


/**
 * Deletes a user
 */
DataProvider.prototype.deleteUser = function(callback, email) {

	this.findUserByEmail(function(user) {
		if(user) {
			user.remove();
			callback("Deleted");
		} else {
			callback("User not found");
		}
	}, email);
};

exports.DataProvider = DataProvider;
exports.User = User;