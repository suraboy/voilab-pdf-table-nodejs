{
  "name": "voilab-pdf-table",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node dist/server.js --max_old_space_size=4096",
    "build": "babel ./ -d dist",
    "dev": "NODE_ENV=local nodemon --exec babel-node server.js",
    "test": "jest --forceExit --detectOpenHandles",
    "coverage": "jest --coverage --coverageDirectory=coverage --forceExit --detectOpenHandles"
  },
  "repository": {
    "type": "git",
    "url": "http://git365.eggdigital.com/horeca/horeca-report.git"
  },
  "author": "",
  "license": "ISC",
  "keywords": [],
  "description": "Generate Report",
  "dependencies": {
    "pdfkit": "^0.11.0",
    "voilab-pdf-table": "^0.5.0"
  }
}
