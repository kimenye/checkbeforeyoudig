module.exports = {
	Environment: {
		port : process.env.PORT,
		database : process.env.MONGOHQ_URL,
		url : "http://dialbeforeyoudig.herokuapp.com",
		mail_from_address : 'checkbeforeyoudig@sprout.co.ke',
		smtp_server : "smtp.gmail.com",
		test: false,
		name: "Check Before You Dig",
		smtp_port : "587"
	}
}