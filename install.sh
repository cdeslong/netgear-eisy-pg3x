#!/bin/sh
set -eu
cd "$(dirname "$0")"
python3 -m pip install --user -r requirements.txt
npm install --omit=dev
