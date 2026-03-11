export class TrieNode {
  children: { [key: string]: TrieNode } = {};
  isEndOfWord: boolean = false;
  word: string | null = null;
}

export class SearchTrie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string) {
    let node = this.root;
    const normalizedWord = word.trim().toLowerCase();

    for (const char of normalizedWord) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.word = word;
  }

  search(prefix: string): string[] {
    let node = this.root;
    const normalizedPrefix = prefix.trim().toLowerCase();

    // 1. Traverse to the node matching the prefix
    for (const char of normalizedPrefix) {
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }

    // 2. Collect all words from this node downwards
    const results: string[] = [];
    this.collectWords(node, results);
    return results;
  }

  private collectWords(node: TrieNode, results: string[]) {
    if (results.length >= 10) return; // Limit suggestions

    if (node.isEndOfWord && node.word) {
      results.push(node.word);
    }

    for (const char in node.children) {
      this.collectWords(node.children[char], results);
    }
  }
}
