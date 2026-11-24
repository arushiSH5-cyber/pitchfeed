"""Settings. Every integration is live when its key is set, demo otherwise."""
import os


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


ANTHROPIC_API_KEY = _env("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = _env("ANTHROPIC_MODEL", "claude-sonnet-4-5")
TAVILY_API_KEY = _env("TAVILY_API_KEY")
HUNTER_API_KEY = _env("HUNTER_API_KEY")
FLEXPRICE_API_KEY = _env("FLEXPRICE_API_KEY")
FLEXPRICE_BASE_URL = _env("FLEXPRICE_BASE_URL", "https://api.cloud.flexprice.io/v1")
FLEXPRICE_CUSTOMER_ID = _env("FLEXPRICE_CUSTOMER_ID", "pitchfeed-demo-org")
SENDGRID_API_KEY = _env("SENDGRID_API_KEY")
DEMO_INBOX = _env("DEMO_INBOX", "demo-inbox@example.com")
DEMO_CREDITS = float(_env("DEMO_CREDITS", "400"))
GRAPH_DB_PATH = _env("GRAPH_DB_PATH", "./data/graph.kuzu")


def modes() -> dict:
    live = lambda k: "live" if k else "demo"
    return {
        "llm": live(ANTHROPIC_API_KEY),
        "search": live(TAVILY_API_KEY),
        "enrichment": live(HUNTER_API_KEY),
        "billing": live(FLEXPRICE_API_KEY),
        "email": live(SENDGRID_API_KEY),
        "graph": "live",  # Kùzu is embedded, always on
    }
