"use strict";

var milestones = {};

if (typeof localStorage === "undefined" || localStorage === null) {
  var testDir = require('./util/test-dir.js');
  var LocalStorage = require('node-localstorage').LocalStorage;
  milestones.testDir = testDir.getDir('milestones-storage');
  var localStorage = new LocalStorage(milestones.testDir);
  milestones.storage = localStorage;
}

if(typeof window === 'undefined') {
    var fetch = require('node-fetch');
}

milestones.fetchAll = function fetchAll(storage, page) {
    var page=page||1;
    var baseUrl = 'https://api.github.com/orgs/codenautas/repos?page='+page; 
    return fetch(baseUrl).then(function(response){
        var headers = response.headers.raw();
        //console.log("headers", headers);
        var data = storage.addUrl(baseUrl, headers, headers.status[0].match(/403/));
        if(data.rateLimiteExceeded) { return false; }
        return response.json();
    }).then(function(arr){
        if(! arr) { return storage; }
        return Promise.all(
            arr.map(function(proyecto){
                var url = 'https://api.github.com/repos/codenautas/'+proyecto.name+'/milestones?state=all';
                return fetch(url).then(function(response){
                    return response.json();
                }).then(function(arr){
                    arr.forEach(function(milestone){
                        var title = milestone.title || 'no-title';
                        storage.add(title, milestone, url);
                    });
                });
            })
        ).then(function(){
            if(arr.length /* && false */){
                return milestones.fetchAll(storage, page+1);
            }
            return storage;
        });
    });
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