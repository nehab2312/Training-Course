var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

if (env === 'production') {
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres'
	});
} else {
	sequelize = new Sequelize(undefined, undefined, undefined, {
		'dialect': 'sqlite',
		'storage': __dirname + '/data/dev-todo-api.sqlite'
	});
}

var db = {};

db.course = sequelize.import(__dirname + '/models/course.js');
db.course_subsections = sequelize.import(__dirname + '/models/course_subsections.js');
db.course_user = sequelize.import(__dirname + '/models/course_user.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.token = sequelize.import(__dirname + '/models/token.js');

db.sequelize = sequelize;
db.Sequelize = Sequelize;



module.exports = db;