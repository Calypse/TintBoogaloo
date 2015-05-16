var Twitter = require('twitter');
var async = require('async');
var sentiment = require('sentiment');
var express = require('express');
var bodyParser = require('body-parser');

// Express object
var app = express();

// Twitter Login
var client = new Twitter({
  consumer_key: 'qTfJ0DwjdU2nhT4VY7QigReNN',
  consumer_secret: '3NMiGZOl8FvMtbNGaCLFc8uQV7MXWd7adb0hyAXdPzVTQi5pap',
  access_token_key: '33439058-yfzpd3EQr24yrHqoPfGfsgwwQFIDn1zcDbbpdex6g',
  access_token_secret: 'Q5XrwNJIKnLFhA9n44b6sVZMJVmBlO4nSTWs8Dhbhivzt'
});


// Setup form parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Templating Engine
app.set('views', './views');
app.set('view engine', 'jade');

/*Front Page*/
app.get('/', function(req, res){
	res.render('index');
});

/*Serve User Search or Keyword Search*/
app.post('/search_action', function(req, res){
	if(req.body.opt === "User"){ // If user search is requested
		console.warn(req.body.search);
		getFullUserHistory(sortByScore, req.body.search, res, req.body.opt);
	} else if(req.body.opt === "Keyword"){ // If keyword search is requested
		getKeywordSearch(sortByScore, req.body.search, res, req.body.opt);
	}
});

app.listen(3000); //listen

/*Twitter User Timeline Pagination*/
/*callback: function to process tweets*/
/*username: name to req from Twitter API*/
/*res: response object to handle transmission*/
function getFullUserHistory(callback, username, res){
	var full_data = []; // return value
	var page_num = 0; // num of recursions occurred
	
	getFull(undefined, full_data); // pass in current max_id and container array

	function getFull(lastID, full){
		/*Twitter parameters*/
		args = {screen_name: username,
				count: 200,
				max_id: lastID // newest ID to pull
		};

		getTweetPage(args,'statuses/user_timeline', confirmResponse); // get page @ query stauses/user_timeline

		function confirmResponse(data){
			/*If less than 16 pages and data has been received*/
			if(data.length > username.length && data[data.length-1].id != args.max_id && page_num < 15){ // check if data has been recieved and no repeat IDs
				page_num++;

				async.each(data, function(item, callback){ // iterate over ever element of the JSON array
					full_data.push(item); // push RAW JSON to tweet array
					callback(); // confirmation callback
				}, function(err){
						if(err){console.log(err);
					}
				});
				getFull(data[data.length-1].id, data, full_data); // recursively call for next page with last tweet id
			} else {
				page_num = 15; // force stopping of page requests
				var rtrn = callback(full_data);

				/*Serve Page*/
				res.render('search_results', {query: username, score:rtrn.pop(), median: rtrn.pop(), lowest_score:rtrn[0], lowest_tweet:rtrn[1], highest_score: rtrn[rtrn.length-2], highest_tweet: rtrn[rtrn.length-1] ,userTweets: rtrn});
			}
		}
	}
}

/*Twitter Keyword Search*/
/*callback: function to process tweets*/
/*search_term: name to req from Twitter API*/
/*res: response object to handle transmission*/
function getKeywordSearch(callback, search_term, res){
	var full_data = [];
	args = {q: search_term,
				count: 100,
			};

	getTweetPage(args, 'search/tweets', confirmSearchResponse);

	function confirmSearchResponse(data){	
		if(data.length > 0){
			async.each(data, function(item, callback){ // iterate over ever element of the JSON array
				full_data.push(item); // push RAW JSON to tweet array
				callback(); // confirmation callback
			}, function(err){
				if(err){
					console.log(err);
				}
			});
			var rtrn = callback(full_data);
			
			/*Serve Page*/
			res.render('search_results', {query: search_term, score:rtrn.pop(), median: rtrn.pop(), lowest_score:rtrn[0], lowest_tweet:rtrn[1], highest_score: rtrn[rtrn.length-2], highest_tweet: rtrn[rtrn.length-1] ,userTweets: rtrn});
		}
	}
}

/*Perform GET and split result into array*/
/*args: twitter api params*/
/*query: search words to req from Twitter API*/
/*callback: function to hand off tweets*/
function getTweetPage(args, query, callback){
	client.get(query, args, function(error, tweets, response){
		if (!error) {
			if(query == 'search/tweets'){
				callback(tweets["statuses"]); // Account for Twitter search JSON structure
			} else {
				callback(tweets);
			}
		}
	});
}

/*Sort tweets by Sentiment Score and calcuate mean*/
/*Array of JSON formatted tweets to rank*/
function sortByScore(arr){
	var send_arr = new Array();
	var total_score = 0; // total num of tweets / scores

	arr.sort(function(a,b){return sentiment(a["text"])["score"] - sentiment(b["text"])["score"]; }); // sort by sentiment score
	
	async.forEach(arr, function(item, callback){
		var str = "" + item["text"];
		var scr = "" + sentiment(item["text"])["score"];
		total_score += parseInt(scr);
		send_arr.push(scr);
		send_arr.push(str);
	}, function(err){
		if(err){
			console.log(err);
		}
	});

	send_arr.push(total_score/(arr.length)); // calculate mean
	send_arr.push(total_score);
	return send_arr;
}