#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import { cyan, green, yellow, red, bold } from 'kolorist';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
    console.log();
    console.log(bold(cyan('  🌌 Create Navigator App')));
    console.log();

    let targetDir = process.argv[2];

    if (!targetDir) {
        const result = await prompts({
            type: 'text',
            name: 'projectName',
            message: 'Project name:',
            initial: 'my-navigator-app'
        });

        targetDir = result.projectName;
    }

    if (!targetDir) {
        console.log(red('✖ Project name is required'));
        process.exit(1);
    }

    const root = path.join(process.cwd(), targetDir);

    // Check if directory exists
    if (fs.existsSync(root)) {
        const result = await prompts({
            type: 'confirm',
            name: 'overwrite',
            message: `Target directory "${targetDir}" already exists. Overwrite?`
        });

        if (!result.overwrite) {
            console.log(yellow('✖ Operation cancelled'));
            process.exit(0);
        }

        // Remove existing directory
        fs.rmSync(root, { recursive: true, force: true });
    }

    // Plugin selection
    const pluginChoices = await prompts({
        type: 'multiselect',
        name: 'plugins',
        message: 'Select input plugins:',
        choices: [
            { title: 'Keyboard', value: 'keyboard', selected: true },
            { title: 'Gesture (MediaPipe)', value: 'gesture', selected: true },
            { title: 'Voice Commands', value: 'voice', selected: false }
        ]
    });

    const selectedPlugins = pluginChoices.plugins || ['keyboard'];

    console.log();
    console.log(`Scaffolding project in ${green(root)}...`);
    console.log();

    // Create project directory
    fs.mkdirSync(root, { recursive: true });

    // Copy template files
    const templateDir = path.join(__dirname, 'template');
    copyDirectory(templateDir, root);

    // Generate config.yaml based on plugin selection
    const config = generateConfig(selectedPlugins);
    fs.writeFileSync(path.join(root, 'config.yaml'), config);

    // Create package.json
    const packageJson = {
        name: targetDir,
        version: '1.0.0',
        type: 'module',
        scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview'
        },
        devDependencies: {
            vite: '^5.4.10'
        }
    };
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    console.log(green('✔ Done!'));
    console.log();
    console.log('Now run:');
    console.log();
    console.log(bold(cyan(`  cd ${targetDir}`)));
    console.log(bold(cyan('  npm install')));
    console.log(bold(cyan('  npm run dev')));
    console.log();
}

function copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function generateConfig(plugins) {
    const pluginConfig = {};

    plugins.forEach(plugin => {
        pluginConfig[plugin] = { enabled: true };
    });

    return `# Navigator Configuration
navigator:
  version: "2.0"

  # Layers configuration
  layers:
    - id: "welcome"
      name: "Welcome"
      cards:
        - title: "Welcome to Navigator"
          type: "text"
          content: "Use ${plugins.join(', ')} to navigate"
        - title: "Card 2"
          type: "text"
          content: "Navigate to the next card"
        - title: "Card 3"
          type: "text"
          content: "Great! You're navigating successfully"

  # Plugins configuration
  plugins:
${Object.entries(pluginConfig).map(([key, value]) =>
        `    ${key}:\n      enabled: ${value.enabled}`
    ).join('\n')}
`;
}

init().catch(console.error);
