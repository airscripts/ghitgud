import fs from "fs";
import os from "os";
import path from "path";

import conf from "./config";
import "dotenv/config";

const STATUS_OK = 200;
const STATUS_UNAUTHORIZED = 401;
const STATUS_NOT_FOUND = 404;

const ENCODING = "utf8";
const CREDENTIALS_FILE = "credentials.json";
const GHITGUD_FOLDER = path.join(os.homedir(), ".config", "ghitgud");

const http = {
  isOk: (status: number) => status === STATUS_OK,
  isNotFound: (status: number) => status === STATUS_NOT_FOUND,
  isNotAuthorized: (status: number) => status === STATUS_UNAUTHORIZED,
};

const environment = {
  hasRepo: () => (conf.repo ? true : false),
  hasToken: () => (conf.token ? true : false),
};

const config = {
  read: (key: string) => {
    if (!fs.existsSync(`${GHITGUD_FOLDER}/${CREDENTIALS_FILE}`)) return null;

    const data = fs.readFileSync(
      `${GHITGUD_FOLDER}/${CREDENTIALS_FILE}`,
      ENCODING
    );

    const content = JSON.parse(data);
    return content[key];
  },
};

export default { http, environment, config };
