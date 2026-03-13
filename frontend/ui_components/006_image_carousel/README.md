# 6. Image Carousel

**Difficulty:** Medium  
**Topics:** DOM manipulation, timers, CSS transitions, state management

---

## Description

Build an image carousel that displays one image at a time with next/previous navigation. It supports auto-play with a configurable interval and wraps around at both ends.

## Requirements

- Render images inside the container, showing one at a time
- `next()` advances to the next image, wrapping to the first from the last
- `prev()` goes to the previous image, wrapping to the last from the first
- `goTo(index)` jumps to a specific image by index
- `getCurrentIndex()` returns the index of the currently visible image
- Auto-play mode advances images automatically at the configured interval
- `destroy()` stops auto-play and cleans up

## Examples

```ts
const container = document.getElementById('carousel')!;

const carousel = createCarousel({
  container,
  images: ['/img1.jpg', '/img2.jpg', '/img3.jpg'],
  autoPlay: true,
  interval: 3000,
});

carousel.next();
carousel.prev();
carousel.goTo(2);
console.log(carousel.getCurrentIndex()); // 2

carousel.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create <code>img</code> elements for each image source. Show only the active one by toggling <code>display</code> or an <code>active</code> class.
</details>

<details>
<summary>Hint 2</summary>
Use modular arithmetic to handle wrapping: <code>(currentIndex + 1) % images.length</code> for next and <code>(currentIndex - 1 + images.length) % images.length</code> for prev.
</details>

<details>
<summary>Hint 3</summary>
For auto-play, use <code>setInterval</code> and store the interval ID so <code>destroy()</code> can call <code>clearInterval</code>.
</details>
