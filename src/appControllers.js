import ndarray from "ndarray"
import ops from "ndarray-ops"
import cwise from "cwise"
import show from 'ndarray-show'
import unpack from 'ndarray-unpack'
import {som} from "../node_modules/som.js/dist/som.js"
import _ from "underscore"
import "../node_modules/d3/d3.js"
import "../src/d3.hexbin.js"

import randomColor from "randomcolor"

export function mainController($scope) {

    function mover(d) {
        var el = d3.select(this)
                .transition()
                .duration(10)
                .style("fill-opacity", 0.3)
            ;
    }
    function mout(d) {
        var el = d3.select(this)
                .transition()
                .duration(1000)
                .style("fill-opacity", 1)
            ;
    };

    var margin = {
        top: 40,
        right: 30,
        bottom: 20,
        left: 50
    };

    var width = 900;
    var height = 800;

    var dimension = 9 //2 -> [x,y], 3 -> [x,y,z],
    var MapColumns = dimension,
        MapRows = 15;

    var hexRadius = d3.min([
            width/((MapColumns + 0.5) * Math.sqrt(3)),
            height/((MapRows + 1/3) * 1.5)
    ]);

    width = MapColumns*hexRadius*Math.sqrt(3);
    height = MapRows*1.5*hexRadius+0.5*hexRadius;

    var hexbin = d3.hexbin().radius(hexRadius);
    var points = [];

    for (var i = 0; i < MapRows; i++) {
        for (var j = 0; j < MapColumns; j++) {
            points.push([
                hexRadius * j * 1.75,
                hexRadius * i * 1.5
            ]);
        }
    }
    var hexedPos = hexbin(points)

    var modelNumber = MapRows,
        M = ndarray(new Float32Array(modelNumber*dimension), [dimension, modelNumber]),
        sqrootM = Math.floor(Math.sqrt(modelNumber)),
        inputVector = ndarray(new Float32Array(modelNumber*dimension), [dimension, modelNumber]),
        trainingTimes = 5;

    ops.random(inputVector)
    ops.random(M)

    var colors = randomColor({hue: 'blue', count: points.length});

    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    $scope.time = 0
    function trackStatus (map, time) {
        $scope.time = time
    }



    svg.append("g")
        .selectAll(".hexagon")
        .data(function(){
            return hexedPos
        })
        .enter().append("path")
        .attr("class", "hexagon")
        .attr("d", function (d) {
            return "M" + d.x + "," + d.y + hexbin.hexagon();
        })
        .attr("stroke", function () {
            return "#fff";
        })
        .attr("fill", function(data,i) {
            //var mapZero = stringIntoNdarray(trainedMap.get(0))
            //var d = getLine(mapZero, dimension, i)
            //return 'rgb(' + Math.floor(255*d[0]) + ',' + Math.floor(255*d[1]) + ',' + Math.floor(255*d[2]) + ')'
            return colors[i]
        })
        .attr("stroke-width", "3px")
        .on("mouseover", mover)
        .on("mouseout", mout)



    var hexagon = d3.selectAll(".hexagon")

    function getLine (map, dimensionOfMap, lineNumber) {
        var line = map.hi(dimensionOfMap,lineNumber+1).lo(0,lineNumber)
        var unpackedLine = unpack(line)
        return _.flatten(unpackedLine)
    }

    function stringIntoNdarray (string) {
        if (string != undefined) {
            var o = _.values(JSON.parse(string))
            var n = ndarray(new Float32Array(o), [dimension, modelNumber])
            return n
        }
    }

    var trainedMap = {}

    $scope.start = function () {
        trainedMap = som(M, inputVector, trainingTimes, trackStatus)
    }

    $scope.pollDataIn = function (v) {

        d3.selectAll(".hexagon").transition().duration(600).style('fill', function(data,i) {
            var m = trainedMap.get(v)
            if (m === undefined) { m = trainedMap.get(v+1)}
            if (m === undefined) { m = trainedMap.get(v+2)}
            if (m === undefined) { m = trainedMap.get(v+3)}
            if (m === undefined) { m = trainedMap.get(v+4)}
            if (m === undefined) { m = trainedMap.get(v+5)}
            //console.log(m)
            var d = getLine(stringIntoNdarray(m), dimension, i)

            return 'rgb(' + Math.floor(255*d[0]) + ',' + Math.floor(255*d[1]) + ',' + Math.floor(255*d[2]) + ')'
        })

    }

    $scope.clearValue = function() {
        $scope.myModel = undefined;
    };
    $scope.save = function() {
        //alert('Form was valid!');
    };


    $scope.generateArray = function(n) {
        return Array.from(new Array(n), (x,i) => i+1)
    }

    $scope.mapRowsN = 8
    $scope.items = {}
    $scope.$watch('mapRowsN', function(n,o) {
        if (n != undefined) {
            for (let i = 0; i < n; i++) {
                $scope.items[i] = {}
            }
            if (o>n) {
                for (let i = n; i < o; i++) {
                    delete $scope.items[i]
                }
            }
        }
    })

    $scope.dimensionN = 5
    $scope.categories = {}
    $scope.$watch('dimensionN', function(n,o) {
        if (n != undefined) {
            for (let i = 0; i < n; i++) {
                $scope.categories[i] = ''
            }
            if (o>n) {
                for (let i = n; i < o; i++) {
                    delete $scope.categories[i]
                }
            }
        }
    })

}
