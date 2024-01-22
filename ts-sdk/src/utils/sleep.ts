export type Sleep = (durationMs: number) => Promise<void>;

export function provideSleep(): Sleep {
  return async function sleep(durationMs: number) {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  };
}
