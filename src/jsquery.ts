import * as _ from 'lodash';

import { PickChildrenAnalyzer } from './PickChildrenAnalyzer';
import { SliceAnalyzer } from './SliceAnalyzer';
import { AnalyzerUnit } from './AnalyzerUnit';
import { AnalyzerType } from './AnalyzerType';

/**
 * Analyse path
 * @param sourcePath Path in target
 */
export function analyse(sourcePath: string): AnalyzerUnit[] {
    if (sourcePath == null || sourcePath == undefined || sourcePath == '' || sourcePath == '/')
        return [];
    let paths = sourcePath.split('/').reverse();
    if (paths[paths.length - 1] == '') paths.pop();
    let units: AnalyzerUnit[] = [];
    paths.forEach(path => {
        let arraySubpipe: AnalyzerUnit[] = [];
        while (path.indexOf('[') > -1 && path.indexOf('reg:') != 0) {
            if (!_.endsWith(path, ']'))
                throw TypeError(`Cannot analyse ${path}: Want to understand as array but found invalid characters at EOL`);
            let patterns = /(\S*?)\[([\d-:]+)\]/g.exec(path);
            if (patterns == null)
                throw `Cannot analyse ${path}: Want to understand as array but found invalid boundary`;
            let boundary = findArrayBoundary(patterns[2]);
            arraySubpipe.push(new AnalyzerUnit(AnalyzerType.Slice, new SliceAnalyzer(boundary.from, boundary.to)));
            path = path.substring(0, path.indexOf('[')) + path.substring(patterns[0].length);
        }
        units = units.concat(arraySubpipe.reverse());
        if (path && path != '')
            units.push(new AnalyzerUnit(AnalyzerType.PickChilren, new PickChildrenAnalyzer(path)));
    });
    return units.reverse();
}

/**
 * Pick item from target
 * @param source Target
 * @param units Path analysing result
 */
export function pick<T = any, U = any>(source: T, units: AnalyzerUnit[]): U {
    let result: U = source as any;
    units.forEach(unit => {
        let target: AnalysePipe;
        if (unit.type == AnalyzerType.Slice) {
            let content: SliceAnalyzer = unit.content as SliceAnalyzer;
            target = new SliceUnit(content.from, content.to);
        } else if (unit.type == AnalyzerType.PickChilren) {
            let content: PickChildrenAnalyzer = unit.content as PickChildrenAnalyzer;
            target = new PickChildrenUnit(content.name);
        } else {
            throw new TypeError(`Unrecognizable analyzer unit type: ${unit.type}`);
        }
        result = target.parse(result);
    });
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

export interface AnalysePipe {
    parse(input: any): any;
}

export class SliceUnit implements AnalysePipe {
    public constructor(private from: number, private to: number) { }

    public parse(input: any): any {
        if (!(input instanceof Array) && (typeof input != 'string'))
            return undefined;
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

export class PickChildrenUnit implements AnalysePipe {
    public constructor(private key: string) { }

    public parse(input: any): any {
        if (typeof input != 'object')
            return undefined;
        if (input == null)
            return undefined;
        if (input instanceof Array && _.findIndex(input, (v: any) => (typeof v === 'object') && !(v instanceof Array)) > -1)
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
