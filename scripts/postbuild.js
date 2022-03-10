const fs = require('fs');
const path = require('path');

function fixNodeFetch() {
	const filePath = path.join(process.cwd(), 'dist', 'src', 'utils', 'node-fetch.js');
	const file = fs.readFileSync(filePath);
	fs.writeFileSync(
		filePath,
		file.toString()
			.replace(`__importStar(require('node-fetch'))`, `import('node-fetch')`)
	);
}

fixNodeFetch();
