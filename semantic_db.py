import sqlite3
import os
from datetime import datetime
from rdflib import Graph, URIRef, Literal, Namespace, ConjunctiveGraph

class SemanticStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        # BUG FIX: os.path.dirname returns '' when db_path has no directory component (e.g. 'semantic.db')
        # which causes os.makedirs('') to raise FileNotFoundError.
        dir_name = os.path.dirname(self.db_path)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)

        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS quads (
                    subject TEXT NOT NULL,
                    predicate TEXT NOT NULL,
                    object TEXT NOT NULL,
                    provenance TEXT NOT NULL,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (subject, predicate, object, provenance)
                )
            """)
            conn.commit()

    def assert_fact(self, subject: str, predicate: str, object_val: str, provenance: str):
        """Asserts a fact quad in the database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO quads (subject, predicate, object, provenance, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (subject, predicate, object_val, provenance, datetime.utcnow().isoformat()))
            conn.commit()

    def retract_fact(self, subject: str, predicate: str, object_val: str, provenance: str):
        """Retracts/deletes a fact quad from the database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                DELETE FROM quads 
                WHERE subject = ? AND predicate = ? AND object = ? AND provenance = ?
            """, (subject, predicate, object_val, provenance))
            conn.commit()

    def get_all_quads(self):
        """Returns all quads as a list of dicts."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT subject, predicate, object, provenance, timestamp FROM quads")
            return [dict(row) for row in cursor.fetchall()]

    def to_rdflib_graph(self) -> ConjunctiveGraph:
        """Loads SQLite quads into an rdflib ConjunctiveGraph for SPARQL queries."""
        cg = ConjunctiveGraph()
        
        # Define base namespaces
        ns_doc = Namespace("http://example.org/doc/")
        ns_fact = Namespace("http://example.org/facts/")
        ns_prov = Namespace("http://example.org/prov/")
        cg.bind("doc", ns_doc)
        cg.bind("fact", ns_fact)
        cg.bind("prov", ns_prov)

        namespaces = {
            "doc": ns_doc,
            "fact": ns_fact,
            "prov": ns_prov
        }

        def resolve(val: str, default_ns):
            if val.startswith(("http://", "https://")):
                return URIRef(val)
            parts = val.split(":", 1)
            if len(parts) == 2 and parts[0] in namespaces:
                return namespaces[parts[0]][parts[1]]
            return default_ns[val]

        quads = self.get_all_quads()
        for q in quads:
            s = resolve(q['subject'], ns_doc)
            p = resolve(q['predicate'], ns_fact)
            
            # Treat objects as Literal or URIRef
            if q['object'].startswith(("http://", "https://")) or (":" in q['object'] and q['object'].split(":", 1)[0] in namespaces):
                o = resolve(q['object'], ns_doc)
            else:
                o = Literal(q['object'])
                
            context_uri = resolve(q['provenance'], ns_prov)
            
            # Add to conjunctive graph with context
            context_graph = cg.get_context(context_uri)
            context_graph.add((s, p, o))
            
        return cg

    def query_sparql(self, query_str: str):
        """Executes a SPARQL query over the loaded graph."""
        graph = self.to_rdflib_graph()
        results = graph.query(query_str)
        return [list(r) for r in results]
