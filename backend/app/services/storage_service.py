import base64
import os
import uuid
from abc import ABC, abstractmethod
from app.core.config import settings

class StorageService(ABC):
    @abstractmethod
    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        pass

    @abstractmethod
    def delete_file(self, file_key: str) -> bool:
        pass

    @abstractmethod
    def get_file_url(self, file_key: str) -> str:
        pass

class DatabaseStorageService(StorageService):
    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        # Convert binary file bytes to Base64 Data URI for direct database storage
        encoded = base64.b64encode(file_bytes).decode("utf-8")
        mime = content_type or "image/png"
        return f"data:{mime};base64,{encoded}"

    def delete_file(self, file_key: str) -> bool:
        return True

    def get_file_url(self, file_key: str) -> str:
        return file_key

class LocalStorageService(DatabaseStorageService):
    """Alias for backwards compatibility maintaining DB base64 storage."""
    pass

def get_storage_service() -> StorageService:
    return DatabaseStorageService()

