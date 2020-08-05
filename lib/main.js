"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const core_1 = require("@actions/core");
const tool_cache_1 = require("@actions/tool-cache");
const io_1 = require("@actions/io");
const io_util_1 = require("@actions/io/lib/io-util");
const exec_1 = require("@actions/exec");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const onePasswordVersion = core_1.getInput('version');
        const platform = os_1.default.platform().toLowerCase();
        const onePasswordUrl = `https://cache.agilebits.com/dist/1P/op/pkg/v${onePasswordVersion}/op_${platform}_amd64_v${onePasswordVersion}.zip`;
        const destination = `${process.env.HOME}/bin`;
        const options = {};
        options.listeners = {
            stdout: (data) => {
                const sessionToken = data.toString().trim();
                exec_1.exec(sessionToken);
            },
            stderr: (data) => {
                core_1.setFailed(data.toString());
            },
        };
        try {
            const path = yield tool_cache_1.downloadTool(onePasswordUrl);
            const extracted = yield tool_cache_1.extractZip(path);
            yield io_1.mv(`${extracted}/op`, `${destination}/op`);
            yield io_util_1.chmod(`${destination}/op`, '+x');
            core_1.addPath(destination);
            const authCmd = `echo "${core_1.getInput('password')}" - op signin`;
            yield exec_1.exec(authCmd, [core_1.getInput('url'), core_1.getInput('email'), core_1.getInput('secret')], options);
            yield exec_1.exec('op', ['list', 'vault']);
        }
        catch (error) {
            core_1.setFailed(error.message);
        }
    });
}
run();
