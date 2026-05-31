import { buildStatusItems } from "./status";
import outputState from "@/core/output-state";
import operations, { workspaces } from "./operations";
import { renderApp, renderOperationRows } from "./render";
import type { TuiInputValues, TuiOperation } from "./types";
import { scrollBy, getLayout, clampScroll, getVisibleLines } from "./layout";

import {
  validate,
  printable,
  initialValues,
  stringifyResult,
  buildContextLines,
} from "./state";

type Mode = "normal" | "insert" | "search" | "confirm";

type Runtime = {
  React: typeof import("react");
  Box: unknown;
  Text: unknown;
  useApp: () => { exit: () => void };
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
  const { React, Box, Text, useApp, useInput, useStdout } = runtime;
  const h = React.createElement;

  return function TuiApp() {
    const app = useApp();
    const { stdout } = useStdout();

    const layout = getLayout(stdout.columns, stdout.rows);
    const [workspaceIndex, setWorkspaceIndex] = React.useState(0);
    const [operationIndex, setOperationIndex] = React.useState(0);
    const [activeField, setActiveField] = React.useState(0);

    const [values, setValues] = React.useState<TuiInputValues>(
      initialValues(operations[0]),
    );

    const [result, setResult] = React.useState("Select an operation.");
    const [status, setStatus] = React.useState("Ready.");
    const [running, setRunning] = React.useState(false);
    const [mode, setMode] = React.useState<Mode>("normal");
    const [query, setQuery] = React.useState("");
    const [contextScroll, setContextScroll] = React.useState(0);
    const [contextHScroll, setContextHScroll] = React.useState(0);

    const workspace = workspaces[workspaceIndex];

    const filteredOperations = React.useMemo(() => {
      return operations.filter((operation) => {
        const matchesWorkspace = operation.workspace === workspace;
        if (mode !== "search" || !query) return matchesWorkspace;

        const haystack = [
          operation.id,
          operation.title,
          operation.command,
          operation.description,
          operation.workspace,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query.toLowerCase());
      });
    }, [workspace, mode, query]);

    const operation =
      filteredOperations[
        Math.min(operationIndex, Math.max(0, filteredOperations.length - 1))
      ] ?? operations[0];

    const inputs = operation.inputs ?? [];
    const field = inputs[activeField];

    const resetForOperation = (nextOperation: TuiOperation) => {
      setValues(initialValues(nextOperation));
      setActiveField(0);
      setMode("normal");
      setResult("Select an operation.");
      setStatus("Ready.");
    };

    const chooseOperation = (index: number) => {
      const nextIndex = Math.max(
        0,
        Math.min(index, filteredOperations.length - 1),
      );

      setOperationIndex(nextIndex);
      resetForOperation(filteredOperations[nextIndex] ?? operations[0]);
    };

    const chooseWorkspace = (index: number) => {
      const nextIndex =
        (index + workspaces.length) % Math.max(workspaces.length, 1);

      setWorkspaceIndex(nextIndex);
      setOperationIndex(0);

      resetForOperation(
        operations.find((item) => item.workspace === workspaces[nextIndex]) ??
          operations[0],
      );
    };

    React.useEffect(() => {
      setContextScroll(0);
      setContextHScroll(0);
    }, [operation.id, query, result, workspaceIndex]);

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

    const handleSearch = (input: string, key: Record<string, unknown>) => {
      if (key.escape) {
        setMode("normal");
        setQuery("");
        return;
      }

      if (key.return) {
        setMode("normal");
        chooseOperation(0);
        return;
      }

      if (key.backspace || key.delete) {
        setQuery((current) => current.slice(0, -1));
        return;
      }

      if (printable(input)) {
        setQuery((current) => `${current}${input}`);
      }
    };

    const handleConfirm = (input: string, key: Record<string, unknown>) => {
      if (input.toLowerCase() === "y") {
        void runOperation();
        return;
      }

      if (input.toLowerCase() === "n" || key.escape) {
        setMode("normal");
        setStatus("Cancelled.");
      }
    };

    const handleNormalNavigation = (
      input: string,
      key: Record<string, unknown>,
    ) => {
      if (input === "q") {
        app.exit();
        return;
      }

      if (input === "?") {
        setResult(
          [
            "keyboard shortcuts",
            "q quit",
            "/ search",
            "[ ] switch workspace",
            "j/k or arrows select operation",
            "tab focus input",
            "i enter insert mode",
            "esc exit insert mode",
            "space toggle boolean",
            "enter run",
            "u/d scroll context vertical",
            "h/l scroll context horizontal",
            "g/G context top/bottom",
          ].join("\n"),
        );

        return;
      }

      if (input === "/") {
        setMode("search");
        setQuery("");
        return;
      }

      if (input === "[") {
        chooseWorkspace(workspaceIndex - 1);
        return;
      }

      if (input === "]") {
        chooseWorkspace(workspaceIndex + 1);
        return;
      }

      if (key.upArrow || input === "k") {
        chooseOperation(operationIndex - 1);
        return;
      }

      if (key.downArrow || input === "j") {
        chooseOperation(operationIndex + 1);
        return;
      }
    };

    const handleNormalScroll = (
      input: string,
      key: Record<string, unknown>,
    ) => {
      const contextLines = buildContextLines(
        operation,
        values,
        result,
        mode === "confirm",
        activeField,
        mode === "insert",
      );

      if (input === "u" || key.pageUp) {
        setContextScroll((current) =>
          scrollBy(
            current,
            -Math.ceil(layout.contextHeight / 2),
            contextLines.length,
            layout.contextHeight,
          ),
        );

        return;
      }

      if (input === "d" || key.pageDown) {
        setContextScroll((current) =>
          scrollBy(
            current,
            Math.ceil(layout.contextHeight / 2),
            contextLines.length,
            layout.contextHeight,
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
            contextLines.length,
            contextLines.length,
            layout.contextHeight,
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
          Math.max(0, current - Math.ceil(layout.contextWidth / 2)),
        );

        return;
      }

      if (input === "l" || key.rightArrow) {
        setContextHScroll(
          (current) => current + Math.ceil(layout.contextWidth / 2),
        );

        return;
      }
    };

    const handleNormalAction = (
      input: string,
      key: Record<string, unknown>,
    ) => {
      if (key.tab) {
        if (inputs.length) {
          setActiveField((current) => (current + 1) % inputs.length);
        }

        return;
      }

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

    const handleInsert = (input: string, key: Record<string, unknown>) => {
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

      if (mode === "search") {
        handleSearch(input, key as Record<string, unknown>);
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

    const contextLines = buildContextLines(
      operation,
      values,
      result,
      mode === "confirm",
      activeField,
      mode === "insert",
    );

    const visibleContext = getVisibleLines(
      contextLines,
      contextScroll,
      layout.contextHeight,
    );

    const statusItems = buildStatusItems({
      workspace,
    });

    const operationRows = renderOperationRows(
      { h, Box, Text },
      filteredOperations,
      operation,
      layout,
    );

    return renderApp(h, Box, Text, {
      mode,
      query,
      layout,
      status,
      running,
      operation,
      workspaces,
      statusItems,
      operationRows,
      visibleContext,
      contextHScroll,
      workspaceIndex,
      searching: mode === "search",
    });
  };
};

export default createTuiApp;
