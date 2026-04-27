export interface InfiniteScrollOptions {
  container: HTMLElement;
  loadMore: () => Promise<HTMLElement[]>;
  threshold?: number;
}

export function createInfiniteScroll(options: InfiniteScrollOptions): {
  destroy: () => void;
} {
  let isLoading = false;
  let isDone = false;

  const spinner = document.createElement('div');
  spinner.textContent = 'Loading...';
  spinner.style.cssText = `
    padding: 16px;
    text-align: center;
    color: #888;
    font-size: 14px;
    display: none;
  `;
  spinner.setAttribute('aria-live', 'polite');

  const sentinel = document.createElement('div');
  sentinel.style.cssText = `height: 1px;`;

  options.container.appendChild(spinner);
  options.container.appendChild(sentinel);

  async function load() {
    if (isLoading || isDone) return;

    isLoading = true;
    showSpinner();

    try {
      const elements = await options.loadMore();

      if (elements.length === 0) {
        isDone = true;
        showEnd();
        observer.disconnect();
        return;
      }

      const fragment = document.createDocumentFragment();
      elements.forEach((element) => fragment.appendChild(element));

      options.container.insertBefore(fragment, spinner);
    } catch {
      showError();
    } finally {
      isLoading = false;
      if (!isDone) hideSpinner();
    }
  }

  function showSpinner() {
    spinner.style.display = 'block';
    spinner.textContent = 'Loading...';
  }

  function hideSpinner() {
    spinner.style.display = 'none';
  }

  function showEnd() {
    spinner.style.display = 'block';
    spinner.textContent = "You've reached the end";
  }

  function showError() {
    spinner.style.display = 'block';
    spinner.innerHTML = `
      Failed to load.
      <button style="margin-left:8px; cursor:pointer;">Retry</button>
    `;
    spinner.querySelector('button')?.addEventListener(
      'click',
      () => {
        load();
      },
      { once: true },
    );
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        load();
      }
    },
    {
      root: null,
      rootMargin: `${options.threshold ?? 200}px`,
      threshold: 0,
    },
  );

  observer.observe(sentinel);

  load();

  return {
    destroy() {
      observer.disconnect();
      options.container.innerHTML = '';
    },
  };
}
