from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.routes import fornecedor_router, obra_router, usuario_router

app = FastAPI(title="ObraFlow")
app.include_router(fornecedor_router, prefix="/api")
app.include_router(obra_router, prefix="/api")
app.include_router(usuario_router, prefix="/api")

templates = Jinja2Templates(directory=Path(__file__).resolve().parent / "templates")


@app.get("/", response_class=HTMLResponse)
def inicio(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="inicio.html",
        context={"titulo": "ObraFlow"},
    )
