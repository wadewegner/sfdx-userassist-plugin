const orgcreate = require('./commands/orgcreate.js');

(function () {
  'use strict';

  exports.topics = [{
    name: 'user',
    description: 'perform user-related admin tasks'
  }];

  exports.namespace = {
    name: 'force',
    description: ''
  };

  exports.commands = [orgcreate];

}());