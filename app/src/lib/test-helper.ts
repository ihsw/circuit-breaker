export const pause = (delay: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, delay));
