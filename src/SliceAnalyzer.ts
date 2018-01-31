import { AnalyzerContent } from "./AnalyzerContent";

export interface SliceAnalyzer extends AnalyzerContent {
    from: number;
    to: number;
}

export class SliceAnalyzer implements SliceAnalyzer {
    public constructor (from: number, to: number) {
        this.from = from;
        this.to = to;
    }
}
