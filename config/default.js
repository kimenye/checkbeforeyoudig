module.exports = {
	Environment: {
		port : process.env.PORT,
		database : process.env.MONGOHQ_URL,
		url : "http://dialbeforeyoudig.herokuapp.com",
		mail_from_address : "jokhessa@gmail.com",  //'checkbeforeyoudig@sprout.co.ke',
		smtp_server : "smtp.gmail.com",
		smtp_port : "587"
	}
}