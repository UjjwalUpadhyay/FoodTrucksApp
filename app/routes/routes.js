var async = require('async');
var Movie = require('../models/movie');
var MovieLocations = require('../models/movieLocation');
var Director = require('../models/director');

module.exports = function (app, redisClient, env) {
	var dataSetUrl = env.SF_DATASET_URL || "https://data.sfgov.org/resource/wwmu-gmzc.json";

	app.get('/', function(req, res){
		res.render('index');
	});

	app.get('/autocomplete', function(req, res){
		var term = req.query.q.toLowerCase();
		var setName = env.REDIS_AUTOCOMPLETE_SET + req.query.tab + ":" + term;
		var query = "^" + term;
		var numResults = 10;

		// Check if query is in redis
		redisClient.zrevrange(setName, 0, numResults-1, function(err, response){
			if(err){
				console.log("Error with query: ", req.query.q);
				console.log("Error: ", err);
				throw err;
			}else if(response.length > 0){
				// Return cached response
				var result = response.map(function(d){ return JSON.parse(d); });
				res.json(result);
				return;
			}else{
				// Case insensitive regex
				var reg = new RegExp(query, 'i');

				// Search DB for movie or director given the query tab
				if(req.query.tab == "title"){
					Movie
						.find({title: reg})
						.limit(numResults)
						.exec(function (err, movies) {
							res.json(movies);
						});
				}else{
					Director
						.find({name: reg})
						.limit(numResults)
						.exec(function (err, directors) {
							res.json(directors);
						});
				}
			}
		});
	});

	app.get('/search', function(req, res){
		var id = req.query.id;
		var query = (req.query.tab == "title") ? {_id: id} : {director: id};
		// Get all movie locations given a movie id or director id
		getMovieLocations(query, function(results){
			res.json(results);
		});
	});

	app.get('/fullsearch', function(req, res){
		// Case insensitive search for title
		var reg = new RegExp('^' + req.query.title + '$', 'i');
		if(req.query.tab == "title"){
			// Get movie locations for a given title
			getMovieLocations({title: reg}, function(results){
				res.json(results);
			})
		}else{
			// Find a director and then find all movie locations
			Director.findOne({name: reg}, function(err, director){
				if(!director){
					// No directors matched query, return empty array
					res.json([]);
				}else{
					// Get all movie locations for the specified director
					getMovieLocations({director: director._id}, function(results){
						res.json(results);
					});
				}
			});
		}
	});

	// Helpers

	/*
	 * Returns all movie locations from a specified movie
	 * @param {object} query - Mongoose query object used in find()
	 * @param {function} callback - callback
	 */
	function getMovieLocations(query, callback){
		Movie
		.findOne(query)
		.populate('director')
		.exec(function(err, movie){
			if(!movie){
				// No movie found, return empty array
				callback([]);
			}else{
				MovieLocations.find({ movie_id: movie._id }, function(err, results){
					// Map results with compiled templates
					results = async.map(results, 
						function(d, callback){
							// Compile results to html template
							formatResult(d, movie, callback);
						}, 
						function(err, results){
							// Return results
							callback(results);
						});
				});
			}
		});
	}


	/*
	 * Formats movie data to be rendered in mapinfo template
	 * @param {object} location - mongoose location model
	 * @param {object} movie - mongoose movie model
	 * @param {function} callback - callback
	 */
	function formatResult(location, movie, callback){
		var context = {
			title: movie.title,
			picture: movie.picture,
			location: location.location,
			release_year: movie.release_year,
			director: movie.director.name,
			layout: false
		};

		// Compile template with formatted data
		app.render('templates/mapinfo', context, function(err, html){
			// Store rendered HTML and lat,lng points
			var output = {
				latitude: parseFloat(location.latitude),
				longitude: parseFloat(location.longitude),
				html: html
			};
			callback(null, output);
		});
	};

};