# Instruções para agentes de programação

## Escopo e arquitetura

- Este projeto é uma demonstração funcional de um gestor financeiro para portfólio, feita com HTML, CSS e JavaScript puro e preparada para hospedagem estática no Netlify.
- Preserve a arquitetura existente. Evite reconstruções, frameworks, dependências ou reorganizações desnecessárias.
- Não implemente backend, autenticação ou banco de dados sem solicitação explícita do usuário.
- Consulte `REQUISITOS.md` antes de alterar o comportamento. Diferencie funcionalidades implementadas, correções pendentes e melhorias futuras.
- Respeite o escopo autorizado em cada tarefa; a existência de uma pendência não autoriza sua implementação.

## Prioridades de implementação

- Priorize segurança, integridade dos dados, acessibilidade, responsividade e código legível.
- Mantenha valores monetários em centavos inteiros e valide entradas e dados recuperados do armazenamento.
- Trate falhas de armazenamento explicitamente. Não apresente sucesso sem verificar o resultado da operação.
- Preserve o escape de conteúdo dinâmico e proteja exportações contra interpretação de texto como fórmulas.
- Garanta navegação por teclado, foco adequado em modais, identificação acessível dos controles e informações compreensíveis nos gráficos.
- Faça mudanças pequenas, justificadas e compatíveis com a demonstração estática.

## Segurança e autorização

- Não inclua dados financeiros reais, credenciais, tokens ou outros segredos no repositório, exemplos, testes ou documentação.
- Use apenas dados fictícios e mantenha explícitas as limitações do armazenamento local.
- Não faça commits, pushes, deploys ou ações destrutivas sem autorização explícita do usuário para a ação correspondente.
- Não publique nem envie arquivos a serviços externos como consequência automática de uma alteração local.

## Verificação e comunicação

- Execute verificações e testes adequados ao tipo e ao risco da alteração. Para documentação, confira conteúdo, referências, escopo e arquivos alterados.
- Para mudanças funcionais, verifique sintaxe, cenários afetados, regressões e falhas relevantes; use os critérios de `REQUISITOS.md` como referência.
- Verifique acessibilidade e responsividade em navegador quando a alteração afetar a interface. Não trate análise estática como teste visual.
- Não afirme que uma operação foi concluída sem verificar seu resultado. Informe o que foi testado, o resultado e qualquer limitação ou verificação pendente.
- Documente decisões técnicas, justificativas e impactos relevantes. Mantenha requisitos e estado de implementação atualizados, sem marcar pendências como concluídas sem evidência.
- Ao encerrar, informe os arquivos criados ou modificados e as verificações realizadas.

## Autonomia e publicação na conta correta

- Prossiga autonomamente com leituras no projeto, verificações, testes não destrutivos e ajustes necessários dentro do escopo autorizado. Não solicite novamente autorizações já concedidas na conversa; respeite as permissões obrigatórias do ambiente.
- A primeira publicação autorizada destina-se exclusivamente ao repositório público `michelfiquene1-cmyk/gestor-financeiro`, na branch `main`. Perfil pessoal: https://github.com/michelfiquene1-cmyk.
- Antes de criar o primeiro commit ou publicar, verifique a identidade realmente autenticada no GitHub. Ela deve ser exatamente `michelfiquene1-cmyk`. Nome e e-mail configurados no Git não comprovam essa identidade.
- Se a autenticação estiver ausente, incorreta ou não puder ser confirmada, interrompa a publicação e oriente o usuário a autenticar a conta correta. Nunca peça senhas ou tokens no chat, nem os exponha em comandos, logs ou arquivos.
- A autorização da primeira publicação abrange somente o primeiro commit, a criação do repositório público indicado, a configuração de `origin` e o primeiro push, depois de satisfeitas as verificações. Ela não autoriza commits ou pushes posteriores.
- Se o repositório remoto já existir, não sobrescreva seu conteúdo sem confirmação específica. Não use push forçado.
- Verifique conta, proprietário, nome, visibilidade, branch, commit remoto e arquivos publicados antes de declarar sucesso. Não publique no Netlify sem nova autorização específica.

## Explicação das permissões

- Antes de solicitar permissão, explique em português brasileiro e linguagem simples: o comando ou ação, sua finalidade, os arquivos/dados/contas afetados, os riscos, se pode ser desfeito e a recomendação **PERMITIR**, **CONFERIR ANTES** ou **NÃO PERMITIR**.
- Explique que **Allow Once** permite aquela execução solicitada, sem conceder autorização permanente para futuras ações. Permissões técnicas não ampliam o escopo autorizado pelo usuário.
- Antecipe operações previstas quando possível. Não afirme controlar as janelas automáticas de autorização do Codex ou VS Code.
- Peça autorização específica antes de apagar arquivos ou executar comandos destrutivos, instalar programas/dependências, acessar arquivos fora do projeto, modificar segurança/permissões, enviar dados não relacionados à publicação, publicar em outra conta ou no Netlify e executar novos commits/pushes fora da primeira publicação autorizada.
- Se houver bloqueio de autenticação ou permissão, informe a ação bloqueada e a causa observada; aguarde a intervenção necessária sem contornar a restrição.
