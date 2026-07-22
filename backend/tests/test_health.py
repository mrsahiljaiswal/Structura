from httpx import AsyncClient

from app.core.config import settings


import pytest


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_health_liveness(client: AsyncClient) -> None:
    response = await client.get(f"{settings.API_V1_PREFIX}/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "environment": settings.ENVIRONMENT}
