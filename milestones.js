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

milestones.fetchAll = function fetchAll(output, organization, page) {
    var page=page||1;
    var baseUrl = 'https://api.github.com/orgs/'+organization+'/repos?page='+page; 
    return fetch(baseUrl).then(function(response){
        var headers = response.headers.raw();
        //console.log("headers", headers);
        var json = response.json();
        var data = milestones.addUrl(baseUrl, headers, json, headers.status[0].match(/403/));
        if(data.rateLimiteExceeded) {
            return false;
        }
        return json;
    }).then(function(arr){
        if(! arr) {
            output = milestones.get(organization);
            return output;
        }
        return Promise.all(
            arr.map(function(project){
                var url = 'https://api.github.com/repos/'+organization+'/'+project.name+'/milestones?state=all';
                return fetch(url).then(function(response){
                    return response.json();
                }).then(function(arr){
                    console.log("arr", arr)
                    arr.forEach(function(milestone){
                        milestones.add(milestone.title, organization, project.name, milestone);
                        output[milestone.title] = milestones[milestone.title] || { projects: {} };
                        output[milestone.title].projects[project.name] = milestone;
                    });
                });
            })
        ).then(function(){
            if(arr.length /* && false */){
                return milestones.fetchAll(output, organization, page+1);
            }
            return output;
        });
    }).catch(function(err) {
        console.log("error", err)
    });
}

function storeKeyIfNotExists(arrayName, key) {
    var arr = JSON.parse(localStorage.getItem(arrayName) || "[]");
    if(arr.indexOf(key)===-1) { arr.push(key); }
    localStorage.setItem(arrayName, JSON.stringify(arr));
}

milestones.addUrl = function addUrl(url, headers, content, rateLimiteExceeded) {
    var urlData = {headers:headers, content: content, rateLimiteExceeded:rateLimiteExceeded};
    localStorage.setItem(url, JSON.stringify(urlData));
    storeKeyIfNotExists('urls', url);
    return urlData;
};

milestones.getUrl = function getUrl(url) { return JSON.parse(localStorage.getItem(url)); };

milestones.add = function add(title, organization, project, data) {
    var org = JSON.parse(localStorage.getItem(organization) || "{}");
    org.milestones = org.milestones || {};
    org.milestones[title] = org.milestones[title] || {projects: {}};
    org.milestones[title].projects[project.name] = data;
    localStorage.setItem(organization, JSON.stringify(org));
    storeKeyIfNotExists('orgs', org);
    return org.milestones[title];
}

milestones.get = function get(organization) {
    return JSON.parse(localStorage.getItem(organization));
};

module.exports = milestones;