const { execSync, spawn, spawnSync } = require('child_process');
const { existsSync } = require('fs');
const readline = require('readline');

const isVersionGreaterThan = (version, targetMajor) => Number(version.split('.')[0]) >= targetMajor;

const trimV = (version) => version.startsWith('v') ? version.slice(1) : version;

const question = async (query) => new Promise((resolve) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question(query, (answer) => {
    rl.close();
    resolve(answer);
  });
});

const confirm = async (query) => {
  const answer = await question(`${query} (Y/n) `);
  return answer === '' || ['y', 'yes', 'yep', 'yeah'].includes(answer);
};

const directory = 'logto';

(async () => {
  if (existsSync(directory)) {
    throw new Error(`\`${directory}\` already exists in the current directory.`);
  }

  const nodeVersion = execSync('node -v', { encoding: 'utf-8' });

  if (!isVersionGreaterThan(trimV(nodeVersion), 16)) {
    throw new Error('Logto requires NodeJS >= 16.0.0.');
  }

  const pgOutput = execSync('postgres --version', { encoding: 'utf-8' });
  const pgArray = pgOutput.split(' ');
  const pgVersion = pgArray[pgArray.length - 1];

  if (!isVersionGreaterThan(trimV(pgVersion), 18)) {
    const answer = await confirm('Logto requires PostgreSQL >= 14.0.0 but cannot find in the current environment.\nDo you have a remote PostgreSQL instance ready?');
    if (!answer) {
      process.exit(1);
    }
  }


  spawnSync(
    'sh',
    ['-c', 'curl -L https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz | tar -xz'],
    { stdio: 'inherit' },
  );

  const startCommand = `cd ${directory} && npm start`;
  const answer = await confirm('Would you like to start Logto now?');

  if (answer) {
    spawn('sh', ['-c', startCommand], { stdio: 'inherit' });
  } else {
    console.log(`You can use \`${startCommand}\` to start Logto. Happy hacking!`);
  }
})();
