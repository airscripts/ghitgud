type OutputMode = "human" | "json" | "silent";

let outputMode: OutputMode = "human";

const setJsonOutput = (enabled: boolean) => {
  outputMode = enabled ? "json" : "human";
};

const setSilentOutput = (enabled: boolean) => {
  outputMode = enabled ? "silent" : "human";
};

const setOutputMode = (mode: OutputMode) => {
  outputMode = mode;
};

const getOutputMode = () => {
  return outputMode;
};

const isJsonOutput = () => {
  return outputMode === "json";
};

const isSilentOutput = () => {
  return outputMode === "silent";
};

const isHumanOutput = () => {
  return outputMode === "human";
};

export default {
  isJsonOutput,
  getOutputMode,
  isHumanOutput,
  setJsonOutput,
  setOutputMode,
  isSilentOutput,
  setSilentOutput,
};

export type { OutputMode };
