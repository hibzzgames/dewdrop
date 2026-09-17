# dewdrop
Dewdrop is a typescript only static webpage building framework with runtime hydration.

This page just has a bunch of my thoughts dumped here. I'll organize it better later.

## Getting started
- Install `bun` (from https://bun.com/)
- Fork and clone this repo
- Run `bun install`
- Start editing with `src/pages.ts` file to build your site

## Commands
- Running `bun dewdrop` will be your one stop shop for working with the dewdrop
  - I recommend aliasing `dewdrop` -> `bun dewdrop`
  - In the below sections when I say `dewdrop`, I mean `bun dewdrop`
- `dewdrop run dev` will launch the project locally with a watch flag, so saves are loaded instantaneously
- `dewdrop run debug` will launch a browser build with a breakpoint automatically placed on the first line of code
- `dewdrop run build` will create the optimized distributable in the `dist/` folder
- (Coming soon) `dewdrop update` will check for updates and upgrade dewdrop to the latest version

## Package dependencies
- [Linkedom](https://www.npmjs.com/package/linkedom): Build-time DOM used in static site generation
- [@clack/prompts](https://www.npmjs.com/package/@clack/prompts): Used by the dewdrop CLI tool

### Thoughts on dependencies
- I think I'll eventually be removing `@clack/prompts` and will be rolling out my own version of it under `dewdrop/shell.ts`. While @clack/prompts adds a lot of value, it's not most comfortable for me to use in terms of customization options.
- Bun itself as dependency is something I feel very conflicted about. It does a lot and it is quite useful when I first started working on this project. But it's now acquired by Anthropic and it's vibe coded like crazy with its rust port, so I hate what it stands for and I don't want to use it morally. But 
I'm so tired man. I'm a gamedev and I want to build games. This project was meant to be one month tangent to improve the [hibzz.games](https://hibzz.games) website, and like 9 months later I'm still noodling with this. Replacing Bun would be soooo much work :(

## Known Issues
- The computed CSS rules and selectors aren't sorted by priority yet and can cause issues where a ":hover" has a has a higher priority than ":active" leading to unexpected visual results

## Nice to haves
- Macros for defining dynamic components: Currently it's a very specific format, including a specifically formatted comment (`/*@__PURE__*/`) and `import.meta.path`, which feels super boilerplate-y. Macros to reduce the boilerplate would be great
- Better rebuild tech: When running in dev mode, when a file is saved, it rebuilds the entire site which is quite wasteful. Being smart about understanding what files have been affected by the change, marking them dirty and only rebuilding those when a dirty page is visited would be nice. This does involve fighting Bun's ESM module cache mechanism a ton and could be a heavier task that expected
- Asset tracking: Currently we copy everything from the 'assets/' folder to the 'dist/' folder but we can be smart and track a list of assets our components use and only copy that. This way we can have a lot more "working" assets in the 'assets/' folder but only the ones used is distributed
- Better Style Intellisense: The [CssType](https://www.npmjs.com/package/csstype) package seems like an interesting solution but I just need spend a little time to make the API a bit more intuitive for the users and not add unnecessary function


