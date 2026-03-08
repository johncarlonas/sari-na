const fs = require("node:fs");
const path = require("node:path");

const targetDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "@rnmapbox",
  "maps",
  "lib",
  "module",
  "specs"
);

const targetFile = path.join(targetDir, "RNMBXCameraGestureObserverNativeComponent.js");

const shimContent = `import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export const OnMapSteadyEvent = {};

export default codegenNativeComponent('RNMBXCameraGestureObserver');
`;

try {
  if (!fs.existsSync(targetDir)) {
    process.exit(0);
  }

  if (!fs.existsSync(targetFile)) {
    fs.writeFileSync(targetFile, shimContent, "utf8");
    console.log("[fix-rnmapbox-spec] Created RNMBX camera gesture shim.");
  } else {
    console.log("[fix-rnmapbox-spec] Shim already exists.");
  }
} catch (error) {
  console.warn("[fix-rnmapbox-spec] Failed to create shim:", error);
}
