import { QueueFromStacks } from './queue_from_stacks';

describe('QueueFromStacks', () => {
  describe('FIFO ordering', () => {
    it('dequeues in the order tasks were enqueued', () => {
      const q = new QueueFromStacks<string>();
      q.enqueue('a');
      q.enqueue('b');
      q.enqueue('c');
      expect(q.dequeue()).toBe('a');
      expect(q.dequeue()).toBe('b');
      expect(q.dequeue()).toBe('c');
    });

    it('preserves order across interleaved enqueue and dequeue', () => {
      const q = new QueueFromStacks<number>();
      q.enqueue(1);
      q.enqueue(2);
      expect(q.dequeue()).toBe(1);
      q.enqueue(3);
      q.enqueue(4);
      expect(q.dequeue()).toBe(2);
      expect(q.dequeue()).toBe(3);
      q.enqueue(5);
      expect(q.dequeue()).toBe(4);
      expect(q.dequeue()).toBe(5);
    });
  });

  describe('peek', () => {
    it('returns the oldest task without removing it', () => {
      const q = new QueueFromStacks<string>();
      q.enqueue('deploy');
      q.enqueue('migrate');
      expect(q.peek()).toBe('deploy');
      expect(q.peek()).toBe('deploy');
      expect(q.size()).toBe(2);
      expect(q.dequeue()).toBe('deploy');
      expect(q.peek()).toBe('migrate');
    });
  });

  describe('size', () => {
    it('tracks the count through enqueues and dequeues', () => {
      const q = new QueueFromStacks<number>();
      expect(q.size()).toBe(0);
      q.enqueue(1);
      q.enqueue(2);
      expect(q.size()).toBe(2);
      q.dequeue();
      expect(q.size()).toBe(1);
      q.dequeue();
      expect(q.size()).toBe(0);
    });
  });

  describe('empty-queue behavior', () => {
    it('throws on dequeue when empty', () => {
      const q = new QueueFromStacks<number>();
      expect(() => q.dequeue()).toThrow();
    });

    it('throws on peek when empty', () => {
      const q = new QueueFromStacks<number>();
      expect(() => q.peek()).toThrow();
    });

    it('throws again after draining a non-empty queue', () => {
      const q = new QueueFromStacks<number>();
      q.enqueue(1);
      q.dequeue();
      expect(() => q.dequeue()).toThrow();
      expect(() => q.peek()).toThrow();
    });

    it('recovers after being drained', () => {
      const q = new QueueFromStacks<string>();
      q.enqueue('a');
      q.dequeue();
      q.enqueue('b');
      expect(q.peek()).toBe('b');
      expect(q.size()).toBe(1);
    });
  });

  describe('single element', () => {
    it('handles a lone enqueue/peek/dequeue cycle', () => {
      const q = new QueueFromStacks<string>();
      q.enqueue('only');
      expect(q.peek()).toBe('only');
      expect(q.dequeue()).toBe('only');
      expect(q.size()).toBe(0);
    });
  });

  describe('large input', () => {
    it('handles 100_000 interleaved operations in amortized O(1)', () => {
      const q = new QueueFromStacks<number>();
      let next = 0;
      let expected = 0;
      // Alternate bursts of enqueues with bursts of dequeues to force
      // repeated stack transfers.
      for (let round = 0; round < 500; round++) {
        for (let i = 0; i < 100; i++) {
          q.enqueue(next++);
        }
        for (let i = 0; i < 100; i++) {
          expect(q.dequeue()).toBe(expected++);
        }
      }
      expect(q.size()).toBe(0);
      expect(next).toBe(50_000);
      // Then one long fill and full drain.
      for (let i = 0; i < 50_000; i++) {
        q.enqueue(i);
      }
      for (let i = 0; i < 50_000; i++) {
        expect(q.dequeue()).toBe(i);
      }
      expect(q.size()).toBe(0);
    });
  });
});
