import "../src/css/index.css"

import "../node_modules/angular/angular.js"
import "../node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js"
import som from "../node_modules/som.js/dist/som.js"

// webpack-dev-server and
// go to http://localhost:8080/webpack-dev-server/index.html

angular.module('somApp', [])
    .controller('MainController', function() {
        console.log('hello world')
    });