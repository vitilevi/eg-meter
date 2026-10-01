# eg-meter

Calculadora de mistura etanol + gasolina para quem roda com E40, E50, E85, E100 ou qualquer outro blend.
Você escolhe a gasolina (comum ou premium), a mistura alvo e o total de litros. O app mostra quantos
litros de cada combustível colocar, já descontando o etanol anidro que vem na gasolina.

Produção: https://egmeter.victorfaria.dev

## Conta

```
G + A = V             (volume total)
g·G + A = t·V         (etanol da gasolina + etanol da bomba = alvo)
⇒ G = V·(1 − t)/(1 − g)
```

- `g`: etanol anidro já presente na gasolina. Comum/aditivada 32% (CNPE, desde ago/2026), premium 25%.
- O etanol hidratado da bomba é considerado 100% etanol.
- Resultado em litros inteiros, que é como se pede no posto: `G` é arredondado e o etanol é `V − G`, então as
  parcelas sempre somam `V`. Se o arredondamento desloca a mistura, o app mostra a real (ex.: E50,7).

Os teores ficam em `src/features/calculator/lib/blend.ts` (`FUELS`). Se a lei mudar, é só mudar ali.

## Stack

Next 16 (App Router, estático), Tailwind 4, Biome + ESLint, Vitest. A paleta é a mesma do portfólio.

```bash
nvm use            # Node 24
pnpm install
pnpm dev
pnpm verify        # typecheck + lint + testes
```

## Analytics

- **Vercel Analytics**: sem cookies, sempre ativo. Ative em *Project → Analytics* na Vercel.
- **Firebase Analytics**: o SDK só é baixado depois do aceite no banner. A escolha fica no
  `localStorage` (`egm-analytics-consent`) e pode ser revista em “Privacidade”, no rodapé.
- Eventos: `fuel_select`, `blend_select`, `calculate` (após 1,5 s sem digitar), `click_linkedin`,
  `click_github`, `click_portfolio`, `theme_toggle`. No `next dev` nada é enviado: os eventos só aparecem no console.
- A config web do Firebase fica em `src/features/analytics/lib/firebase.ts`. Ela é pública por natureza.
  Inclua `egmeter.victorfaria.dev` nos domínios autorizados do projeto Firebase.

## PWA

- `src/app/manifest.ts`, `public/sw.js` (offline após a primeira visita, registrado só em produção).
- Ícones gerados a partir de `public/icons/icon.svg` com `pnpm icons`.
