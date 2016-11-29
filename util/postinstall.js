"use strict";

require('fs-extra');
var fs = require('fs-promise');
var Path = require('path');

fs.copy('./node_modules/js-to-html/js-to-html.js', './web/js-to-html.js').then(function() {
    console.log("Post-Install ok executed.")
})