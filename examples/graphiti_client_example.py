"""
Graphiti HTTP Client for Microservices
=====================================
Use this client to interact with the shared Graphiti MCP server
deployed on your private cloud.

Usage:
    from graphiti_client import GraphitiHTTPClient
    
    client = GraphitiHTTPClient()  # Uses GRAPHITI_BASE_URL env var
    await client.add_episode(...)
"""

import os
from datetime import datetime
from typing import Any


class GraphitiHTTPClient:
    """
    HTTP client for the shared Graphiti MCP server.
    
    Usage:
        client = GraphitiHTTPClient()
        await client.add_episode(
            name="user_action",
            episode_body="User did something",
            group_id="user_123"
        )
    """

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        timeout: float = 30.0
    ):
        self.base_url = (base_url or os.getenv("GRAPHITI_BASE_URL", "http://graphiti.internal.company.com")).rstrip("/")
        self.api_key = api_key or os.getenv("GRAPHITI_API_KEY")
        self.timeout = timeout
        self._client = None

    async def _request(
        self,
        method: str,
        endpoint: str,
        json_data: dict | None = None,
        params: dict | None = None
    ) -> dict[str, Any]:
        """Make HTTP request to Graphiti MCP server."""
        import httpx

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(
                method=method,
                url=f"{self.base_url}{endpoint}",
                json=json_data,
                params=params,
                headers=headers
            )
            response.raise_for_status()
            return response.json()

    async def health_check(self) -> dict[str, Any]:
        """Check if Graphiti server is healthy."""
        return await self._request("GET", "/health")

    async def add_episode(
        self,
        name: str,
        episode_body: str,
        source_description: str,
        group_id: str,
        reference_time: datetime | None = None,
        uuid: str | None = None,
    ) -> dict[str, Any]:
        """
        Add an episode to the knowledge graph.
        
        Args:
            name: Identifier for this episode (e.g., "user_signup")
            episode_body: The content to store
            source_description: Source of this data (e.g., "auth_service")
            group_id: Partition identifier (e.g., "user_123")
            reference_time: When this event occurred
            uuid: Optional custom UUID
        
        Returns:
            The created episode
        """
        return await self._request("POST", "/episodes", json_data={
            "name": name,
            "episode_body": episode_body,
            "source_description": source_description,
            "group_id": group_id,
            "reference_time": (reference_time or datetime.now()).isoformat(),
            "uuid": uuid,
        })

    async def search(
        self,
        query: str,
        group_id: str | None = None,
        limit: int = 10,
    ) -> dict[str, Any]:
        """
        Search the knowledge graph.
        
        Args:
            query: Natural language query
            group_id: Optional filter by group
            limit: Maximum results
        
        Returns:
            Search results
        """
        return await self._request("POST", "/search", json_data={
            "query": query,
            "group_id": group_id,
            "limit": limit,
        })

    async def search_nodes(
        self,
        query: str,
        group_id: str | None = None,
    ) -> dict[str, Any]:
        """Search for entity nodes."""
        return await self._request("POST", "/nodes/search", json_data={
            "query": query,
            "group_id": group_id,
        })

    async def search_facts(
        self,
        query: str,
        group_id: str | None = None,
    ) -> dict[str, Any]:
        """Search for facts (edges) between entities."""
        return await self._request("POST", "/facts/search", json_data={
            "query": query,
            "group_id": group_id,
        })

    async def get_episodes(
        self,
        group_id: str,
        limit: int = 50,
    ) -> dict[str, Any]:
        """Get recent episodes for a group."""
        return await self._request("GET", f"/episodes/{group_id}", params={
            "limit": limit,
        })


class GraphitiService:
    """
    High-level service for common Graphiti operations.
    Use this in your microservices.
    """

    def __init__(self, client: GraphitiHTTPClient | None = None):
        self.client = client or GraphitiHTTPClient()

    async def log_user_action(
        self,
        user_id: str,
        action: str,
        details: dict[str, Any],
        source: str = "user_service"
    ):
        """Log a user action to the knowledge graph."""
        episode_body = f"User {user_id} performed action: {action}"
        if details:
            episode_body += f"\nDetails: {details}"

        return await self.client.add_episode(
            name=f"user_action_{action}",
            episode_body=episode_body,
            source_description=source,
            group_id=f"user_{user_id}",
        )

    async def log_business_event(
        self,
        event_type: str,
        entity_id: str,
        data: dict[str, Any],
        org_id: str,
        source: str = "business_service"
    ):
        """Log a business event."""
        return await self.client.add_episode(
            name=f"business_{event_type}",
            episode_body=f"Event: {event_type}\nEntity: {entity_id}\nData: {data}",
            source_description=source,
            group_id=f"org_{org_id}",
        )

    async def get_user_context(self, user_id: str) -> dict[str, Any]:
        """Get all known context about a user."""
        return await self.client.search(
            query="all interactions and preferences",
            group_id=f"user_{user_id}",
            limit=20,
        )

    async def audit_change(
        self,
        entity_type: str,
        entity_id: str,
        before: dict[str, Any],
        after: dict[str, Any],
        actor: str,
        org_id: str | None = None,
    ):
        """Record an audit trail entry."""
        episode_body = f"""
Change: {entity_type} {entity_id}
Before: {before}
After: {after}
Actor: {actor}
Timestamp: {datetime.now().isoformat()}
"""
        group_id = f"org_{org_id}_audit" if org_id else "audit"

        return await self.client.add_episode(
            name=f"audit_{entity_type}_change",
            episode_body=episode_body,
            source_description="audit_service",
            group_id=group_id,
        )


# Convenience function for quick usage
def get_graphiti_service() -> GraphitiService:
    """Get a GraphitiService instance with default configuration."""
    return GraphitiService()
