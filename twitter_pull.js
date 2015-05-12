var Twitter = require('twitter');
var async = require('async');
var sentiment = require('sentiment');

// Twitter Login
var client = new Twitter({
 // HIDDEN
});

var params = {screen_name: process.argv[2], count: 200}; // cmd line arg username to search

//getTweetPage(sortByScore);
getFullHistory(sortByScore);

function getFullHistory(callback){
	var full_data = []; // return value
	var page_num = 0; // num of recursion
	getFull(undefined, new Array(), full_data); // pass in a temp page array

	function getFull(lastID, data, full){
		args = {screen_name: process.argv[2],
				count: 200,
				max_id: lastID
		};

		getTweetPage(args, confirmResponse, full_data);

		function confirmResponse(data, full){
			/*If less than 16 pages and data has been received*/
			if(page_num < 15 && data.length > 0){

				if(data[data.length-1].id != args.max_id){
					page_num++;

					async.each(data, function(item, callback){ // iterate over ever element of the JSON array
						full.push(item); // push RAW JSON to tweet array
						callback(); // confirmation callback
					}, function(err){
							if(err){console.log(err);
						}
					});	
					getFull(data[data.length-1].id, data, full.concat(data));
				} else {
					page_num = 15;
					console.log("End of tweets @ " + data[data.length-1].id);
					//console.log(full);
					callback(full);
				}
			}
		}
	}
}

/*Perform GET and split result into array*/
function getTweetPage(args, callback, param1){
	var tweet_arr = [];

	client.get('statuses/user_timeline', args, function(error, tweets, response){
		if (!error) {
			async.each(tweets, function(item, callback){ // iterate over ever element of the JSON array
				//tweet_arr.push(JSON.stringify(item["text"])); // save all text bodies, strip irrelevant data		
				tweet_arr.push(item); // push RAW JSON to tweet array
				//console.log("Pulling with max_id " + args.max_id);
				callback(); // confirmation callback
			}, function(err){
					if(err){console.log(err);
				}
			});	

			callback(tweet_arr, param1);
		}
	});
}

function sortByScore(arr){

	arr.sort(function(a,b){return sentiment(a["text"])["score"] - sentiment(b["text"])["score"]; });
	
	async.forEach(arr, function(item, callback){
		console.log("["+sentiment(item["text"])["score"] +"] " + item["text"]);
	}, function(err){
		if(err){
			console.log(err);
		}
	});
}
