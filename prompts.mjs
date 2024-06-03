import prompts from "prompts";
import path from "path";
import chalk from "chalk";

export const questions = [
    {
        type: "text",
        name: "name",
        message: "Project name"
    },
    {
        type: "text",
        name: "version",
        message: "Project version"
    },
    {
        type: "toggle",
        name: "typescript",
        message: "Use typescript"
    },
    {
        type: "toggle",
        name: "dotenv",
        message: "Use dotenv"
    },
    {
        type: "select",
        name: "docker",
        message: "Use docker",
        choices: [
            {title: "No", value: 0},
            {title: "Docker", value: 1},
            {title: "Docker compose", value: 2}
        ]
    },
    {
        type: prev => prev === 2 ? "text" : null,
        name: "dockerComposeService",
        message: "Docker compose service name"
    }
];

export async function runPrompts() {
    let data = await prompts(questions);
    data = {...data, ...(data.docker === 2 ? {dockerCompose: data.dockerComposeService} : {})};
    if (data.docker !== 1) delete data.docker;
    else data.docker =  true;
    return data;
}

export async function runPathPrompt(name) {
    return path.resolve((await prompts([
        {
            type: "text",
            name: "path",
            message: "Path to project directory ('.' to generate here)",
            initial: name
        }
    ])).path);
}

export async function runForcePrompt(files, path) {
    return (await prompts([
        {
            type: "toggle",
            name: "force",
            message: `Found ${chalk.blue(files)} in directory ${chalk.blue(path)}. Remove them when conflict?`
        }
    ])).force;
}