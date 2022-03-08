# ts-project-template
## Project Details
TypeScript Project Template
### Contains
- TypeScript
- Git Hooks
- ETC

## Instructions

### Clone the Repository
```sh
git clone https://github.com/oadpoaw/ts-project-template.git
cd ts-project-template
```

### Install Packages
```sh
npm install
```

### Environment Variables
```
cp .env.example .env
```
Then fill in the required variables.

### Starting the Project (Dev Mode)
```sh
npm start
```

### Building the Project (Prod Mode)
```sh
npm run build
```

## Deploying

### Deploy with PM2
```sh
pm2 start ecosystem.config.js
```

## License
[See here](LICENSE)