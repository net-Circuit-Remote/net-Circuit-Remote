from dataclasses import dataclass
import os

@dataclass(frozen=True)
class Settings:
    environment: str = os.getenv("NETCIRCUIT_ENV", "development")
    hardware_mode: str = os.getenv("NETCIRCUIT_HARDWARE_MODE", "simulation")
    database_url: str = os.getenv("NETCIRCUIT_DATABASE_URL", "sqlite:///./netcircuit.db")

    def __post_init__(self) -> None:
        if self.hardware_mode not in ("simulation", "hardware"):
            raise ValueError("NETCIRCUIT_HARDWARE_MODE must be 'simulation' or 'hardware'.")

settings = Settings()
