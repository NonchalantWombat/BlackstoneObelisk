const ADVENTURE = {
  packId: "blackstone-obelisk-5e.blackstone-obelisk",
  adventureId: "ypAm8SL4pf6JDmpG",
  get adventureUuid() {
    return `Compendium.${this.packId}.Adventure.${this.adventureId}`;
  },

  description: [
    "<blockquote><p><em>The Blackstone Obelisk casts a long shadow over your party...</em></p></blockquote>",
    "<p>This homemade, three-session adventure sees 4 players at Level 18 ascending through increasingly difficult and chaotic challenge rooms on their way to the top of an Arch Lich&rsquo;s private sanctum. This is designed to be run in a single adventuring day (no long rests), and with appropriately high level gear and equipment. It also assumes some level of veteran status in your players; while it can be run with new players, effective use of high level abilities and action economy is necessary to survive the tower, so I recommend running this adventure with no more than two people who are new to D&amp;D.</p>"
  ].join(""),

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
    },
    customizeJoin: {
      label: "Customize World Details",
      default: true, // Checked by default so it always sets your custom description
      handler: customizeJoin,
      background: "modules/blackstone-obelisk-5e/assets/login-screen.webp" // Optional join screen background
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

async function customizeJoin(adventure, option) {
  const worldData = {
    action: "editWorld",
    id: game.world.id,
    description: ADVENTURE.description
  };
  // Only overwrite the login background if you specified one above
  if ( option.background ) worldData.background = option.background;

  await foundry.utils.fetchJsonWithTimeout(foundry.utils.getRoute("setup"), {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(worldData)
  });
  game.world.updateSource(worldData);
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