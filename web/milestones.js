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
    };
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
};

milestones.fetchAll = function fetchAll(opts) {
    if(! opts.org) { throw new Error('organizations is required'); }
    opts.out = opts.out || {};
    opts.page = opts.page || 1;
    var baseUrl = 'https://api.github.com/orgs/'+opts.org+'/repos?page='+opts.page;
    var headers;
    return milestones.fetchUrl(baseUrl).then(function(response){
        headers = response.headers;
        var projects = response.url.body;
        if(! projects) {
            return finishRequest(opts.out, opts.org, headers);
        } else {
            return Promise.all(
                projects.map(function(project){
                    var url = 'https://api.github.com/repos/'+opts.org+'/'+project.name+'/milestones?state=all';
                    return milestones.fetchUrl(url).then(function(response){
                        headers = response.headers;
                        var mstones = response.url.body;
                        if(! mstones) {
                            return finishRequest(opts.out, opts.org, headers);
                        } else {
                            mstones.forEach(function(milestone){
                                milestones.add(milestone.title, opts.org, project.name, milestone);
                                opts.out[milestone.title] = opts.out[milestone.title] || { projects: {} };
                                //opts.out[milestone.title].projects[project.name] = milestone;
                                var totalIssues = milestone.open_issues + milestone.closed_issues;
                                var pct = 0;
                                if(0===milestone.open_issues) {
                                    pct = 100;
                                } else if(0!==milestone.closed_issues) {
                                    pct = Math.round(milestone.open_issues/totalIssues*100);
                                }
                                opts.out[milestone.title].projects[project.name] = {
                                    url: 'https://github.com/'+opts.org+'/'+project.name+'/milestones',
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
                    ++opts.page;
                    return milestones.fetchAll(opts);
                    //return milestones.fetchAll(opts.out, opts.org, page+1);
                }
                return opts.out;
            });
        }
    });
};

function storeKeyIfNotExists(arrayName, key) {
    var arr = JSON.parse(localStorage.getItem(arrayName) || '[]');
    if(arr.indexOf(key)===-1) { arr.push(key); }
    localStorage.setItem(arrayName, JSON.stringify(arr));
}

function statusIS(headers, status) { return new RegExp(status).test(headers.get('Status')); }

milestones.fetchUrl = function fetchUrl(url) {
    var cachedUrl = milestones.getUrl(url);
    var headers;
    return Promise.resolve().then(function() {
        var options = {};
        if(cachedUrl) {
            options.headers = cachedUrl.etag ? {'If-None-Match':cachedUrl.etag } : {'If-Modified-Since':cachedUrl.lastModified };
        }
        //console.log("url", url);
        return milestones.fetchFun(url, options);
    }).then(function(response) {
        //console.log("  response", response);
        headers = response.headers;
        if(statusIS(headers, 304)) { return null; }
        return response.json();
    }).then(function(json) {
        //console.log("  JSON", json);
        // content did NOT change AND limit was NOT reached
        if(! statusIS(headers, 304) && ! statusIS(headers, 403)) {
            localStorage.setItem(
                url,
                JSON.stringify({
                    etag:headers.get('ETag'),
                    lastModified:headers.get('Last-Modified'),
                    remainingRequests:headers.get('X-RateLimit-Remaining'),
                    limitResetTime:headers.get('X-RateLimit-Reset'),
                    body:json
                })
            );
            storeKeyIfNotExists('urls', url);
            cachedUrl = milestones.getUrl(url);
        }
        return {
            url:cachedUrl, // may be null!
            headers:headers
        };
    });
};

milestones.urls = function urls() { return JSON.parse(localStorage.getItem('urls') || '[]'); };
milestones.getUrl = function getUrl(url) { return JSON.parse(localStorage.getItem(url)); };

milestones.add = function add(title, organization, project, milestoneData) {
    var org = JSON.parse(localStorage.getItem(organization) || '{}');
    org.milestones = org.milestones || {};
    org.milestones[title] = org.milestones[title] || {projects: {}};
    org.milestones[title].projects[project.name] = milestoneData;
    localStorage.setItem(organization, JSON.stringify(org));
    storeKeyIfNotExists('orgs', organization);
    return org.milestones[title];
};
milestones.orgs = function orgs() { return JSON.parse(localStorage.getItem('orgs') || '[]'); };
milestones.getOrg = function getOrg(organization) {  return JSON.parse(localStorage.getItem(organization)); };

module.exports = milestones;