import Command from '@oclif/command';
export default abstract class extends Command {
    log(message?: string): void;
    time(label: string, format?: string | undefined): {
        end: () => void;
    };
}
