
/*
 * GET home page.
 */

exports.index = function(req, res){
  // res.render('index', { title: 'Dial Before You Dig', layout: 'layout_full' })
	res.render('index', { title: 'Check Before You Dig', layout: 'layout' })
};