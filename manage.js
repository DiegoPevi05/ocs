#!/usr/bin/env node
'use strict';

/**
 * OCS project manager
 *
 * Usage:
 *   node manage.js <command>
 *   npm run <command>          (build | dev | setup)
 *
 * Commands:
 *   install   Fetch / install all dependencies (C++ FetchContent, Maven, npm)
 *   build     Sequential compile: C++ → Java → Vite  (stops on first failure)
 *   dev       Concurrent dev servers: calculator + api + web
 */

const { spawnSync, spawn } = require('child_process');
const { existsSync }       = require('fs');
const path                 = require('path');
const os                   = require('os');

// ─── Configuration ────────────────────────────────────────────────────────────

const JAVA_HOME = '/usr/lib/jvm/java-21-openjdk-amd64';

const ROOT    = __dirname;
const CPUS    = os.cpus().length;
const IS_WIN  = process.platform === 'win32';
const MVN_BIN = existsSync(path.join(ROOT, 'ocs-api', 'mvnw')) ? './mvnw' : 'mvn';
const CALC_BIN = path.join(ROOT, 'ocs-calculator', 'build', 'catenary_server');

/** Environment injected into every child process — guarantees consistent Java. */
const BASE_ENV = {
  ...process.env,
  JAVA_HOME,
  PATH: `${path.join(JAVA_HOME, 'bin')}${path.delimiter}${process.env.PATH}`,
};

// ─── ANSI ─────────────────────────────────────────────────────────────────────

const A = {
  r:  '\x1b[0m',
  b:  '\x1b[1m',
  d:  '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
};

const log  = {
  step : (msg) => console.log(`\n${A.b}${A.cyan}▸  ${msg}${A.r}`),
  ok   : (msg) => console.log(`${A.green}${A.b}✔  ${msg}${A.r}`),
  warn : (msg) => console.log(`${A.yellow}⚠  ${msg}${A.r}`),
  info : (msg) => console.log(`${A.d}    ${msg}${A.r}`),
  abort: (msg, code = 1) => { console.error(`\n${A.red}${A.b}✖  ${msg}${A.r}\n`); process.exit(code); },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Synchronous run — inherits stdio so output flows through live. */
function run(cmd, args = [], cwd = ROOT) {
  const result = spawnSync(cmd, args, {
    cwd: path.resolve(ROOT, cwd),
    stdio: 'inherit',
    shell: IS_WIN,
    env: BASE_ENV,
  });
  return result.status ?? 1;
}

/** Ensure cmake has been configured in ocs-calculator/build. */
function ensureCmakeConfigured() {
  const buildDir = path.join(ROOT, 'ocs-calculator', 'build');
  if (existsSync(path.join(buildDir, 'Makefile')) ||
      existsSync(path.join(buildDir, 'build.ninja'))) return;

  log.warn('cmake not yet configured — running cmake …');
  const rc = run('cmake', [
    '-DCMAKE_BUILD_TYPE=Release',
    '-DBUILD_CLI=OFF',
    '-B', 'build',
    '.',
  ], 'ocs-calculator');
  if (rc !== 0) log.abort(`cmake configure failed (exit ${rc})`, rc);
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * install — fetch all project dependencies without building.
 *   C++  : cmake configure  (triggers FetchContent downloads)
 *   Java : mvn dependency:go-offline
 *   JS   : npm install
 */
function cmdInstall() {
  console.log(`${A.b}Installing OCS dependencies${A.r}`);
  log.info(`JAVA_HOME = ${JAVA_HOME}`);

  // ── C++ ────────────────────────────────────────────────────────────────────
  log.step('C++  — cmake configure (downloads FetchContent deps)');
  const calcDir = path.join(ROOT, 'ocs-calculator');
  const buildDir = path.join(calcDir, 'build');
  if (existsSync(path.join(buildDir, 'Makefile')) || existsSync(path.join(buildDir, 'build.ninja'))) {
    log.warn('build/ already configured — skipping cmake (run cmake manually to reconfigure)');
  } else {
    const rc = run('cmake', [
      '-DCMAKE_BUILD_TYPE=Release',
      '-DBUILD_CLI=OFF',
      '-B', 'build',
      '.',
    ], 'ocs-calculator');
    if (rc !== 0) log.abort(`cmake configure failed (exit ${rc})`, rc);
  }
  log.ok('C++ deps ready');

  // ── Java ───────────────────────────────────────────────────────────────────
  log.step('Java  — mvn dependency:go-offline');
  log.info(`using JAVA_HOME: ${JAVA_HOME}`);
  const mvnRc = run(MVN_BIN, ['dependency:go-offline', '-q'], 'ocs-api');
  if (mvnRc !== 0) log.abort(`Maven dependency fetch failed (exit ${mvnRc})`, mvnRc);
  log.ok('Java deps ready');

  // ── JavaScript ─────────────────────────────────────────────────────────────
  log.step('JavaScript  — npm install');
  const npmRc = run('npm', ['install'], 'ocs-web');
  if (npmRc !== 0) log.abort(`npm install failed (exit ${npmRc})`, npmRc);
  log.ok('JS deps ready');

  console.log(`\n${A.b}${A.green}All dependencies installed.${A.r}\n`);
}

/**
 * build — sequential compile, stops on first failure.
 *   1. C++        cmake --build  (catenary_server)
 *   2. Java       mvn package -DskipTests
 *   3. JavaScript npm run build
 */
function cmdBuild() {
  console.log(`${A.b}Building OCS${A.r}`);
  log.info(`JAVA_HOME = ${JAVA_HOME}`);

  // ── C++ ────────────────────────────────────────────────────────────────────
  log.step('ocs-calculator  (CMake)');
  ensureCmakeConfigured();
  const cppRc = run('cmake', [
    '--build', 'build',
    '--target', 'catenary_server',
    '--', `-j${CPUS}`,
  ], 'ocs-calculator');
  if (cppRc !== 0) log.abort(`catenary_server build failed (exit ${cppRc})`, cppRc);
  log.ok('catenary_server compiled');

  // ── Java ───────────────────────────────────────────────────────────────────
  log.step('ocs-api  (Maven)');
  log.info(`using JAVA_HOME: ${JAVA_HOME}`);
  const mvnRc = run(MVN_BIN, ['package', '-DskipTests', '-q'], 'ocs-api');
  if (mvnRc !== 0) log.abort(`Maven build failed (exit ${mvnRc})`, mvnRc);
  log.ok('ocs-api packaged');

  // ── Vite ───────────────────────────────────────────────────────────────────
  log.step('ocs-web  (Vite)');
  if (!existsSync(path.join(ROOT, 'ocs-web', 'node_modules'))) {
    log.warn('node_modules missing — running npm install …');
    const installRc = run('npm', ['install'], 'ocs-web');
    if (installRc !== 0) log.abort(`npm install failed (exit ${installRc})`, installRc);
  }
  const viteRc = run('npm', ['run', 'build'], 'ocs-web');
  if (viteRc !== 0) log.abort(`Vite build failed (exit ${viteRc})`, viteRc);
  log.ok('ocs-web built');

  console.log(`\n${A.b}${A.green}All builds passed.${A.r}\n`);
}

/**
 * dev — start all three services concurrently with colour-coded output.
 * Any service crash stops everything. Ctrl+C shuts down cleanly.
 */
function cmdDev() {
  // Pre-flight checks
  if (!existsSync(CALC_BIN)) {
    log.abort(`${CALC_BIN} not found — run \`node manage.js build\` first`);
  }
  if (!existsSync(path.join(ROOT, 'ocs-web', 'node_modules'))) {
    log.abort('ocs-web/node_modules missing — run `node manage.js install` first');
  }

  const SERVICES = [
    {
      name:  'calculator',
      color: A.cyan,
      cmd:   CALC_BIN,
      args:  [],
      cwd:   path.join(ROOT, 'ocs-calculator', 'build'),
      shell: false,
    },
    {
      name:  'api',
      color: A.green,
      cmd:   MVN_BIN,
      args:  ['spring-boot:run'],
      cwd:   path.join(ROOT, 'ocs-api'),
      shell: IS_WIN,
    },
    {
      name:  'web',
      color: A.magenta,
      cmd:   'npm',
      args:  ['run', 'dev'],
      cwd:   path.join(ROOT, 'ocs-web'),
      shell: IS_WIN,
    },
  ];

  const PAD   = Math.max(...SERVICES.map(s => s.name.length));
  const pfx   = (svc) => `${svc.color}${A.b}[${svc.name.padEnd(PAD)}]${A.r} `;
  const procs = [];
  let exiting = false;

  function killAll() {
    if (exiting) return;
    exiting = true;
    procs.forEach(p => { try { p.kill('SIGTERM'); } catch (_) {} });
  }

  console.log(`\n${A.b}Starting OCS dev environment${A.r}`);
  log.info(`JAVA_HOME = ${JAVA_HOME}`);
  console.log('');
  SERVICES.forEach(svc =>
    console.log(`  ${svc.color}${A.b}•${A.r} ${svc.color}${svc.name.padEnd(PAD)}${A.r}  ${A.d}${svc.cmd} ${svc.args.join(' ')}${A.r}`)
  );
  console.log('');

  for (const svc of SERVICES) {
    const proc = spawn(svc.cmd, svc.args, {
      cwd:   svc.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: svc.shell,
      env:   BASE_ENV,
    });

    procs.push(proc);

    const tag = pfx(svc);

    let outBuf = '';
    proc.stdout.on('data', chunk => {
      outBuf += chunk.toString();
      const lines = outBuf.split('\n');
      outBuf = lines.pop();
      lines.forEach(l => { if (l) process.stdout.write(tag + l + '\n'); });
    });
    proc.stdout.on('end', () => { if (outBuf) process.stdout.write(tag + outBuf + '\n'); });

    let errBuf = '';
    proc.stderr.on('data', chunk => {
      errBuf += chunk.toString();
      const lines = errBuf.split('\n');
      errBuf = lines.pop();
      lines.forEach(l => { if (l) process.stderr.write(tag + A.red + l + A.r + '\n'); });
    });
    proc.stderr.on('end', () => { if (errBuf) process.stderr.write(tag + A.red + errBuf + A.r + '\n'); });

    proc.on('error', err => {
      console.error(`${A.red}${A.b}[${svc.name}] failed to start: ${err.message}${A.r}`);
      killAll();
      process.exit(1);
    });

    proc.on('exit', (code, signal) => {
      if (exiting) return;
      const reason = code !== null ? `exit ${code}` : `signal ${signal}`;
      console.error(`\n${A.red}${A.b}[${svc.name}] crashed (${reason}) — stopping all services${A.r}\n`);
      killAll();
      process.exit(code ?? 1);
    });
  }

  function onShutdown() {
    console.log(`\n${A.yellow}${A.b}Stopping all services…${A.r}`);
    killAll();
    setTimeout(() => {
      procs.forEach(p => { try { p.kill('SIGKILL'); } catch (_) {} });
      process.exit(0);
    }, 3000).unref();
  }

  process.on('SIGINT',  onShutdown);
  process.on('SIGTERM', onShutdown);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

const COMMANDS = { install: cmdInstall, build: cmdBuild, dev: cmdDev };

const cmd = process.argv[2];

if (!cmd || !COMMANDS[cmd]) {
  console.log(`
${A.b}OCS project manager${A.r}

  ${A.cyan}node manage.js <command>${A.r}

Commands:
  ${A.b}install${A.r}   Fetch all dependencies (C++ FetchContent, Maven, npm)
  ${A.b}build${A.r}     Sequential compile: C++ → Java → Vite
  ${A.b}dev${A.r}       Concurrent dev: calculator + api + web

npm shortcuts:
  npm run setup     → install
  npm run build     → build
  npm run dev       → dev
`);
  process.exit(cmd ? 1 : 0);
}

COMMANDS[cmd]();
