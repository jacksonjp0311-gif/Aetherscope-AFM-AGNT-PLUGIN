"""Open URL tool for AGNT - opens dashboard URLs in browser."""
import webbrowser
from typing import Optional
from pydantic import BaseModel, Field
class OpenURLInput(BaseModel):
    url: str = Field(..., description="The URL to open in the browser")
    title: Optional[str] = Field(None, description="Window title")
    new: int = Field(1, description="0 = same window, 1 = new window")
def open_url(url: str, title: Optional[str] = None, new: int = 1) -> dict:
    """Open a URL in the system web browser.

    Returns:
        dict: {"success": True, "message": str, "url": str}
    """
    try:
        # Configure browser behavior
        if title:
            webbrowser.get().open(url, new=new, autoraise=True)
        else:
            webbrowser.get().open(url, new=new)
        return {
            "success": True,
            "message": f"Opened {url} in browser",
            "url": url,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "url": url,
        }