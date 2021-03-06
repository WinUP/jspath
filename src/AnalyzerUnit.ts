import { AnalyzerContent } from './AnalyzerContent';
import { AnalyzerType } from './AnalyzerType';

export interface AnalyzerUnit {
    type: AnalyzerType;
    content: AnalyzerContent;
}

export class AnalyzerUnit implements AnalyzerUnit {
    public constructor(type: AnalyzerType, content: AnalyzerContent) {
        this.type = type;
        this.content = content;
    }
}
