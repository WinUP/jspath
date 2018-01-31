import { AnalyzerUnit } from './AnalyzerUnit';
/**
 * Analyse path
 * @param sourcePath Path in target
 */
export declare function analyse(sourcePath: string): AnalyzerUnit[];
/**
 * Pick item from target
 * @param source Target
 * @param units Path analysing result
 */
export declare function pick<T = any, U = any>(source: T, units: AnalyzerUnit[]): U;
export interface AnalysePipe {
    parse(input: any): any;
}
export declare class SliceUnit implements AnalysePipe {
    private from;
    private to;
    constructor(from: number, to: number);
    parse(input: any): any;
    private sliceArray(input);
    private sliceString(input);
}
export declare class PickChildrenUnit implements AnalysePipe {
    private key;
    constructor(key: string);
    parse(input: any): any;
    private pickItem(source);
}
