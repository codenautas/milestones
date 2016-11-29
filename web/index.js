function getID(name) { return document.getElementById(name); }

window.onload = function() {
    var url = window.location.toString();
    getID('title').textContent = url.split('?')[1].toUpperCase();
}