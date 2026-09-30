#!/usr/bin/env bash
# LIVING GALAXY 0.3.69 (0.3.71) — apply a patch zip, ship it, deploy it. From Termux.
#
#   tools/lg-patch.sh apply    FROM TO [ZIP|-] [TEST...]  check, branch update/TO, unzip, run the tests
#   tools/lg-patch.sh ship     TO                         commit, fast-forward main, push, drop the branch
#   tools/lg-patch.sh deploy   TO [ZIP|-] [FROM]          lg-deploy on the host, check origin + public, update the desktop copy
#   tools/lg-patch.sh all      FROM TO [ZIP|-] [TEST...]  apply → (you say y) → ship → deploy
#   tools/lg-patch.sh abort    TO                         throw away update/TO and go back to main
#   tools/lg-patch.sh prune    TO                         git rm what tools/prune/TO.txt lists (apply does this itself)
#   tools/lg-patch.sh rollback [VERSION]                  revert main's last commit, push, redeploy
#   tools/lg-patch.sh site     TO [ZIP|-] [TEST]          site zip → host, test, install, restart, check /health
#   tools/lg-patch.sh config   [set KEY VALUE | unset KEY] show the settings and where each came from; change the file
#
# ZIP "-" or left out: $LG_DOWNLOADS/LivingGalaxy-TO-patch.zip (game) or LivingGalaxy-Site-TO.zip (site).
# TEST left out on apply: every test/*.test.mjs the zip carries.
# A zip cannot delete: files a patch removes are listed in tools/prune/TO.txt
# (one repo path a line, # comments) and apply/deploy remove them (0.3.78).
#
# Settings — the environment wins, then the settings file
# ($LG_CONFIG, default ~/.config/lg-patch.env: KEY=value lines, read not run),
# then the defaults in brackets:
#   LG_REPO       the game repo                  [the repo this script sits in]
#   LG_HOST       ssh host                       [mpcbb]
#   LG_DESK       desktop game copy on the host  [Desktop/Living-Galaxy]  (relative to home; "" skips it)
#   LG_SITE_DIR   site deploy folder on the host [Desktop/lgsite-deploy]
#   LG_URL        public site                    [https://living-galaxy.com]
#   LG_PLAY       where the site serves the game [/play]  ("" if it is served at the root)
#   LG_DOWNLOADS  where patch zips land          [$HOME/storage/shared/download]
#   LG_BRANCH     the branch the host follows    [main]
#
# Every step stops at the first thing that is not as expected, and says what.

set -euo pipefail

# A patch can carry a new copy of THIS file, and bash reads a script as it runs
# it: unzipping over it mid-run would feed the rest of the run the new file's
# bytes at the old offsets. So the script runs from a private copy.
if [ -z "${LG_PATCH_COPY:-}" ]; then
  self="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
  tmp="$(mktemp "${TMPDIR:-/tmp}/lg-patch.XXXXXX")"
  cp "$self" "$tmp"
  LG_PATCH_COPY="$tmp" LG_PATCH_SELF="$self" exec bash "$tmp" "$@"
fi
trap 'rm -f "$LG_PATCH_COPY"' EXIT

# ---- settings file (0.3.71) ------------------------------------------------------
# KEY=value lines (an `export ` in front and quotes around the value are fine,
# # comments and blank lines are skipped). It is PARSED, never sourced: nothing
# in it runs. A key the environment already has is left to the environment.
KEYS="LG_REPO LG_HOST LG_DESK LG_SITE_DIR LG_URL LG_PLAY LG_DOWNLOADS LG_BRANCH"
CONF="${LG_CONFIG:-$HOME/.config/lg-patch.env}"
declare -A FROM_WHERE=()
for k in $KEYS; do [ -n "${!k+x}" ] && FROM_WHERE[$k]="environment"; done
confval() {  # confval RAW → the value: quotes off, ~/ and $HOME/ expanded
  local v="$1"
  if [[ "$v" =~ ^\"(.*)\"$ ]] || [[ "$v" =~ ^\'(.*)\'$ ]]; then v="${BASH_REMATCH[1]}"; fi
  case "$v" in "~/"*) v="$HOME/${v#\~/}" ;; '$HOME/'*) v="$HOME/${v#\$HOME/}" ;; esac
  printf '%s' "$v"
}
if [ -f "$CONF" ]; then
  n=0
  while IFS= read -r ln || [ -n "$ln" ]; do
    n=$((n + 1))
    ln="${ln%$'\r'}"
    [[ "$ln" =~ ^[[:space:]]*(#|$) ]] && continue
    if [[ "$ln" =~ ^[[:space:]]*(export[[:space:]]+)?(LG_[A-Z_]+)=(.*)$ ]]; then
      k="${BASH_REMATCH[2]}"; raw="${BASH_REMATCH[3]}"
      case " $KEYS " in *" $k "*) ;; *) printf 'lg-patch: %s:%d: unknown setting %s — ignored\n' "$CONF" "$n" "$k" >&2; continue ;; esac
      [ -n "${FROM_WHERE[$k]:-}" ] && continue
      printf -v "$k" '%s' "$(confval "$raw")"
      FROM_WHERE[$k]="$CONF"
    else
      printf 'lg-patch: %s:%d: not a KEY=value line — ignored\n' "$CONF" "$n" >&2
    fi
  done < "$CONF"
fi

HERE="$(cd "$(dirname "$LG_PATCH_SELF")/.." && pwd)"
REPO="${LG_REPO:-$HERE}"
HOST="${LG_HOST:-mpcbb}"
DESK="${LG_DESK-Desktop/Living-Galaxy}"
SITE_DIR="${LG_SITE_DIR:-Desktop/lgsite-deploy}"
URL="${LG_URL:-https://living-galaxy.com}"
PLAY="${LG_PLAY-/play}"
DL="${LG_DOWNLOADS:-$HOME/storage/shared/download}"
BRANCH="${LG_BRANCH:-main}"
SKIPPED=0
# Read once, then kept from every child: a patch's tests (this repo's own
# test/lgpatch.test.mjs runs this script against a throwaway repo) must never
# inherit LG_REPO and act on the real one.
for v in $(compgen -e | grep '^LG_' || true); do export -n "$v"; done

say()  { printf '\033[36m▸\033[0m %s\n' "$*"; }
good() { printf '\033[32m✓\033[0m %s\n' "$*"; }
stop() { printf '\033[31mSTOP:\033[0m %s\n' "$*" >&2; exit 1; }
need() { [ $# -ge 1 ] && [ -n "$1" ] || stop "$2"; }
vers() { [[ "$1" =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]] || stop "\"$1\" is not a version (like 0.3.69)"; }
line() { printf 'export const VERSION = "%s";' "$1"; }
at()   { grep -Fqx "$(line "$1")" "$REPO/js/version.js"; }
now()  { sed -n 's/^export const VERSION = "\(.*\)";$/\1/p' "$REPO/js/version.js"; }
vge() {      # vge A B — is version A at or past B? (pure bash: Termux sort may lack -V)
  local IFS=. i; local -a a=($1) b=($2)
  for i in 0 1 2; do
    (( ${a[i]:-0} > ${b[i]:-0} )) && return 0
    (( ${a[i]:-0} < ${b[i]:-0} )) && return 1
  done
  return 0
}
zipof() { local z="${1:--}"; [ "$z" = "-" ] && z="$DL/$2"; printf '%s' "$z"; }

unpack() {   # unpack ZIP DIR — unzip if there is one, python's zipfile if not
  if command -v unzip >/dev/null 2>&1; then unzip -oq "$1" -d "$2"
  else python3 -m zipfile -e "$1" "$2"; fi
}
listzip() {  # names in a zip, one a line
  if command -v unzip >/dev/null 2>&1; then unzip -Z1 "$1"
  else python3 -c 'import sys,zipfile; print("\n".join(zipfile.ZipFile(sys.argv[1]).namelist()))' "$1"; fi
}
prunelist() {  # prunelist DIR TO → the safe paths tools/prune/TO.txt names, one a line
  local f="$1/tools/prune/$2.txt" p
  [ -f "$f" ] || return 0
  while IFS= read -r p || [ -n "$p" ]; do
    p="${p%$'\r'}"; p="${p#"${p%%[![:space:]]*}"}"; p="${p%"${p##*[![:space:]]}"}"
    [[ -z "$p" || "$p" == \#* ]] && continue
    [[ "$p" == /* || "$p" == *..* ]] && stop "tools/prune/$2.txt: refusing \"$p\" — repo-relative paths only"
    printf '%s\n' "$p"
  done < "$f"
}
doprune() {   # doprune TO — git rm every listed file still in the tree
  local p n=0 list
  list="$(prunelist "$REPO" "$1")" || exit 1
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    [ -e "$REPO/$p" ] || continue
    git -C "$REPO" rm -q --cached --ignore-unmatch -- "$p" >/dev/null
    rm -f "$REPO/$p"; n=$((n + 1))
  done <<< "$list"
  [ "$n" -gt 0 ] && say "pruned $n file(s) listed in tools/prune/$1.txt"
  return 0
}
clean() {
  local dirty; dirty="$(git -C "$REPO" status --porcelain)"
  [ -z "$dirty" ] || { git -C "$REPO" status --short >&2; stop "the repo has uncommitted changes — commit or review them first"; }
}
remote() {   # remote SCRIPT-TEXT ARGS... — runs on the host with a terminal (sudo can ask)
  local f; f="$(mktemp "${TMPDIR:-/tmp}/lg-remote.XXXXXX")"
  printf '%s\n' "$1" > "$f"; shift
  scp -q "$f" "$HOST:/tmp/lg-remote.sh"
  rm -f "$f"
  ssh -t "$HOST" bash /tmp/lg-remote.sh "$@"
}

# ---- apply ---------------------------------------------------------------------
cmd_apply() {
  need "${1:-}" "apply FROM TO [ZIP|-] [TEST...]"; need "${2:-}" "apply FROM TO [ZIP|-] [TEST...]"
  local from="$1" to="$2"; vers "$from"; vers "$to"
  local zip; zip="$(zipof "${3:-}" "LivingGalaxy-$to-patch.zip")"; shift $(( $# >= 3 ? 3 : $# ))
  cd "$REPO"
  clean
  say "main ← origin"
  git switch -q "$BRANCH"
  git pull -q --ff-only origin "$BRANCH"
  local cur; cur="$(now)"
  # 0.3.70: already there (applied by hand, or an earlier run) is done, not an error;
  # a leftover update/TO that main already contains is dropped (git refuses if it is not)
  if [ -n "$cur" ] && vge "$cur" "$to"; then
    if git show-ref --verify -q "refs/heads/update/$to"; then
      git branch -q -d "update/$to" 2>/dev/null && say "dropped update/$to — main already has it" \
        || stop "main is at $cur but update/$to has commits main does not — look at it: git log $BRANCH..update/$to"
    fi
    good "main is already at $cur — $to is applied, nothing to do"
    SKIPPED=1
    return 0
  fi
  [ -f "$zip" ] || stop "no patch at $zip"
  git show-ref --verify -q "refs/heads/update/$to" && stop "branch update/$to already exists — ship it, or: tools/lg-patch.sh abort $to"
  at "$from" || stop "main is at $cur, not $from — apply the patches in order"
  git switch -q -c "update/$to"
  say "unzipping $(basename "$zip")"
  unpack "$zip" .
  at "$to" || stop "after unzipping, js/version.js says $(now), not $to — wrong zip? (tools/lg-patch.sh abort $to)"
  doprune "$to"
  git diff --check || stop "whitespace errors in the patch (tools/lg-patch.sh abort $to)"
  local tests=("$@")
  if [ ${#tests[@]} -eq 0 ]; then
    mapfile -t tests < <(listzip "$zip" | grep -E '^test/[^/]+\.test\.mjs$' || true)
  fi
  [ ${#tests[@]} -gt 0 ] || say "no tests named and none in the zip — nothing run"
  for t in "${tests[@]}"; do
    [ -f "$t" ] || stop "no test $t"
    say "node $t"
    node --import ./test/three-register.mjs "$t" || stop "$t failed — the branch is left for you to look at (tools/lg-patch.sh abort $to)"
  done
  git status --short
  git diff --stat
  good "update/$to applied and tested — review it, then: tools/lg-patch.sh ship $to"
}

# ---- ship ----------------------------------------------------------------------
cmd_ship() {
  need "${1:-}" "ship TO"; local to="$1"; vers "$to"
  cd "$REPO"
  git switch -q "update/$to" 2>/dev/null || stop "no branch update/$to — apply it first"
  at "$to" || stop "update/$to is at $(now), not $to"
  git add -A
  if git diff --cached --quiet; then say "nothing new to commit on update/$to"
  else git commit -q -m "Living Galaxy $to"; fi
  git switch -q "$BRANCH"
  git merge -q --ff-only "update/$to" || stop "$BRANCH moved since apply — rebase update/$to on it and test again"
  git push -q origin "$BRANCH"
  git branch -q -d "update/$to"
  good "$to is on origin/$BRANCH ($(git rev-parse --short HEAD))"
}

# ---- deploy --------------------------------------------------------------------
fetchver() { sed -n 's/^export const VERSION = "\(.*\)";$/\1/p'; }
prevver() {  # prevver TO → the version main had before TO (from js/version.js's history), or ""
  local c v
  for c in $(git -C "$REPO" log --format=%H -n 40 "$BRANCH" -- js/version.js 2>/dev/null); do
    v="$(git -C "$REPO" show "$c:js/version.js" 2>/dev/null | fetchver || true)"
    [ -n "$v" ] && [ "$v" != "$1" ] && ! vge "$v" "$1" && { printf '%s' "$v"; return 0; }
  done
  return 0
}
cmd_deploy() {
  need "${1:-}" "deploy TO [ZIP|-] [FROM]"; local to="$1"; vers "$to"
  local zip; zip="$(zipof "${2:-}" "LivingGalaxy-$to-patch.zip")"
  local from="${3:-}"; [ -n "$from" ] || from="$(prevver "$to")"
  [ -z "$from" ] || vers "$from"
  say "lg-deploy on $HOST"
  ssh "$HOST" lg-deploy
  local got
  got="$(ssh "$HOST" "curl -fsS http://127.0.0.1:8200$PLAY/js/version.js" | fetchver || true)"
  [ "$got" = "$to" ] || stop "origin serves ${got:-nothing} — expected $to (ssh $HOST 'journalctl -u lg-update -n 40')"
  good "origin: $to"
  local i
  for i in 1 2 3 4; do
    got="$(curl -fsS -H 'Cache-Control: no-cache' "$URL$PLAY/js/version.js?lgp=$RANDOM" | fetchver || true)"
    [ "$got" = "$to" ] && break
    [ "$i" -lt 4 ] && { say "public says ${got:-nothing}, waiting 20 s"; sleep 20; }
  done
  [ "$got" = "$to" ] || stop "public $URL serves ${got:-nothing} — expected $to (Cloudflare cache? purge $PLAY/js/version.js)"
  good "public: $to"
  [ -n "$DESK" ] || { say "LG_DESK empty — desktop copy skipped"; return 0; }
  # the zip travels under its own version's name, so a stale one from an
  # earlier run can never be the one unpacked
  local rz="/tmp/lg-game-patch-$to.zip"
  if [ -f "$zip" ]; then scp -q "$zip" "$HOST:$rz"; else say "no zip at $zip — a plain-folder desktop copy cannot be patched (a git clone still pulls)"; fi
  remote '
set -e
d="$HOME/$1"; to="$2"; branch="$3"; from="$4"; rz="$5"
ver() { sed -n "s/^export const VERSION = \"\(.*\)\";\$/\1/p" "$d/js/version.js" 2>/dev/null; }
done_() { rm -f "$rz" /tmp/lg-remote.sh; }
[ -d "$d" ] || { done_; echo "STOP: no desktop copy at $d — tools/lg-patch.sh config set LG_DESK <folder under your home>"; exit 1; }
was="$(ver)"
if [ -d "$d/.git" ]; then
  git -C "$d" pull -q --ff-only origin "$branch"
elif [ "$was" = "$to" ]; then
  echo "desktop copy already at $to"
elif [ -z "$from" ] || [ "$was" != "$from" ]; then
  # 0.3.71: a changed-files-only zip over a folder at any OTHER version would
  # stamp it $to while leaving out everything between — refuse, and say how
  done_
  echo "STOP: $d is a plain folder at ${was:-an unknown version}; this zip takes ${from:-the previous version} to $to."
  echo "      Make it a git clone once and every deploy pulls it instead:"
  echo "      on $(hostname): cd ~ && mv $1 $1.old && git clone -q \$(git -C /srv/living-galaxy/src/game remote get-url origin) $1"
  exit 1
elif [ -f "$rz" ]; then
  python3 -m zipfile -e "$rz" "$d"
  if [ -f "$d/tools/prune/$to.txt" ]; then
    while IFS= read -r p || [ -n "$p" ]; do
      p="${p%$'\r'}"; case "$p" in ""|"#"*|/*|*..*) continue ;; esac
      rm -f "$d/$p"
    done < "$d/tools/prune/$to.txt"
  fi
else
  done_; echo "STOP: $d is a plain folder at $was and there is no zip to apply"; exit 1
fi
done_
[ "$(ver)" = "$to" ] || { echo "STOP: desktop copy is at $(ver), not $to"; exit 1; }
echo "desktop copy: $to"
' "$DESK" "$to" "$BRANCH" "$from" "$rz"
  good "$to deployed"
}

# ---- config (0.3.71) ---------------------------------------------------------------
cmd_config() {
  case "${1:-}" in
    "")
      echo "settings file: $CONF$([ -f "$CONF" ] || echo " (none yet)")"
      local k val
      for k in $KEYS; do
        case "$k" in
          LG_REPO) val="$REPO" ;; LG_HOST) val="$HOST" ;; LG_DESK) val="$DESK" ;; LG_SITE_DIR) val="$SITE_DIR" ;;
          LG_URL) val="$URL" ;; LG_PLAY) val="$PLAY" ;; LG_DOWNLOADS) val="$DL" ;; LG_BRANCH) val="$BRANCH" ;;
        esac
        printf '  %-13s %-44s %s\n' "$k" "${val:-\"\"}" "${FROM_WHERE[$k]:-default}"
      done ;;
    set)
      local k="${2:-}"; [ $# -ge 3 ] || stop "config set KEY VALUE"
      case " $KEYS " in *" $k "*) ;; *) stop "$k is not a setting ($KEYS)" ;; esac
      local v="$3"
      [[ "$v" != *$'\n'* ]] || stop "a value is one line"
      mkdir -p "$(dirname "$CONF")"
      touch "$CONF"
      grep -v -E "^[[:space:]]*(export[[:space:]]+)?$k=" "$CONF" > "$CONF.tmp" || true
      printf '%s="%s"\n' "$k" "$v" >> "$CONF.tmp"
      mv "$CONF.tmp" "$CONF"
      good "$k=\"$v\" in $CONF"
      [ "${FROM_WHERE[$k]:-}" = "environment" ] && say "note: $k is also set in your environment, which wins — remove it there (~/.bashrc?) for the file to count"
      return 0 ;;
    unset)
      local k="${2:-}"; need "$k" "config unset KEY"
      [ -f "$CONF" ] || { say "no settings file"; return 0; }
      grep -v -E "^[[:space:]]*(export[[:space:]]+)?$k=" "$CONF" > "$CONF.tmp" || true
      mv "$CONF.tmp" "$CONF"
      good "$k removed from $CONF" ;;
    *) stop "config [set KEY VALUE | unset KEY]" ;;
  esac
}

# ---- all -----------------------------------------------------------------------
cmd_all() {
  need "${1:-}" "all FROM TO [ZIP|-] [TEST...]"; need "${2:-}" "all FROM TO [ZIP|-] [TEST...]"
  local to="$2" zip="${3:--}"
  SKIPPED=0
  cmd_apply "$@"
  [ "$SKIPPED" = 1 ] && return 0
  local raw="" yes
  read -r -p "Ship $to to origin/$BRANCH and deploy it? [y/N] " raw || true   # no answer (EOF) is a no, not a crash
  # 0.3.70: a phone keyboard can add a trailing space or a capital, and a
  # terminal a carriage return — "y" means y however it arrives
  yes="$(printf '%s' "$raw" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')"
  case "$yes" in
    y|yes) ;;
    *) say "left on update/$to (answer read as $(printf '%q' "$raw")) — ship or abort when ready"; return 0 ;;
  esac
  cmd_ship "$to"
  cmd_deploy "$to" "$zip" "$1"
}

# ---- abort ---------------------------------------------------------------------
cmd_prune() {
  need "${1:-}" "prune TO"; local to="$1"; vers "$to"
  cd "$REPO"
  at "$to" || stop "js/version.js says $(now), not $to"
  [ -f "tools/prune/$to.txt" ] || stop "no tools/prune/$to.txt — nothing to prune"
  doprune "$to"
  good "prune $to done — review git status, then: tools/lg-patch.sh ship $to"
}
cmd_abort() {
  need "${1:-}" "abort TO"; local to="$1"; vers "$to"
  cd "$REPO"
  git show-ref --verify -q "refs/heads/update/$to" || stop "no branch update/$to"
  [ "$(git branch --show-current)" = "update/$to" ] || stop "you are on $(git branch --show-current), not update/$to — switch to it first so nothing else is thrown away"
  say "dropping everything on update/$to"
  git reset -q --hard
  git clean -qfd
  git switch -q "$BRANCH"
  git branch -q -D "update/$to"
  good "back on $BRANCH at $(now)"
}

# ---- rollback ------------------------------------------------------------------
cmd_rollback() {
  cd "$REPO"
  clean
  git switch -q "$BRANCH"
  git pull -q --ff-only origin "$BRANCH"
  local was; was="$(now)"
  [ -z "${1:-}" ] || [ "$1" = "$was" ] || stop "$BRANCH is at $was, not $1 — nothing reverted"
  git revert --no-edit HEAD >/dev/null
  local back; back="$(now)"
  [ "$back" != "$was" ] || stop "reverting HEAD left the version at $was — that commit was not a patch; undo with: git reset --hard HEAD~1"
  git push -q origin "$BRANCH"
  good "reverted $was → $back on origin/$BRANCH"
  ( DESK=""; cmd_deploy "$back" - )
  say "desktop copy not touched: if it is a git clone, ssh $HOST 'git -C ~/$DESK pull --ff-only'"
}

# ---- site ----------------------------------------------------------------------
cmd_site() {
  need "${1:-}" "site TO [ZIP|-] [TEST]"; local to="$1"; vers "$to"
  local zip; zip="$(zipof "${2:-}" "LivingGalaxy-Site-$to.zip")"
  local test="${3:-}"
  [ -f "$zip" ] || stop "no site zip at $zip"
  if [ -z "$test" ]; then test="$(listzip "$zip" | grep -E '^test/[^/]+\.test\.(mjs|py)$' | head -1 || true)"; fi
  scp -q "$zip" "$HOST:/tmp/lgsite-patch.zip"
  remote '
set -e
cd "$HOME/$1"; to="$2"; test="$3"
python3 -m zipfile -e /tmp/lgsite-patch.zip .
rm -f /tmp/lgsite-patch.zip /tmp/lg-remote.sh
if [ -n "$test" ]; then
  echo "▸ $test"
  case "$test" in *.py) python3 "$test" ;; *) node "$test" ;; esac
fi
sudo bash deploy/install.sh --only site --force
sudo systemctl restart lgsite
for i in 1 2 3 4 5; do sleep 2; h="$(curl -fsS http://127.0.0.1:8200/health || true)"; [ -n "$h" ] && break; done
echo "$h" | grep -Fq "\"$to\"" || { echo "STOP: /health says ${h:-nothing}, not $to"; exit 1; }
echo "site: $to"
' "$SITE_DIR" "$to" "$test"
  good "site $to installed"
}

case "${1:-}" in
  apply) shift; cmd_apply "$@" ;;
  ship) shift; cmd_ship "$@" ;;
  deploy) shift; cmd_deploy "$@" ;;
  all) shift; cmd_all "$@" ;;
  abort) shift; cmd_abort "$@" ;;
  prune) shift; cmd_prune "$@" ;;
  rollback) shift; cmd_rollback "$@" ;;
  site) shift; cmd_site "$@" ;;
  config) shift; cmd_config "$@" ;;
  *) sed -n '2,31p' "$LG_PATCH_SELF" | sed 's/^# \{0,1\}//'; [ -n "${1:-}" ] && exit 2 || exit 0 ;;
esac
