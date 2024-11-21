const zoteroJsonFilePath = 'D:/Documents/Zotero/export/zotero.json'; // The file path of the monitored zotero file
const showFields = ['creators', 'date', 'proceedingsTitle', 'publicationTitle']


// ------------------------------------------------------
const fs = window.require('fs');

// Make sure the file exists
if (!fs.existsSync(zoteroJsonFilePath)) {
  api.showMessage("No bib files found in the specified path!");
  return;
}
let zoteroData;
let canUpdata = true;
let timeOutId;

function updateData() {
  zoteroData = JSON.parse(fs.readFileSync(zoteroJsonFilePath, 'utf-8'));
  zoteroData = zoteroData['items'];
    console.log(zoteroData);
  for (const index in zoteroData) {
    if (showFields.includes('creators')){
      if (zoteroData[index].creators) {
        zoteroData[index].creators = zoteroData[index].creators
          .map(creator => {
            const firstName = creator.firstName || '';
            const lastName = creator.lastName || '';
            return `${firstName} ${lastName}`.trim(); 
          })
          .filter(creator => creator !== '') 
          .join('; ');
      }
    }
    // for (const field of showFields){
    //   if (zoteroData[index][field] === undefined){
    //     zoteroData[index][field] = 'N/A'
    //   }
    // }
    
  }
}
updateData()
fs.watch(zoteroJsonFilePath, (eventType, filename) => {
  if (filename && eventType === 'change') {
    if (!canUpdata) { return; }
    else {
      canUpdata = false;
      clearTimeout(timeOutId);
      timeOutId = setTimeout(() => {
        canUpdata = true;
          updateData();
      }, 2000);
    }
    console.log(`File changed: ${filename}`);

    
  }
});


const styles = `
    .autocomplete-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .autocomplete-input-box {
      background: var(--modal-background-color);
      padding: 20px;
      border-radius: 8px;
      max-width: 90%; 
      width: 800px;
      box-sizing: border-box;
      box-shadow: 0 4px 10px var(--main-border-color);
    }
    .autocomplete-text-input {
      width: 100%;
      padding: 5px;
      margin-bottom: 10px;
      border: 1px solid var(--main-border-color);
      border-radius: 4px;
      background: var(--input-background-color);
      box-sizing: border-box;
    }
    .autocomplete-suggestions-container:has(*)  {
      max-height: 500px;
      overflow-y: auto;
      border: 1px solid var(--main-border-color);
      border-radius: 4px;
      background: var(--modal-background-color);
    }
    .autocomplete-suggestion-item {
      padding: 5px;
      cursor: pointer;
      transition: background 0.2s;
      word-wrap: break-word; 
    }
    .autocomplete-suggestion-item.active {
      background: var(--active-item-background-color);
    }
      .autocomplete-suggestion-item:hover {
      background: var(--active-item-background-color);
    }`
let style = document.createElement('style');
style.innerHTML = styles;
document.head.appendChild(style);


module.exports = class extends api.NoteContextAwareWidget {
  get position() {
    return 50;
  }
  static get parentWidget() {
    return 'note-detail-pane';
  }
  constructor() {
    super();
  }
  isEnabled() {
    return super.isEnabled()
      && this.note.type === 'text';
  }
  doRender() {
    this.$widget = $(`<div class="autocomplete-overlay">
    <div class="autocomplete-input-box">
      <input type="text" class="autocomplete-text-input" placeholder="Search by Title or Citation Key..." />
      <div class="autocomplete-suggestions-container"></div>
    </div>
  </div>`);
    this.activeIndex = -1;
    this.currentSuggestions = [];
    this.autocompleteInputBox = this.$widget.find('.autocomplete-input-box')
    this.autocompleteTextInput = this.$widget.find('.autocomplete-text-input')
    this.autocompleteSuggestionsContainer = this.$widget.find('.autocomplete-suggestions-container')
    return this.$widget;
  }

  closeOverlay() {
    this.$widget.css('display', 'none');
    this.autocompleteTextInput.val('');
    this.autocompleteSuggestionsContainer.empty();
    this.activeIndex = -1;
  }

  renderSuggestions() {
    this.autocompleteSuggestionsContainer.empty();

    if (this.currentSuggestions.length === 0) {
      this.autocompleteSuggestionsContainer.append('<div class="autocomplete-suggestion-item">No results found</div>');
      this.activeIndex = -1;
      return;
    }

    this.currentSuggestions.forEach((element, index) => {
      // const { title, author } = zoteroData[key];
      const $suggestion = $(`<div class="autocomplete-suggestion-item">${element.title} <div style='font-size:12px'>${element.creators}<div></div>`);
      if (index === this.activeIndex) {
        $suggestion.addClass('active');
      }
      $suggestion.on('click', () => {
        this.closeOverlay();
        this.inserZotero(element);
      });
      this.autocompleteSuggestionsContainer.append($suggestion);
    });
  }
  selectSuggestions(direction = 1) {
    this.autocompleteSuggestionsContainer.find('.autocomplete-suggestion-item.active').removeClass('active');
    const $selected = this.autocompleteSuggestionsContainer.find('.autocomplete-suggestion-item').eq(this.activeIndex);
    $selected.addClass('active');

    const containerRect = this.autocompleteSuggestionsContainer[0].getBoundingClientRect();
    const selectedRect = $selected[0].getBoundingClientRect();

    // Check if $selected is within container viewport
    const isVisible = selectedRect.top >= containerRect.top && selectedRect.bottom <= containerRect.bottom;

    if (!isVisible) {
      if (direction >= 1) {
        $selected[0].scrollIntoView({
          block: "end",
          behavior: "instant"
        });
      } else {
        $selected[0].scrollIntoView({
          block: "start",
          behavior: "instant"
        });
      }

    }

  }

  async refreshWithNote(note) {
    if (this.note.type === 'text') {
      let textEditor = await this.getEditor();
      this.textEditor = textEditor;
      if (textEditor !== null) {
        const editor = $(`.note-split[data-ntx-id="${this.noteContext.ntxId}"]`).find('.note-detail-editable-text-editor');
        editor.on('keydown', (event) => {
          if (event.altKey && event.key === 'z') {
            event.preventDefault();
            event.stopImmediatePropagation(); // Prevent being monitored multiple times. This is a trilium bug. The reason has not yet been found.
            this.$widget.css('display', 'flex');
            this.autocompleteTextInput.focus();
          }
        });
        this.$widget.off('keydown');
        this.$widget.on('keydown', (event) => {
          if (event.key === 'Escape') {
            this.closeOverlay();
          } else if (event.key === 'ArrowDown') {
            this.activeIndex = (this.activeIndex + 1) % this.currentSuggestions.length;
            this.selectSuggestions(1);
          } else if (event.key === 'ArrowUp') {
            this.activeIndex = (this.activeIndex - 1 + this.currentSuggestions.length) % this.currentSuggestions.length;
            this.selectSuggestions(-1);
          } else if (event.key === 'Enter' && this.activeIndex >= 0) {
            const selectedKey = this.currentSuggestions[this.activeIndex];
            this.closeOverlay();
            this.inserZotero(selectedKey);
          }
        });
        this.$widget.on('click', (event) => {
          if (event.target === event.currentTarget) {
            this.closeOverlay();
          }
        });

        this.autocompleteTextInput.off('input');
        this.autocompleteTextInput.on('input', () => {
          const query = this.autocompleteTextInput.val().toLowerCase();
          this.currentSuggestions = zoteroData.filter(item => item.title.toLowerCase().includes(query));

          this.activeIndex = 0;
          this.renderSuggestions();
        });
      }
    }
  }
  inserZotero(item) {
    let info_str = '';
    for (const field of showFields){
      if (item[field] !== undefined && item[field] !== ''){
        info_str+=`<li>${field}: ${item[field]}</li>`;
      }
    }
    
// 
// zotero://open-pdf/library/items/
    const modelFragment = this.textEditor.data.processor.toView(
      `<blockquote><p><a href="zotero://select/library/items/${item.key}">${item['title']}</a></p>${info_str}</blockquote>`
    );
    const modelElement = this.textEditor.data.toModel(modelFragment);
    this.textEditor.model.insertContent(modelElement);
  }

  async getEditor() {
    return new Promise((resolve, reject) => {
      const maxRetries = 5;
      const delay = 200;
      let attempts = 0;

      const intervalId = setInterval(async () => {
        if (attempts >= maxRetries) {
          clearInterval(intervalId);
          resolve(null);
          return;
        }
        const editor = await this.noteContext.getTextEditor();
        if (editor !== null) {
          clearInterval(intervalId);
          resolve(editor);
        } else {
          attempts++;
        }
      }, delay);
    });
  }
}

