export function mySetInterval(
  callback: (...args: any[]) => void,
  delay: number,
  ...args: any[]
): { clear: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined = undefined;
  let cleared = false;

  const clear = () => {
    cleared = true;
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const setTimer = () => {
    timer = setTimeout(() => {
      if (cleared) return;
      callback(...args);
      if (!cleared) setTimer();
    }, delay);
  };

  setTimer();

  return { clear };
}
