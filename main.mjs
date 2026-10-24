const ADVENTURE = {
  packId: "blackstone-obelisk-5e.blackstone-obelisk",
  adventureId: "ypAm8SL4pf6JDmpG",
  get adventureUuid() {
    return `Compendium.${this.packId}.Adventure.${this.adventureId}`;
  },
  importOptions: {
    activateScene: {
      label: "Activate Initial Scene",
      default: true,
      handler: activateScene,
      documentId: "wTr4gtU2sIGskNMk"
    },
    displayJournal: {
      label: "Display Getting Started Journal",
      default: true,
      handler: displayJournal,
      documentId: "kNc5a108Q3UEKRNF"
    }
  }
};

/* -------------------------------------------- */
/*  Import Option Handlers                      */
/* -------------------------------------------- */

async function activateScene(adventure, option) {
  const scene = game.scenes.get(option.documentId);
  return scene?.activate();
}

async function displayJournal(adventure, option) {
  const journal = game.journal.get(option.documentId);
  journal?.sheet.render(true);
}

/* -------------------------------------------- */
/*  Importer UI & Execution                     */
/* -------------------------------------------- */

function renderAdventureImporter(app, html) {
  if ( app.adventure.pack !== ADVENTURE.packId ) return;
  html.querySelector(".import-controls")?.insertAdjacentElement("afterend", formatOptions());
}

function formatOptions() {
  const section = document.createElement("section");
  section.classList.add("import-options");
  const h2 = document.createElement("h2");
  h2.classList.add("border");
  h2.append(game.i18n.localize("ADVENTURE.ImportHeaderOptions"));
  section.append(h2);

  for ( const [name, option] of Object.entries(ADVENTURE.importOptions) ) {
    const div = document.createElement("div");
    div.classList.add("form-group");
    const label = document.createElement("label");
    label.classList.add("checkbox");
    label.style.setProperty("--input-height", "1rem");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = name;
    if ( option.default ) input.checked = true;
    label.append(input, " ", option.label);
    div.append(label);
    section.append(div);
  }
  return section;
}

async function onImport(adventure, formData) {
  if ( adventure.pack !== ADVENTURE.packId ) return;
  for ( const [name, option] of Object.entries(ADVENTURE.importOptions) ) {
    if ( formData[name] && option.handler ) await option.handler(adventure, option);
  }
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

Hooks.on("ready", async () => {
  if ( !game.user.isGM ) return;

  // 1. If the adventure hasn't been imported into this world yet, pop open the Adventure Importer
  const adventureImports = game.settings.get("core", "adventureImports");
  const imported = adventureImports?.[ADVENTURE.adventureUuid];
  if ( !imported ) {
    const pack = game.packs.get(ADVENTURE.packId);
    const adventure = await pack?.getDocument(ADVENTURE.adventureId);
    adventure?.sheet.render(true);
  }

  // 2. If the world was launched using Foundry's Quick-Start feature, activate the scene & journal automatically
  const quickstart = imported?.quickstart;
  if ( quickstart?.quickstarted && !quickstart.postImport ) {
    const adventure = await fromUuid(ADVENTURE.adventureUuid);
    const { activateScene, displayJournal } = ADVENTURE.importOptions;
    await activateScene.handler(adventure, activateScene);
    await displayJournal.handler(adventure, displayJournal);
    quickstart.postImport = true;
    game.settings.set("core", "adventureImports", adventureImports);
  }
});

Hooks.on("renderAdventureImporterV2", renderAdventureImporter);
Hooks.on("importAdventure", onImport);