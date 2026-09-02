let provideSuggestions;

function ensureProvider() {
  provideSuggestions ??= require("./tree-sitter-provider");
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
      ensureProvider();
      return provideSuggestions(request);
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
