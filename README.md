# Quran Pure

A project dedicated to presenting the Quran in its purest form — nothing but God's word. Based on the [Tanzil](https://tanzil.net) corpus, we offer several editions tailored to different levels of familiarity with the Arabic scripture, stripped of surah names, introductions, and any human additions.

## Editions

### Vocalized (for beginners)

The fully vocalized text includes all diacritical marks and vowel signs (tashkeel). This edition is intended for those beginning their journey with the Arabic Quran, making the pronunciation and reading as accessible as possible.

### Consonantal (for experienced readers)

The consonantal text preserves the dotted letter forms but removes vocalization marks. This edition is for readers who are comfortable with Arabic and no longer rely on vowel signs to read fluently.

### Rasm (for those who master roots and morphology)

The rasm — the skeletal, undotted script — comes closest to the earliest known manuscripts. This is the form in which the Quran was first written down. Reading it requires deep knowledge of Arabic roots, morphology, and the scripture itself. From what we know today, this is the closest representation of the original scripture.

### Numbered and Unnumbered

Each edition is available in both a numbered and an unnumbered variant. The verse numbers follow the Hafs numbering system, which is what the Tanzil corpus uses. We chose this system to ensure verification uniformity — when comparing our PDFs against tanzil.net, the numbering must match. Alternative counting methods exist and may well be legitimate, but the Hafs system is widely used and serves as a practical, commonly understood basis for locating and communicating about specific verses.

The numbering itself is not part of the original skeletal text. It is a navigational aid, nothing more. Likewise, the page layout and typographic choices in our PDFs are our own design decisions made for visual ease — they are one way to display the Quran, not the only way.

## Our Philosophy

The vocalized and consonantal editions serve to make access to the scripture easier, but they are human aids layered onto the text. The rasm is what ultimately *is* the scripture as it has reached us from the earliest sources. Every edition we produce aims to contain nothing but God's word — no title pages, no commentary, no publisher notices, no human additions of any kind.

## On Verification and Authenticity

We do not claim perfection. The process of generating PDFs from a digital can introduce formatting errors. This is why we continuously work to verify the authenticity of every edition we publish, and why we provide our own **Quran Verification Tool** so that anyone can — and we believe should — verify the text themselves.

The verification tool allows you to visually compare our PDF editions against the online text at [tanzil.net](https://tanzil.net) using screenshot snippets and pixel-level analysis. It highlights exact matches, differences, and discrepancies in a color-coded overlay, minimizing the potential for human error in the verification process.

We continuously perform this verification ourselves, but we believe every believer should take this responsibility into their own hands. We do not ask anyone to trust our output blindly.

### Using the Verification Tool

The tool is a web application built with React and TypeScript. To run it locally:

```bash
cd quran-verification-tool
npm install
npm run dev
```

1. Load one of the Quran PDF editions
2. Take a screenshot snippet from the corresponding text at [tanzil.net](https://tanzil.net)
3. Upload the snippet and position it over the matching passage in the PDF
4. Enable verification mode to see the color-coded comparison:
   - **Purple** — matching text (present in both PDF and snippet)
   - **Blue** — text only in the PDF
   - **Red** — text only in the snippet

## Source Text and Tanzil Notice

Our text is derived from the [Tanzil Project](https://tanzil.net) corpus. We include their copyright notice here in full, as required by their terms. We have chosen not to include it within the PDF editions themselves, for two reasons:

1. **The word of God should stand on its own.** We believe a book containing nothing but scripture should contain nothing but scripture — no human notices, no copyright blocks, no additions of any kind.

2. **The notice states the text is "highly verified and continuously monitored."** This is true of Tanzil's own corpus, but placing that statement inside our PDF could imply that our formatted edition carries the same guarantee. It does not. Formatting, typesetting, and PDF generation are separate processes that could introduce errors — which is precisely why we provide the verification tool.

We understand and respect Tanzil's intention: the scripture must not be modified. This is a principle we share absolutely and without reservation. We have not altered the text in any way.

Tanzil's terms require that their copyright notice be included in "all verbatim copies of the text" and "reproduced appropriately in all files derived from or containing substantial portion of this text." We comply with this by including the full notice in this README, which is part of the same repository and distribution as the PDF files. The repository as a whole — not each file in isolation — constitutes the distributed work, and the notice is prominently placed within it. We clearly attribute the Tanzil Project as the source and link to [tanzil.net](https://tanzil.net) for users to track updates, as their terms require. Additionally, we go beyond their terms by providing a dedicated verification tool so that anyone can confirm the text's integrity against Tanzil's own corpus with minimized potential for human error.

That said, we hold the conviction that the word of God ultimately belongs to God alone and cannot be owned or restricted by any human being. The Quran itself speaks to this:

> **"Indeed, it is We who sent down the reminder, and indeed, We will be its guardian."**
> — Quran 15:9

> **"Indeed, We sent down to you the Book for the people in truth."**
> — Quran 39:41

The scripture was sent down for all people, and God Himself is its guardian. We believe no human entity can hold ultimate authority over its distribution. While we appreciate and honor the valuable work Tanzil has done in digitizing and verifying the text — and we fully share their commitment to preserving its integrity — our highest obligation is to God and to making His word accessible in its purest form, unencumbered by human additions of any kind.

The full Tanzil notice follows below.

---

### Tanzil Project — Copyright and Terms of Use

```
Tanzil Quran Text (Simple, Version 1.1)
Copyright (C) 2007-2026 Tanzil Project
License: Creative Commons Attribution 3.0

This copy of the Quran text is carefully produced, highly
verified and continuously monitored by a group of specialists
at Tanzil Project.

TERMS OF USE:

- Permission is granted to copy and distribute verbatim copies
  of this text, but CHANGING IT IS NOT ALLOWED.

- This Quran text can be used in any website or application,
  provided that its source (Tanzil Project) is clearly indicated,
  and a link is made to tanzil.net to enable users to keep
  track of changes.

- This copyright notice shall be included in all verbatim copies
  of the text, and shall be reproduced appropriately in all files
  derived from or containing substantial portion of this text.

Please check updates at: http://tanzil.net/updates/
```

```
Tanzil Quran Text (Simple Clean, Version 1.1)
Copyright (C) 2007-2026 Tanzil Project
License: Creative Commons Attribution 3.0

This copy of the Quran text is carefully produced, highly
verified and continuously monitored by a group of specialists
at Tanzil Project.

TERMS OF USE:

- Permission is granted to copy and distribute verbatim copies
  of this text, but CHANGING IT IS NOT ALLOWED.

- This Quran text can be used in any website or application,
  provided that its source (Tanzil Project) is clearly indicated,
  and a link is made to tanzil.net to enable users to keep
  track of changes.

- This copyright notice shall be included in all verbatim copies
  of the text, and shall be reproduced appropriately in all files
  derived from or containing substantial portion of this text.

Please check updates at: http://tanzil.net/updates/
```

---

## Repository Structure

```
quran-pdf/              Quran editions in PDF format
quran-verification-tool/   Web-based visual verification tool
```

## License

The Quran text is sourced from the Tanzil Project under the [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/) license. See the Tanzil notice above for terms of use.

The verification tool and all other project code are provided for the benefit of anyone seeking to verify and engage with the scripture.
