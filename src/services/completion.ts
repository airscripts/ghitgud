import output from "@/core/output";
import outputState from "@/core/output-state";
import { GitfleetError } from "@/core/errors";

const VALID_SHELLS = ["bash", "zsh", "fish", "powershell"] as const;
type Shell = (typeof VALID_SHELLS)[number];

const generateBash = (commands: string[]): string => {
  const completions = commands.join(" ");
  return `# gitfleet bash completion
_gitfleet_completions() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  COMPREPLY=($(compgen -W "${completions}" -- "$cur"))
}
complete -F _gitfleet_completions gitfleet`;
};

const generateZsh = (commands: string[]): string => {
  const completions = commands
    .map((c) => `    "${c}":"${c} command"`)
    .join("\n");
  return `#compdef gitfleet
# gitfleet zsh completion
_gitfleet() {
  local -a commands
  commands=(
${completions}
  )
  _describe 'command' commands
  _arguments '::command: :->command' '*:: :->command'
}

_gitfleet "$@"`;
};

const generateFish = (commands: string[]): string => {
  return `# gitfleet fish completion
complete -c gitfleet -f

${commands.map((c) => `complete -c gitfleet -n "__gitfleet_use_subcommand" -a ${c} -d "${c} command"`).join("\n")}

function __gitfleet_use_subcommand
    set -l cmd (commandline -opc)
    for c in ${commands.join(" ")}
        if test "$cmd[1]" = "$c"
            return 1
        end
    end
    return 0
end`;
};

const generatePowershell = (commands: string[]): string => {
  const completions = commands.join('", "');
  return `# gitfleet PowerShell completion
Register-ArgumentCompleter -CommandName gitfleet -ScriptBlock {
    param($commandName, $wordToComplete, $commandAst, $fakeBoundParameter)
    $completions = @(
        "${completions}"
    )
    $completions | Where-Object {
        $_ -like "$wordToComplete*"
    } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}`;
};

const generate = (shell: Shell, commands: string[]) => {
  switch (shell) {
    case "bash":
      return generateBash(commands);
    case "zsh":
      return generateZsh(commands);
    case "fish":
      return generateFish(commands);
    case "powershell":
      return generatePowershell(commands);
    default:
      throw new GitfleetError(
        `Unsupported shell: ${shell}. Supported: ${VALID_SHELLS.join(", ")}`,
      );
  }
};

const listShells = () => {
  output.renderTable(
    VALID_SHELLS.map((s) => ({
      Shell: s,
    })),
  );

  return { success: true, shells: [...VALID_SHELLS] };
};

const getCompletion = (shell: Shell, commands: string[]) => {
  const script = generate(shell, commands);

  if (outputState.isHumanOutput()) {
    output.writeValue(script);
  }

  return { success: true, shell, script };
};

export { Shell };
export default { generate, listShells, getCompletion, VALID_SHELLS };
