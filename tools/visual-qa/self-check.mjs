import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const cliPath = path.join(scriptDirectory, "cli.mjs");
const expectedViewports = ["1440x900", "1920x1080"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fixtureHtml(content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Visual QA self-check</title><style>body{margin:24px;font:16px sans-serif;color:#182b3a}main{max-width:720px} [data-vqa-stable-frame]{box-sizing:border-box;background:#e6f4f7;border:1px solid #247c97}</style></head><body><main>${content}</main></body></html>`;
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
  };
  return {
    baseUrl,
    settleMs: 200,
    pages: [{ id: scenario, path: pathByScenario[scenario], states }],
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
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outputRoot = path.join(repositoryRoot, ".visual-qa", `runner-self-check-${runId}`);
  const configDirectory = path.join(outputRoot, "configs");
  await mkdir(configDirectory, { recursive: true });
  const { server, baseUrl } = await startFixtureServer();

  try {
    const normal = await runScenario({
      baseUrl,
      configDirectory,
      outputDirectory: path.join(outputRoot, "normal"),
      scenario: "normal",
    });
    assert(normal.command.code === 0, `Normal scenario should exit 0.\n${normal.command.stdout}\n${normal.command.stderr}`);
    assert(normal.report.outcome === "PASS", "Normal scenario should report overall PASS.");
    assert(normal.report.statuses.GEOMETRY_QA === "PASS", "Normal scenario should report GEOMETRY_QA=PASS.");
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

    process.stdout.write(`Visual QA runner self-check PASS. Screenshots and reports: ${outputRoot}\n`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  process.stderr.write(`Visual QA runner self-check FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
