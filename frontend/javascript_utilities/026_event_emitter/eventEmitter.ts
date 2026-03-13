export class EventEmitter {
  on(event: string, listener: (...args: any[]) => void): this {
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    return this;
  }

  once(event: string, listener: (...args: any[]) => void): this {
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    return false;
  }
}
