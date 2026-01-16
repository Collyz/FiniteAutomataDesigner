
export class TrieNode{
    public children = new Map<string, TrieNode>;
    public isTerminal: boolean = false;
}

export class Trie{
    private root: TrieNode = new TrieNode();

    public insert(word: string){
        let node = this.root;
        for(const char of word){
            if(!node.children.has(char)){
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char)!;
        }
        node.isTerminal = true;
    }

    public isPrefix(prefix: string): boolean{
        let node = this.root;

        for(const char of prefix){
            const next = node.children.get(char);
            if(!next){
                return false;
            }
            node = next;
        }
        return true;
    }


    public contains(word: string): boolean{
        let node = this.root;

        for(const char of word){
            const next = node.children.get(char);
            if(!next){
                return false;
            }
            node = next;
        }
        return node.isTerminal;
    }



}