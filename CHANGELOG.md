# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2026-05-24

### Added

- Repository Insights commands (traffic, contributors, commits, frequency, popularity, participation)
- Interactive prompts via @clack/prompts for missing required arguments
- Loading spinners for async operations with ora
- Progress bars for bulk repository operations with cli-progress
- Box-based output formatting with Unicode borders via boxen
- Relative date formatting with date-fns
- Theme detection (dark/light/auto) for terminal output
- Config `unset` command to remove configuration values

## [2.4.0] - 2026-05-23

### Added

- Bulk repository governance commands for inspecting, governing, labeling, retiring, and reporting on repositories

## [2.3.0] - 2026-05-22

### Added

- Multi-account profile system with add, list, switch, and detect commands
- Per-repository .ghitgudrc file support for automatic profile detection

## [2.2.0] - 2026-05-13

### Added

- PR lifecycle commands including cleanup, push, stack management, and navigation

## [2.1.0] - 2026-05-09

### Added

- GitHub passthrough command
- Notifications, activity, and mentions commands

## [2.0.0] - 2026-05-09

### Added

- Config get and label template support
- Layered CLI architecture
- Vite build pipeline and multi-step CI/CD
- Comprehensive test suite with coverage reporting

## [1.0.1] - 2025-05-09

### Changed

- Base metadata folder path

## [1.0.0] - 2025-05-09

### Added

- Initial release with labels, ping, and config commands
