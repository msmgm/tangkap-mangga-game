import * as fs from 'node:fs';
import * as path from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR || '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

console.log(`Starting main.ts: botDir=${botDir}, outputDir=${outputDir}`);

try {
    const srcPath = path.join(botDir, 'POST.json');
    const destDir = path.resolve(outputDir);
    const destPath = path.join(destDir, 'POST.json');

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Successfully copied POST.json to ${destPath} at ${new Date().toISOString()}`);
    } else {
        console.error(`Source POST.json not found at ${srcPath}`);
        process.exit(1);
    }
} catch (err) {
    console.error('Error in main.ts:', err);
    process.exit(1);
}
