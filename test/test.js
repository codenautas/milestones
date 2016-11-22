"use strict";

var expect = require('expect.js');
var milestones = require('../app/milestones.js');
var fs = require('fs-promise');
var sinon = require('sinon');

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
    }).then(function() {
        done();
    }).catch(function(err){
        console.log(err);
    });
});

var org = 'codenautas';

function fetchAllMock(url, opts) {
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
        var salida={};
        // ATENCION: para correr los siguientes nunca saltear este
        it('fetch all', function(done){
            sinon.stub(milestones, "fetchFun", fetchAllMock);
            milestones.fetchAll(salida, org).then(function(salida) {
                //console.log("milestones.urls()", milestones.urls())
                expect(milestones.urls().length).to.eql(Object.keys(mockUrls).length);
                expect(Object.keys(salida).length).to.eql(8);
                expect(salida.rateLimitReset).to.be(undefined);
                // Object.keys(salida).forEach(function(ms) {
                    // console.log(ms); Object.keys(salida[ms].projects).forEach(function(project) { console.log("  ", project); });
                // });
                milestones.fetchFun.restore();
                done();
            }).catch(function(err) {
                done(err);
            });
        });
        [
            {name:'Aceptable', projects:['mini-tools','login-plus','backend-plus','dialog-promise','milestones']},
            {name:'Buena', projects:['backend-plus']},
            {name:'Bueno', projects:['mini-tools','login-plus','dialog-promise']},
            {name:'Completo', projects:['txt-to-sql']},
            {name:'Común', projects:['backend-plus', 'dialog-promise']},
            {name:'Lanzamiento', projects:['login-plus','backend-plus']},
            {name:'Versión 3 pasos', projects:['txt-to-sql']},
            {name:'Versión inicial', projects:['txt-to-sql']},
        ].forEach(function(milestone) {
            if(milestone.skip) {
                it.skip(milestone.name);
            } else {
                it(milestone.name, function(done) {
                    //console.log("salida", salida)
                    var ms = salida[milestone.name];
                    expect(Object.keys(ms.projects)).to.eql(milestone.projects)
                    done();
                });
            }
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