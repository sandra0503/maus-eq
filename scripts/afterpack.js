// electron-builder afterPack hook: ad-hoc sign the packaged .app so a
// downloaded (quarantined) copy shows the recoverable "unidentified developer"
// prompt instead of the scary "damaged — move to Trash" error on Apple Silicon.
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename; // "Maus EQ"
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  console.log('[afterPack] ad-hoc signing', appPath);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], {
    stdio: 'inherit',
  });
};
