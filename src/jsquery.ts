import { startsWith, endsWith, flatten, findIndex, filter } from 'lodash';

import { PickChildrenAnalyzer } from './PickChildrenAnalyzer';
import { SliceAnalyzer } from './SliceAnalyzer';
import { AnalyzerUnit } from './AnalyzerUnit';
import { AnalyzerType } from './AnalyzerType';

/**
 * Analyse path
 * @param sourcePath Path in target
 */
export function analyse(sourcePath: string): AnalyzerUnit[] {
    if (sourcePath == null || sourcePath === '' || sourcePath === '/') {
        return [];
    }
    const paths = sourcePath.split('/').reverse();
    if (paths[paths.length - 1] === '') {
        paths.pop();
    }
    let units: AnalyzerUnit[] = [];
    paths.forEach(path => {
        const arraySubpipe: AnalyzerUnit[] = [];
        while (path.indexOf('[') > -1 && path.indexOf('reg:') !== 0) {
            if (!endsWith(path, ']')) {
                throw new TypeError(`Cannot analyse ${path}: Want to understand as array but found invalid characters at EOL`);
            }
            const patterns = /(\S*?)\[([\d\s\S-:><_+*/]+)\]/g.exec(path);
            if (patterns == null) {
                throw new TypeError(`Cannot analyse ${path}: Want to understand as array but found invalid boundary`);
            }
            const boundary = findArrayBoundary(patterns[2]);
            arraySubpipe.push(new AnalyzerUnit(AnalyzerType.Slice, new SliceAnalyzer(boundary.from, boundary.to)));
            path = path.substring(0, path.indexOf('[')) + path.substring(patterns[0].length);
        }
        units = units.concat(arraySubpipe.reverse());
        if (path && path !== '') {
            units.push(new AnalyzerUnit(AnalyzerType.PickChilren, new PickChildrenAnalyzer(path)));
        }
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
        if (unit.type === AnalyzerType.Slice) {
            const content: SliceAnalyzer = unit.content as SliceAnalyzer;
            target = new SliceUnit(content.from, content.to);
        } else if (unit.type === AnalyzerType.PickChilren) {
            const content: PickChildrenAnalyzer = unit.content as PickChildrenAnalyzer;
            target = new PickChildrenUnit(content.name);
        } else {
            throw new TypeError(`Unrecognizable analyzer unit type: ${unit.type}`);
        }
        result = target.parse(result);
    });
    return result;
}

function findArrayBoundary(boundary: string): { from: string, to: string } {
    let startPoint: string = '';
    let endPoint: string = '';
    if (startsWith(boundary, '[')) {
        if (!endsWith(boundary, ']')) {
            throw new TypeError(`Invalid syntax: ${boundary} has "[" but no "]"`);
        }
        boundary = boundary.substring(1, boundary.length - 1);
    }
    if (boundary.indexOf('->') > -1) {
        startPoint = boundary.substring(0, boundary.indexOf('->'));
        endPoint = boundary.substring(boundary.indexOf('->') + 2);
    } else if (boundary.indexOf('<-') > -1) {
        startPoint = boundary.substring(boundary.indexOf('->') + 2);
        endPoint = boundary.substring(0, boundary.indexOf('->'));
    } else {
        startPoint = endPoint = boundary;
    }
    return { from: startPoint, to: endPoint };
}

export interface AnalysePipe {
    parse(input: any): any;
}

export class SliceUnit implements AnalysePipe {
    public constructor(private from: string, private to: string) { }

    public parse(input: any): any {
        if (!(input instanceof Array) && (typeof input !== 'string')) {
            return undefined;
        }
        if (input instanceof Array) {
            const result = this.sliceArray(input);
            if (result.length === 1) {
                return result[0];
            } else {
                return result;
            }
        } else {
            return this.sliceString(input);
        }
    }

    private sliceArray(input: any[]): any[] {
        const result: any[] = [];
        const last = input.length - 1;
        const fromIndex = eval(this.from);
        const toIndex = eval(this.to);
        let i = fromIndex;
        while (true) {
            result.push(i >= 0 ? input[i] : input[input.length + i]);
            i += fromIndex < toIndex ? 1 : -1;
            if ((fromIndex < toIndex && i > toIndex) || (fromIndex > toIndex && i < toIndex) || (fromIndex === toIndex)) {
                break;
            }
        }
        return result;
    }

    private sliceString(input: string): string {
        let result: string = '';
        const last = input.length - 1;
        const fromIndex = eval(this.from);
        const toIndex = eval(this.to);
        let i = fromIndex;
        while (true) {
            result += i >= 0 ? input[i] : input[input.length + i];
            i += this.from < this.to ? 1 : -1;
            if ((fromIndex < toIndex && i > toIndex) || (fromIndex > toIndex && i < toIndex) || (fromIndex === toIndex)) {
                break;
            }
        }
        return result;
    }
}

export class PickChildrenUnit implements AnalysePipe {
    public constructor(private key: string) { }

    public parse(input: any): any {
        if (typeof input !== 'object' || input == null) {
            return undefined;
        }
        if (input instanceof Array && findIndex(input, (v: any) => (typeof v === 'object') && !(v instanceof Array)) > -1) {
            return flatten(input.map(v => this.pickItem(v)));
        }
        const result = this.pickItem(input);
        return result.length === 1 ? result[0] : result;
    }

    private pickItem(source: object): any[] {
        const keys = Object.keys(source);
        return startsWith(this.key, 'reg:')
            ? filter(keys, k => new RegExp(this.key.substring(4)).test(k)).map(k => (source as any)[k])
            : [(source as any)[this.key]];
    }
}
