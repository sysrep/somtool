import ndarray from "ndarray"
import ops from "ndarray-ops"
import cwise from "cwise"
import show from 'ndarray-show'
//import unpack from 'ndarray-unpack'
import {som} from "../node_modules/som.js/dist/som.js"
import _ from "underscore"
import loremIpsum from 'lorem-ipsum'
//import '../node_modules/filesaver.js/FileSaver.js'
import "../node_modules/d3/d3.js"
import "../src/d3.hexbin.js"

import randomColor from "randomcolor"
import filesaver from 'browser-filesaver'

export function mainController($scope) {

    function drawHexGrid(dimension, MapRows) {
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
            top: 50,
            right: 0,
            bottom: 0,
            left: 50
        };

        var width = 3200;
        var height = 4000;

        var MapColumns = dimension

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
        var modelNumber = MapRows

        d3.select("#hexsvg").remove()

        var svg = d3.select("#chart").append("svg")
            .attr("id", "hexsvg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
                return randomColor({hue: 'blue', count: points.length})[i]
            })
            .attr("stroke-width", "3px")
            .on("mouseover", mover)
            .on("mouseout", mout)
    }

    function getLine (map, dimensionOfMap, lineNumber) {
        var line = []
        for (var i =0; i < dimensionOfMap; i++) {
            var item = map.get(i,lineNumber)
            if (item) {
                line.push(item)
            } else {
                line.push(0)
            }

        }
        return line
        //var line = map.hi(dimensionOfMap,lineNumber+1).lo(0,lineNumber)
        //var unpackedLine = unpack(line)
        //console.log(line)
        ////console.log(unpackedLine)
        //console.log(_.flatten(unpackedLine))
        //return _.flatten(unpackedLine)
    }

    function stringIntoNdarray (string) {
        if (string != undefined) {
            var o = _.values(JSON.parse(string))
            var n = ndarray(new Float32Array(o), [$scope.dimensionN, $scope.mapRowsN])
            return n
        }
    }

    $scope.start = function () {
        $scope.time = 0
        $scope.trainedMap = {}
        function trackStatus (map, time) {
            $scope.time = time
        }
        var inputArray = (function() {
            var tempArray = _.map(_.values($scope.items), function(i) {
                    if (i.categories) {
                        var degrees = _.map(_.values(i.categories), function(j) {

                            if (j.degree) {
                                return (j.degree/5)
                            } else { return null}
                        })
                        return degrees
                    } else { return []}
                })
            return tempArray
        }());
        //console.log(inputArray)
        var inputVector = ndarray(new Float32Array(_.flatten(inputArray)), [$scope.dimensionN, $scope.mapRowsN])
        //ops.random(inputVector)
        var M = ndarray(new Float32Array($scope.dimensionN*$scope.mapRowsN), [$scope.dimensionN, $scope.mapRowsN])
        ops.random(M)
        var trainingTimes = 5;
        $scope.trainedMap = som(M, inputVector, trainingTimes, trackStatus)
    }

    $scope.pollDataIn = function (v) {
        var index = Math.floor(v)
        var m = $scope.trainedMap.get(index)
        if (m === undefined) { m = $scope.trainedMap.get(index+1)}
        if (m === undefined) { m = $scope.trainedMap.get(index+2)}
        if (m === undefined) { m = $scope.trainedMap.get(index+3)}
        if (m === undefined) { m = $scope.trainedMap.get(index+4)}
        if (m === undefined) { m = $scope.trainedMap.get(index+5)}
        d3.selectAll(".hexagon").transition().duration(800).style('fill', function(data,i) {
            //console.log(m)
            var d = getLine(stringIntoNdarray(m), $scope.dimensionN, i)
            console.log(d)
            return 'rgb(' + Math.floor(255*d[0]) + ',' + Math.floor(255*d[1]) + ',' + Math.floor(255*d[2]) + ')'
        })

    }

    $scope.clearValue = function() {
        //$scope.myModel = undefined;
    };

    $scope.random = function() {
        for (let i = 0; i < $scope.dimensionN ; i++) {
            $scope.categories[i] = loremIpsum({
                count: 1                      // Number of words, sentences, or paragraphs to generate.
                , units: 'words'            // Generate words, sentences, or paragraphs.
            });
        }

        $scope.item = _.map(_.values($scope.items), function(i) {
            i['categories'] = {}
            i['name'] = loremIpsum({
                count: 1                      // Number of words, sentences, or paragraphs to generate.
                , units: 'words'            // Generate words, sentences, or paragraphs.
            });
            for (let j = 0; j < $scope.dimensionN ; j++) {
                i.categories[j] = {}
                i.categories[j]['degree'] = Math.floor(Math.random() * 5) + 1

            }
            return i
        })

    }

    $scope.save = function() {
        //alert('Form was valid!');
        document.getElementById("hexsvg").setAttribute('version', '1.1')
        document.getElementById("hexsvg").setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        var svg = new Blob([document.getElementById("hexsvg").parentNode.innerHTML], {type:"application/svg+xml"})
        //console.log(saveAs)
        //console.log(FileSaver)
        filesaver.saveAs(svg, "som.svg")
    };

    $scope.generateArray = function(n) {
        return Array.from(new Array(n), (x,i) => i+1)
    }

    $scope.getTdWidth = function() {
        switch (true) {
            case ($scope.dimensionN > 12):
                return { 'width': '70px', 'padding': '0 2px 0 1px', 'font-size': '8px'}
                break
            case ($scope.dimensionN > 11):
                return { 'width': '75px', 'padding': '0 1px 0 1px', 'font-size': '8px'}
                break
            case ($scope.dimensionN > 10):
                return { 'width': '80px', 'padding': '0 1px 0 1px', 'font-size': '8px'}
                break
            case ($scope.dimensionN > 9):
                return { 'width': '85px', 'padding': '0 2px 0 2px', 'font-size': '10px'}
                break
            case ($scope.dimensionN > 8):
                return { 'width': '95px', 'padding': '0 6px 0 6px' }
                break
            case ($scope.dimensionN > 7):
                return { 'width': '105px', 'padding': '0 7px 0 7px' }
                break
            case ($scope.dimensionN > 6):
                return { 'width': '120px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.dimensionN > 5):
                return { 'width': '135px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.dimensionN > 4):
                return { 'width': '140px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.dimensionN > 3):
                return { 'width': '150px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.dimensionN > 2):
                return { 'width': '150px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.dimensionN > 1):
                return { 'width': '150px', 'padding': '0 10px 0 10px' }
                break
        }
    }

    $scope.dimensionN = 12
    $scope.mapRowsN = 10

    $scope.items = {}
    $scope.$watch('mapRowsN', function(n,o) {
        if (n != undefined) {
            if (o>n) {
                for (let i = n; i < o; i++) {
                    delete $scope.items[i]
                }
            }
            for (let i = 0; i < n; i++) {
                $scope.items[i] = {}
            }
        }
    })
    $scope.mapWidth = 12
    $scope.mapHeight = 18
    $scope.$watch('mapWidth', function(n,o) {
        if (n != undefined) drawHexGrid(n, $scope.mapHeight)
    })
    $scope.$watch('mapHeight', function(n,o) {
        if (n != undefined) drawHexGrid($scope.mapWidth, n)
    })
    
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
            //drawHexGrid($scope.dimensionN, $scope.mapRowsN)
        }
    })



}
