import {parseCliArgs} from "./cli.mjs";
import {runForcePrompt, runPathPrompt, runPrompts} from "./prompts.mjs";
import * as fs from "node:fs";
import chalk from "chalk";
import {
    dockerCompose, dockerComposePackageJson,
    dockerfile,
    handlersJS,
    jsDeps,
    jsDevDeps,
    jsScripts,
    mainJS, nodemonJsonJs, nodemonJsonTs,
    packageJSON, tsconfig,
    tsDeps,
    tsDevDeps,
    tsScripts
} from "./templates.mjs";
import path from "path";
import {spawn} from "child_process";

export async function handleInput() {
    let [data, prompt] = parseCliArgs();
    if (prompt) data = {...data, ...(await runPrompts())};
    if (!data.path) data.path = await runPathPrompt(data.name);
    return data;
}

export function write({path: Path, name, version, typescript, dotenv, docker, dockerCompose}) {
    let ext = typescript ? "ts" : "js",
        mainPath = path.join(Path, `main.${ext}`),
        handlersPath = path.join(Path, `handlers.${ext}`),
        packagePath = path.join(Path, "package.json"),
        nodemonPath = path.join(Path, "nodemon.json");
    fs.writeFileSync(mainPath, mainJS(name, version, dotenv ? '\nimport "dotenv/config";\n\n' : "\n\n"), {encoding: "utf-8"});
    console.log(chalk.green(`Generated file ${chalk.blue(mainPath)}`));
    fs.writeFileSync(handlersPath, handlersJS(), {encoding: "utf-8"});
    console.log(chalk.green(`Generated file ${chalk.blue(handlersPath)}`));
    fs.writeFileSync(packagePath, packageJSON(name, version, typescript ? tsScripts() : jsScripts(),
        typescript ? tsDeps() : jsDeps(), typescript ? tsDevDeps() : jsDevDeps()), {encoding: "utf-8"});
    console.log(chalk.green(`Generated file ${chalk.blue(packagePath)}`));
    if (typescript) {
        let tsconfigPath = path.join(Path, "tsconfig.json");
        fs.writeFileSync(tsconfigPath, tsconfig, {encoding: "utf-8"});
        console.log(chalk.green(`Generated file ${chalk.blue(tsconfigPath)}`));
    }
    if (dotenv) {
        let dotenvPath = path.join(Path, ".env");
        fs.writeFileSync(dotenvPath, "", {encoding: "utf-8"});
        console.log(chalk.green(`Generated file ${chalk.blue(dotenvPath)}`));
    }
    fs.writeFileSync(nodemonPath, JSON.stringify(typescript ? nodemonJsonTs() : nodemonJsonJs(), null, 2),
        {encoding: "utf-8"});
    console.log(chalk.green(`Generated file ${chalk.blue(nodemonPath)}`));
    if (docker) {
        let dockerfilePath = path.join(Path, "Dockerfile");
        fs.writeFileSync(dockerfilePath, dockerfile(typescript, dockerCompose), {encoding: "utf-8"});
        console.log(chalk.green(`Generated file ${chalk.blue(dockerfilePath)}`));
    }
}

function writeDockerCompose(serviceName, Path, {name, version, typescript}) {
    let dockerComposePath = path.join(Path, "docker-compose.yaml"),
        packagePath = path.join(Path, "package.json"),
        nodemonPath = path.join(Path, "nodemon.json"),
        servicePath = path.join(Path, serviceName);
    fs.writeFileSync(dockerComposePath, dockerCompose(serviceName), {encoding: "utf-8"});
    console.log(chalk.green(`Generated file ${chalk.blue(dockerComposePath)}`));
    fs.writeFileSync(packagePath, dockerComposePackageJson(name, version, servicePath), {encoding: "utf-8"});
    console.log(chalk.green(`Generated file ${chalk.blue(packagePath)}`));
    fs.writeFileSync(nodemonPath, JSON.stringify(typescript ? nodemonJsonTs() : nodemonJsonJs(), null, 2),
        {encoding: "utf-8"});
    console.log(chalk.green(`Generated file ${chalk.blue(nodemonPath)}`));
}

async function mkDir(path, force = false, forceRequest = () => false) {
    if (fs.existsSync(path)) {
        force = force || forceRequest(fs.readdirSync(path).length);
        if (force instanceof Promise) force = await force;
        if (fs.readdirSync(path).length > 0 && !force) {
            console.log(chalk.red("Directory is existing and not empty"));
            process.exit(0);
        }
    } else {
        fs.mkdirSync(path);
        console.log(chalk.green(`Created directory ${(chalk.blue(`"${path}"`))}`));
    }
}

async function installLibs(path) {
    return new Promise(resolve => {
        console.log(chalk.magenta("Installing libraries"));
        let Process = spawn(`npm install`, [], {
            stdio: 'inherit',
            shell: true,
            cwd: path
        });
        process.on('SIGTERM', () => Process.kill('SIGTERM'));
        process.on('SIGINT', () => Process.kill('SIGINT'));
        process.on('SIGBREAK', () => Process.kill('SIGBREAK'));
        process.on('SIGHUP', () => Process.kill('SIGHUP'));
        Process.on("exit", () => {
            resolve();
        });
    });
}

export async function generate({path: Path, name, version, typescript, dotenv, force, docker, dockerCompose}, nested = false) {
    await mkDir(Path, force, files => runForcePrompt(files, Path));
    if (!nested) console.log(chalk.magenta("Generating files"));
    if (dockerCompose) {
        writeDockerCompose(dockerCompose, Path, {name, version, typescript});
        await generate({path: path.join(Path, dockerCompose), name, version, typescript, dotenv, force, docker: true}, true);
        await installLibs(Path);
        console.log(chalk.green("Done"));
        return;
    }
    write({path: Path, name, version, typescript, dotenv, docker, dockerCompose});
    await installLibs(Path);
    if (!nested) console.log(chalk.green("Done"));
}