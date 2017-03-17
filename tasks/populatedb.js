var async = require('async');
var request = require('request');
var debug = require('debug')('populatedb');

var Movie = require('../app/models/movie');
var Director = require('../app/models/director');
var MovieLocation = require('../app/models/movieLocation');

var PopulateModule = function(env){
	// Config

	// Geocoder
	var geocoderProvider = 'google';
	var httpAdapter = 'https';
	var extra = {
		apiKey: env.GOOGLE_GEOCODER_KEY,
		formatter: null
	};

	var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

	// Private functions

	/* 
	 * Adds image from omdb to movie model
	 * @param {object} movie - Mongoose movie model
	 */
	function addImageToMovie(movie){
		var omdbAPIUrl = "http://www.omdbapi.com";
		var query = { t: movie.title };

		getJSON({url: omdbAPIUrl, qs: query}, function(data){
			// Save image poster to Movie document
			if(data){
				movie.picture = data.Poster;
				movie.save();
			}
		});
	};

	/* 
	 * Saves movie data to directors and movie collection
	 * @param {object} movieData - movie data
	 * @param {function} next - callback
	 */
	function saveMovieData(movieData, next){
		async.waterfall([
			function(callback){
				// Save director and pass model id to next
				saveDirector(movieData, function(directorId){
					callback(null, movieData, directorId);
				});
			},
			function(movieData, directorId, callback){
				// Save movie model using director id from result
				if(!directorId){
					callback(new Error("Director could not be found"), null);
				}else{
					saveMovie(movieData, directorId, function(){
						callback(null, null);
					});
				}
			}
		], function(err, result){
			if(err) throw err;
			next();
		});
	}

	/*
	 * Saves the director if not already in the collection
	 * @param {object} movieData - movie data
	 * @param {function} next - callback
	 */
	function saveDirector(movieData, next){
		Director.findOne({ name: movieData.director }, function(err, director){
			if(err){
				console.log("Failed to find movie ", movieData);
				console.log("Error: ", err);
			}else{
				if(!director){
					var newDirector = new Director({name: movieData.director});
					newDirector.save(function(err){
						if(err) throw err;
						next(newDirector._id);
					});
				}else{
					next(director._id);
				}
			}
		});
	}

	/*
	 * Saves movie to db if exist and location
	 * @param {object} movieData - movie data
	 * @param {string} directorId - director model id
	 * @param {function} next - callback
	 */
	function saveMovie(movieData, directorId, next){
		Movie.findOne({ title: movieData.title }, function (err, movie) {
			if(!err){
				// Save movie if not in db
				if(!movie){
					var newMovie = new Movie({
						title: movieData.title,
						release_year: movieData.release_year,
						director: directorId,
					});

					// Get movie image and add to model
					addImageToMovie(newMovie);

					// Save new movie
					newMovie.save();
				}

				// Save location to movie model
				var movieModel = newMovie || movie;
				saveLocation(movieModel, movieData.locations, function(err, results){
					// Log Error
					if(err){
						console.log("Error saving movie: ", movieModel, " with location ", movieData.locations);
						console.log("Error: ", err);
					}
					next();
				});

			}else{
				console.log("Failed to find movie ", movieData);
				console.log("Error: ", err);
			}
		});
	};

	
	/*
	 * Saves movie location to movielocation collection
	 * @param {object} movie - movie data
	 * @param {string} location - movie location
	 * @param {function} next - callback
	 */
	function saveLocation(movie, location, next){
		if(!movie || !location){
			// Log and execute callback
			next(new Error("No movie or location specified"), null);
			return;
		}

		var newLocation = new MovieLocation({
			movie_id: movie._id,
			location: location
		});

		// async config
		var numRetries = 5;
		var requestInterval = 1000;

		async.retry({ times: numRetries, interval: requestInterval },
			function(callback, results){

				// Geocode location
				geocoder.geocode(newLocation.location + " San Francisco, CA", function(err, res) {
					if(!err){
						newLocation.latitude = res[0].latitude;
						newLocation.longitude = res[0].longitude;
						newLocation.save(function(err){
							if(err){
								console.log("Error saving location: ", location);
								console.log("Error: ", err);
							}else{
								debug("Location saved for: ", location);
							}
						});

						// Successful callback
						callback(null, null);
					}else{
						console.log("Couldn't find location for ", location);
						console.log("Error: ", err);

						// Throw unsuccessful callback and retry
						callback(err, null);
					}
				});
			}, 
			function(err, results){
				next(err, results);
			});
	};

	/* Gets json from url
	 * @param {string} url - url
	 * @param {function} callback - callback
	 */
	function getJSON(url, callback){
		request(url, function (error, response, body) {
			if(!error && response.statusCode == 200){
				callback(JSON.parse(body));
			}else{
				console.log("Error: ", error);
			}
		});
	};

	// Public functions

	/**
	 * Populates db with movies from remote movie dataset
	 * param {string} query - Text input
	 * param {string} query - Text input
	*/
	var populateMoviesToDB = function(next){
		var dataSetUrl = env.SF_DATASET_URL || "https://data.sfgov.org/resource/wwmu-gmzc.json";
		getJSON(dataSetUrl, function(data){
			debug("Data set length %s", data.length);
			// Place all movies in database
			async.eachSeries(data,
				function(d, callback){
					debug("Trying to save: %s", d.title);
					saveMovieData(d, function(){
						debug("Done: %s", d.title);
						callback(null);
					});
				},
				function(err){
					if(err){
						console.log("Error while populating db", err);
					}else{
						console.log("Finished populating db.");
						next();
					}
				});
			// Callback
			if(next) next();
		});
	};


	// Expose public functions
	return {
		populateMoviesToDB: populateMoviesToDB
	};
};

module.exports = PopulateModule;