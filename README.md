# mirelo-studio-smart-agent

Named knowledge bases for the [Mirelo Studio](https://mirelo.ai/studio) assistant.

This is a showcase of how that feature could look. It is not a production part of Studio. Your notes stay in the browser, and a selected base is sent with the assistant prompt.

## Features

<h3><img src="resources/feature-add.svg" width="22" height="22" alt="" align="absmiddle"> &nbsp;&nbsp;Adding knowledge bases</h3>

Create knowledge bases that can be used across projects:

&emsp;&emsp;<img src="resources/check.svg" width="18" height="15" alt="" align="absmiddle">&nbsp;General description and instructions about the project

&emsp;&emsp;<img src="resources/check.svg" width="18" height="15" alt="" align="absmiddle">&nbsp;Specific descriptions for SFX, speech, and music

&emsp;&emsp;<img src="resources/check.svg" width="18" height="15" alt="" align="absmiddle">&nbsp;Get inspiration: build prompts from ready-made components for SFX, speech, and music

<p><img src="resources/create-kb-window.gif" width="100%" alt="Adding a knowledge base"></p>

<h3><img src="resources/feature-chat.svg" width="22" height="22" alt="" align="absmiddle"> &nbsp;&nbsp;Create knowledge bases directly from Chat</h3>

Conveniently create knowledge bases on the go:

&emsp;&emsp;<img src="resources/check.svg" width="18" height="15" alt="" align="absmiddle">&nbsp;Create knowledge bases while chatting with the Mirelo Assistant

&emsp;&emsp;<img src="resources/check.svg" width="18" height="15" alt="" align="absmiddle">&nbsp;View knowledge base contents while chatting with the Assistant

<p><img src="resources/create-kb-from-chat-window.gif" width="100%" alt="Creating a knowledge base from chat"></p>

<h3><img src="resources/feature-sound.svg" width="22" height="22" alt="" align="absmiddle"> &nbsp;&nbsp;Produce consistent sounds</h3>

&emsp;&emsp;<img src="resources/check.svg" width="18" height="15" alt="" align="absmiddle">&nbsp;Select the knowledge base in your chats with the Mirelo Assistant

&emsp;&emsp;<img src="resources/check.svg" width="18" height="15" alt="" align="absmiddle">&nbsp;The Mirelo Assistant will use the information as always-on context for consistent sound generation

<p><img src="resources/use-kb-in-chat-window.gif" width="100%" alt="Using a knowledge base in Mirelo Assistant chat"></p>

## Install

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose **Load unpacked** and select the `extension` folder in this repo.
4. Open Mirelo Studio and sign in.

If you change the extension, click **Reload** on its card, then refresh Studio.

## Implementation

The extension runs on `https://mirelo.ai/studio`. Knowledge opens on the current Studio URL with the `#knowledge` hash, so a refresh stays on a real page.

Notes are kept in `localStorage`. When a base is selected, a send places this at the start of the draft and then lets Studio send it:

```
[Knowledge base: Name]
general context

Speech:
how the voice should feel
Attributes: Warm, Calm

Sound & Music:
Attributes: Ambient, Gentle
---
your prompt
```

Studio sends the editor's own draft, so the notes are written through that editor. The extension does not make its own assistant request, and it does not read sign-in tokens.

It finds the assistant from the input, the composer, and the send button. A Studio update that renames those will need a matching change here.

## Technical Considerations

A Chrome extension is the approach in this repo. It stays in place across reloads, can write into the assistant draft on the live page, and keeps the notes in the browser. The `extension` folder loads on its own, with no extra tool required.

Other options:

- **Userscript.** Same kind of page update, but only for people who already run something like Tampermonkey.
- **Bookmarklet.** Drops out on the first navigation inside Studio, so the sidebar item and the selector would not stay.
- **Embedding Studio in another page.** Blocked. The site sends `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- **A standalone copy of the Studio screens.** Can show the controls, and cannot send through the real assistant.
- **A local proxy that rewrites the site.** Has to deal with sign-in, streaming, and TLS, and does not improve on the extension.
