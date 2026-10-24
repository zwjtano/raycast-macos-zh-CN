#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd -P)"
/bin/bash "$ROOT/patch.sh" --interactive-restore
result=$?
printf '\n按回车关闭窗口。'
read -r _
exit "$result"
