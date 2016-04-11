module.exports = function(sequelize, DataTypes) {
	return sequelize.define('course_user', {
		courseName:{
			type:DataTypes.STRING,
			allowNull:false
		},
		allotedstartDate:{
			type:DataTypes.DATEONLY,
			allowNull:false
		},
		actualstartDate: {
			type :DataTypes.DATEONLY,
			allowNull: true,
		},
		endDate: {
			type :DataTypes.DATEONLY,
			allowNull: true,
		},
		userName: {
			type : DataTypes.STRING,
			allowNull : false
		}
	});
};