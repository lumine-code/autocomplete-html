let getSuggestionsWithTreeSitter;
let getSuggestionsWithTextMate;

function ensureProviders() {
  if (!getSuggestionsWithTreeSitter) {
    getSuggestionsWithTreeSitter = require("./tree-sitter-provider");
    getSuggestionsWithTextMate = require("./text-mate-provider");
  }
}

const provider = {
  scopeSelector: ".text.html",
  disableForScopeSelector: ".text.html .comment",
  filterSuggestions: true,

  // Domain-expert tier: authoritative for HTML, and silent everywhere else.
  // See "Ranking" in autocomplete's `docs/autocomplete.provider.md`; left
  // unset, the default of 1 put these below the language server, snippets and
  // paths inside the markup this package exists to complete.
  suggestionPriority: 4,
  inclusionPriority: 2,

  getSuggestions(request) {
    try {
      ensureProviders();
      let languageMode = request.editor.getBuffer().getLanguageMode();
      // Ask what the language mode can do, which is the idiom bracket-matcher
      // uses too. This used to compare `constructor.name` against a class name
      // that had not existed for a long time, so every buffer took the TextMate
      // branch and the Tree-sitter provider rotted unnoticed.
      if (languageMode.getSyntaxNodeAtPosition) {
        return getSuggestionsWithTreeSitter(request);
      } else {
        return getSuggestionsWithTextMate(request);
      }
    } catch (err) {
      // We avoid creating any actual error messages, as this is intended to fix
      // the case when providing completions for EJS that multiple continious
      // errors are created rapidly.
      // https://github.com/lumine-code/lumine/issues/649
      console.error(err);
      return [];
    }
  },

  onDidInsertSuggestion({ editor, suggestion }) {
    if (suggestion.type === "attribute") {
      setTimeout(this.triggerAutocomplete.bind(this, editor), 1);
    }
  },

  triggerAutocomplete(editor) {
    lumine.commands.dispatch(editor.getElement(), "autocomplete:activate", {
      activatedManually: false,
    });
  },
};

module.exports = {
  activate() {},
  provideAutocomplete() {
    return provider;
  },
};
