#!/usr/bin/env bash

# The MIT License (MIT)
#
# Copyright (c) 2022-present David G. Simmons
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#

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
