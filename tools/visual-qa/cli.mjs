import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const demoRequire = createRequire(path.join(repositoryRoot, "reusable-kit/demo/package.json"));
const VIEWPORTS = [
  { id: "1440x900", width: 1440, height: 900 },
  { id: "1920x1080", width: 1920, height: 1080 },
];
const DEFAULT_SEMANTIC_SELECTORS = ["h1", "h2", "h3", "p", "li", "label", "button", "input", "select", "[data-vqa-semantic]"];
const STABLE_PROPERTIES = new Set(["x", "y", "width", "height"]);

function printHelp() {
  process.stdout.write("Usage: node tools/visual-qa/cli.mjs --config <path> [--output <directory>]\n");
}

function parseArguments(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument !== "--config" && argument !== "--output") throw new Error(`Unknown option: ${argument}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Expected a value after ${argument}.`);
    values[argument.slice(2)] = value;
    index += 1;
  }
  if (!values.config) throw new Error("Provide a config file with --config.");
  return values;
}

function sanitizePathPart(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string.`);
  const safe = value.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!safe) throw new Error(`${label} must contain at least one letter or number.`);
  return safe;
}

function normalizeStableSelectors(value = []) {
  if (!Array.isArray(value)) throw new Error("geometry.stableAcrossStates must be an array.");
  return value.map((entry) => {
    const spec = typeof entry === "string" ? { selector: entry } : entry;
    if (!spec || typeof spec.selector !== "string" || !spec.selector.trim()) {
      throw new Error("Each stableAcrossStates entry needs a selector.");
    }
    const properties = spec.properties ?? ["x", "y", "width", "height"];
    if (!Array.isArray(properties) || properties.some((property) => !STABLE_PROPERTIES.has(property))) {
      throw new Error(`Invalid stableAcrossStates properties for ${spec.selector}.`);
    }
    const tolerancePx = spec.tolerancePx ?? 2;
    if (!Number.isFinite(tolerancePx) || tolerancePx < 0) throw new Error("Stable-layout tolerance must be a non-negative number.");
    return { selector: spec.selector, properties, tolerancePx };
  });
}

function normalizeComputedStyles(value = [], pageId) {
  if (!Array.isArray(value)) throw new Error(`Page ${pageId} computedStyles must be an array.`);
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`Each computedStyles entry on ${pageId} must be an object.`);
    }
    if (typeof entry.selector !== "string" || !entry.selector.trim()) {
      throw new Error(`Each computedStyles entry on ${pageId} needs a selector.`);
    }
    if (typeof entry.property !== "string" || !/^(--[A-Za-z0-9_-]+|[A-Za-z][A-Za-z0-9-]*)$/.test(entry.property)) {
      throw new Error(`Each computedStyles entry on ${pageId} needs a CSS property name.`);
    }
    if (typeof entry.equals !== "string" || !entry.equals.trim()) {
      throw new Error(`Each computedStyles entry on ${pageId} needs a non-empty equals value.`);
    }
    return { selector: entry.selector.trim(), property: entry.property, equals: entry.equals };
  });
}

function validateConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("The config root must be a JSON object.");
  if (typeof config.baseUrl !== "string") throw new Error("Config needs a baseUrl.");
  const baseUrl = new URL(config.baseUrl);
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") throw new Error("baseUrl must use HTTP or HTTPS.");
  if (!Array.isArray(config.pages) || config.pages.length === 0) throw new Error("Config needs at least one page entry.");
  if (config.server && (typeof config.server.command !== "string" || !Array.isArray(config.server.args ?? []))) {
    throw new Error("server needs a command and an args array.");
  }

  const pageIds = new Set();
  const pages = config.pages.map((page) => {
    const id = sanitizePathPart(page.id, "page.id");
    if (pageIds.has(id)) throw new Error(`Duplicate page id: ${id}`);
    pageIds.add(id);
    if (typeof page.path !== "string") throw new Error(`Page ${id} needs a path.`);
    if (page.states !== undefined && !Array.isArray(page.states)) throw new Error(`Page ${id} states must be an array.`);
    const computedStyles = normalizeComputedStyles(page.computedStyles, id);
    const states = page.states?.length ? page.states : [{ id: "default" }];
    const stateIds = new Set();
    return { ...page, id, computedStyles, states: states.map((state) => {
      const stateId = sanitizePathPart(state.id ?? "default", `state id on ${id}`);
      if (stateIds.has(stateId)) throw new Error(`Duplicate state id ${stateId} on page ${id}.`);
      stateIds.add(stateId);
      if (state.actions !== undefined && !Array.isArray(state.actions)) throw new Error(`Actions for ${id}/${stateId} must be an array.`);
      if (state.animations !== undefined && !["allow", "disabled"].includes(state.animations)) {
        throw new Error(`Screenshot animations for ${id}/${stateId} must be allow or disabled.`);
      }
      return { ...state, id: stateId, actions: state.actions ?? [] };
    }) };
  });

  const geometry = config.geometry ?? {};
  const clippingSelectors = geometry.clippingSelectors ?? [];
  const semanticSelectors = geometry.semanticSelectors ?? DEFAULT_SEMANTIC_SELECTORS;
  if (!Array.isArray(clippingSelectors) || clippingSelectors.some((item) => typeof item !== "string")) {
    throw new Error("geometry.clippingSelectors must be an array of CSS selectors.");
  }
  if (!Array.isArray(semanticSelectors) || semanticSelectors.some((item) => typeof item !== "string")) {
    throw new Error("geometry.semanticSelectors must be an array of CSS selectors.");
  }
  if (geometry.minSemanticFontSizePx !== undefined && (!Number.isFinite(geometry.minSemanticFontSizePx) || geometry.minSemanticFontSizePx <= 0)) {
    throw new Error("geometry.minSemanticFontSizePx must be a positive number.");
  }
  const stableSelectors = normalizeStableSelectors(geometry.stableAcrossStates);
  const regression = config.regression ?? {};
  for (const key of ["maxDiffPixels", "maxDiffPixelRatio", "pixelThreshold"]) {
    if (regression[key] !== undefined && (!Number.isFinite(regression[key]) || regression[key] < 0)) {
      throw new Error(`regression.${key} must be a non-negative number.`);
    }
  }
  if (regression.maxDiffPixelRatio !== undefined && regression.maxDiffPixelRatio > 1) {
    throw new Error("regression.maxDiffPixelRatio cannot exceed 1.");
  }
  if (regression.pixelThreshold !== undefined && regression.pixelThreshold > 255) {
    throw new Error("regression.pixelThreshold cannot exceed 255.");
  }
  return { ...config, pages, baseUrl: baseUrl.toString(), geometry: { ...geometry, clippingSelectors, semanticSelectors, stableAcrossStates: stableSelectors }, regression };
}

async function readConfig(configPath) {
  const absolutePath = path.resolve(configPath);
  const content = await readFile(absolutePath, "utf8");
  return { config: validateConfig(JSON.parse(content)), directory: path.dirname(absolutePath) };
}

function startServer(serverConfig, configDirectory, baseUrl) {
  if (!serverConfig) return null;
  const cwd = path.resolve(configDirectory, serverConfig.cwd ?? ".");
  const child = spawn(serverConfig.command, serverConfig.args ?? [], {
    cwd,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });
  const running = { child, exit: null, spawnError: null };
  running.exitPromise = new Promise((resolve) => child.once("exit", (code, signal) => {
    running.exit = { code, signal };
    resolve(running.exit);
  }));
  child.once("error", (error) => { running.spawnError = error; });
  running.readyUrl = new URL(serverConfig.readyPath ?? "/", baseUrl).toString();
  running.timeoutMs = serverConfig.startupTimeoutMs ?? 30_000;
  return running;
}

async function waitForServer(running) {
  if (!running) return;
  const deadline = Date.now() + running.timeoutMs;
  let lastError = "no successful response";
  while (Date.now() < deadline) {
    if (running.spawnError) throw new Error(`Could not start the configured server: ${running.spawnError.message}`);
    if (running.exit) throw new Error(`Configured server exited with code ${running.exit.code ?? "unknown"}. Check whether its port is already in use.`);
    try {
      const response = await fetch(running.readyUrl, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await delay(250);
  }
  throw new Error(`Server did not become ready at ${running.readyUrl} within ${running.timeoutMs} ms (${lastError}).`);
}

async function stopServer(running) {
  if (!running || running.exit || running.child.exitCode !== null) return;
  running.child.kill();
  await Promise.race([running.exitPromise, delay(3000)]);
  if (!running.exit && running.child.exitCode === null) running.child.kill("SIGKILL");
}

function chromiumFromDemoDependencies() {
  try {
    return demoRequire("playwright").chromium;
  } catch (error) {
    throw new Error(`Playwright is unavailable. Install the locked demo dependencies with "npm ci --prefix reusable-kit/demo". ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function performAction(page, action) {
  if (!action || typeof action !== "object" || typeof action.type !== "string") throw new Error("Each state action needs a type.");
  const selector = action.selector;
  switch (action.type) {
    case "click":
      await page.locator(requiredSelector(selector, action.type)).click();
      return;
    case "fill":
      await page.locator(requiredSelector(selector, action.type)).fill(String(action.value ?? ""));
      return;
    case "selectOption":
      if (action.value === undefined || action.value === null) throw new Error("selectOption action needs a value.");
      await page.locator(requiredSelector(selector, action.type)).selectOption(String(action.value));
      return;
    case "press":
      await page.locator(requiredSelector(selector, action.type)).press(requiredString(action.key, "press.key"));
      return;
    case "scrollIntoView":
      await page.locator(requiredSelector(selector, action.type)).scrollIntoViewIfNeeded();
      return;
    case "waitFor":
      await page.locator(requiredSelector(selector, action.type)).waitFor({ state: action.state ?? "visible", timeout: action.timeoutMs ?? undefined });
      return;
    case "wait": {
      const milliseconds = action.milliseconds ?? 250;
      if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 60_000) throw new Error("wait.milliseconds must be between 0 and 60000.");
      await page.waitForTimeout(milliseconds);
      return;
    }
    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}

function requiredSelector(value, actionType) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${actionType} action needs a selector.`);
  return value;
}

function requiredString(value, label) {
  if (typeof value !== "string" || !value) throw new Error(`${label} must be a non-empty string.`);
  return value;
}

async function collectGeometry(page, geometryConfig) {
  return page.evaluate(({ checkPageOverflow, minSemanticFontSizePx, semanticSelectors, clippingSelectors, stableAcrossStates }) => {
    const describe = (element) => {
      const classes = typeof element.className === "string" ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : [];
      return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classes.map((name) => `.${name}`).join("")}`;
    };
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden";
    };
    const root = document.documentElement;
    const body = document.body;
    const documentWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
    const documentHeight = Math.max(root.scrollHeight, body?.scrollHeight ?? 0);
    const metrics = {
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      document: { width: documentWidth, height: documentHeight, clientWidth: root.clientWidth, clientHeight: root.clientHeight },
      pageHorizontalOverflow: checkPageOverflow && documentWidth > root.clientWidth + 2,
      clippedElements: [],
      smallSemanticText: [],
      stableMeasurements: [],
    };

    if (minSemanticFontSizePx !== undefined) {
      for (const selector of semanticSelectors) {
        for (const element of document.querySelectorAll(selector)) {
          if (!visible(element)) continue;
          const text = (element.textContent ?? "").trim();
          if (!text && !["INPUT", "SELECT"].includes(element.tagName)) continue;
          const fontSizePx = Number.parseFloat(getComputedStyle(element).fontSize);
          if (fontSizePx < minSemanticFontSizePx) {
            metrics.smallSemanticText.push({ selector, element: describe(element), fontSizePx, sample: text.slice(0, 80) });
          }
        }
      }
      metrics.smallSemanticText = metrics.smallSemanticText.slice(0, 30);
    }

    for (const selector of clippingSelectors) {
      for (const target of document.querySelectorAll(selector)) {
        if (!visible(target)) continue;
        let ancestor = target;
        while (ancestor && ancestor !== body && ancestor !== root) {
          const style = getComputedStyle(ancestor);
          const axes = [];
          if (["hidden", "clip"].includes(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 1) axes.push("x");
          if (["hidden", "clip"].includes(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight + 1) axes.push("y");
          if (axes.length) {
            metrics.clippedElements.push({ selector, element: describe(target), clippingAncestor: describe(ancestor), axes });
            break;
          }
          ancestor = ancestor.parentElement;
        }
      }
    }

    for (const spec of stableAcrossStates) {
      const elements = Array.from(document.querySelectorAll(spec.selector)).filter(visible);
      metrics.stableMeasurements.push({
        selector: spec.selector,
        properties: spec.properties,
        tolerancePx: spec.tolerancePx,
        elements: elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: Number((rect.left + window.scrollX).toFixed(3)),
            y: Number((rect.top + window.scrollY).toFixed(3)),
            width: Number(rect.width.toFixed(3)),
            height: Number(rect.height.toFixed(3)),
          };
        }),
      });
    }
    return metrics;
  }, {
    checkPageOverflow: geometryConfig.checkPageHorizontalOverflow !== false,
    minSemanticFontSizePx: geometryConfig.minSemanticFontSizePx,
    semanticSelectors: geometryConfig.semanticSelectors,
    clippingSelectors: geometryConfig.clippingSelectors,
    stableAcrossStates: geometryConfig.stableAcrossStates,
  });
}

function geometryDiagnostics(metrics) {
  const diagnostics = [];
  if (metrics.pageHorizontalOverflow) {
    diagnostics.push({ severity: "error", code: "page-horizontal-overflow", message: `Document width ${metrics.document.width}px exceeds viewport width ${metrics.document.clientWidth}px.` });
  }
  for (const issue of metrics.clippedElements) {
    diagnostics.push({ severity: "error", code: "configured-content-clipped", message: `${issue.element} is clipped on ${issue.axes.join("/")} by ${issue.clippingAncestor}.`, selector: issue.selector });
  }
  if (metrics.smallSemanticText.length) {
    diagnostics.push({ severity: "warning", code: "small-semantic-text", message: `${metrics.smallSemanticText.length} visible semantic text element(s) are below the configured minimum.` });
  }
  return diagnostics;
}

async function computedStyleDiagnostics(page, assertions) {
  const diagnostics = [];
  for (const assertion of assertions) {
    const context = {
      selector: assertion.selector,
      property: assertion.property,
      expected: assertion.equals,
    };
    try {
      const locator = page.locator(assertion.selector);
      const count = await locator.count();
      if (count === 0) {
        diagnostics.push({
          severity: "error",
          code: "computed-style-selector-missing",
          message: `No element matches ${assertion.selector}; ${assertion.property} expected ${JSON.stringify(assertion.equals)}, actual <missing>.`,
          ...context,
          actual: null,
        });
        continue;
      }
      for (let index = 0; index < count; index += 1) {
        const actual = await locator.nth(index).evaluate((element, property) => getComputedStyle(element).getPropertyValue(property).trim(), assertion.property);
        if (actual !== assertion.equals) {
          diagnostics.push({
            severity: "error",
            code: "computed-style-mismatch",
            message: `${assertion.selector}${count > 1 ? `[${index}]` : ""} ${assertion.property} expected ${JSON.stringify(assertion.equals)}, actual ${JSON.stringify(actual)}.`,
            ...context,
            ...(count > 1 ? { elementIndex: index } : {}),
            actual,
          });
        }
      }
    } catch (error) {
      const actual = error instanceof Error ? `ERROR: ${error.message}` : `ERROR: ${String(error)}`;
      diagnostics.push({
        severity: "error",
        code: "computed-style-check-error",
        message: `${assertion.selector} ${assertion.property} could not be checked; expected ${JSON.stringify(assertion.equals)}, actual ${JSON.stringify(actual)}.`,
        ...context,
        actual,
      });
    }
  }
  return diagnostics;
}

function compareStableMeasurements(previousMetrics, currentMetrics) {
  const diagnostics = [];
  if (!previousMetrics || !currentMetrics) return diagnostics;
  for (const current of currentMetrics.stableMeasurements) {
    const previous = previousMetrics.stableMeasurements.find((item) => item.selector === current.selector);
    if (!previous) continue;
    if (!previous.elements.length || !current.elements.length) {
      diagnostics.push({ severity: "error", code: "stable-layout-missing", message: `${current.selector} must match a visible element in the first and current states.` });
      continue;
    }
    if (previous.elements.length !== current.elements.length) {
      diagnostics.push({ severity: "error", code: "stable-layout-count-changed", message: `${current.selector} matched ${previous.elements.length} element(s) in the first state and ${current.elements.length} in this state.` });
      continue;
    }
    current.elements.forEach((element, index) => {
      const before = previous.elements[index];
      const changed = current.properties.filter((property) => Math.abs(element[property] - before[property]) > current.tolerancePx);
      if (changed.length) {
        diagnostics.push({
          severity: "error",
          code: "stable-layout-changed",
          message: `${current.selector}[${index}] changed ${changed.map((property) => `${property} ${before[property]}→${element[property]}px`).join(", ")} (tolerance ${current.tolerancePx}px).`,
        });
      }
    });
  }
  return diagnostics;
}

async function compareScreenshots(page, actualBuffer, baselineBuffer, regression) {
  const result = await page.evaluate(async ({ actual, baseline, threshold }) => {
    const decode = async (data) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      return image;
    };
    const [actualImage, baselineImage] = await Promise.all([decode(actual), decode(baseline)]);
    const actualSize = { width: actualImage.naturalWidth, height: actualImage.naturalHeight };
    const baselineSize = { width: baselineImage.naturalWidth, height: baselineImage.naturalHeight };
    if (actualSize.width !== baselineSize.width || actualSize.height !== baselineSize.height) {
      return { dimensionsMatch: false, actualSize, baselineSize, diffPixels: null, diffPixelRatio: null, diffDataUrl: null };
    }
    const diffCanvas = document.createElement("canvas");
    diffCanvas.width = actualSize.width;
    diffCanvas.height = actualSize.height;
    const diffContext = diffCanvas.getContext("2d", { willReadFrequently: true });
    const actualCanvas = document.createElement("canvas");
    actualCanvas.width = diffCanvas.width;
    actualCanvas.height = diffCanvas.height;
    const actualContext = actualCanvas.getContext("2d", { willReadFrequently: true });
    const baselineCanvas = document.createElement("canvas");
    baselineCanvas.width = diffCanvas.width;
    baselineCanvas.height = diffCanvas.height;
    const baselineContext = baselineCanvas.getContext("2d", { willReadFrequently: true });
    actualContext.drawImage(actualImage, 0, 0);
    baselineContext.drawImage(baselineImage, 0, 0);
    const actualPixels = actualContext.getImageData(0, 0, diffCanvas.width, diffCanvas.height).data;
    const baselinePixels = baselineContext.getImageData(0, 0, diffCanvas.width, diffCanvas.height).data;
    const difference = diffContext.createImageData(diffCanvas.width, diffCanvas.height);
    let diffPixels = 0;
    for (let offset = 0; offset < actualPixels.length; offset += 4) {
      const changed = Math.max(
        Math.abs(actualPixels[offset] - baselinePixels[offset]),
        Math.abs(actualPixels[offset + 1] - baselinePixels[offset + 1]),
        Math.abs(actualPixels[offset + 2] - baselinePixels[offset + 2]),
        Math.abs(actualPixels[offset + 3] - baselinePixels[offset + 3]),
      ) > threshold;
      if (!changed) continue;
      diffPixels += 1;
      difference.data[offset] = 225;
      difference.data[offset + 1] = 35;
      difference.data[offset + 2] = 45;
      difference.data[offset + 3] = 220;
    }
    const diffPixelRatio = diffPixels / (diffCanvas.width * diffCanvas.height);
    let diffDataUrl = null;
    if (diffPixels) {
      diffContext.putImageData(difference, 0, 0);
      diffDataUrl = diffCanvas.toDataURL("image/png");
    }
    return { dimensionsMatch: true, actualSize, baselineSize, diffPixels, diffPixelRatio, diffDataUrl };
  }, {
    actual: actualBuffer.toString("base64"),
    baseline: baselineBuffer.toString("base64"),
    threshold: regression.pixelThreshold ?? 0,
  });

  if (!result.dimensionsMatch) return { ...result, passed: false, reason: "Screenshot dimensions differ." };
  const maxDiffPixels = regression.maxDiffPixels;
  const maxDiffPixelRatio = regression.maxDiffPixelRatio;
  const passed = maxDiffPixels === undefined && maxDiffPixelRatio === undefined
    ? result.diffPixels === 0
    : (maxDiffPixels === undefined || result.diffPixels <= maxDiffPixels)
      && (maxDiffPixelRatio === undefined || result.diffPixelRatio <= maxDiffPixelRatio);
  return { ...result, passed, reason: passed ? null : `Difference exceeds the configured allowance (${result.diffPixels} pixels, ${(result.diffPixelRatio * 100).toFixed(4)}%).` };
}

function safeRelativePath(root, target) {
  return path.relative(root, target).split(path.sep).join("/");
}

async function runState({ browser, config, configDirectory, outputDirectory, pageSpec, state, viewport, firstStateMetrics, report }) {
  const page = await browser.newPage();
  const consoleMessages = [];
  const diagnostics = [];
  let metrics = null;
  let geometryOutcome = "FAIL";
  let styleOutcome = pageSpec.computedStyles.length ? "FAIL" : "NOT_RUN";
  let stateError = null;
  page.setDefaultTimeout(config.actionTimeoutMs ?? 10_000);
  page.on("console", (message) => consoleMessages.push({ type: message.type(), text: message.text(), location: message.location() }));
  page.on("pageerror", (error) => consoleMessages.push({ type: "pageerror", text: error.message }));
  page.on("response", (response) => {
    const request = response.request();
    if (response.status() >= 400 && ["stylesheet", "script"].includes(request.resourceType())) {
      consoleMessages.push({ type: "asset-error", text: `${request.resourceType()} returned HTTP ${response.status()}: ${response.url()}` });
    }
  });
  page.on("requestfailed", (request) => {
    if (["stylesheet", "script"].includes(request.resourceType())) {
      consoleMessages.push({ type: "asset-error", text: `${request.resourceType()} failed to load: ${request.url()} (${request.failure()?.errorText ?? "unknown network error"})` });
    }
  });

  const result = {
    pageId: pageSpec.id,
    stateId: state.id,
    viewport: viewport.id,
    url: new URL(pageSpec.path, config.baseUrl).toString(),
    diagnostics,
    consoleMessages,
    screenshot: null,
    baseline: null,
    outcome: "FAIL",
    geometryOutcome,
    styleOutcome,
  };

  try {
    const response = await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: config.navigationTimeoutMs ?? 30_000 });
    if (response && !response.ok()) throw new Error(`Page request returned HTTP ${response.status()}.`);
    for (const action of state.actions) await performAction(page, action);
    await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
    const settleMs = state.settleMs ?? config.settleMs ?? 150;
    if (!Number.isFinite(settleMs) || settleMs < 0 || settleMs > 60_000) throw new Error("settleMs must be between 0 and 60000.");
    if (settleMs) await page.waitForTimeout(settleMs);

    const styleDiagnostics = await computedStyleDiagnostics(page, pageSpec.computedStyles);
    diagnostics.push(...styleDiagnostics);
    styleOutcome = styleDiagnostics.length ? "FAIL" : pageSpec.computedStyles.length ? "PASS" : "NOT_RUN";
    result.styleOutcome = styleOutcome;

    metrics = await collectGeometry(page, config.geometry);
    result.geometry = metrics;
    const currentGeometryDiagnostics = geometryDiagnostics(metrics);
    if (firstStateMetrics && config.geometry.stableAcrossStates.length) {
      currentGeometryDiagnostics.push(...compareStableMeasurements(firstStateMetrics, metrics));
    }
    diagnostics.push(...currentGeometryDiagnostics);
    geometryOutcome = currentGeometryDiagnostics.some((item) => item.severity === "error") ? "FAIL" : "PASS";
    result.geometryOutcome = geometryOutcome;

    const screenshotDirectory = path.join(outputDirectory, "screenshots", sanitizePathPart(pageSpec.id, "page.id"), viewport.id);
    await mkdir(screenshotDirectory, { recursive: true });
    const screenshotPath = path.join(screenshotDirectory, `${sanitizePathPart(state.id, "state.id")}.png`);
    const screenshot = await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: state.animations ?? "allow",
      caret: "hide",
    });
    result.screenshot = safeRelativePath(outputDirectory, screenshotPath);

    if (config.regression.baselineDir) {
      const baselineRoot = path.resolve(configDirectory, config.regression.baselineDir);
      const baselinePath = path.join(baselineRoot, sanitizePathPart(pageSpec.id, "page.id"), viewport.id, `${sanitizePathPart(state.id, "state.id")}.png`);
      try {
        await access(baselinePath);
        const comparison = await compareScreenshots(page, screenshot, await readFile(baselinePath), config.regression);
        const { diffDataUrl, ...comparisonReport } = comparison;
        result.baseline = { path: path.relative(configDirectory, baselinePath).split(path.sep).join("/"), ...comparisonReport };
        report.regression.compared += 1;
        if (!comparison.passed) {
          report.regression.failed += 1;
          const diffDirectory = path.join(outputDirectory, "diffs", sanitizePathPart(pageSpec.id, "page.id"), viewport.id);
          await mkdir(diffDirectory, { recursive: true });
          if (diffDataUrl) {
            const diffPath = path.join(diffDirectory, `${sanitizePathPart(state.id, "state.id")}.png`);
            await writeFile(diffPath, Buffer.from(diffDataUrl.slice("data:image/png;base64,".length), "base64"));
            result.baseline.diff = safeRelativePath(outputDirectory, diffPath);
          }
          diagnostics.push({ severity: "error", code: "baseline-diff", message: comparison.reason });
        }
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        report.regression.missing += 1;
        const required = config.regression.required === true;
        diagnostics.push({ severity: required ? "error" : "warning", code: "baseline-missing", message: `No approved baseline exists at ${baselinePath}.` });
        result.baseline = { path: path.relative(configDirectory, baselinePath).split(path.sep).join("/"), outcome: required ? "FAIL" : "NOT_RUN" };
        if (required) report.regression.failed += 1;
      }
    }
  } catch (error) {
    stateError = error instanceof Error ? error.message : String(error);
    diagnostics.push({ severity: "error", code: "state-execution-failed", message: stateError });
    result.error = stateError;
    result.geometryOutcome = "FAIL";
    if (pageSpec.computedStyles.length && styleOutcome === "FAIL") {
      result.styleOutcome = "FAIL";
    }
  } finally {
    const isBrowserError = (message) => ["error", "pageerror", "asset-error"].includes(message.type);
    const hasBrowserErrors = consoleMessages.some(isBrowserError);
    result.browserErrors = consoleMessages.filter(isBrowserError).length;
    result.outcome = stateError || diagnostics.some((item) => item.severity === "error") || hasBrowserErrors ? "FAIL" : "PASS";
    await page.close();
  }
  report.results.push(result);
  return metrics;
}

function summarizeStatuses(report, config) {
  const results = report.results;
  const hasResults = results.length > 0;
  const geometryPassed = hasResults && results.every((result) => result.geometryOutcome === "PASS");
  const browserErrors = results.some((result) => result.browserErrors > 0);
  let regressionStatus = "NOT_RUN";
  if (config?.regression?.baselineDir) {
    if (report.regression.failed > 0) regressionStatus = "FAIL";
    else if (report.regression.compared > 0 && report.regression.missing === 0) regressionStatus = "PASS";
  }
  const configuredStylePages = config?.pages.filter((page) => page.computedStyles.length) ?? [];
  const styleResults = results.filter((result) => configuredStylePages.some((page) => page.id === result.pageId));
  const styleStatus = configuredStylePages.length === 0
    ? "NOT_RUN"
    : !styleResults.length || styleResults.some((result) => result.styleOutcome !== "PASS")
      ? "FAIL"
      : "PASS";
  report.statuses = {
    BUILD: "NOT_RUN",
    GEOMETRY_QA: !hasResults ? "NOT_RUN" : geometryPassed ? "PASS" : "FAIL",
    STYLE_QA: styleStatus,
    VISUAL_REVIEW: "NOT_RUN",
    REGRESSION: regressionStatus,
    BROWSER_ERRORS: browserErrors ? "FAIL" : hasResults ? "PASS" : "NOT_RUN",
    HUMAN_ACCEPTANCE: "PENDING",
  };
  const fatalError = report.errors.length > 0;
  report.outcome = fatalError || report.statuses.GEOMETRY_QA === "FAIL" || report.statuses.STYLE_QA === "FAIL" || report.statuses.REGRESSION === "FAIL" || report.statuses.BROWSER_ERRORS === "FAIL" ? "FAIL" : "PASS";
}

function markdownReport(report) {
  const lines = [
    "# Visual QA report",
    "",
    `- Started: ${report.startedAt}`,
    `- Base URL: ${report.baseUrl ?? "not available"}`,
    `- Overall tool result: **${report.outcome}**`,
    "",
    "## Independent status",
    "",
    "| Check | Status |",
    "| --- | --- |",
    ...Object.entries(report.statuses ?? {}).map(([key, value]) => `| ${key} | ${value} |`),
    "",
    "BUILD and visual/human review are not performed by this runner. Read the screenshots before setting VISUAL_REVIEW or HUMAN_ACCEPTANCE.",
    "",
    "## Captures",
    "",
    "| Page | Viewport | State | Result | Geometry | Styles | Browser errors | Screenshot |",
    "| --- | --- | --- | --- | --- | --- | ---: | --- |",
    ...report.results.map((result) => `| ${result.pageId} | ${result.viewport} | ${result.stateId} | ${result.outcome} | ${result.geometryOutcome} | ${result.styleOutcome} | ${result.browserErrors} | ${result.screenshot ?? "not captured"} |`),
    "",
    "## Diagnostics",
    "",
  ];
  const diagnosticRows = report.results.flatMap((result) => result.diagnostics.map((item) => `- **${item.severity.toUpperCase()} ${item.code}** (${result.pageId}, ${result.viewport}, ${result.stateId}): ${item.message}`));
  lines.push(...(diagnosticRows.length ? diagnosticRows : ["No geometry or baseline diagnostics were reported."]));
  lines.push("", "## Browser console and page errors", "");
  const consoleRows = report.results.flatMap((result) => result.consoleMessages.map((message) => `- **${message.type}** (${result.pageId}, ${result.viewport}, ${result.stateId}): ${message.text}`));
  lines.push(...(consoleRows.length ? consoleRows : ["No console messages were captured."]));
  if (report.errors.length) lines.push("", "## Runner errors", "", ...report.errors.map((error) => `- ${error}`));
  lines.push("", "## Baseline comparison", "", `- Compared: ${report.regression.compared}`, `- Missing: ${report.regression.missing}`, `- Failed: ${report.regression.failed}`, "- Baselines are read-only; this command does not create or update approved snapshots.");
  return lines.join("\n") + "\n";
}

async function main() {
  const startedAt = new Date().toISOString();
  let options = null;
  let config = null;
  let configDirectory = process.cwd();
  let outputRoot = path.resolve(".visual-qa");
  let outputDirectory = null;
  let runningServer = null;
  let browser = null;
  const report = {
    tool: "PaperSkillWork Visual QA",
    startedAt,
    baseUrl: null,
    viewports: VIEWPORTS,
    statuses: {},
    outcome: "FAIL",
    regression: { compared: 0, missing: 0, failed: 0 },
    results: [],
    errors: [],
  };

  try {
    options = parseArguments(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    if (options.output) outputRoot = path.resolve(options.output);
    const loaded = await readConfig(options.config);
    config = loaded.config;
    configDirectory = loaded.directory;
    report.baseUrl = config.baseUrl;
    outputDirectory = path.join(outputRoot, `run-${startedAt.replace(/[:.]/g, "-")}`);
    await mkdir(outputDirectory, { recursive: true });

    runningServer = startServer(config.server, configDirectory, config.baseUrl);
    await waitForServer(runningServer);
    const chromium = chromiumFromDemoDependencies();
    browser = await chromium.launch({ headless: true });
    report.browser = { name: "Chromium", version: browser.version() };

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      try {
        for (const pageSpec of config.pages) {
          let firstStateMetrics = null;
          for (const state of pageSpec.states) {
            const metrics = await runState({ browser: context, config, configDirectory, outputDirectory, pageSpec, state, viewport, firstStateMetrics, report });
            if (!firstStateMetrics && metrics) firstStateMetrics = metrics;
          }
        }
      } finally {
        await context.close();
      }
    }
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    if (browser) await browser.close().catch(() => {});
    await stopServer(runningServer).catch((error) => report.errors.push(error instanceof Error ? error.message : String(error)));
  }

  if (!outputDirectory) {
    outputDirectory = path.join(outputRoot, `run-${startedAt.replace(/[:.]/g, "-")}`);
    await mkdir(outputDirectory, { recursive: true }).catch((error) => report.errors.push(`Could not create output directory: ${error.message}`));
  }
  summarizeStatuses(report, config);
  report.artifacts = {
    directory: outputDirectory,
    json: path.join(outputDirectory, "report.json"),
    markdown: path.join(outputDirectory, "report.md"),
  };
  await writeFile(report.artifacts.json, JSON.stringify(report, null, 2) + "\n", "utf8");
  await writeFile(report.artifacts.markdown, markdownReport(report), "utf8");
  process.stdout.write(`Visual QA ${report.outcome}. Report: ${report.artifacts.markdown}\n`);
  if (report.outcome === "FAIL") process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
