"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
function analyse(source, url) {
    if (url == null || url == undefined || url == '' || url == '/')
        return source;
    var paths = url.split('/').reverse();
    if (paths[paths.length - 1] == '')
        paths.pop();
    var pipe = [];
    paths.forEach(function (path) {
        if (typeof source != 'object' && (path != null && path != '' && path != undefined && path != '/'))
            throw "Cannot analyse " + path + ": Source is not object or array but want to use inner path";
        else {
            if (_.startsWith(path, '!')) {
                path = path.substring(1);
                pipe.push(new ReverseAnalysePipe());
            }
            var arraySubpipe = [];
            while (path.indexOf('[') > -1) {
                if (!_.endsWith(path, ']'))
                    throw "Cannot analyse " + path + ": Want to understand as array but found invalid characters at EOL";
                var patterns = /(\S*?)\[([\d-:]+)\]/g.exec(path);
                if (patterns == null)
                    throw "Cannot analyse " + path + ": Want to understand as array but found invalid boundary";
                var boundary = findArrayBoundary(patterns[2]);
                arraySubpipe.push(new ArrayAnalysePipe(boundary.from, boundary.to));
                path = path.substring(0, path.indexOf('[')) + path.substring(patterns[0].length);
            }
            pipe = pipe.concat(arraySubpipe.reverse());
            if (path && path != '')
                pipe.push(new ChildAnalysePipe(path));
        }
    });
    var result = source;
    while (pipe.length > 0) {
        var target = pipe.pop();
        result = target.parse(result);
    }
    return result;
}
exports.analyse = analyse;
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
var ArrayAnalysePipe = /** @class */ (function () {
    function ArrayAnalysePipe(from, to) {
        this.from = from;
        this.to = to;
    }
    ArrayAnalysePipe.prototype.parse = function (input) {
        if (!(input instanceof Array) && (typeof input != 'string'))
            throw "Cannot execute array analyse pipe: Input is not array or string";
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
    ArrayAnalysePipe.prototype.sliceArray = function (input) {
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
    ArrayAnalysePipe.prototype.sliceString = function (input) {
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
    return ArrayAnalysePipe;
}());
var ReverseAnalysePipe = /** @class */ (function () {
    function ReverseAnalysePipe() {
    }
    ReverseAnalysePipe.prototype.parse = function (input) {
        if (input instanceof Array)
            return this.reverseArray(input);
        if (typeof input == 'boolean')
            return !input;
        throw "Cannot execute reverse pipe: " + typeof input + " is not boolean or array and cannot be reversed";
    };
    ReverseAnalysePipe.prototype.reverseArray = function (input) {
        var _this = this;
        return input.map(function (v) {
            if (v instanceof Array)
                return _this.reverseArray(v);
            else if (typeof v == 'boolean')
                return !v;
            throw "Cannot execute reverse pipe: " + typeof v + " is not boolean or array and cannot be reversed";
        });
    };
    return ReverseAnalysePipe;
}());
var ChildAnalysePipe = /** @class */ (function () {
    function ChildAnalysePipe(key) {
        this.key = key;
    }
    ChildAnalysePipe.prototype.parse = function (input) {
        var _this = this;
        if (typeof input != 'object')
            throw "Cannot execute child pipe: Input is not object or array";
        if (input == null)
            throw "Cannot execute child pipe: Input is null";
        if (input instanceof Array && _.findIndex(input, function (v) { return (v instanceof Object) && !(v instanceof Array); }) > -1)
            return _.flatten(input.map(function (v) { return _this.pickItem(v); }));
        var result = this.pickItem(input);
        return result.length == 1 ? result[0] : result;
    };
    ChildAnalysePipe.prototype.pickItem = function (source) {
        var _this = this;
        var keys = Object.keys(source);
        if (_.startsWith(this.key, 'reg:'))
            return keys.filter(function (k) { return new RegExp(_this.key.substring(4)).test(k); }).map(function (k) { return source[k]; });
        else
            return [source[this.key]];
    };
    return ChildAnalysePipe;
}());
//# sourceMappingURL=jsquery.js.map