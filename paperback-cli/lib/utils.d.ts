export default class Utils {
    static fixedWidth(number: number, width: number): string;
    static prefixTime(message?: string): string;
    static log(message?: string): void;
    static error(message?: string): void;
    static time(label: string, template?: string): {
        end: () => void;
    };
    static headingFormat: string;
    static deleteFolderRecursive(folderPath: string): void;
    static copyFolderRecursive(source: string, target: string): void;
}
