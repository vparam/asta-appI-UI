#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * setup-native.js
 *
 * Generates the native iOS Xcode project and Android Gradle project
 * scaffolding via the React Native CLI, then copies our Swift/Kotlin/
 * config overrides into the generated tree.
 *
 * Run once after `git clone`:  yarn setup
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'app');
const TEMPLATE_NAME = 'AstaPPLM';

function run(cmd, cwd = REPO_ROOT) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function ensureNoNative() {
  // Refuse to overwrite an already-set-up native project.
  for (const sub of ['ios/Podfile', 'android/build.gradle']) {
    if (fs.existsSync(path.join(APP_DIR, sub))) {
      console.error(`Native scaffolding already present (${sub}). Aborting to avoid clobber.`);
      console.error('To re-scaffold: rm -rf app/ios app/android (after backing up our overrides)');
      process.exit(1);
    }
  }
}

function scaffold() {
  // Initialise a fresh RN project in a temp dir, then copy ios/ and android/ in.
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pplm-rn-init-'));
  run(`npx --yes @react-native-community/cli init ${TEMPLATE_NAME} --skip-install --pm yarn`, tmp);
  const generated = path.join(tmp, TEMPLATE_NAME);
  for (const sub of ['ios', 'android']) {
    fs.cpSync(path.join(generated, sub), path.join(APP_DIR, sub), { recursive: true });
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

function applyOverrides() {
  console.log('\nApplying native module overrides…');
  // Our Swift/Kotlin sources already live in the repo at app/ios/AstaPPLM/Modules
  // and app/android/app/src/main/java/com/astapplm/modules — they're checked in.
  // The setup script just makes sure they survive the scaffold copy.
  console.log('  (Swift modules in app/ios/AstaPPLM/Modules)');
  console.log('  (Kotlin modules in app/android/app/src/main/java/com/astapplm/modules)');
  console.log('\nNext steps:');
  console.log('  1. Open app/ios/AstaPPLM.xcworkspace and add the AstaPPLMLiveActivity widget target.');
  console.log('  2. Add the Bridging Header (app/ios/AstaPPLM/AstaPPLM-Bridging-Header.h) under build settings.');
  console.log('  3. Merge app/ios/AstaPPLM/Info.plist.partial into the generated Info.plist.');
  console.log('  4. Merge app/android/app/src/main/AndroidManifest.partial.xml into the generated manifest.');
  console.log('  5. Add RNAstaPackage to MainApplication.kt getPackages().');
  console.log('  6. cd app/ios && pod install');
  console.log('  7. yarn server   # in one terminal');
  console.log('  8. yarn ios      # or yarn android');
}

ensureNoNative();
scaffold();
run('yarn install', REPO_ROOT);
applyOverrides();
