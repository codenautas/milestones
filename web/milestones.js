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

milestones.fetchFun = function(url, opts) {
    return fetch(url, opts);
};

function parseMilestones(organization, project, mstones, out) {
    mstones.forEach(function(milestone){
        milestones.addOrg(milestone.title, organization, project.name, milestone);
        out[milestone.title] = out[milestone.title] || { projects: {} };
        var totalIssues = milestone.open_issues + milestone.closed_issues;
        var pct = null;
        if(totalIssues>0){
            pct = Math.round(milestone.closed_issues/totalIssues*100);
        }
        out[milestone.title].projects[project.name] = {
            url: 'https://github.com/'+organization+'/'+project.name+'/milestones',
            state: milestone.state,
            date: milestone.closed_at || milestone.due_on, // closed_at es null si está abierto
            daysFromUpdate: milestones.milisecondsToDays(Date.now()-new Date(milestone.updated_at).getTime()),
            pctComplete: pct,
            issues: {open:milestone.open_issues, closed:milestone.closed_issues}
        };
    });
}
function finalizeRequest(out, organization, response, project) {
    var org = milestones.getOrg(organization) || {};
    Object.keys(org).forEach(function(mstone) {
        Object.keys(org[mstone]).forEach(function(projectName) {
            parseMilestones(organization, projectName, org[mstone][projectName].body, out);
            out[mstone].mayBeOutdated = true;
        });
    });
    out.rateLimitReset = new Date(response.headers.get('X-RateLimit-Reset') * 1000);
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
        var projects = response.body();
        //console.log(JSON.stringify(response))
        //console.log(response.body())
        if(! projects || response.limitReached) {
            return finalizeRequest(opts.out, opts.org, response);
        } else {
            return Promise.all(
                projects.sort().map(function(project){
                    var url = 'https://api.github.com/repos/'+opts.org+'/'+project.name+'/milestones?state=all';
                    return milestones.fetchUrl(url).then(function(response){
                        headers = response.headers;
                        var mstones = response.body();
                        if(! mstones || response.limitReached) {
                            return finalizeRequest(opts.out, opts.org, response, project);
                        } else {
                            parseMilestones(opts.org, project, mstones, opts.out);
                        }
                    });
                })).then(function(){
                if(projects.length /* && false */){
                    ++opts.page;
                    return milestones.fetchAll(opts);
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

milestones.fetchUrl = function fetchUrl(url) {
    var rv={url:milestones.getUrl(url)};
    rv.body = function() { return this.url ? this.url.body : null; };
    return Promise.resolve().then(function() {
        var options = {};
        if(rv.url) {
            var hdrs = new Headers();
            if(rv.url.etag) {
                hdrs.append('If-None-Match', rv.url.etag);
            } else {
                hdrs.append('If-Modified-Since', rv.url.lastModified);
            }
            options.headers = hdrs;
        }
        return milestones.fetchFun(url, options);
    }).then(function(response) {
        //console.log("  status", response.status);
        rv.headers = response.headers;
        rv.unchanged = response.status === 304;
        rv.limitReached = response.status === 403;
        if(rv.unchanged || rv.limitReached) {
            return null;
        }
        return response.json();
    }).then(function(json) {
        if(json) {
            localStorage.setItem(
                url,
                JSON.stringify({
                    etag:rv.headers.get('ETag'),
                    lastModified:rv.headers.get('Last-Modified'),
                    remainingRequests:rv.headers.get('X-RateLimit-Remaining'),
                    limitResetTime:rv.headers.get('X-RateLimit-Reset'),
                    body:json
                })
            );
            storeKeyIfNotExists('urls', url);
            rv.url = milestones.getUrl(url);
        }
        return rv;
    });
};

milestones.urls = function urls() { return JSON.parse(localStorage.getItem('urls') || '[]'); };
milestones.getUrl = function getUrl(url) { return JSON.parse(localStorage.getItem(url)); };

milestones.addOrg = function addOrg(title, organization, project, milestoneData) {
    var org = JSON.parse(localStorage.getItem(organization) || '{}');
    org.milestones = org.milestones || {};
    org.milestones[title] = org.milestones[title] || {projects: {}};
    org.milestones[title].projects[project] = milestoneData;
    localStorage.setItem(organization, JSON.stringify(org));
    storeKeyIfNotExists('orgs', organization);
    return org.milestones[title];
};
milestones.orgs = function orgs() { return JSON.parse(localStorage.getItem('orgs') || '[]'); };
milestones.getOrg = function getOrg(organization) {
    var org = localStorage.getItem(organization);
    return org ? JSON.parse(org).milestones : null;
};

module.exports = milestones;