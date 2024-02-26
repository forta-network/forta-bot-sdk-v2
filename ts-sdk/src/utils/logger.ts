export class Logger {
  constructor(private readonly isProd: boolean) {}
  log(message: any) {
    if (this.isProd) return;
    console.log(message);
  }

  info(message: any) {
    console.log(message);
  }

  error(message: any) {
    console.error(message);
  }
}
