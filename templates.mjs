export const tsconfig = `{
  "compilerOptions": {
    /* Visit https://aka.ms/tsconfig to read more about this file */
    "target": "es2016",
    "module": "ES2022",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "outDir": "./dist"
  }
}`

function spacedStringify(object, spaces) {
    let str = JSON.stringify(object, null, 2 + spaces).split('\n');
    str.pop();
    return str.join('\n') + `\n${' '.repeat(spaces)}}`;
}

export function packageJSON(name, version, scripts, deps, devDeps) {
    return `{
  "name": "${name}",
  "version": "${version}",
  "main": "main.js",
  "scripts": ${spacedStringify(scripts, 2)},
  "type": "module",
  "dependencies": ${spacedStringify(deps, 2)},
  "devDependencies": ${spacedStringify(devDeps, 2)}
}`
}

export function mainJS(name, version, beforeAppStr = "\n\n") {
    return `import SBackend from "sbackend";
import handlers from "./handlers.js";${beforeAppStr}
const app = new SBackend({
    name: "${name}",
    version: "${version}",
    logPath: "./latest.log"
});

app.addHandlers(handlers);

app.get("/", (request, response) => {
    console.log(request.body); // request body
    console.log(request.headers); // request headers
    console.log(request.query); // query (after '?' in route string)
    response.end("test"); // argument can be string or object
});

app.start(() => {
    console.log(app.routes);
});`
}

export function handlersJS() {
    return `import {buildHandlers} from "sbackend";

export default buildHandlers({
    get: {
        "/test"(request, response, next) {
            console.log(request.body); // request body
            console.log(request.headers); // request headers
            console.log(request.query); // query (after '?' in route string)
            response.end("test"); // argument can be string or object
        }
    },
    post: {}
});`
}

export function jsScripts() {
    return {
        start: "node main.js",
        dev: 'nodemon "npm start"'
    }
}

export function tsScripts() {
    return {
        build: "tsc",
        start: "npm run build && node --es-module-specifier-resolution=node ./dist/main.js",
        dev: 'nodemon --exec "npm start"'
    }
}

export function jsDeps(dotenv) {
    return {
        sbackend: "^0.2.3",
        ...(dotenv ? {dotenv: "^16.4.5"} : {})
    }
}

export function tsDeps(dotenv) {
    return {
        sbackend: "^0.2.3",
        ...(dotenv ? {dotenv: "^16.4.5"} : {})
    }
}

export function jsDevDeps() {
    return {
        nodemon: "^3.1.2"
    }
}

export function tsDevDeps() {
    return {
        typescript: "^5.4.5",
        nodemon: "^3.1.2"
    }
}

export function nodemonJsonJs() {
    return {
        ext: "js, mjs, cjs, json, graphql"
    }
}

export function nodemonJsonTs() {
    return {
        ignore: ["./dist"],
        ext: "ts, mts, cts, json, graphql"
    }
}

export function dockerfile(typescript, compose) {
    return `FROM node:20.11.0-alpine3.18 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY ${typescript ? "./dist" : "./"} ./${compose ? "" : `

CMD ["node", "/app/main.js"]`}`
}

export function dockerCompose(serviceName) {
    return `version: "3"
services:
  ${serviceName}:
    build: ./${serviceName}
    command: node main.js`
}

export function dockerComposePackageJson(name, version, servicePath) {
    return `{
  "name": "${name}",
  "version": "${version}",
  "scripts": {
    "build": "npm run build --prefix \\"${servicePath}\\" && docker-compose build",
    "up": "docker-compose up",
    "start": "npm run build && npm run up",
    "dev": "nodemon --exec \\"npm start\\""
  },
  "devDependencies": {
    "nodemon": "^3.1.2"
  }
}`
}