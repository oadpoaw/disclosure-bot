const fs = require('fs');
const path = require('path');
const makePath = (p = '') => path.join(process.cwd(), 'plugins', p);

for (const file of fs.readdirSync(makePath('plugins'))) {
	if (file.endsWith('.js')) {
		const buffer = fs.readFileSync(makePath(`plugins${path.sep}${file}`));
		fs.writeFileSync(
			makePath(file),
			buffer.toString()
				.replace(/exports\./, `module.exports.`)
				.replace(/module\.exports\.default/g, `module.exports`)
		);
	}
}

require('./prebuild-plugins');