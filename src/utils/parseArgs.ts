export function parseArgs(): string | undefined {
  const args = process.argv.slice(2);
  const projectName = args.find(arg => !arg.startsWith('-'));
  return projectName;
}

