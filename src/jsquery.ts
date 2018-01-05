import * as _ from 'lodash';

export function analyse<T = any>(source: any, url: string): T {
    if (url == null || url == undefined || url == '' || url == '/')
        return source;
    let paths = url.split('/').reverse();
    if (paths[paths.length - 1] == '') paths.pop();
    let pipe: AnalysePipe[] = [];
    paths.forEach(path => {
        if (typeof source != 'object' && (path != null && path != '' && path != undefined && path != '/'))
            throw `Cannot analyse ${path}: Source is not object or array but want to use inner path`;
        else {
            if (_.startsWith(path, '!')) {
                path = path.substring(1);
                pipe.push(new ReverseAnalysePipe());
            }
            let arraySubpipe: AnalysePipe[] = [];
            while (path.indexOf('[') > -1) {
                if (!_.endsWith(path, ']'))
                    throw `Cannot analyse ${path}: Want to understand as array but found invalid characters at EOL`;
                let patterns = /(\S*?)\[([\d-:]+)\]/g.exec(path);
                if (patterns == null)
                    throw `Cannot analyse ${path}: Want to understand as array but found invalid boundary`;
                let boundary = findArrayBoundary(patterns[2]);
                arraySubpipe.push(new ArrayAnalysePipe(boundary.from, boundary.to));
                path = path.substring(0, path.indexOf('[')) + path.substring(patterns[0].length);
            }
            pipe = pipe.concat(arraySubpipe.reverse());
            if (path && path != '')
                pipe.push(new ChildAnalysePipe(path));
        }
    });
    let result = source;
    while (pipe.length > 0) {
        let target = pipe.pop() as AnalysePipe;
        result = target.parse(result);
    }
    return result;
}

function findArrayBoundary(boundary: string): { from: number, to: number } {
    let startPoint: number = 0;
    let endPoint: number = 0;
    if (_.startsWith(boundary, '[')) {
        if (!_.endsWith(boundary, ']'))
            throw `Invalid syntax: ${boundary} has "[" but no "]"`;
        boundary = boundary.substring(1, boundary.length - 1);
    }
    if (boundary.indexOf(':') > -1) {
        startPoint = eval(boundary.substring(0, boundary.indexOf(':')));
        endPoint = eval(boundary.substring(boundary.indexOf(':') + 1));
    } else
        startPoint = endPoint = eval(boundary);
    return { from: startPoint, to: endPoint };
}

interface AnalysePipe {
    parse(input: any): any;
}

class ArrayAnalysePipe implements AnalysePipe {
    public constructor(private from: number, private to: number) { }

    public parse(input: any): any {
        if (!(input instanceof Array) && (typeof input != 'string'))
            throw `Cannot execute array analyse pipe: Input is not array or string`;
        if (input instanceof Array) {
            let result = this.sliceArray(input);
            if (result.length == 1)
                return result[0];
            else
                return result;
        } else
            return this.sliceString(input);
    }

    private sliceArray(input: any[]): any[] {
        let result: any[] = [];
        let i = this.from;
        while (true) {
            result.push(i >= 0 ? input[i] : input[input.length + i]);
            i += this.from < this.to ? 1 : -1;
            if (this.from < this.to && i > this.to) break;
            if (this.from > this.to && i < this.to) break;
            if (this.from == this.to) break;
        }
        return result;
    }

    private sliceString(input: string): string {
        let result: string = '';
        let i = this.from;
        while (true) {
            result += i >= 0 ? input[i] : input[input.length + i];
            i += this.from < this.to ? 1 : -1;
            if (this.from < this.to && i > this.to) break;
            if (this.from > this.to && i < this.to) break;
            if (this.from == this.to) break;
        }
        return result;
    }
}

class ReverseAnalysePipe implements AnalysePipe {
    public parse(input: any): any {
        if (input instanceof Array)
           return this.reverseArray(input);
        if (typeof input == 'boolean')
            return !input;
        throw `Cannot execute reverse pipe: ${typeof input} is not boolean or array and cannot be reversed`;
    }

    private reverseArray(input: Array<any>): Array<any> {
        return input.map(v => {
            if (v instanceof Array)
                return this.reverseArray(v);
            else if (typeof v == 'boolean')
                return !v;
            throw `Cannot execute reverse pipe: ${typeof v} is not boolean or array and cannot be reversed`;
        });
    }
}

class ChildAnalysePipe implements AnalysePipe {
    public constructor(private key: string) { }

    public parse(input: any): any {
        if (typeof input != 'object')
            throw `Cannot execute child pipe: Input is not object or array`;
        if (input == null)
            throw `Cannot execute child pipe: Input is null`;
        if (input instanceof Array && _.findIndex(input, (v: any) => (v instanceof Object) && !(v instanceof Array)) > -1)
            return _.flatten(input.map(v => this.pickItem(v)));
        let result = this.pickItem(input);
        return result.length == 1 ? result[0] : result;
    }

    private pickItem(source: object): any[] {
        let keys = Object.keys(source);
        if (_.startsWith(this.key, 'reg:'))
            return keys.filter(k => new RegExp(this.key.substring(4)).test(k)).map(k => (source as any)[k]);
        else
            return [(source as any)[this.key]];
    }
}
