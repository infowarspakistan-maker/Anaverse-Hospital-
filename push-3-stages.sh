#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./push-3-stages.sh <YOUR_GITHUB_REPO_URL>"
  echo "Example: ./push-3-stages.sh https://github.com/username/anaverse-hospital-erp.git"
  exit 1
fi

REPO_URL="$1"
GIT_CMD="git --git-dir=/tmp/anaverse-git/.git --work-tree=/app/applet"

# Ensure git repo exists if /tmp was cleared
if [ ! -d "/tmp/anaverse-git/.git" ]; then
  mkdir -p /tmp/anaverse-git
  $GIT_CMD init -b main
  $GIT_CMD config user.name "Anaverse Hospital ERP"
  $GIT_CMD config user.email "infowarspakistan@gmail.com"

  echo "==> Re-indexing Stage 1 (58 files: Core Source + UI Media)..."
  $GIT_CMD add .gitignore .env.example README.md push-3-stages.sh index.html metadata.json package.json bun.lock tsconfig.json vite.config.ts server.ts firebase-applet-config.json src/ public/*.gif public/assets/ public/facilities/ public/health-news/ public/services/
  $GIT_CMD commit -m "Stage 1: Core Hospital ERP, EMR, LIS backend & UI media assets"
  $GIT_CMD branch -f stage-1 HEAD

  echo "==> Re-indexing Stage 2 (50 files: Smooth Scroll Frames 001–050)..."
  for i in $(seq -f "%03g" 1 50); do $GIT_CMD add "public/frames/ezgif-frame-${i}.jpg"; done
  $GIT_CMD commit -m "Stage 2: Add smooth scroll sequence frames 001 to 050 (50 files)"
  $GIT_CMD branch -f stage-2 HEAD

  echo "==> Re-indexing Stage 3 (50 files: Smooth Scroll Frames 051–100)..."
  $GIT_CMD add public/frames/
  $GIT_CMD commit -m "Stage 3: Add smooth scroll sequence frames 051 to 100 (50 files)"
  $GIT_CMD branch -f stage-3 HEAD
fi

$GIT_CMD remote remove origin 2>/dev/null || true
$GIT_CMD remote add origin "$REPO_URL"

echo "🚀 [1/3] Pushing Stage 1 (Core ERP Code & UI Assets — 58 files)..."
$GIT_CMD push -u origin stage-1:main

echo "🚀 [2/3] Pushing Stage 2 (Smooth Scroll Sequence 001–050 — 50 files)..."
$GIT_CMD push origin stage-2:main

echo "🚀 [3/3] Pushing Stage 3 (Smooth Scroll Sequence 051–100 — 50 files)..."
$GIT_CMD push origin stage-3:main

echo "✅ All 3 stages (158 files total) pushed to $REPO_URL successfully!"
