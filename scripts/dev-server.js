const { spawn } = require('child_process');
const path = require('path');

function runProcess(label, cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  child.on('exit', code => {
    if (code !== 0) {
      console.warn(`[${label}] exited with code ${code}`);
    }
  });

  child.on('error', err => {
    console.error(`[${label}] failed:`, err);
  });

  return child;
}

console.log('Starting development servers...\n');

const server = runProcess(
  'SERVER',
  'npm',
  ['run', 'server'],
  path.resolve(__dirname, '..')
);

const client = runProcess(
  'CLIENT',
  'npm',
  ['run', 'client'],
  path.resolve(__dirname, '..')
);

function shutdown() {
  console.log('\nStopping development servers...');
  server && server.kill();
  client && client.kill();
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

