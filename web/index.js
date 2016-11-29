function getID(name) { return document.getElementById(name); }

window.onload = function() {
    //var url = window.location.toString();
    //var organization = url.split('?')[1];
    var organization = 'codenautas';
    getID('title').textContent = organization.toUpperCase();
    getID('refresh').addEventListener('click', function(){
        milestones.fetchAll({org:organization}).then(function(milestones){
            // document.getElementById('milestones').textContent=JSON.stringify(milestones);
            if(milestones.rateLimitReset) {
                getID('status').textContent = 'Request limit reachead. New data will be available at '+milestones.rateLimitReset;
                delete milestones.rateLimitReset;
            }
            var tabla = getID('milestones');
            var html = jsToHtml.html;
            Object.keys(milestones).forEach(function(key) {
                //console.log("key", key)
                var ms = milestones[key];
                console.log(JSON.stringify(ms));
                var trs = [];
                trs.push(html.tr([
                    html.td([ html.h3(key)]),
                    html.td(" "),
                    html.td("Last updated"),
                    html.td("Complete"),
                    html.td("Open"),
                    html.td("Closed"),
                    html.td(" ")
                ]));
                Object.keys(ms.projects).forEach(function(pkey) {
                    var project = ms.projects[pkey];
                    //console.log("pkey", project)
                    trs.push(html.tr([
                        html.td([html.h4(pkey)]),
                        html.td(project.daysFromUpdate),
                        html.td(project.date),
                        html.td(project.pctComplete+'%'),
                        html.td(project.issues.open),
                        html.td(project.issues.closed),
                        html.td("progress bar")
                    ]));
                });
                tabla.appendChild(html.tr([html.td([html.table(trs)])]).create());
            });
        });
    });
}