from semantic_db import SemanticStore

class ComplianceStore(SemanticStore):
    """Compliance specific semantic store."""
    def __init__(self, db_path: str):
        super().__init__(db_path)
