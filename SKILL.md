---
name: chengfeng-cursor-follow-installer
description: 安装包说明：chengfeng-cursor-follow 仓库的安装入口。实际 Skill 在 skills/chengfeng-cursor-follow/，用 npx -y github:Agentchengfeng/chengfeng-cursor-follow install 安装。
---

# chengfeng-cursor-follow 安装包

这是安装包根目录，不是要直接加载的 Skill。

- 实际 Skill：[skills/chengfeng-cursor-follow/SKILL.md](skills/chengfeng-cursor-follow/SKILL.md)
- 安装：`npx -y github:Agentchengfeng/chengfeng-cursor-follow install`
- 检查：`npx -y github:Agentchengfeng/chengfeng-cursor-follow doctor`
- 卸载：`npx -y github:Agentchengfeng/chengfeng-cursor-follow uninstall`

安装器把 Skill 复制到 `~/.agents/skills/chengfeng-cursor-follow`（Codex 原生发现），并确保 `~/.claude/skills/chengfeng-cursor-follow` 可被 Claude Code 发现。已有安装会先备份到 `~/.agents/skill-backups/`。
