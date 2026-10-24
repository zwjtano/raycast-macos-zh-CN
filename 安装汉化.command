#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd -P)"
/bin/bash "$ROOT/patch.sh" --interactive-apply
result=$?
printf '\n按回车关闭窗口。'
read -r _
exit "$result"
