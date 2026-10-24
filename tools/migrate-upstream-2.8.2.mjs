#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse } from "../.tools/node_modules/acorn/dist/acorn.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const RESOURCE_ROOT =
  "Contents/Resources/macos-app_RaycastDesktopApp.bundle/Contents/Resources/frontend";
const UPSTREAM_APP = process.env.UPSTREAM_APP;
const UPSTREAM_PACKAGE = process.env.UPSTREAM_PACKAGE;
const TARGET_APP = process.env.TARGET_APP ?? "/Applications/Raycast.app";
const OUTPUT = join(ROOT, "localization", "2.9.0.tsv");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseTsv(text) {
  const rows = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line || line.startsWith("#")) continue;
    const fields = line.split("\t");
    if (fields.length !== 3) {
      throw new Error(`TSV 第 ${index + 1} 行不是三列`);
    }
    rows.push({
      file: fields[0],
      source: untsvField(fields[1]),
      target: untsvField(fields[2]),
    });
  }
  return rows;
}

function tsvField(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\t", "\\t")
    .replaceAll("\n", "\\n")
    .replace(/ +$/g, (spaces) => "\\s".repeat(spaces.length));
}

function untsvField(value) {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== "\\") {
      output += value[index];
      continue;
    }
    index += 1;
    const escaped = value[index];
    if (escaped === "n") output += "\n";
    else if (escaped === "t") output += "\t";
    else if (escaped === "s") output += " ";
    else if (escaped === "\\") output += "\\";
    else output += `\\${escaped}`;
  }
  return output;
}

function walkAst(node, visit, parent = null, key = "") {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visit(node, parent, key);
  for (const [childKey, value] of Object.entries(node)) {
    if (
      childKey === "start" ||
      childKey === "end" ||
      childKey === "loc" ||
      childKey === "range"
    ) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const child of value) walkAst(child, visit, node, childKey);
    } else {
      walkAst(value, visit, node, childKey);
    }
  }
}

function isNonTextLiteral(node, parent, key) {
  if (!parent) return false;
  if (
    (parent.type === "Property" || parent.type === "PropertyDefinition") &&
    key === "key" &&
    !parent.computed
  ) {
    return true;
  }
  if (
    (parent.type === "MemberExpression" || parent.type === "OptionalMemberExpression") &&
    key === "property" &&
    !parent.computed
  ) {
    return true;
  }
  if (
    (parent.type === "ImportDeclaration" ||
      parent.type === "ExportAllDeclaration" ||
      parent.type === "ExportNamedDeclaration") &&
    key === "source"
  ) {
    return true;
  }
  if (parent.type === "ImportExpression" && key === "source") return true;
  return false;
}

function collectStrings(source, fileName) {
  let ast;
  try {
    ast = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true,
    });
  } catch (error) {
    throw new Error(`${fileName}: 解析失败：${error.message}`);
  }

  const strings = [];
  walkAst(ast, (node, parent, key) => {
    if (node.type === "Literal" && typeof node.value === "string") {
      if (isNonTextLiteral(node, parent, key)) return;
      strings.push({
        kind: "literal",
        value: node.value,
        expressions: "",
        start: node.start,
        end: node.end,
        quote: source[node.start],
      });
      return;
    }
    if (node.type !== "TemplateLiteral") return;
    const expressions = node.expressions
      .map((expression) => source.slice(expression.start, expression.end))
      .join("\0");
    let value = "";
    for (let index = 0; index < node.quasis.length; index += 1) {
      const quasi = node.quasis[index];
      value += quasi.value.cooked ?? quasi.value.raw;
      if (index < node.expressions.length) {
        const expression = node.expressions[index];
        value += `\${${source.slice(expression.start, expression.end)}}`;
      }
    }
    strings.push({
      kind: "template",
      value,
      expressions,
      start: node.start,
      end: node.end,
      quote: source[node.start],
    });
  });
  return strings;
}

function isLikelyTranslation(source, target) {
  if (source === target || !source || !target) return false;
  if (!/[\p{Script=Han}]/u.test(target)) return false;
  if (!/[A-Za-z]/.test(source)) return false;
  if (source.length > 500 || target.length > 500) return false;
  if (/^(?:https?:\/\/|mailto:|file:|\/|\.{0,2}\/)/i.test(source)) return false;
  if (/^(?:rgba?|hsla?|var)\(/i.test(source)) return false;
  if (/^(?:#[0-9a-f]{3,8}|--?[a-z][\w-]*)$/i.test(source)) return false;
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(source) && !/\s/.test(source)) {
    return false;
  }
  if (/^(?:className|aria-|data-|MIME|UTF-|SHA-)/.test(source)) return false;
  if (/[{};]\s*$/.test(source) && !/[.!?]$/.test(source)) return false;
  return true;
}

function chooseTarget(source, entries) {
  const counts = new Map();
  for (const target of entries) counts.set(target, (counts.get(target) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "zh-CN");
  })[0];
}

async function verifyUpstream() {
  const manifestText = await readFile(join(UPSTREAM_PACKAGE, "manifest.tsv"), "utf8");
  const files = manifestText
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [oldHash, newHash, path] = line.split("\t");
      if (!oldHash || !newHash || !path) throw new Error(`上游 manifest 无效：${line}`);
      return { oldHash, newHash, path };
    });

  for (const file of files) {
    const original = await readFile(join(UPSTREAM_APP, file.path));
    const translated = await readFile(join(UPSTREAM_PACKAGE, "payload", file.path));
    if (sha256(original) !== file.oldHash) {
      throw new Error(`官方 2.8.2 原文件哈希不匹配：${file.path}`);
    }
    if (sha256(translated) !== file.newHash) {
      throw new Error(`上游汉化文件哈希不匹配：${file.path}`);
    }
  }
  return files;
}

async function buildDictionary(files) {
  const targetsBySource = new Map();
  const stats = {
    comparedFiles: 0,
    skippedFiles: [],
    stringPairs: 0,
    changedPairs: 0,
    acceptedPairs: 0,
  };

  for (const file of files) {
    const originalSource = await readFile(join(UPSTREAM_APP, file.path), "utf8");
    const translatedSource = await readFile(
      join(UPSTREAM_PACKAGE, "payload", file.path),
      "utf8",
    );
    const originalStrings = collectStrings(originalSource, file.path);
    const translatedStrings = collectStrings(translatedSource, file.path);
    stats.comparedFiles += 1;

    if (originalStrings.length !== translatedStrings.length) {
      stats.skippedFiles.push({
        file: file.path,
        reason: `字符串节点数不同（${originalStrings.length} != ${translatedStrings.length}）`,
      });
      continue;
    }

    const filePairs = [];
    let structurallyComparable = true;
    for (let index = 0; index < originalStrings.length; index += 1) {
      const original = originalStrings[index];
      const translated = translatedStrings[index];
      stats.stringPairs += 1;
      if (original.expressions !== translated.expressions) {
        stats.skippedFiles.push({
          file: file.path,
          reason: `第 ${index + 1} 个模板插值不同`,
        });
        structurallyComparable = false;
        break;
      }
      if (original.value === translated.value) continue;
      stats.changedPairs += 1;
      if (!isLikelyTranslation(original.value, translated.value)) continue;
      stats.acceptedPairs += 1;
      filePairs.push([original.value, translated.value]);
    }
    if (!structurallyComparable) continue;

    // All string positions must align before merging any pair from this file.
    for (const [source, target] of filePairs) {
      if (!targetsBySource.has(source)) {
        targetsBySource.set(source, []);
      }
      targetsBySource.get(source).push(target);
    }
  }

  const dictionary = new Map();
  const conflicts = [];
  for (const [source, entries] of targetsBySource) {
    const [target, count] = chooseTarget(source, entries);
    dictionary.set(source, { target, count, variants: new Set(entries).size });
    if (new Set(entries).size > 1) {
      conflicts.push({ source, target, variants: [...new Set(entries)] });
    }
  }
  return { dictionary, stats, conflicts };
}

async function extractTargetStrings() {
  const files = (await readdir(join(TARGET_APP, RESOURCE_ROOT)))
    .filter((name) => name.endsWith(".js"))
    .sort();
  const stringsByFile = new Map();
  for (const fileName of files) {
    const source = await readFile(join(TARGET_APP, RESOURCE_ROOT, fileName), "utf8");
    stringsByFile.set(fileName, collectStrings(source, fileName));
  }
  return stringsByFile;
}

async function main() {
  if (!UPSTREAM_APP || !UPSTREAM_PACKAGE) {
    throw new Error(
      "请设置 UPSTREAM_APP（官方 2.8.2 应用路径）和 UPSTREAM_PACKAGE（含 manifest.tsv 与 payload 的上游汉化包路径）",
    );
  }
  const upstreamFiles = await verifyUpstream();
  const { dictionary, stats, conflicts } = await buildDictionary(upstreamFiles);
  const targetStrings = await extractTargetStrings();
  const existingRows = parseTsv(await readFile(OUTPUT, "utf8"));
  const existingByFile = new Map();
  for (const row of existingRows) {
    if (!existingByFile.has(row.file)) existingByFile.set(row.file, new Map());
    existingByFile.get(row.file).set(row.source, row.target);
  }

  const rows = [];
  let migrated = 0;
  for (const [fileName, strings] of targetStrings) {
    const manual = existingByFile.get(fileName) ?? new Map();
    const sources = new Set(strings.map((item) => item.value));
    for (const source of sources) {
      const target = manual.get(source) ?? dictionary.get(source)?.target;
      if (!target || source === target) continue;
      if (!manual.has(source)) migrated += 1;
      rows.push({ file: fileName, source, target });
    }
  }

  rows.sort((a, b) => a.file.localeCompare(b.file) || a.source.localeCompare(b.source));
  const output = [
    "# file\tsource\ttarget",
    ...rows.map(
      (row) => `${tsvField(row.file)}\t${tsvField(row.source)}\t${tsvField(row.target)}`,
    ),
  ].join("\n");
  await writeFile(OUTPUT, `${output}\n`);

  const filesCovered = new Set(rows.map((row) => row.file)).size;
  const report = {
    upstreamFiles: upstreamFiles.length,
    upstreamStats: stats,
    dictionaryEntries: dictionary.size,
    targetFiles: targetStrings.size,
    translatedFiles: filesCovered,
    translatedStrings: rows.length,
    migratedFromUpstream: migrated,
    retainedManual: rows.length - migrated,
    droppedManualRows: existingRows.filter(
      (row) => !rows.some((item) => item.file === row.file && item.source === row.source),
    ).length,
    conflicts: conflicts.length,
  };
  console.log(JSON.stringify(report, null, 2));
  if (stats.skippedFiles.length > 0) {
    console.error(`跳过 ${stats.skippedFiles.length} 个结构不一致文件`);
  }
  if (conflicts.length > 0) {
    console.error(`发现 ${conflicts.length} 个同原文多译文冲突，采用出现次数最多的一项`);
  }
}

main().catch((error) => {
  console.error(`失败：${error.message}`);
  process.exit(1);
});
