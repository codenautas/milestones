function getID(name) { return document.getElementById(name); }

window.onload = function() {
    var url = window.location.toString();
    var organization = url.split('?')[1];
    getID('title').textContent = organization.toUpperCase();
    getID('refresh').addEventListener('click', function(){
        milestones.fetchAll({org:organization}).then(function(milestones){
            document.getElementById('milestones').textContent=JSON.stringify(milestones);
        });
    });
}