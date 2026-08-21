import os
import shutil
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

class LocalStorageService(StorageService):
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        ext = os.path.splitext(filename)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(self.upload_dir, unique_name)
        with open(filepath, "wb") as f:
            f.write(file_bytes)
        return f"/uploads/{unique_name}"

    def delete_file(self, file_key: str) -> bool:
        filename = os.path.basename(file_key)
        filepath = os.path.join(self.upload_dir, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False

    def get_file_url(self, file_key: str) -> str:
        return file_key

def get_storage_service() -> StorageService:
    if settings.STORAGE_PROVIDER == "s3":
        # S3StorageService could be initialized here if needed
        return LocalStorageService()
    return LocalStorageService()
