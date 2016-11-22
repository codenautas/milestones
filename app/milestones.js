"use strict";

var milestones = {};

if (typeof localStorage === "undefined" || localStorage === null) {
    milestones.testDir = require('path').normalize(require('../util/test-dir.js').getDir('milestones-storage')+'/'); 
    var storage = require('node-persist');
    var localStorage = {};
    milestones.storageInit = function(storageDir) {    
        storage.initSync({dir:milestones.testDir+storageDir});
        // getItemSync() devuelve undefined si key no está!
        localStorage.getItem = function(key) { return storage.getItemSync(key)||null; };
        localStorage.setItem = storage.setItemSync;
        localStorage.removeItem = storage.removeItemSync;
        localStorage.clear = storage.clearSync;
    }
    milestones.storage = localStorage;
}

if(typeof window === 'undefined') {
    var fetch = require('node-fetch');
}

milestones.fetchFun = fetch;

function finishRequest(out, organization, headers) {
    out = milestones.getOrg(organization) || {};
    out.rateLimitReset = new Date(headers.get('X-RateLimit-Reset') * 1000);
    return out;
}

milestones.milisecondsToDays = function milisecondsToDays(miliseconds) {
    return parseInt(miliseconds / (1000*60*60*24));
}

milestones.fetchAll = function fetchAll(output, organization, page) {
    var page=page||1;
    var baseUrl = 'https://api.github.com/orgs/'+organization+'/repos?page='+page;
    var headers;
    return milestones.fetchFun(baseUrl).then(function(response){
        headers = response.headers;
        return response.json();
    }).then(function(rjson) {
        if(! milestones.addUrl(baseUrl, headers, rjson)) {
            return false;
        }
        return rjson;
    }).then(function(projects){
        if(! projects) {
            return finishRequest(output, organization, headers);
        } else {
            return Promise.all(
                projects.map(function(project){
                    var url = 'https://api.github.com/repos/'+organization+'/'+project.name+'/milestones?state=all';
                    return milestones.fetchFun(url).then(function(response){
                        headers = response.headers;
                        return response.json();
                    }).then(function(mstones){
                        if(! milestones.addUrl(url, headers, mstones)) {
                            finishRequest(output, organization, headers);
                        } else {
                            mstones.forEach(function(milestone){
                                milestones.add(milestone.title, organization, project.name, milestone);
                                output[milestone.title] = output[milestone.title] || { projects: {} };
                                //output[milestone.title].projects[project.name] = milestone;
                                var totalIssues = milestone.open_issues + milestone.closed_issues;
                                var pct = 0;
                                if(0===milestone.open_issues) {
                                    pct = 100;
                                } else if(0!==milestone.closed_issues) {
                                    pct = Math.round(milestone.open_issues/totalIssues*100);
                                }
                                output[milestone.title].projects[project.name] = {
                                    url: 'https://github.com/'+organization+'/'+project.name+'/milestones',
                                    state: milestone.state,
                                    date: milestone.closed_at || milestone.due_on, // closed_at es null si está abierto
                                    daysFromUpdate: milestones.milisecondsToDays(Date.now()-new Date(milestone.updated_at).getTime()),
                                    pctComplete: pct,
                                    issues: {open:milestone.open_issues, closed:milestone.closed_issues}
                                };
                            });
                        }
                    });
                })).then(function(){
                if(projects.length /* && false */){
                    return milestones.fetchAll(output, organization, page+1);
                }
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

milestones.addUrl = function addUrl(url, headers, data) {
    var limit = headers.get('Status').match(/403/);
    var limitReached = limit && limit.length>0;
    if(! limitReached) {
        localStorage.setItem(
            url,
            JSON.stringify({
                etag:headers.get('ETag'),
                lastModified:headers.get('Last-Modified'),
                remainingRequests:headers.get('X-RateLimit-Remaining'),
                limitResetTime:headers.get('X-RateLimit-Reset')
            })
        );
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