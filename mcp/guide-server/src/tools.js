/**
 * Guide Server — MCP Tool Definitions
 * Each tool maps directly to a db.js operation.
 * Input schemas use JSON Schema draft-07.
 */

import {
  addGuide, getGuide, updateGuide, promoteGuide, deprecateGuide,
  listGuides, searchGuides, linkGuides, getLinks, guideGapCheck, getStats
} from './db.js';

// ── Tool Definitions ────────────────────────────────────────────────────────

export const tools = [
  {
    name: 'add_guide',
    description: 'Add a new guide record to the knowledge store. Returns the created guide with its assigned ID.',
    inputSchema: {
      type: 'object',
      required: ['title', 'type', 'body'],
      properties: {
        id:         { type: 'string', description: 'Optional: custom ID (e.g. G-EDITORIAL-001). Auto-generated if omitted.' },
        title:      { type: 'string', description: 'Short descriptive title for the guide.' },
        type:       { type: 'string', enum: ['doctrine', 'style-pack', 'canon', 'template', 'rubric', 'example', 'anti-pattern', 'decision-record'] },
        domain:     { type: 'string', description: 'Domain this guide applies to: general, dnd, card-game, technical, internal.' },
        status:     { type: 'string', enum: ['draft', 'active'], default: 'draft' },
        body:       { type: 'string', description: 'Full markdown content of the guide.' },
        tags:       { type: 'array', items: { type: 'string' }, description: 'Searchable tags.' },
        applies_to: { type: 'array', items: { type: 'string' }, description: 'Phases, agents, or commands this guide applies to.' },
        version:    { type: 'string', default: '1.0' }
      }
    }
  },

  {
    name: 'get_guide',
    description: 'Retrieve a single guide record by its ID. Returns the full guide including body, tags, links metadata, and status.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'The guide ID to retrieve.' }
      }
    }
  },

  {
    name: 'update_guide',
    description: 'Update fields on an existing guide record. Only provided fields are updated; omitted fields are unchanged.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id:         { type: 'string' },
        title:      { type: 'string' },
        domain:     { type: 'string' },
        body:       { type: 'string' },
        tags:       { type: 'array', items: { type: 'string' } },
        applies_to: { type: 'array', items: { type: 'string' } },
        version:    { type: 'string' }
      }
    }
  },

  {
    name: 'find_guides',
    description: 'Full-text search across guide records using SQLite FTS5. Returns ranked results. Filter by type, domain, or status. Use for agent lookups before any writing task.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query:  { type: 'string', description: 'Search query. Supports phrase search ("like this"), prefix (word*), and boolean (AND, OR, NOT).' },
        type:   { type: 'string', enum: ['doctrine', 'style-pack', 'canon', 'template', 'rubric', 'example', 'anti-pattern', 'decision-record'], description: 'Filter by guide type.' },
        domain: { type: 'string', description: 'Filter by domain.' },
        status: { type: 'string', enum: ['draft', 'active', 'deprecated'], default: 'active' },
        limit:  { type: 'number', default: 10, minimum: 1, maximum: 50 }
      }
    }
  },

  {
    name: 'list_guides',
    description: 'List guide records with optional filters. No search ranking — use find_guides for ranked retrieval. Use list_guides for browsing by type or domain.',
    inputSchema: {
      type: 'object',
      properties: {
        type:   { type: 'string', enum: ['doctrine', 'style-pack', 'canon', 'template', 'rubric', 'example', 'anti-pattern', 'decision-record'] },
        domain: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'active', 'deprecated'], default: 'active' },
        limit:  { type: 'number', default: 50, minimum: 1, maximum: 200 },
        offset: { type: 'number', default: 0 }
      }
    }
  },

  {
    name: 'promote_guide',
    description: 'Promote a guide from draft to active status. Active guides appear in search results and agent lookups. Draft guides are excluded from active searches.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id:          { type: 'string' },
        promoted_by: { type: 'string', description: 'Agent or user performing the promotion.' }
      }
    }
  },

  {
    name: 'deprecate_guide',
    description: 'Mark a guide as deprecated. Deprecated guides are excluded from active searches but preserved for audit. Optionally link to a superseding guide.',
    inputSchema: {
      type: 'object',
      required: ['id', 'reason'],
      properties: {
        id:            { type: 'string' },
        reason:        { type: 'string', description: 'Why this guide is being deprecated.' },
        deprecated_by: { type: 'string', description: 'Agent or user performing the deprecation.' },
        superseded_by: { type: 'string', description: 'ID of the guide that supersedes this one.' }
      }
    }
  },

  {
    name: 'link_guides',
    description: 'Create a typed directed link between two guide records. Link types: implements, extends, references, supersedes, exemplifies, contradicts, requires.',
    inputSchema: {
      type: 'object',
      required: ['source_id', 'target_id', 'link_type'],
      properties: {
        source_id: { type: 'string', description: 'The guide creating the relationship.' },
        target_id: { type: 'string', description: 'The guide being related to.' },
        link_type: { type: 'string', enum: ['implements', 'extends', 'references', 'supersedes', 'exemplifies', 'contradicts', 'requires'] },
        note:      { type: 'string', description: 'Optional note explaining the relationship.' }
      }
    }
  },

  {
    name: 'get_links',
    description: 'Get all links for a guide record. Returns incoming and outgoing links with metadata about the linked guides.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id:        { type: 'string' },
        direction: { type: 'string', enum: ['incoming', 'outgoing', 'both'], default: 'both' }
      }
    }
  },

  {
    name: 'guide_gap_check',
    description: 'Check what guide types are missing for a given domain or task. Returns a list of gaps with descriptions. Run before starting a production run to verify guides are available.',
    inputSchema: {
      type: 'object',
      required: ['domain'],
      properties: {
        domain: { type: 'string', description: 'Domain to check: general, dnd, card-game, technical, internal.' },
        task:   { type: 'string', description: 'Optional task description for relevance checking.' }
      }
    }
  },

  {
    name: 'get_stats',
    description: 'Return statistics about the guide store: total records, counts by status and type, link count.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// ── Tool Handlers ───────────────────────────────────────────────────────────

export async function handleTool(name, args = {}) {
  try {
    let result;

    switch (name) {
      case 'add_guide':
        result = addGuide(args);
        break;

      case 'get_guide': {
        const guide = getGuide(args.id);
        if (!guide) throw new Error(`Guide not found: ${args.id}`);
        result = guide;
        break;
      }

      case 'update_guide':
        result = updateGuide(args.id, args);
        break;

      case 'find_guides':
        result = searchGuides(args);
        break;

      case 'list_guides':
        result = listGuides(args);
        break;

      case 'promote_guide':
        result = promoteGuide(args.id, args.promoted_by);
        break;

      case 'deprecate_guide':
        result = deprecateGuide(args.id, {
          deprecatedBy: args.deprecated_by,
          reason:       args.reason,
          supersededBy: args.superseded_by
        });
        break;

      case 'link_guides':
        result = linkGuides({
          sourceId: args.source_id,
          targetId: args.target_id,
          linkType: args.link_type,
          note:     args.note
        });
        break;

      case 'get_links':
        result = getLinks(args.id, { direction: args.direction ?? 'both' });
        break;

      case 'guide_gap_check':
        result = guideGapCheck(args);
        break;

      case 'get_stats':
        result = getStats();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };

  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true
    };
  }
}
