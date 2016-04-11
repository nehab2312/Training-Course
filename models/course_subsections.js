module.exports = function(sequelize, DataTypes) {
	return sequelize.define('course_subsections', {
		courseName:{
			type:DataTypes.STRING,
			allowNull:false
		},
		subSections:{
			type:DataTypes.TEXT,
			allowNull:false,
			unique:true
		},
		startDate: {
			type :DataTypes.DATEONLY,
			allowNull: true,
		},
		endDate: {
			type :DataTypes.DATEONLY,
			allowNull: true,
		},
		comments:{
			type:DataTypes.TEXT,
			allowNull:true
		},
		completed:{
			type:DataTypes.BOOLEAN,
			defaultValue: false
		}
		
		
	});

	
};