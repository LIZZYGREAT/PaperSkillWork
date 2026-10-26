"""Rebuild one R4 scene in a disposable CLI workspace and preview it locally."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
KIT = ROOT / "reusable-kit"
DEMO = KIT / "demo"
VALIDATION = Path(__file__).resolve().parent
NODE = shutil.which("node")
VITE = DEMO / "node_modules/vite/bin/vite.js"
TSC = DEMO / "node_modules/typescript/bin/tsc"

SCENES = {
    "network": {
        "paper_id": "r4-network-trial",
        "title": "R4 synthetic network validation",
        "assets": ["MiniNetworkGlyph"],
        "files": [
            (VALIDATION / "scenes/network/App.tsx", "src/App.tsx"),
            (VALIDATION / "scenes/network/network-illustration.css", "src/network-illustration.css"),
        ],
        "entry": "network",
    },
    "matrix-reference": {
        "paper_id": "r4-matrix-reference",
        "title": "R4 matrix calculation reference",
        "assets": [],
        "files": [
            (VALIDATION / "scenes/matrix-reference/CalculationToy.tsx", "src/CalculationToy.tsx"),
            (VALIDATION / "scenes/matrix-reference/style.css", "src/style.css"),
        ],
        "entry": "matrix",
    },
    "vector-clipping": {
        "paper_id": "r4-vector-clipping-trial",
        "title": "R4 vector norm clipping validation",
        "assets": ["RepresentationVector", "ResponseMeter", "FlowConnector"],
        "files": [
            (VALIDATION / "scenes/vector-clipping/App.tsx", "src/App.tsx"),
            (VALIDATION / "scenes/vector-clipping/scene.css", "src/scene.css"),
        ],
        "entry": "kit-scene",
    },
}


def run(command: list[str], cwd: Path, *, capture: bool = False) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        cwd=cwd,
        check=False,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=capture,
    )
    if result.returncode:
        if capture:
            if result.stdout:
                print(result.stdout, end="")
            if result.stderr:
                print(result.stderr, end="", file=sys.stderr)
        raise RuntimeError("Command exited {}: {}".format(result.returncode, subprocess.list2cmdline(command)))
    return result


def copy_kit(source: Path, destination: Path) -> None:
    source = source.resolve()

    def ignore(directory: str, names: list[str]) -> set[str]:
        if Path(directory).resolve() == source:
            return set(names).intersection({"demo", "validation"})
        return set()

    shutil.copytree(source, destination, ignore=ignore)


def entry_source(kind: str) -> str:
    if kind == "matrix":
        return '''import React from "react";
import { createRoot } from "react-dom/client";
import { CalculationToy } from "./CalculationToy";
import "./style.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root element");
createRoot(root).render(<React.StrictMode><CalculationToy /></React.StrictMode>);
'''
    if kind == "kit-scene":
        return '''import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./shared/foundation/styles/kit.css";
import "./scene.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root element");
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
'''
    return '''import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root element");
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
'''


def prepare(scene: dict[str, object], temp_root: Path) -> tuple[Path, dict[str, object]]:
    workspace = temp_root / "tool-workspace"
    (workspace / "tools").mkdir(parents=True)
    (workspace / "papers").mkdir()
    shutil.copy2(ROOT / "tools/paper.py", workspace / "tools/paper.py")
    shutil.copytree(ROOT / "templates", workspace / "templates")
    copy_kit(KIT, workspace / "reusable-kit")

    cli = workspace / "tools/paper.py"
    paper_id = str(scene["paper_id"])
    run([sys.executable, str(cli), "new", paper_id, "--title", str(scene["title"]), "--url", "https://example.invalid/r4"], workspace)

    assets = list(scene["assets"])
    app = workspace / "papers" / paper_id / "web/enhanced"
    selection: dict[str, object] = {"assets": assets, "dry_run": {}, "copy_exit": 0}
    if assets:
        dry = run([sys.executable, str(cli), "scaffold-kit", paper_id, "--select", ",".join(assets), "--allow-unapproved", "--dry-run"], workspace, capture=True)
        selection["dry_run"] = json.loads(dry.stdout)
        run([sys.executable, str(cli), "scaffold-kit", paper_id, "--select", ",".join(assets), "--allow-unapproved"], workspace)

    for source, relative in scene["files"]:
        target = app / str(relative)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(Path(source), target)
    (app / "src/main.tsx").write_text(entry_source(str(scene["entry"])), encoding="utf-8")
    return app, selection


def build(app: Path) -> None:
    run([NODE, str(TSC), "--project", str(app / "tsconfig.json")], app)
    run([NODE, str(VITE), "build", "--configLoader", "runner"], app)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scene", required=True, choices=sorted(SCENES))
    parser.add_argument("--port", type=int, default=4179)
    parser.add_argument("--check-only", action="store_true", help="rebuild the exact Registry closure and compile without starting a server")
    args = parser.parse_args()

    if not NODE or not VITE.is_file() or not TSC.is_file():
        parser.error("Install the Demo dependencies first with `npm.cmd install --prefix reusable-kit/demo`.")
    scene = SCENES[args.scene]

    try:
        with tempfile.TemporaryDirectory(prefix="r4-{}-".format(args.scene), dir=DEMO) as temporary:
            app, selection = prepare(scene, Path(temporary))
            print("\nR4 scene: {}".format(args.scene))
            if selection["assets"]:
                print("Registry selection: {}".format(", ".join(selection["assets"])))
                print("Exact CLI closure:")
                for path in selection["dry_run"].get("files", []):
                    print("  {}".format(path))
            else:
                print("Registry selection: none (the earlier matrix trial was a justified local implementation)")
            build(app)
            print("\nPASS: isolated TypeScript and Vite production build")
            if args.check_only:
                return 0

            url = "http://127.0.0.1:{}".format(args.port)
            print("\nOpen this URL in Edge or another desktop browser: {}".format(url), flush=True)
            print("Press F11 to inspect browser full-screen; press Ctrl+C here to stop and remove the temporary project.", flush=True)
            server = subprocess.Popen(
                [NODE, str(VITE), "--configLoader", "runner", "--host", "127.0.0.1", "--port", str(args.port), "--strictPort"],
                cwd=app,
            )
            try:
                return server.wait()
            except KeyboardInterrupt:
                return 0
            finally:
                if server.poll() is None:
                    server.terminate()
                    try:
                        server.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        server.kill()
                        server.wait(timeout=5)
    except (OSError, RuntimeError, json.JSONDecodeError) as error:
        print("R4 preview failed: {}".format(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
