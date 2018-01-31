import { AnalyzerContent } from "./AnalyzerContent";
import { AnalyzerType } from "./AnalyzerType";
export interface AnalyzerUnit {
    type: AnalyzerType;
    content: AnalyzerContent;
}
export declare class AnalyzerUnit implements AnalyzerUnit {
    constructor(type: AnalyzerType, content: AnalyzerContent);
}