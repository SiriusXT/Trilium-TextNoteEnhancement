

const heads = ['heading2', 'heading3', 'heading4', 'heading5', 'heading6'];

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
                    if (event.altKey &&  ['2','3','4','5','6'].includes(event.key)) {
                        event.stopImmediatePropagation(); // Prevent being monitored multiple times. This is a trilium bug. The reason has not yet been found.
                        const elName = this.getElName();
                        if (elName.startsWith('paragraph') || (elName.startsWith('head') && !elName.endsWith(event.key))){
                            this.changeCurrentBlockToParagraph();
                            this.changeCurrentBlockToHeading(`heading${event.key}`);
                        }
                        if (elName.startsWith('head') && elName.endsWith(event.key)){console.log(2)
                            this.changeCurrentBlockToParagraph();
                        }
                                        
                    }
                    if (event.altKey &&  ['1'].includes(event.key)) {
                        event.stopImmediatePropagation(); 
                        this.changeCurrentBlockToParagraph();                                        
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
     getElName() { //Get what level the title is
        const selection = this.textEditor.model.document.selection; 
        const position = selection.getFirstPosition(); 
        const parentElement = position.parent; 
        return parentElement.name;
    }
    changeCurrentBlockToHeading(headingType = 'heading2') {
        const model = this.textEditor.model;
    
        model.change(writer => {
            const selection = model.document.selection;
            const position = selection.getFirstPosition();
            const block = position.findAncestor('paragraph'); // find paragraph
    
            if (block) {
                writer.rename(block, headingType); // Rename paragraph tags to heading type
            }
        });
    }
    changeCurrentBlockToParagraph() {
        const model = this.textEditor.model;    
        model.change(writer => {
            const selection = model.document.selection;
            const position = selection.getFirstPosition();
            let block;
            for (let head of heads) {
                block = position.findAncestor(head);
                if (block) {
                    writer.rename(block, 'paragraph'); // Rename title tags to paragraphs
                    break;
                }
            }
        });
    }
    
    isFullParagraphSelected() {
        const selection = this.textEditor.model.document.selection;
        const range = selection.getFirstRange();
        if (!range) return false;
        const startParent = range.start.parent;
        const endParent = range.end.parent;
        if (startParent !== endParent) return false;
        return range.start.offset === 0 && range.end.offset === startParent.maxOffset;
    }
    
    inserMath(text) {
        this.textEditor.model.change(writer => {
            this.delSelection();
        const modelFragment = this.textEditor.data.processor.toView(
            `<h2>${text}</h2>`
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

