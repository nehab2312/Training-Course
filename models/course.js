module.exports = function(sequelize, DataTypes) {
	return sequelize.define('course', {
		courseName: {
			type: DataTypes.STRING,
			allowNull: false,
			unique:true
		},
		courseModules: {
			type: DataTypes.STRING,
			allowNull: false,
		}
		
	});

	
};