import Command from '../command';
export default class Serve extends Command {
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        port: import("@oclif/parser/lib/flags").IOptionFlag<number>;
    };
    run(): Promise<void>;
}
