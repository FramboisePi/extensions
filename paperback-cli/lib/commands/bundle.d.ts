import { flags } from '@oclif/command';
import Command from '../command';
export default class Bundle extends Command {
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        folder: flags.IOptionFlag<string | undefined>;
    };
    run(): Promise<void>;
    generateVersioningFile(folder?: string): Promise<void>;
    generateSourceInfo(sourceId: string, directoryPath: string): Promise<any>;
    bundleSources(folder?: string): Promise<void>;
    bundle(file: string, sourceDir: string, destDir: string): Promise<void>;
    generateHomepage(): Promise<void>;
}
