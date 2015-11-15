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
import $ from 'jquery'

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

        var MapColumns = dimension

        var width = 3200;
        var height = 4000;

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
            .attr("width", width + margin.left + margin.right + 5)
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
                //return randomColor({hue: 'blue', count: points.length})[i]
                return 'rgba(0,0,0,0.4)'
            })
            .attr("fill", function(data,i) {
                //var mapZero = stringIntoNdarray(trainedMap.get(0))
                //var d = getLine(mapZero, dimension, i)
                //return 'rgb(' + Math.floor(255*d[0]) + ',' + Math.floor(255*d[1]) + ',' + Math.floor(255*d[2]) + ')'
                return 'white'
            })
            .attr("stroke-width", "0.5px")
            .on("mouseover", mover)
            .on("mouseout", mout)
    }

    function getLine (map, dimensionOfMap, lineNumber) {
        var line = []
        for (var i =0; i < dimensionOfMap; i++) {
            var item = map.get(i,lineNumber)
            if (item) {
                line.push(item)
                //break
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
            var n = ndarray(new Float32Array(o), [$scope.numberOfAttributes, $scope.numberOfEntities])
            return n
        }
    }

    function forceRedraw(element){
        var disp = element.style.display;
        element.style.display = 'none';
        var trick = element.offsetHeight;
        element.style.display = disp;
    };

    $scope.start = function () {
        d3.select('#statusInPerceptage').text('')
        d3.select('#statusInPerceptage').text('somap processing')
        $scope.time = 0
        $scope.trainedMap = {}

        var inputArray = (function() {
            var tempArray = _.map(_.values($scope.entities), function(i) {
                    if (i.attributes) {
                        var degrees = _.map(_.values(i.attributes), function(j) {

                            if (j.degree) {
                                return (j.degree/5)
                            } else { return null}
                        })
                        return degrees
                    } else {return []}
                })
            return tempArray
        }());
        $scope.inputMatrix = inputArray

        let inputVector = ndarray(new Float32Array(_.flatten(inputArray)), [$scope.numberOfAttributes, $scope.numberOfEntities])
        //ops.random(inputVector)
        let M = ndarray(new Float32Array($scope.mapWidth*$scope.mapHeight*$scope.numberOfAttributes), [$scope.numberOfAttributes, $scope.mapWidth*$scope.mapHeight])
        ops.random(M)
        $scope.trainingTimes = 120
        $scope.statusInPercentage = 0
        function trackStatus (map, time) {

            var statusInPerceptage = time/(inputArray.length*$scope.trainingTimes)*100
            if (statusInPerceptage === 100) {
                d3.select('#statusInPerceptage').text('done!')
                $scope.statusInPercentage = statusInPerceptage
                //forceRedraw()
                //document.getElementById('statusInPerceptage').style.display = 'none';
                //document.getElementById('statusInPerceptage').offsetHeight
                //document.getElementById('statusInPerceptage').style.display = '';
            }


            //console.log($scope.statusInPercentage)
        }

        $scope.trainedMap = som(M, inputVector, $scope.trainingTimes, trackStatus)
        $scope.pollDataIn(1, $scope.inputMatrix)
    }

    var ndarrayDistance = cwise({
        args: ["array", "array"],
        pre: function(shape) {
            this.d = 0
        },
        body: function(a1, a2) {
            this.d = this.d + Math.abs((a1-a2)*(a1-a2))
        },
        post: function() {
            return Math.sqrt(this.d)
        }
    })

    $scope.pollDataIn = function (v, inputMatrix) {
        //console.log(v)
        var index = Math.floor(v)
        var m = $scope.trainedMap.get(index)
        //if (m === undefined) { console.log('time of somap has something wrong')}
        //console.log(m)
        var width = 3200;
        var height = 4000;

        var hexRadius = d3.min([
            width/(($scope.mapWidth + 0.5) * Math.sqrt(3)),
            height/(($scope.mapHeight + 1/3) * 1.5)
        ]);
        var hexbin = d3.hexbin().radius(hexRadius);
        var points = []
        for (var i = 0; i < $scope.mapHeight; i++) {
            for (var j = 0; j < $scope.mapWidth; j++) {
                points.push([
                    hexRadius * j * 1.75,
                    hexRadius * i * 1.5
                ]);
            }
        }
        var hexedPos = hexbin(points)

        if (d3.select(".hexagontext").parentNode) {
            d3.select(".hexagontext").parentNode.remove()
        }

        d3.select("#hexsvg").append("g")
            .attr("transform", "translate(" + 42 + "," + 45 + ")")
            .selectAll("hexagontext")
            .data(function(){
                return hexedPos
            })
            .enter().append("text")
            .attr("x", function (d) {
                return d.x
            }).attr("y", function (d) {
                return d.y + hexRadius/2
            })
            .attr('fill', 'black')
            .attr('class', function(d, i) {
                return 'hexagontext hexagontext' + i
            })
            .attr('font-size', 6)
            .on('mouseover',function (d, i){
                d3.select(this).attr("font-size", "12");
            })
            .on('mouseout',function (d, i){
                d3.select(this).attr("font-size", "6");
            })

        d3.selectAll('.hexagontext').text('')
        var inputNdarray = ndarray(new Float32Array(_.flatten(inputMatrix)), [$scope.numberOfAttributes, $scope.numberOfEntities])
        //var trainedSomap = ndarray(new Float32Array(m), [$scope.numberOfAttributes, $scope.mapWidth*$scope.mapHeight])

        for (let ii = 0; ii < $scope.numberOfEntities; ii++) {
            //line 1 -> m = M.hi(2,1).lo(0,0); line 2 -> m = M.hi(2,2).lo(0,1)
            var inputNdarrayUnit = inputNdarray.hi($scope.numberOfAttributes, ii + 1).lo(0, ii)
            let Q = ndarray(new Float32Array($scope.mapWidth*$scope.mapHeight), [1, $scope.mapWidth*$scope.mapHeight])

            for (let jj = 0; jj < $scope.mapWidth*$scope.mapHeight; jj++) {
                let mapUnit = ndarray(new Float32Array(getLine(stringIntoNdarray(m), $scope.numberOfAttributes, jj)), [parseFloat($scope.numberOfAttributes), 1])
                let d = ndarrayDistance(inputNdarrayUnit, mapUnit)
                Q.set(0, jj, d)
            }
            let closetMapUnit = ops.argmin(Q)[1]
            let selector = '.hexagontext' + closetMapUnit
            //console.log(selector)

            d3.select(selector).text(function(){
                console.log('text changed')
                var otherData = d3.select(this).text()
                if (otherData) {
                    return otherData + ' + ' + $scope.entities[ii].name
                } else {
                    return $scope.entities[ii].name
                }

            })
        }
        //d3.selectAll(".hexagontext").text(function(data,index) {
        //        //console.log(m)
        //        var Q = ndarray(new Float32Array($scope.numberOfEntities), [1, $scope.numberOfEntities])
        //
        //        var mapUnit = ndarray(new Float32Array(getLine(stringIntoNdarray(m), $scope.numberOfAttributes, index)), [parseFloat($scope.numberOfAttributes), 1])
        //        //console.log('----mapUnit---')
        //        //console.log(show(mapUnit))
        //        //console.log(mapUnit.shape)
        //        for (var i = 0; i < $scope.numberOfEntities; i++) {
        //            //line 1 -> m = M.hi(2,1).lo(0,0); line 2 -> m = M.hi(2,2).lo(0,1)
        //            var inputNdarrayUnit = inputNdarray.hi($scope.numberOfAttributes, i + 1).lo(0, i)
        //            //console.log(inputNdarrayUnit.shape)
        //            //console.log('----inputNdarrayUnit---')
        //            //console.log(show(inputNdarrayUnit))
        //            var d = ndarrayDistance(inputNdarrayUnit, mapUnit);
        //            Q.set(0, i, d)
        //        }
        //        var closestInputDataIndex = ops.argmin(Q)[1]
        //        return $scope.entities[closestInputDataIndex].name
        //    //return 'rgb(' + Math.floor(255*d[0]) + ',' + Math.floor(255*d[1]) + ',' + Math.floor(255*d[2]) + ')'
        //})

    }

    $scope.clearValue = function() {
        //$scope.myModel = undefined;
    };

    $scope.random = function() {
        for (let i = 0; i < $scope.numberOfAttributes ; i++) {
            $scope.attributes[i] = loremIpsum({
                count: 1                      // Number of words, sentences, or paragraphs to generate.
                , units: 'words'            // Generate words, sentences, or paragraphs.
            });
        }

        $scope.entities = _.map(_.values($scope.entities), function(i) {
            i['attributes'] = {}
            i['name'] = loremIpsum({
                count: 1                      // Number of words, sentences, or paragraphs to generate.
                , units: 'words'            // Generate words, sentences, or paragraphs.
            });
            for (let j = 0; j < $scope.numberOfAttributes ; j++) {
                i.attributes[j] = {}
                i.attributes[j]['degree'] = Math.floor(Math.random() * 5) + 1

            }
            return i
        })

    }

    $scope.saveSVG = function() {
        document.getElementById("hexsvg").setAttribute('version', '1.1')
        document.getElementById("hexsvg").setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        var svg = new Blob([document.getElementById("hexsvg").parentNode.innerHTML], {type:"application/svg+xml"})
        filesaver.saveAs(svg, "som.svg")
    };

    $scope.generateArray = function(n) {
        return Array.from(new Array(n), (x,i) => i+1)
    }

    $scope.getTdWidth = function() {
        switch (true) {
            case ($scope.numberOfAttributes > 12):
                return { 'width': '70px', 'padding': '0 2px 0 1px', 'font-size': '8px'}
                break
            case ($scope.numberOfAttributes > 11):
                return { 'width': '75px', 'padding': '0 1px 0 1px', 'font-size': '8px'}
                break
            case ($scope.numberOfAttributes > 10):
                return { 'width': '80px', 'padding': '0 1px 0 1px', 'font-size': '8px'}
                break
            case ($scope.numberOfAttributes > 9):
                return { 'width': '85px', 'padding': '0 2px 0 2px', 'font-size': '10px'}
                break
            case ($scope.numberOfAttributes > 8):
                return { 'width': '95px', 'padding': '0 6px 0 6px' }
                break
            case ($scope.numberOfAttributes > 7):
                return { 'width': '105px', 'padding': '0 7px 0 7px' }
                break
            case ($scope.numberOfAttributes > 6):
                return { 'width': '120px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.numberOfAttributes > 5):
                return { 'width': '135px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.numberOfAttributes > 4):
                return { 'width': '140px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.numberOfAttributes > 3):
                return { 'width': '150px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.numberOfAttributes > 2):
                return { 'width': '150px', 'padding': '0 10px 0 10px' }
                break
            case ($scope.numberOfAttributes > 1):
                return { 'width': '150px', 'padding': '0 10px 0 10px' }
                break
        }
    }

    $scope.numberOfAttributes = 12
    $scope.numberOfEntities = 20

    $scope.entities = {}
    $scope.$watch('numberOfEntities', function(n,o) {
        if (n != undefined) {
            $scope.entities = {}
            for (let i = 0; i < n; i++) {
                $scope.entities[i] = {}
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

    $scope.attributes = {}
    $scope.$watch('numberOfAttributes', function(n,o) {
        if (n != undefined) {
            $scope.attributes = {}
            for (let i = 0; i < n; i++) {
                $scope.attributes[i] = ''
            }
            //drawHexGrid($scope.numberOfAttributes, $scope.numberOfEntities)
        }
    })



}
