#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 CNTRL Platform - Dependency Fix Script');
console.log('==========================================\n');

// Function to run command and log output
function runCommand(command, cwd = process.cwd()) {
  console.log(`> ${command}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, npm_config_legacy_peer_deps: 'true' }
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${command}`);
    return false;
  }
}

// Clean all node_modules
console.log('🧹 Cleaning node_modules directories...');
const dirsToClean = [
  '.',
  'frontend',
  'backend', 
  'shared'
];

dirsToClean.forEach(dir => {
  const nodeModulesPath = path.join(dir, 'node_modules');
  const packageLockPath = path.join(dir, 'package-lock.json');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log(`Removing ${nodeModulesPath}`);
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }
  
  if (fs.existsSync(packageLockPath)) {
    console.log(`Removing ${packageLockPath}`);
    fs.unlinkSync(packageLockPath);
  }
});

// Update frontend package.json to fix React versions
console.log('\n📦 Updating frontend package.json...');
const frontendPackageJsonPath = path.join('frontend', 'package.json');
const frontendPackageJson = JSON.parse(fs.readFileSync(frontendPackageJsonPath, 'utf8'));

// Force React versions
frontendPackageJson.dependencies.react = '18.3.1';
frontendPackageJson.dependencies['react-dom'] = '18.3.1';

// Add resolutions to force React version
frontendPackageJson.resolutions = {
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "@types/react": "^18.2.45",
  "@types/react-dom": "^18.2.18"
};

// Ensure overrides exist
frontendPackageJson.overrides = frontendPackageJson.overrides || {};
frontendPackageJson.overrides.react = '18.3.1';
frontendPackageJson.overrides['react-dom'] = '18.3.1';

fs.writeFileSync(frontendPackageJsonPath, JSON.stringify(frontendPackageJson, null, 2));
console.log('✅ Updated frontend package.json');

// Create .npmrc with proper settings
console.log('\n📝 Creating .npmrc files...');
const npmrcContent = `legacy-peer-deps=true
auto-install-peers=true
fund=false
audit=false`;

fs.writeFileSync('.npmrc', npmrcContent);
fs.writeFileSync(path.join('frontend', '.npmrc'), npmrcContent);
console.log('✅ Created .npmrc files');

// Install dependencies
console.log('\n📥 Installing dependencies...');

// Install root dependencies first
if (!runCommand('npm install --legacy-peer-deps')) {
  console.log('❌ Failed to install root dependencies');
  process.exit(1);
}

// Install shared dependencies and build
console.log('\n🔗 Building shared package...');
if (!runCommand('npm install --legacy-peer-deps', 'shared')) {
  console.log('⚠️ Warning: Failed to install shared dependencies');
}
if (!runCommand('npm run build', 'shared')) {
  console.log('⚠️ Warning: Failed to build shared package');
}

// Install backend dependencies
console.log('\n🖥️ Installing backend dependencies...');
if (!runCommand('npm install --legacy-peer-deps', 'backend')) {
  console.log('⚠️ Warning: Failed to install backend dependencies');
}

// Install frontend dependencies with specific React version
console.log('\n🎨 Installing frontend dependencies...');
if (!runCommand('npm install react@18.3.1 react-dom@18.3.1 --save --legacy-peer-deps', 'frontend')) {
  console.log('❌ Failed to install React');
}
if (!runCommand('npm install --legacy-peer-deps', 'frontend')) {
  console.log('❌ Failed to install frontend dependencies');
  process.exit(1);
}

console.log('\n✅ Dependency fix completed!');
console.log('\n🚀 Try running the development servers:');
console.log('   npm run dev:backend  # Backend on port 8000');
console.log('   npm run dev:frontend # Frontend on port 3000');
console.log('   # Or both: npm run dev');