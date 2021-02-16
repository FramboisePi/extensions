import Command from '../command';
export default class Bundle extends Command {
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
    };
    run(): Promise<void>;
    generateVersioningFile(): Promise<void>;
    generateSourceInfo(sourceId: string, directoryPath: string): Promise<any>;
    bundleSources(): Promise<void>;
    bundle(file: string, sourceDir: string, destDir: string): Promise<void>;
    generateHomepage(): Promise<void>;
}
