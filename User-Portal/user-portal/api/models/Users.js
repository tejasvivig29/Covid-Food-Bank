/**
 * Users.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'default',
  attributes: {
    updatedAt: false,
    createdAt: false,
    id: {
      type: 'string',
      columnName: 'user',
      required: true
    },
    password: {
      type: 'string',
      required: true
    }
  },

  customToJSON: function() {
    return _.omit(this, ['password'])
  },

  beforeCreate: function (values, next) {
    require('bcrypt').hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
      if(err) return next(err);
      values.password = encryptedPassword;
      next();
    });
  }
};

