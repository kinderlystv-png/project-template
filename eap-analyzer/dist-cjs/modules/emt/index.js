"use strict";
/**
 * EMT Module - полный модуль для анализа EMT Framework проектов
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMTModule = exports.EMT_CHECKERS = exports.EMTDependenciesChecker = exports.EMTConfigChecker = exports.EMTRoutesChecker = exports.EMTAnalyzer = void 0;
const analyzer_js_1 = require("./analyzer.js");
const index_js_1 = require("./checkers/index.js");
var analyzer_js_2 = require("./analyzer.js");
Object.defineProperty(exports, "EMTAnalyzer", { enumerable: true, get: function () { return analyzer_js_2.EMTAnalyzer; } });
var index_js_2 = require("./checkers/index.js");
Object.defineProperty(exports, "EMTRoutesChecker", { enumerable: true, get: function () { return index_js_2.EMTRoutesChecker; } });
Object.defineProperty(exports, "EMTConfigChecker", { enumerable: true, get: function () { return index_js_2.EMTConfigChecker; } });
Object.defineProperty(exports, "EMTDependenciesChecker", { enumerable: true, get: function () { return index_js_2.EMTDependenciesChecker; } });
Object.defineProperty(exports, "EMT_CHECKERS", { enumerable: true, get: function () { return index_js_2.EMT_CHECKERS; } });
// Основной экспорт модуля
exports.EMTModule = {
    analyzer: analyzer_js_1.EMTAnalyzer,
    checkers: index_js_1.EMT_CHECKERS,
    name: 'EMT Framework Module',
    version: '3.2.0',
};
//# sourceMappingURL=index.js.map