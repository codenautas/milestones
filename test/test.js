"use strict";

var expect = require('expect.js');
var fetch = require('node-fetch');
var milestones = require('../milestones.js');
var fs = require('fs-promise');

before(function(done){
    this.timeout(5000);
    Promise.resolve().then(function() {
        return fs.exists(milestones.testDir);
    }).then(function(existe) {
        if(existe) { return fs.remove(milestones.testDir); }
    }).then(function() {
        return fs.mkdirs(milestones.testDir);
    }).then(function() {
        done();
    }).catch(function(err){
        console.log(err);
    });
});

describe('milestones', function(){
    it('storage', function(done){
        console.log(milestones.testDir);
        done();
    });
});