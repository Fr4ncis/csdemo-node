var reqforwarder = require('./requestsForwarder');
var utils = require('./utils');
var cookie; // stores cookie, not persistent

reqforwarder.start('https://api.couchsurfing.org',3019);

// session is stored on the proxy server
reqforwarder.appendHandler('/sessions', function getCookies(req,res,next) {
	if (reqforwarder.statusCode == 200) {
		var cookieString = "";
		for(var i = 0; i < reqforwarder.headers['set-cookie'].length; i++)
			cookieString += reqforwarder.headers['set-cookie'][i].split(";").shift()+ "; ";
		cookie = cookieString.substr(0,cookieString.length-2);
	}
	next();
});

reqforwarder.appendHandler({match:/\/msearch.*/}, function getCookies(req,res,next) {
	var xpath = require('xpath'),
	dom = require('xmldom').DOMParser;
		
	zlib.gunzip(reqforwarder.body, function(err, decoded) {
		var doc = new dom().parseFromString(decoded.toString());
		//var part = xpath.select("//*[@class='results']", doc);
		var ids = xpath.select("//*[@class='results']//article", doc);
		var names = xpath.select("//*[@class='results']//h2", doc);
		var images = xpath.select("//*[@class='results']//img", doc);
		var friends_ref = xpath.select("//*[@class='results']//span[@class='num']", doc);
		console.log(typeof friends_ref[0]);
		var finalString = [];
		for (var el in names)
		{
			finalString.push({
				id: ids[el].attributes[0].nodeValue,
				name: names[el].childNodes[0].data,
				picture: images[el].attributes[0].value,
				friends: Number(/\d+/.exec(friends_ref[el].childNodes[0].data)[0]),
				references: Number(/\d+/.exec(friends_ref[Number(el)+1].childNodes[0].data)[0])
			});
		}
		reqforwarder.headers = {
			'Content-Type':'application/json',
			'Content-Encoding':'gzip'
		};
		zlib.gzip(JSON.stringify(finalString), function(err, encoded) {
			reqforwarder.body = encoded;
			next();
		});
	});
});

// reqforwarder.appendHandler({unmatch:/users\/(\d*)\/.*/}, function getCookies(req,res,next) {	
// 	console.log('unmatch user');
// 	next();
// });

// for debugging purposes

var zlib = require('zlib');
// reqforwarder.appendHandler('', function printOut(req, res, next) {
// 	if (req.originalUrl == '/sessions') { next(); return; }
// 	
// 	zlib.gunzip(reqforwarder.body, function(err, decoded) {
// 	    console.log("Response: "+decoded);
// 	});
// 	
// 	next();
// });

reqforwarder.prependHandler({exclude: '/sessions'}, function setCookies(req,res,next) {
	req.headers = utils.headers;
	req.headers['Cookie'] = cookie;
	next();
});