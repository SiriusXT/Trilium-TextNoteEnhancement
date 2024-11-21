

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
        this.$widget = $('');
        return this.$widget;
    }

    async refreshWithNote(note) {
        if (this.note.type === 'text') {
            let textEditor = await this.getEditor();
            this.textEditor = textEditor;
            if (textEditor !== null) {
                const input = $(`.note-split[data-ntx-id="${this.noteContext.ntxId}"]`).find('.note-detail-editable-text-editor');
                input.on('keydown', (event) => {
                    if (event.altKey && event.key === 'f') {
                        const selectedText = this.getSelectedText();

                            event.stopImmediatePropagation();
                            if (selectedText !== '') {
                                if(this.isFullParagraphSelected()){
                                    this.inserMath(selectedText);}
                                else{
                                    this.inserInlineMath(selectedText);}
                            }
                        
                    }
                });

            }
        }
    }
    getSelectedText() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return '';
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        return selectedText;
    }

    delSelection() {
        const selection = this.textEditor.model.document.selection;
        const writer = this.textEditor.model.change(writer => {
            writer.remove(selection.getFirstRange());
        });
    }
    isFullParagraphSelected() {
        const selection = this.textEditor.model.document.selection;
        const range = selection.getFirstRange();
        if (!range) return false;
        const startParent = range.start.parent;
        const endParent = range.end.parent;
        if (startParent !== endParent) return true; //The paragraph selected by triple-click spans two paragraphs
        return range.start.offset === 0 && range.end.offset === startParent.maxOffset;
    }
    inserInlineMath(text) {
        text = text.replace(/^\${2,}|\${2,}$/g, "");
        text = text.replace(/^[$]+|[$]+$/g, "");
this.textEditor.model.change(writer => {
        this.delSelection();
        const modelFragment = this.textEditor.data.processor.toView(
            `<span class="math-tex">\\(${text}\\)</span>`
        );
        const modelElement = this.textEditor.data.toModel(modelFragment);
        this.textEditor.model.insertContent(modelElement);
     });
    }
    inserMath(text) {console.log(111);
        this.textEditor.model.change(writer => {
            this.delSelection();
        const modelFragment = this.textEditor.data.processor.toView(
            `<span class="math-tex">\\[${text}\\]</span>`
        );
        const modelElement = this.textEditor.data.toModel(modelFragment);
        this.textEditor.model.insertContent(modelElement);
            });
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

