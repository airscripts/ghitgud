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
    useStdin: ink.useStdin,
    useStdout: ink.useStdout,
  });

  const instance = ink.render(React.createElement(App), {
    exitOnCtrlC: true,
  });

  await instance.waitUntilExit();

  // Clear the visible screen (2J), clear the scrollback buffer (3J),
  // and move the cursor to the top-left corner (H) — equivalent to `clear`.
  process.stdout.write("\x1b[2J\x1b[3J\x1b[H");

  outputState.setOutputMode(previousMode);
  return { success: true };
};

export default { start };
