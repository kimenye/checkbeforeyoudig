var mongoose = require('mongoose');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var url = process.env.MONGOHQ_URL || 'mongodb://localhost/cbug';
mongoose.connect(url);

var UserSchema = new Schema({
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
		}
		else {
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
		}
		else {
			callback(user);
		}
	});
};
/**
 * Create a user
 */
DataProvider.prototype.createUser = function(callback, email, occupation, token) {
	var user = new User();
	// Will add check for existing emails to prevent creation of users with the same email
	user.emailAddress = email;
	user.occupation = occupation;
	user.token = token;
	user.activated = false;

	user.save();
	callback(user);
};
/**
 * Update a user
 */
DataProvider.prototype.updateUser = function(callback, token, registrationDate, password) {

	this.findUserByToken(function(user) {
		user.registrationDate = registrationDate;
		user.activated = true;
		user.password = password;

		user.save();
		callback(user);
	}, token);
};

exports.DataProvider = DataProvider;
