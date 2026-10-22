import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { access, lstat, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const cliPath = path.join(scriptDirectory, "cli.mjs");
const expectedViewports = ["1440x900", "1920x1080"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function fixtureHtml(content, additionalCss = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Visual QA self-check</title><style>body{margin:24px;font:16px sans-serif;color:#182b3a}main{max-width:720px}[data-vqa-stable-frame]{box-sizing:border-box;background:#e6f4f7;border:1px solid #247c97}${additionalCss}</style></head><body><main>${content}</main></body></html>`;
}

function fixtureFor(pathname) {
  if (pathname === "/overflow") {
    return fixtureHtml('<div style="width:2400px"><h1>Intentional horizontal overflow</h1></div>');
  }
  if (pathname === "/pageerror") {
    return fixtureHtml('<h1>Intentional browser error</h1><script>setTimeout(() => { throw new Error("intentional visual QA self-check pageerror"); }, 0);</script>');
  }
  if (pathname === "/stable") {
    return fixtureHtml('<h1>Stable layout check</h1><div data-vqa-stable-frame style="width:240px;height:120px">Frame</div><button id="resize-frame" type="button" onclick="document.querySelector(\'[data-vqa-stable-frame]\').style.width=\'360px\'">Resize frame</button>');
  }
  if (pathname === "/styles-pass") {
    return fixtureHtml('<h1>Production style check</h1><aside class="ewc-rail">Navigation</aside>', ':root{--nav:#183236}.ewc-rail{background:var(--nav)}');
  }
  if (pathname === "/styles-broken") {
    return fixtureHtml('<h1>Production style check</h1><aside class="ewc-rail">Navigation</aside>', 'rn:root{--nav:#183236}.ewc-rail{background:var(--nav)}');
  }
  return fixtureHtml('<h1>Normal page</h1><p>The visual QA runner should capture both viewports and keep human review pending.</p><button type="button">Example control</button>');
}

async function startFixtureServer() {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(fixtureFor(pathname));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object", "The self-check fixture server did not expose its port.");
  return { server, baseUrl: `http://127.0.0.1:${address.port}/` };
}

function configFor(baseUrl, scenario) {
  const states = scenario === "stable-layout"
    ? [
      { id: "initial" },
      { id: "resized", actions: [{ type: "click", selector: "#resize-frame" }] },
    ]
    : [{ id: "default" }];
  const pathByScenario = {
    normal: "/normal",
    overflow: "/overflow",
    pageerror: "/pageerror",
    "stable-layout": "/stable",
    "styles-pass": "/styles-pass",
    "styles-broken": "/styles-broken",
  };
  const computedStyles = scenario.startsWith("styles-")
    ? [
      { selector: ":root", property: "--nav", equals: "#183236" },
      { selector: ".ewc-rail", property: "background-color", equals: "rgb(24, 50, 54)" },
    ]
    : [];
  return {
    baseUrl,
    settleMs: 200,
    pages: [{ id: scenario, path: pathByScenario[scenario], states, computedStyles }],
    geometry: {
      checkPageHorizontalOverflow: true,
      stableAcrossStates: scenario === "stable-layout"
        ? [{ selector: "[data-vqa-stable-frame]", properties: ["width"], tolerancePx: 1 }]
        : [],
    },
  };
}

async function runCli(configPath, outputRoot) {
  const child = spawn(process.execPath, [cliPath, "--config", configPath, "--output", outputRoot], {
    cwd: repositoryRoot,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  let timedOut = false;
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  const result = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 180_000);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal, timedOut, stdout, stderr });
    });
  });
  assert(!result.timedOut, `Visual QA runner timed out.\n${result.stdout}\n${result.stderr}`);
  return result;
}

function runCleanup(runDirectory) {
  return spawnSync(process.execPath, [cliPath, "--cleanup-run", runDirectory], {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true,
  });
}

async function readRun(outputRoot) {
  const runDirectories = (await readdir(outputRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("run-"))
    .map((entry) => entry.name);
  assert(runDirectories.length === 1, `Expected one runner output directory under ${outputRoot}, found ${runDirectories.length}.`);
  const runDirectory = path.join(outputRoot, runDirectories[0]);
  const reportPath = path.join(runDirectory, "report.json");
  const markdownPath = path.join(runDirectory, "report.md");
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  await access(markdownPath);
  assert(report.artifacts?.json && report.artifacts?.markdown, "The JSON report is missing artifact paths.");
  for (const result of report.results) {
    assert(result.screenshot, `No screenshot was recorded for ${result.pageId}/${result.viewport}/${result.stateId}.`);
    await access(path.resolve(runDirectory, result.screenshot));
  }
  return { report, runDirectory };
}

async function readRunFromCommand(command, expectedParent) {
  const reportLine = command.stdout.match(/Report: (.+)\r?\n/);
  assert(reportLine, `Runner did not print its report path.\n${command.stdout}\n${command.stderr}`);
  const markdownPath = path.resolve(reportLine[1].trim());
  const runDirectory = path.dirname(markdownPath);
  assert(path.dirname(runDirectory) === expectedParent, `Runner created output outside the expected parent: ${runDirectory}`);
  const report = JSON.parse(await readFile(path.join(runDirectory, "report.json"), "utf8"));
  await access(markdownPath);
  assert(report.artifacts?.directory === runDirectory, "The JSON report does not identify its exact run directory.");
  for (const result of report.results) {
    assert(result.screenshot, `No screenshot was recorded for ${result.pageId}/${result.viewport}/${result.stateId}.`);
    await access(path.resolve(runDirectory, result.screenshot));
  }
  return { report, runDirectory };
}

async function runScenario({ baseUrl, configDirectory, outputDirectory, scenario }) {
  const configPath = path.join(configDirectory, `${scenario}.json`);
  await writeFile(configPath, `${JSON.stringify(configFor(baseUrl, scenario), null, 2)}\n`, "utf8");
  const command = await runCli(configPath, outputDirectory);
  const { report, runDirectory } = await readRun(outputDirectory);
  return { command, report, runDirectory };
}

function resultViewportIds(report) {
  return [...new Set(report.results.map((result) => result.viewport))].sort();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== "--keep-artifacts") || args.filter((argument) => argument === "--keep-artifacts").length > 1) {
    process.stderr.write("Usage: node tools/visual-qa/self-check.mjs [--keep-artifacts]\n");
    process.exitCode = 1;
    return;
  }
  const keepArtifacts = args.includes("--keep-artifacts");
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outputRoot = path.join(repositoryRoot, ".visual-qa", `runner-self-check-${runId}`);
  const configDirectory = path.join(outputRoot, "configs");
  const qaRoot = path.join(repositoryRoot, ".visual-qa");
  let server = null;
  let ownsOutputRoot = false;
  let failure = null;
  const diagnosticRunDirectories = [];
  try {
    try {
      await lstat(qaRoot);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await mkdir(qaRoot);
    }
    const qaRootInfo = await lstat(qaRoot);
    assert(qaRootInfo.isDirectory() && !qaRootInfo.isSymbolicLink(), `Controlled .visual-qa root must be a real directory: ${qaRoot}`);
    assert(path.relative(path.resolve(qaRoot), await realpath(qaRoot)) === "", `Controlled .visual-qa root resolves outside its expected location: ${await realpath(qaRoot)}`);
    await mkdir(outputRoot);
    ownsOutputRoot = true;
    await mkdir(configDirectory);
    const fixture = await startFixtureServer();
    server = fixture.server;
    const { baseUrl } = fixture;

    const normal = await runScenario({
      baseUrl,
      configDirectory,
      outputDirectory: path.join(outputRoot, "normal"),
      scenario: "normal",
    });
    assert(normal.command.code === 0, `Normal scenario should exit 0.\n${normal.command.stdout}\n${normal.command.stderr}`);
    assert(normal.report.outcome === "PASS", "Normal scenario should report overall PASS.");
    assert(normal.report.statuses.GEOMETRY_QA === "PASS", "Normal scenario should report GEOMETRY_QA=PASS.");
    assert(normal.report.statuses.STYLE_QA === "NOT_RUN", "Style checks without configured assertions must remain NOT_RUN.");
    assert(normal.report.statuses.BROWSER_ERRORS === "PASS", "Normal scenario should report BROWSER_ERRORS=PASS.");
    assert(normal.report.statuses.VISUAL_REVIEW === "NOT_RUN", "Visual review must remain NOT_RUN.");
    assert(normal.report.statuses.REGRESSION === "NOT_RUN", "Regression must remain NOT_RUN without a baseline.");
    assert(normal.report.statuses.HUMAN_ACCEPTANCE === "PENDING", "Human acceptance must remain PENDING.");
    assert(normal.report.statuses.BUILD === "NOT_RUN", "The runner must not claim to have built the project.");
    assert(normal.report.results.length === 2, "Normal scenario should capture one state in both viewports.");
    assert(JSON.stringify(resultViewportIds(normal.report)) === JSON.stringify(expectedViewports), "Normal scenario did not execute both approved viewports.");

    const overflow = await runScenario({
      baseUrl,
      configDirectory,
      outputDirectory: path.join(outputRoot, "overflow"),
      scenario: "overflow",
    });
    assert(overflow.command.code === 1, `Overflow scenario should exit 1.\n${overflow.command.stdout}\n${overflow.command.stderr}`);
    assert(overflow.report.statuses.GEOMETRY_QA === "FAIL", "Overflow scenario should report GEOMETRY_QA=FAIL.");
    assert(overflow.report.results.every((result) => result.diagnostics.some((item) => item.code === "page-horizontal-overflow")), "Overflow diagnostic was not recorded for every viewport.");

    const pageerror = await runScenario({
      baseUrl,
      configDirectory,
      outputDirectory: path.join(outputRoot, "pageerror"),
      scenario: "pageerror",
    });
    assert(pageerror.command.code === 1, `Pageerror scenario should exit 1.\n${pageerror.command.stdout}\n${pageerror.command.stderr}`);
    assert(pageerror.report.statuses.BROWSER_ERRORS === "FAIL", "Pageerror scenario should report BROWSER_ERRORS=FAIL.");
    assert(pageerror.report.results.every((result) => result.browserErrors > 0), "Pageerror was not recorded for every viewport.");

    const stable = await runScenario({
      baseUrl,
      configDirectory,
      outputDirectory: path.join(outputRoot, "stable-layout"),
      scenario: "stable-layout",
    });
    assert(stable.command.code === 1, `Stable-layout scenario should exit 1.\n${stable.command.stdout}\n${stable.command.stderr}`);
    assert(stable.report.statuses.GEOMETRY_QA === "FAIL", "Stable-layout scenario should report GEOMETRY_QA=FAIL.");
    assert(stable.report.results.filter((result) => result.stateId === "resized").every((result) => result.diagnostics.some((item) => item.code === "stable-layout-changed")), "Stable-layout violation was not recorded for every viewport.");

    const stylesPass = await runScenario({
      baseUrl,
      configDirectory,
      outputDirectory: path.join(outputRoot, "styles-pass"),
      scenario: "styles-pass",
    });
    assert(stylesPass.command.code === 0, `Computed-style positive fixture should exit 0.\n${stylesPass.command.stdout}\n${stylesPass.command.stderr}`);
    assert(stylesPass.report.statuses.STYLE_QA === "PASS", "Valid :root and rail styles should report STYLE_QA=PASS.");
    assert(stylesPass.report.results.every((result) => result.styleOutcome === "PASS"), "Valid computed styles did not pass in every viewport.");

    const stylesBroken = await runScenario({
      baseUrl,
      configDirectory,
      outputDirectory: path.join(outputRoot, "styles-broken"),
      scenario: "styles-broken",
    });
    assert(stylesBroken.command.code === 1, `rn:root fixture should exit 1.\n${stylesBroken.command.stdout}\n${stylesBroken.command.stderr}`);
    assert(stylesBroken.report.statuses.STYLE_QA === "FAIL", "The rn:root fixture must report STYLE_QA=FAIL.");
    assert(stylesBroken.report.results.every((result) => result.styleOutcome === "FAIL"), "The broken computed style did not fail in every viewport.");
    assert(stylesBroken.report.results.every((result) => result.diagnostics.some((item) => item.code === "computed-style-mismatch" && item.selector === ":root" && item.property === "--nav" && item.expected === "#183236" && item.actual === "")), "The missing :root variable diagnostic must record selector, property, expected value, and actual value.");
    assert(stylesBroken.report.results.every((result) => result.diagnostics.some((item) => item.code === "computed-style-mismatch" && item.selector === ".ewc-rail" && item.property === "background-color" && item.actual === "rgba(0, 0, 0, 0)")), "The rail background diagnostic must identify the transparent actual style.");

    const normalConfigPath = path.join(configDirectory, "normal.json");
    const cleanCommand = await runCli(normalConfigPath, qaRoot);
    assert(cleanCommand.code === 0, `Cleanup fixture run should exit 0.\n${cleanCommand.stdout}\n${cleanCommand.stderr}`);
    const cleanFixture = await readRunFromCommand(cleanCommand, qaRoot);
    diagnosticRunDirectories.push(cleanFixture.runDirectory);
    const neighborCommand = await runCli(normalConfigPath, qaRoot);
    assert(neighborCommand.code === 0, `Neighbor fixture run should exit 0.\n${neighborCommand.stdout}\n${neighborCommand.stderr}`);
    const neighborFixture = await readRunFromCommand(neighborCommand, qaRoot);
    diagnosticRunDirectories.push(neighborFixture.runDirectory);

    const baselineDirectory = path.join(outputRoot, "approved-baseline-fixture");
    await mkdir(baselineDirectory);
    const baselinePath = path.join(baselineDirectory, "approved-sentinel.png");
    await writeFile(baselinePath, "self-check baseline sentinel\n", "utf8");

    const cleanupResult = runCleanup(cleanFixture.runDirectory);
    assert(cleanupResult.status === 0, `A valid runner run should be cleanable.\n${cleanupResult.stdout}\n${cleanupResult.stderr}`);
    assert(cleanupResult.stdout.includes(`CLEANED: ${cleanFixture.runDirectory}`), "Cleanup must report the exact path it removed.");
    assert(!(await pathExists(cleanFixture.runDirectory)), "The selected run directory was not removed.");
    assert(await pathExists(neighborFixture.runDirectory), "Cleaning one run removed its neighboring run.");
    assert(await pathExists(baselinePath), "Cleaning one run affected an approved baseline outside that run.");

    const missingPath = path.join(qaRoot, `run-self-check-missing-${runId}`);
    const missingResult = runCleanup(missingPath);
    assert(missingResult.status === 0 && missingResult.stdout.includes("Already absent"), "Cleaning an absent exact run path should be idempotent.");

    for (const forbiddenPath of [qaRoot, repositoryRoot, path.join(repositoryRoot, "papers"), path.join(repositoryRoot, "papers", `run-escape-${runId}`)]) {
      const rejected = runCleanup(forbiddenPath);
      assert(rejected.status !== 0, `Cleanup must reject an unsafe path: ${forbiddenPath}`);
    }

    const unknownRun = path.join(qaRoot, `run-self-check-unknown-${runId}`);
    await mkdir(unknownRun);
    try {
      const rejected = runCleanup(unknownRun);
      assert(rejected.status !== 0, "Cleanup must reject a run directory without a valid runner report.");
      assert(await pathExists(unknownRun), "A directory without runner identity was removed.");
    } finally {
      await rm(unknownRun, { recursive: true, force: true });
    }

    const externalTarget = path.join(outputRoot, "external-link-target");
    const externalLink = path.join(qaRoot, `run-self-check-link-${runId}`);
    await mkdir(externalTarget);
    await symlink(externalTarget, externalLink, process.platform === "win32" ? "junction" : "dir");
    try {
      const rejected = runCleanup(externalLink);
      assert(rejected.status !== 0, "Cleanup must reject a run-* symlink or junction.");
      assert(await pathExists(externalTarget), "Rejecting an external link must leave its target untouched.");
    } finally {
      await rm(externalLink, { recursive: true, force: true });
    }

    const neighborCleanup = runCleanup(neighborFixture.runDirectory);
    assert(neighborCleanup.status === 0, `The second self-check run should also be individually cleanable.\n${neighborCleanup.stdout}\n${neighborCleanup.stderr}`);
    assert(!(await pathExists(neighborFixture.runDirectory)), "The second self-check run directory was not removed.");
    assert(await pathExists(baselinePath), "The approved baseline fixture should remain after both run cleanups.");
    await rm(baselineDirectory, { recursive: true });
  } catch (error) {
    failure = error;
  } finally {
    if (server) {
      try {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      } catch (error) {
        if (!failure) failure = error;
        else process.stderr.write(`Self-check server shutdown also failed: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  }

  if (failure) {
    process.stderr.write(`Visual QA runner self-check FAIL: ${failure instanceof Error ? failure.message : String(failure)}\n`);
    if (ownsOutputRoot) process.stderr.write(`Diagnostic artifacts retained: ${outputRoot}\n`);
    for (const directory of diagnosticRunDirectories) {
      if (await pathExists(directory)) process.stderr.write(`Additional runner artifacts retained: ${directory}\n`);
    }
    process.exitCode = 1;
    return;
  }

  if (keepArtifacts) {
    process.stdout.write(`Visual QA runner self-check PASS; artifacts retained for CI upload: ${outputRoot}\n`);
    return;
  }
  try {
    if (ownsOutputRoot) await rm(outputRoot, { recursive: true });
    process.stdout.write(`Visual QA runner self-check PASS; temporary artifacts cleaned: ${outputRoot}\n`);
  } catch (error) {
    process.stderr.write(`Visual QA runner self-check PASS, but temporary artifact cleanup failed at ${outputRoot}: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`Visual QA runner self-check FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
