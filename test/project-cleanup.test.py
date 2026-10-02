"""Run the cleanup on an isolated Git project and check data retention."""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as tmp:
    repo = Path(tmp) / 'game'
    repo.mkdir()
    def git(*args):
        return subprocess.check_output(['git', '-C', str(repo), *args])
    git('init', '-q')
    fixtures = {'cradle.json':'{"records":[{"id":"sentinel"}]}', 'logs/latest.log':'current-run',
                'logs/current-run.log':'keep active log', 'js/main.js':'export {};',
                'sol-state.sqlite3':'live checkpoint', 'gdb.json':'live catalogue'}
    for rel, value in fixtures.items():
        p = repo / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(value)
    git('add', '.')
    (repo / '.gitignore').write_bytes((ROOT / '.gitignore').read_bytes())
    cache = repo / 'tools/__pycache__/old.pyc'
    cache.parent.mkdir(parents=True)
    cache.write_bytes(b'cache')
    def run(*args):
        return json.loads(subprocess.check_output(['python3', str(ROOT/'tools/clean-project.py'), str(repo), *args]))
    before = {p: hashlib.sha256((repo/p).read_bytes()).hexdigest() for p in fixtures}
    plan = run()
    assert not plan['applied'] and plan['archive'] is None
    assert cache.exists() and b'cradle.json' in git('ls-files')
    result = run('--apply')
    assert result['applied'] and result['archive']
    archive = Path(result['archive'])
    assert archive.parent == repo.parent
    for rel, digest in before.items():
        assert hashlib.sha256((repo/rel).read_bytes()).hexdigest() == digest, rel
    tracked = git('ls-files').decode().splitlines()
    assert tracked == ['js/main.js'], tracked
    assert not cache.exists()
    assert (archive/'generated/tools/__pycache__/old.pyc').exists()
    assert (archive/'untracked-copy/cradle.json').read_bytes() == (repo/'cradle.json').read_bytes()
    repeat = run('--apply')
    assert repeat['archive'] is None and not repeat['untrack_keep_local']
print('project-cleanup: dry run, retained live data, untracking, archived caches and repeat application passed')
