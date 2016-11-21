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
        var data = milestones.addUrl(baseUrl, headers, response.text(), response.json(), headers.status[0].match(/403/));
        if(data.rateLimiteExceeded) { return false; }
        return data.response.json;
    }).then(function(projects){
        if(! projects) {
            output = milestones.getOrg(organization);
            return output;
        }
        return Promise.all(
            projects.map(function(project){
                var url = 'https://api.github.com/repos/'+organization+'/'+project.name+'/milestones?state=all';
                return fetch(url).then(function(response){
                    return response.json();
                }).then(function(mstones){
                    console.log("mstones", mstones)
                    mstones.forEach(function(milestone){
                        milestones.add(milestone.title, organization, project.name, milestone);
                        output[milestone.title] = milestones[milestone.title] || { projects: {} };
                        output[milestone.title].projects[project.name] = milestone;
                    });
                });
            })
        ).then(function(){
            if(projects.length /* && false */){
                return milestones.fetchAll(output, organization, page+1);
            }
            return output;
        });
    }).catch(function(err) {
        console.log("fetchAll error:", err)
    });
}

function storeKeyIfNotExists(arrayName, key) {
    var arr = JSON.parse(localStorage.getItem(arrayName) || '[]');
    if(arr.indexOf(key)===-1) { arr.push(key); }
    localStorage.setItem(arrayName, JSON.stringify(arr));
}

milestones.addUrl = function addUrl(url, headers, resText, resJson, rateLimiteExceeded) {
    var urlData = {headers:headers, response:{text:resText, json:resJson}, rateLimiteExceeded:rateLimiteExceeded};
    localStorage.setItem(url, JSON.stringify(urlData));
    storeKeyIfNotExists('urls', url);
    return urlData;
};

milestones.urls = function urls() { return JSON.parse(localStorage.getItem('urls') || '[]'); }
milestones.getUrl = function getUrl(url) { return JSON.parse(localStorage.getItem(url)); };

milestones.add = function add(title, organization, project, milestoneData) {
    var org = JSON.parse(localStorage.getItem(organization) || '{}');
    org.milestones = org.milestones || {};
    org.milestones[title] = org.milestones[title] || {projects: {}};
    org.milestones[title].projects[project.name] = milestoneData;
    localStorage.setItem(organization, JSON.stringify(org));
    storeKeyIfNotExists('orgs', org);
    return org.milestones[title];
}
milestones.orgs = function orgs() { return JSON.parse(localStorage.getItem('orgs') || '[]'); }

milestones.getOrg = function getOrg(organization) {
    return JSON.parse(localStorage.getItem(organization));
};

module.exports = milestones;