"use strict";

var expect = require('expect.js');
var fetch = require('node-fetch');
var milestones = require('../milestones.js');

describe('milestones', function(){
    it('storage', function(done){
        console.log(milestones.testDir);
        done();
    });
});