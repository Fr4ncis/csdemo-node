var baseOptions = function (hashArgs) {
	var options = {
		host: 'api.couchsurfing.org',
		method: 'GET',
		port: 443,
		headers: {
		  'Content-Type':'application/json',
		  'Accept-Language': 'en-gb',
		  'X-Client-Version':'platform=iphone;version=1.4.3',
		  'Accept':'application/vnd.couchsurfing-v1+json',
		  'Accept-Encoding':'gzip, deflate',
		  'User-Agent':'CouchSurfing/1.4.3 CFNetwork/672.0.8 Darwin/14.0.0',
		}
	};
	
	extend(options, hashArgs);
	
	return options;
}

exports.headers = {
  'Content-Type':'application/json',
  'Accept-Language': 'en-gb',
  'X-Client-Version':'platform=iphone;version=1.4.3',
  'Accept':'application/vnd.couchsurfing-v1+json',
  'Accept-Encoding':'gzip, deflate',
  'User-Agent':'CouchSurfing/1.4.3 CFNetwork/672.0.8 Darwin/14.0.0',
}

var extend = function extend(obj, x) {
	for (var i in x)
	{
		if (typeof(x[i]) != "object") {
			obj[i] = x[i];
		}
		else
		{
			extend(obj[i],x[i]);
		}
	}
};

exports.baseOptions = baseOptions;
exports.extend = extend;