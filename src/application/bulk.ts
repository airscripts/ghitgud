export interface BulkItemResult<T> {
  index: number;
  item: T;
  error?: string;
  success: boolean;
}

export async function runBulk<T>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency = 4,
): Promise<BulkItemResult<T>[]> {
  const limit = Math.max(1, Math.floor(concurrency));
  const results: BulkItemResult<T>[] = new Array(items.length);
  let nextIndex = 0;

  async function consume(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      try {
        await worker(item, index);
        results[index] = { index, item, success: true };
      } catch (error) {
        results[index] = {
          index,
          item,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => consume()),
  );
  return results;
}
