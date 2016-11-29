function getID(name) { return document.getElementById(name); }

window.onload = function() {
    //var url = window.location.toString();
    //var organization = url.split('?')[1];
    var organization = 'codenautas';
    getID('title').textContent = organization.toUpperCase();
    getID('refresh').addEventListener('click', function(){
        var tabla = getID('milestones');
        while(tabla.firstChild) { tabla.removeChild(tabla.firstChild); }
        var status = getID('status');
        status.textContent = 'Fetching milestones...';
        milestones.fetchAll({org:organization}).then(function(milestones){
            // document.getElementById('milestones').textContent=JSON.stringify(milestones);
            if(milestones.rateLimitReset) {
                getID('status').textContent = 'Request limit reachead. New data will be available at '+milestones.rateLimitReset;
                delete milestones.rateLimitReset;
            }
            // falta el concepto de may-be-outdated!
            var html = jsToHtml.html;
            Object.keys(milestones).sort().forEach(function(key) {
                //console.log("key", key)
                var ms = milestones[key];
                console.log(JSON.stringify(ms));
                var trs = [];
                var titlesClass = {class:'titles'};
                trs.push(html.tr({class:'milestone-row'}, [
                    html.td({class:'milestone-name'}, key),
                    html.td(" "),
                    html.td(" "),
                    html.td(titlesClass, "Last updated"),
                    html.td(titlesClass, "Complete"),
                    html.td(titlesClass, "Open"),
                    html.td(titlesClass, "Closed"),
                    html.td(" ")
                ]));
                Object.keys(ms.projects).sort().forEach(function(pkey) {
                    var project = ms.projects[pkey];
                    //console.log("pkey", project)
                    trs.push(html.tr({class:'milestone-repository'}, [
                        html.td({class:'repository-name'}, pkey),
                        html.td({class:'state'}, project.state),
                        html.td({class:'updated-at'}, project.daysFromUpdate),
                        html.td({class:(project.state==='closed' ? 'closed-at' : 'due-on')}, project.date),
                        html.td({class:'percent-complete'}, project.pctComplete+'%'),
                        html.td({class:'open-issues'}, project.issues.open),
                        html.td({class:'closed-issues'}, project.issues.closed),
                        html.td("progress bar")
                    ]));
                });
                tabla.appendChild(html.tr([html.td([html.table(trs)])]).create());
            });
        }).then(function() {
            status.textContent = 'Listo.';
        });
    });
}