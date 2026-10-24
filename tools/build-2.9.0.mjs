#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "../.tools/node_modules/acorn/dist/acorn.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = "2.9.0.0";
const BUILD_HASH = "80a089bc4a415ff3c5c554fe7f67a0ae17ef127d";
const NATIVE_SHA256 = "ee00fded1e4a42afb21bd36de06e306e3f485e8fbd875ef01254f28af6728923";
const RESOURCE_ROOT =
  "Contents/Resources/macos-app_RaycastDesktopApp.bundle/Contents/Resources/frontend";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseTsv(text, name) {
  return text
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line, index) => {
      const fields = line.split("\t");
      if (fields.length !== 3) {
        throw new Error(`${name}:${index + 1}: 需要三列（文件、英文、中文）`);
      }
      return {
        file: fields[0],
        source: untsvField(fields[1]),
        target: untsvField(fields[2]),
      };
    });
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

function decodeJsString(raw) {
  let value = "";
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char !== "\\") {
      value += char;
      continue;
    }

    i += 1;
    if (i >= raw.length) throw new Error("字符串以反斜杠结尾");
    const escaped = raw[i];
    if (escaped === "\n") continue;
    if (escaped === "\r") {
      if (raw[i + 1] === "\n") i += 1;
      continue;
    }
    const simpleEscapes = {
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
      v: "\v",
      0: "\0",
    };
    if (Object.hasOwn(simpleEscapes, escaped)) {
      value += simpleEscapes[escaped];
      continue;
    }
    if (escaped === "x") {
      const hex = raw.slice(i + 1, i + 3);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new Error(`无效的十六进制转义：\\x${hex}`);
      value += String.fromCodePoint(Number.parseInt(hex, 16));
      i += 2;
      continue;
    }
    if (escaped === "u") {
      if (raw[i + 1] === "{") {
        const end = raw.indexOf("}", i + 2);
        const hex = end === -1 ? "" : raw.slice(i + 2, end);
        if (!/^[0-9a-fA-F]+$/.test(hex) || Number.parseInt(hex, 16) > 0x10ffff) {
          throw new Error(`无效的 Unicode 转义：\\u{${hex}}`);
        }
        value += String.fromCodePoint(Number.parseInt(hex, 16));
        i = end;
        continue;
      }
      const hex = raw.slice(i + 1, i + 5);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error(`无效的 Unicode 转义：\\u${hex}`);
      value += String.fromCodePoint(Number.parseInt(hex, 16));
      i += 4;
      continue;
    }
    // JavaScript treats \", \', \`, \\, \$ and unknown escapes as the escaped character.
    value += escaped;
  }
  return value;
}

function encodeDoubleQuotedString(value) {
  return JSON.stringify(value).slice(1, -1);
}

function encodeTemplateString(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function interpolationExpressions(value) {
  const expressions = [];
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] !== "$" || value[i + 1] !== "{") continue;
    const start = i + 2;
    let depth = 1;
    let j = start;
    for (; j < value.length && depth > 0; j += 1) {
      if (value[j] === "{") depth += 1;
      if (value[j] === "}") depth -= 1;
    }
    if (depth !== 0) throw new Error(`未闭合的模板插值：${value}`);
    expressions.push(value.slice(start, j - 1));
    i = j - 1;
  }
  return expressions;
}

function decodeTemplateValue(raw) {
  let output = "";
  for (let index = 0; index < raw.length; index += 1) {
    if (raw[index] !== "\\") {
      output += raw[index];
      continue;
    }
    index += 1;
    const escaped = raw[index];
    if (escaped === "`") output += "`";
    else if (escaped === "$") output += "$";
    else if (escaped === "\\") output += "\\";
    else output += `\\${escaped}`;
  }
  return output;
}

function replaceStringLiterals(source, replacements, fileName) {
  const bySource = new Map();
  for (const replacement of replacements) {
    if (replacement.source === replacement.target) {
      throw new Error(`${fileName}: 原文与译文相同：${replacement.source}`);
    }
    if (bySource.has(replacement.source)) {
      throw new Error(`${fileName}: 重复英文原文：${replacement.source}`);
    }
    bySource.set(replacement.source, replacement.target);
  }

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

  const edits = [];
  const seen = new Map();
  walkAst(ast, (node, parent, key) => {
    let value;
    let target;
    if (node.type === "Literal" && typeof node.value === "string") {
      if (isNonTextLiteral(node, parent, key)) return;
      value = node.value;
      target = bySource.get(value);
      if (target === undefined) return;
      const quote = node.raw[0];
      if (quote === "'") {
        edits.push({
          start: node.start,
          end: node.end,
          text: '"' + encodeDoubleQuotedString(target) + '"',
        });
        seen.set(value, (seen.get(value) ?? 0) + 1);
        return;
      }
      const encoded =
        quote === '"' ? encodeDoubleQuotedString(target) : encodeTemplateString(target);
      edits.push({ start: node.start, end: node.end, text: quote + encoded + quote });
    } else if (node.type === "TemplateLiteral") {
      const expressions = node.expressions
        .map((expression) => source.slice(expression.start, expression.end))
        .join("\0");
      let cooked = "";
      for (let index = 0; index < node.quasis.length; index += 1) {
        cooked += node.quasis[index].value.cooked ?? decodeTemplateValue(node.quasis[index].value.raw);
        if (index < node.expressions.length) {
          const expression = node.expressions[index];
          cooked += `\${${source.slice(expression.start, expression.end)}}`;
        }
      }
      value = cooked;
      target = bySource.get(value);
      if (target === undefined) return;
      const targetExpressions = interpolationExpressions(target);
      const originalExpressions = expressions ? expressions.split("\0") : [];
      if (originalExpressions.join("\0") !== targetExpressions.join("\0")) {
        throw new Error(
          `${fileName}: 模板插值不一致：${value}\n原文：${originalExpressions.join(", ")}\n译文：${targetExpressions.join(", ")}`,
        );
      }
      const renderedExpressions = targetExpressions.map(
        (expression) => `\${${expression}}`,
      );
      let rendered = "";
      const targetParts = [];
      let targetCursor = 0;
      for (const expression of targetExpressions) {
        const placeholder = `\${${expression}}`;
        const index = target.indexOf(placeholder, targetCursor);
        if (index === -1) {
          throw new Error(`${fileName}: 找不到模板插值：${placeholder}`);
        }
        targetParts.push(target.slice(targetCursor, index));
        targetCursor = index + placeholder.length;
      }
      targetParts.push(target.slice(targetCursor));
      for (let index = 0; index < targetParts.length; index += 1) {
        rendered += encodeTemplateString(targetParts[index]);
        if (index < renderedExpressions.length) rendered += renderedExpressions[index];
      }
      edits.push({ start: node.start, end: node.end, text: "`" + rendered + "`" });
    } else {
      return;
    }
    seen.set(value, (seen.get(value) ?? 0) + 1);
  });

  edits.sort((a, b) => a.start - b.start || a.end - b.end);
  let output = "";
  let cursor = 0;
  for (const edit of edits) {
    if (edit.start < cursor) {
      throw new Error(`${fileName}: AST 字符串范围重叠，偏移 ${edit.start}`);
    }
    output += source.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }
  output += source.slice(cursor);
  const missing = [...bySource.keys()].filter((value) => !seen.has(value));
  if (missing.length > 0) {
    throw new Error(`${fileName}: 未找到 ${missing.length} 条原文：\n${missing.join("\n")}`);
  }
  return { output, counts: seen };
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
  return parent.type === "ImportExpression" && key === "source";
}

function parseArgs(argv) {
  const args = { app: "/Applications/Raycast.app", out: join(ROOT, "build", VERSION) };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--app") args.app = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else throw new Error(`未知参数：${argv[i]}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const app = resolve(args.app);
  const info = await readFile(join(app, "Contents/Info.plist"), "utf8");
  if (!info.includes(`<string>${VERSION}</string>`)) {
    throw new Error(`Raycast 版本不是 ${VERSION}`);
  }
  const native = await readFile(join(app, "Contents/MacOS/Raycast"));
  if (sha256(native) !== NATIVE_SHA256) {
    throw new Error("Raycast 原生程序 SHA-256 不匹配");
  }

  const rows = parseTsv(
    await readFile(join(ROOT, "localization/2.9.0.tsv"), "utf8"),
    "localization/2.9.0.tsv",
  );
  const byFile = new Map();
  for (const row of rows) {
    if (!byFile.has(row.file)) byFile.set(row.file, []);
    byFile.get(row.file).push(row);
  }
  for (const fileName of byFile.keys()) {
    const fileStat = await stat(join(app, RESOURCE_ROOT, fileName)).catch(() => null);
    if (!fileStat?.isFile()) throw new Error(`目标资源不存在：${fileName}`);
  }
  const targets = [...byFile.keys()].sort();

  await rm(args.out, { recursive: true, force: true });
  const payloadRoot = join(args.out, "payload");
  const manifest = [];
  const report = {
    version: VERSION,
    architecture: "arm64",
    buildHash: BUILD_HASH,
    nativeSha256: NATIVE_SHA256,
    files: [],
    replacements: 0,
  };

  for (const fileName of targets) {
    const rel = `${RESOURCE_ROOT}/${fileName}`;
    const original = await readFile(join(app, rel));
    const source = original.toString("utf8");
    const { output, counts } = replaceStringLiterals(
      source,
      byFile.get(fileName),
      fileName,
    );
    const payloadPath = join(payloadRoot, rel);
    await mkdir(dirname(payloadPath), { recursive: true });
    await writeFile(payloadPath, output);

    const replacements = [...counts.values()].reduce((sum, count) => sum + count, 0);
    report.replacements += replacements;
    report.files.push({
      path: rel,
      originalSha256: sha256(original),
      patchedSha256: sha256(output),
      replacementStrings: counts.size,
      occurrences: replacements,
    });
    manifest.push(`${sha256(original)}\t${sha256(output)}\t${rel}`);
  }

  await writeFile(join(args.out, "manifest.tsv"), `${manifest.join("\n")}\n`);
  await writeFile(join(args.out, "native-sha256.txt"), `${NATIVE_SHA256}\n`);
  await writeFile(join(args.out, "build-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`已生成 ${targets.length} 个资源，${report.replacements} 处替换：${args.out}`);
}

main().catch((error) => {
  console.error(`失败：${error.message}`);
  process.exit(1);
});
