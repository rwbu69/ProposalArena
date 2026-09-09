import MiniSearch from 'minisearch';
import { chunkText } from './chunker';

export interface ChunkRecord {
  id: string;
  proposalId: string;
  text: string;
}

export class ProposalIndexer {
  private minisearch: MiniSearch<ChunkRecord>;
  private indexedProposals: Set<string> = new Set();

  constructor() {
    this.minisearch = new MiniSearch({
      fields: ['text'], 
      storeFields: ['id', 'proposalId', 'text'],
      idField: 'id'
    });
  }

  indexProposal(proposalId: string, text: string) {
    if (this.indexedProposals.has(proposalId)) return;
    
    const chunks = chunkText(text);
    const records = chunks.map((chunk, index) => ({
      id: `${proposalId}_chunk_${index}`,
      proposalId,
      text: chunk
    }));
    
    this.minisearch.addAll(records);
    this.indexedProposals.add(proposalId);
  }

  searchContext(proposalId: string, query: string, maxResults = 3): string[] {
    // We clean the query roughly to help BM25
    const cleanQuery = query.replace(/[^\w\s-]/g, ' ').trim();
    if (!cleanQuery) return [];

    const results = this.minisearch.search(cleanQuery, {
      filter: (result) => result.proposalId === proposalId,
      combineWith: 'OR',
      prefix: true,
      fuzzy: 0.1
    });
    
    return results.slice(0, maxResults).map(r => r.text);
  }
}

// Global in-memory indexer
export const globalIndexer = new ProposalIndexer();
