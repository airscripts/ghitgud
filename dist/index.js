#!/usr/bin/env node
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
//#endregion
let process$1 = require("process");
process$1 = __toESM(process$1);
let commander = require("commander");
let figlet = require("figlet");
figlet = __toESM(figlet);
let consola = require("consola");
let child_process = require("child_process");
let path = require("path");
path = __toESM(path);
let fs = require("fs");
fs = __toESM(fs);
let os = require("os");
os = __toESM(os);
//#region src/cli/ascii.ts
var ascii = figlet.default.textSync("Ghitgud", {
	font: "Standard",
	width: 80,
	verticalLayout: "default",
	whitespaceBreak: true,
	horizontalLayout: "default"
});
//#endregion
//#region src/core/logger.ts
var logger = (0, consola.createConsola)({ defaults: { tag: "ghitgud" } });
//#endregion
//#region src/commands/gh.ts
var register$6 = (program) => {
	program.command("gh").description("Pass through to the gh CLI. Usage: ghitgud gh <args>").allowUnknownOption().action((_opts, command) => {
		const args = command.args;
		const child = (0, child_process.spawn)("gh", args, {
			stdio: "inherit",
			shell: false
		});
		child.on("error", (error) => {
			if (error.code === "ENOENT") {
				logger.error("gh CLI is not installed. Install it from https://cli.github.com.");
				process$1.default.exit(1);
			}
			logger.error(String(error));
			process$1.default.exit(1);
		});
		child.on("exit", (code) => {
			process$1.default.exitCode = code ?? 0;
		});
	});
};
var gh_default = { register: register$6 };
//#endregion
//#region src/core/constants.ts
var GHITGUD_FOLDER = path.default.join(os.default.homedir(), ".config", "ghitgud");
var CREDENTIALS_FILE = "credentials.json";
var METADATA_FILE = "labels.json";
var ENCODING = "utf8";
var CREDENTIALS_PATH = path.default.join(GHITGUD_FOLDER, CREDENTIALS_FILE);
var METADATA_FILE_PATH = path.default.join(GHITGUD_FOLDER, METADATA_FILE);
var TEMPLATES_DIR = path.default.join(__dirname, "templates");
var GITHUB_API_VERSION = "2022-11-28";
var GITHUB_API_BASE_URL = "https://api.github.com";
var GITHUB_API_ACCEPT = "application/vnd.github+json";
var ERROR_UNAUTHORIZED = "Unauthorized.";
var ERROR_NOT_FOUND = "Resource not found.";
var ERROR_UNPROCESSABLE = "Content is unprocessable.";
var ERROR_UNEXPECTED = "Unexpected status code.";
var ERROR_NO_REPO = "Repository not configured. Set it with: ghitgud config set repo owner/repo.";
var ERROR_NO_TOKEN = "Token not configured. Set it with: ghitgud config set token <your-token>.";
var ERROR_UNSUPPORTED_KEY = "Trying to set unsupported key.";
var ERROR_NO_METADATA = "No metadata file found.";
var PING_RESPONSE = "pong";
var SUPPORTED_CONFIG_KEYS = ["token", "repo"];
//#endregion
//#region src/core/io.ts
var readJsonFile = (filePath) => {
	const data = fs.default.readFileSync(filePath, ENCODING);
	return JSON.parse(data);
};
var writeJsonFile = (filePath, data) => {
	fs.default.writeFileSync(filePath, JSON.stringify(data, null, 2), ENCODING);
};
var fileExists = (filePath) => {
	return fs.default.existsSync(filePath);
};
var ensureDir = (dirPath) => {
	fs.default.mkdirSync(dirPath, { recursive: true });
};
var io_default = {
	readJsonFile,
	writeJsonFile,
	fileExists,
	ensureDir
};
//#endregion
//#region node_modules/.pnpm/dotenv@16.5.0/node_modules/dotenv/package.json
var package_exports = /* @__PURE__ */ __exportAll({
	browser: () => browser,
	default: () => package_default,
	description: () => description,
	devDependencies: () => devDependencies,
	engines: () => engines,
	exports: () => exports$1,
	funding: () => funding,
	homepage: () => homepage,
	keywords: () => keywords,
	license: () => license,
	main: () => main,
	name: () => name,
	readmeFilename: () => readmeFilename,
	repository: () => repository,
	scripts: () => scripts,
	types: () => types,
	version: () => version
});
var name, version, description, main, types, exports$1, scripts, repository, homepage, funding, keywords, readmeFilename, license, devDependencies, engines, browser, package_default;
var init_package = __esmMin((() => {
	name = "dotenv";
	version = "16.5.0";
	description = "Loads environment variables from .env file";
	main = "lib/main.js";
	types = "lib/main.d.ts";
	exports$1 = {
		".": {
			"types": "./lib/main.d.ts",
			"require": "./lib/main.js",
			"default": "./lib/main.js"
		},
		"./config": "./config.js",
		"./config.js": "./config.js",
		"./lib/env-options": "./lib/env-options.js",
		"./lib/env-options.js": "./lib/env-options.js",
		"./lib/cli-options": "./lib/cli-options.js",
		"./lib/cli-options.js": "./lib/cli-options.js",
		"./package.json": "./package.json"
	};
	scripts = {
		"dts-check": "tsc --project tests/types/tsconfig.json",
		"lint": "standard",
		"pretest": "npm run lint && npm run dts-check",
		"test": "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
		"test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=lcov",
		"prerelease": "npm test",
		"release": "standard-version"
	};
	repository = {
		"type": "git",
		"url": "git://github.com/motdotla/dotenv.git"
	};
	homepage = "https://github.com/motdotla/dotenv#readme";
	funding = "https://dotenvx.com";
	keywords = [
		"dotenv",
		"env",
		".env",
		"environment",
		"variables",
		"config",
		"settings"
	];
	readmeFilename = "README.md";
	license = "BSD-2-Clause";
	devDependencies = {
		"@types/node": "^18.11.3",
		"decache": "^4.6.2",
		"sinon": "^14.0.1",
		"standard": "^17.0.0",
		"standard-version": "^9.5.0",
		"tap": "^19.2.0",
		"typescript": "^4.8.4"
	};
	engines = { "node": ">=12" };
	browser = { "fs": false };
	package_default = {
		name,
		version,
		description,
		main,
		types,
		exports: exports$1,
		scripts,
		repository,
		homepage,
		funding,
		keywords,
		readmeFilename,
		license,
		devDependencies,
		engines,
		browser
	};
}));
//#endregion
//#region node_modules/.pnpm/dotenv@16.5.0/node_modules/dotenv/lib/main.js
var require_main = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs$2 = require("fs");
	var path$2 = require("path");
	var os$1 = require("os");
	var crypto = require("crypto");
	var version = (init_package(), __toCommonJS(package_exports).default).version;
	var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
	function parse(src) {
		const obj = {};
		let lines = src.toString();
		lines = lines.replace(/\r\n?/gm, "\n");
		let match;
		while ((match = LINE.exec(lines)) != null) {
			const key = match[1];
			let value = match[2] || "";
			value = value.trim();
			const maybeQuote = value[0];
			value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");
			if (maybeQuote === "\"") {
				value = value.replace(/\\n/g, "\n");
				value = value.replace(/\\r/g, "\r");
			}
			obj[key] = value;
		}
		return obj;
	}
	function _parseVault(options) {
		const vaultPath = _vaultPath(options);
		const result = DotenvModule.configDotenv({ path: vaultPath });
		if (!result.parsed) {
			const err = /* @__PURE__ */ new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
			err.code = "MISSING_DATA";
			throw err;
		}
		const keys = _dotenvKey(options).split(",");
		const length = keys.length;
		let decrypted;
		for (let i = 0; i < length; i++) try {
			const attrs = _instructions(result, keys[i].trim());
			decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
			break;
		} catch (error) {
			if (i + 1 >= length) throw error;
		}
		return DotenvModule.parse(decrypted);
	}
	function _warn(message) {
		console.log(`[dotenv@${version}][WARN] ${message}`);
	}
	function _debug(message) {
		console.log(`[dotenv@${version}][DEBUG] ${message}`);
	}
	function _dotenvKey(options) {
		if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) return options.DOTENV_KEY;
		if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) return process.env.DOTENV_KEY;
		return "";
	}
	function _instructions(result, dotenvKey) {
		let uri;
		try {
			uri = new URL(dotenvKey);
		} catch (error) {
			if (error.code === "ERR_INVALID_URL") {
				const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
				err.code = "INVALID_DOTENV_KEY";
				throw err;
			}
			throw error;
		}
		const key = uri.password;
		if (!key) {
			const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Missing key part");
			err.code = "INVALID_DOTENV_KEY";
			throw err;
		}
		const environment = uri.searchParams.get("environment");
		if (!environment) {
			const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: Missing environment part");
			err.code = "INVALID_DOTENV_KEY";
			throw err;
		}
		const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
		const ciphertext = result.parsed[environmentKey];
		if (!ciphertext) {
			const err = /* @__PURE__ */ new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
			err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
			throw err;
		}
		return {
			ciphertext,
			key
		};
	}
	function _vaultPath(options) {
		let possibleVaultPath = null;
		if (options && options.path && options.path.length > 0) if (Array.isArray(options.path)) {
			for (const filepath of options.path) if (fs$2.existsSync(filepath)) possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
		} else possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
		else possibleVaultPath = path$2.resolve(process.cwd(), ".env.vault");
		if (fs$2.existsSync(possibleVaultPath)) return possibleVaultPath;
		return null;
	}
	function _resolveHome(envPath) {
		return envPath[0] === "~" ? path$2.join(os$1.homedir(), envPath.slice(1)) : envPath;
	}
	function _configVault(options) {
		if (Boolean(options && options.debug)) _debug("Loading env from encrypted .env.vault");
		const parsed = DotenvModule._parseVault(options);
		let processEnv = process.env;
		if (options && options.processEnv != null) processEnv = options.processEnv;
		DotenvModule.populate(processEnv, parsed, options);
		return { parsed };
	}
	function configDotenv(options) {
		const dotenvPath = path$2.resolve(process.cwd(), ".env");
		let encoding = "utf8";
		const debug = Boolean(options && options.debug);
		if (options && options.encoding) encoding = options.encoding;
		else if (debug) _debug("No encoding is specified. UTF-8 is used by default");
		let optionPaths = [dotenvPath];
		if (options && options.path) if (!Array.isArray(options.path)) optionPaths = [_resolveHome(options.path)];
		else {
			optionPaths = [];
			for (const filepath of options.path) optionPaths.push(_resolveHome(filepath));
		}
		let lastError;
		const parsedAll = {};
		for (const path$4 of optionPaths) try {
			const parsed = DotenvModule.parse(fs$2.readFileSync(path$4, { encoding }));
			DotenvModule.populate(parsedAll, parsed, options);
		} catch (e) {
			if (debug) _debug(`Failed to load ${path$4} ${e.message}`);
			lastError = e;
		}
		let processEnv = process.env;
		if (options && options.processEnv != null) processEnv = options.processEnv;
		DotenvModule.populate(processEnv, parsedAll, options);
		if (lastError) return {
			parsed: parsedAll,
			error: lastError
		};
		else return { parsed: parsedAll };
	}
	function config(options) {
		if (_dotenvKey(options).length === 0) return DotenvModule.configDotenv(options);
		const vaultPath = _vaultPath(options);
		if (!vaultPath) {
			_warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
			return DotenvModule.configDotenv(options);
		}
		return DotenvModule._configVault(options);
	}
	function decrypt(encrypted, keyStr) {
		const key = Buffer.from(keyStr.slice(-64), "hex");
		let ciphertext = Buffer.from(encrypted, "base64");
		const nonce = ciphertext.subarray(0, 12);
		const authTag = ciphertext.subarray(-16);
		ciphertext = ciphertext.subarray(12, -16);
		try {
			const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
			aesgcm.setAuthTag(authTag);
			return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
		} catch (error) {
			const isRange = error instanceof RangeError;
			const invalidKeyLength = error.message === "Invalid key length";
			const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
			if (isRange || invalidKeyLength) {
				const err = /* @__PURE__ */ new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
				err.code = "INVALID_DOTENV_KEY";
				throw err;
			} else if (decryptionFailed) {
				const err = /* @__PURE__ */ new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
				err.code = "DECRYPTION_FAILED";
				throw err;
			} else throw error;
		}
	}
	function populate(processEnv, parsed, options = {}) {
		const debug = Boolean(options && options.debug);
		const override = Boolean(options && options.override);
		if (typeof parsed !== "object") {
			const err = /* @__PURE__ */ new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
			err.code = "OBJECT_REQUIRED";
			throw err;
		}
		for (const key of Object.keys(parsed)) if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
			if (override === true) processEnv[key] = parsed[key];
			if (debug) if (override === true) _debug(`"${key}" is already defined and WAS overwritten`);
			else _debug(`"${key}" is already defined and was NOT overwritten`);
		} else processEnv[key] = parsed[key];
	}
	var DotenvModule = {
		configDotenv,
		_configVault,
		_parseVault,
		config,
		decrypt,
		parse,
		populate
	};
	module.exports.configDotenv = DotenvModule.configDotenv;
	module.exports._configVault = DotenvModule._configVault;
	module.exports._parseVault = DotenvModule._parseVault;
	module.exports.config = DotenvModule.config;
	module.exports.decrypt = DotenvModule.decrypt;
	module.exports.parse = DotenvModule.parse;
	module.exports.populate = DotenvModule.populate;
	module.exports = DotenvModule;
}));
//#endregion
//#region node_modules/.pnpm/dotenv@16.5.0/node_modules/dotenv/lib/env-options.js
var require_env_options = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var options = {};
	if (process.env.DOTENV_CONFIG_ENCODING != null) options.encoding = process.env.DOTENV_CONFIG_ENCODING;
	if (process.env.DOTENV_CONFIG_PATH != null) options.path = process.env.DOTENV_CONFIG_PATH;
	if (process.env.DOTENV_CONFIG_DEBUG != null) options.debug = process.env.DOTENV_CONFIG_DEBUG;
	if (process.env.DOTENV_CONFIG_OVERRIDE != null) options.override = process.env.DOTENV_CONFIG_OVERRIDE;
	if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
	module.exports = options;
}));
//#endregion
//#region node_modules/.pnpm/dotenv@16.5.0/node_modules/dotenv/lib/cli-options.js
var require_cli_options = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var re = /^dotenv_config_(encoding|path|debug|override|DOTENV_KEY)=(.+)$/;
	module.exports = function optionMatcher(args) {
		return args.reduce(function(acc, cur) {
			const matches = cur.match(re);
			if (matches) acc[matches[1]] = matches[2];
			return acc;
		}, {});
	};
}));
//#endregion
//#region node_modules/.pnpm/dotenv@16.5.0/node_modules/dotenv/config.js
(function() {
	require_main().config(Object.assign({}, require_env_options(), require_cli_options()(process.argv)));
})();
//#endregion
//#region src/core/errors.ts
var GhitgudError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "GhitgudError";
	}
};
var AuthError = class extends GhitgudError {
	constructor(message) {
		super(message);
		this.name = "AuthError";
	}
};
var ConfigError = class extends GhitgudError {
	constructor(message) {
		super(message);
		this.name = "ConfigError";
	}
};
var NotFoundError = class extends GhitgudError {
	constructor(message) {
		super(message);
		this.name = "NotFoundError";
	}
};
var UnprocessableError = class extends GhitgudError {
	constructor(message) {
		super(message);
		this.name = "UnprocessableError";
	}
};
//#endregion
//#region src/core/config.ts
function readCredentialsFile() {
	if (!fs.default.existsSync(CREDENTIALS_PATH)) return null;
	const data = fs.default.readFileSync(CREDENTIALS_PATH, ENCODING);
	return JSON.parse(data);
}
function resolve(key, envVar) {
	const envValue = process$1.default.env[envVar];
	if (envValue) return envValue;
	const credentials = readCredentialsFile();
	if (credentials && credentials[key]) return credentials[key];
	throw new ConfigError(key === "repo" ? ERROR_NO_REPO : ERROR_NO_TOKEN);
}
function read(key) {
	const credentials = readCredentialsFile();
	if (credentials && credentials[key]) return credentials[key];
	return null;
}
function has(key) {
	if (!!process$1.default.env[key === "repo" ? "GHITGUD_GITHUB_REPO" : "GHITGUD_GITHUB_TOKEN"]) return true;
	return !!readCredentialsFile()?.[key];
}
function write(key, value) {
	let credentials = {};
	if (fs.default.existsSync(CREDENTIALS_PATH)) {
		const data = fs.default.readFileSync(CREDENTIALS_PATH, ENCODING);
		credentials = JSON.parse(data);
	} else fs.default.mkdirSync(GHITGUD_FOLDER, { recursive: true });
	credentials[key] = value;
	fs.default.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2), ENCODING);
}
function getRepo() {
	return resolve("repo", "GHITGUD_GITHUB_REPO");
}
function getToken() {
	return resolve("token", "GHITGUD_GITHUB_TOKEN");
}
var config = {
	getRepo,
	getToken,
	read,
	write,
	has
};
//#endregion
//#region src/api/client.ts
var ERROR_MAP = {
	[401]: AuthError,
	[404]: NotFoundError,
	[422]: UnprocessableError
};
var ERROR_MESSAGES = {
	[401]: ERROR_UNAUTHORIZED,
	[404]: ERROR_NOT_FOUND,
	[422]: ERROR_UNPROCESSABLE
};
function buildHeaders() {
	return {
		Accept: GITHUB_API_ACCEPT,
		Authorization: `Bearer ${config.getToken()}`,
		"X-GitHub-Api-Version": GITHUB_API_VERSION
	};
}
function handleError(status) {
	const ErrorClass = ERROR_MAP[status];
	if (ErrorClass) throw new ErrorClass(ERROR_MESSAGES[status]);
	throw new GhitgudError(`${ERROR_UNEXPECTED}: ${status}`);
}
function isSuccessful(status) {
	return status >= 200 && status <= 299;
}
async function request(endpoint, options = {}) {
	const url = `${GITHUB_API_BASE_URL}${endpoint}`;
	const headers = buildHeaders();
	const fetchOptions = {
		method: options.method || "GET",
		headers
	};
	if (options.body) fetchOptions.body = JSON.stringify(options.body);
	const response = await fetch(url, fetchOptions);
	if (isSuccessful(response.status)) return response;
	handleError(response.status);
}
var client = {
	get: (endpoint) => request(endpoint),
	post: (endpoint, body) => request(endpoint, {
		method: "POST",
		body
	}),
	patch: (endpoint, body) => request(endpoint, {
		method: "PATCH",
		body
	}),
	put: (endpoint, body) => request(endpoint, {
		method: "PUT",
		body
	}),
	getRepo: () => config.getRepo(),
	isOk: (status) => isSuccessful(status),
	isNotFound: (status) => status === 404,
	delete: (endpoint) => request(endpoint, { method: "DELETE" })
};
//#endregion
//#region src/api/labels.ts
var labels = {
	fetch: async () => {
		const repo = client.getRepo();
		return client.get(`/repos/${repo}/labels`);
	},
	get: async (name) => {
		const repo = client.getRepo();
		return client.get(`/repos/${repo}/labels/${name}`);
	},
	create: async (label) => {
		const repo = client.getRepo();
		return client.post(`/repos/${repo}/labels`, {
			name: label.name,
			color: label.color,
			description: label.description
		});
	},
	patch: async (label) => {
		const repo = client.getRepo();
		return client.patch(`/repos/${repo}/labels/${label.name}`, {
			color: label.color,
			description: label.description,
			new_name: label.newName || label.name
		});
	},
	delete: async (name) => {
		const repo = client.getRepo();
		return client.delete(`/repos/${repo}/labels/${name}`);
	}
};
//#endregion
//#region src/types/index.ts
var normalizeLabel = (label) => ({
	name: label.name,
	color: label.color,
	description: label.description
});
//#endregion
//#region src/services/labels.ts
var formatLabels = (labels) => {
	const rows = labels.map((label) => ({
		name: label.name,
		color: label.color,
		description: label.description
	}));
	console.log();
	console.table(rows);
};
var ping = () => {
	logger.success(PING_RESPONSE + ".");
	return {
		success: true,
		message: PING_RESPONSE
	};
};
var list$1 = async () => {
	logger.info("Fetching labels from repository.");
	const labels$1 = (await (await labels.fetch()).json()).map((label) => normalizeLabel(label));
	formatLabels(labels$1);
	return {
		success: true,
		metadata: labels$1
	};
};
var pull = async () => {
	logger.info("Pulling labels from repository.");
	const labels$2 = (await (await labels.fetch()).json()).map((label) => normalizeLabel(label));
	io_default.ensureDir(GHITGUD_FOLDER);
	io_default.writeJsonFile(METADATA_FILE_PATH, labels$2);
	logger.success("Labels pulled successfully.");
	return {
		success: true,
		metadata: labels$2
	};
};
var pullTemplate = async (templateName, templatesDir) => {
	logger.info(`Pulling labels from template "${templateName}".`);
	const templatePath = path.default.join(templatesDir, `${templateName}.json`);
	if (!io_default.fileExists(templatePath)) throw new Error(`Template "${templateName}" not found at ${templatePath}.`);
	const labels = io_default.readJsonFile(templatePath);
	io_default.ensureDir(GHITGUD_FOLDER);
	io_default.writeJsonFile(METADATA_FILE_PATH, labels);
	formatLabels(labels);
	logger.success(`Labels pulled from template "${templateName}".`);
	return {
		success: true,
		metadata: labels
	};
};
var upsertLabels = async (labels$3) => {
	logger.info(`Upserting ${labels$3.length} label(s).`);
	await Promise.all(labels$3.map(async (label) => {
		try {
			await labels.get(label.name);
			await labels.patch(label);
		} catch (error) {
			if (error instanceof NotFoundError) await labels.create(label);
			else throw error;
		}
	}));
};
var push = async () => {
	if (!io_default.fileExists(METADATA_FILE_PATH)) throw new Error(ERROR_NO_METADATA);
	logger.info("Pushing labels to repository.");
	await upsertLabels(io_default.readJsonFile(METADATA_FILE_PATH));
	logger.success("Labels pushed successfully.");
	return { success: true };
};
var pushTemplate = async (templateName, templatesDir) => {
	logger.info(`Pushing labels from template "${templateName}".`);
	const templatePath = path.default.join(templatesDir, `${templateName}.json`);
	if (!io_default.fileExists(templatePath)) throw new Error(`Template "${templateName}" not found at ${templatePath}.`);
	await upsertLabels(io_default.readJsonFile(templatePath));
	logger.success(`Labels pushed from template "${templateName}".`);
	return { success: true };
};
var prune = async () => {
	if (!io_default.fileExists(METADATA_FILE_PATH)) throw new Error(ERROR_NO_METADATA);
	const labels$4 = io_default.readJsonFile(METADATA_FILE_PATH);
	logger.info(`Pruning ${labels$4.length} label(s) from repository.`);
	await Promise.all(labels$4.map(async (label) => {
		await labels.delete(label.name);
	}));
	logger.success("Labels pruned successfully.");
	return { success: true };
};
var labels_default$1 = {
	ping,
	list: list$1,
	pull,
	pullTemplate,
	push,
	pushTemplate,
	prune
};
//#endregion
//#region src/commands/ping.ts
var register$5 = (program) => {
	program.command("ping").description("Check if the CLI is working.").action(() => void labels_default$1.ping());
};
var ping_default = { register: register$5 };
//#endregion
//#region src/commands/labels.ts
var register$4 = (program) => {
	const labels = program.command("labels").description("Manage labels for a repository.");
	labels.command("list").description("List all labels for a repository.").action(() => void labels_default$1.list());
	labels.command("pull").description("Pull all related labels for a repository.").option("-t, --template <name>", "Pull from a built-in template instead of the remote repository").action(async (options) => {
		if (options.template) await labels_default$1.pullTemplate(options.template, TEMPLATES_DIR);
		else await labels_default$1.pull();
	});
	labels.command("push").description("Push all related labels for a repository.").option("-t, --template <name>", "Push from a built-in template instead of the local metadata file").action(async (options) => {
		if (options.template) await labels_default$1.pushTemplate(options.template, TEMPLATES_DIR);
		else await labels_default$1.push();
	});
	labels.command("prune").description("Prune all related labels for a repository.").action(() => void labels_default$1.prune());
};
var labels_default = { register: register$4 };
//#endregion
//#region src/services/config.ts
var validateKey = (key) => {
	if (!SUPPORTED_CONFIG_KEYS.includes(key)) throw new ConfigError(ERROR_UNSUPPORTED_KEY);
	return key;
};
var set = (key, value) => {
	validateKey(key);
	logger.info(`Setting config "${key}".`);
	config.write(key, value);
	logger.success(`Config "${key}" set successfully.`);
	return { success: true };
};
var get = (key) => {
	validateKey(key);
	const value = config.read(key);
	logger.info(`${key}: ${value ?? "(not set)"}.`);
	return {
		success: true,
		key,
		value: value || null
	};
};
var config_default$1 = {
	set,
	get
};
//#endregion
//#region src/commands/config.ts
var register$3 = (program) => {
	const config = program.command("config").description("Set CLI configurations.");
	config.command("set").description("Set configuration.").arguments("<key> <value>").action((key, value) => {
		config_default$1.set(key, value);
	});
	config.command("get").description("Get configuration value.").arguments("<key>").action((key) => {
		config_default$1.get(key);
	});
};
var config_default = { register: register$3 };
//#endregion
//#region src/api/notifications.ts
var BASE_PATH = "/notifications";
var notifications = {
	fetch: (params) => {
		const query = new URLSearchParams();
		if (params?.all) query.set("all", "true");
		if (params?.participating) query.set("participating", "true");
		if (params?.perPage) query.set("per_page", String(params.perPage));
		const qs = query.toString();
		const endpoint = qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
		return client.get(endpoint);
	},
	markRead: (id) => {
		return client.patch(`/notifications/threads/${id}`, {});
	},
	markDone: (id) => {
		return client.put(`/notifications/threads/${id}/subscription`, { ignored: true });
	},
	assignedIssues: () => {
		return client.get("/issues?filter=assigned&state=open");
	},
	reviewRequests: () => {
		return client.get("/search/issues?q=is:pr+is:open+review-requested:@me");
	},
	mentions: (username) => {
		const since = (/* @__PURE__ */ new Date(Date.now() - 10080 * 60 * 1e3)).toISOString().split("T")[0];
		return client.get(`/search/issues?q=mentions:${username}+updated:>${since}`);
	}
};
//#endregion
//#region src/types/notifications.ts
var normalizeThread = (item) => {
	const data = item;
	const repo = data.repository ?? {};
	const subject = data.subject ?? {};
	return {
		id: String(data.id),
		repository: String(repo.full_name ?? ""),
		subjectTitle: String(subject.title ?? ""),
		subjectType: String(subject.type ?? ""),
		reason: String(data.reason ?? ""),
		unread: Boolean(data.unread),
		updatedAt: String(data.updated_at ?? "")
	};
};
var normalizeIssue = (item) => {
	const data = item;
	const repo = data.repository ?? {};
	return {
		id: String(data.id),
		repository: String(repo.full_name ?? ""),
		subjectTitle: String(data.title ?? ""),
		subjectType: String(data.pull_request ? "PullRequest" : "Issue"),
		reason: "assigned",
		unread: false,
		updatedAt: String(data.updated_at ?? "")
	};
};
var normalizeSearchItem = (item) => {
	const data = item;
	return {
		id: String(data.id),
		repository: String(data.repository_url ?? "").replace("https://api.github.com/repos/", ""),
		subjectTitle: String(data.title ?? ""),
		subjectType: String(data.pull_request ? "PullRequest" : "Issue"),
		reason: "mention",
		unread: false,
		updatedAt: String(data.updated_at ?? "")
	};
};
//#endregion
//#region src/services/notifications.ts
var formatTable = (notifications) => {
	console.log();
	console.table(notifications.map((n) => ({
		repository: n.repository,
		subject: n.subjectTitle,
		type: n.subjectType,
		reason: n.reason
	})));
};
var list = async (options = {}) => {
	logger.info("Fetching notifications.");
	let notifications$1 = (await (await notifications.fetch({
		all: options.all,
		participating: options.participating,
		perPage: options.limit
	})).json()).map(normalizeThread);
	if (options.repo) notifications$1 = notifications$1.filter((n) => n.repository === options.repo);
	formatTable(notifications$1);
	return {
		success: true,
		metadata: notifications$1
	};
};
var markRead = async (id) => {
	logger.info(`Marking notification ${id} as read.`);
	await notifications.markRead(id);
	logger.success("Notification marked as read.");
	return { success: true };
};
var markDone = async (id) => {
	logger.info(`Marking notification ${id} as done.`);
	await notifications.markDone(id);
	logger.success("Notification marked as done.");
	return { success: true };
};
var activity = async () => {
	logger.info("Fetching activity.");
	const [issuesRes, reviewsRes, mentionsRes] = await Promise.all([
		notifications.assignedIssues(),
		notifications.reviewRequests(),
		notifications.mentions("@me")
	]);
	const assignedIssues = await issuesRes.json();
	const reviewData = await reviewsRes.json();
	const mentionData = await mentionsRes.json();
	const result = {
		assignedIssues: assignedIssues.map(normalizeIssue),
		reviewRequests: (reviewData.items ?? []).map(normalizeSearchItem),
		recentMentions: (mentionData.items ?? []).map(normalizeSearchItem)
	};
	console.log();
	console.log("Assigned Issues:", result.assignedIssues.length);
	console.log("Review Requests:", result.reviewRequests.length);
	console.log("Recent Mentions:", result.recentMentions.length);
	return {
		success: true,
		metadata: result
	};
};
var mentions = async () => {
	logger.info("Fetching mentions.");
	const notifications$2 = ((await (await notifications.mentions("@me")).json()).items ?? []).map(normalizeSearchItem);
	formatTable(notifications$2);
	return {
		success: true,
		metadata: notifications$2
	};
};
var notifications_default$1 = {
	list,
	markRead,
	markDone,
	activity,
	mentions
};
//#endregion
//#region src/commands/mentions.ts
var register$2 = (program) => {
	program.command("mentions").description("Find recent @mentions of you.").action(() => void notifications_default$1.mentions());
};
var mentions_default = { register: register$2 };
//#endregion
//#region src/commands/activity.ts
var register$1 = (program) => {
	program.command("activity").description("Show assigned issues, review requests, and mentions.").action(() => void notifications_default$1.activity());
};
var activity_default = { register: register$1 };
//#endregion
//#region src/commands/notifications.ts
var register = (program) => {
	const notifications = program.command("notifications").description("Manage GitHub notifications.");
	notifications.command("list").description("List notifications.").option("-a, --all", "Include read notifications").option("-p, --participating", "Only participating notifications").option("-r, --repo <owner/repo>", "Filter by repository").option("-l, --limit <n>", "Max results").action((options) => {
		notifications_default$1.list({
			all: options.all,
			participating: options.participating,
			repo: options.repo,
			limit: options.limit ? parseInt(options.limit, 10) : void 0
		});
	});
	notifications.command("read <id>").description("Mark a notification as read.").action((id) => {
		notifications_default$1.markRead(id);
	});
	notifications.command("done <id>").description("Mark a notification as done.").action((id) => {
		notifications_default$1.markDone(id);
	});
};
var notifications_default = { register };
//#endregion
//#region src/cli/index.ts
commander.program.name("ghitgud").description("A simple CLI to give superpowers to GitHub.").version("2.1.0");
gh_default.register(commander.program);
notifications_default.register(commander.program);
activity_default.register(commander.program);
mentions_default.register(commander.program);
ping_default.register(commander.program);
labels_default.register(commander.program);
config_default.register(commander.program);
commander.program.addHelpText("before", ascii);
commander.program.exitOverride();
try {
	commander.program.parse(process$1.default.argv);
} catch (error) {
	if (error instanceof GhitgudError) {
		logger.error(error.message);
		process$1.default.exit(1);
	}
	if (error.exitCode === 0) process$1.default.exit(0);
	throw error;
}
process$1.default.on("unhandledRejection", (error) => {
	if (error instanceof GhitgudError) {
		logger.error(error.message);
		process$1.default.exit(1);
	}
	throw error;
});
//#endregion
