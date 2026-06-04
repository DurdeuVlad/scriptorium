# MCP Server Installation Guide

**For:** Installing and running the three MCP servers (guide-server, cache-server, artifact-server)

---

## Prerequisites

### Required Software
- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Python** 3.10+ (for native module compilation on Windows)

### Windows-Specific Requirements

The MCP servers use `better-sqlite3`, which requires native compilation on Windows. You need **one** of the following:

**Option 1: Visual Studio Build Tools (Recommended)**
```bash
# Download and install Visual Studio Build Tools
# https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++" workload
```

**Option 2: windows-build-tools (Alternative)**
```bash
# Run as Administrator in PowerShell
npm install --global windows-build-tools
```

**Option 3: Use Pre-built Binaries (Easiest)**
```bash
# Set environment variable to use pre-built binaries
$env:npm_config_build_from_source = "false"
```

---

## Installation Steps

### 1. Guide Server (Knowledge Layer)

```bash
cd mcp/guide-server

# Install dependencies
npm install

# If installation fails on Windows, try:
npm install --build-from-source=false

# Create database
node src/setup.js

# Load seed data (55+ guides)
node src/seed.js

# Verify installation
node src/server.js
# Should output: "Guide server running on stdio"
# Press Ctrl+C to stop
```

**What it does:**
- Creates SQLite database with FTS5 full-text search
- Loads 55+ seed records (style packs, templates, canon, rubrics, anti-patterns)
- Provides 11 MCP tools for guide management

---

### 2. Cache Server (State Management)

```bash
cd mcp/cache-server

# Install dependencies
npm install

# If installation fails on Windows, try:
npm install --build-from-source=false

# Create database
node src/setup.js

# Verify installation
node src/server.js
# Should output: "Cache server running on stdio"
# Press Ctrl+C to stop
```

**What it does:**
- Creates SQLite database for run state and blocker tracking
- Provides 11 MCP tools for state management
- Enables resume capability

---

### 3. Artifact Server (Artifact Generation)

```bash
cd mcp/artifact-server

# Install dependencies
npm install

# If installation fails on Windows, try:
npm install --build-from-source=false

# Create database
node src/setup.js

# Verify installation
node src/server.js
# Should output: "Artifact server running on stdio"
# Press Ctrl+C to stop
```

**What it does:**
- Creates SQLite database for artifact management
- Provides 11 MCP tools for artifact operations
- Enables DOCX/PDF export (requires Pandoc for DOCX)

---

## Troubleshooting

### Issue: `gyp ERR! find VS` on Windows

**Cause:** Missing Visual Studio C++ build tools

**Solution 1 (Quick):**
```bash
# Use pre-built binaries instead of compiling
cd mcp/guide-server
npm install --build-from-source=false

cd ../cache-server
npm install --build-from-source=false

cd ../artifact-server
npm install --build-from-source=false
```

**Solution 2 (Permanent):**
1. Install Visual Studio Build Tools
2. Select "Desktop development with C++" workload
3. Restart terminal
4. Run `npm install` again

---

### Issue: `EPERM: operation not permitted`

**Cause:** File permissions or antivirus blocking

**Solution:**
1. Close any programs that might be using the files
2. Run terminal as Administrator
3. Temporarily disable antivirus
4. Try installation again

---

### Issue: `prebuild-install` warnings

**Cause:** Deprecated package (harmless warning)

**Solution:** Ignore these warnings. They don't affect functionality.

---

### Issue: Server doesn't start

**Verification steps:**
```bash
# Check Node.js version (should be v18+)
node --version

# Check if database was created
ls data.db

# Check for errors in setup
node src/setup.js
```

---

## Verifying Installation

### Guide Server
```bash
cd mcp/guide-server
node src/seed.js

# Should output:
# Seeding guide-server database...
# Loaded X style packs
# Loaded X templates
# Loaded X canon guides
# ...
# Seeding complete!
```

### Cache Server
```bash
cd mcp/cache-server
node src/setup.js

# Should output:
# Cache server database initialized
```

### Artifact Server
```bash
cd mcp/artifact-server
node src/setup.js

# Should output:
# Artifact server database initialized
```

---

## Optional: Pandoc for DOCX Export

The artifact-server can export to DOCX format using Pandoc.

### Install Pandoc
- **Windows:** Download from [pandoc.org](https://pandoc.org/installing.html)
- **macOS:** `brew install pandoc`
- **Linux:** `sudo apt-get install pandoc`

### Verify Pandoc
```bash
pandoc --version
# Should show version 2.0+
```

---

## Running Servers in Production

### Option 1: MCP Configuration (Recommended)

Add to your MCP configuration file (e.g., Claude Desktop config):

```json
{
  "mcpServers": {
    "guide-server": {
      "command": "node",
      "args": ["C:/path/to/scriptorium/mcp/guide-server/src/server.js"]
    },
    "cache-server": {
      "command": "node",
      "args": ["C:/path/to/scriptorium/mcp/cache-server/src/server.js"]
    },
    "artifact-server": {
      "command": "node",
      "args": ["C:/path/to/scriptorium/mcp/artifact-server/src/server.js"]
    }
  }
}
```

### Option 2: Manual Start

```bash
# Terminal 1
cd mcp/guide-server
node src/server.js

# Terminal 2
cd mcp/cache-server
node src/server.js

# Terminal 3
cd mcp/artifact-server
node src/server.js
```

---

## Database Locations

After installation, databases are created at:
- `mcp/guide-server/data.db` (knowledge layer)
- `mcp/cache-server/data.db` (state management)
- `mcp/artifact-server/data.db` (artifacts)

**Note:** These are gitignored and won't be committed to the repository.

---

## Next Steps

After successful installation:
1. Read `docs/PHASE11_SPECIFICATION.md` for implementation details
2. Start implementing `/write-brief` command
3. Test with `evals/cases/case-01-technical-docs.md`

---

## Support

If installation fails:
1. Check Node.js version (`node --version`)
2. Try `--build-from-source=false` flag
3. Check Windows build tools installation
4. Review error logs in `npm-cache/_logs/`

---

**Last Updated:** 2026-03-29
