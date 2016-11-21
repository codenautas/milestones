"use strict";

var milestones = {};

if (typeof localStorage === "undefined" || localStorage === null) {
  var testDir = require('./util/test-dir.js');
  var LocalStorage = require('node-localstorage').LocalStorage;
  milestones.testDir = testDir.getDir('milestones-storage');
  var localStorage = new LocalStorage(milestones.testDir);
  milestones.storage = localStorage;
}

milestones.addUrl = function addUrl(url, headers, rateLimiteExceeded) {
    var urlData = {headers:headers, rateLimiteExceeded:rateLimiteExceeded};
    localStorage.setItem(url, JSON.stringify(urlData));
    return urlData;
};

milestones.getUrl = function getUrl(url) { return JSON.parse(localStorage.getItem(url)); };

milestones.add = function add(title, proyects, url) {
    var milestoneData = {proyects:proyects, url:url};
    localStorage.setItem(title, JSON.stringify(milestoneData));
    return milestoneData;
}

milestones.get = function get(title) { return JSON.parse(localStorage.getItem(title)); };

module.exports = milestones;