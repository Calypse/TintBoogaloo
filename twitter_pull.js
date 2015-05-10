var Twitter = require('twitter');
var fs = require('fs');
var async = require('async');

var client = new Twitter({
  consumer_key: 'qTfJ0DwjdU2nhT4VY7QigReNN',
  consumer_secret: '3NMiGZOl8FvMtbNGaCLFc8uQV7MXWd7adb0hyAXdPzVTQi5pap',
  access_token_key: '33439058-yfzpd3EQr24yrHqoPfGfsgwwQFIDn1zcDbbpdex6g',
  access_token_secret: 'Q5XrwNJIKnLFhA9n44b6sVZMJVmBlO4nSTWs8Dhbhivzt'
});
 
var params = {screen_name: 'nodejs'};
var tweet_arr = new Array(); // Array to hold body text

client.get('statuses/user_timeline', params, function(error, tweets, response){
	if (!error) {
		async.forEach(tweets, function(item, callback){
			tweet_arr.push(JSON.stringify(item["text"]));		
			callback();
		}, function(err){
				if(err){console.log(err);
			}
		}); 		
		
		console.log(tweet_arr);
	}
});
