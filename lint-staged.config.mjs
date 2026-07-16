/**
 * Lint-staged configuration for Dashfy monorepo
 * Runs linters and formatters on staged files before commit
 * @see https://github.com/lint-staged/lint-staged
 */
const lintStagedConfig = {
  // TypeScript and TSX files
  '*.{ts,tsx}': (filenames) => {
    // Filter out files that are in ESLint ignore patterns
    const filteredFiles = filenames.filter(
      (file) =>
        !file.includes('/.storybook/') &&
        !file.includes('/tests/') &&
        !file.includes('/templates/'),
    )
    const filesString = filenames.join(' ')
    const filteredFilesString = filteredFiles.join(' ')

    const commands = [`prettier --write ${filesString}`]

    // Only run ESLint if there are files to lint after filtering
    if (filteredFiles.length > 0) {
      commands.push(`eslint --fix --max-warnings=0 ${filteredFilesString}`)
    }

    // Type-check only the affected packages, not the entire monorepo
    // This is much faster than running tsc on the entire codebase
    commands.push('turbo run typecheck --filter=[HEAD^1]')

    return commands
  },

  // JavaScript files
  '*.{js,mjs}': (filenames) => {
    // Filter out files that are in ESLint ignore patterns
    const filteredFiles = filenames.filter(
      (file) =>
        !file.includes('/.storybook/') &&
        !file.includes('/tests/') &&
        !file.includes('/templates/'),
    )
    const filesString = filenames.join(' ')
    const filteredFilesString = filteredFiles.join(' ')

    const commands = [`prettier --write ${filesString}`]

    // Only run ESLint if there are files to lint after filtering
    if (filteredFiles.length > 0) {
      commands.push(`eslint --fix --max-warnings=0 ${filteredFilesString}`)
    }

    return commands
  },

  // JSON, CSS, and Markdown files
  '*.{json,css,md}': (filenames) => {
    const filesString = filenames.join(' ')
    return [`prettier --write ${filesString}`]
  },

  // YAML files
  '*.{yml,yaml}': (filenames) => {
    const filesString = filenames.join(' ')
    return [`prettier --write ${filesString}`]
  },
}

export default lintStagedConfig
