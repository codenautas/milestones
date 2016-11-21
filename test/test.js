"use strict";

var expect = require('expect.js');
var milestones = require('../milestones.js');
var fs = require('fs-promise');


before(function(done){
    this.timeout(5000);
    Promise.resolve().then(function() {
        return fs.exists(milestones.testDir);
    }).then(function(existe) {
        //if(existe) { return fs.remove(milestones.testDir); }
        if(! existe) { return fs.mkdirs(milestones.testDir); }
    }).then(function() {
        //return fs.mkdirs(milestones.testDir);
    }).then(function() {
        done();
    }).catch(function(err){
        console.log(err);
    });
});

var org = 'codenautas';

describe('milestones', function(){
    it('storage', function(done){
        if(false) {
            console.log(milestones.storage);
            console.log(milestones.getUrl('https://api.github.com/orgs/'+org+'/repos?page=1'));
            return done();
        }        
        this.timeout(20000);
        console.log(milestones.testDir);
        var salida={};
        milestones.fetchAll(salida, org).then(function(salida) {
            var page1 = milestones.getUrl('https://api.github.com/orgs/'+org+'/repos?page=1');
            if(page1.rateLimiteExceeded) {
                console.log('Request avalability ['+new Date(page1.headers['x-ratelimit-reset'] * 1000)+']');
            }
            //console.log(milestones.storage);
            //console.log("URL", page1);
            done();
        }).catch(function(err) {
            done(err);
        });
    });
});