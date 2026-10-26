from pathlib import Path

from app.routes import fornecedor_router

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

app = FastAPI(title="ObraFlow")
app.include_router(fornecedor_router, prefix="/api")

templates = Jinja2Templates(
    directory=Path(__file__).resolve().parent / "templates"
)


@app.get("/", response_class=HTMLResponse)
def inicio(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="inicio.html",
        context={"titulo": "ObraFlow"},
    )