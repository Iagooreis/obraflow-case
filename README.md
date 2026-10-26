# ObraFlow — Pedidos de compra

Implementação do desafio técnico da ObraFlow.

Nesta etapa, a aplicação possui uma página inicial e uma API para
cadastro e listagem de fornecedores, com persistência em SQLite
e testes automatizados.

O enunciado original está em [DESAFIO.md](DESAFIO.md).

## Tecnologias

- Python 3.12+
- FastAPI e Uvicorn
- SQLAlchemy e SQLite
- Jinja2, HTML, CSS e JavaScript
- pytest e HTTPX

## Como executar

Pré-requisitos: Python 3.12 ou superior e uv instalado.

Na raiz do projeto, instale as dependências:

```bash
uv sync
```

Crie as tabelas:

```bash
uv run python -c 'from app.database import engine; from app.models import Base; Base.metadata.create_all(engine)'
```

Inicie o servidor:

```bash
uv run uvicorn app.main:app --reload
```

- Página inicial: http://127.0.0.1:8000
- Documentação interativa da API: http://127.0.0.1:8000/docs

O banco é armazenado no arquivo local `obraflow.db`.
A configuração pode ser alterada pela variável `DATABASE_URL`,
conforme o arquivo `.env.example`.

## API disponível

| Método | Rota | Operação |
|---|---|---|
| POST | `/api/fornecedores` | Cadastrar fornecedor |
| GET | `/api/fornecedores` | Listar fornecedores |

Exemplo de corpo para cadastro:

```json
{
  "nome_fornecedor": "Materiais Exemplo",
  "cnpj": "00000000000001",
  "rua": "Rua Principal, 100",
  "cidade": "Salvador"
}
```

O cadastro retorna 201 quando realizado, 422 para dados inválidos
e 409 quando o CNPJ já está cadastrado.

A validação do CNPJ verifica o formato de 14 dígitos,
sem calcular os dígitos verificadores.

## Testes

```bash
uv run pytest
```

Os testes utilizam um banco temporário separado para cada cenário.

## Decisões técnicas

- SQLite simplifica a execução local, dispensando um servidor de banco.
- Rotas, serviços e repositórios separam a comunicação HTTP,
  as regras de negócio e o acesso aos dados.
- Jinja2 renderiza páginas HTML no servidor.
- A validação dos dados ocorre nos schemas; o banco também impõe
  restrições de formato e unicidade do CNPJ.
- A criação inicial das tabelas usa `create_all`, que não substitui
  migrations para alterações futuras de estrutura.

## Próximas etapas

Cadastro de obras e usuários, dados de demonstração, regras de alçada,
pedidos com itens e fluxo de aprovação.

## Reaproveitamento

A base foi adaptada da branch `feat/api-fastapi` do projeto
[licitacoes-db-lab](https://github.com/Iagooreis/licitacoes-db-lab).