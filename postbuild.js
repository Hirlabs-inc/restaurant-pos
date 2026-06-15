const fs = require('fs');
const path = require('path');

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  for (const file of files) {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  }
}

try {
  // 1. Copy .next/static -> .next/standalone/.next/static
  const staticSource = path.join(__dirname, '.next', 'static');
  const staticTarget = path.join(__dirname, '.next', 'standalone', '.next', 'static');
  copyFolderRecursiveSync(staticSource, staticTarget);

  // 2. Copy public -> .next/standalone/public
  const publicSource = path.join(__dirname, 'public');
  const publicTarget = path.join(__dirname, '.next', 'standalone', 'public');
  copyFolderRecursiveSync(publicSource, publicTarget);

  // 3. Copy _redirects to .next/ for Netlify publish root
  const redirectsSource = path.join(__dirname, 'public', '_redirects');
  const redirectsTarget = path.join(__dirname, '.next', '_redirects');
  if (fs.existsSync(redirectsSource)) {
    fs.copyFileSync(redirectsSource, redirectsTarget);
    console.log('Copied _redirects to .next/');
  }

  console.log('Postbuild asset copying completed successfully!');
} catch (err) {
  console.error('Error during postbuild asset copying:', err);
  process.exit(1);
}
