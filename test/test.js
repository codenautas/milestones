"use strict";

var expect = require('expect.js');
var milestones = require('../app/milestones.js');
var fs = require('fs-promise');
var sinon = require('sinon');

function genMockUrls(milestones) {
    var mockedGitHub = {};
    var urls = milestones.urls();
    urls.forEach(function(url, index) {
        var u = milestones.getUrl(url);
        if(u) { mockedGitHub[url] = u; }
        //mockedGitHub[url] = {headers:u.headers, response:u.response};
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
        if(existe) { return fs.remove(milestones.testDir);  }
    }).then(function() {
        return fs.mkdirs(milestones.testDir);
    }).then(function() {
        return fs.readJson(__dirname+'/mockUrls.json');
    }).then(function(json) {
        mockUrls = json;
    }).then(function() {
        // node-persist requiere esto!
        return milestones.storageInit();
    // }).then(function() {
        // return genMockUrls(milestones);
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
        r.headers = {
            get:function(name) {
                var list = u.headers[name.toLowerCase()];
                return list ? list[0] : null;
            }
        };
        r.json = function() {
            return Promise.resolve().then(function() {
                return u.response;
            })
        };
        return r;
    });
}

describe('milestones', function(){
    describe('mocked urls', function(){
        it('fetch all', function(done){
            var salida={};
            sinon.stub(milestones, "fetchFun", fetchMock);
            milestones.fetchAll(salida, org).then(function(salida) {
                //console.log("milestones.urls()", milestones.urls())
                expect(milestones.urls().length).to.eql(Object.keys(mockUrls).length);
                expect(Object.keys(salida).length).to.eql(8);
                expect(salida.rateLimitReset).to.be(undefined);
                if(salida.rateLimitReset) {
                    console.log('Request avalability ['+salida.rateLimitReset+']');
                }
                milestones.fetchFun.restore();
                done();
            }).catch(function(err) {
                done(err);
            });
        });
    });
    describe.skip('real', function() {
        before(function() {
            milestones.storage.clear();
        });
        it('???', function(done){
            this.timeout(15000);
            var salida={};
            milestones.fetchAll(salida, org).then(function(salida) {
                //console.log("milestones.urls()", milestones.urls())
                if(salida.rateLimitReset) {
                    console.log('Request avalability ['+salida.rateLimitReset+']');
                }
                done();
            }).catch(function(err) {
                done(err);
            });
        });        
    });
});