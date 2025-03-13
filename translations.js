import fs from 'fs';


function constructLeafNames(obj, aggrKey, mySet) {
	if (typeof obj !== 'object') {
		mySet.add(aggrKey);
	} else {
		for (const item in obj) {
			if (aggrKey !== '') {
				constructLeafNames(obj[item], `${aggrKey}.${item}`, mySet)
			} else {
				constructLeafNames(obj[item], `${item}`, mySet)
			}
		}
	}
}
console.log("Checking files in src/locales...\n");
const dir = fs.readdirSync('./src/locales');
const locales = {};
for (const locale of dir) {
	try {
		locales[locale.split(".")[0]] = JSON.parse(fs.readFileSync(`./src/locales/${locale}`));
	} catch (e) {
		console.log(`${locale} does not have a <locale>.json name or content is not valid json`)
	}
}

// default locale is en
const leafNames = new Set();
constructLeafNames(locales['en'], '', leafNames);

const coverageResults = {};

for (const lc in locales) {
	if (lc == 'en') {
		continue;
	}
	console.log(`\x1b[32m- ${lc} detected\x1b[0m`);
	console.log(`Missing for ${lc}:`);
	const lcLeafs = new Set();
	constructLeafNames(locales[lc], '', lcLeafs);
	let missingCount = 0;
	for (const item of leafNames) {
		if (!lcLeafs.has(item)) {
			console.log(item);
			missingCount++;
		}
	}
	const completion = ((1 - missingCount / leafNames.size) * 100).toFixed(2);
	console.log(`${missingCount} entries (${(100 - (missingCount * 100.0 / lcLeafs.size)).toFixed(2)}% completion)`);
	console.log('');
	coverageResults[lc] = Number(completion);
}

// Save JSON files only if running in CI
if (process.env.CI) {
		console.log("Running in CI - Saving coverage reports...");

		for (const [lang, percent] of Object.entries(coverageResults)) {
			const color = percent >= 100 ? "brightgreen" : percent >= 80 ? "yellow" : "red";
			const langResult = {
				schemaVersion: 1,
				label: `${lang.toUpperCase()} Coverage`,
				message: `${percent}%`,
				color: color,
			};
			fs.writeFileSync(`coverage_${lang}.json`, JSON.stringify(langResult, null, 2));
		}
}
