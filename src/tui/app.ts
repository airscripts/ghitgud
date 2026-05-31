import operations from "./operations";
import { renderApp } from "./render";
import { buildStatusItems } from "./status";
import outputState from "@/core/output-state";
import { parseMouseEvent, SCROLL_SENSITIVITY } from "./mouse";
import { scrollBy, getLayout, clampScroll, getVisibleLines } from "./layout";
import type { Mode, MouseEvent, TuiInputValues, TuiOperation } from "./types";

import {
  validate,
  printable,
  initialValues,
  stringifyResult,
  buildDashboardData,
} from "./state";

const MOUSE_ENABLE = "\x1b[?1000h\x1b[?1006h";
const MOUSE_DISABLE = "\x1b[?1000l\x1b[?1006l";
const HEADER_ROW = 1;
const HINT_ROW = HEADER_ROW + 1;
const BODY_START_ROW = HINT_ROW + 2;

type Runtime = {
  React: typeof import("react");
  Box: unknown;
  Text: unknown;
  useApp: () => { exit: () => void };
  useStdin?: () => { stdin: NodeJS.ReadStream };
  useInput: (
    handler: (
      input: string,
      key: {
        c?: boolean;
        tab?: boolean;
        ctrl?: boolean;
        shift?: boolean;
        pageUp?: boolean;
        return?: boolean;
        escape?: boolean;
        delete?: boolean;
        upArrow?: boolean;
        pageDown?: boolean;
        backspace?: boolean;
        downArrow?: boolean;
        leftArrow?: boolean;
        rightArrow?: boolean;
      },
    ) => void,
  ) => void;
  useStdout: () => { stdout: { columns?: number; rows?: number } };
};

const asString = (value: string | number | boolean | undefined) => {
  if (value === undefined) return "";
  return String(value);
};

const createTuiApp = (runtime: Runtime) => {
  const { React, Box, Text, useApp, useInput, useStdout, useStdin } = runtime;
  const h = React.createElement;

  return function TuiApp() {
    const app = useApp();
    const { stdout } = useStdout();
    const stdin = useStdin?.().stdin;
    const layout = getLayout(stdout.columns, stdout.rows);
    const [operationIndex, setOperationIndex] = React.useState(0);
    const [activeField, setActiveField] = React.useState(0);

    const [values, setValues] = React.useState<TuiInputValues>(
      initialValues(operations[0]),
    );

    const [result, setResult] = React.useState(
      "No output to be shown, run a command first.",
    );
    const [status, setStatus] = React.useState("Ready.");
    const [running, setRunning] = React.useState(false);
    const [mode, setMode] = React.useState<Mode>("dashboard");
    const [previousMode, setPreviousMode] = React.useState<Mode>("normal");
    const [paletteQuery, setPaletteQuery] = React.useState("");
    const [paletteIndex, setPaletteIndex] = React.useState(0);
    const [showHelp, setShowHelp] = React.useState(false);
    const [contextScroll, setContextScroll] = React.useState(0);
    const [contextHScroll, setContextHScroll] = React.useState(0);

    const dashboardData = React.useMemo(
      () => buildDashboardData(__VERSION__),
      [],
    );

    const displayMode = mode === "palette" ? previousMode : mode;
    const paletteOperations = React.useMemo(() => {
      if (!paletteQuery) return operations;

      const needle = paletteQuery.toLowerCase();

      return operations.filter((op) =>
        [op.id, op.title, op.command, op.description, op.workspace]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }, [paletteQuery]);

    const operation =
      operations[
        Math.min(operationIndex, Math.max(0, operations.length - 1))
      ] ?? operations[0];

    const inputs = operation.inputs ?? [];
    const field = inputs[activeField];

    const resetForOperation = (nextOperation: TuiOperation) => {
      setValues(initialValues(nextOperation));
      setActiveField(0);
      setMode("normal");
      setResult("No output to be shown, run a command first.");
      setStatus("Ready.");
    };

    const openPalette = () => {
      setPreviousMode(mode === "palette" ? previousMode : mode);
      setPaletteQuery("");
      setPaletteIndex(0);
      setMode("palette");
    };

    const chooseOperation = (index: number) => {
      const nextIndex = Math.max(0, Math.min(index, operations.length - 1));
      setOperationIndex(nextIndex);
      resetForOperation(operations[nextIndex] ?? operations[0]);
    };

    const activateOperation = (nextOperation: TuiOperation) => {
      const nextOperationIndex = operations.findIndex(
        (item) => item.id === nextOperation.id,
      );

      setOperationIndex(Math.max(0, nextOperationIndex));
      resetForOperation(nextOperation);
    };

    const returnToDashboard = () => {
      setMode("dashboard");
      setShowHelp(false);
      setActiveField(0);
      setOperationIndex(0);
      resetForOperation(operations[0]);
      setMode("dashboard");
    };

    const closePalette = () => {
      setMode(previousMode);
      setPaletteQuery("");
      setPaletteIndex(0);
    };

    const chooseInput = (delta: number) => {
      if (!inputs.length) return;

      setActiveField(
        (current) => (current + delta + inputs.length) % inputs.length,
      );
    };

    const handleMouse = (event: MouseEvent) => {
      if (showHelp || running) return;

      if (mode === "palette" && event.type === "scroll") {
        setPaletteIndex((current) =>
          Math.max(
            0,
            Math.min(
              current +
                (event.direction === "up"
                  ? -SCROLL_SENSITIVITY
                  : SCROLL_SENSITIVITY),
              paletteOperations.length - 1,
            ),
          ),
        );

        return;
      }

      if (displayMode === "dashboard") return;
      if (event.type !== "scroll") return;

      const bodyStartRow = BODY_START_ROW;
      const bodyEndRow = bodyStartRow + layout.bodyHeight - 1;
      if (event.y < bodyStartRow || event.y > bodyEndRow) return;

      const delta =
        event.direction === "up" ? -SCROLL_SENSITIVITY : SCROLL_SENSITIVITY;

      setContextScroll((current) =>
        scrollBy(
          current,
          delta,
          outputLines.length,
          layout.outputContentHeight,
        ),
      );
    };

    React.useEffect(() => {
      setContextScroll(0);
      setContextHScroll(0);
    }, [operation.id]);

    React.useEffect(() => {
      setPaletteIndex(0);
    }, [paletteQuery]);

    React.useEffect(() => {
      setPaletteIndex((current) =>
        Math.max(0, Math.min(current, paletteOperations.length - 1)),
      );
    }, [paletteOperations.length]);

    React.useEffect(() => {
      if (!stdin) return undefined;
      process.stdout.write(MOUSE_ENABLE);

      const onData = (data: Buffer) => {
        const event = parseMouseEvent(data.toString("utf8"));
        if (event) handleMouse(event);
      };

      stdin.on("data", onData);
      return () => {
        stdin.off("data", onData);
        process.stdout.write(MOUSE_DISABLE);
      };
    });

    const runOperation = async () => {
      const validationError = validate(operation, values);
      if (validationError) {
        setStatus(validationError);
        return;
      }

      setMode("normal");
      setRunning(true);
      setStatus(`Running...`);

      const previousMode = outputState.getOutputMode();
      outputState.setSilentOutput(true);

      try {
        const metadata = await operation.run({ values });
        setResult(stringifyResult(metadata));
        setStatus(`Success.`);
      } catch (error) {
        setResult(error instanceof Error ? error.message : String(error));
        setStatus(`Failed.`);
      } finally {
        outputState.setOutputMode(previousMode);
        setRunning(false);
      }
    };

    const updateField = (inputKey: string, nextValue: string | boolean) => {
      setValues((current) => ({
        ...current,
        [inputKey]: nextValue,
      }));
    };

    const handleConfirm = (input: string, key: Record<string, unknown>) => {
      if (input.toLowerCase() === "y") {
        void runOperation();
        return;
      }

      if (input.toLowerCase() === "n" || input === "q" || key.escape) {
        setMode("normal");
        setStatus("Cancelled.");
      }
    };

    const handleNormalNavigation = (
      input: string,
      key: Record<string, unknown>,
    ) => {
      if (input === "q") {
        returnToDashboard();
        return;
      }

      if (input === "?") {
        setShowHelp(true);
        return;
      }

      if (input === "c") {
        openPalette();
        return;
      }

      if (key.upArrow || input === "k") {
        chooseInput(-1);
        return;
      }

      if (key.downArrow || input === "j") {
        chooseInput(1);
        return;
      }
    };

    const handleNormalScroll = (
      input: string,
      key: Record<string, unknown>,
    ) => {
      if (input === "u" || key.pageUp) {
        setContextScroll((current) =>
          scrollBy(
            current,
            -Math.ceil(layout.outputContentHeight / 2),
            outputLines.length,
            layout.outputContentHeight,
          ),
        );

        return;
      }

      if (input === "d" || key.pageDown) {
        setContextScroll((current) =>
          scrollBy(
            current,
            Math.ceil(layout.outputContentHeight / 2),
            outputLines.length,
            layout.outputContentHeight,
          ),
        );

        return;
      }

      if (input === "g") {
        setContextScroll(0);
        return;
      }

      if (input === "G") {
        setContextScroll(
          clampScroll(
            outputLines.length,
            outputLines.length,
            layout.outputContentHeight,
          ),
        );

        return;
      }
    };

    const handleNormalHScroll = (
      input: string,
      key: Record<string, unknown>,
    ) => {
      if (input === "h" || key.leftArrow) {
        setContextHScroll((current) =>
          Math.max(0, current - Math.ceil(layout.outputWidth / 2)),
        );

        return;
      }

      if (input === "l" || key.rightArrow) {
        setContextHScroll(
          (current) => current + Math.ceil(layout.outputWidth / 2),
        );

        return;
      }
    };

    const handleNormalAction = (
      input: string,
      key: Record<string, unknown>,
    ) => {
      if (key.return) {
        if (operation.mutates) {
          setMode("confirm");
          setStatus("Confirm mutation with Y or cancel with N.");
          return;
        }

        void runOperation();
        return;
      }

      if (input === "i") {
        if (field && field.type !== "boolean") {
          setMode("insert");
        }

        return;
      }

      if (!field) return;

      if (field.type === "boolean" && input === " ") {
        updateField(field.key, !(values[field.key] === true));
        return;
      }
    };

    const handlePalette = (input: string, key: Record<string, unknown>) => {
      if (input === "q" || key.escape) {
        closePalette();
        return;
      }

      if (key.return) {
        const nextOperation = paletteOperations[paletteIndex];
        if (nextOperation) activateOperation(nextOperation);
        return;
      }

      if (key.upArrow || input === "k") {
        setPaletteIndex((current) => Math.max(0, current - 1));
        return;
      }

      if (key.downArrow || input === "j") {
        setPaletteIndex((current) =>
          Math.min(current + 1, Math.max(0, paletteOperations.length - 1)),
        );

        return;
      }

      if (key.backspace || key.delete) {
        setPaletteQuery((current) => current.slice(0, -1));
        return;
      }

      if (printable(input)) {
        setPaletteQuery((current) => `${current}${input}`);
      }
    };

    const handleInsert = (input: string, key: Record<string, unknown>) => {
      if (input === "q") {
        returnToDashboard();
        return;
      }

      if (key.escape) {
        setMode("normal");
        return;
      }

      if (!field || field.type === "boolean") return;

      if (key.backspace || key.delete) {
        updateField(field.key, asString(values[field.key]).slice(0, -1));
        return;
      }

      if (printable(input)) {
        updateField(field.key, `${asString(values[field.key])}${input}`);
      }
    };

    useInput((input, key) => {
      if (key.ctrl && key.c) {
        app.exit();
        return;
      }

      if (running) return;

      if (showHelp) {
        if (input === "q" || key.escape) setShowHelp(false);
        return;
      }

      if (mode === "dashboard") {
        if (input === "q") {
          app.exit();
          return;
        }

        if (key.return) {
          setMode("normal");
          chooseOperation(0);
        }

        return;
      }

      if (mode === "palette") {
        handlePalette(input, key as Record<string, unknown>);
        return;
      }

      if (mode === "confirm") {
        handleConfirm(input, key as Record<string, unknown>);
        return;
      }

      if (mode === "insert") {
        handleInsert(input, key as Record<string, unknown>);
        return;
      }

      handleNormalNavigation(input, key as Record<string, unknown>);
      handleNormalScroll(input, key as Record<string, unknown>);
      handleNormalHScroll(input, key as Record<string, unknown>);
      handleNormalAction(input, key as Record<string, unknown>);
    });

    const outputLines = [
      ...(mode === "confirm"
        ? [
            "Mutation Confirmation",
            "This action mutates state. Press y/Y to run or n/N to cancel.",
            " ",
          ]
        : []),
      ...result.split("\n"),
    ];

    const visibleOutput = getVisibleLines(
      outputLines,
      contextScroll,
      layout.outputContentHeight,
    );

    const statusItems = buildStatusItems({
      workspace: operation.workspace,
    });

    return renderApp(h, Box, Text, {
      layout,
      status,
      values,
      result,
      running,
      showHelp,
      operation,
      statusItems,
      activeField,
      paletteQuery,
      paletteIndex,
      visibleOutput,
      dashboardData,
      contextHScroll,
      mode: displayMode,
      paletteOperations,
      confirming: mode === "confirm",
      showPalette: mode === "palette",
      insertMode: displayMode === "insert",
    });
  };
};

export default createTuiApp;
