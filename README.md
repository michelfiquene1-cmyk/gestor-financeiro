# Gestor Financeiro

Demonstração de gestão financeira pessoal para portfólio, desenvolvida por **Michel Fiquene** com HTML, CSS e JavaScript puro. Oferece dashboard, transações e relatórios em uma aplicação estática preparada para hospedagem no Netlify.

## Links do projeto

- **Demonstração:** [gestor-financeiro-michel.netlify.app](https://gestor-financeiro-michel.netlify.app).
- **Código-fonte:** [michelfiquene1-cmyk/gestor-financeiro](https://github.com/michelfiquene1-cmyk/gestor-financeiro).

## Objetivo

Demonstrar desenvolvimento de interfaces responsivas, manipulação de dados no navegador, cálculos monetários, acessibilidade e tratamento de falhas, utilizando exclusivamente dados fictícios. O projeto não substitui um sistema financeiro de produção.

## Demonstração online

**[Acessar o Gestor Financeiro](https://gestor-financeiro-michel.netlify.app)**

Explore o sistema com dados fictícios. Os lançamentos ficam apenas no armazenamento local do seu navegador (`localStorage`), sem sincronização entre dispositivos. Não insira informações financeiras reais ou dados pessoais sensíveis.

## Funcionalidades

- Dashboard mensal com receitas, despesas e resultado líquido.
- Gráfico de fluxo financeiro dos seis meses até o período selecionado.
- Distribuição de despesas com legenda para todas as categorias presentes.
- Cadastro, edição e exclusão de transações, com validação de campos.
- Busca por descrição, estabelecimento e valor; filtros combinados por tipo, categoria e conta, mantendo todo o histórico.
- Contas e categorias configuráveis: cadastro, edição e exclusão com transferência validada dos lançamentos vinculados.
- Palavras-chave por categoria e sugestões editáveis de categoria e estabelecimento, aplicadas somente por ação explícita.
- Resumo mensal com comparação ao mês anterior, indicadores, evolução de seis meses e relatórios originais.
- Relatórios mensais por categoria e movimentação líquida por conta.
- Exportação de todo o histórico em CSV com separador ponto e vírgula, BOM UTF-8 e proteção de campos contra interpretação como fórmulas.
- 48 lançamentos fictícios iniciais e restauração mediante confirmação.
- Persistência local, tratamento de falhas de gravação e validação dos dados recuperados.
- Layout responsivo e formulário com gerenciamento de foco e navegação por teclado.

## Tecnologias e estrutura

HTML5, CSS3 e JavaScript puro, sem frameworks, bibliotecas externas ou etapa de compilação. O Node.js é necessário apenas para executar os testes; o site funciona no navegador.

| Arquivo | Responsabilidade |
| --- | --- |
| index.html | Interface e formulário |
| styles.css | Estilos e responsividade |
| app.js | Dados, cálculos e comportamento |
| netlify.toml | Publicação estática e cabeçalhos de segurança |
| tests/regression.cjs | Testes de dados e falhas em ambiente isolado |
| tests/browser.cjs | Testes reais no Chrome headless isolado |
| AGENTS.md | Instruções para agentes de programação |
| REQUISITOS.md | Requisitos, evidências e pendências |

## Execução local

1. Baixe o projeto ou clone o repositório pelo link acima.
2. Abra a pasta no VS Code.
3. Use a extensão Live Server para servir index.html e acesse o endereço local informado pela extensão.

Também é possível abrir index.html diretamente no navegador. Para validar armazenamento e comportamento com uma origem HTTP estável, prefira um servidor local. Não há instalação de pacotes nem configuração de variáveis de ambiente.

## Testes

Com Node.js 24 ou superior e Chrome instalado, execute na raiz:

    node --check app.js
    node --check tests/regression.cjs
    node --check tests/browser.cjs
    node tests/regression.cjs
    node tests/browser.cjs

Os testes de regressão cobrem persistência, validação, períodos inválidos, CSV, gráficos e cálculos com dados fictícios. O teste de navegador cobre os fluxos implementados, foco, teclado, falhas de armazenamento, download CSV e layouts de 320 a 1440 pixels.

O teste de navegador inicia um servidor em loopback e usa um perfil temporário, sem acessar o perfil pessoal do usuário. Por padrão procura o Chrome no caminho habitual do Windows; a variável CHROME_PATH permite informar outro executável compatível. As capturas ficam em `.preview/`, ignorada pelo Git, e os downloads no perfil temporário. Nenhum teste publica o projeto.

Para conferir o site publicado após um deploy autorizado, execute no PowerShell `$env:GESTOR_TEST_URL = 'https://gestor-financeiro-michel.netlify.app'` e depois `node tests/browser.cjs`. O teste usa o mesmo perfil temporário isolado e dados fictícios; altera somente o armazenamento desse perfil, sem publicar nem acessar os dados do seu navegador. Para voltar ao servidor local, use `$env:GESTOR_TEST_URL = ''`. O destino remoto é restrito ao site existente indicado acima.

A importação do CSV em Excel/LibreOffice, o uso com leitor de tela, outros motores de navegador e dispositivos móveis físicos ainda precisam de validação. Consulte REQUISITOS.md para o escopo das evidências existentes.

## Publicação no Netlify

A evolução visual V3 foi aprovada pelo usuário no Live Server. A integração da branch `redesign/v3-evolucao-local` à `main` e a atualização do repositório e do site existentes foram autorizadas em 7 de novembro de 2026, condicionadas à auditoria e aos testes. Não criar outro repositório, site ou domínio. Confirmar o commit remoto e o conteúdo servido no endereço público antes de declarar a publicação concluída.

Execute estes passos somente após aprovar a publicação e confirmar a conta pessoal correta do GitHub.

**Integração com GitHub:**

1. Confirme o username e o perfil pessoal; o nome/e-mail do Git não comprovam a identidade autenticada.
2. Após autorização, publique os arquivos revisados em um repositório dessa conta.
3. No Netlify, importe o repositório pelo provedor GitHub.
4. Mantenha o comando de build em branco e o diretório de publicação como ponto (.). O arquivo netlify.toml já define esse diretório.
5. Após o deploy, confira HTTPS, carregamento dos arquivos, console, armazenamento, exportação e cabeçalhos de segurança na URL publicada.
6. Mantenha o link da demonstração atualizado. Atualizações enviadas à branch configurada poderão disparar novos deploys.

**Envio manual:** também é possível enviar a pasta revisada pelo Netlify Drop, sem GitHub. O .gitignore protege o versionamento Git; ele não deve ser tratado como barreira de segurança para uploads manuais. Confira o conteúdo enviado e não inclua arquivos locais ou confidenciais.

O site não exige backend, banco online ou segredos. A compatibilidade local e a configuração existente não substituem a verificação do ambiente publicado.

## Integridade dos dados

- **Compatibilidade V1 → V3:** a abertura lê a chave antiga `gestor-financeiro-portfolio-demo-v1` quando a chave V3 ainda não existe. Nenhum dado é regravado na abertura. A primeira alteração confirmada salva transações e cadastros juntos em `gestor-financeiro-portfolio-demo-v3`, com versão de formato 3. A chave V1 permanece intacta. Falhas e formatos inválidos bloqueiam a gravação sem substituição por exemplos.
- A partir dessa primeira gravação, a V3 usa sua própria chave; alterações posteriores feitas na V1 não são mescladas automaticamente. Voltar ao código V1 mostra os dados da chave antiga, sem as edições da V3. Não há sincronização entre as versões. Preserve a mesma origem e porta do Live Server para continuar usando os mesmos dados locais.
- Renomear uma conta ou categoria atualiza suas referências no histórico em uma única gravação. Excluir um cadastro utilizado exige selecionar um destino compatível; é possível cancelar e criar esse destino antes. Categorias utilizadas não podem trocar entre receita e despesa.
- Restaurar exemplos exige confirmação e substitui os lançamentos e cadastros da V3 pelos padrões. A chave V1 permanece intacta.
- O valor movimentado de uma conta é a soma das entradas e saídas do mês; a participação usa essa mesma base em todas as contas. O relatório líquido mantém receitas menos despesas. Nenhum desses valores representa saldo bancário.
- As sugestões usam palavras-chave separadas por vírgulas, ignorando acentos e diferenças entre maiúsculas e minúsculas. Em múltiplas correspondências, a primeira categoria cadastrada é sugerida. O estabelecimento pode ser extraído do trecho após “no”, “na” ou “em”; revise antes de aplicar. Não há serviço externo nem inteligência artificial conectada.

- Inclusões, edições, exclusões e restaurações só são confirmadas após a gravação local. Em caso de erro, os dados anteriores são preservados e o formulário permanece aberto.
- Dados locais inválidos ou inacessíveis geram aviso persistente e bloqueiam gravações, sem substituir o conteúdo por exemplos. Preserve uma cópia do armazenamento antes de investigar; após resolver a causa, recarregue a página. Não há reparo automático.
- Alterações detectadas no armazenamento de outra aba impedem a gravação até recarregar. Isso não garante sincronização ou resolução de gravações simultâneas.
- Um mês vazio ou inválido retorna ao último período válido.
- O CSV contém todo o histórico, independentemente do mês selecionado. Campos potencialmente interpretáveis como fórmulas recebem um apóstrofo, que pode aparecer em alguns importadores.

## Limitações e segurança

**Use apenas dados fictícios. Não armazene informações financeiras reais, dados bancários, dados pessoais sensíveis, senhas ou credenciais nesta demonstração.**

- Os dados ficam em localStorage, vinculados ao navegador e à origem do site. Não são enviados a um backend pela aplicação.
- Limpar o armazenamento pode apagar os registros. Trocar de navegador, dispositivo, endereço ou porta pode apresentar outro conjunto de dados.
- Não há autenticação, backend, banco online, integração bancária ou sincronização entre dispositivos.
- Não há backup automático, importação de CSV ou recuperação remota.
- A listagem não tem paginação. Contas e categorias são configuráveis; a última categoria de cada tipo deve ser mantida.
- O resultado por conta representa a movimentação líquida do mês, sem conciliação ou saldo inicial. Não há distinção entre previsto e realizado.
- O armazenamento local não oferece proteção contra outras pessoas com acesso ao mesmo perfil de navegador.
- Não inclua arquivos .env, bancos, exportações, backups, tokens ou chaves no repositório. Revise os arquivos antes de cada envio; o .gitignore não substitui essa revisão.

## Autoria

Desenvolvido por **Michel Fiquene** como projeto de portfólio. Perfil pessoal confirmado pelo autor: [michelfiquene1-cmyk](https://github.com/michelfiquene1-cmyk).
