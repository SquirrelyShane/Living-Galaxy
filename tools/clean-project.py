#!/usr/bin/env python3
"""Report or archive generated debris; retain live files when untracking them."""
import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import uuid

CACHE_DIRS = {"__pycache__", ".pytest_cache", ".cache", "_scratch"}


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args])


def clean(root, apply=False):
    root = Path(root).resolve()
    if Path(os.fsdecode(git(root, "rev-parse", "--show-toplevel")).strip()).resolve() != root:
        raise ValueError("Use the repository root, not a subfolder.")
    untrack = [os.fsdecode(p) for p in git(root, "ls-files", "-ci", "--exclude-standard", "-z").split(b"\0") if p]
    generated = []
    for base, dirs, files in os.walk(root, followlinks=False):
        for name in list(dirs):
            p = Path(base) / name
            if name in {".git", "node_modules", "logs", "archives", "backups"} or p.is_symlink():
                dirs.remove(name)
            elif name in CACHE_DIRS:
                generated.append(p.relative_to(root).as_posix())
                dirs.remove(name)
        for name in files:
            p = Path(base) / name
            if p.suffix in {".pyc", ".pyo"} and not p.is_symlink():
                generated.append(p.relative_to(root).as_posix())
    result = {"applied": apply, "untrack_keep_local": untrack, "archive_generated": generated, "archive": None}
    if not apply or not (untrack or generated):
        return result
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    archive = root.parent / f"{root.name}-cleanup-{stamp}-{uuid.uuid4().hex[:8]}"
    archive.mkdir(mode=0o700)
    result["archive"] = str(archive)
    # Copy tracked runtime artifacts before changing their index entries.
    # git rm --cached never removes the live working-tree files.
    for rel in untrack:
        src = root / rel
        if src.is_file() or src.is_symlink():
            dst = archive / "untracked-copy" / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst, follow_symlinks=False)
    if untrack:
        git(root, "rm", "--cached", "-f", "--ignore-unmatch", "--", *untrack)
    # Disposable caches are moved, never discarded. Logs and ledgers stay put.
    for rel in generated:
        src = root / rel
        if src.exists():
            dst = archive / "generated" / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dst))
    (archive / "manifest.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", nargs="?", default=".")
    parser.add_argument("--apply", action="store_true", help="Untrack ignored files and move disposable caches to a sibling archive.")
    args = parser.parse_args()
    print(json.dumps(clean(args.repo, args.apply), indent=2))
