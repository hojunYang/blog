# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Metrics setup (likes/views)

The project now supports deduplicated likes/views with Postgres.

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `VISITOR_HASH_SECRET`.
2. Run SQL in `sql/metrics.sql` on your Postgres instance.
3. Start app with `npm run dev`.

## Markdown table of contents

Add `<!-- toc -->` to a Markdown post to render a linked table of contents at that position. The table of contents includes `##`, `###`, and `####` headings.

```md
<!-- toc -->

## 첫 번째 섹션
내용

### 하위 섹션
내용
```

## Runtime Markdown updates

Posts are read from `src/lib/server/content/posts` at request time, so editing a Markdown file in this existing folder does not require a build or PM2 restart. After adding or changing a `.md` file, its changes appear on the next page request.

Images and PDFs work the same way. Put them under `src/lib/server/content/posts/images` and reference them in Markdown with `/post-images/`:

```md
![이미지 설명](/post-images/my-image.png)
[PDF 다운로드](/post-images/documents/guide.pdf)
```

Adding or replacing these files is reflected without a build or PM2 restart.

## Markdown math

Use `$...$` for inline math and `$$...$$` for display math. The `\(...\)` and `\[...\]` forms also work.

```md
문장 안에서는 $\sigma_p^2$ 처럼 작성한다.

\[
\sigma_p^2 = w^2\sigma_1^2 + (1-w)^2\sigma_2^2 + 2w(1-w)\sigma_1\sigma_2\rho_{12}
\]
```

## Secret posts

Markdown posts live under `src/lib/server/content/posts`, so post source files are not served as static assets.

Add `secret: true` and `password` to a post frontmatter to hide it from public lists and the home graph. It remains accessible by direct URL and requires the password on every visit.

```md
---
id: "secret-01"
title: "비밀 글 제목"
excerpt: "목록에는 표시되지 않음"
date: "2026-05-30"
author: "양호준"
tags: ["Private"]
secret: true
password: "원하는비밀번호"
---
```
