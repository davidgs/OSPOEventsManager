#!/usr/bin/env bash
# Usage: ./latest_mod_date.sh [directory]
set -euo pipefail

DIR="${1:-.}"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS (BSD stat/date)
  DELIM=$'\t'
  FORMAT=$'%m\t%N'                               # real tab between %m and %N
  human_date() { date -r "$1" "+%Y-%m-%d %H:%M:%S %z"; }
  latest_line=$(
    find "$DIR" -type f -print0 2>/dev/null \
      | xargs -0 stat -f "$FORMAT" 2>/dev/null \
      | sort -nr -k1,1 | head -n1
  )
else
  # Linux (GNU stat/date)
  DELIM=$'\t'
  FORMAT=$'%Y\t%n'
  human_date() { date -d "@$1" "+%Y-%m-%d %H:%M:%S %z"; }
  latest_line=$(
    find "$DIR" -type f -print0 2>/dev/null \
      | xargs -0 stat -c "$FORMAT" 2>/dev/null \
      | sort -nr -k1,1 | head -n1
  )
fi

if [[ -z "${latest_line:-}" ]]; then
  echo "No files found in '$DIR' (or no permission to read them)."
  exit 1
fi

# Split on the first real tab
latest_epoch="${latest_line%%"$DELIM"*}"
latest_file="${latest_line#*"$DELIM"}"

echo "Most recent file: $latest_file"
echo "Epoch:            $latest_epoch"
echo "Human time:       $(human_date "$latest_epoch")"
