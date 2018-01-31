import { AnalyzerContent } from "./AnalyzerContent";
export interface SliceAnalyzer extends AnalyzerContent {
    from: number;
    to: number;
}
export declare class SliceAnalyzer implements SliceAnalyzer {
    constructor(from: number, to: number);
}