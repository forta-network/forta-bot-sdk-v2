export class Logger {
  constructor(
    private readonly isProd: boolean,
    private readonly isDebug: boolean
  ) {}

  log(message: any) {
    if (this.isProd && !this.isDebug) return;
    console.log(message);
  }

  info(message: any) {
    console.log(message);
  }

  error(message: any) {
    console.error(message);
  }
}
