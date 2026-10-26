# ObraFlow — Pedidos de compra

Implementação do desafio técnico da ObraFlow.

Nesta etapa, a aplicação possui uma página inicial e uma API para
cadastrar e listar fornecedores, obras e usuários e configurar as regras
de alçada por obra, com persistência em SQLite e testes automatizados.

O enunciado original está em [DESAFIO.md](DESAFIO.md).

## Tecnologias

- Python 3.12+
- FastAPI e Uvicorn
- SQLAlchemy e SQLite
- Jinja2 e HTML
- pytest, HTTPX e Ruff

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
| POST | `/api/obras` | Cadastrar obra |
| GET | `/api/obras` | Listar obras |
| POST | `/api/usuarios` | Cadastrar usuário |
| GET | `/api/usuarios` | Listar usuários |
| GET | `/api/obras/{id_obra}/alcadas` | Consultar faixas e aprovadores da obra |
| PUT | `/api/obras/{id_obra}/alcadas` | Substituir a configuração de alçadas da obra |

Exemplo de corpo para cadastro de fornecedor:

```json
{
  "nome_fornecedor": "Materiais Exemplo",
  "cnpj": "00000000000001",
  "rua": "Rua Principal, 100",
  "cidade": "Salvador"
}
```

O cadastro de fornecedor retorna 201 quando realizado, 422 para dados inválidos
e 409 quando o CNPJ já está cadastrado.

A validação do CNPJ verifica o formato de 14 dígitos,
sem calcular os dígitos verificadores.

Para cadastrar uma obra, envie `{"nome_obra": "Residencial Horizonte"}`
para `POST /api/obras`. O nome é obrigatório, tem até 200 caracteres
e espaços nas extremidades são removidos.

Para cadastrar um usuário, envie `{"nome_usuario": "Amanda"}`
para `POST /api/usuarios`. O nome é obrigatório e tem até 150 caracteres.

Para configurar as alçadas, envie um PUT para
`/api/obras/{id_obra}/alcadas` com os IDs dos usuários cadastrados:

```json
{
  "faixas": [
    {"limite_superior_centavos": 1000000, "aprovadores": [1]},
    {"limite_superior_centavos": null, "aprovadores": [1, 2]}
  ]
}
```

Nesse exemplo, pedidos até R$ 10.000,00 exigirão o usuário 1; acima desse
valor, o usuário 1 aprovará antes do usuário 2. O limite `null` indica a
última faixa, sem valor máximo. A ordem dos IDs define a ordem de aprovação.
O PUT substitui todas as faixas anteriores da obra em uma transação;
`{"faixas": []}` remove todas. O GET devolve a configuração salva.
Obra inexistente retorna 404; limites repetidos, fora de ordem ou
usuários inexistentes retornam 422.

## Testes

```bash
uv run pytest
```

Os testes utilizam um banco temporário separado para cada cenário.

Para verificar o código e sua formatação:

```bash
uv run ruff check app tests
uv run ruff format --check app tests
```

## Decisões técnicas

- SQLite simplifica a execução local, dispensando um servidor de banco.
- Rotas, serviços e repositórios separam a comunicação HTTP,
  as regras de negócio e o acesso aos dados.
- Jinja2 renderiza páginas HTML no servidor.
- A validação dos dados ocorre nos schemas; o banco também impõe
  restrições de formato e unicidade do CNPJ.
- Faixas de alçada pertencem a uma obra e têm limites crescentes em centavos.
  Os aprovadores são vinculados por ID e sua posição define a ordem.
- A configuração completa é substituída em uma transação SQLite iniciada
  antes das leituras de validação, evitando alterações parciais ou misturadas.
- A criação inicial das tabelas usa `create_all`, que não substitui
  migrations para alterações futuras de estrutura.

## Próximas etapas

Dados de demonstração, tela de configuração das alçadas,
pedidos com itens, fluxo de aprovação e suas telas.

## Reaproveitamento

A base foi adaptada da branch `feat/api-fastapi` do projeto
[licitacoes-db-lab](https://github.com/Iagooreis/licitacoes-db-lab).
