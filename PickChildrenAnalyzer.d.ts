import { AnalyzerContent } from "./AnalyzerContent";
export interface PickChildrenAnalyzer extends AnalyzerContent {
    name: string;
}
export declare class PickChildrenAnalyzer implements PickChildrenAnalyzer {
    constructor(name: string);
}