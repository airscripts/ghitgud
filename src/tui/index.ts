import createTuiApp from "./app";
import outputState from "@/core/output-state";

const start = async () => {
  const previousMode = outputState.getOutputMode();
  outputState.setSilentOutput(true);

  const React = await import("react");
  const ink = await import("ink");

  const App = createTuiApp({
    React,
    Box: ink.Box,
    Text: ink.Text,
    useApp: ink.useApp,
    useInput: ink.useInput,
    useStdout: ink.useStdout,
  });

  const instance = ink.render(React.createElement(App), {
    exitOnCtrlC: true,
  });

  await instance.waitUntilExit();
  outputState.setOutputMode(previousMode);
  return { success: true };
};

export default { start };
