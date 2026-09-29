import fs from 'fs';


function constructLeafNames(obj, aggrKey, mySet, values) {
	if (typeof obj !== 'object') {
		mySet.add(aggrKey);
		values?.set(aggrKey, obj);
	} else {
		for (const item in obj) {
			if (aggrKey !== '') {
				constructLeafNames(obj[item], `${aggrKey}.${item}`, mySet, values)
			} else {
				constructLeafNames(obj[item], `${item}`, mySet, values)
			}
		}
	}
}

function validateLocale(obj, locale, aggrKey = '') {
	if (typeof obj === 'string') {
		return [];
	}
	if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
		return [`${locale}: ${aggrKey || '<root>'} must be an object or string`];
	}

	const errors = [];
	for (const item in obj) {
		const key = aggrKey !== '' ? `${aggrKey}.${item}` : item;
		errors.push(...validateLocale(obj[item], locale, key));
	}
	return errors;
}

console.log("Checking files in src/locales...\n");
const dir = fs.readdirSync('./src/locales');
const locales = {};
const validationErrors = [];
for (const filename of dir) {
	if (!/^[A-Za-z0-9_-]+\.json$/.test(filename)) {
		validationErrors.push(`${filename} does not have a <locale>.json name`);
		continue;
	}

	const locale = filename.slice(0, -'.json'.length);
	try {
		locales[locale] = JSON.parse(fs.readFileSync(`./src/locales/${filename}`, 'utf8'));
		validationErrors.push(...validateLocale(locales[locale], locale));
	} catch (e) {
		validationErrors.push(`${filename} is not valid JSON: ${e.message}`);
	}
}

if (!locales['en']) {
	validationErrors.push('src/locales/en.json is required');
}

if (validationErrors.length > 0) {
	console.error('Translation validation failed:');
	for (const error of validationErrors) {
		console.error(`- ${error}`);
	}
	process.exit(1);
}

// default locale is en
const leafNames = new Set();
constructLeafNames(locales['en'], '', leafNames);
if (leafNames.size === 0) {
	console.error('Translation validation failed: English must contain at least one translation');
	process.exit(1);
}

const coverageResults = {};

for (const lc in locales) {
	if (lc === 'en') {
		continue;
	}
	console.log(`\x1b[32m- ${lc} detected\x1b[0m`);

	console.log(`Missing for ${lc}:`);
	const lcLeafs = new Set();
	const lcValues = new Map();
	constructLeafNames(locales[lc], '', lcLeafs, lcValues);
	let missingCount = 0;
	for (const item of leafNames) {
		if (!lcLeafs.has(item) || lcValues.get(item).trim() === '') {
			console.log(item);
			missingCount++;
		}
	}
	const completion = ((leafNames.size - missingCount) / leafNames.size * 100).toFixed(2);

	console.log();
	console.log(`Extraneous for ${lc}:`);
	let extraCount = 0;
	for (const item of lcLeafs) {
		if (!leafNames.has(item)) {
			console.log(item);
			extraCount++;
		}
	}

	console.log(`${missingCount} missing entries (${completion}% completion)`);
	console.log(`${extraCount} extraneous entries`);
	console.log('');
	coverageResults[lc] = Number(completion);
}

function removeExtraneousKeys(src, target) {
	if (target instanceof Object && !(target instanceof Array)) {
		return Object.keys(src).reduce(
			(result, key) => {
				result[key] = removeExtraneousKeys(src[key], target[key]);
				return result;
			},
			{},
		);
	} else {
		return target;
	}
}

function sortKeys(obj) {
	if (obj instanceof Object && !(obj instanceof Array)) {
		return Object.keys(obj).sort().reduce(
			(result, key) => {
				result[key] = sortKeys(obj[key]);
				return result;
			},
			{},
		);
	} else {
		return obj;
	}
}

console.log("Tidying keys in translation files...");
for (const loc in locales) {
	const extraneousRemoved = removeExtraneousKeys(locales['en'], locales[loc]);
	const sorted = sortKeys(extraneousRemoved);
	fs.writeFileSync(`./src/locales/${loc}.json`, JSON.stringify(sorted, null, "\t"));
}

// Save JSON files
console.log("Saving coverage reports...");

for (const [lang, percent] of Object.entries(coverageResults)) {
	const color = percent >= 100 ? "brightgreen" : percent >= 80 ? "yellow" : "red";
	const langResult = {
		schemaVersion: 1,
		label: `${lang.toUpperCase()} Coverage`,
		message: `${percent}%`,
		color: color,
	};
	const filename = `./translation_coverage/coverage_${lang}.json`
	fs.writeFileSync(filename, JSON.stringify(langResult, null, "\t") + "\n");
	console.log(`Saved ${filename}`)
}
