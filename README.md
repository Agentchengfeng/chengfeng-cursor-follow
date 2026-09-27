# chengfeng-cursor-follow

**让任意角色跟着鼠标转头的网页 Skill。适用于 Claude Code / Codex，不绑定视频模型平台。**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

<p align="center">
  <img src="docs/demo.webp" alt="角色随鼠标左右转头" width="480">
</p>

给 Agent 一个角色（现成图片，或者一句外观描述），它会：生成一张正视角色图 → 用你手上的任意图生视频模型各做一段“看左”“看右” → 抽成帧序列 → 套进落地页模板。打开网页，鼠标往哪边移，角色就把头转向哪边。

- **写实质感**：毛发、光影、转头透视都来自视频模型，代码只负责按鼠标位置切帧。
- **不写 WebGL、不抠像**：角色图用纯色背景，页面背景自动取成同色，边缘羽化融进去。
- **平台随你**：Seedance / 即梦、可灵 Kling、Veo、Runway、海螺、Pika、Wan……有 CLI、API 就让 Agent 直接调；只有网页端也行，Agent 给提示词，你生成后把视频交回去。

![页面效果：鼠标在左、中、右](docs/page-left-center-right.jpg)

## 安装

跟你的 Agent 说一句：

> 帮我安装这个 Skill：`npx -y github:Agentchengfeng/chengfeng-cursor-follow install`

或者自己在终端运行：

```bash
npx -y github:Agentchengfeng/chengfeng-cursor-follow install
npx -y github:Agentchengfeng/chengfeng-cursor-follow doctor   # 检查安装和依赖
```

前置条件：Node.js 18+、Python 3、[ffmpeg](https://ffmpeg.org/download.html)（抽帧用）。装完新开一个 Claude Code / Codex 会话。

安装器写入的位置：

| 路径 | 说明 |
|---|---|
| `~/.agents/skills/chengfeng-cursor-follow/` | Skill 本体（Codex 原生发现路径） |
| `~/.claude/skills/chengfeng-cursor-follow` | Claude Code 入口；已指向同一目录时不重复创建 |
| `~/.agents/skill-backups/` | 覆盖安装前的旧版本备份 |

## 使用

直接跟 Agent 说：

- “用 chengfeng-cursor-follow 把我的吉祥物（附图）做成跟着鼠标转头的首页。”
- “做一只穿红毛衣、表情嫌弃的西施犬，红色背景，鼠标移到哪它就瞪向哪。我用的是可灵网页版。”
- “我已经有两段转头视频 left.mp4 和 right.mp4，帮我做成网页。”

Agent 会在调用付费模型前先确认平台和大致费用。

## 工作原理

```text
正视角色图（纯色背景）
      │  同一张图作首帧，图生视频各跑一次
      ├──► look_left.mp4   头转向画面左侧
      └──► look_right.mp4  头转向画面右侧
                │
      build_frames.py：左段倒放 + 右段 → f000 … f120（中间帧 = 正视）
                │           并取帧边缘颜色写入 config.js
                ▼
      index.html：鼠标横坐标 → 帧号，缓动切帧，边缘羽化融入同色背景
```

抽帧脚本也可以单独使用：

```bash
python3 ~/.agents/skills/chengfeng-cursor-follow/scripts/build_frames.py \
  --left look_left.mp4 --right look_right.mp4 --out ./my-page --init-page
```

## 仓库结构

```text
chengfeng-cursor-follow/
├── bin/install.js                     安装 / 检查 / 卸载
├── skills/chengfeng-cursor-follow/
│   ├── SKILL.md                       五步流程：角色图 → 转头视频 → 抽帧 → 页面 → 验收
│   ├── scripts/build_frames.py        拼帧、取背景色、首帧一致性检查（Python 标准库 + ffmpeg）
│   ├── assets/template/index.html     落地页模板，读取 frames/config.js
│   └── references/
│       ├── prompts-and-models.md      角色图 / 转头视频提示词、参数建议、各平台接法
│       └── lessons.md                 试过哪些做法、哪些不推荐
└── docs/                              README 演示素材
```

## 边界

- 只做**左右转头**，不做上下跟随或环绕旋转。
- 不包含任何模型平台的账号、密钥或额度；生成费用由你使用的平台收取。
- 角色图若来自网图或他人 IP，公开上线前请换成你有权使用的素材。演示中的小狗为 AI 生成。

## 社区与支持

- Bug 与安装问题：[GitHub Issues](https://github.com/Agentchengfeng/chengfeng-cursor-follow/issues)
- 更新与教程：小红书 / 公众号 / B站 / 抖音 / 视频号「AI产品自由」，X [@chengfeng240928](https://x.com/chengfeng240928)

觉得有用的话，欢迎点个 Star。

## 许可与来源

[Apache-2.0](LICENSE)。转载、改编或再分发时请保留 [LICENSE](LICENSE) 和 [NOTICE.md](NOTICE.md) 中的署名。

官方来源：https://github.com/Agentchengfeng/chengfeng-cursor-follow · 作者：成峰 / AI产品自由
