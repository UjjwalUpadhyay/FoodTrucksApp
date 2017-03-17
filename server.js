var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var handlebars = require('express-handlebars');
var dotenv = require('dotenv');
var mongoose = require('mongoose');
var async = require('async');
var redis = require("redis");

// Load environment
dotenv.load();

var app = express();

// MongoDB
mongoose.connect(process.env.MONGODB_CONNECTION_URL);
var connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error: "));

// Configuration
app.engine('handlebars', handlebars({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('port', process.env.PORT || 3000);

// Tasks

/* Opens mongoDB and populates db if not created
 * @param {function} callback - callback used in async
 */
var openDBConnection = function(callback){
	connection.once("open", function (cb) {
	  console.log("Database connected succesfully.");

		// Check if Movie collection exists
		connection.db.listCollections({name: "movies"})
		.next(function(err, collection) {
			if(!collection){
				// Populate DB if collection doesn't exist
				console.log("Populating movies");
				var populateModule = require('./tasks/populatedb')(process.env);
				populateModule.populateMoviesToDB(function(){
					// Callback for async series
					callback(null);
				});
			}else{
				// Callback for async series
				callback(null);
			}
		});
	});
};

/* 
 * Opens redis connection and flushes the cache
 * @param {function} callback - callback used in async
 */
var openRedisConnection = function(callback){
	// Open redis client conneciton
	var redisClient = (process.env.REDIS_URL) ? redis.createClient(process.env.REDIS_URL) : redis.createClient();
	redisClient.on("connect", function() {
		console.log("Redis connected succesfully.");
		// Flush redis db
		redisClient.flushall(function (didSucceed) {
			console.log("Redis db flushed.");
			// Callback
			callback(null, redisClient);
		});
		
	});
};

/* 
 * Caches movie/director names to redis for autocomplete suggestions
 * @param {object} redisClient - redis client
 * @param {function} callback - callback used in async
 */
var cacheDB = function(redisClient, callback){
	var autocompleteTask = require('./tasks/autocomplete')(redisClient, process.env);
	autocompleteTask.generateRedisAutocomplete();
	console.log("Finished redis caching");
	callback(null, redisClient);
};

// Open mongodb, redis, and cache the db
async.waterfall([openDBConnection, openRedisConnection, cacheDB],
 function(err, redisClient){
 	// Once all tasks are completed, load the routes
 	require('./app/routes/routes')(app, redisClient, process.env);
});

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});