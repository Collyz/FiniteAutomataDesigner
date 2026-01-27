export class Queue<T> {

    private data: T[] = [];

    offer(element: T): void{
        this.data.push(element);
    }

    poll(): T | undefined {
        if(this.isEmpty()){
            return undefined;
        }
        return this.data.shift();
    }

    isEmpty(): boolean {
        return this.data.length === 0;
    }

    peek(): T | undefined {
        if(this.isEmpty()){
            return undefined;
        }
        return this.data[0];
    }

    size(): number {
        return this.data.length;
    }
}