"use strict";

function leerMilestones(page, milestones){
    milestones = milestones || {};
    var page=page||1;
    return fetch('https://api.github.com/orgs/codenautas/repos?page='+page)
    .then(function(response){
        return response.json();
    }).then(function(arr){
        /* arr=[
            {name: 'backend-plus'},
            {name: 'dialog-promise'},
            {name: 'typed-controls'},
        ] // */
        return Promise.all(
            arr.map(function(proyecto){
                return fetch('https://api.github.com/repos/codenautas/'+proyecto.name+'/milestones?state=all')
                .then(function(response){
                    return response.json();
                }).then(function(arr){
                    arr.forEach(function(milestone){
                        milestones[milestone.title] = milestones[milestone.title] || { proyectos: {} };
                        milestones[milestone.title].proyectos[proyecto.name] = milestone;
                    });
                });
            })
        ).then(function(){
            if(arr.length /* && false */){
                return leerMilestones(page+1, milestones);
            }
            return milestones;
        });
    });
}

function leerMilestones2(){
    fetch('https://api.github.com/orgs/codenautas/repos')
    .then(function(response){
        milestones.textContent=JSON.stringify(response);
    });
}

window.addEventListener('load', function(){
    leerMilestones().then(function(milestones){
        document.getElementById('milestones').textContent=JSON.stringify(milestones);
    });
});