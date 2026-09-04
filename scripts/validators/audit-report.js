#!/usr/bin/env node
//
// Reads a `pnpm audit --json` report and says which of three things happened.
//
// `pnpm audit` writes well-formed JSON either way, so "is it JSON" tells us
// nothing: a network failure comes back as
// {"error":{"code":"ERR_SOCKET_TIMEOUT","message":"..."}}. What separates the
// two is whether a report is in there at all — and an audit that could not run
// must not read like an audit that found something.
//
//   exit 0 - a report arrived and nothing critical is in it
//   exit 3 - a report arrived and it names a critical production vulnerability
//   exit 4 - no report arrived
//
import fs from 'node:fs';

let report;
try {
    report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
} catch {
    console.log('the response was not JSON');
    process.exit(4);
}

if (report.error || !report.metadata) {
    const { code, message } = report.error || {};
    console.log(code ? `${code}: ${message}` : 'no report in the response');
    process.exit(4);
}

const counts = report.metadata.vulnerabilities || {};
const present = Object.entries(counts).filter(([, n]) => n > 0);
console.log(present.length
    ? 'Advisories: ' + present.map(([level, n]) => `${n} ${level}`).join(', ')
    : 'No advisories reported.');

for (const advisory of Object.values(report.advisories || {})) {
    console.log(`  [${advisory.severity}] ${advisory.module_name}: ${advisory.title}`);
}

process.exit(counts.critical > 0 ? 3 : 0);
