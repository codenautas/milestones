"use strict";

var expect = require('expect.js');
var milestones = require('../web/milestones.js');
var fs = require('fs-promise');
var sinon = require('sinon');

var mockUrls;

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

function initializeTestDir(tdPath, removeIfExists) {
    return fs.exists(tdPath).then(function(existe) {
        if(existe && removeIfExists) { return fs.remove(tdPath);  }
    }).then(function() {
        return fs.mkdirs(tdPath);
    });
}

describe('milestones', function(){
    describe('mocked urls', function(){
        before(function(done){
            this.timeout(5000);
            var myTestDir = 'mocked';
            Promise.resolve().then(function() {
                return initializeTestDir(milestones.testDir+myTestDir, true);
            }).then(function() {
                return fs.readJson(__dirname+'/mockUrls.json');
            }).then(function(json) {
                mockUrls = json;
            }).then(function() {
                // node-persist requiere esto!
                return milestones.storageInit(myTestDir);
            }).then(function() {
                done();
            }).catch(function(err){
                console.log(err);
            });
        });
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
                //console.log(Object.keys(salida.projects).length)
                milestones.fetchFun.restore();
                done();
            }).catch(function(err) {
                done(err);
            });
        });
        function setDFU(updated_at) {
            return milestones.milisecondsToDays(Date.now()-new Date(updated_at).getTime());
        }
        [
            {name:'Aceptable',
             projects:{
                 'backend-plus':{
                     url: 'https://github.com/codenautas/backend-plus/milestones',
                     state:'closed', date:'2016-10-25T15:08:01Z', daysFromUpdate:setDFU('2016-10-25T15:08:01Z'),
                     pctComplete:100, issues:{open:0,closed:25}
                 },
                 'dialog-promise':{
                     url: 'https://github.com/codenautas/dialog-promise/milestones',
                     state:'closed', date:'2016-10-25T23:19:35Z', daysFromUpdate:setDFU('2016-10-25T23:19:35Z'),
                     pctComplete:100, issues:{open:0,closed:1}
                 },
                 'login-plus':{
                     url: 'https://github.com/codenautas/login-plus/milestones',
                     state:'closed', date:'2016-11-16T17:05:09Z', daysFromUpdate:setDFU('2016-11-16T17:05:09Z'),
                     pctComplete:100, issues:{open:0,closed:5}
                 },
                 'milestones':{
                     url: 'https://github.com/codenautas/milestones/milestones',
                     state:'open', date:'2016-12-21T00:00:00Z', daysFromUpdate:setDFU('2016-11-12T17:00:18Z'),
                     pctComplete:100, issues:{open:0,closed:0}
                 },
                 'mini-tools':{
                     url: 'https://github.com/codenautas/mini-tools/milestones',
                     state:'open', date:'2016-10-17T00:00:00Z', daysFromUpdate:setDFU('2016-10-07T17:10:45Z'),
                     pctComplete:100, issues:{open:0,closed:0}
                 },
             }},
            {name:'Buena',
             projects:{
                 'backend-plus':{
                     url: 'https://github.com/codenautas/backend-plus/milestones',
                     state:'open', date:'2016-12-18T00:00:00Z', daysFromUpdate:setDFU('2016-11-21T01:38:34Z'),
                     pctComplete:43, issues:{open:6,closed:8}
                 }
             }},
            {name:'Bueno',
             projects:{
                 'dialog-promise':{
                     url: 'https://github.com/codenautas/dialog-promise/milestones',
                     state:'open', date:'2017-04-15T00:00:00Z', daysFromUpdate:setDFU('2016-10-29T14:03:32Z'),
                     pctComplete:33, issues:{open:1,closed:2}
                 },
                 'login-plus':{
                     url: 'https://github.com/codenautas/login-plus/milestones',
                     state:'open', date:'2016-12-18T00:00:00Z', daysFromUpdate:setDFU('2016-11-16T20:32:10Z'),
                     pctComplete:33, issues:{open:2,closed:4}
                 },
                 'mini-tools':{
                     url: 'https://github.com/codenautas/mini-tools/milestones',
                     state:'open', date:'2016-12-21T00:00:00Z', daysFromUpdate:setDFU('2016-10-07T17:11:06Z'),
                     pctComplete:100, issues:{open:0,closed:0}
                 },
             }},
            {name:'Completo',
             projects:{
                 'txt-to-sql':{
                     url: 'https://github.com/codenautas/txt-to-sql/milestones',
                     state:'open', date:'2017-03-31T00:00:00Z', daysFromUpdate:setDFU('2016-11-09T14:45:57Z'),
                     pctComplete:17, issues:{open:1,closed:5}
                 }
             }},
            {name:'Común',
             projects:{
                 'backend-plus':{
                     url: 'https://github.com/codenautas/backend-plus/milestones',
                     state:'open', date:'2017-04-20T00:00:00Z', daysFromUpdate:setDFU('2016-11-09T17:24:16Z'),
                     pctComplete:0, issues:{open:7,closed:0}
                 },
                 'dialog-promise':{
                     url: 'https://github.com/codenautas/dialog-promise/milestones',
                     state:'open', date:'2017-04-30T00:00:00Z', daysFromUpdate:setDFU('2016-10-29T13:23:05Z'),
                     pctComplete:0, issues:{open:1,closed:0}
                 },
             }},
            {name:'Lanzamiento',
             projects:{
                 'backend-plus':{
                     url: 'https://github.com/codenautas/backend-plus/milestones',
                     state:'open', date:'2017-07-31T00:00:00Z', daysFromUpdate:setDFU('2016-09-09T18:02:35Z'),
                     pctComplete:0, issues:{open:6,closed:0}
                 },
                'login-plus':{
                     url: 'https://github.com/codenautas/login-plus/milestones',
                     state:'open', date:'2017-09-13T00:00:00Z', daysFromUpdate:setDFU('2016-09-09T18:24:22Z'),
                     pctComplete:0, issues:{open:2,closed:0}
                 },
             }},
            {name:'Versión 3 pasos',
             projects:{
                 'txt-to-sql':{
                     url: 'https://github.com/codenautas/txt-to-sql/milestones',
                     state:'closed', date:'2016-11-09T11:42:12Z', daysFromUpdate:setDFU('2016-11-09T11:42:12Z'),
                     pctComplete:100, issues:{open:0,closed:16}
                 }
             }},
            {name:'Versión inicial',
             projects:{
                 'txt-to-sql':{
                     url: 'https://github.com/codenautas/txt-to-sql/milestones',
                     state:'closed', date:'2016-10-05T18:43:19Z', daysFromUpdate:setDFU('2016-10-05T18:43:19Z'),
                     pctComplete:100, issues:{open:0,closed:2}
                 }
             }},
        ].forEach(function(milestone) {
            var name='fetch '+milestone.name;
            if(milestone.skip) {
                it.skip(name);
            } else {
                it(name, function(done) {
                    //console.log("salida", salida)
                    var ms = salida[milestone.name];
                    expect(ms.projects).to.eql(milestone.projects)
                    done();
                });
            }
        });
    });
    describe.skip('real', function() {
        before(function(done){
            this.timeout(5000);
            var myTestDir = 'real';
            Promise.resolve().then(function() {
                return initializeTestDir(milestones.testDir+myTestDir, false);
            }).then(function() {
                // node-persist requiere esto!
                return milestones.storageInit(myTestDir);
            }).then(function() {
                done();
            }).catch(function(err){
                console.log(err);
            });
        });
        it('read only changed requests', function(done){
            this.timeout(15000);
            var salida={};
            milestones.fetchAll(salida, org).then(function(salida) {
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