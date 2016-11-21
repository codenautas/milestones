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

function leerMilestones(storage, page){
    var page=page||1;
    var baseUrl = 'https://api.github.com/orgs/codenautas/repos?page='+page; 
    return fetch(baseUrl)
    .then(function(response){
        var headers = response.headers.raw();
        //console.log("headers", headers);
        var data = storage.addUrl(baseUrl, headers, headers.status[0].match(/403/));
        if(data.rateLimiteExceeded) {
            console.log("Rate-limit exceeded")
            return false;
        }
        return response.json();
    }).then(function(arr){
        if(! arr) {
            return storage;
        }
        /* arr=[
            {name: 'backend-plus'},
            {name: 'dialog-promise'},
            {name: 'typed-controls'},
        ] // */
        console.log(arr);
        storage.storage.setItem("resp", JSON.stringify(arr));
        return Promise.all(
            arr.map(function(proyecto){
                var url = 'https://api.github.com/repos/codenautas/'+proyecto.name+'/milestones?state=all';
                return fetch(url)
                .then(function(response){
                    return response.json();
                }).then(function(arr){
                    arr.forEach(function(milestone){
                        var title = milestone.title || 'no-title';
                        storage.add(title, milestone, url);
                        //milestones[milestone.title] = milestones[milestone.title] || { proyectos: {} };
                        //milestones[milestone.title].proyectos[proyecto.name] = milestone;
                    });
                });
            })
        ).then(function(){
            if(arr.length /* && false */){
                return leerMilestones(storage, page+1);
            }
            return storage;
        });
    });
}

describe('milestones', function(){
    it('storage', function(done){
        //console.log(milestones.storage); return done();
        this.timeout(20000);
        console.log(milestones.testDir);
        leerMilestones(milestones).then(function() {
            var page1 = milestones.getUrl('https://api.github.com/orgs/codenautas/repos?page=1');
            if(page1.rateLimiteExceeded) {
                console.log('Requeset avalability at '+new Date(page1.headers['x-ratelimit-reset'] * 1000));
            }
            
            //console.log(milestones.storage);
            //console.log("URL", page1);
            done();
        }).catch(function(err) {
            done(err);
        });
    });
});