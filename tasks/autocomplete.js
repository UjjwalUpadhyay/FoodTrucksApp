var Movie = require('../app/models/movie');
var Director = require('../app/models/director');

var AutocompleteModule = function(redisClient, env){
	// Redis set names
	var titleSet = "title:";
	var directorSet = "director:";

	// Private functions

	/* Creates a new set containing the prefix and its associated data
	 * param {string} term - Query prefix term (ex. food => 'f', 'fo', 'foo')
	 * param {string} setName - redis set name
	 * param {object} data - data to be stored for the setname
	 */
	var _addToRedis = function(term, setName, data){
		var set = env.REDIS_AUTOCOMPLETE_SET + setName + term; 
		redisClient.zadd(set, 1, JSON.stringify(data), function(err, response){
			if(err){
				console.log("Error: ", err);
				throw err;
			}
		});
	};

	/* Given a query, generate all its prefixes and add to redis
	 * param {string} term - Query
	 * param {string} setName - redis set name
	 * param {object} data - data to be stored for the setname
	 */
	var _addPrefixesToCache = function(query, setName, data){
		var term = query.toLowerCase();
		for(var i=1; i<term.length; i++){
			// Cache each prefix of the query
			var prefix = term.slice(0, i);
			_addToRedis(prefix, setName, data);
		}
	};

	// Expose public functions
	return {

		// Adds all movie titles and director names to cache
		generateRedisAutocomplete: function(next){
			// Add movies to cache
			Movie.find({}, function(err, movies){
				if(err){
					console.log("Error generating autocomplete for Movies: ", err);
				}else{
					// Add all movie title prefixes to cache
					movies.forEach(function(movie){
						_addPrefixesToCache(movie.title, titleSet, movie);
					});
				}
			});

			// Add directors to cache
			Director.find({}, function(err, directors){
				if(err){
					console.log("Error generating autocomplete for Directors: ", err);
				}else{
					// Add all director name prefixes to cache
					directors.forEach(function(director){
						_addPrefixesToCache(director.name, directorSet, director);
					});
				}
			});
		}

	};
};

module.exports = AutocompleteModule;