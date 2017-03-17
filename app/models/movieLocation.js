var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var MovieLocationSchema = new mongoose.Schema({
	movie_id: {
		type: ObjectId,
		ref: 'Movie',
		required: true
	},
	location: {
		type: String,
		required: true
	},
	latitude: {
		type: String
	},
	longitude: {
		type: String
	}
});

module.exports = mongoose.model('MovieLocation', MovieLocationSchema);