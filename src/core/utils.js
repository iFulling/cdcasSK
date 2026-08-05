export class Utils {
    static async pause(min, max) {
        if (max === undefined) {
            return new Promise(resolve => setTimeout(resolve, min * 1000));
        }
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
}
