// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var roleSchema = mongoose.Schema({
    RoleName: String,
    RolePermissionFeature: Array,
    
});

module.exports = mongoose.model('Role', roleSchema);