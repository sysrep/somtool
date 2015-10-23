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

/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.1.20150716
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
        "use strict";
        // IE <10 is explicitly unsupported
        if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
            return;
        }
        var
            doc = view.document
        // only get URL when necessary in case Blob.js hasn't overridden it yet
            , get_URL = function() {
                return view.URL || view.webkitURL || view;
            }
            , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
            , can_use_save_link = "download" in save_link
            , click = function(node) {
                var event = new MouseEvent("click");
                node.dispatchEvent(event);
            }
            , webkit_req_fs = view.webkitRequestFileSystem
            , req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
            , throw_outside = function(ex) {
                (view.setImmediate || view.setTimeout)(function() {
                    throw ex;
                }, 0);
            }
            , force_saveable_type = "application/octet-stream"
            , fs_min_size = 0
        // See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
        // https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
        // for the reasoning behind the timeout and revocation flow
            , arbitrary_revoke_timeout = 500 // in ms
            , revoke = function(file) {
                var revoker = function() {
                    if (typeof file === "string") { // file is an object URL
                        get_URL().revokeObjectURL(file);
                    } else { // file is a File
                        file.remove();
                    }
                };
                if (view.chrome) {
                    revoker();
                } else {
                    setTimeout(revoker, arbitrary_revoke_timeout);
                }
            }
            , dispatch = function(filesaver, event_types, event) {
                event_types = [].concat(event_types);
                var i = event_types.length;
                while (i--) {
                    var listener = filesaver["on" + event_types[i]];
                    if (typeof listener === "function") {
                        try {
                            listener.call(filesaver, event || filesaver);
                        } catch (ex) {
                            throw_outside(ex);
                        }
                    }
                }
            }
            , auto_bom = function(blob) {
                // prepend BOM for UTF-8 XML and text/* types (including HTML)
                if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                    return new Blob(["\ufeff", blob], {type: blob.type});
                }
                return blob;
            }
            , FileSaver = function(blob, name, no_auto_bom) {
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                // First try a.download, then web filesystem, then object URLs
                var
                    filesaver = this
                    , type = blob.type
                    , blob_changed = false
                    , object_url
                    , target_view
                    , dispatch_all = function() {
                        dispatch(filesaver, "writestart progress write writeend".split(" "));
                    }
                // on any filesys errors revert to saving with object URLs
                    , fs_error = function() {
                        // don't create more object URLs than needed
                        if (blob_changed || !object_url) {
                            object_url = get_URL().createObjectURL(blob);
                        }
                        if (target_view) {
                            target_view.location.href = object_url;
                        } else {
                            var new_tab = view.open(object_url, "_blank");
                            if (new_tab == undefined && typeof safari !== "undefined") {
                                //Apple do not allow window.open, see http://bit.ly/1kZffRI
                                view.location.href = object_url
                            }
                        }
                        filesaver.readyState = filesaver.DONE;
                        dispatch_all();
                        revoke(object_url);
                    }
                    , abortable = function(func) {
                        return function() {
                            if (filesaver.readyState !== filesaver.DONE) {
                                return func.apply(this, arguments);
                            }
                        };
                    }
                    , create_if_not_found = {create: true, exclusive: false}
                    , slice
                    ;
                filesaver.readyState = filesaver.INIT;
                if (!name) {
                    name = "download";
                }
                if (can_use_save_link) {
                    object_url = get_URL().createObjectURL(blob);
                    save_link.href = object_url;
                    save_link.download = name;
                    setTimeout(function() {
                        click(save_link);
                        dispatch_all();
                        revoke(object_url);
                        filesaver.readyState = filesaver.DONE;
                    });
                    return;
                }
                // Object and web filesystem URLs have a problem saving in Google Chrome when
                // viewed in a tab, so I force save with application/octet-stream
                // http://code.google.com/p/chromium/issues/detail?id=91158
                // Update: Google errantly closed 91158, I submitted it again:
                // https://code.google.com/p/chromium/issues/detail?id=389642
                if (view.chrome && type && type !== force_saveable_type) {
                    slice = blob.slice || blob.webkitSlice;
                    blob = slice.call(blob, 0, blob.size, force_saveable_type);
                    blob_changed = true;
                }
                // Since I can't be sure that the guessed media type will trigger a download
                // in WebKit, I append .download to the filename.
                // https://bugs.webkit.org/show_bug.cgi?id=65440
                if (webkit_req_fs && name !== "download") {
                    name += ".download";
                }
                if (type === force_saveable_type || webkit_req_fs) {
                    target_view = view;
                }
                if (!req_fs) {
                    fs_error();
                    return;
                }
                fs_min_size += blob.size;
                req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
                    fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
                        var save = function() {
                            dir.getFile(name, create_if_not_found, abortable(function(file) {
                                file.createWriter(abortable(function(writer) {
                                    writer.onwriteend = function(event) {
                                        target_view.location.href = file.toURL();
                                        filesaver.readyState = filesaver.DONE;
                                        dispatch(filesaver, "writeend", event);
                                        revoke(file);
                                    };
                                    writer.onerror = function() {
                                        var error = writer.error;
                                        if (error.code !== error.ABORT_ERR) {
                                            fs_error();
                                        }
                                    };
                                    "writestart progress write abort".split(" ").forEach(function(event) {
                                        writer["on" + event] = filesaver["on" + event];
                                    });
                                    writer.write(blob);
                                    filesaver.abort = function() {
                                        writer.abort();
                                        filesaver.readyState = filesaver.DONE;
                                    };
                                    filesaver.readyState = filesaver.WRITING;
                                }), fs_error);
                            }), fs_error);
                        };
                        dir.getFile(name, {create: false}, abortable(function(file) {
                            // delete file if it already exists
                            file.remove();
                            save();
                        }), abortable(function(ex) {
                            if (ex.code === ex.NOT_FOUND_ERR) {
                                save();
                            } else {
                                fs_error();
                            }
                        }));
                    }), fs_error);
                }), fs_error);
            }
            , FS_proto = FileSaver.prototype
            , saveAs = function(blob, name, no_auto_bom) {
                return new FileSaver(blob, name, no_auto_bom);
            }
            ;
        // IE 10+ (native saveAs)
        if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
            return function(blob, name, no_auto_bom) {
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                return navigator.msSaveOrOpenBlob(blob, name || "download");
            };
        }

        FS_proto.abort = function() {
            var filesaver = this;
            filesaver.readyState = filesaver.DONE;
            dispatch(filesaver, "abort");
        };
        FS_proto.readyState = FS_proto.INIT = 0;
        FS_proto.WRITING = 1;
        FS_proto.DONE = 2;

        FS_proto.error =
            FS_proto.onwritestart =
                FS_proto.onprogress =
                    FS_proto.onwrite =
                        FS_proto.onabort =
                            FS_proto.onerror =
                                FS_proto.onwriteend =
                                    null;

        return saveAs;
    }(
        typeof self !== "undefined" && self
        || typeof window !== "undefined" && window
        || this.content
    ));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
    module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
    define([], function() {
        return saveAs;
    });
}

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
            top: 90,
            right: 300,
            bottom: 20,
            left: 90
        };

        var width = 4500;
        var height = 7500;

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
        saveAs(svg, "som.svg")
    };

    $scope.generateArray = function(n) {
        return Array.from(new Array(n), (x,i) => i+1)
    }

    $scope.mapRowsN = 9
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
            drawHexGrid($scope.dimensionN, $scope.mapRowsN)
        }
    })

    $scope.dimensionN = 6
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
            drawHexGrid($scope.dimensionN, $scope.mapRowsN)
        }
    })

    drawHexGrid($scope.dimensionN, $scope.mapRowsN)
    //setTimeout($scope.random(), 5400);
    //

}
