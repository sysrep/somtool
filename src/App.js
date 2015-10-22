import "../node_modules/bootstrap/dist/css/bootstrap.css"
import "../node_modules/angular-material/angular-material.css"
import 'font-awesome/css/font-awesome.css';
import "../src/css/index.css"

import "../node_modules/angular/angular.js"
import "../node_modules/angular-ui-router/build/angular-ui-router.js"
import "../node_modules/angular-aria/angular-aria.js"
import "../node_modules/angular-animate/angular-animate.js"
import "../node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js"
import "../node_modules/angular-material/angular-material.js"
import "../node_modules/angular-messages/angular-messages.js"


import { config } from "../src/appConfig.js"
import { mainController } from "../src/appControllers.js"
import { floorFilter } from "../src/appFilters.js"

// webpack-dev-server and
// go to http://localhost:8080/webpack-dev-server/index.html

angular.module('somTool', ['ui.router', 'ngAnimate', 'ui.bootstrap', 'ngMaterial', 'ngMessages'])
    .config(config)
    .filter('floorFilter', floorFilter)
    .controller('mainController', mainController)