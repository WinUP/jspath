"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var PickChildrenAnalyzer_1 = require("./PickChildrenAnalyzer");
var SliceAnalyzer_1 = require("./SliceAnalyzer");
var AnalyzerUnit_1 = require("./AnalyzerUnit");
var AnalyzerType_1 = require("./AnalyzerType");
/**
 * Analyse path
 * @param sourcePath Path in target
 */
function analyse(sourcePath) {
    if (sourcePath == null || sourcePath == undefined || sourcePath == '' || sourcePath == '/')
        return [];
    var paths = sourcePath.split('/').reverse();
    if (paths[paths.length - 1] == '')
        paths.pop();
    var units = [];
    paths.forEach(function (path) {
        var arraySubpipe = [];
        while (path.indexOf('[') > -1 && path.indexOf('reg:') != 0) {
            if (!_.endsWith(path, ']'))
                throw TypeError("Cannot analyse " + path + ": Want to understand as array but found invalid characters at EOL");
            var patterns = /(\S*?)\[([\d-:]+)\]/g.exec(path);
            if (patterns == null)
                throw "Cannot analyse " + path + ": Want to understand as array but found invalid boundary";
            var boundary = findArrayBoundary(patterns[2]);
            arraySubpipe.push(new AnalyzerUnit_1.AnalyzerUnit(AnalyzerType_1.AnalyzerType.Slice, new SliceAnalyzer_1.SliceAnalyzer(boundary.from, boundary.to)));
            path = path.substring(0, path.indexOf('[')) + path.substring(patterns[0].length);
        }
        units = units.concat(arraySubpipe.reverse());
        if (path && path != '')
            units.push(new AnalyzerUnit_1.AnalyzerUnit(AnalyzerType_1.AnalyzerType.PickChilren, new PickChildrenAnalyzer_1.PickChildrenAnalyzer(path)));
    });
    return units.reverse();
}
exports.analyse = analyse;
/**
 * Pick item from target
 * @param source Target
 * @param units Path analysing result
 */
function pick(source, units) {
    var result = source;
    units.forEach(function (unit) {
        var target;
        if (unit.type == AnalyzerType_1.AnalyzerType.Slice) {
            var content = unit.content;
            target = new SliceUnit(content.from, content.to);
        }
        else if (unit.type == AnalyzerType_1.AnalyzerType.PickChilren) {
            var content = unit.content;
            target = new PickChildrenUnit(content.name);
        }
        else {
            throw new TypeError("Unrecognizable analyzer unit type: " + unit.type);
        }
        result = target.parse(result);
    });
    return result;
}
exports.pick = pick;
function findArrayBoundary(boundary) {
    var startPoint = 0;
    var endPoint = 0;
    if (_.startsWith(boundary, '[')) {
        if (!_.endsWith(boundary, ']'))
            throw "Invalid syntax: " + boundary + " has \"[\" but no \"]\"";
        boundary = boundary.substring(1, boundary.length - 1);
    }
    if (boundary.indexOf(':') > -1) {
        startPoint = eval(boundary.substring(0, boundary.indexOf(':')));
        endPoint = eval(boundary.substring(boundary.indexOf(':') + 1));
    }
    else
        startPoint = endPoint = eval(boundary);
    return { from: startPoint, to: endPoint };
}
var SliceUnit = /** @class */ (function () {
    function SliceUnit(from, to) {
        this.from = from;
        this.to = to;
    }
    SliceUnit.prototype.parse = function (input) {
        if (!(input instanceof Array) && (typeof input != 'string'))
            return undefined;
        if (input instanceof Array) {
            var result = this.sliceArray(input);
            if (result.length == 1)
                return result[0];
            else
                return result;
        }
        else
            return this.sliceString(input);
    };
    SliceUnit.prototype.sliceArray = function (input) {
        var result = [];
        var i = this.from;
        while (true) {
            result.push(i >= 0 ? input[i] : input[input.length + i]);
            i += this.from < this.to ? 1 : -1;
            if (this.from < this.to && i > this.to)
                break;
            if (this.from > this.to && i < this.to)
                break;
            if (this.from == this.to)
                break;
        }
        return result;
    };
    SliceUnit.prototype.sliceString = function (input) {
        var result = '';
        var i = this.from;
        while (true) {
            result += i >= 0 ? input[i] : input[input.length + i];
            i += this.from < this.to ? 1 : -1;
            if (this.from < this.to && i > this.to)
                break;
            if (this.from > this.to && i < this.to)
                break;
            if (this.from == this.to)
                break;
        }
        return result;
    };
    return SliceUnit;
}());
exports.SliceUnit = SliceUnit;
var PickChildrenUnit = /** @class */ (function () {
    function PickChildrenUnit(key) {
        this.key = key;
    }
    PickChildrenUnit.prototype.parse = function (input) {
        var _this = this;
        if (typeof input != 'object')
            return undefined;
        if (input == null)
            return undefined;
        if (input instanceof Array && _.findIndex(input, function (v) { return (typeof v === 'object') && !(v instanceof Array); }) > -1)
            return _.flatten(input.map(function (v) { return _this.pickItem(v); }));
        var result = this.pickItem(input);
        return result.length == 1 ? result[0] : result;
    };
    PickChildrenUnit.prototype.pickItem = function (source) {
        var _this = this;
        var keys = Object.keys(source);
        if (_.startsWith(this.key, 'reg:'))
            return keys.filter(function (k) { return new RegExp(_this.key.substring(4)).test(k); }).map(function (k) { return source[k]; });
        else
            return [source[this.key]];
    };
    return PickChildrenUnit;
}());
exports.PickChildrenUnit = PickChildrenUnit;
//# sourceMappingURL=jsquery.js.map