function getID(name) { return document.getElementById(name); }

function fireClick(node){
    if (document.createEvent) {
        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        node.dispatchEvent(evt);    
    } else if (document.createEventObject) {
        node.fireEvent('onclick') ; 
    } else if (typeof node.onclick == 'function') {
        node.onclick(); 
    }
}

window.onload = function() {
    var url = window.location.toString();
    var organization = url.split('?')[1] || 'codenautas';
    getID('title').textContent = organization.toUpperCase();
    function resetMilestones() {
        var mstones = getID('milestones');
        while(mstones.firstChild) { mstones.removeChild(mstones.firstChild); }
        return mstones;
    }
    getID('clear').addEventListener('click', function(){
        resetMilestones();
        localStorage.clear();
        status.textContent = 'Database cleared.';
    });
    var refresh = getID('refresh');
    refresh.addEventListener('click', function(){
        var mstones = resetMilestones();
        var status = getID('status');
        status.textContent = 'Fetching milestones...';
        milestones.fetchAll({org:organization}).then(function(milestones){
            //getID('milestones').textContent=JSON.stringify(milestones);
            if(milestones.rateLimitReset) {
                getID('status').textContent += ' Request limit reachead. New data will be available at '+milestones.rateLimitReset+'. ';
                delete milestones.rateLimitReset;
            }
            // falta el concepto de may-be-outdated!
            var html = jsToHtml.html;
            var trs = [];
            Object.keys(milestones).sort().forEach(function(key) {
                //console.log("key", key)
                var ms = milestones[key];
                //console.log(JSON.stringify(ms));
                var titlesClass = {class:'titles'};
                trs.push(html.tr({class:'milestone-row'}, [
                    html.td({class:'milestone-name'}, key),
                    html.td(" "),
                    html.td(titlesClass, "date"),
                    html.td(titlesClass, "last updated"),
                    html.td(titlesClass, "complete"),
                    html.td(titlesClass, "open"),
                    html.td(titlesClass, "closed"),
                    html.td(" ")
                ]));
                Object.keys(ms.projects).sort().forEach(function(pkey) {
                    var project = ms.projects[pkey];
                    var isClosed = project.state==='closed';
                    var daysSinceUpdate = project.daysFromUpdate+' days ago';
                    var d = new Date(project.date);
                    var showDate = String('0'+d.getDay()).slice(-2)+'/'+String('0'+d.getMonth()).slice(-2)+'/'+d.getFullYear();
                    trs.push(html.tr({class:project.mayBeOutdated?'may-be-outdated':'repository-row'}, [
                        //https://github.com/codenautas/txt-to-sql/milestones
                        html.td([html.a({class:'repository-name', href:'https://github.com/'+organization+'/'+pkey+'/milestones'}, pkey)]),
                        html.td({class:'state'}, isClosed?project.state+' '+daysSinceUpdate:''),
                        html.td({class:isClosed?'closed-at':'due-on'}, showDate),
                        html.td({class:'updated-at'}, daysSinceUpdate),
                        html.td({class:'percent-complete'}, project.pctComplete+'%'),
                        html.td({class:'open-issues'}, project.issues.open),
                        html.td({class:'closed-issues'}, project.issues.closed),
                        html.td([
                            html.div({id:'progress'}, [
                                html.span({id:'percent'}),
                                html.div({id:'bar', style:'width: '+project.pctComplete+'%'})
                            ])
                       ])
                    ]));
                });
                trs.push(html.tr([html.td({colspan:8}, [html.hr()])]));
            });
            mstones.appendChild(html.table(trs).create());
            delete trs;
        }).then(function() {
            status.textContent += 'Listo.';
        }).catch(function(err) {
            console.log(err.stack)
            status.textContent = err.message + '\n<pre>' + err.stack + '\n</pre>\n';
        });
    });
    fireClick(refresh);
}