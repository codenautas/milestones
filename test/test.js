"use strict";

var expect = require('expect.js');
var milestones = require('../milestones.js');
var fs = require('fs-promise');

function genMockUrls(milestones) {
    var mockedGitHub = {};
    var urls = milestones.urls();
    urls.forEach(function(url, index) {
        var u = milestones.getUrl(url);
        mockedGitHub[url] = {headers:u.headers, response:u.response};
    });
    return fs.writeJson('mockUrls.json', mockedGitHub).then(function() {
        console.log("generated.")
    });
}

var mockUrls;

before(function(done){
    this.timeout(5000);
    Promise.resolve().then(function() {
        return fs.exists(milestones.testDir);
    }).then(function(existe) {
        //if(existe) { return fs.remove(milestones.testDir); }
        if(! existe) { return fs.mkdirs(milestones.testDir); }
    }).then(function() {
        //return fs.mkdirs(milestones.testDir);
    // }).then(function() {
        // return genMockUrls(milestones);
    }).then(function() {
        return fs.readJson(__dirname+'/mockUrls.json');
    }).then(function(json) {
        mockUrls = json;
        //console.log("mockUrls", mockUrls)
        console.log(Object.keys(mockUrls).length)
    }).then(function() {
        done();
    }).catch(function(err){
        console.log(err);
    });
});

var org = 'codenautas';

function fetchMock(url, opts) {
    return Promise.resolve().then(function() {
        var u = mockUrls[url];
        var r = {};
        r.headers = { raw:function() { return u.headers; } };
        r.json = function() {
            return Promise.resolve().then(function() {
                return u.response;
            })
        };
        return r;
    });
}
// activar mocked urls
milestones.fetchFun = fetchMock;

describe('milestones', function(){
    it/*.skip*/('mocked urls', function(done){
        this.timeout(15000);
        var salida={};
        milestones.fetchAll(salida, org).then(function(salida) {
            expect(milestones.urls().length).to.eql(Object.keys(mockUrls).length);
            expect(Object.keys(salida).length).to.eql(8)
            if(salida.rateLimitReset) {
                console.log('Request avalability ['+salida.rateLimitReset+']');
            }
            done();
        }).catch(function(err) {
            done(err);
        });
    });
});