let jsonOutput = false;

const setJsonOutput = (enabled: boolean) => {
  jsonOutput = enabled;
};

const isJsonOutput = () => {
  return jsonOutput;
};

export default {
  isJsonOutput,
  setJsonOutput,
};
