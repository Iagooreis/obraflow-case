from datetime import date
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.dependencies import SessionDep
from app.routes import (
    alcada_router,
    fornecedor_router,
    obra_router,
    pedido_router,
    usuario_router,
)
from app.services import FornecedorService, ObraService

app = FastAPI(title="ObraFlow")
app.mount(
    "/static",
    StaticFiles(directory=Path(__file__).resolve().parent / "static"),
    name="static",
)
app.include_router(fornecedor_router, prefix="/api")
app.include_router(obra_router, prefix="/api")
app.include_router(usuario_router, prefix="/api")
app.include_router(alcada_router, prefix="/api")
app.include_router(pedido_router, prefix="/api")

templates = Jinja2Templates(directory=Path(__file__).resolve().parent / "templates")


@app.get("/", response_class=HTMLResponse)
def inicio(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="inicio.html",
        context={"titulo": "ObraFlow"},
    )


@app.get("/pedidos/novo", response_class=HTMLResponse)
def novo_pedido(request: Request, session: SessionDep):
    return templates.TemplateResponse(
        request=request,
        name="pedido_novo.html",
        context={
            "obras": ObraService(session).list_all(),
            "fornecedores": FornecedorService(session).list_all(),
            "data_hoje": date.today().isoformat(),
        },
    )
