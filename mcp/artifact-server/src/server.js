#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname, resolve, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'artifacts.db');
const ARTIFACTS_ROOT = resolve(join(__dirname, '..', '..', '..', 'artifacts'));

// Ensure artifacts directory exists
if (!existsSync(ARTIFACTS_ROOT)) {
  mkdirSync(ARTIFACTS_ROOT, { recursive: true });
}

const db = new Database(DB_PATH);

// Helper functions
function generateId(prefix = 'art') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function normalizeArtifactPath(path) {
  if (path.startsWith('/') || path.match(/^[a-zA-Z]:\\/)) {
    return resolve(path);
  }
  return resolve(join(ARTIFACTS_ROOT, path));
}

function getWordCount(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function validateMarkdown(content) {
  const findings = [];
  
  // Check for valid YAML frontmatter if present
  if (content.startsWith('---\n')) {
    const endIndex = content.indexOf('\n---\n', 4);
    if (endIndex === -1) {
      findings.push({
        check: 'yaml_frontmatter',
        status: 'fail',
        detail: 'YAML frontmatter not properly closed',
        location: 'line 1'
      });
    }
  }
  
  // Check heading hierarchy
  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
  let prevLevel = 0;
  headings.forEach((heading, idx) => {
    const level = heading.match(/^#+/)[0].length;
    if (level > prevLevel + 1) {
      findings.push({
        check: 'heading_hierarchy',
        status: 'warning',
        detail: `Heading level skipped from H${prevLevel} to H${level}`,
        location: `heading ${idx + 1}`
      });
    }
    prevLevel = level;
  });
  
  // Check for empty sections
  const sections = content.split(/^#{1,6}\s+.+$/gm);
  sections.forEach((section, idx) => {
    if (idx > 0 && section.trim().length === 0) {
      findings.push({
        check: 'empty_sections',
        status: 'warning',
        detail: 'Empty section detected',
        location: `section ${idx}`
      });
    }
  });
  
  if (findings.length === 0) {
    findings.push({
      check: 'markdown_validation',
      status: 'pass',
      detail: 'All markdown validation checks passed'
    });
  }
  
  return findings;
}

function checkDependency(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Tool implementations
const tools = {
  create_markdown: {
    description: 'Create a new markdown artifact file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative to artifacts/ or absolute path'
        },
        content: {
          type: 'string',
          description: 'Markdown content'
        },
        metadata: {
          type: 'object',
          description: 'Optional YAML frontmatter to prepend',
          properties: {
            title: { type: 'string' },
            author: { type: 'string' },
            date: { type: 'string' }
          }
        },
        run_id: { type: 'string' },
        step_id: { type: 'string' }
      },
      required: ['path', 'content']
    },
    handler: async (args) => {
      const fullPath = normalizeArtifactPath(args.path);
      
      if (existsSync(fullPath)) {
        throw new Error(`File already exists at ${fullPath}. Use update_markdown to modify.`);
      }
      
      // Ensure directory exists
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      // Prepend metadata if provided
      let finalContent = args.content;
      if (args.metadata) {
        const yamlLines = ['---'];
        for (const [key, value] of Object.entries(args.metadata)) {
          yamlLines.push(`${key}: ${value}`);
        }
        yamlLines.push('---', '');
        finalContent = yamlLines.join('\n') + args.content;
      }
      
      writeFileSync(fullPath, finalContent, 'utf-8');
      
      const artifact_id = generateId('art');
      const stats = statSync(fullPath);
      const word_count = getWordCount(finalContent);
      const now = getCurrentTimestamp();
      
      db.prepare(`
        INSERT INTO artifacts (
          artifact_id, path, format, title, version, size_bytes, word_count,
          created_at, updated_at, producing_run_id, producing_step_id, validation_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        artifact_id, fullPath, 'markdown', args.metadata?.title || null, 1,
        stats.size, word_count, now, now, args.run_id || null, args.step_id || null, 'not-validated'
      );
      
      // Create version record
      const version_id = generateId('ver');
      const content_hash = crypto.createHash('sha256').update(finalContent).digest('hex');
      db.prepare(`
        INSERT INTO artifact_versions (
          version_id, artifact_id, version_number, content_hash, size_bytes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(version_id, artifact_id, 1, content_hash, stats.size, now);
      
      return {
        artifact_id,
        path: fullPath,
        size_bytes: stats.size,
        word_count
      };
    }
  },

  update_markdown: {
    description: 'Update an existing markdown artifact',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string' },
        content: { type: 'string', description: 'Full replacement content' },
        append: { type: 'string', description: 'Content to append' }
      },
      required: ['artifact_id']
    },
    handler: async (args) => {
      const artifact = db.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(args.artifact_id);
      if (!artifact) {
        throw new Error(`Artifact ${args.artifact_id} not found`);
      }
      
      let newContent;
      if (args.content) {
        newContent = args.content;
      } else if (args.append) {
        const currentContent = readFileSync(artifact.path, 'utf-8');
        newContent = currentContent + '\n' + args.append;
      } else {
        throw new Error('Either content or append must be provided');
      }
      
      writeFileSync(artifact.path, newContent, 'utf-8');
      
      const stats = statSync(artifact.path);
      const word_count = getWordCount(newContent);
      const now = getCurrentTimestamp();
      const new_version = artifact.version + 1;
      
      db.prepare(`
        UPDATE artifacts 
        SET version = ?, size_bytes = ?, word_count = ?, updated_at = ?, validation_status = ?
        WHERE artifact_id = ?
      `).run(new_version, stats.size, word_count, now, 'not-validated', args.artifact_id);
      
      // Create version record
      const version_id = generateId('ver');
      const content_hash = crypto.createHash('sha256').update(newContent).digest('hex');
      db.prepare(`
        INSERT INTO artifact_versions (
          version_id, artifact_id, version_number, content_hash, size_bytes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(version_id, args.artifact_id, new_version, content_hash, stats.size, now);
      
      return {
        artifact_id: args.artifact_id,
        version: new_version,
        size_bytes: stats.size,
        word_count
      };
    }
  },

  export_markdown_to_docx: {
    description: 'Convert a markdown artifact to DOCX via pandoc',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string' },
        output_path: { type: 'string', description: 'Optional output path' },
        reference_doc: { type: 'string', description: 'Path to reference .docx for styling' }
      },
      required: ['artifact_id']
    },
    handler: async (args) => {
      if (!checkDependency('pandoc')) {
        throw new Error('pandoc not found. Install pandoc to export to DOCX.');
      }
      
      const artifact = db.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(args.artifact_id);
      if (!artifact) {
        throw new Error(`Artifact ${args.artifact_id} not found`);
      }
      
      if (artifact.format !== 'markdown') {
        throw new Error(`Artifact ${args.artifact_id} is not markdown format`);
      }
      
      const outputPath = args.output_path 
        ? normalizeArtifactPath(args.output_path)
        : artifact.path.replace(/\.md$/, '.docx');
      
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      const export_id = generateId('exp');
      const now = getCurrentTimestamp();
      
      try {
        let cmd = `pandoc "${artifact.path}" -o "${outputPath}"`;
        if (args.reference_doc) {
          cmd += ` --reference-doc="${args.reference_doc}"`;
        }
        
        execSync(cmd, { stdio: 'pipe' });
        
        const new_artifact_id = generateId('art');
        const stats = statSync(outputPath);
        
        db.prepare(`
          INSERT INTO artifacts (
            artifact_id, path, format, title, version, size_bytes,
            created_at, updated_at, producing_run_id, validation_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          new_artifact_id, outputPath, 'docx', artifact.title, 1,
          stats.size, now, now, artifact.producing_run_id, 'not-validated'
        );
        
        // Create relationship
        const rel_id = generateId('rel');
        db.prepare(`
          INSERT INTO artifact_relationships (
            relationship_id, source_artifact_id, target_artifact_id, relationship_type, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `).run(rel_id, args.artifact_id, new_artifact_id, 'export', now);
        
        // Record export operation
        db.prepare(`
          INSERT INTO export_operations (
            export_id, source_artifact_id, target_format, target_path,
            target_artifact_id, status, dependencies_used, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          export_id, args.artifact_id, 'docx', outputPath, new_artifact_id,
          'success', JSON.stringify(['pandoc']), now, now
        );
        
        return {
          artifact_id: new_artifact_id,
          path: outputPath,
          success: true,
          size_bytes: stats.size
        };
      } catch (error) {
        db.prepare(`
          INSERT INTO export_operations (
            export_id, source_artifact_id, target_format, target_path,
            status, error_message, dependencies_used, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          export_id, args.artifact_id, 'docx', outputPath,
          'failed', error.message, JSON.stringify(['pandoc']), now, now
        );
        
        throw new Error(`DOCX export failed: ${error.message}`);
      }
    }
  },

  export_markdown_to_pdf: {
    description: 'Convert a markdown artifact to PDF via pandoc',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string' },
        output_path: { type: 'string' },
        template: { type: 'string', description: 'Pandoc PDF template' },
        variables: { type: 'object', description: 'Template variables' }
      },
      required: ['artifact_id']
    },
    handler: async (args) => {
      if (!checkDependency('pandoc')) {
        throw new Error('pandoc not found. Install pandoc to export to PDF.');
      }
      
      const artifact = db.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(args.artifact_id);
      if (!artifact) {
        throw new Error(`Artifact ${args.artifact_id} not found`);
      }
      
      if (artifact.format !== 'markdown') {
        throw new Error(`Artifact ${args.artifact_id} is not markdown format`);
      }
      
      const outputPath = args.output_path 
        ? normalizeArtifactPath(args.output_path)
        : artifact.path.replace(/\.md$/, '.pdf');
      
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      const export_id = generateId('exp');
      const now = getCurrentTimestamp();
      
      try {
        let cmd = `pandoc "${artifact.path}" -o "${outputPath}"`;
        if (args.template) {
          cmd += ` --template="${args.template}"`;
        }
        if (args.variables) {
          for (const [key, value] of Object.entries(args.variables)) {
            cmd += ` -V ${key}="${value}"`;
          }
        }
        
        execSync(cmd, { stdio: 'pipe' });
        
        const new_artifact_id = generateId('art');
        const stats = statSync(outputPath);
        
        db.prepare(`
          INSERT INTO artifacts (
            artifact_id, path, format, title, version, size_bytes,
            created_at, updated_at, producing_run_id, validation_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          new_artifact_id, outputPath, 'pdf', artifact.title, 1,
          stats.size, now, now, artifact.producing_run_id, 'not-validated'
        );
        
        // Create relationship
        const rel_id = generateId('rel');
        db.prepare(`
          INSERT INTO artifact_relationships (
            relationship_id, source_artifact_id, target_artifact_id, relationship_type, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `).run(rel_id, args.artifact_id, new_artifact_id, 'export', now);
        
        // Record export operation
        db.prepare(`
          INSERT INTO export_operations (
            export_id, source_artifact_id, target_format, target_path,
            target_artifact_id, status, dependencies_used, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          export_id, args.artifact_id, 'pdf', outputPath, new_artifact_id,
          'success', JSON.stringify(['pandoc']), now, now
        );
        
        return {
          artifact_id: new_artifact_id,
          path: outputPath,
          success: true,
          size_bytes: stats.size
        };
      } catch (error) {
        db.prepare(`
          INSERT INTO export_operations (
            export_id, source_artifact_id, target_format, target_path,
            status, error_message, dependencies_used, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          export_id, args.artifact_id, 'pdf', outputPath,
          'failed', error.message, JSON.stringify(['pandoc']), now, now
        );
        
        throw new Error(`PDF export failed: ${error.message}`);
      }
    }
  },

  create_latex: {
    description: 'Create a new LaTeX source artifact',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string', description: 'Complete LaTeX source' },
        document_class: { type: 'string', default: 'article' },
        run_id: { type: 'string' },
        step_id: { type: 'string' }
      },
      required: ['path', 'content']
    },
    handler: async (args) => {
      const fullPath = normalizeArtifactPath(args.path);
      
      if (existsSync(fullPath)) {
        throw new Error(`File already exists at ${fullPath}`);
      }
      
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, args.content, 'utf-8');
      
      const artifact_id = generateId('art');
      const stats = statSync(fullPath);
      const now = getCurrentTimestamp();
      
      db.prepare(`
        INSERT INTO artifacts (
          artifact_id, path, format, version, size_bytes,
          created_at, updated_at, producing_run_id, producing_step_id, validation_status,
          metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        artifact_id, fullPath, 'latex', 1, stats.size, now, now,
        args.run_id || null, args.step_id || null, 'not-validated',
        JSON.stringify({ document_class: args.document_class || 'article' })
      );
      
      return {
        artifact_id,
        path: fullPath,
        size_bytes: stats.size
      };
    }
  },

  compile_latex_to_pdf: {
    description: 'Compile a LaTeX artifact to PDF',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string' },
        engine: { type: 'string', enum: ['pdflatex', 'xelatex', 'lualatex'], default: 'pdflatex' },
        passes: { type: 'number', default: 2 }
      },
      required: ['artifact_id']
    },
    handler: async (args) => {
      const engine = args.engine || 'pdflatex';
      
      if (!checkDependency(engine)) {
        throw new Error(`${engine} not found. Install LaTeX toolchain to compile LaTeX.`);
      }
      
      const artifact = db.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(args.artifact_id);
      if (!artifact) {
        throw new Error(`Artifact ${args.artifact_id} not found`);
      }
      
      if (artifact.format !== 'latex') {
        throw new Error(`Artifact ${args.artifact_id} is not LaTeX format`);
      }
      
      const outputPath = artifact.path.replace(/\.tex$/, '.pdf');
      const workDir = dirname(artifact.path);
      const passes = args.passes || 2;
      
      const export_id = generateId('exp');
      const now = getCurrentTimestamp();
      
      try {
        for (let i = 0; i < passes; i++) {
          execSync(`${engine} -interaction=nonstopmode -output-directory="${workDir}" "${artifact.path}"`, {
            stdio: 'pipe',
            cwd: workDir
          });
        }
        
        if (!existsSync(outputPath)) {
          throw new Error('PDF compilation did not produce output file');
        }
        
        const new_artifact_id = generateId('art');
        const stats = statSync(outputPath);
        
        db.prepare(`
          INSERT INTO artifacts (
            artifact_id, path, format, title, version, size_bytes,
            created_at, updated_at, producing_run_id, validation_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          new_artifact_id, outputPath, 'pdf', artifact.title, 1,
          stats.size, now, now, artifact.producing_run_id, 'not-validated'
        );
        
        // Create relationship
        const rel_id = generateId('rel');
        db.prepare(`
          INSERT INTO artifact_relationships (
            relationship_id, source_artifact_id, target_artifact_id, relationship_type, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `).run(rel_id, args.artifact_id, new_artifact_id, 'compile', now);
        
        // Record export operation
        db.prepare(`
          INSERT INTO export_operations (
            export_id, source_artifact_id, target_format, target_path,
            target_artifact_id, status, dependencies_used, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          export_id, args.artifact_id, 'pdf', outputPath, new_artifact_id,
          'success', JSON.stringify([engine]), now, now
        );
        
        return {
          pdf_artifact_id: new_artifact_id,
          path: outputPath,
          success: true,
          size_bytes: stats.size
        };
      } catch (error) {
        const compiler_output = error.stdout ? error.stdout.toString() : error.message;
        
        db.prepare(`
          INSERT INTO export_operations (
            export_id, source_artifact_id, target_format, target_path,
            status, error_message, dependencies_used, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          export_id, args.artifact_id, 'pdf', outputPath,
          'failed', compiler_output, JSON.stringify([engine]), now, now
        );
        
        return {
          success: false,
          compiler_output
        };
      }
    }
  },

  inspect_artifact: {
    description: 'Return metadata about an artifact',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string' }
      },
      required: ['artifact_id']
    },
    handler: async (args) => {
      const artifact = db.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(args.artifact_id);
      if (!artifact) {
        throw new Error(`Artifact ${args.artifact_id} not found`);
      }
      
      return {
        artifact_id: artifact.artifact_id,
        path: artifact.path,
        format: artifact.format,
        title: artifact.title,
        size_bytes: artifact.size_bytes,
        word_count: artifact.word_count,
        version: artifact.version,
        created_at: artifact.created_at,
        updated_at: artifact.updated_at,
        producing_run_id: artifact.producing_run_id,
        producing_step_id: artifact.producing_step_id,
        validation_status: artifact.validation_status
      };
    }
  },

  validate_artifact: {
    description: 'Validate an artifact against format requirements',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string' },
        checks: { type: 'array', items: { type: 'string' } }
      },
      required: ['artifact_id']
    },
    handler: async (args) => {
      const artifact = db.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(args.artifact_id);
      if (!artifact) {
        throw new Error(`Artifact ${args.artifact_id} not found`);
      }
      
      if (!existsSync(artifact.path)) {
        return {
          valid: false,
          findings: [{
            check: 'file_exists',
            status: 'fail',
            detail: `File not found at ${artifact.path}`
          }]
        };
      }
      
      let findings = [];
      const now = getCurrentTimestamp();
      
      if (artifact.format === 'markdown') {
        const content = readFileSync(artifact.path, 'utf-8');
        findings = validateMarkdown(content);
      } else if (artifact.format === 'pdf') {
        const stats = statSync(artifact.path);
        findings.push({
          check: 'file_integrity',
          status: stats.size > 0 ? 'pass' : 'fail',
          detail: stats.size > 0 ? 'PDF file exists and has content' : 'PDF file is empty'
        });
      } else if (artifact.format === 'docx') {
        const stats = statSync(artifact.path);
        findings.push({
          check: 'file_integrity',
          status: stats.size > 0 ? 'pass' : 'fail',
          detail: stats.size > 0 ? 'DOCX file exists and has content' : 'DOCX file is empty'
        });
      } else if (artifact.format === 'latex') {
        findings.push({
          check: 'file_exists',
          status: 'pass',
          detail: 'LaTeX source file exists'
        });
      }
      
      // Store validation results
      const validation_id = generateId('val');
      for (const finding of findings) {
        db.prepare(`
          INSERT INTO validation_results (
            validation_id, artifact_id, check_name, status, detail, location, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          generateId('val'), args.artifact_id, finding.check, finding.status,
          finding.detail, finding.location || null, now
        );
      }
      
      const valid = findings.every(f => f.status === 'pass' || f.status === 'warning');
      
      // Update artifact validation status
      db.prepare(`
        UPDATE artifacts SET validation_status = ? WHERE artifact_id = ?
      `).run(valid ? 'valid' : 'invalid', args.artifact_id);
      
      return {
        valid,
        findings
      };
    }
  },

  normalize_artifact: {
    description: 'Apply normalization rules to an artifact',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string' },
        rules: { type: 'array', items: { type: 'string' } }
      },
      required: ['artifact_id']
    },
    handler: async (args) => {
      const artifact = db.prepare('SELECT * FROM artifacts WHERE artifact_id = ?').get(args.artifact_id);
      if (!artifact) {
        throw new Error(`Artifact ${args.artifact_id} not found`);
      }
      
      if (artifact.format !== 'markdown') {
        throw new Error('Normalization currently only supported for markdown artifacts');
      }
      
      let content = readFileSync(artifact.path, 'utf-8');
      const changes_made = [];
      
      // Remove trailing whitespace
      const before_trailing = content;
      content = content.replace(/[ \t]+$/gm, '');
      if (content !== before_trailing) {
        changes_made.push('removed_trailing_whitespace');
      }
      
      // Normalize line endings to \n
      const before_lineendings = content;
      content = content.replace(/\r\n/g, '\n');
      if (content !== before_lineendings) {
        changes_made.push('normalized_line_endings');
      }
      
      // Ensure single blank line between sections
      const before_spacing = content;
      content = content.replace(/\n{3,}/g, '\n\n');
      if (content !== before_spacing) {
        changes_made.push('normalized_section_spacing');
      }
      
      // Ensure file ends with single newline
      if (!content.endsWith('\n')) {
        content += '\n';
        changes_made.push('added_final_newline');
      }
      
      if (changes_made.length > 0) {
        writeFileSync(artifact.path, content, 'utf-8');
        
        const stats = statSync(artifact.path);
        const word_count = getWordCount(content);
        const now = getCurrentTimestamp();
        const new_version = artifact.version + 1;
        
        db.prepare(`
          UPDATE artifacts 
          SET version = ?, size_bytes = ?, word_count = ?, updated_at = ?, validation_status = ?
          WHERE artifact_id = ?
        `).run(new_version, stats.size, word_count, now, 'not-validated', args.artifact_id);
        
        // Create version record
        const version_id = generateId('ver');
        const content_hash = crypto.createHash('sha256').update(content).digest('hex');
        db.prepare(`
          INSERT INTO artifact_versions (
            version_id, artifact_id, version_number, content_hash, size_bytes,
            created_at, change_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          version_id, args.artifact_id, new_version, content_hash, stats.size,
          now, `Normalization: ${changes_made.join(', ')}`
        );
        
        return {
          artifact_id: args.artifact_id,
          version: new_version,
          changes_made
        };
      }
      
      return {
        artifact_id: args.artifact_id,
        version: artifact.version,
        changes_made: []
      };
    }
  },

  list_artifacts: {
    description: 'List all artifacts, optionally filtered by format or run_id',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['markdown', 'docx', 'pdf', 'latex'] },
        run_id: { type: 'string' },
        limit: { type: 'number', default: 50 }
      }
    },
    handler: async (args) => {
      let query = 'SELECT * FROM artifacts WHERE 1=1';
      const params = [];
      
      if (args.format) {
        query += ' AND format = ?';
        params.push(args.format);
      }
      
      if (args.run_id) {
        query += ' AND producing_run_id = ?';
        params.push(args.run_id);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(args.limit || 50);
      
      const artifacts = db.prepare(query).all(...params);
      
      return {
        artifacts: artifacts.map(a => ({
          artifact_id: a.artifact_id,
          path: a.path,
          format: a.format,
          title: a.title,
          version: a.version,
          size_bytes: a.size_bytes,
          created_at: a.created_at,
          validation_status: a.validation_status
        })),
        count: artifacts.length
      };
    }
  }
};

// MCP Server setup
const server = new Server(
  {
    name: 'artifact-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  const tool = tools[name];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  try {
    const result = await tool.handler(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('artifact-server MCP running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
