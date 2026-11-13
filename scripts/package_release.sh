#!/usr/bin/env bash
# CardCraft 思源映卡 (siyuan-cardcraft) - Bazaar 集市发行包构建脚本
# 严格排除 .private/ 私钥与卡密库存、tools/ 发卡脚本、.git 等非集市文件

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$ROOT_DIR/release"
STAGE_DIR="$RELEASE_DIR/.stage_pkg"
OUT_ZIP="$RELEASE_DIR/package.zip"

rm -rf "$STAGE_DIR" "$OUT_ZIP"
mkdir -p "$STAGE_DIR/i18n"

# 仅复制集市运行与展示所需的白名单文件（杜绝任何私钥或发卡工具混入）
cp "$ROOT_DIR/plugin.json" "$STAGE_DIR/"
cp "$ROOT_DIR/index.js" "$STAGE_DIR/"
cp "$ROOT_DIR/index.css" "$STAGE_DIR/"
cp "$ROOT_DIR/pricing_channels.json" "$STAGE_DIR/"
cp "$ROOT_DIR/icon.png" "$STAGE_DIR/"
cp "$ROOT_DIR/preview.png" "$STAGE_DIR/"
cp "$ROOT_DIR/README.md" "$STAGE_DIR/"
cp "$ROOT_DIR/README.zh-CN.md" "$STAGE_DIR/"
cp "$ROOT_DIR/LICENSE" "$STAGE_DIR/"
cp "$ROOT_DIR/i18n/zh_CN.json" "$STAGE_DIR/i18n/"
cp "$ROOT_DIR/i18n/en_US.json" "$STAGE_DIR/i18n/"

# 使用 Python zipfile 打包，确保 100% 正斜杠 '/' 路径、无符号链接、无 macOS __MACOSX 脏目录
python3 - "$STAGE_DIR" "$OUT_ZIP" <<'PY'
import os
import sys
import zipfile

stage_dir, out_zip = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, dirs, files in os.walk(stage_dir):
        dirs.sort()
        files.sort()
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, stage_dir).replace(os.sep, "/")
            if ".private" in rel_path or rel_path.endswith(".pem") or "stock_" in rel_path:
                raise RuntimeError(f"SECURITY ABORT: forbidden file {rel_path}")
            zf.write(full_path, rel_path)
PY

rm -rf "$STAGE_DIR"

echo "✅ Bazaar package built successfully: $OUT_ZIP"
ls -lh "$OUT_ZIP"
unzip -l "$OUT_ZIP"
