"use strict";
/**
 * EMT Module Checkers - экспорт всех чекеров для EMT модуля
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMT_CHECKERS = exports.EMTDependenciesChecker = exports.EMTConfigChecker = exports.EMTRoutesChecker = void 0;
const routes_checker_js_1 = require("./routes.checker.js");
const config_checker_js_1 = require("./config.checker.js");
const dependencies_checker_js_1 = require("./dependencies.checker.js");
var routes_checker_js_2 = require("./routes.checker.js");
Object.defineProperty(exports, "EMTRoutesChecker", { enumerable: true, get: function () { return routes_checker_js_2.EMTRoutesChecker; } });
var config_checker_js_2 = require("./config.checker.js");
Object.defineProperty(exports, "EMTConfigChecker", { enumerable: true, get: function () { return config_checker_js_2.EMTConfigChecker; } });
var dependencies_checker_js_2 = require("./dependencies.checker.js");
Object.defineProperty(exports, "EMTDependenciesChecker", { enumerable: true, get: function () { return dependencies_checker_js_2.EMTDependenciesChecker; } });
// Массив всех EMT чекеров для удобного импорта
exports.EMT_CHECKERS = [routes_checker_js_1.EMTRoutesChecker, config_checker_js_1.EMTConfigChecker, dependencies_checker_js_1.EMTDependenciesChecker];
//# sourceMappingURL=index.js.map