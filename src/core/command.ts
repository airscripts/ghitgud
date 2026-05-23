import output from "@/core/output";

const run = async <T>(task: () => T | Promise<T>) => {
  const result = await task();
  output.writeResult(result);
  return result;
};

export default { run };
