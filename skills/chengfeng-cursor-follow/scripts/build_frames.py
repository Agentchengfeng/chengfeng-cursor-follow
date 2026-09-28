#!/usr/bin/env python3
"""把「转头看左」「转头看右」两段视频拼成一条从最左到最右的帧序列。

输入：
  --left  L.mp4   从正视开始、转头看向画面左侧的视频
  --right R.mp4   从正视开始、转头看向画面右侧的视频
  或
  --sweep S.mp4   一段已经从最左转到最右的视频（不做拼接）

输出（写进 --out 目录）：
  frames/f000.jpg ... 从最左到最右，正中间一帧为正视
  frames/config.js  帧数、背景色等，供 assets/template/index.html 读取
  index.html        仅在加 --init-page 且目标不存在时从模板复制

只依赖 Python 3 标准库和 ffmpeg / ffprobe。
"""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATE = HERE.parent / "assets" / "template" / "index.html"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=False)
    if r.returncode != 0:
        sys.exit(f"命令失败：{' '.join(map(str, cmd))}\n{r.stderr.decode(errors='replace')}")
    return r.stdout


def probe(video):
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0",
               "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
               "-of", "json", str(video)])
    s = json.loads(out)["streams"][0]
    return int(s["width"]), int(s["height"]), s.get("r_frame_rate"), s.get("nb_frames")


def extract(video, dst, step, width, quality):
    dst.mkdir(parents=True, exist_ok=True)
    vf = f"select='not(mod(n\\,{step}))',scale={width}:-2"
    run(["ffmpeg", "-loglevel", "error", "-i", str(video), "-vf", vf,
         "-vsync", "0", "-q:v", str(quality), str(dst / "%04d.jpg")])
    return sorted(dst.glob("*.jpg"))


def thumb_rgb(img, w=64, h=36):
    raw = run(["ffmpeg", "-loglevel", "error", "-i", str(img), "-vf", f"scale={w}:{h}",
               "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
    return raw


def mean_abs_diff(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / max(1, len(a))


def sample_edges(img):
    """取画面左、右、上边缘的平均色，作为页面背景色的依据。"""
    w, h = 64, 36
    raw = thumb_rgb(img, w, h)
    px = lambda x, y: raw[(y * w + x) * 3:(y * w + x) * 3 + 3]
    pts = [(1, y) for y in range(4, h - 4)] + [(w - 2, y) for y in range(4, h - 4)] + \
          [(x, 1) for x in range(8, w - 8)]
    acc = [0, 0, 0]
    for x, y in pts:
        for i, v in enumerate(px(x, y)):
            acc[i] += v
    return [round(c / len(pts)) for c in acc]


def hexc(rgb):
    return "#" + "".join(f"{max(0, min(255, int(c))):02x}" for c in rgb)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--left")
    ap.add_argument("--right")
    ap.add_argument("--sweep")
    ap.add_argument("--out", required=True, help="网页目录，帧写入 <out>/frames")
    ap.add_argument("--step", type=int, default=1, help="每隔几帧取一帧，默认 1；保留首帧后的过渡帧，避免中心亮度跳变")
    ap.add_argument("--width", type=int, default=1600, help="输出帧宽度，默认 1600")
    ap.add_argument("--quality", type=int, default=4, help="JPEG 质量 2(好)~31(差)，默认 4")
    ap.add_argument("--max-deg", type=int, default=40, help="页面角度读数的最大值，默认 40")
    ap.add_argument("--init-page", action="store_true", help="目标没有 index.html 时复制模板")
    a = ap.parse_args()

    if not a.sweep and not (a.left and a.right):
        sys.exit("需要 --left 和 --right，或者 --sweep")
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            sys.exit(f"找不到 {tool}，请先安装 ffmpeg")

    out = Path(a.out)
    frames_dir = out / "frames"
    if frames_dir.exists():
        for f in frames_dir.glob("f*.jpg"):
            f.unlink()
    frames_dir.mkdir(parents=True, exist_ok=True)
    warnings = []

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        if a.sweep:
            seq = extract(a.sweep, tmp / "S", a.step, a.width, a.quality)
            center = seq[len(seq) // 2]
        else:
            pl, pr = probe(a.left), probe(a.right)
            if pl[:2] != pr[:2]:
                warnings.append(f"两段视频分辨率不同：left {pl[0]}x{pl[1]}，right {pr[0]}x{pr[1]}")
            L = extract(a.left, tmp / "L", a.step, a.width, a.quality)
            R = extract(a.right, tmp / "R", a.step, a.width, a.quality)
            # 两段都从正视开始：左段倒放 + 右段去掉重复的第一帧
            d = mean_abs_diff(thumb_rgb(L[0]), thumb_rgb(R[0]))
            if d > 12:
                warnings.append(f"两段视频的第一帧差异偏大（{d:.1f}），正视位置可能会跳一下；"
                                "确认两段是否用同一张图作为首帧")
            seq = list(reversed(L)) + R[1:]
            center = L[0]

        for i, f in enumerate(seq):
            shutil.copy(f, frames_dir / f"f{i:03d}.jpg")
        edge = sample_edges(center)

    inner = hexc(edge)
    outer = hexc([c * 0.55 for c in edge])
    lum = 0.2126 * edge[0] + 0.7152 * edge[1] + 0.0722 * edge[2]
    cfg = {
        "count": len(seq),
        "pattern": "frames/f{i}.jpg",
        "pad": 3,
        "maxDeg": a.max_deg,
        "bgInner": inner,
        "bgOuter": outer,
        "lightBackground": lum > 150,
    }
    (frames_dir / "config.js").write_text(
        "// 由 build_frames.py 生成，重新抽帧会覆盖\nwindow.FRAMES_CONFIG = " +
        json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")

    if a.init_page:
        page = out / "index.html"
        if page.exists():
            warnings.append(f"{page} 已存在，没有覆盖")
        else:
            shutil.copy(TEMPLATE, page)

    size = sum(f.stat().st_size for f in frames_dir.glob("*.jpg"))
    print(json.dumps({
        "frames": len(seq),
        "center_index": len(seq) // 2,
        "frames_dir": str(frames_dir),
        "size_mb": round(size / 1e6, 1),
        "bg_inner": inner,
        "bg_outer": outer,
        "light_background": cfg["lightBackground"],
        "warnings": warnings,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
