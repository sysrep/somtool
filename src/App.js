import "../node_modules/bootstrap/dist/css/bootstrap.css"
import 'font-awesome/css/font-awesome.css';
import "../src/css/index.css"

import "../node_modules/angular/angular.js"
import "../node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js"
import "../node_modules/angular-ui-router/build/angular-ui-router.js"

import "../node_modules/d3/d3.js"
import "../src/d3.hexbin.js"
import { config } from "../src/appConfig.js"
import { mainController } from "../src/appControllers.js"

// webpack-dev-server and
// go to http://localhost:8080/webpack-dev-server/index.html

angular.module('somTool', ['ui.router'])
    .config(config)
    .controller('mainController', mainController)