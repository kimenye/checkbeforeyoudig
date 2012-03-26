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
 * Find an user by providing their email address
 */
DataProvider.prototype.findUserByEmail = function(callback, email) {
	User.findOne({
		emailAddress : email
	}, function(error, user) {
		if(error)
			callback(error)
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
DataProvider.prototype.updateUser = function(callback, email, registrationDate, activated, password) {

	this.findUserByEmail(function(user) {
		user.registrationDate = registrationDate;
		user.activated = activated;
		user.password = password;

		user.save();
		callback(user);
	}, email);
};

exports.DataProvider = DataProvider;
