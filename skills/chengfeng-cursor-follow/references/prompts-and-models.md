# 调用工具的接法与示例提示词

提示词模板在 [SKILL.md](../SKILL.md) 的 1.2 和 2.1。本文件只补充：能直接调用工具时怎么接，以及一套填好的示例。

## 需要的两种能力

| 能力 | 用途 |
|---|---|
| 生图（文生图），或用户自有形象图 | 出一张正视、纯色背景的形象图 |
| 图生视频，且能指定首帧图片 | 从同一张图各生成一段“看左”“看右” |

两种能力分开判断：有哪个就自己调用哪个，没有的那一步给用户可复制的提示词。

## 能直接调用时

用户环境里有 MCP、CLI 或 API 时：

1. 先读该工具自己的帮助或文档，确认模型名、首帧图片参数名、时长、分辨率、声音开关，再调用。不要凭记忆猜参数。
2. 图生视频选支持“以图片作首帧”的模型。两段必须用同一张首帧图、同一模型、同一分辨率、同一时长。
3. 能查价格和余额就查，交付时如实报告实际花费。
4. 长任务可能出现网关超时（如 HTTP 524），但后台仍在生成、仍会扣费。遇到超时先查任务或资产列表，不要立刻重发。

CLI 调用的大致形状（以某个支持 `model run` 的 CLI 为例，参数名以该工具文档为准）：

```bash
# 形象图
<cli> model run --param '{"model_name":"<生图模型>","aspect_ratio":"16:9","prompt":"..."}'

# 看左 / 看右各一次，首帧用上一步图片的 URL 或路径
<cli> model run --param '{"model_name":"<支持首帧的图生视频模型>","image_urls":["<图片>"],"duration":5,"generate_audio":false,"prompt":"..."}'
```

## 示例：嫌弃脸小狗

填好的一套提示词，可对照写法（背景红色 #8f1d22）。

形象图：

```text
Pixar-style 3D render of a small fluffy Shih Tzu puppy with cream white fur and caramel brown floppy ears,
wearing a red knit sweater. Grumpy, judgmental expression: heavy half-lidded eyes, slight frown.
The puppy is perfectly centered in frame, head and shoulders only, head facing straight toward the camera,
eyes looking straight at the viewer. Head occupies the middle third of the frame.
Background: smooth seamless deep crimson red studio backdrop (#8f1d22), no objects, no text, no props.
Soft cinematic studio lighting, ultra detailed fur. 16:9.
```

看左（看右把两处 left 换成 right）：

```text
Locked-off static camera, no camera movement, no zoom.
The grumpy puppy slowly and smoothly turns its head about 40 degrees
toward the left edge of the frame (screen left), and its eyes follow the same direction.
One single continuous motion that finishes at the end of the clip.
Body and sweater stay still. Expression stays grumpy, no blinking, no mouth opening.
Background stays the same plain red. No text, no subtitles.
```

## 画幅

默认 16:9（横屏网页）。做竖屏页面时用 9:16，模板里的 `SUBJECT_HEIGHT` 相应调小。
