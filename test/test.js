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

function fetchMock(url, opts) {
    return Promise.resolve().then(function() {
        console.log("url", url)
        return false;
    });
}
//milestones.fetchFun = fetchMock;

describe('milestones', function(){
    it('storage', function(done){
        this.timeout(20000);
        //console.log(milestones.testDir);
        var salida={};
        milestones.fetchAll(salida, org).then(function(salida) {
            var urls = milestones.urls();
            urls.forEach(function(url, index) {
                var u = milestones.getUrl(url);
                console.log('URL('+(index+1)+'/'+urls.length+') '+url /**,u.headers,*/ /*u.response*/);
            });
            //var u1 = 'https://api.github.com/orgs/codenautas/repos?page=1';
            //console.log(u1, milestones.getUrl(u1).response);
            if(salida.rateLimitReset) {
                console.log('Request avalability ['+salida.rateLimitReset+']');
            }
            done();
        }).catch(function(err) {
            done(err);
        });
    });
});