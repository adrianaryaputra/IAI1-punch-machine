export class Indicator{

    constructor({
        parent,
        text = '',
        colorFalse = '#f00',
        colorTrue = '#0f0',
        style,
    }) {
        this.text = text;
        this.elem = document.createElement("div");
        this.elem.textContent = this.text;
        
        for (const key in style) {
            this.elem.style[key] = style[key];
        }
        this.elem.style.boxShadow = 'inset 0 0 2rem 0 #000A'

        this.colorTrue = colorTrue;
        this.colorFalse = colorFalse;

        if(parent) parent.appendChild(this.elem);

        this.set(false);
    }

    set(value, content=undefined){
        if(value){
            this.elem.style.backgroundColor = this.colorTrue;
            if(content) this.elem.textContent = content;
        } else {
            this.elem.style.backgroundColor = this.colorFalse;
            if(content) this.elem.textContent = this.text;
        }
    }

}