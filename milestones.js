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

milestones.fetchFun = fetch;

function setDateOfLimitReset(rlr) { return new Date(rlr * 1000); }

milestones.fetchAll = function fetchAll(output, organization, page) {
    var page=page||1;
    var baseUrl = 'https://api.github.com/orgs/'+organization+'/repos?page='+page;
    var headers;
    return milestones.fetchFun(baseUrl).then(function(response){
        headers = response.headers.raw();
        return response.json();
    }).then(function(json) {
        if(! milestones.addUrl(baseUrl, headers, json)) {
            return false;
        }
        return json;
    }).then(function(projects){
        if(! projects) {
            output = milestones.getOrg(organization) || {};
            output.rateLimitReset = setDateOfLimitReset(headers['x-ratelimit-reset']);
            return output;
        } else {
            return Promise.all(
                projects.map(function(project){
                    var url = 'https://api.github.com/repos/'+organization+'/'+project.name+'/milestones?state=all';
                    return milestones.fetchFun(url).then(function(response){
                        headers = response.headers.raw();
                        return response.json();
                    }).then(function(mstones){
                        if(! milestones.addUrl(url, headers, mstones)) {
                            output = milestones.getOrg(organization) || {};
                            output.rateLimitReset = setDateOfLimitReset(headers['x-ratelimit-reset']);
                        } else {
                            mstones.forEach(function(milestone){
                                milestones.add(milestone.title, organization, project.name, milestone);
                                output[milestone.title] = milestones[milestone.title] || { projects: {} };
                                output[milestone.title].projects[project.name] = milestone;
                            });
                        }
                    });
                })).then(function(){
                if(projects.length /* && false */){
                    return milestones.fetchAll(output, organization, page+1);
                }
                //console.log("output", output);
                return output;
            });
        }
    }).catch(function(err) {
        console.log("fetchAll error:", err.stack)
    });
}

function storeKeyIfNotExists(arrayName, key) {
    var arr = JSON.parse(localStorage.getItem(arrayName) || '[]');
    if(arr.indexOf(key)===-1) { arr.push(key); }
    localStorage.setItem(arrayName, JSON.stringify(arr));
}

milestones.addUrl = function addUrl(url, headers, resJson) {
    var limit = headers.status[0].match(/403/);
    var limitReached = limit && limit.length>0;
    if(! limitReached) {
        localStorage.setItem(url, JSON.stringify({headers:headers, response:resJson}));
        storeKeyIfNotExists('urls', url);
    }
    return ! limitReached;
};

milestones.urls = function urls() { return JSON.parse(localStorage.getItem('urls') || '[]'); }
milestones.getUrl = function getUrl(url) { return JSON.parse(localStorage.getItem(url)); };

milestones.add = function add(title, organization, project, milestoneData) {
    var org = JSON.parse(localStorage.getItem(organization) || '{}');
    org.milestones = org.milestones || {};
    org.milestones[title] = org.milestones[title] || {projects: {}};
    org.milestones[title].projects[project.name] = milestoneData;
    localStorage.setItem(organization, JSON.stringify(org));
    storeKeyIfNotExists('orgs', organization);
    return org.milestones[title];
}
milestones.orgs = function orgs() { return JSON.parse(localStorage.getItem('orgs') || '[]'); }

milestones.getOrg = function getOrg(organization) {
    return JSON.parse(localStorage.getItem(organization));
};

module.exports = milestones;