export class ClickableButton{

    constructor({
        parent,
        text = ' ',
        color = '#fff',
        callback,
        isEnable = true,
        style,
    } = {}) {
        this.parent = parent;
        this.text = text;
        this.color = color;
        this.callback = callback;
        this._generateHTML();
        this._styling();

        this.enable(isEnable);

        for (const key in style) {
            this.elem.style[key] = style[key];
        }
    }

    enable(isEnable) {
        if(!isEnable){
            this.elem.setAttribute("disabled", "true");
        } else {
            this.elem.removeAttribute("disabled");
        }
    }

    element() {
        return this.elem;
    }

    _generateHTML() {
        this.elem = document.createElement("button");
        this.elem.innerText = this.text;
        if(this.parent) this.parent.appendChild(this.elem);
        this.elem.addEventListener("click", (evt) => {
            evt.preventDefault();
            this.callback(evt);
        });
    }

    _styling() {
        this.elem.style.backgroundColor = this.color;
        this.elem.style.padding = '.5rem';
        this.elem.style.border = 'none';
        this.elem.style.borderRadius = '.5rem';
        this.elem.style.fontSize = "1rem !important";

        this.elem.addEventListener("mouseover", () => {
            this.elem.style.boxShadow = "0 0 1rem #FFF";
            this.elem.style.cursor = "pointer";
        });

        this.elem.addEventListener("mouseleave", () => {
            this.elem.style.boxShadow = "none";
            this.elem.style.cursor = "auto";
        })
    }

}