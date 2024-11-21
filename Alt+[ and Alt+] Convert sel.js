

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
                    if (event.altKey) {
                        const { isSubscript, isSuperscript } = this.isSubSuperScript();

                        const selectedText = this.getSelectedText();

                        if (event.key === '[') {
                            event.stopImmediatePropagation();
                            if (selectedText !== '') {
                                this.delSelection();
                                if (isSuperscript) {
                                    this.insertNormal(selectedText);
                                } else {
                                    this.insertSuper(selectedText);
                                }
                            }
                        } else if (event.key === ']') {
                            event.stopImmediatePropagation();
                            this.delSelection();
                            if (isSubscript) {
                                this.insertNormal(selectedText);
                            } else {
                                this.insertSub(selectedText);
                            }
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
    insertSub(text) {
        this.textEditor.model.change(writer => {
            const insertPosition = this.textEditor.model.document.selection.getFirstPosition();
            const subscriptText = writer.createText(text, { subscript: true });
            writer.insert(subscriptText, insertPosition);
            const newRange = writer.createRange(
                insertPosition,
                insertPosition.getShiftedBy(text.length)
            );
            const newSelection = writer.createSelection(newRange);
            writer.setSelection(newSelection);
        });
    }
    insertSuper(text) {
        this.textEditor.model.change(writer => {
            const insertPosition = this.textEditor.model.document.selection.getFirstPosition();
            const subscriptText = writer.createText(text, { superscript: true });
            writer.insert(subscriptText, insertPosition);
            const newRange = writer.createRange(
                insertPosition,
                insertPosition.getShiftedBy(text.length)
            );
            const newSelection = writer.createSelection(newRange);
            writer.setSelection(newSelection);
        });
    }
    insertNormal(text) {
        this.textEditor.model.change(writer => {
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

    isSubSuperScript() {
        const selection = this.textEditor.model.document.selection;
        const attributes = Array.from(selection.getAttributes());
        const isSubscript = attributes.some(([key, value]) => key === 'subscript' && value === true);
        const isSuperscript = attributes.some(([key, value]) => key === 'superscript' && value === true);
        return {
            isSubscript,
            isSuperscript
        };
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

