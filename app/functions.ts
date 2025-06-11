import "dotenv/config";

const STATUS_OK = 200;
const STATUS_UNAUTHORIZED = 401;
const STATUS_NOT_FOUND = 404;

const http = {
  isOk: (status: number) => status === STATUS_OK,
  isNotFound: (status: number) => status === STATUS_NOT_FOUND,
  isNotAuthorized: (status: number) => status === STATUS_UNAUTHORIZED,
};

const environment = {
  hasToken: () => process.env.GITHUB_TOKEN ? true : false,
};

export default { http, environment };
