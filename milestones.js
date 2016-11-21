"use strict";

var milestones = {};

if (typeof localStorage === "undefined" || localStorage === null) {
  var testDir = require('./util/test-dir.js');
  var LocalStorage = require('node-localstorage').LocalStorage;
  milestones.testDir = testDir.getDir('milestones-storage');
  var localStorage = new LocalStorage(milestones.testDir);
}

module.exports = milestones;