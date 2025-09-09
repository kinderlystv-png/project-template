"use strict";
/**
 * Modules - экспорт всех модулей EAP Analyzer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_MODULE_CHECKERS = exports.ALL_ANALYZERS = exports.ALL_MODULES = exports.DOCKER_CHECKERS = exports.DockerOptimizationChecker = exports.DockerSecurityChecker = exports.DockerModule = exports.DockerAnalyzer = exports.EMT_CHECKERS = exports.EMTDependenciesChecker = exports.EMTConfigChecker = exports.EMTRoutesChecker = exports.EMTModule = exports.EMTAnalyzer = void 0;
const index_js_1 = require("./emt/index.js");
const index_js_2 = require("./docker/index.js");
// EMT Module
var index_js_3 = require("./emt/index.js");
Object.defineProperty(exports, "EMTAnalyzer", { enumerable: true, get: function () { return index_js_3.EMTAnalyzer; } });
Object.defineProperty(exports, "EMTModule", { enumerable: true, get: function () { return index_js_3.EMTModule; } });
Object.defineProperty(exports, "EMTRoutesChecker", { enumerable: true, get: function () { return index_js_3.EMTRoutesChecker; } });
Object.defineProperty(exports, "EMTConfigChecker", { enumerable: true, get: function () { return index_js_3.EMTConfigChecker; } });
Object.defineProperty(exports, "EMTDependenciesChecker", { enumerable: true, get: function () { return index_js_3.EMTDependenciesChecker; } });
Object.defineProperty(exports, "EMT_CHECKERS", { enumerable: true, get: function () { return index_js_3.EMT_CHECKERS; } });
// Docker Module
var index_js_4 = require("./docker/index.js");
Object.defineProperty(exports, "DockerAnalyzer", { enumerable: true, get: function () { return index_js_4.DockerAnalyzer; } });
Object.defineProperty(exports, "DockerModule", { enumerable: true, get: function () { return index_js_4.DockerModule; } });
Object.defineProperty(exports, "DockerSecurityChecker", { enumerable: true, get: function () { return index_js_4.DockerSecurityChecker; } });
Object.defineProperty(exports, "DockerOptimizationChecker", { enumerable: true, get: function () { return index_js_4.DockerOptimizationChecker; } });
Object.defineProperty(exports, "DOCKER_CHECKERS", { enumerable: true, get: function () { return index_js_4.DOCKER_CHECKERS; } });
// Все модули для удобного импорта
exports.ALL_MODULES = {
    emt: index_js_1.EMTModule,
    docker: index_js_2.DockerModule,
};
// Все анализаторы
const index_js_5 = require("./emt/index.js");
const index_js_6 = require("./docker/index.js");
exports.ALL_ANALYZERS = [index_js_5.EMTAnalyzer, index_js_6.DockerAnalyzer];
// Все чекеры из модулей
const index_js_7 = require("./emt/index.js");
const index_js_8 = require("./docker/index.js");
exports.ALL_MODULE_CHECKERS = [...index_js_7.EMT_CHECKERS, ...index_js_8.DOCKER_CHECKERS];
//# sourceMappingURL=index.js.map