<h1 align="center">
  Ghitgud
</h1>

<p align="center">
  A simple CLI to give superpowers to GitHub.
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/57aac0c0-1bd2-4cb4-8445-36a161a7e2ee" alt="Usage GIF" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@airscript/ghitgud"><img src="https://img.shields.io/npm/v/@airscript/ghitgud" alt="npm" /></a>
  <a href="https://github.com/airscripts/ghitgud/blob/main/LICENSE"><img src="https://img.shields.io/github/license/airscripts/ghitgud" alt="License" /></a>
</p>

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Commands](#commands)
- [Templates](#templates)
- [Output Format](#output-format)
- [Development](#development)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Installation

```bash
npm install -g @airscript/ghitgud
```

## Configuration

Set a GitHub personal access token and repository (in `owner/repo` format):

```bash
ghitgud config set token <your-token>
ghitgud config set repo owner/repository
```

Retrieve a configured value:

```bash
ghitgud config get token
ghitgud config get repo
```

> Create a token at: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

## Commands

```
ghitgud ping                     Check if the CLI is working
ghitgud labels list              List all labels for a repository
ghitgud labels pull              Pull labels from a repository to local config
ghitgud labels pull -t <name>   Pull labels from a built-in template
ghitgud labels push              Push local labels to a repository
ghitgud labels push -t <name>   Push a built-in template to a repository
ghitgud labels prune             Delete all local labels from a repository
ghitgud config set <key> <val>   Set a configuration value (token or repo)
ghitgud config get <key>         Get a configuration value
```

## Templates

Built-in label presets are available with the `--template` / `-t` flag:

| Template       | Description                        |
| -------------- | ---------------------------------- |
| `base`         | Minimal set: bug and feature       |
| `conventional` | Conventional Commits labels         |
| `github`       | GitHub default labels               |

```bash
ghitgud labels pull -t conventional
ghitgud labels push -t conventional
```

## Output Format

All commands output JSON to stdout on success and JSON to stderr on failure.

Success:

```json
{
  "success": true,
  "metadata": [...]
}
```

Error:

```json
{
  "success": false,
  "error": "You must set the GHITGUD_GITHUB_REPO environment variable."
}
```

## Development

```bash
pnpm install            # install dependencies
pnpm build              # build with Vite (single CJS bundle)
pnpm start              # run the CLI locally
pnpm test               # run tests (watch mode)
pnpm test -- --run      # single test run (no watch)
pnpm test:coverage      # run tests with coverage
pnpm typecheck          # type check without emitting
pnpm lint               # type check (alias for typecheck)
pnpm clean              # remove build artifacts
```

## Contributing

Contributions and suggestions about how to improve this project are welcome!
Please follow [our contribution guidelines](https://github.com/airscripts/ghitgud/blob/main/CONTRIBUTING.md).

## Support

If you want to support my work you can do it by following me, leaving a star, sharing my projects or also donating at the links below.
Choose what you find more suitable for you:

<a href="https://sponsor.airscript.it" target="blank">
  <img src="https://raw.githubusercontent.com/airscripts/assets/main/images/github-sponsors.svg" alt="GitHub Sponsors" width="30px" />
</a>&nbsp;
<a href="https://kofi.airscript.it" target="blank">
  <img src="https://raw.githubusercontent.com/airscripts/assets/main/images/kofi.svg" alt="Kofi" width="30px" />
</a>

## License

This repository is licensed under [GPL-3.0 License](https://github.com/airscripts/ghitgud/blob/main/LICENSE).