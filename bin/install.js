#!/usr/bin/env node
'use strict';

// 安装 chengfeng-cursor-follow Skill：
// - 实体目录写入 ~/.agents/skills/<name>（Codex 原生发现路径）
// - Claude Code 通过 ~/.claude/skills/<name> 发现；若该路径与实体目录不是同一处，则建软链
// 仅测试时用 CURSOR_FOLLOW_HOME 指向临时目录，避免改动真实用户目录。

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const HOME = process.env.CURSOR_FOLLOW_HOME || os.homedir();
const PKG_ROOT = path.resolve(__dirname, '..');
const PKG_SKILLS = path.join(PKG_ROOT, 'skills');
const AGENTS_SKILLS = path.join(HOME, '.agents', 'skills');
const CLAUDE_SKILLS = path.join(HOME, '.claude', 'skills');
const BACKUPS = path.join(HOME, '.agents', 'skill-backups');
const SKILLS = ['chengfeng-cursor-follow'];
const REPO = 'chengfeng-cursor-follow';

const log = (s = '') => process.stdout.write(s + '\n');

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
}

function realOrNull(p) {
  try { return fs.realpathSync(p); } catch (_) { return null; }
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.isSymbolicLink()) {
      try { fs.rmSync(d, { force: true, recursive: true }); } catch (_) {}
      fs.symlinkSync(fs.readlinkSync(s), d);
    } else {
      fs.copyFileSync(s, d);
      try { fs.chmodSync(d, fs.statSync(s).mode); } catch (_) {}
    }
  }
}

// 已有安装先备份再移除；是软链则只移除链接本身，不动它指向的源码
function backupAndRemove(target, label) {
  let st;
  try { st = fs.lstatSync(target); } catch (_) { return null; }
  if (st.isSymbolicLink()) {
    const was = fs.readlinkSync(target);
    fs.unlinkSync(target);  // rmSync 对指向目录的软链会报 EISDIR
    return `(symlink removed, was -> ${was})`;
  }
  fs.mkdirSync(BACKUPS, { recursive: true });
  const backup = path.join(BACKUPS, `${label}-${timestamp()}`);
  copyDir(target, backup);
  fs.rmSync(target, { recursive: true, force: true });
  return backup;
}

function installSkill(name) {
  const src = path.join(PKG_SKILLS, name);
  const dst = path.join(AGENTS_SKILLS, name);
  if (!fs.existsSync(src)) throw new Error(`Missing packaged skill: ${src}`);
  fs.mkdirSync(AGENTS_SKILLS, { recursive: true });
  const backup = backupAndRemove(dst, name);
  copyDir(src, dst);
  for (const file of ['LICENSE', 'NOTICE.md', 'CITATION.cff']) {
    const packaged = path.join(PKG_ROOT, file);
    if (fs.existsSync(packaged)) fs.copyFileSync(packaged, path.join(dst, file));
  }
  log(`  ✓ ${name} -> ${dst}`);
  if (backup) log(`    previous copy: ${backup}`);
}

function linkClaudeSkill(name) {
  const target = path.join(AGENTS_SKILLS, name);
  const link = path.join(CLAUDE_SKILLS, name);
  // ~/.claude/skills 本身就指向 ~/.agents/skills 时，无需再建链
  if (realOrNull(link) && realOrNull(link) === realOrNull(target)) {
    log(`  ✓ Claude Code already sees ${name} (${link})`);
    return;
  }
  fs.mkdirSync(CLAUDE_SKILLS, { recursive: true });
  const backup = backupAndRemove(link, `${name}-claude`);
  fs.symlinkSync(target, link);
  log(`  ✓ Claude Code link ${link} -> ${target}`);
  if (backup) log(`    previous copy: ${backup}`);
}

function doctor() {
  let ok = true;
  for (const name of SKILLS) {
    const skill = path.join(AGENTS_SKILLS, name, 'SKILL.md');
    const notice = path.join(AGENTS_SKILLS, name, 'NOTICE.md');
    const script = path.join(AGENTS_SKILLS, name, 'scripts', 'build_frames.py');
    const claude = path.join(CLAUDE_SKILLS, name, 'SKILL.md');
    const checks = [
      ['Skill (Codex / ~/.agents)', skill],
      ['Attribution notice', notice],
      ['Frame builder script', script],
      ['Claude Code entry', claude],
    ];
    for (const [label, p] of checks) {
      const exists = fs.existsSync(p);
      log(`${exists ? '✓' : '✗'} ${label}: ${p}`);
      ok = ok && exists;
    }
  }
  for (const [cmd, label, required] of [
    ['python3 --version', 'python3', true],
    ['ffmpeg -version', 'ffmpeg', false],
    ['ffprobe -version', 'ffprobe', false],
  ]) {
    try {
      execSync(cmd, { stdio: 'ignore' });
      log(`✓ ${label} available`);
    } catch (_) {
      log(`${required ? '✗' : '!'} ${label} not found${required ? '' : ' (needed when building frames; install ffmpeg)'}`);
      if (required) ok = false;
    }
  }
  process.exit(ok ? 0 : 1);
}

function uninstall() {
  for (const name of SKILLS) {
    const link = path.join(CLAUDE_SKILLS, name);
    try {
      if (fs.lstatSync(link).isSymbolicLink()) fs.unlinkSync(link);
    } catch (_) {}
    const dst = path.join(AGENTS_SKILLS, name);
    if (fs.existsSync(dst)) {
      const backup = backupAndRemove(dst, `${name}-removed`);
      log(`  ✓ removed ${name}; backup: ${backup}`);
    }
  }
}

function help() {
  log(REPO);
  log('');
  log('Usage:');
  log(`  npx -y github:Agentchengfeng/${REPO} install`);
  log(`  npx -y github:Agentchengfeng/${REPO} doctor`);
  log(`  npx -y github:Agentchengfeng/${REPO} uninstall`);
  log('');
  log('Commands: install, doctor, uninstall, help');
  log('For tests only: set CURSOR_FOLLOW_HOME=/tmp/some-home.');
}

function main() {
  let args = process.argv.slice(2);
  if (args[0] === 'cpm') args = args.slice(1);
  const cmd = args[0] || 'install';
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') return help();
  if (cmd === 'doctor') return doctor();
  if (cmd === 'uninstall') return uninstall();
  if (cmd !== 'install') {
    log(`Unknown command: ${cmd}`);
    help();
    process.exit(1);
  }
  log(`▶ Installing ${REPO}`);
  for (const name of SKILLS) installSkill(name);
  for (const name of SKILLS) linkClaudeSkill(name);
  log('');
  log('Done. Open a new Claude Code / Codex session so the skill list reloads.');
}

main();
