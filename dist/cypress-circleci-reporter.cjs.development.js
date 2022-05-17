'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var xmlbuilder2 = require('xmlbuilder2');
var Mocha = require('mocha');
var Mocha__default = _interopDefault(Mocha);
var createStatsCollector = _interopDefault(require('mocha/lib/stats-collector'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var crypto = _interopDefault(require('crypto'));
var stripAnsi = _interopDefault(require('strip-ansi'));

const {
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN
} = Mocha.Runner.constants; // A subset of invalid characters as defined in http://www.w3.org/TR/xml/#charsets that can occur in e.g. stacktraces
// regex lifted from https://github.com/MylesBorins/xml-sanitizer/ (licensed MIT)

const INVALID_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007f-\u0084\u0086-\u009f\uD800-\uDFFF\uFDD0-\uFDFF\uFFFF\uC008]/g; // eslint-disable-line no-control-regex, max-len

function removeInvalidCharacters(input) {
  return input ? input.replace(INVALID_CHARACTERS_REGEX, '') : input;
}

function getClassname(test) {
  let {
    parent
  } = test;
  const titles = [];

  while (parent) {
    if (parent.title) {
      titles.unshift(parent.title);
    }

    parent = parent.parent;
  }

  return titles.join('.');
}

class CypressCircleCIReporter extends Mocha__default.reporters.Base {
  constructor(runner, options) {
    var _options$reporterOpti, _options$reporterOpti2, _options$reporterOpti3;

    super(runner, options);
    this.file = '';

    this.getTestcaseAttributes = test => {
      return {
        name: stripAnsi(test.title),
        file: this.file,
        time: typeof test.duration === 'undefined' ? 0 : (test.duration / 1000).toFixed(4),
        classname: stripAnsi(getClassname(test)),
        line_number: JSON.parse(test.inspect()).invocationDetails.line
      };
    };

    createStatsCollector(runner);
    const projectPath = options == null ? void 0 : (_options$reporterOpti = options.reporterOptions) == null ? void 0 : _options$reporterOpti.project;
    const resultsDir = (options == null ? void 0 : (_options$reporterOpti2 = options.reporterOptions) == null ? void 0 : _options$reporterOpti2.resultsDir) || './test_results/cypress';
    const resultFileName = (options == null ? void 0 : (_options$reporterOpti3 = options.reporterOptions) == null ? void 0 : _options$reporterOpti3.resultFileName) || 'cypress-[hash]';

    if (resultFileName.indexOf('[hash]') < 0) {
      throw new Error(`resultFileName must contain '[hash]'`);
    }

    const resultFilePath = path.join(resultsDir, `${resultFileName}.xml`);
    const root = xmlbuilder2.create({
      version: '1.0',
      encoding: 'UTF-8'
    }).ele('testsuite', {
      name: 'cypress',
      timestamp: new Date().toISOString().slice(0, -5)
    });
    runner.on(EVENT_SUITE_BEGIN, suite => {
      if (suite.file) {
        this.file = path.join(projectPath || '', suite.file);
      }
    });
    runner.on(EVENT_TEST_PASS, test => {
      root.ele('testcase', this.getTestcaseAttributes(test));
    });
    runner.on(EVENT_TEST_FAIL, (test, err) => {
      let message = '';

      if (err.message && typeof err.message.toString === 'function') {
        message = String(err.message);
      } else if (typeof err.inspect === 'function') {
        message = String(err.inspect());
      }

      const failureMessage = err.stack || message;
      root.ele('testcase', this.getTestcaseAttributes(test)).ele('failure', {
        message: removeInvalidCharacters(message) || '',
        type: err.name || ''
      }).ele({
        $: removeInvalidCharacters(failureMessage)
      });
    });
    runner.on(EVENT_RUN_END, () => {
      var _runner$stats, _runner$stats2, _runner$stats3, _runner$stats4;

      root.att('time', ((((_runner$stats = runner.stats) == null ? void 0 : _runner$stats.duration) || 0) / 1000).toFixed(4));
      root.att('tests', String(((_runner$stats2 = runner.stats) == null ? void 0 : _runner$stats2.tests) || 0));
      root.att('failures', String(((_runner$stats3 = runner.stats) == null ? void 0 : _runner$stats3.failures) || 0));
      root.att('skipped', String(((_runner$stats4 = runner.stats) == null ? void 0 : _runner$stats4.pending) || 0));
      const xmlText = root.end({
        prettyPrint: true
      }).toString();
      const finalPath = resultFilePath.replace('[hash]', crypto.createHash('md5').update(xmlText).digest('hex'));
      const finalPathDir = path.dirname(finalPath);

      if (!fs.existsSync(finalPathDir)) {
        fs.mkdirSync(finalPathDir, {
          recursive: true
        });
      }

      fs.writeFileSync(finalPath, xmlText, 'utf-8');
    });
  }

}
module.exports = CypressCircleCIReporter;

exports.default = CypressCircleCIReporter;
//# sourceMappingURL=cypress-circleci-reporter.cjs.development.js.map
