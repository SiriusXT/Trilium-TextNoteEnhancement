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
                    if (event.altKey && event.key === 'h') {
                        event.stopImmediatePropagation();
                        const selectedText = this.getSelectedText();
                        if (selectedText !== '') {
                            if (this.haveBg()){
                                this.insertNormalAndSelect(selectedText);                      
                            }else{
                                this.inserYellowBg(selectedText);
                            }
                        }else{
                            this.insertNormal(' ')
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
    
    inserYellowBg(text) {
        console.log(111)
        this.textEditor.model.change(writer => {
            this.delSelection();
            const insertPosition = this.textEditor.model.document.selection.getFirstPosition();
            const modelFragment = this.textEditor.data.processor.toView(
                `<span style="background-color:hsl(60, 75%, 60%);">${text}</span>`
            );
            const modelElement = this.textEditor.data.toModel(modelFragment);
            this.textEditor.model.insertContent(modelElement);
            const newRange = writer.createRange(
                insertPosition,
                insertPosition.getShiftedBy(text.length)
            );
            const newSelection = writer.createSelection(newRange);
            writer.setSelection(newSelection);
        });
        
    }
    haveBg() {
        const selection = this.textEditor.model.document.selection;
        const attributes = Array.from(selection.getAttributes());
        console.log(selection,attributes)
        const haveBg = attributes.some(([key, value]) => key === 'fontBackgroundColor');
        return haveBg;
    }
    insertNormalAndSelect(text) {
        console.log(222)
        this.textEditor.model.change(writer => {
            this.delSelection();
            const insertPosition = this.textEditor.model.document.selection.getFirstPosition();
            const subscriptText = writer.createText(text);
            writer.insert(subscriptText, insertPosition);
            const newRange = writer.createRange(
                insertPosition,
                insertPosition.getShiftedBy(text.length)
            );
            const newSelection = writer.createSelection(newRange);
            writer.setSelection(newSelection);
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

