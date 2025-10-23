// Clean cache after build to reduce deployment size
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(process.cwd(), '.next', 'cache');

console.log('🧹 Cleaning cache directory for deployment...');

if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ Cache directory removed successfully');
} else {
  console.log('ℹ️  No cache directory found');
}
