var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var MovieSchema = new mongoose.Schema({
	title: {
		type: String,
		index: 1,
		required: true
	},
	release_year: {
		type: String,
		required: true
	},
	director: {
		type: ObjectId,
		ref: 'Director',
		required: true
	},
	picture: {
		type: String
	}
});

module.exports = mongoose.model('Movie', MovieSchema);