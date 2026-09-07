#!/bin/sh
python3 -m http.server 8080 >/tmp/bnt-report-studio.log 2>&1 &
sleep 1
if command -v open >/dev/null 2>&1; then open http://localhost:8080; elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:8080; fi
wait
