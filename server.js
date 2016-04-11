var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcryptjs');
var middleware = require('./middleware.js')(db);
var jsreport = require('jsreport');
var dateFormat = require('dateformat');
var app = express();
var PORT = process.env.PORT || 3000;
var courses = [];
var todoNextId = 1;
var moment = require('moment');

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Welcome to the Training Program');
});


//Create Admin and Users using userRole as Admin/User
app.post('/users', function (req, res) {
	var body = _.pick(req.body, 'userName', 'password','userRole');

	db.user.create(body).then(function (user) {
		res.json(user.toPublicJSON());
	}, function (e) {
		res.status(400).json(e);
	});

});

// Login API will create token
app.post('/users/login', function (req, res) {
	var body = _.pick(req.body, 'userName', 'password');
	var userInstance;
	db.user.findOne({
		where : {
			isActive : 'a',	
			userName : body.userName
		}
	}).then(function(user){

		if(user){

				db.user.authenticate(body).then(function (user) {
				var token = user.generateToken('authentication');
				userInstance = user;

				return db.token.create({
											token: token
									  });
				}).then(function (tokenInstance) {
				res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
				}).catch(function () {
					res.status(401).send('Either userName/password is wrong');
				});
   		 	}
		else{
			res.status(401).send('User is Deactivated or UserName/password is wrong!!!');
		}

	});
    	
	
});


//Add Courses
app.post('/courses', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'courseName','courseModules');
	if(req.user.userRole =='Admin'){
    	db.course.create(body).then(function(course){
			return course.reload();
			}).then(function(course){
				res.json(course.toJSON());
			},function(e){
				res.status(400).json(e)
				});
    }
    else if(req.user.userRole !=='Admin'){
    	res.status(404).send('You need to be an Admin to add Courses');
    }
    
});

//Add  SubSections with start and end date
app.post('/courses/subSections', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'courseName','subSections','startDate','endDate');
	if(req.user.userRole =='Admin'){
		db.course.findOne({where:{
			courseName : body.courseName
		}
		}).then(function(courseName){
			if(courseName){
				db.course_subsections.create(body).then(function(course_subsections){
			return course_subsections.reload();
			}).then(function(course_subsections){
				res.json(course_subsections.toJSON());
			},function(e){
				res.status(400).json(e)
				});

			}
			else{
				res.status(404).send('Course Not Found');
			}

		});
	
    }
    else if(req.user.userRole !=='Admin'){
    	res.status(404).send('You need to be an Admin to add SubSections');
    	
    }
    
});

//Deactivate User
app.put('/user/deactivate/:id', middleware.requireAuthentication, function(req, res) {
	var userId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'isActive');
	var attributes = {};

	attributes.isActive = 'l';

	db.user.findOne({
		where: {
			id: userId,
			userRole :'User'
		}
	}).then(function(user) {
		if (user && req.user.userRole =='Admin') {
			user.update(attributes).then(function(user) {
				res.json(user.toPublicJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send('Cannot find the user');
		}
	}, function() {
		res.status(500).send();
	});
});


//Add User to Course
app.post('/course/assigned', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'courseName','actualstartDate','endDate','userName','allotedstartDate');
	if(req.user.userRole == 'Admin'){

		db.user.findOne({where:
	{
	userName : body.userName
	}
	}).then(function(course_user){
	if(course_user && req.user.userRole == 'Admin'){
		db.course.findOne({where : {
			courseName : body.courseName,
		}}).then(function(course){
			if(course){
				db.course_user.create(body).then(function(course_user) {
				return course_user.reload();
			}).then(function(course_user){
				res.json(course_user.toJSON());
			},function(e){
				res.status(400).json(e);
			})
			}
			else if (!course){
				res.status(404).send('Course Not Found');
			}
		})
			
		}
	else if(!course_user){
		res.status(404).send('User not found ');
	}
	});		

	}
	else{
		res.status(404).send('You are not authorized to assign course to user');
	}
	

});


//Remove User from Course
app.delete('/course/assigned/:id', middleware.requireAuthentication, function(req, res) {
	var courseId = parseInt(req.params.id, 10);
	if(req.user.userRole == 'Admin'){
		db.course_user.destroy({
		where: {
			id: courseId,
			}
		}).then(function(rowsDeleted) {
		if (rowsDeleted === 0) {
			res.send(404, {status:404, message: 'No course assigned with id', type:'internal'});
		} else {
			res.send('Course assigned to user with : ' + courseId + '  is  Deleted');
			}
		}, function() {
		res.status(500).send();
		});
	}
	else{
		res.status(404).send('You are not authorized to delete the course!!!!');
	}
});



//Find Courses Assigned to user
app.get('/course/assigned/:userName', middleware.requireAuthentication, function(req, res) {
	var userName = req.params.userName;

	db.course_user.findAll({
		where: {
			userName: userName,
		}
	}).then(function(course) {
		if (!!course) {
			res.json(course);
		} else {
			res.status(404).send('Cannot find any course assigned to you!!!!');
		}
	}, function(e) {
		res.status(500).send('Invalid UserName specified');
	});
});


//Find SubSections with Date
app.get('/course/subSections/:id', middleware.requireAuthentication, function(req, res) {
	var subsecId = parseInt(req.params.id, 10);

	db.course_subsections.findAll({
		where: {
			id: subsecId,
		}
	}).then(function(course) {
		if (!!course) {
			res.json(course);
		} else {
			res.status(404).send('Cannot find any course assigned to user!!!');
		}
	}, function(e) {
		res.status(500).send('Invalid Id !!!!');
	});
});


//Change startDate and endDate 
app.put('/course/assigned/:id', middleware.requireAuthentication, function(req, res) {
	var userId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'actualstartDate','endDate');
	var attributes = {};
	if(body.hasOwnProperty('actualstartDate')){
		attributes.actualstartDate = body.actualstartDate;
	}
	if(body.hasOwnProperty('endDate')){
		attributes.endDate = body.endDate;
	}
	db.course_user.findOne({
		where: {
			id: userId,
		}
	}).then(function(course_user) {
		if (course_user && req.user.userRole === 'User') {
			course_user.update(attributes).then(function(course_user) {
				res.json(course_user.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send('Course Not Found Or You are not authorized to change startDate and endDate!!!!');
		}
	}, function() {
		res.status(500).send();
	});
});


//Add Comments
app.put('/course/subSections/:id', middleware.requireAuthentication, function(req, res) {
	var subsecId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'comments');
	var attributes = {};
	if(body.hasOwnProperty('comments')){
		attributes.comments = body.comments;
	}
	db.course_subsections.findOne({
		where: {
			id: subsecId,
		}
	}).then(function(course_subsections) {
		if (course_subsections && req.user.userRole ==='User') {
			course_subsections.update(attributes).then(function(course_subsections) {
				res.json(course_subsections.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send('Sub Section not found Or You are not authorized to add comments!!!!');
		}
	}, function() {
		res.status(500).send();
	});
});


//Add Completed Flag
app.put('/course/completed/:id', middleware.requireAuthentication, function(req, res) {
	var courseId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'completed');
	var attributes = {};
	if(body.hasOwnProperty('completed')){
		attributes.completed = body.completed;
	}
	db.course_subsections.findOne({
		where: {
			id: courseId,
		}
	}).then(function(course_subsections) {
		if (course_subsections && req.user.userRole ==='User') {
			course_subsections.update(attributes).then(function(course_subsections) {
				res.json(course_subsections.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send('Sub Section not found Or You are not authorized to add completed flag!!!');
		}
	}, function() {
		res.status(500).send();
	});
});


//Viewing Reports for Course Completion %
app.get('/course/completed/:courseName', middleware.requireAuthentication, function(req, res) {
	var courseName = req.params.courseName;
	var count ={};
	db.course_subsections.count({
		where: {
			courseName: courseName,
		}
	}).then(function (count){
		if(count){
			db.course_subsections.count({
			where: {
				completed: 1
			}
			}).then(function(completeCount){
				if(completeCount){
					var percent = (completeCount*100)/count;
					res.send('Course Completed  %    ' + percent);
				}
			})
		}
		else
		{
			res.status(404).send('Cannot calculate the % Completed As no subSections are marked as complete!!')
		}

	});

});



//Viewing Days Left to complete the course 
app.get('/course/:courseName/:userName', middleware.requireAuthentication, function(req, res) {
	var courseUser = req.params.userName;
	var courseName = req.params.courseName;
	db.course_user.findOne({
			where:{
				userName : courseUser,
				courseName : courseName
			},
			
			attributes:['actualstartDate']

	}).then(function(actualstartDate){
		if(!!actualstartDate){
			var actualD = actualstartDate.dataValues.actualstartDate;
			db.course_user.findOne({
			where:{
				userName : courseUser,
				courseName : courseName
			},
			
			attributes:['endDate']

			}).then(function(endDate){

				if(!!endDate){	
					var endD = endDate.dataValues.endDate;
					var startDate = moment(actualD).format('DD-MM-YYY');
					var endDate = moment(endD).format('DD-MM-YYY');
					var firstDate = new Date(startDate);
					var secondDate = new Date(endDate);
					var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/8.64e7));
					console.log('Days left to complete the course : '+ diffDays);
					
					res.send('Days Left to complete the course :' + diffDays);
				}
				else{
					res.status(400).send('Cannot calculate the days left to complete the course');
				}

			})
			  	
		}
		else{
			res.status(400).send('Cannot calculate the days left to complete the course');
		}
	});
	
});


//Viewing Reports of particular user
app.get('/course/:userName', middleware.requireAuthentication, function(req, res) {
	var courseUser = req.params.userName;

	db.course_user.findAll({
		where: {
			userName: courseUser
		}
	}).then(function (courseName){
		if(courseName){
			res.json(courseName);
		}
		else{
			res.status(404).send('User not found with any assigned course');
		}
	});
	
});

/*//Viewing Reports of All Users
app.get('/courses/all', middleware.requireAuthentication, function(req, res) {
	db.course_user.findAll({
		attributes:['userName']
	}).then(function (userName){
		if(userName){
			var arr = JSON.stringify(userName);
			
			arr.forEach(function(e) {
			Object.keys(e).forEach(function(key) {
			var value = e[key]
			console.log(key)
			console.log(value)
			})
			})
		}
		else{
			res.status(404).send('User not found with any assigned course');
		}
	});
	
});*/

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT + '!');
	});
});