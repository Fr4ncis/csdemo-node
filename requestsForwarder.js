// FIXME: there is an issue with non-JSON payload (urlencoded)

// modules
var https = require('https');
var http = require('http');
var express = require('express');
var app;

var targetProto, targetServer, listenPort = 3000;

var start = function(target, port) {
	targetProto = target.split("://")[0];
	targetServer = target.split("://")[1];
	listenPort = port;
	
	// express
	app = express();

	// does not support multipart
	app.use(express.json());
	app.use(express.urlencoded());
		
	// forwards the request
	app.use(requestForwarder);
	
	// forward response to client
	app.use(responseForwarder);
	
	app.listen(listenPort);
}

var appendHandler = function(path, myfunc) {
	addHandler("append",path,myfunc);
};

var prependHandler = function(path, myfunc) {
	addHandler("prepend",path,myfunc);
};

function addHandler(when, path, myfunc) {
	var forwarder = (when=="append"?responseForwarder:requestForwarder);
	if (typeof path == 'string') {
		app.stack.splice(indexOf(forwarder), 0, {route: path, handle: myfunc});
		return;
	}
	
	if (path.hasOwnProperty('exclude')) {
		var myPreFunc = function(req,res,next) {
			if (req.originalUrl == path.exclude) { next(); return; }
			myfunc.apply(myfunc, [req,res,next]);
		}
		app.stack.splice(indexOf(forwarder), 0, {route: '', handle: myPreFunc});
		return;
	}
	
	if (path.hasOwnProperty('match') || path.hasOwnProperty('unmatch')) {
		var property = path.hasOwnProperty('match')?'match':'unmatch';
		var myPreFunc = function(req,res,next) {
			if (property!='match' ^ !path[property].test(req.originalUrl)) { next(); return; }
			exports.match = path[property].exec(req.originalUrl);
			myfunc.apply(myfunc, [req,res,next]);
		}
		app.stack.splice(indexOf(forwarder), 0, {route: '', handle: myPreFunc});
	}
}

function indexOf(varToSearch)
{
	for (el in app.stack)
	{
		if (app.stack[el]['handle'] == varToSearch) return el;
	}
	return -1;
}

exports.start = start;
exports.appendHandler = appendHandler;
exports.prependHandler = prependHandler;

var requestForwarder = function requestForwarder(req, res, next) {
	delete exports.statusCode, exports.body, exports.headers, exports.match;
	
	//console.log(req);
	request(req, function(response,data) {
		exports.statusCode = response.statusCode;
		exports.body = data;
		exports.headers = response.headers;
		next();
	});
};

var responseForwarder = function responseForwarder(req, res, next) {
	res.status(exports.statusCode);
	res.header(exports.headers);
	res.write(exports.body);
	res.end();
}

function request(request, callback) {
	var postData = JSON.stringify(request.body);
	if (['POST','PUT','PATCH'].indexOf(request.method) != -1) request.headers['content-Length'] = postData.length;
	var options = baseOptions(request);
	var requester = (targetProto=="http"?http:https);
			
	process.stdout.write("("+targetProto+"://"+targetServer+options.path+") request..");
	
	var req = requester.request(options, function(res) {
		var data;
		
		console.log(res.statusCode);
		res.on('data', function(chunk) {
			if (data)
				data.concat(chunk);
			else
				data = new Buffer(chunk);
		});
		
		res.on('end', function() {
			callback(res,data);
		});
	});
	
	req.write(postData);
	req.end();
	
	//in case of various errors (usually errors lower than HTTP)
	req.on('error', function(e) {
	  //console.error(e);
	});
}

function baseOptions(request) {
	var options = {
		host: targetServer,
		method: request.method,
		path: request.url,
		port: (targetProto=="http"?80:443)
	};
	
	delete request.headers.host;
	options.headers = request.headers;
			
	return options;
}