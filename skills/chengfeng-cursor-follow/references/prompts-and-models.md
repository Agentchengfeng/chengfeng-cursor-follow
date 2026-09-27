# 素材提示词与视频模型接法

本 Skill 不绑定任何模型平台。只要满足两项能力就能用：

| 能力 | 用途 | 常见可选 |
|---|---|---|
| 文生图（或用户自有角色图） | 出一张正视角色图 | GPT Image、Midjourney、即梦、Flux、Nano Banana、用户自己的 IP 图 |
| 图生视频（指定首帧） | 从同一张图各生成一次“看左”“看右” | Seedance / 即梦、可灵 Kling、Veo、Runway、海螺 Hailuo、Pika、Wan 等 |

优先用用户已经在用、已登录、有额度的平台。按下面顺序确定接法：

1. **用户已有 CLI / MCP / API**（例如 VidMuse CLI、fal、Replicate、各家官方 API）：先读该工具自己的帮助或文档，确认图生视频模型名、首帧参数名、时长和分辨率参数，再调用。不要凭记忆猜参数。
2. **只有网页端**（即梦、可灵、Runway 网页等）：把下面的提示词和参数整理给用户，让用户在网页里生成并下载两段 mp4，放到约定目录后继续。
3. **用户已经有转头视频**（自己拍的、3D 渲染的）：直接进入抽帧步骤。

生成时两段视频必须：同一张首帧图、同一模型、同一分辨率、同一时长。

## 已验证模型

实际跑出过合格转头效果的组合（2026-09）：

| 用途 | 模型 | 备注 |
|---|---|---|
| 形象图 | GPT Image 2.5（text-to-image） | 16:9、1080p，纯色背景遵循度好 |
| 转头视频 | Seedance 2.5（image/frame to video） | 首帧一致性好，5 秒转头稳定，不眨眼、镜头不动 |

平台上有这两个时默认用它们。其他模型可以用，但未验证：用了要在交付时说明，并更认真地按 SKILL.md 2.4 检查。

## 角色图提示词

按用户的角色替换【】部分，保留构图和背景要求：

```text
【风格，例如 Pixar-style 3D render / photorealistic】 of 【角色描述，外观、服装】.
【表情与性格，例如 Grumpy, judgmental expression: heavy half-lidded eyes】.
The character is perfectly centered in frame, head and shoulders only,
head facing straight toward the camera, eyes looking straight at the viewer.
Head occupies the middle third of the frame.
Background: smooth seamless 【颜色名】 studio backdrop (【#hex】) with soft vignette,
no objects, no text, no props.
Soft studio lighting, ultra detailed.
```

用户想先看示例效果、或做“嫌弃脸小狗”这类形象时，可以参考这一版（背景红色 #8f1d22）：

```text
Pixar-style 3D render of a small fluffy Shih Tzu puppy with cream white fur and caramel brown floppy ears,
wearing a red knit sweater. Grumpy, judgmental expression: heavy half-lidded eyes, slight frown.
The puppy is perfectly centered in frame, head and shoulders only, head facing straight toward the camera,
eyes looking straight at the viewer. Head occupies the middle third of the frame.
Background: smooth seamless deep crimson red studio backdrop (#8f1d22) with soft vignette,
no objects, no text, no props. Soft cinematic studio lighting, subsurface scattering on fur,
shallow depth of field, ultra detailed fur.
```

- 画幅 16:9（横屏落地页）。竖屏页面用 9:16，模板里 `SUBJECT_HEIGHT` 相应调小。
- 背景必须是纯色摄影棚底。纯色背景才能不抠像直接融进页面。
- 头部只占画面中间三分之一，给转头留出左右空间，避免头转出画面。

## 转头视频提示词

两段各跑一次，只改方向那一句：

```text
Locked-off static camera, no camera movement, no zoom.
The 【character】 slowly and smoothly turns its head about 40 degrees
toward the 【left / right】 edge of the frame (screen 【left / right】),
and its eyes follow the same direction.
One single continuous motion that finishes at the end of the clip.
Body stays still. Expression stays the same, no blinking, no mouth opening.
Background stays the same plain 【颜色】. No text, no subtitles.
```

参数建议：

| 参数 | 建议 | 原因 |
|---|---|---|
| 模式 | 图生视频，首帧 = 角色图 | 两段起点完全一致，正视位置才接得上 |
| 时长 | 4～6 秒 | 太短转头急、帧少；太长容易加多余动作 |
| 分辨率 | 1080p | 抽帧时缩到 1600 宽，清晰度够 |
| 声音 | 关 | 不需要 |
| 方向用词 | 写 “screen left / edge of the frame” | 写 “its left” 会被理解成角色自己的左，方向反了 |

生成后抽几帧先看：头是否真的转了、方向是否对、脸有没有变形、背景有没有闪。任何一项不合格就单独重生成那一段，不要两段都重来。

## 示例：VidMuse CLI

以下只是“已有 CLI”这一类接法的一个例子，其他平台按各自文档改参数名：

```bash
# 角色图
vidmuse model run --output json --param '{"model_name":"gpt-image-2.5/sunburst/text-to-image","aspect_ratio":"16:9","resolution":"1080p","prompt":"..."}'

# 看左 / 看右各一次，image_urls 用上一步图片的 URL
vidmuse model run --output json --param '{"model_name":"seedance-2.5/frame_to_video","generation_type":"image_to_video","resolution":"1080p","duration":5,"generate_audio":false,"image_urls":["<图片URL>"],"prompt":"..."}'
```

长任务可能出现网关超时（HTTP 524）但后台仍在生成、仍会扣费。遇到超时先查资产列表或任务列表，不要立刻重发，避免重复扣费。
