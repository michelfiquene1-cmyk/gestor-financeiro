# Requisitos do Gestor Financeiro

## Objetivo e escopo

Oferecer uma demonstração funcional de um gestor financeiro pessoal para portfólio, utilizando exclusivamente dados fictícios. A aplicação atual usa HTML, CSS e JavaScript puro e pode ser hospedada como site estático no Netlify.

Este documento registra a análise e as correções verificadas em 5 de novembro de 2026. Os critérios de publicação ainda pendentes não devem ser considerados aprovados.

Backend, login e banco de dados estão fora desta versão. A publicação depende de autorização explícita do usuário.

## Estrutura atual

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Interface, telas e formulário de transações |
| `styles.css` | Estilos, gráficos em CSS e regras responsivas |
| `app.js` | Estado, cálculos, navegação, transações e exportação |
| `netlify.toml` | Publicação da raiz e cabeçalhos de segurança |
| `.gitignore` | Exclusões de arquivos locais e potencialmente sensíveis |
| `README.md` | Execução, recursos, publicação e limites da demonstração |
| `AGENTS.md` | Instruções permanentes para agentes de programação |
| `REQUISITOS.md` | Estado funcional, pendências e critérios de aceite |
| `tests/regression.cjs` | Cenários de dados, persistência, CSV e gráficos em Node.js, sem dependências |
| `tests/browser.cjs` | Verificação em Chrome headless isolado via protocolo DevTools, sem dependências |

Não há dependências externas nem etapa de compilação. A configuração existente define o diretório de publicação como `.`.

## Funcionalidades implementadas

Confirmadas pela leitura do código; a existência de regras de interface não equivale à validação visual em navegador.

- Dashboard mensal com receitas, despesas e saldo líquido do período.
- Gráfico de receitas e despesas para seis meses, terminando no mês selecionado.
- Distribuição das despesas por categoria e seis transações mais recentes do mês.
- Cadastro, edição e exclusão de transações, com descrição, tipo, valor, categoria, conta e data.
- Validação de formulário e valores monetários armazenados em centavos inteiros.
- Busca por descrição e filtro por tipo na listagem de todo o histórico.
- Relatórios mensais de despesas por categoria e resultado líquido por conta.
- Exportação de todo o histórico em CSV, com separador `;`, aspas e BOM UTF-8.
- Leitura e gravação de transações em `localStorage`.
- Geração de 48 lançamentos fictícios distribuídos em seis meses e restauração mediante confirmação.
- Navegação entre Visão geral, Transações e Relatórios, com regras responsivas e menu móvel.
- Escape de textos nas principais renderizações HTML e cabeçalhos de segurança declarados para o Netlify.

## Correções prioritárias implementadas

CP-01 a CP-07 foram implementadas. Os critérios abaixo orientam a manutenção; a validação manual de CSV em aplicativos de planilha e com leitor de tela permanece pendente. As evidências executadas estão registradas adiante.

| ID | Correção | Critério de aceite verificável |
| --- | --- | --- |
| CP-01 | Falha de persistência | Simular erro em `localStorage.setItem` ao adicionar, editar, excluir e restaurar. Não deve aparecer confirmação de gravação bem-sucedida. A interface deve informar a falha e manter um estado coerente com o que foi efetivamente salvo, sem perda silenciosa. No caminho de sucesso, recarregar deve preservar os dados. |
| CP-02 | Mês vazio | Limpar o campo de mês não deve lançar exceção nem interromper a renderização. Deve existir comportamento explícito e consistente para período ausente ou inválido. |
| CP-03 | Validação dos dados locais | Rejeitar ou recuperar de forma controlada JSON inválido, estrutura incorreta, datas impossíveis, IDs não positivos ou duplicados, tipos desconhecidos, valores fora dos limites e categorias/contas inválidas. Aplicar limites equivalentes aos do formulário e informar quando os dados salvos não puderem ser utilizados. |
| CP-04 | Proteção de CSV | Neutralizar campos textuais interpretáveis como fórmulas, incluindo prefixos `=`, `+`, `-`, `@` e caracteres de controle relevantes. Validar exemplos inofensivos em planilha, preservando acentos, aspas, separadores e quebras de linha. |
| CP-05 | Acessibilidade dos modais | Ao abrir, mover o foco para o diálogo; manter Tab e Shift+Tab dentro dele; impedir interação com o fundo; permitir fechar por Escape e pelos controles; devolver o foco ao acionador ao fechar. Verificar nome acessível e operação por teclado. |
| CP-06 | Legenda dos gráficos | Com despesas nas nove categorias disponíveis, todas as categorias representadas devem ser identificáveis com cor e valor ou percentual coerentes. A legenda não deve omitir silenciosamente categorias do gráfico. |
| CP-07 | Barras zeradas | Meses com receita ou despesa zero não devem exibir barra com altura positiva que represente movimentação. Zero e valores positivos devem continuar identificáveis, inclusive por alternativa textual acessível. |

## Melhorias futuras

Não são bloqueadores da demonstração atual e dependem de definição e autorização de escopo.

- **Backup e importação:** exportação de backup estruturado e restauração com validação, tratamento de duplicidades e confirmação antes de substituir dados.
- **Filtros por período:** seleção clara e consistente em transações, relatórios e exportação; indicar quando a exportação inclui todo o histórico.
- **Paginação:** limitar registros renderizados e manter busca, ordenação e contagem coerentes.
- **Categorias e contas configuráveis:** permitir manutenção sem invalidar transações existentes e com validação de nomes e referências.

## Limitações atuais

- Os dados ficam em `localStorage`, vinculados ao navegador e à origem do site; podem ser apagados ao limpar o armazenamento.
- Não há autenticação, backend, banco de dados online ou sincronização entre dispositivos ou abas por mecanismo implementado pela aplicação.
- Não há integração bancária, controle de permissões, recuperação remota ou garantia de backup.
- A exportação CSV não pode ser reimportada pela interface.
- Categorias e contas são fixas no código; a listagem não tem paginação.
- O período é selecionado na Visão geral e afeta dashboard e relatórios. A listagem e o CSV abrangem todo o histórico.
- O resultado por conta é a movimentação líquida do mês, não um saldo bancário conciliado ou acumulado.
- Lançamentos futuros entram nos totais do mês; não há distinção entre previsto e realizado.
- A aplicação deve ser apresentada como demonstração com dados fictícios, sem promessa de adequação ao uso financeiro real.
- Dados locais inválidos ou inacessíveis bloqueiam gravações e geram aviso persistente. O conteúdo original não é sobrescrito; não há ferramenta de reparo nesta versão.
- Há detecção de alterações do armazenamento antes de salvar, mas não há bloqueio atômico entre abas: não se garante resolução de gravações simultâneas.

## Requisitos de qualidade e segurança

- Preservar a arquitetura estática e evitar dependências ou reconstruções sem necessidade justificada.
- Manter código legível, responsabilidades compreensíveis e decisões técnicas documentadas.
- Validar dados tanto no formulário quanto na leitura do armazenamento; manter cálculos em centavos inteiros e dentro de limites seguros.
- Não incluir dados financeiros reais, credenciais ou segredos nos arquivos, exemplos, testes ou histórico versionado.
- Preservar escape de conteúdo dinâmico e proteção de exportações; não introduzir execução de conteúdo fornecido pelo usuário.
- Verificar os cabeçalhos de segurança na resposta HTTP do ambiente publicado; a configuração local, isoladamente, não comprova sua aplicação.
- Oferecer rótulos acessíveis, foco visível, navegação por teclado, contraste legível e alternativas textuais para informações dos gráficos.
- Validar interface em telas móveis e desktop, sem sobreposição de controles ou corte de conteúdo essencial. Tabelas podem usar rolagem horizontal própria.
- Comunicar falhas de forma compreensível e não confirmar operações sem verificar seu resultado.

## Requisitos de testes e evidências

- Escolher verificações proporcionais à alteração, sem exigir novas ferramentas para mudanças exclusivamente documentais.
- Para JavaScript, executar verificação de sintaxe, como `node --check app.js`, e cenários funcionais afetados.
- Exercitar inclusão, edição, exclusão, cancelamento, restauração, filtros, relatórios e exportação; conferir resultados monetários conhecidos e persistência após recarregar.
- Cobrir as falhas CP-01 a CP-07 com cenários reproduzíveis, incluindo armazenamento indisponível ou inválido e períodos sem transações.
- Testar descrições com caracteres HTML e conteúdo semelhante a fórmulas, usando somente exemplos fictícios e inofensivos.
- Verificar em navegador navegação por teclado, foco dos modais, estados vazios, CSV e layouts móvel e desktop.
- Registrar ambiente, cenário, resultado e limitações. Não apresentar testes isolados de funções como validação completa da interface.

### Evidências da análise inicial

- `node --check app.js` passou.
- As referências diretas a IDs do HTML foram encontradas e não foram identificados IDs duplicados.
- A geração de dados produziu 48 registros; no mês-base, receitas de R$ 5.150,00 e despesas de R$ 2.593,00.
- Em execução JavaScript isolada, foram reproduzidos: exceção ao usar mês vazio, aceitação de dados locais inconsistentes e mensagem de sucesso após erro de gravação.
- Não foram realizados testes visuais em navegador, deploy ou validação de cabeçalhos HTTP na análise inicial.

### Implementação e evidências após as correções

- **CP-01:** gravação recebe uma coleção candidata, valida e só atualiza o estado em memória depois de `setItem` retornar sem erro. Inclusão, edição, exclusão e restauração foram testadas com sucesso e com falha simulada; estado e conteúdo anterior foram preservados nas falhas. Formulário permanece aberto quando salvar falha. Alterações externas detectadas impedem sobrescrita.
- **CP-02:** período inválido retorna ao último mês válido, com aviso. Testados mês vazio, texto inválido, mês 13 e anos fora do intervalo de quatro dígitos positivo; não ocorreu `RangeError`.
- **CP-03:** validação exige objetos, IDs inteiros seguros positivos e únicos, descrição não vazia de até 80 caracteres, tipo reconhecido, centavos positivos dentro do limite, soma segura, data real e categoria/conta permitidas. JSON inválido e coleções inválidas não são substituídos ou sobrescritos. Data bissexta válida foi aceita e datas impossíveis rejeitadas.
- **CP-04:** células de CSV potencialmente interpretáveis como fórmulas recebem apóstrofo antes do escape e das aspas. Testados prefixos `=`, `+`, `-`, `@`, espaços e controles, acentos, aspas, separador, quebras de linha e BOM. Download real verificado no Chrome. Importação em Excel/LibreOffice ainda não executada.
- **CP-05:** foco inicial no formulário, fundo `inert`, contenção de Tab/Shift+Tab, Escape e retorno ao acionador, inclusive após recriar a linha editada. Testados com eventos de teclado no Chrome. Verificação com leitor de tela e outros navegadores permanece pendente.
- **CP-06:** legenda contém todas as categorias presentes, percentuais e valores. Nove categorias verificadas nos testes e em captura do dashboard.
- **CP-07:** altura calculada é zero para valor zero, sem altura mínima positiva em CSS. Valores mensais exatos constam em rótulos acessíveis. Verificadas as 12 barras zeradas em Node.js e altura geométrica zero no Chrome.
- `node --check app.js`, `node --check tests/regression.cjs` e `node --check tests/browser.cjs`: aprovados.
- `node tests/regression.cjs`: 13 cenários aprovados, incluindo CRUD, restauração, recarga em novo contexto, limites monetários, caracteres HTML, dados corrompidos e erros de leitura/gravação.
- `node tests/browser.cjs`: aprovado em Chrome headless com perfil temporário e servidor local isolados. Verificados dashboard, cadastro/edição, busca, relatórios, foco, falha por quota, aviso de dados inválidos, download CSV e ausência de exceções JavaScript nos cenários exercitados.
- Layouts de dashboard, transações, relatórios e formulário verificados geometricamente em 320, 390, 760 e 1440 pixels, sem transbordamento horizontal global. Capturas de dashboard desktop/móvel, estados vazios de transações/relatórios e formulário desktop foram inspecionadas visualmente. Isso não substitui teste em dispositivo físico.
- Nenhuma biblioteca adicionada. Nenhum dado do perfil pessoal foi acessado e nenhuma publicação foi realizada.

### Pendências de validação

- Importar o CSV em Excel/LibreOffice e confirmar que exemplos de fórmulas permanecem texto.
- Verificar com leitor de tela, outros motores de navegador e dispositivos móveis físicos; não foram testados nesta etapa.
- Conferir HTTPS, arquivos e cabeçalhos de segurança no ambiente Netlify somente após deploy autorizado.

## Critérios de aceite para publicação

Os itens abaixo distinguem verificações locais concluídas e validações ainda necessárias para aprovação da publicação.

- [ ] CP-01 a CP-07 corrigidos e seus cenários de aceite aprovados.
- [x] Fluxos principais e cálculos conferidos com dados fictícios conhecidos, incluindo recarregamento após gravação em novo contexto isolado.
- [x] Testes de sintaxe, interface, teclado e responsividade aprovados no escopo Chrome headless descrito acima, sem exceções JavaScript nos cenários exercitados.
- [ ] Arquivos revisados para ausência de segredos e dados financeiros reais; limitações e instruções de execução atualizadas no README.
- [ ] Para publicação pelo GitHub: repositório criado ou selecionado, arquivos corretos na raiz e envio verificado, mediante autorização prévia para commits e push. Na análise inicial, a pasta não era um repositório Git.
- [ ] Netlify configurado sem comando de build e com diretório de publicação `.`, conforme a arquitetura atual; nenhuma variável de ambiente é exigida pelo código.
- [ ] Autorização explícita obtida antes de qualquer deploy. É possível publicar manualmente sem GitHub, se esse for o caminho autorizado.
- [ ] Após o deploy autorizado, URL abre por HTTPS, HTML/CSS/JavaScript carregam corretamente e os cabeçalhos declarados são conferidos na resposta HTTP.
- [ ] Na URL publicada, navegação, transações, armazenamento, gráficos e download do CSV funcionam com dados fictícios; evidências e eventuais limitações são registradas.

## Registro de decisões

| Data | Decisão | Justificativa e impacto |
| --- | --- | --- |
| 2026-11-05 | Preservar HTML, CSS e JavaScript puro com hospedagem estática | A arquitetura atende à demonstração de portfólio sem backend ou compilação. |
| 2026-11-05 | Executar somente documentação nesta etapa | Criar `AGENTS.md` e `REQUISITOS.md`, sem alterar arquivos existentes, implementar correções, versionar ou publicar. |
| 2026-11-05 | Implementar as sete correções após nova autorização | Preservar arquitetura e design. Validar coleções antes da gravação e só atualizar estado após sucesso; bloquear escrita quando o conteúdo original for inválido. |
| 2026-11-05 | Usar testes sem dependências e navegador isolado | Cobrir regressões e comportamento real no Chrome sem acessar o armazenamento pessoal ou exigir bibliotecas. Permanecem validações de planilha, tecnologias assistivas e ambiente publicado. |

Atualizar este registro e o estado dos requisitos quando decisões ou implementações forem autorizadas e verificadas.
