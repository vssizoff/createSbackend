import {program} from "commander";
import path from "path";

export function parseCliArgs() {
    program.name("Create sbackend").description("Create sbackend project").version("0.0.0");

    program.argument("[path]", "Path to project directory ('.' to generate here)");
    program.argument("[name]", "Project name");
    program.option("--ts, --typescript", "Use typescript");
    program.option("--dotenv", "Use dotenv");
    program.option("-f, --force", "Remove files if conflict when creating");
    program.option("-d, --docker", "Use docker");
    program.option("--dc, --docker-compose <string>", "Use docker compose (argument is a service name)");
    program.option("--ver <string>", "Project version");

    program.parse();
    let Path = path.resolve(program.args[0]), options = program.opts();
    if ("docker" in options && "docker-compose" in options) delete options.docker;
    return [{...options, path: Path, name: program.args[1] ?? Path.split("/").pop(), dockerCompose: options["docker-compose"]},
        !("name" in options || "typescript" in options || "dotenv" in options || "force" in options || "docker" in options || "docker-compose" in options || "version" in options)];
}