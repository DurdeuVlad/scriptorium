import asyncio
import os
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class MCPClientManager:
    def __init__(self):
        self.sessions = {}
        self.clients = {}

    async def connect_server(self, name: str, script_path: str):
        """Starts an MCP server as a subprocess and establishes a client session."""
        abs_path = os.path.abspath(script_path)
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"MCP server script not found: {abs_path}")

        print(f"Connecting to MCP Server {name} using node {abs_path}...")
        params = StdioServerParameters(command="node", args=[abs_path])
        
        # We need to manage the lifecycle of read/write streams
        client = stdio_client(params)
        read, write = await client.__aenter__()
        
        session = ClientSession(read, write)
        await session.__aenter__()
        await session.initialize()
        
        self.clients[name] = client
        self.sessions[name] = session
        print(f"Successfully connected and initialized {name} MCP server.")

    async def call_tool(self, server_name: str, tool_name: str, arguments: dict = None):
        """Calls a tool on a specific connected MCP server."""
        if server_name not in self.sessions:
            raise ValueError(f"MCP server {server_name} is not connected.")
        
        session = self.sessions[server_name]
        print(f"Calling tool {tool_name} on {server_name} with args: {arguments}")
        result = await session.call_tool(tool_name, arguments or {})
        return result

    async def disconnect_all(self):
        """Disconnects all active sessions and terminates server processes."""
        for name, session in list(self.sessions.items()):
            print(f"Disconnecting session for {name} MCP server...")
            try:
                await session.__aexit__(None, None, None)
            except Exception as e:
                print(f"Error disconnecting session {name}: {e}")
                
        for name, client in list(self.clients.items()):
            print(f"Disconnecting client for {name} MCP server...")
            try:
                await client.__aexit__(None, None, None)
            except Exception as e:
                print(f"Error disconnecting client {name}: {e}")
        self.sessions.clear()
        self.clients.clear()
