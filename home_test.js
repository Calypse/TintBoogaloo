var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', function(req, res){
	res.sendfile('./views/index.html');
});

app.post('/search_action', function(req, res){
	console.log(req);
	res.send('Received ' + req.body.search);
});

app.listen(3000);