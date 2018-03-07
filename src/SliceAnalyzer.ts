import { AnalyzerContent } from './AnalyzerContent';

export interface SliceAnalyzer extends AnalyzerContent {
    from: string;
    to: string;
}

export class SliceAnalyzer implements SliceAnalyzer {
    public constructor (from: string, to: string) {
        this.from = from;
        this.to = to;
    }
}
