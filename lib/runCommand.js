const { execSync } = require('child_process');

function runCommand (cmd, NODE_ENV) {
  execSync(cmd, {
    env: {
      NODE_ENV: NODE_ENV,
      PATH: process.env.PATH
    },
    stdio: ['inhrit', 'inherit', 'inherit'],
  });
};

module.exports = runCommand;
