const formatOutput = (data: unknown) => {
  console.log(JSON.stringify(data, null, 2));
};

const formatError = (message: string) => {
  console.error(JSON.stringify({ success: false, error: message }, null, 2));
};

export default { formatOutput, formatError };