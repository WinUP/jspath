import { AnalyzerContent } from './AnalyzerContent';

export interface PickChildrenAnalyzer extends AnalyzerContent {
    name: string;
}

export class PickChildrenAnalyzer implements PickChildrenAnalyzer {
    public constructor (name: string) {
        this.name = name;
    }
}
