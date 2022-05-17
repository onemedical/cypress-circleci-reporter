import Mocha, { Runner, MochaOptions } from 'mocha';
declare class CypressCircleCIReporter extends Mocha.reporters.Base {
    file: string;
    constructor(runner: Runner, options?: MochaOptions);
    private getTestcaseAttributes;
}
export default CypressCircleCIReporter;
